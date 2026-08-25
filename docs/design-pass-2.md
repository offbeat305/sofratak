# Design Pass 2 — Sharper Site + Yelp-Grade Directory

**From Zizo. Follow literally, same as design-pass.md (which worked).**
Two complaints driving this: (1) the marketing site needs to feel sharper, more modern,
more tech, more motion; (2) the /eat listing pages "look ugly" — the benchmark is Yelp.
Open yelp.com's search results and a Yelp business page side-by-side with ours while
building. Ours must feel that dense, that scannable, that professional — but in the
Sofratak palette, never Yelp's gray/red.

All branding.md rules still apply (palette, fonts, no bounce, reduced-motion). This pass
is about density, polish, and motion — not new colors or new fonts.

---

## Part A — /eat directory: Yelp-grade

### A1. Metro page layout (the search results feel)
- **Desktop: split view.** Sticky map on the right (40%), scrollable result list left
  (60%) — the Yelp/Airbnb pattern. Hovering a card highlights its pin (brass pulse);
  clicking a pin scrolls to + flashes its card. Currently map and list are stacked —
  that's the #1 "ugly" driver.
- **Mobile:** list-first with a floating "Map" pill button that opens full-screen map
  with card carousel at the bottom (swipe cards ↔ pan map).
- **Dense result cards, Yelp-style rows** (not big soft cards): photo left (fixed
  120×120 rounded 12px), then name (Manrope 600), rating row (brass stars + count from
  live Google data), cuisine chips, "$$ · Open until 10 PM · 2.3 mi", one line of the
  Google editorial summary, truncated. Claimed rows get the brass "Order Now" button
  right-aligned + Verified checkmark by the name. Unclaimed rows get a quiet
  "Claim" text link. Row hover: background ivory-deepen + 2px brass left edge.
- **Numbered results** matching numbered map pins (1,2,3… olive circles, brass for
  claimed) — instant Yelp familiarity.
- **Sort control:** Recommended (claimed first, then rating) · Rating · Distance
  (needs geolocation permission prompt done tastefully) · A–Z.
- **Filter bar** becomes a sticky top row of pill chips + a "All filters" sheet on
  mobile. Active chips olive-filled.

### A2. Listing detail page (the Yelp business page feel)
Current page is a thin column — rebuild as a real profile page:
- **Hero strip:** full-width photo collage from the live gallery — big photo left, 2×2
  grid right (Yelp pattern), "See all photos" overlay button opening a lightbox.
  Name + cuisine + rating overlaid on a bottom gradient scrim (ivory text on olive
  scrim, not white-on-black).
- **Under hero, two-column:** main column = about/blurb (custom_blurb > Google
  editorial), amenities row (icons: open now, phone, directions), the halal info row
  (quiet, per earlier decision), hours accordion (today bolded, live), map thumbnail
  that opens directions.
  Sidebar (sticky) = the action card: for claimed → big brass **Order Now**, phone,
  directions; for unclaimed → "Own this restaurant?" claim card with the pitch line
  ("Get orders from this page — commission-free") + Claim button. This turns every
  detail page into a mini landing page for the claim funnel.
- **"More Arab restaurants nearby"** rail at the bottom: horizontal scroll of 6 nearby
  cards (same metro, closest first). Keeps people browsing like Yelp does.
- **Breadcrumb:** Eat › Miami & South Florida › Shishka Lebanese Grill (also good SEO).

### A3. Empty/degraded states
Cap-hit or missing photos must degrade to a designed state: olive-tinted placeholder
with a subtle arch motif + initial letter — never a broken image or gray box. This is
half of "ugly": raw fallbacks. Every fallback state gets designed on purpose.

## Part B — Site-wide "sharper, more tech" pass

- **Type discipline:** tighten letter-spacing on Manrope headings (-0.01em), bump
  contrast of secondary text stone→charcoal at small sizes. Sharper = crisper type,
  not new fonts.
- **Cards:** reduce radius 28→20px, tighten shadows (smaller, crisper, olive-tinted),
  add 1px inner border ivory-line. Softness reads dated; crisp reads tech.
- **Micro-interactions everywhere** (the "more motion" ask, all ≤250ms, all
  reduced-motion-gated): buttons scale 0.98 on press; chips spring-toggle; number
  count-ups on scroll (already exist — extend to directory stats); skeleton shimmer
  loaders for every async load (photos, enrichment, map pins) instead of pop-in;
  page-transition fade (150ms) between marketing pages.
- **New: live stats strip** on /eat landing and homepage: "588 restaurants · 3 states ·
  Tampa, South Florida, Dearborn" with count-up — real numbers from the DB, updates as
  directory grows. Tech-feel + proof in one element.
- **Map style:** current default Leaflet tiles read 2010. Use a clean, light,
  desaturated tile style (Carto Positron or equivalent free tier) with our olive/brass
  pins — this alone modernizes the whole /eat experience.
- **Grader + estimator:** give both the same skeleton-shimmer + odometer treatment so
  the whole product family feels like one modern system.
- **Homepage hero:** keep the calculator hero, but add a subtle animated gradient
  drift in the olive background (barely perceptible, 30s loop is allowed here as
  ambient, reduced-motion-gated) + the arch watermark parallax already speced.

## Definition of done
- [ ] /eat/miami split view: hover card ↔ pin highlight works both directions
- [ ] Result rows read as dense list, not fat cards; numbered pins match rows
- [ ] Detail page: photo collage + lightbox, sticky action card, nearby rail
- [ ] Every async element has a designed skeleton; every missing-photo state designed
- [ ] Map tiles swapped to light modern style
- [ ] Side-by-side screenshot: our metro page vs yelp.com search results — ours must
  look as professional and MORE premium (commit the screenshot like last time)
- [ ] 390px mobile + AR RTL verified on all of the above
