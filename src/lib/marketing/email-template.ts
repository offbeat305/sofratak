import "server-only";
import type { Restaurant } from "@/lib/db/types";

/**
 * Branded in the RESTAURANT's own colors/name, not Sofratak's — "your
 * name on it, not an app's" is the whole point. Plain, email-client-safe
 * table layout (no flexbox/grid — Outlook and Gmail both mangle those).
 */
export function renderCampaignEmail(
  restaurant: Restaurant,
  locale: "en" | "ar",
  bodyText: string,
): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const paragraphs = bodyText
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1f1f1f;">${escapeHtml(line)}</p>`)
    .join("");

  return `<!doctype html>
<html dir="${dir}">
  <body style="margin:0;padding:0;background:#f7f2e8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2e8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${restaurant.brand.primary};padding:28px 32px;" align="${dir === "rtl" ? "right" : "left"}">
                <span style="font-size:20px;font-weight:bold;color:#ffffff;">${escapeHtml(restaurant.name[locale])}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;" align="${dir === "rtl" ? "right" : "left"}">
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;" align="${dir === "rtl" ? "right" : "left"}">
                <span style="display:inline-block;background:${restaurant.brand.accent};color:#ffffff;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none;">
                  ${locale === "ar" ? "اطلب الآن" : "Order now"}
                </span>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#6b6b6b;">
            ${escapeHtml(restaurant.name[locale])} · ${locale === "ar" ? "مشغّل بواسطة سفرتك" : "Powered by Sofratak"}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
