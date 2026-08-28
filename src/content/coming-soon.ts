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
 */
export const COMING_SOON_COPY = {
  headline: "Something good is cooking.",
  sub: "Sofratak is almost here. The first restaurant platform built for Arab and halal restaurants. Commission-free ordering, real control.",
};
