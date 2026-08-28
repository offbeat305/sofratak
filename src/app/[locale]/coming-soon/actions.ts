"use server";

import { captureLead } from "@/lib/leads";
import { allowRequest } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimal email-only capture for the launch wall (docs/launch-coming-soon
 * -spec.md) — every other lead form on the site asks for name + phone,
 * but this page has one job (collect an email, don't lose the visitor),
 * so it skips submitLeadAction's stricter phone-required contract and
 * calls captureLead directly.
 */
export async function submitComingSoonEmail(input: {
  email: string;
  locale: "en" | "ar";
  /** honeypot — real users never fill this */
  website?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await allowRequest("coming-soon-signup", 5))) return { ok: false, error: "rate" };
  if (input.website) return { ok: true };

  const email = input.email.trim().slice(0, 160);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email" };

  await captureLead({
    kind: "coming_soon",
    name: email,
    phone: "",
    email,
    locale: input.locale === "ar" ? "ar" : "en",
  });
  return { ok: true };
}
