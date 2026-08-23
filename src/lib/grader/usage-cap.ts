import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Runaway-loop backstop for the Grader's paid Places API calls (Zizo: "a
 * hard daily cap so it can't run away"). Not a cost-accounting system —
 * the real financial backstop is a billing cap set in the Google Cloud
 * Console. This just refuses new calls past a sane per-day ceiling.
 */
const AUTOCOMPLETE_DAILY_CAP = Number(process.env.GRADER_AUTOCOMPLETE_DAILY_CAP ?? 2000);
const DETAILS_DAILY_CAP = Number(process.env.GRADER_DETAILS_DAILY_CAP ?? 200);

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tryConsume(column: "autocomplete_count" | "details_count", cap: number): Promise<boolean> {
  const supabase = client();
  if (!supabase) return true; // no DB configured (local dev) — don't block
  const { data, error } = await supabase.rpc("increment_grader_usage", {
    column_name: column,
    cap,
  });
  if (error) {
    console.error("[grader] usage cap check failed, failing open:", error.message);
    return true;
  }
  return Boolean(data);
}

/** true = under the cap, call is allowed. false = today's cap is hit. */
export function tryConsumeAutocomplete(): Promise<boolean> {
  return tryConsume("autocomplete_count", AUTOCOMPLETE_DAILY_CAP);
}

export function tryConsumeDetails(): Promise<boolean> {
  return tryConsume("details_count", DETAILS_DAILY_CAP);
}
