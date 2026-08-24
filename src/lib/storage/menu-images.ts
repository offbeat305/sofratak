import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Menu item photos (Supabase Storage, bucket `menu-images`, public read,
 * service-role writes only). One feature serves both sides: restaurant
 * owners upload from the dashboard menu editor, and Sofratak admins reach
 * the same editor via /admin impersonation.
 *
 * Bucket-level guards (4MB, image/jpeg|png|webp) are configured on the
 * bucket itself; the checks here fail fast with friendly errors instead
 * of a storage 400.
 */

const BUCKET = "menu-images";
const MAX_BYTES = 4 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadMenuImage(
  restaurantId: string,
  file: File,
): Promise<UploadResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: "Photo uploads require the Supabase backend" };

  const ext = EXT_BY_MIME[file.type];
  if (!ext) return { ok: false, error: "Use a JPEG, PNG, or WebP image" };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be under 4MB" };
  if (file.size === 0) return { ok: false, error: "That file is empty" };

  const client = createClient(url, key, { auth: { persistSession: false } });
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "31536000", // content-addressed by uuid — cache hard
    });
  if (error) {
    console.error("[menu-images] upload failed:", error.message);
    return { ok: false, error: "Upload failed — try again" };
  }

  return { ok: true, url: client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}
