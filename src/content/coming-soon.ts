/**
 * /coming-soon copy (docs/launch-coming-soon-spec.md). English only by
 * design: Zizo has not reviewed an Arabic version of this headline/sub
 * yet, and this page is the one place on the whole site a visitor can
 * land with zero other context, so nothing goes out unreviewed here —
 * same standing rule as src/content/founder-story.ts. Every OTHER string
 * on the page (email form, footer) comes from the normal en/ar message
 * files, already reviewed and shipped elsewhere on the site.
 *
 * When Zizo approves Arabic copy: replace this with an { en, ar } shape
 * and read the current locale in the page, the same way founder-story.ts
 * is gated today.
 *
 * No contact/WhatsApp link on this page on purpose (Zizo: keep it to just
 * the email capture) — the "notify me" form is the only ask.
 */
export const COMING_SOON_COPY = {
  headline: "A new era is coming for Arab restaurants.",
  // Deliberately vague — Zizo doesn't want to say what this is yet.
  sub: "We're not ready to share the details. Be the first to know when we do.",
  // "Sofratak LLC" is a placeholder for the real entity name — swap when
  // that's finalized. Not the sitewide footer.rights string on purpose:
  // that one still correctly says Offbeat Creative LLC everywhere else.
  copyright: "© {year} Sofratak LLC. All rights reserved.",
};
