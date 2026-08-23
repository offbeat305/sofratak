import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { GraderResult } from "./types";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Keyed by place_id, independent of leads — a repeat or anonymous scan of
 * the same restaurant never re-pays for Places/PageSpeed calls, even if
 * the visitor never unlocks the report with their email.
 */
export async function getCachedResult(placeId: string): Promise<GraderResult | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("grader_cache")
    .select("restaurant_name, scan, score, created_at")
    .eq("place_id", placeId)
    .maybeSingle();
  if (!data) return null;
  if (Date.now() - new Date(data.created_at).getTime() > TTL_MS) return null;
  return {
    placeId,
    restaurantName: data.restaurant_name,
    signals: data.scan,
    score: data.score,
  };
}

export async function setCachedResult(result: GraderResult): Promise<void> {
  const supabase = client();
  if (!supabase) return;
  const { error } = await supabase.from("grader_cache").upsert({
    place_id: result.placeId,
    restaurant_name: result.restaurantName,
    scan: result.signals,
    score: result.score,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[grader] cache write failed", error.message);
}
