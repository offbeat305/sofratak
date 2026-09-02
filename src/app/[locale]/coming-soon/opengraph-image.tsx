import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// The alt rides into og:image:alt on shares — vague headline ONLY. The
// sitewide OG image's alt leaks what the product is, against the
// keep-it-mysterious call for this page (Cowork review, Sep 2026).
export const alt = "A new era is coming for Arab restaurants.";

/**
 * Dedicated link preview for the coming-soon wall: same typographic
 * style as the stories OG cards (olive, ivory, brass rule), carrying
 * nothing but the vague headline. No product description anywhere.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F2E8",
          gap: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#A9792B",
            fontWeight: 700,
            letterSpacing: 6,
          }}
        >
          SOFRATAK
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            lineHeight: 1.2,
            color: "#2F4A3C",
            fontWeight: 700,
            maxWidth: 980,
            textAlign: "center",
            fontFamily: "serif",
          }}
        >
          A new era is coming for Arab restaurants.
        </div>
        <div style={{ display: "flex", width: 120, height: 8, background: "#A9792B", borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}
