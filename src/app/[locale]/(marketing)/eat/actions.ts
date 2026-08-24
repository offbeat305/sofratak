"use server";

import { captureLead } from "@/lib/leads";
import { allowRequest } from "@/lib/rate-limit";

const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ClaimInput = {
  listingId: string;
  listingName: string;
  city: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  /** true when submitted via the takedown link — same-day handling promise */
  takedown: boolean;
  locale: "en" | "ar";
  /** honeypot — real users never fill this */
  website?: string;
};

/**
 * "Claim this restaurant" — the directory's sales funnel
 * (docs/directory-spec.md). A claim is a lead Zizo closes personally;
 * there is deliberately NO self-serve claiming in v1. Takedowns ride the
 * same pipe with a flag and get same-day manual handling (legal
 * guardrail #3).
 */
export async function submitClaimAction(
  input: ClaimInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await allowRequest("directory-claim", 5))) {
    return { ok: false, error: "rate" };
  }
  if (input.website) return { ok: true }; // honeypot — pretend success

  const name = input.name.trim().slice(0, 80);
  const phone = input.phone.trim();
  const email = input.email.trim().slice(0, 120);
  if (!name) return { ok: false, error: "name" };
  if (!PHONE_RE.test(phone)) return { ok: false, error: "phone" };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "email" };

  await captureLead({
    kind: "claim",
    name,
    phone,
    email: email || null,
    restaurant: input.listingName.trim().slice(0, 120) || null,
    city: input.city.trim().slice(0, 80) || null,
    message: input.role.trim().slice(0, 120) || null,
    data: {
      listingId: input.listingId,
      takedown: input.takedown,
    },
    locale: input.locale === "ar" ? "ar" : "en",
  });
  return { ok: true };
}
