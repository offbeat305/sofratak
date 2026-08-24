import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Restaurant image uploads (Supabase Storage, public read, service-role
 * writes only). Two buckets, same rules: `menu-images` for item photos,
 * `restaurant-images` for the storefront banner. One feature serves both
 * sides: owners upload from the dashboard, Sofratak admins reach the
 * same UI via /admin impersonation.
 *
 * Bucket-level guards (4MB, image/jpeg|png|webp) are configured on the
 * buckets themselves; the checks here fail fast with friendly errors
 * instead of a storage 400.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

async function uploadImage(
  bucket: "menu-images" | "restaurant-images",
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
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "31536000", // content-addressed by uuid — cache hard
    });
  if (error) {
    console.error(`[${bucket}] upload failed:`, error.message);
    return { ok: false, error: "Upload failed — try again" };
  }

  return { ok: true, url: client.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}

export function uploadMenuImage(restaurantId: string, file: File): Promise<UploadResult> {
  return uploadImage("menu-images", restaurantId, file);
}

export function uploadCoverImage(restaurantId: string, file: File): Promise<UploadResult> {
  return uploadImage("restaurant-images", restaurantId, file);
}
