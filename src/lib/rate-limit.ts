import "server-only";
import { headers } from "next/headers";

/**
 * Phase 8A: in-memory sliding-window rate limiter for the public,
 * unauthenticated endpoints (grader, leads, checkout, loyalty lookup).
 *
 * LIMITATION (documented in docs/LAUNCH.md): state is per server
 * instance. On Vercel, concurrent lambdas each keep their own window,
 * so the effective global limit is (limit × warm instances). That still
 * stops single-source hammering — the launch threat model — but a
 * Redis/Upstash-backed limiter is the planned post-launch upgrade.
 */

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();
const MAX_KEYS = 10_000;

function clientIp(h: Headers): string {
  // Vercel/most proxies: first entry of x-forwarded-for is the client.
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * true = allowed. false = over the limit for this (route, caller-IP)
 * pair within the window. Callers return a friendly "slow down" error.
 */
export async function allowRequest(
  route: string,
  limit: number,
  windowMs = 60_000,
): Promise<boolean> {
  const ip = clientIp(await headers());
  const key = `${route}:${ip}`;
  const now = Date.now();

  // Opportunistic prune so an attacker rotating IPs can't grow the map
  // without bound; wiping the oldest windows only ever relaxes limits.
  if (windows.size > MAX_KEYS) {
    for (const [k, w] of windows) {
      if (w.resetAt < now) windows.delete(k);
    }
    if (windows.size > MAX_KEYS) windows.clear();
  }

  const window = windows.get(key);
  if (!window || window.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  window.count++;
  return window.count <= limit;
}
