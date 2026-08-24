# Sofratak Directory — Web App Spec (v1)

**Approved by Zizo, Aug 2026. Build now.** This is step 3 of `docs/marketplace-vision.md`
pulled forward: the consumer-facing directory ships as part of the marketing site, and later
becomes the native app (same screens, app-store shell). Target: usable within the 2-week
launch window. Launch runbook (`docs/LAUNCH.md`) still completes in parallel — if anything
conflicts, launch wins.

Everything follows `docs/branding.md` (palette, type, motion, RTL) and the legal guardrails
in `docs/marketplace-vision.md`. Nothing here touches pricing, fees, or checkout.

## What it is

"Find Arab & halal food near you." Every Arab/Middle Eastern/halal restaurant in our target
cities listed — Sofratak clients get a live **Order Now** experience, everyone else gets a
factual listing with a **Claim this restaurant** funnel into our `leads` table.

## Routes (marketing site, EN + AR true RTL)

- `/eat` — landing: city picker + search ("Find Arab food near you")
- `/eat/[city]` — the main screen: list + map for one metro (tampa, dearborn, …)
- `/eat/[city]/[listing-slug]` — listing detail page
- Claimed restaurants' "Order Now" links straight to their existing storefront subdomain —
  no new checkout, no new order path.

## Look & feel — "Uber clean, Sofratak warm"

Modern consumer-app design: full-bleed map, floating search bar, card list, bottom-sheet
feel on mobile. But OUR identity per branding.md — olive/ivory/sand/brass, Cormorant for
page headline only, Manrope UI. No Uber grayscale clone; think premium hospitality app.

- **Map:** clean light style, olive pins. Verified (Sofratak) pins = brass, larger, with
  logo dot. Unclaimed pins = small olive outline. (Map lib: whatever fits free tier —
  Mapbox GL or Leaflet+OSM; Google Maps JS only if simplest under its free tier.)
- **List cards:** photo (claimed only), name, cuisine tags, halal badge per rules below,
  distance, "Open now", and either brass **Order Now** button (claimed) or subtle
  "Claim this restaurant →" text link (unclaimed). Unclaimed cards are deliberately
  plainer — no photo, muted — the glow-up IS the sales pitch, but never fake/implied
  affiliation.
- Mobile-first: map collapses to a toggle, list is the default. <2s LCP target.

## Search & filters

Text search (name), cuisine filter chips (Lebanese, Palestinian, Yemeni, Iraqi, Egyptian,
Syrian, Mediterranean, …), "Halal" filter, "Open now", "Order online" (Sofratak-only)
toggle. Client-side over the city's dataset is fine at this scale.

## Data model (migration 0010)

`directory_listings`: id, city slug, name, slug, address, lat/lng, phone, hours jsonb,
cuisines text[], halal_status ('verified' | 'reported' | 'unknown'), google_place_id
(store the ID only — no prohibited Places caching), claimed_restaurant_id (nullable FK →
restaurants), source ('seed' | 'places' | 'manual'), created/updated timestamps.
RLS: public read (this table is deliberately public data); writes service-role only.

- A row with claimed_restaurant_id → renders as Verified: storefront branding, photo,
  live open/closed from their real hours, Order Now.
- Seeding: import the Tampa Bay + Dearborn/Detroit lead spreadsheets (~80 restaurants,
  already in the repo/docs) as 'seed' rows; enrich lat/lng via one-time geocoding. Places
  API enrichment must reuse the Grader's daily-cap machinery.

## Halal labeling (hard rule from marketplace-vision.md)

- Claimed + owner-confirmed → "Halal ✓" (verified)
- Unclaimed with a credible source → "Reported halal"
- Otherwise → no halal badge at all. Never guess. Community trust is the brand.

## Claim flow (the sales funnel)

"Claim this restaurant" → short form: name, role at restaurant, phone, email (honeypot,
rate-limited like other public forms) → writes to `leads` with kind 'claim' (widen the
check constraint in 0010) + fires the standard email notification. Confirmation copy:
"We'll text you within a day." NO self-serve claiming/editing in v1 — a claim is a sales
lead, Zizo closes it.

## Takedown

Footer link on every listing page: "Own this restaurant and want changes or removal?" →
same claim form with a 'takedown' flag. Manual same-day handling per legal guardrails.

## SEO

Each city page + listing page: static generation, LocalBusiness JSON-LD, per-page
meta/OG, added to sitemap. `/eat/tampa` should aim to rank for "arab restaurants tampa" /
"halal restaurants tampa" — this is a Zay-OS-style SEO asset as much as a product.

## Copy rules

Branding.md voice. On unclaimed listings, required disclaimer (small, footer of detail
page): "This listing was created from publicly available information and is not affiliated
with or endorsed by the restaurant." Banned words list applies. EN/AR everything; Arabic
strings go into Zizo's pending review batch — the directory can launch EN-first if Arabic
review isn't done.

## Definition of done (v1)

- [ ] /eat live for Tampa + Dearborn/Detroit with the ~80 seeded listings, map + list + filters
- [ ] Beit Zizo (demo) renders as a Verified listing with working Order Now → storefront
- [ ] Claim form → leads row + email, honeypot + rate limit verified
- [ ] Halal badges follow the three-state rule; unclaimed disclaimer present
- [ ] JSON-LD passes Rich Results test; pages in sitemap
- [ ] Mobile-first verified at 390px; branding.md design check passes
- [ ] No Places API caching violations; enrichment goes through the daily-cap counter

## Explicitly NOT in v1

Native apps, diner accounts, cross-restaurant loyalty, reviews/ratings, photos on unclaimed
listings, self-serve listing editing, delivery dispatch (DoorDash Drive/Uber Direct is a
separate post-launch integration — just don't block it architecturally).
