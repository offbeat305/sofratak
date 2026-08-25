import { NextResponse, type NextRequest } from "next/server";
import { allowRequest } from "@/lib/rate-limit";

const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

/**
 * Streams a Google Places photo for live display on unclaimed listing
 * pages. Exists so the API key never reaches the browser and so photos
 * are rendered with a plain <img> (next/image's optimizer would persist
 * a copy on our server — a Places caching violation; this proxy streams
 * and stores nothing; browser-side HTTP caching is normal live display).
 */
export async function GET(request: NextRequest) {
  // 150/min: collage (5) + visible result rows + nearby rail all stream
  // through here now — one engaged user legitimately pulls dozens/min
  if (!(await allowRequest("eat-photo", 150))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: "not configured" }, { status: 501 });

  const name = request.nextUrl.searchParams.get("name") ?? "";
  if (!PHOTO_NAME_RE.test(name)) {
    return NextResponse.json({ error: "bad photo name" }, { status: 400 });
  }

  const upstream = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&key=${key}`,
    { cache: "no-store" },
  );
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // browser may cache briefly (normal live display); our server stores nothing
      "Cache-Control": "private, max-age=3600",
    },
  });
}
