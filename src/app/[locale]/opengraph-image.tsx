import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sofratak. Commission-free ordering for restaurants";

/** Branded link preview — most shares happen in WhatsApp groups. */
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
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2F4A3C",
          padding: 72,
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#D8C19A",
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          Sofratak · سفرتك
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: ar ? 64 : 68,
              color: "#F7F2E8",
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            {ar
              ? "التطبيقات تأخذ 15–30% من كل طلب. خلّيها لك."
              : "The apps take 15–30% of every order. Keep it instead."}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#C9A25E" }}>
            {ar
              ? "موقع طلبات باسمك · صفر عمولة · عربي وإنجليزي"
              : "Your own ordering site · 0% commission · English & Arabic"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid rgba(247,242,232,0.25)",
            paddingTop: 28,
            fontSize: 26,
            color: "rgba(247,242,232,0.75)",
          }}
        >
          <div style={{ display: "flex" }}>www.sofratak.com</div>
          <div style={{ display: "flex", color: "#D8C19A" }}>
            {ar ? "شغلك تحت سيطرتك" : "Take Control. Own Your Growth."}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
