"use server";

import { captureLead } from "@/lib/leads";
import { autocompleteRestaurant } from "@/lib/grader/places";
import { runGrade } from "@/lib/grader/run";
import type { PlacePrediction } from "@/lib/grader/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function autocompleteGraderAction(
  query: string,
  sessionToken: string,
  locale: string,
): Promise<{ ok: true; predictions: PlacePrediction[] } | { ok: false; error: string }> {
  const input = query.trim().slice(0, 120);
  if (input.length < 3) return { ok: true, predictions: [] };
  const result = await autocompleteRestaurant(input, sessionToken, locale === "ar" ? "ar" : "en");
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, predictions: result.predictions };
}

export async function runGraderAction(placeId: string, sessionToken: string) {
  return runGrade(placeId, sessionToken);
}

export type UnlockGraderInput = {
  placeId: string;
  restaurantName: string;
  email: string;
  locale: "en" | "ar";
  score: {
    overall: number;
    grade: string;
    categories: Array<{ key: string; score: number; findings: string[] }>;
    estimatedMonthlyImpactLowCents: number;
    estimatedMonthlyImpactHighCents: number;
  };
  /** honeypot — real users never fill this */
  website?: string;
};

export async function unlockGraderReportAction(
  input: UnlockGraderInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.website) return { ok: true }; // honeypot — pretend success

  const email = input.email.trim().slice(0, 120);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email" };

  await captureLead({
    kind: "grader",
    name: "",
    phone: "",
    email,
    restaurant: input.restaurantName.trim().slice(0, 120) || null,
    data: {
      placeId: input.placeId,
      score: input.score,
    },
    locale: input.locale,
  });
  return { ok: true };
}
