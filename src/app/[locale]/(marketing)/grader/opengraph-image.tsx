import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sofratak Restaurant Grader";

/**
 * Grader link preview (design-pass-4 §4): typographic score-card look —
 * a ring + grade motif, no photos (no-scraping rule stays airtight).
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#2F4A3C",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#D8C19A", fontWeight: 700, letterSpacing: 3 }}>
            {ar ? "مقيّم المطاعم المجاني" : "FREE RESTAURANT GRADER"}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 60,
              lineHeight: 1.12,
              color: "#F7F2E8",
              fontWeight: 700,
            }}
          >
            {ar ? "هل يخسر مطعمك طلبات على الإنترنت؟" : "Is your restaurant losing orders online?"}
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 30, color: "#d9a94e", fontWeight: 700 }}>
            {ar ? "اكتشف خلال ٦٠ ثانية، sofratak.com/grader" : "Find out in 60 seconds, sofratak.com/grader"}
          </div>
        </div>

        {/* score ring motif */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 280,
            height: 280,
            borderRadius: 999,
            border: "16px solid rgba(247,242,232,0.15)",
            borderTopColor: "#A9792B",
            borderRightColor: "#A9792B",
            transform: "rotate(-45deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              transform: "rotate(45deg)",
              fontSize: 130,
              fontWeight: 700,
              color: "#F7F2E8",
            }}
          >
            A
          </div>
        </div>
      </div>
    ),
    size,
  );
}
