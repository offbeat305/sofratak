import { ImageResponse } from "next/og";
import { getStory } from "@/lib/stories";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sofratak Stories";

/**
 * Per-article link preview (WhatsApp-first, same as the site-wide one).
 * Purely typographic — no photos needed, so the no-scraping rule can't
 * be violated by an OG card.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStory(slug);
  const title = story?.title ?? "Sofratak Stories";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2F4A3C",
          padding: 72,
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#D8C19A", fontWeight: 700, letterSpacing: 3 }}>
          SOFRATAK · STORIES
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 54 : 66,
            lineHeight: 1.15,
            color: "#F7F2E8",
            fontWeight: 700,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(247,242,232,0.7)" }}>
            sofratak.com/stories
          </div>
          <div style={{ display: "flex", width: 120, height: 10, background: "#A9792B", borderRadius: 5 }} />
        </div>
      </div>
    ),
    size,
  );
}
