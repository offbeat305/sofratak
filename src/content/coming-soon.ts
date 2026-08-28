/**
 * /coming-soon copy (docs/launch-coming-soon-spec.md). EN/AR, approved by
 * Zizo (Aug 2026) — previously English-only pending his review (see git
 * history), now translated and locale-gated in the page like every other
 * bilingual content object. Every OTHER string on the page (email form,
 * footer) already came from the normal en/ar message files.
 *
 * No contact/WhatsApp link on this page on purpose (Zizo: keep it to just
 * the email capture) — the "notify me" form is the only ask.
 */
export const COMING_SOON_COPY = {
  en: {
    headline: "A new era is coming for Arab restaurants.",
    // Deliberately vague — Zizo doesn't want to say what this is yet.
    sub: "Be the first to know.",
    // "Sofratak LLC" is a placeholder for the real entity name — swap when
    // that's finalized. Not the sitewide footer.rights string on purpose:
    // that one still correctly says Offbeat Creative LLC everywhere else.
    copyright: "© {year} Sofratak LLC. All rights reserved.",
  },
  ar: {
    headline: "عصر جديد قادم للمطاعم العربية.",
    sub: "كن أول من يعرف.",
    // Legal entity name kept in Latin script, matching footer.rights'
    // "Offbeat Creative LLC" precedent (src/messages/ar.json).
    copyright: "© {year} Sofratak LLC. جميع الحقوق محفوظة.",
  },
} as const;
