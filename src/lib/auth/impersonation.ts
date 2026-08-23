import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed, stateless "log in as this restaurant" tokens for internal
 * support (Phase 7 admin). No IMPERSONATION_SECRET configured = the
 * feature is off (verify always fails) rather than falling back to an
 * unsigned/insecure mode.
 */
export const IMPERSONATION_COOKIE = "sofratak_impersonate";
const TTL_MS = 30 * 60 * 1000;

export type ImpersonationPayload = {
  restaurantId: string;
  adminUserId: string;
  adminEmail: string;
  exp: number;
};

function secret(): string | null {
  return process.env.IMPERSONATION_SECRET || null;
}

function sign(body: string, key: string): string {
  return createHmac("sha256", key).update(body).digest("base64url");
}

export function createImpersonationToken(
  payload: Omit<ImpersonationPayload, "exp">,
): string | null {
  const key = secret();
  if (!key) return null;
  const full: ImpersonationPayload = { ...payload, exp: Date.now() + TTL_MS };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

export function verifyImpersonationToken(token: string): ImpersonationPayload | null {
  const key = secret();
  if (!key) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, key);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ImpersonationPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
