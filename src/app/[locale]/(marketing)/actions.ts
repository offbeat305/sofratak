"use server";

import { captureLead, type LeadInput } from "@/lib/leads";

const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

export type LeadFormInput = {
  kind: "demo" | "estimate";
  name: string;
  phone: string;
  email?: string;
  restaurant?: string;
  city?: string;
  message?: string;
  data?: Record<string, unknown>;
  locale: "en" | "ar";
  /** honeypot — real users never fill this */
  website?: string;
};

export async function submitLeadAction(
  input: LeadFormInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Honeypot: pretend success so bots don't adapt.
  if (input.website) return { ok: true };

  const name = input.name.trim().slice(0, 80);
  const phone = input.phone.trim();
  if (!name) return { ok: false, error: "name" };
  if (!PHONE_RE.test(phone)) return { ok: false, error: "phone" };

  const lead: LeadInput = {
    kind: input.kind,
    name,
    phone,
    email: input.email?.trim().slice(0, 120) || null,
    restaurant: input.restaurant?.trim().slice(0, 120) || null,
    city: input.city?.trim().slice(0, 80) || null,
    message: input.message?.trim().slice(0, 500) || null,
    data: input.data ?? {},
    locale: input.locale === "ar" ? "ar" : "en",
  };
  await captureLead(lead);
  return { ok: true };
}
