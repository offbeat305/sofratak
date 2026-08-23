"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/db/store";
import { getMembership } from "@/lib/auth/server";
import { sendCampaign } from "@/lib/marketing/campaigns";
import type {
  CampaignChannel,
  CampaignSegment,
  NewOfferCodeInput,
  OfferCodeType,
  Restaurant,
} from "@/lib/db/types";

const UNAUTHORIZED = { ok: false as const, error: "Unauthorized" };

export async function createAndSendCampaignAction(
  slug: string,
  locale: "en" | "ar",
  input: { channel: CampaignChannel; segment: CampaignSegment; subject: string; body: string },
) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  const body = input.body.trim().slice(0, 1600);
  if (!body) return { ok: false as const, error: "Write a message first" };

  const store = getStore();
  const campaign = await store.createCampaign(membership.restaurant.id, {
    channel: input.channel,
    segment: input.segment,
    subject: input.channel === "email" ? input.subject.trim().slice(0, 150) || null : null,
    body,
  });
  const result = await sendCampaign(membership.restaurant, campaign, locale);
  revalidatePath(`/[locale]/dashboard/${slug}/marketing`, "page");
  if (!result.ok) return { ok: false as const, error: result.error };
  return result;
}

export async function createOfferCodeAction(slug: string, input: NewOfferCodeInput) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;

  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 3 || code.length > 20)
    return { ok: false as const, error: "Code must be 3-20 letters/numbers" };
  const type: OfferCodeType = input.type === "flat" ? "flat" : "percent";
  const value = Math.round(input.value);
  if (!Number.isFinite(value) || value <= 0) return { ok: false as const, error: "Enter a valid value" };
  if (type === "percent" && value > 100) return { ok: false as const, error: "Percent can't exceed 100" };
  const maxUses =
    input.maxUses !== null && Number.isInteger(input.maxUses) && input.maxUses > 0 ? input.maxUses : null;

  try {
    await getStore().createOfferCode(membership.restaurant.id, {
      code,
      type,
      value,
      maxUses,
      expiresAt: input.expiresAt,
    });
  } catch {
    return { ok: false as const, error: "That code already exists" };
  }
  revalidatePath(`/[locale]/dashboard/${slug}/marketing`, "page");
  return { ok: true as const };
}

export async function setOfferCodeActiveAction(slug: string, id: string, active: boolean) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  await getStore().setOfferCodeActive(membership.restaurant.id, id, active);
  revalidatePath(`/[locale]/dashboard/${slug}/marketing`, "page");
  return { ok: true as const };
}

export async function saveLoyaltySettingsAction(
  slug: string,
  settings: Restaurant["loyaltySettings"],
) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  // Punch-card model: rewards are "after N orders, worth $X off".
  const rewards = settings.rewards.filter(
    (r) =>
      r.name.en.trim() &&
      Number.isInteger(r.pointsCost) &&
      r.pointsCost >= 1 &&
      r.pointsCost <= 100 &&
      Number.isInteger(r.valueCents) &&
      r.valueCents >= 1 &&
      r.valueCents <= 50_000,
  );
  await getStore().setLoyaltySettings(membership.restaurant.id, {
    ...settings,
    rewards: rewards.map((r) => ({
      ...r,
      name: {
        en: r.name.en.trim().slice(0, 80),
        ar: (r.name.ar || r.name.en).trim().slice(0, 80),
      },
    })),
  });
  revalidatePath(`/[locale]/dashboard/${slug}/marketing`, "page");
  return { ok: true as const };
}

export async function saveAutomationSettingsAction(
  slug: string,
  settings: Restaurant["automations"],
) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  await getStore().setAutomationSettings(membership.restaurant.id, settings);
  revalidatePath(`/[locale]/dashboard/${slug}/marketing`, "page");
  return { ok: true as const };
}
