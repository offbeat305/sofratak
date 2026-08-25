import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Concierge-request media (docs/concierge-requests-spec.md §5): voice
 * notes + photos in the PRIVATE `request-media` bucket — no public
 * read. We store the storage path (not a URL) on the request row and
 * mint short-lived signed URLs whenever the dashboard or admin queue
 * needs to play/show a file. Service-role writes only, same as the
 * image buckets.
 */

const BUCKET = "request-media";
const MAX_BYTES = 4 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type RequestMediaResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadRequestMedia(
  restaurantId: string,
  file: File,
  kind: "voice" | "photo",
): Promise<RequestMediaResult> {
  const supabase = client();
  if (!supabase) return { ok: false, error: "Uploads require the Supabase backend" };

  const mimeOk =
    kind === "voice" ? file.type.startsWith("audio/") : file.type.startsWith("image/");
  const ext = EXT_BY_MIME[file.type];
  if (!mimeOk || !ext) return { ok: false, error: "Unsupported file type" };
  if (file.size > MAX_BYTES) return { ok: false, error: "File must be under 4MB" };
  if (file.size === 0) return { ok: false, error: "That file is empty" };

  const path = `${restaurantId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) {
    console.error("[request-media] upload failed:", error.message);
    return { ok: false, error: "Upload failed — try again" };
  }
  return { ok: true, path };
}

/** 1-hour signed URL for playback/preview; null when unavailable. */
export async function signedRequestMediaUrl(path: string): Promise<string | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) {
    console.error("[request-media] sign failed:", error.message);
    return null;
  }
  return data.signedUrl;
}
