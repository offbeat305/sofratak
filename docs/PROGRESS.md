# Sofratak — Progress Log

## 2026-08-25 (cont.) — FINAL data drop: 4-county PDF rebuild seeded

CSV fully rebuilt from Zizo's verified county PDFs (426 rows after my
dedupe trims: dearborn 173, miami 164, tampa 89 in-file). All seeded,
0 skipped. Final DB:

**588 listings — dearborn 270 (247 pub), miami 206 (182 pub),
tampa 112 (101 pub); 58 in review queue; 529 pinned (90%);
585/588 place IDs.**

- **Geocoder**: Nominatim lacks ~13 real FL/MI addresses entirely —
  resolved 12 via the **US Census geocoder** (public-domain, no ToS
  issues) and pinned coords in DB + CSV. Still pinless: HaddaBurger
  (8932 Bertha Palmer Blvd — Census misses it too) + ~46 legacy
  area-level rows (tampa-heavy: 69% pin rate vs 92/99%).
- **Removals**: naya-grill (virtual brand), al-najim (closed), tazza
  (Turkish/out of scope), abu-naji (closed) deleted; mezza-mediterranean
  + beirut-bakery-Livonia (out of metro) + paradise-biryani-pone
  (Indian) unpublished. Are Pitas / Byte Burgers / Golden Bakery /
  Shish Palace / Shahrazad / Al Sultan Kunafa / Sajouna: never in DB.
- **Dupe pass** (14 merges, curated PDF naming wins, osm_id transferred
  so re-imports stay deduped): azal-cofee, al-shallal, kabab-arbeel,
  al-basha-grill-kebab, orion (queue), dana→darna (typo variant,
  queue), manaeesh-cafe (old tenant at Tarboush's Ford Rd address),
  tarboush (queue), sahara-and-grill (queue), al-natour (queue),
  taula (queue), bayti-cafe, halal-guys→davie, plus legacy
  sheeba-restaurant-dearborn → sheeba-east-dearborn. Kept as distinct:
  leos-coney-island (Allen Park = 3rd location), dearborn-pizza vs
  pizza-kitchen (different addresses), pita-pockets-kb (Key Biscayne).
- **Publish sweep**: curated rows that upserted onto old queue rows
  were stuck unpublished — published rosenheim, pita-fresh (miami),
  amar-mediterranean-kitchen-bar. (fava-n-spice stays unpublished on
  purpose — watchlist.)
- Slug fix pre-seed: legacy "Al Ameer (Dearborn Heights)" row collided
  with the new Ford Rd row — legacy line dropped.
- **Unmatched place IDs (3)**: the-moroccan-joint (no street address),
  moroccos-tacos, alnawras (empty address).
- Backfill: 172 matched this run.

## 2026-08-25 — Directory product decisions 1–7 (Zizo's list)

**⚠️ APPLY MIGRATION 0012** (`0012_directory_blurbs.sql` — custom_blurb
columns). Until applied, listing pages just skip blurbs, but saving a
description from the dashboard errors.

1. **Two-section metro pages**: claimed on top under "Order now",
   everything else under "More Arab restaurants nearby" + claim-nudge
   sub-line. Search/filters span both. Verified live on /eat/tampa.
2. **Halal de-badged**: cards carry no halal chip; detail pages show a
   quiet "Halal: reported" / "Halal: confirmed by owner" row (omitted
   when unknown). Three-state data + filter chip unchanged. Added
   `american` cuisine key (label "American", AR "أمريكي" — NOT
   "American Halal", per Zizo) — the corrected CSV uses it.
3. **Photos on all cards**: unclaimed cards lazy-load one live Places
   photo via IntersectionObserver (only when scrolled into view),
   tiny "Google" attribution overlay, plain <img> through the proxy.
   Cap hit / no photo → card stays plain (zero-size sentinel, NOT
   display:none — hidden elements never intersect). eat-enrich rate
   limit 30→120/min (cards share it; the Places daily cap is the real
   spend guard). Verified live on Abu Naji's card.
4. **Detail gallery**: 5 photos (was 3), snap-x swipeable. Verified.
5. **Descriptions, three layers**: (a) Google `editorialSummary`
   rendered live (verified on Beirut Doral: "Strip-mall restaurant
   serving shawarma…"); (b) `custom_blurb`/`custom_blurb_ar` columns
   (migration 0012) override it when set; (c) claimed owners edit
   theirs from dashboard Settings → "Directory description" (writes to
   their claimed listing row via `saveDirectoryBlurbAction`).
6. **Cleanups**: deleted `shahs-of-kabob` (Persian, out of scope —
   also dropped from CSV) and `kirchenwirt` (OSM noise); unpublished
   `fava-n-spice` (address conflicts with ICON at 241 NW 24th St per
   the verified-PDF watchlist — Zizo calls before republishing; seed
   reruns won't republish it, the upsert never touches `published`).
   Queue-review rule of thumb for Zizo: reject Persian/Turkish/
   Indian/Pakistani — scope is Arab + general halal concepts.
7. **Seed rerun + backfill**: geocoder now strips unit/suite suffixes
   (Nominatim fails on "Unit 15"/"#25"/"Ste R125"). ⚠️ The CSV grew
   75→164 miami rows BETWEEN reruns — the other session was editing
   it live (one-session rule, again). Final DB state:
   **434 listings — tampa 71 (58 pub), dearborn 149 (127 pub),
   miami 214 (185 pub); 64 in review queue; 346 pinned (80%);
   431/434 have place IDs** (unmatched: the-moroccan-joint + 2
   empty-address OSM dearborn rows). ~14 geocode failures left,
   mostly "State Rd" style addresses Nominatim can't parse.

## 2026-08-24 (cont. 2) — Miami-Dade batch: 49 seed rows + moroccan cuisine

Zizo's 5-note batch, all verified live:

- **Seed rerun**: 49 miami CSV rows → 102 miami listings (49 seed +
  53 OSM; 74 published, 28 still in the review queue). 31 new rows,
  4 of which merged OVER existing OSM rows on slug collision (The
  Wrapper Miami, Kabobji, Takesh Grill, Pita Fresh) — curated data
  wins, `osm_id` preserved. No duplicates of the earlier batch (Amal,
  Mint Beirut, Lira House, Sahara Grill, Shawarma Al Basha — one row
  each). Both Shawarmaz rows distinct: `shawarmaz-dolphin-mall` +
  `shawarmaz-mediterranean-restaurant-grill`.
- **moroccan cuisine key** added end-to-end (EAT_CUISINES, seed
  VALID_CUISINES, OSM CUISINE_RE/CUISINE_MAP, EN "Moroccan" /
  AR "مغربي"). No migration needed — `cuisines` is an unconstrained
  text[]. The Moroccan Joint + Habibi Miami flipped from
  mediterranean; filter chip verified (returns exactly those two).
- **Sahara Grill** upgraded to halal `reported` (Zabihah Dade County
  list, source confirmed by Zizo).
- **Place-ID backfill rerun**: 212 matched (31 new seed rows + the
  OSM rows that had none) — live enrichment now works directory-wide.
  3 unmatched: The Moroccan Joint (address is just "Miami, FL" —
  will match once we have a street address) + 2 dearborn OSM rows
  with empty addresses (Kirchenwirt, Alnawras — Kirchenwirt looks
  like non-Arab OSM noise; for Zizo's review queue judgement).
- **Live address display** (Zizo's note-1 idea): `formattedAddress`
  added to the enrichment FieldMask — listing pages whose STORED
  address is area-level (<3 comma parts, same heuristic as the seed
  script's no-pin rule) now show Google's live street address at view
  time, never persisted. Verified on Beirut Doral: stored "Doral, FL"
  + live "2475 NW 95th Ave #10, Doral, FL 33172" + 4.9★/10k reviews.
- **Gotcha fixed**: the seed rerun's merge-upsert clobbered the manual
  Delights of Beirut lat/lng (its "S Red Rd" address geocode-fails);
  re-patched to 25.7073323,-80.2854156. If the CSV gets rerun again,
  put those coords in the CSV's lat/lng columns to make it stick.

## 2026-08-24 (cont.) — Directory upgrades 1-5 + /stories editorial section

Zizo's numbered list. #3 (OSM import) and #4 (suggest form) were
already built the previous turn — what was new there is the REVIEW
QUEUE refinement, done below.

- **#5** Seed rerun: 18 Miami rows live (107 seeds + Beit Zizo).
- **#2** Place-ID backfill: `scripts/backfill-place-ids.ts` — Places
  Text Search with an IDs-only field mask (free SKU; IDs are the one
  storable Places datum). Ran: **108/108 matched**. Note: the fictional
  demo restaurant also "matched" a real place — harmless because
  enrichment (below) never runs on claimed listings.
- **#1** Live Places enrichment on UNCLAIMED listing pages: photos/
  rating/hours fetched at view time via server action (client-mounted so
  ISR never bakes Places content into cached HTML), 5-min in-memory
  burst TTL, `cache: no-store` everywhere, photos streamed through
  `/api/eat/photo` (key stays server-side) and rendered with plain
  `<img>` — next/image's optimizer would persist copies, a ToS
  violation. "Powered by Google" + photo author attribution shown.
  Reuses the Grader's daily cap. Verified live on Abu Naji: real 4.7★ /
  1,111 reviews, live hours, 3 photos.
- **#3 refinement — review queue**: OSM hits whose RAW cuisine tag is
  only the ambiguous "mediterranean" (no halal tag, no Arab name match)
  import unpublished; clearly-Arab raw tags (shawarma, falafel,
  lebanese…) publish directly. `/admin/directory` gives one-click
  Publish/Reject (audit-logged). Migration 0011 amended (STILL
  UNAPPLIED — apply the current version) with the `published` column;
  everything existing stays published.
- **#4**: already live from the previous turn — no changes.

### /stories — editorial section (slug decision noted per Zizo)
Chose **/stories** over /blog: matches the brand's existing
founder-story voice and reads premium; path segment is SEO-neutral.
Markdown files in `content/stories/` (tiny frontmatter parser +
`marked`), editorial article template per branding.md (Cormorant-class
display headline, measured 17px body, brass links), Article JSON-LD,
per-article typographic OG image via next/og (WhatsApp-first, no
photos → no scraping risk), sitemap + footer link, EN-first per the
Arabic review rule (pages exist in both locales; article body renders
EN LTR).

First article shipped: "Where to find Arab & halal food in Tampa Bay" —
neighborhood guide built ONLY from our own directory data, all 10
listing links verified against real slugs, ends in add-a-restaurant +
claim CTAs. This is the Zay-OS-style SEO flywheel: stories → directory
→ claims.

### Still with Zizo (unchanged, clocks ticking)
Apply amended 0011 → I run the OSM import (~112, ambiguous ones to
review queue). Twilio A2P / Stripe live / DNS / domain registrar. The
delivery API applications.
## 2026-08-24 (cont.) — Directory comprehensive coverage: OSM layer + community form

Per Zizo's three-layer directive. Also ran the seed again first: the
other Claude's 14 Miami rows are now live (1 geocode failure: Delights
of Beirut — good address, OSM just doesn't resolve it; needs manual
lat/lng or a corrected address).

### Layer 1 · OSM bulk import (needs migration 0011 to run for real)
`scripts/import-osm-directory.ts`: Overpass query per metro
(restaurant/fast_food/cafe × cuisine regex + diet:halal=yes|only +
name regex), OSM→our cuisine mapping, halal tags → 'reported' (never
'verified'), conservative dedupe (osm_id first, then normalized-name
match against existing listings — curated seeds always win), slug
collision handling, "(Coming Soon)" junk filtered, `--dry-run` mode.
ODbL attribution ("© OpenStreetMap contributors") added on city pages
and OSM-sourced detail pages — legally required and now present.

**Dry run against live Overpass**: 112 would import — Tampa +5,
Dearborn +84, Miami +23, with 28 correctly deduped against existing
listings (Petra, Shatila, Bucharest Grill ×4, Sheeba…). Expectation
check per the directive: OSM small-family-restaurant coverage IS patchy
(Tampa's 5 vs Dearborn's 84 says it all) — the three layers together
are the path to "all", and the form carries it long-term. Note for
Zizo: the halal-diet layer honestly pulls in halal-tagged non-Arab
chains (Subway, Little Caesars in Dearborn) — they serve halal diners
and stay unless you prune them; takedown/manual delete works per row.

### Layer 2 · "Add a restaurant" community form
On /eat and every city page (collapsed behind a button). Honeypot +
rate-limited → leads kind 'suggestion' for MANUAL review — never
auto-publishes. Verified live end-to-end: submission succeeded and the
"never a lost lead" fallback proved itself — with 0011 unapplied the
constraint rejected the insert and the lead landed in
.data/leads-backup.jsonl + email notification. After 0011 they flow to
the leads table like everything else.

### Layer 3 · Curated seeds — unchanged, and they outrank
Seeds keep winning dedupe conflicts; OSM fills gaps around them.

### Migration 0011 (hand to Zizo)
'osm' source + unique osm_id column + leads 'suggestion' kind. After
applying: `npx tsx scripts/import-osm-directory.ts` imports the 112.

## 2026-08-24 — Third directory metro: Miami & South Florida

New metro at **/eat/miami** covering Miami-Dade, Broward, and Palm
Beach. Slug decision (Zizo delegated): "miami", not "south-florida" —
it's the term diners actually search ("halal restaurants miami"), and
it matches the existing anchor-city pattern (tampa → all Tampa Bay,
dearborn → Metro Detroit). The display name carries the full scope:
"Miami & South Florida" / "ميامي وجنوب فلوريدا". Map centers on the
tri-county corridor (zoom 9). Everything else (routes, sitemap, static
params, filters) derives from the metro config — one config entry + the
seed script's city allowlist were the whole change. Verified: EN + AR
pages 200, landing card renders, sitemap entries present, isolated
build clean. Seed rows (city column: "miami") to follow from the other
Claude; the empty state shows "Listings coming soon" until then.

## 2026-08-24 — Sofratak Directory v1 (/eat) + launch-prep items

Per Zizo's priorities: (1) launch blockers, (2) directory, (3) delivery
API applications.

### 1 · Launch (2-week window)
No code-side blockers remain. LAUNCH.md gained a lead-time warning —
Twilio A2P 10DLC, Stripe live activation, and DNS all have multi-day
external timelines and should start FIRST — plus a discounted-order
step in the smoke test.

### 3 · Delivery APIs (done first — it's a hand-off)
`docs/delivery-api-applications.md`: current application entry points
for DoorDash Drive (note: their production access is currently
restricted — registering interest early matters) and Uber Direct
(merchant signup, marketplace listing NOT required), what to have
ready, and the canonical use-case description. Account creation is
Zizo's task; the doc makes each ~10 minutes.

### 2 · Directory built per docs/directory-spec.md
- **Migration 0010**: `directory_listings` (deliberately public-read —
  it IS the public product; writes service-role only) + `leads.kind`
  gains 'claim'. Halal three-state enforced twice: the seed script
  refuses 'verified' on seeds, and the render path downgrades
  'verified' to 'reported' on any unclaimed row regardless of data.
- **Routes**: /eat (metro picker), /eat/[city] (search + cuisine/halal/
  open-now/order-online filters + Leaflet/OSM map with brass verified
  pins vs olive outline pins, list/map toggle on mobile),
  /eat/[city]/[slug] (detail: LocalBusiness JSON-LD, hours, claimed →
  banner photo + brass Order Now → storefront; unclaimed → claim form,
  required disclaimer, takedown link with same-day promise).
- **Claim flow**: honeypot + rate-limited server action → leads
  (kind 'claim', takedown flag in data) + standard email notification.
- **Seeding**: `scripts/seed-directory.ts` + `data/directory-seed.csv`
  template. Geocoding uses OpenStreetMap Nominatim (free, 1 req/sec) —
  seed coordinates are OSM-sourced, keeping us entirely outside Google
  Places caching restrictions. Beit Zizo seeds as the claimed/Verified
  demo listing.
- **SEO**: static generation (city pages ISR 300s), JSON-LD, sitemap
  entries, footer link.
- **BLOCKER — spec assumption wrong**: the spec says the ~80-restaurant
  Tampa/Dearborn lead spreadsheets are "already in the repo/docs".
  They are NOT anywhere on this machine (searched repo, Downloads,
  Desktop, Documents). Refused to fabricate listings. The CSV template
  + import pipeline are ready; Zizo drops the real lists into
  `data/directory-seed.csv` and runs (or asks for) the seed.

### Verified
tsc/eslint/build clean; /eat, /eat/tampa, /ar/eat/dearborn all 200;
map renders OSM tiles with brand styling; 390px mobile layout correct
(list default, map toggle, no horizontal overflow). Pending 0010:
seeding, claim-flow E2E, Beit Zizo verified rendering, JSON-LD Rich
Results check on a real listing.

### Needs Zizo
1. Apply `supabase/migrations/0010_directory.sql`, then say so — the
   Beit Zizo listing gets seeded and the claim flow verified E2E.
2. Drop the Tampa + Dearborn lead lists into `data/directory-seed.csv`
   (format documented in the file header).
3. Submit the DoorDash Drive + Uber Direct applications
   (docs/delivery-api-applications.md).
4. Start the LAUNCH.md long-lead items (A2P, Stripe live, DNS) now.

## 2026-08-23 (cont.) — CRITICAL FIX: discounts never reached Stripe

Found by the Cowork session during post-0008 verification (great catch):
orders recorded the discounted total in the DB, but the Stripe Checkout
session was built from raw line items + fees — `order.discountCents`
never entered — so the DINER WAS ASKED FULL PRICE while the dashboard
showed the discounted revenue. Confirmed against all three discounted
test orders on the connected account (beitzizo is a live Connect
direct-charge account): K975 DB 838 vs Stripe 1028, Z156 1117 vs 1377,
K500 (loyalty redemption) 578 vs 1377 — so BOTH discount paths (promo
codes and punch-card rewards) were affected. The bug shipped with the
Phase 5 offer-code work and was only reachable on discounted orders.

Fix in `lib/payments/stripe.ts`:
1. When `discountCents > 0`, create a one-time `amount_off` coupon on
   the same account as the session (connected account for direct
   charges) and attach it via `discounts` — the diner sees it as a
   proper discount line in Stripe Checkout.
2. **Hard invariant**: after session creation, if
   `session.amount_total !== order.totalCents`, the payment start fails
   closed (logged loudly) — a total mismatch can never silently reach a
   diner again, whatever causes it next time.

Verified live with the hardest case — one order carrying BOTH discounts
(PHASE8TEST 20% = $2.60 + Free-dessert reward = $7.99 on a $12.98
subtotal): order C152, DB total 318 = Stripe amount_total 318, session
amount_discount 1059, punches 6→1, use_count 2→3. Stopped at the Stripe
payment page as usual (no card entered).

Note: one-time coupons accumulate on the (connected) account, one per
discounted order. Harmless clutter; deleting them post-session risks
invalidating unpaid sessions, so they're left alone.

Awaiting Zizo/Cowork retest, then the demo reset click (which wipes all
this test data).

## 2026-08-23 (cont.) — Phase 8: launch polish (8A–8D)

Approved by Zizo with two conditions, both honored below. 0007 applied
and verified first (cron run 1: sent=1; immediate rerun: skipped=1 — the
once-per-week guard works).

### 8A · Security hardening
- **Migration 0008 (RLS lockdown)**: drops all five public-read policies
  (restaurants, menu tables, offer_codes). Verified first that no
  browser code reads these tables — the browser Supabase client does
  auth only, and every storefront read is server-rendered via the
  service role. **Condition 1 baseline recorded pre-0008**: a real
  checkout with code PHASE8TEST → order Z156, discount_cents=260 (20%
  of $12.98), total $11.17, use_count 0→1. The identical test must be
  re-run after 0008 is applied (the redemption path is service-role, so
  it should pass unchanged).
- **Rate limiting** (`lib/rate-limit.ts`): per-IP sliding window on
  grader autocomplete/run/unlock, lead submission, order placement
  (also throttles offer-code brute-forcing), post-order prefs, funnel
  beacon, and the loyalty punch lookup (the phone-enumeration surface,
  15/min). Honest caveat per Zizo's condition 2: in-memory, per-instance
  on Vercel — documented in LAUNCH.md §8 with the Redis upgrade path.
  Verified by code review + typecheck only: the server-action transport
  plus client debounce makes a legitimate-UI hammer test impractical.
- **Twilio webhook signature validation** on /api/webhooks/twilio-sms
  (HMAC-SHA1 per Twilio's scheme, timing-safe compare; enforced when
  TWILIO_AUTH_TOKEN exists, open in keyless dev). Also fixed a latent
  bug in that route while there: a shared module-level Response was
  reused across requests (a body can only be consumed once).
- **Security headers** (frame-ancestors 'self' — the homepage live-demo
  iframes the storefront same-origin, so not DENY — HSTS, nosniff,
  referrer + permissions policies). Verified live via curl -I.
- **Auth-gate sweep**: every dashboard/kitchen/admin server action and
  API route checks membership or super-admin; public endpoints are
  rate-limited + honeypotted; webhooks signature-checked; crons
  CRON_SECRET-gated. One deliberate ungated action:
  stopImpersonationAction (only deletes the caller's own cookie).

### 8B · Demo reset
`resetDemoRestaurant()` store method + audit-logged /admin button,
hard-scoped to beitzizo (shown only on that tenant's page, slug
constant server-side). Wipes orders/SMS/loyalty/campaigns/opt-ins/
profiles/automation-log/offer-codes and reseeds menu + settings; never
touches billing/Stripe columns. Seed updated so the demo restaurant
ships with the punch card on (Free dessert after 5 orders) — resets
stay demo-ready. Live click-through needs a super-admin session (can't
enter Zizo's password), so runtime verification is his one-click.

### 8C · Order funnel
Migration 0009: `storefront_events` (no PII — server-side hash of a
random client uuid; writes service-role-only, member-only reads).
Beacons: storefront view, first add-to-cart (cart context), checkout
start (only with a non-empty cart). Today dashboard gains a funnel
card: visits → carts → checkouts → paid (last 7 days, distinct
sessions; paid from orders). Verified live that the beacon fires and
fails silently server-side while 0009 is unapplied — diner pages show
zero errors.

### 8D · docs/LAUNCH.md
Full runbook: Supabase (migrations, PITR backups, auth hardening),
Vercel (env vars, crons), DNS incl. wildcard *.sofratak.com (the
subdomain middleware already exists), Stripe live mode + webhook
endpoint, Twilio + A2P 10DLC + TWILIO_WEBHOOK_URL, Google key
restrictions + billing budget, Resend domain, known limitations
(per-instance rate limiting → Redis upgrade, per condition 2), and a
15-minute launch-day smoke test.

### Waiting on Zizo
1. Apply `0008_rls_lockdown.sql`, then say so — I'll re-run the
   offer-code checkout to close condition 1.
2. Apply `0009_funnel_events.sql` (funnel starts recording immediately).
3. One click on "Reset demo restaurant" in /admin to confirm 8B live.

## 2026-08-23 (cont.) — Grader verified live · punch-card loyalty · Phase 6

Migrations 0004–0006 applied by Zizo; GOOGLE_PLACES_API_KEY added.

### Grader verified against the real Places API
Typed "Columbia Restaurant Tampa" → live autocomplete returned real
Google results → full grade ran: C, 70/100 (Google profile 100, reviews
94, website 75, ordering 10 — no known ordering platform detected on
their site), $563–$3,000/mo estimated impact. Email unlock wrote a real
`kind='grader'` lead row to Supabase. The whole funnel works.

### Loyalty reworked to punch-card language (Zizo's decision)
Points ledger stays underneath; every paid order = exactly 1 punch.
Owner defines rewards as "after N orders → X (worth $ off)"; the
spend-based earn-rate UI is gone (`centsPerPoint` kept in stored JSON
for compat, unused). NEW: checkout redemption — once the diner types
their phone number, their punch count appears with any earned rewards;
selecting one shows the discount immediately and the server validates +
deducts atomically at order placement (can't go negative, same
pre-payment tradeoff as offer codes). Verified end-to-end live: seeded
6 punches, redeemed "Free dessert (5 punches)" through real checkout —
total $13.77 → $5.78, server deducted to 1 punch with a ledger entry,
order row carries discount_cents=799. Stopped at the Stripe test
payment page without entering a card.

### Phase 6 — weekly Monday owner report
`lib/reports/weekly-stats.ts` (pure math + render, directly testable) +
`lib/reports/weekly.ts` (orchestration): orders/revenue/avg ticket vs
prior week, new vs returning, top-3 best sellers, estimated savings vs
a 25% marketplace rate (labeled "estimated, not guaranteed" everywhere),
one suggested action with a deep link (rules: paused → resume; 3+
lapsed → win-back campaign; no reviews URL → add it; no loyalty → turn
on punch card; else best-sellers nudge). One compact bilingual EN+AR
email + an SMS nudge with the dashboard link. Revenue math is the same
`netCents` the Today dashboard uses — extracted both helpers into
`lib/orders/stats.ts` so the two can never disagree. Cron at
`/api/cron/weekly-report`, Mondays 13:00 UTC (~9am ET) in vercel.json,
idempotent per ISO week via the automation_log guard.

Verified: stats computed from real beitzizo orders came out exactly
right (prior-week revenue $21.75 = the two paid orders minus the $0.79
fees each); rendered email visually inspected in-browser, all rows +
CTA correct. The live cron run correctly failed-safe (logged, nothing
sent) because migration 0007 isn't applied yet — that's the expected
behavior, not a bug.

### Needs Zizo (small)
- Apply `supabase/migrations/0007_weekly_report.sql` (2 lines — widens
  an enum constraint so the weekly report's once-per-week guard works).
- At launch, as already planned: Twilio + webhook, CRON_SECRET on Vercel.

## 2026-08-23 (cont.) — Two fixes against CLAUDE.md's original Phase 5 spec

Re-read CLAUDE.md's own Phase 5 line after the fact and caught two real
gaps against it:

1. **"SMS campaigns (TCPA: opt-in at checkout...)"** — the checkout
   `smsOptIn` checkbox already exists and its own copy says "text me
   offers," but nothing fed that signal into the new `marketing_optins`
   table — campaigns would only have reached people who separately used
   the new post-order card, silently ignoring everyone who'd already
   said yes at checkout. Fixed: `finalizePaidOrder` now syncs a true
   checkout opt-in into `marketing_optins` (never downgrades an existing
   opt-in when left unchecked on a later order). Keeping the new table
   rather than reverting to the old per-order boolean on purpose — the
   old design had no way to record a STOP reply, which is a hard TCPA
   requirement the constitution also lists.
2. **"automations (30-day win-back w/ offer code...)"** — my first pass
   sent a plain "we miss you" text with no code. Added
   `automations.winBackOfferCode` (owner picks from their existing
   active codes in the dashboard); the win-back text includes it when set.

One deliberate deviation left as-is, flagged rather than silently
changed: CLAUDE.md says "loyalty v1 (every Nth order)"; what got built
is points-based instead, matching what the Phase 5 spec (which Zizo saw
and let proceed) recommended after benchmarking Owner.com/Toast — both
run points, not punch-cards. Not a pricing or checkout change, so it
didn't hit the one thing I held to asking about, but Zizo should know
the mechanic differs from his original one-liner and say if he wants it
changed to a punch-card model instead.

## 2026-08-23 (cont.) — Phase 5 marketing suite: built

Zizo asked me to keep working overnight and finish everything that didn't
need him personally. Built the full suite from the approved spec
(`docs/phase5-marketing-spec.md`) rather than leaving it at spec-only,
using defensible defaults for the spec's four open questions (documented
below) since none of them touch published pricing or Sofratak's own
checkout economics — CLAUDE.md's "ask before changing pricing or
checkout" line stayed the one hard boundary I didn't cross.

### Data layer
`supabase/migrations/0006_marketing_suite.sql`: campaigns, marketing
opt-ins (separate from the transactional per-order smsOptIn — TCPA
treats the two differently), customer profiles (birthday), offer codes,
loyalty accounts/ledger, automation log. All additive, RLS matching the
existing `is_member_of()` pattern.

### Email + SMS campaigns
`lib/marketing/campaigns.ts`: sends to a CRM segment (vip/lapsed/new/all,
already computed from order history) intersected with who's actually
opted in on that channel. Email uses a real branded HTML template
(`lib/marketing/email-template.ts`, restaurant's own colors/name — "your
name on it, not an app's"). SMS quiet-hours-gates the whole send (8am–9pm
restaurant-local, see compliance below) rather than partially sending.
Dashboard compose UI at `dashboard/[slug]/marketing`.

### Offer codes
Percent or flat-cents codes, redeemed atomically at checkout
(optimistic-lock update, same idiom as `markOrderPaid`). Discount applies
to the food subtotal only. Checkout gained a promo-code field; the order
status page shows the discount line when one was used.

### SMS compliance + Twilio
Twilio Messages API wired in for real (`lib/sms/twilio.ts`, plain REST,
no SDK) — this was previously a stub that *threw* whenever
`TWILIO_ACCOUNT_SID` was set, a real latent bug now fixed. Marketing
consent is a separate opt-in from the transactional smsOptIn, captured
via a soft "want deals?" prompt on the order-status page (never added to
checkout — the ordering flow doesn't get slower). Inbound STOP handling
at `/api/webhooks/twilio-sms` — point Twilio's number config at this URL;
suppresses marketing sends across every restaurant, not just one, since
all restaurants share one Twilio number (see Q4 below) and a STOP reply
to that number is ambiguous about which restaurant it means.

### Automations
`lib/marketing/automations.ts` + a daily cron (`/api/cron/automations`,
schedule in `vercel.json`): welcome (first paid order), win-back (30+
day lapsed), review-request (2h after order completed, using the
`googleReviewsUrl` already on the restaurant record), birthday. Every
send is gated on the same marketing opt-in as manual campaigns —
"automated" doesn't mean consent doesn't apply — and guarded by an
atomic (restaurant, kind, phone, ref) uniqueness constraint so a cron
re-run or retry never double-sends.

### Loyalty
Points-based, phone-number identity, no app or password. Owner sets an
earn rate and reward catalog in the dashboard. Points earn automatically
on paid orders (never blocks the order if it fails). Redemption is
backend-complete (`redeemLoyaltyPoints`, atomic, can't go negative) but
there's no redeem-at-checkout UI yet — see "Not built" below.

### The four open questions from the spec — decisions made, not asked
1. **Bundle into Growth as already priced?** Yes — this only fulfills
   what the pricing page already promised, not a pricing change.
2. **Birthday capture?** Post-order opt-in prompt, not checkout — keeps
   the ordering flow exactly as fast as it was.
3. **Loyalty reward defaults?** Owner sets their own from an empty
   catalog rather than seeded defaults — simpler v1, no made-up numbers
   presented as if they were considered choices.
4. **SMS sender identity?** Shared Twilio number pool (the one number
   already in `.env.local`) — zero incremental cost; per-restaurant
   numbers are a real fast-follow if deliverability becomes an issue.

### Verified
`tsc`/`eslint`/`next build` all clean throughout, checked after nearly
every file group rather than once at the end. Live in-browser: the promo
code field renders and works correctly in both EN and AR (RTL), an
invalid code shows the right error with no order created and no side
effects, `/dashboard/[slug]/marketing` correctly redirects unauthenticated
visitors, no console errors anywhere touched. Deliberately did **not**
trigger any real Twilio SMS send during verification — TWILIO_ACCOUNT_SID
is live in this environment, so an actual test order or a hit to the
cron endpoint would have texted a real phone number; verification of the
send paths themselves stopped at typecheck/lint/build.

### Not built (explicitly out of scope for tonight, not forgotten)
- Loyalty redemption UI at checkout (backend is ready)
- AI SMS copy assistant, MMS/image support (both explicitly flagged as
  fast-follow, not v1, in the original spec)
- A live end-to-end test of a real campaign send, a real offer-code
  redemption through to a paid order, or the automations cron — all
  need `TWILIO_ACCOUNT_SID`/Resend live and a deliberate decision to
  text/email a real number, which felt like Zizo's call, not mine to
  make while he's asleep.

### Still needs Zizo
- Apply `0004_billing_admin.sql` through `0006_marketing_suite.sql` in
  the Supabase SQL editor (no direct DB credential in this environment —
  only REST API keys — so I could write every migration but not run
  any of them).
- Point the Twilio phone number's messaging webhook at
  `/api/webhooks/twilio-sms` (STOP handling only works once that's set).
- Add `GOOGLE_PLACES_API_KEY` for the Grader (from the previous session).
- Set `CRON_SECRET` as a Vercel project env var so the daily automations
  cron is authenticated in production (works unauthenticated in local dev).


## 2026-08-23 (cont.) — Phase 5 marketing suite: spec delivered, not built

Priority 3, spec-only per Zizo's instruction — see
`docs/phase5-marketing-spec.md`. Benchmarked email/SMS/automations/offer
codes/loyalty against Owner.com's and Toast's actual current feature
lists (pulled live from their product pages and support docs, not from
memory). Key finding surfaced: the public pricing page already lists
"SMS and email campaigns," "offer codes and win-back automation" (Growth)
and "loyalty program" (Partner) as included — this is a live gap between
what's marketed and what's built, not a speculative feature. Spec
recommends bundling the whole suite into Growth (matches Owner.com's
all-in-one pricing, undercuts Toast's $185/mo add-on) and a build order
(email → offer codes → SMS/compliance → automations → loyalty) chosen so
each phase reuses plumbing the previous one proved out. Four open
questions need Zizo's call before any of it gets built.

## 2026-08-23 (cont.) — Restaurant Grader (lead-gen tool)

Priority 2 per Zizo, approach approved before building (paid Google
Places API with a hard daily cap, `/grader` on the main site rather than
a subdomain, full report gated behind email). Free, ~60 seconds: type a
restaurant name → scored report → estimated $ impact → Sofratak pitch +
demo CTA. Every completed grade (email submitted) becomes a lead.

### What it scans, and what it costs
`lib/grader/`: Google Places API (New) for restaurant lookup (Autocomplete
session-token billing — every keystroke in one search session plus the
ending Details call bills as a single Autocomplete charge) and profile
data (rating, review count, hours, phone, website). Website itself is
scanned with a plain `fetch` + regex — no new HTML-parsing dependency —
for HTTPS, a viewport meta tag (mobile-friendly proxy), and known
ordering-platform/marketplace domains found in the site's own links
(Toast, Square, ChowNow, Olo, Owner.com, DoorDash, Uber Eats, Grubhub,
etc. — plus a `sofratak` pattern so restaurants already on Sofratak don't
get a false "you have no ordering" pitch). PageSpeed Insights (free,
works unauthenticated) adds a performance score. Confirmed live pricing
from Google's own docs before building: Autocomplete + Place Details
(Essentials/Pro/Enterprise field tiers) are free up to 1,000–10,000
calls/month depending on tier: real cost is ~$0 until the tool is
already succeeding as a lead source.

### Guardrails
- `grader_cache` table (7-day TTL, keyed by `place_id`) — a repeat or
  anonymous scan of the same restaurant never re-pays for API calls,
  independent of whether a lead is ever captured.
- `grader_api_usage` + `increment_grader_usage()` — atomic conditional-
  UPDATE (same idiom as `markOrderPaid`/`markCancelExportSent`) hard
  daily cap on Autocomplete/Details calls, per Zizo's ask. Fails open on
  a DB error so an infra hiccup doesn't take down the funnel; the real
  cost backstop is a billing cap set in the Google Cloud Console.
- `leads.kind` gained `'grader'`; grader leads store the full score/
  findings JSON so we can later see what's most correlated with
  converting to a demo.

### The $ impact number
Deliberately illustrative, not a claim about the specific restaurant —
built from a stated order-volume band (150–400/mo) and marketplace
commission rate (15–30%), shown in the UI as a range with a "how we
calculate this" note. Avoids the two credibility risks: inventing a
precise-sounding number pulled from nowhere, or citing an unverified
industry statistic as fact.

### Lead capture
Score + $ impact range shown immediately after grading; the category
breakdown and specific findings stay visually gated (CSS blur/hide, not
a second server round-trip) until an email is submitted, which is what
actually creates the lead row. Reuses `captureLead()`/the existing
Supabase-with-local-file-fallback pipeline. Report ends in a "Book a
demo" CTA that hands the restaurant name to `/demo` via a query param —
added `useSearchParams` prefill to `DemoForm` (wrapped in `Suspense` on
the demo page so it stays statically prerendered) for that handoff.

Verified: `tsc`/`eslint`/`next build` clean; confirmed live in-browser in
both EN and AR (RTL layout, mobile drawer nav) that the page renders with
no console errors, and specifically that a missing `GOOGLE_PLACES_API_KEY`
degrades gracefully to a visible "not available right now" message
instead of a silent dead end (caught and fixed during this same pass —
the first version only surfaced that error after picking a result, not
while typing). Did not test a live Places API call or a live email
submission — needs `GOOGLE_PLACES_API_KEY` in `.env.local` first.


## 2026-08-23 — Phase 7: platform billing + internal admin

Top priority per Zizo: "ready to onboard a real paying restaurant." Ships
Stripe Billing for the 3 tiers, dunning, cancel-with-auto-CSV-export, and
an internal Sofratak admin panel (onboarding, menu import, impersonation
with audit log, tenant health).

### Platform billing (separate Stripe object graph from Connect)
Diner→restaurant food money already runs on Stripe Connect (Phase 6);
this is restaurant→Sofratak SaaS fee, billed on the platform's own Stripe
account. `lib/billing/stripe.ts`: `startSubscriptionCheckout` (dynamic
`price_data`, no pre-created Products needed — `lib/billing/plans.ts` is
the single source of truth the marketing pricing page also reads, so the
price a prospect sees can never drift from what billing charges),
`openBillingPortal`, `cancelSubscription` (cancel-at-period-end — "no
lock-in" per CLAUDE.md), `syncBillingStatus` (polls on page load, mirrors
the existing Connect-return pattern for local dev without live webhooks).
Webhook (`api/webhooks/stripe/route.ts`) is the single source of truth
for status transitions: `customer.subscription.updated/deleted`,
`invoice.payment_failed/succeeded`. The auto-CSV-export "sales weapon"
fires the moment `cancel_at_period_end` flips true (immediate, not weeks
later at actual period end) via `lib/billing/export.ts`, guarded by an
atomic `markCancelExportSent` column flip so a retried webhook never
double-sends. Dashboard UI at `dashboard/[slug]/settings/billing`.

### Internal admin (`/admin`, gated on `app_metadata.role = "super_admin"`)
- **Tenant list + health**: billing status/tier, paused flag, orders in
  the last 7 days, last order date.
- **Onboarding wizard** (`/admin/new`): creates the restaurant row +
  a real Supabase Auth login for the owner in one step
  (`DataStore.createOwnerAccount`, same create-or-reuse-user pattern as
  `scripts/create-owner.ts`), shows the temporary password once.
- **Impersonation** (`/admin/[slug]` → "Log in as owner"): signed,
  30-minute HMAC cookie (`lib/auth/impersonation.ts`, off entirely
  without `IMPERSONATION_SECRET` configured — no insecure fallback mode).
  `getMembership()` falls back to a verified impersonation token only
  after a real-membership lookup misses. Every grant is written to
  `admin_audit_log` at issue time; the dashboard shows a persistent
  "support session" banner with a one-click stop.
- **Menu import** (`/admin/[slug]/menu-import`): adapter-shaped
  (`lib/menu-import/`) — only a free text-paste heuristic ships today (no
  OCR/vision API key yet); lines ending in a price become items, short
  lines become category headings. Admin reviews/edits the parse in an
  editable table before committing — nothing writes to the menu
  unreviewed.
- `scripts/promote-super-admin.ts` grants the role to an existing login.

Verified: `tsc --noEmit`, `eslint`, `next build` all clean. Confirmed
live in-browser that `/admin` and `/dashboard/[slug]/settings/billing`
correctly redirect unauthenticated visitors to `/login?next=...`, and
that `/pricing` still shows $249/$349/$499 (no drift from the billing
refactor). Full logged-in walkthrough (real onboarding → impersonation →
a real test-mode Stripe subscription checkout) needs a super-admin
account — next step for Zizo, or ask me to run it.


## 2026-08-14 — Product-tour scroll-jack bug + bold DM Sans titles

### Fixed: "See it working" kept pulling the page back to it
Root cause found in `product-tour.tsx`: the carousel's 5-second auto-
advance timer called `target.scrollIntoView({ block: "nearest", ... })`
to slide to the next screenshot. `scrollIntoView` adjusts the PAGE's
vertical scroll too, not just the carousel's own horizontal scrollbar —
so every 5 seconds, no matter where on the page the visitor had scrolled
to (above or below the carousel), the page got yanked back to bring the
carousel into view. Exactly the reported symptom.
Fix: `goTo()` now scrolls the carousel's track element directly via
`track.scrollTo({ left })` computed from bounding-rect deltas — this
never touches page-level scroll, only the carousel's own horizontal
scrollport. Also added an IntersectionObserver so auto-advance only
fires while the carousel is actually on screen (belt and suspenders).
Verified: scrollY stays byte-identical across two full 5s auto-advance
cycles both well above and well below the carousel section; carousel
still auto-advances normally (scrollLeft 0→638px) when it IS in view.

### Titles: bold DM Sans in place of the Cormorant Garamond serif
Zizo's call — titles needed to read "stronger and bold." Added `DM_Sans`
via next/font/google (variable font, loaded cleanly — unlike Cormorant's
CDN 404, kept as a self-hosted fallback in case of revert) as the new
`--font-display` value; `font-plex-arabic` still carries Arabic glyphs
in the same stack, unaffected. Bumped every heading/pull-quote combining
`font-display` + `font-semibold` (26 occurrences across 10 files) to
`font-bold`. Verified computed style: H1 renders "DM Sans" at
font-weight 700 in English, correctly falls through to bold IBM Plex
Sans Arabic in Arabic (DM Sans has no Arabic glyphs). Full 18-page ×
2-locale regression crawl after both fixes: zero console/page errors.

## 2026-08-13 (cont.) — Full site review: SEO/GEO audit + interactive cities map

Zizo asked for a full functional re-review plus SEO/GEO work for the city
pages, and gave discretion to add an interactive map if it'd help.

### SEO/GEO fixes (real gaps found and closed)
- **`metadataBase`** was never set on the root layout — OG/Twitter image
  URLs could resolve incorrectly when shared. Fixed, plus added sitewide
  `openGraph.siteName` and a `twitter.card` default.
- **No canonical URLs or hreflang anywhere.** Every EN/AR page pair was
  invisible to Google as a language-alternate of the other — a real risk
  of duplicate-content flags. Added `src/lib/seo.ts` (`localeAlternates`)
  and wired it into all 8 indexable page types (home, pricing, calculator,
  how-it-works, about, demo, cities index, every city page).
- **`/styleguide`** (an internal dev reference) was indexable — added
  `robots: noindex` and disallowed it (+ `/login`) in `robots.ts`.
- **Sitewide Organization JSON-LD** added to the marketing layout (name,
  logo, service area = all 12 cities, sameAs WhatsApp/Instagram) — gives
  search AND AI answer engines one unambiguous entity to cite, on top of
  the existing per-city Service/FAQPage schema.
- **`/llms.txt`** added (llmstxt.org convention) — a structured, factual
  summary of pricing/fees/features/cities for AI answer engines (ChatGPT,
  Perplexity, Claude, Gemini) to ground answers on, instead of guessing.
  Explicitly notes Sofratak isn't affiliated with DoorDash/Toast/Owner.com
  etc., and to prefer live pages over cached summaries.
- Homepage got a real `generateMetadata` (it had none — was relying on
  the generic layout default) with keyword-rich EN/AR title+description.
- Verified: sitemap.xml math is exact (19 unique paths × 2 locales = 38
  URLs, zero orphans, zero extras).

### Interactive cities map (new)
`src/components/marketing/cities-map.tsx` — replaces the plain city list
on `/cities` (was genuinely thin, per Zizo's complaint) with two low-poly
silhouettes (Florida, Metro Detroit — matching the brand's geometric-arch
aesthetic rather than literal cartography) and a brass pin per city at an
approximate real-relative position. Hover/focus shows a tooltip (city name
+ first "known for" chip + "View city"); click/tap/Enter navigates to the
city page. A plain-text city list under each map keeps it fully usable
without hover. Forced `dir="ltr"` on the map only (geography doesn't
mirror for RTL) while tooltip text still renders each locale's script
correctly — verified on `/ar/cities`. Added a `knownFor` chip array (3
real local details per city, e.g. "Warren Avenue", "Busch Blvd halal
corridor") to `src/content/cities.ts`, reused in both the map tooltips and
each city page's hero.

### Functional audit (full crawl, both locales)
Playwright crawl of all 21 marketing paths × 2 locales (42 page loads):
zero console errors, zero pageerrors, zero 4xx/5xx. Separately crawled and
verified all 31 unique internal links resolve. Found and fixed one real
bug along the way: the site logo's `width`/`height` props (93×40 navbar,
140×60 footer) didn't match its actual 1390×320 aspect ratio — CSS
(`w-auto`) was masking it visually, but Next.js flagged it and it's a
Cumulative-Layout-Shift risk on slow connections. Fixed to the correct
174×40 / 261×60. Re-crawled after the fix: zero console warnings anywhere.
Verified map click/tap/keyboard-Enter navigation in EN, AR, and mobile
touch (iPhone 13 viewport).

### Next
Phase 7: Stripe Billing tiers + internal Sofratak admin, as before.


**City pages** were thin; each of the 12 is now a full landing page with
the band rhythm: olive hero (H1, the honest local paragraph, new
per-city "We know this scene" chips — Warren Ave, Busch Blvd, Joseph
Campau…), the LIVE embedded demo storefront, community + founder trust,
the 12-capability grid, full pricing cards, FAQ (new per-city question
interpolated + the core five, all in the FAQPage schema), and a gradient
CTA with cross-links to the other cities. Still zero boilerplate — every
page's local content is real.

**Sofratak assistant** (marketing pages, EN/AR): deliberately NOT an
LLM — a curated knowledge base (src/content/assistant-kb.ts, 13 entries
built ONLY from published copy: pricing, fees, speed, Arabic, DoorDash
coexistence, hardware, data ownership, cities, refunds, halal, demo,
founder) with word-boundary keyword matching (substring matching was
letting "deliver" hit "live" — fixed), quick-reply chips, and a WhatsApp
+ book-a-demo handoff for anything unmatched. It can never invent a
price or a guarantee. Verified: EN + AR questions answered correctly,
nonsense → fallback. LLM upgrade path: an adapter behind an Anthropic
API key later if Zizo wants free-form answers.

New AR strings pending Zizo review, as usual.

## 2026-08-13 (cont.) — Competitive upgrade pass (Owner.com / Zay-OS / Toast research)

Researched all three. Owner: 1,000+ reviews, dollar-figure case studies,
AI-report hook. Zay-OS (direct competitor): "$48k/yr to DoorDash" hook,
free grader, 6 FAQs, ~80 city pages, /compare pages, $399–599/mo + $0.99
diner fee (we undercut both numbers). Toast: breadth. We can't match
their social proof honestly (no fake reviews per brand rules) — so we
shipped what none of them have: PROOF.

Added to the homepage (band rhythm preserved, EN+AR):
- **Live demo section** — the REAL Beit Zizo storefront embedded in a
  phone frame via iframe, scrollable/tappable, with a one-tap EN↔AR flip
  and "Open the full demo". Verified the frame renders the actual menu.
  No competitor embeds their working product.
- **"The apps vs. your own site" comparison table** — generic delivery-
  apps column (estimates marked as estimates, no named competitors) vs
  Sofratak: commission, who pays the per-order fee, customer data
  ownership, brand, Arabic support, cancel terms.
- **Capability grid** — 12 features labeled "Live now" (8) vs "Rolling
  out" (4+) — depth like Toast, honesty as the differentiator (roadmap
  rule from founder-story.md respected).
- **Homepage FAQ** (8 questions incl. "can I keep DoorDash/Uber Eats",
  speed-to-launch, Arabic) with FAQPage JSON-LD.
- **Sticky mobile CTA bar** (estimator + WhatsApp) after 700px scroll,
  hidden on /calculator + /demo; floating WhatsApp bubble now desktop-
  only to avoid overlap.
- **Branded OG images** (next/og, olive/brass, EN + AR variants) — link
  previews in WhatsApp groups now look intentional.

New sequence: hero olive → serving strip → $30 sand → features+grid
ivory → tour olive → LIVE DEMO ivory → who+founder sand → how ivory →
COMPARISON sand → pricing ivory → promise olive → FAQ ivory → CTA
gradient. No same-color adjacency. New AR strings pending Zizo review
like the rest of the site.

## 2026-08-13 (cont.) — Founder story shipped (docs/founder-story.md)

- Final copy implemented verbatim in `src/content/founder-story.ts`;
  /en/about rebuilt as the full story: olive hero w/ large portrait
  (public/brand/founder-zizo.png), band rhythm, staggered fade-in for the
  "One company handled X" fragmentation list, brass pull-quote, and the
  "Note From Ahmad" letter block (Cormorant italic, repeated photo,
  signed "Zizo (Ahmad Zeidan) — Founder, Sofratak"). Meta description
  per spec.
- Reuse map applied: homepage founder card (photo + blurb + pull-quote +
  "Read our story") folded into the who-it's-for sand band to preserve
  the band rhythm; footer mission line; "Built by Offbeat Creative"
  badge in hero chips + pricing; demo-page "talking to Zizo directly"
  reassurance; generic Offbeat trust line on city pages (the per-city
  and "50+ brands" claims skipped — not verifiable; flagged).
- **English only, per the rules**: every founder placement is gated to
  the `en` locale; /ar/about keeps the previously approved short Arabic
  (verified: no English leakage). Arabic story ships after Zizo review.
- WhatsApp number set in .env.local — floating button + contact CTAs
  live on every marketing page (verified).
- "Why the name" homepage callout (optional per spec): skipped — the
  homepage is dense post-design-pass; it lives in About. Revisit if
  Zizo wants it.

## 2026-08-13 (cont.) — Design pass (docs/design-pass.md)

Homepage rebuilt to the design spec, verified at 390px/desktop, EN+AR:

- **Navbar**: transparent over the hero → solid olive at 80px (200ms),
  real logo (public/brand/ processed into transparent full-color + ivory
  variants; white-halo cleaned), EN|ع pill, brass pill CTA w/ hover scale
  + shine; full-screen olive mobile drawer, Cormorant 28px staggered links.
- **Hero = the live calculator** (min 88vh olive, arch watermark w/ slow
  parallax): eyebrow, two-tone Cormorant H1, dual slogans, 3 trust chips;
  ivory card w/ 2° tilt, custom sliders (olive track, brass 22px thumb w/
  drag glow + value bubbles), 120ms odometer results in an olive panel,
  Growth-difference line, always-visible disclaimer, "Book a 15-min demo"
  + ghost "Text me this estimate" (inline capture). Verified interactive
  above the fold at 390px (done-when #1).
- **Band rhythm** per §3: olive → ivory strip (honest "Now serving" city
  list instead of a fake logo strip — we have no client logos; flagged) →
  sand $30 band → ivory features → olive product tour → ivory steps →
  sand who-for → ivory pricing → olive promise → gradient CTA + watermark.
  1200px grid, 96/64 padding, left-aligned Cormorant headers.
- **"$30 order" animation** (§4): scroll-triggered bar comparison, 25%
  chunk breaks off + slides away w/ live count to $22.50, brass 79¢
  sliver "your customer pays it", replay button; transform/opacity only.
- **Product tour** (§5): snap carousel of REAL screenshots (captured via
  Playwright incl. authenticated kitchen/dashboard w/ seeded orders,
  cleaned up after) in CSS device frames; EN→AR storefront flip animation;
  dots, drag, 5s auto-advance w/ pause; captions in Cormorant.
- **Motion system** (§6): .reveal fade-up w/ 80ms stagger, count-ups on
  view (resting state = true value — no more $0 flashes), hover-lift,
  brass shine sweep, arch-divider stroke draw-in; ALL gated behind
  prefers-reduced-motion in CSS + JS.
- **Pricing** (§7): Growth card olive/elevated w/ brass MOST POPULAR
  ribbon, 44px count-up prices, honest fee line; reused on /pricing.
- **Footer** (§8): deep olive 3-col, logo + mission + dual slogans,
  links, contact (WhatsApp/phone/IG — env-gated), brass arch motif line.
- **RTL** (§9): verified — sliders run right-to-left, bubbles mirror,
  carousel direction flips, Latin numerals for money.
- **Done-when**: comparison screenshot vs owner.com committed at
  docs/design-pass-comparison.png — ours reads premium hospitality;
  owner.com reads generic SaaS.
- Founder-name rule (branding.md edit): about page now says
  "Zizo (Ahmad Zeidan)". Leads migration 0003 applied by Zizo; backup
  lead replayed into Supabase.

Still needed from Zizo: WhatsApp number + contact phone + IG URL (env),
founder photo, Arabic review of ALL site copy incl. the new design-pass
strings. Next: Phase 7 (billing + internal admin).

## 2026-08-13 (cont.) — Public website (Phase 8 pulled forward)

Money loop confirmed by Zizo first (order Q171 on the connected account,
$0.79 in Collected fees). Then built sofratak.com per docs/website-spec.md:

- **All 8 page types, EN + AR true RTL**: home (all 8 spec sections incl.
  phone mockup, math strip, promise block), pricing (3 tiers + fee
  footnote), **savings estimator** (3 sliders, instant math, no signup
  wall, soft capture after the number), how-it-works, cities index +
  **12 Tier-1 city pages** (each with a genuinely local paragraph — Busch
  Blvd, Warren Ave, Joseph Campau…, FAQ + Service/FAQPage JSON-LD),
  founder story (photo placeholder pending Zizo), book-a-demo, privacy +
  terms. 57 static pages build clean.
- **Leads**: migration 0003 (⚠ Zizo pastes) + `captureLead` — Supabase
  insert, ANY failure falls back to .data/leads-backup.jsonl, email
  notification (Resend adapter; console until RESEND_API_KEY) fires
  regardless; honeypot on both forms. Verified live: estimator submit →
  backup file with full estimator snapshot.
- **Estimator math verified**: 500×$30×25% → $3,750/mo, $45,000/yr,
  difference $40,812 vs $349×12.
- WhatsApp button (floating + inline) renders once
  NEXT_PUBLIC_WHATSAPP_NUMBER is set — never ships a dead link.
- sitemap.xml (both locales, hreflang), robots.txt (blocks dashboard/
  kitchen), per-page metadata + OG tags.
- Navbar/Footer rebuilt for the site (footer links every city).

### Waiting on Zizo
1. Paste supabase/migrations/0003_leads.sql (leads table).
2. NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local (digits, country code).
3. RESEND_API_KEY when ready (console fallback works meanwhile).
4. Founder photo + review of ALL Arabic copy (messages/ar.json "site"
   namespace + src/content/cities.ts) before launch.
5. Analytics + OG images at deploy time (Vercel).

### Next
Phase 7: Stripe Billing tiers + internal Sofratak admin.

## 2026-08-13 (cont.) — Connect bug: card_payments capability

Zizo's first post-onboarding payment failed on Stripe's page. Root cause
(from the PaymentIntent's last_payment_error): the Express account was
created WITHOUT requesting the card_payments capability, so onboarding set
up payouts only — `charges_enabled` read true while every card charge was
rejected. Fixes:
- accounts.create now requests card_payments + transfers.
- syncConnectStatus counts an account ready only when charges_enabled AND
  capabilities.card_payments === "active" (payouts-only accounts can no
  longer show "Payouts active" or receive direct charges).
- Requested the capability on the existing account via API; Stripe now
  wants identity fields (address/DOB/SSN-last-4/etc.) — Zizo re-enters
  onboarding via "Finish Stripe setup" in Settings. DB flag reset to
  false meanwhile; verified a fresh checkout correctly routes to the
  platform account until the capability is active.

## 2026-08-13 (cont.) — Owner logins + Stripe Connect

### Auth (Supabase Auth, @supabase/ssr)
- `/login` (EN/AR) with email + password; session cookies refresh in
  middleware; sign-out in the dashboard sidebar.
- `getMembership(slug)` gate: signed in AND a `restaurant_members` row for
  that tenant (checked under RLS with the user's own token). Enforced on:
  dashboard layout + kitchen board + ticket (redirect to login), kitchen
  feed API + both CSV routes (401), and EVERY dashboard/kitchen server
  action (pause, menu, settings, refunds, status changes).
- Verified: signed-out dashboard → 307 to /login?next=…, APIs → 401,
  storefront stays public.
- `scripts/create-owner.ts <email> <slug> [owner|staff]` provisions logins
  (REST-based; prints a temp password once, self-checks sign-in). Owner
  account created for offbeat305@gmail.com on beitzizo.

### Stripe Connect (direct charges)
- Migration `0002_stripe_connect.sql` (⚠ Zizo must paste in SQL editor):
  stripe_account_id + stripe_charges_enabled on restaurants.
- Onboarding from Settings → "Set up payouts": creates an Express account,
  redirects to Stripe-hosted onboarding, and the settings page polls the
  account on return to flip charges_enabled — no Connect webhook needed in
  dev.
- Checkout switches to DIRECT charges once enabled: the charge lives on
  the restaurant's account (they're merchant of record, pay 2.9% + 30¢ at
  cost) and Sofratak collects application_fee_amount = $0.79 per order —
  exactly the business model. Refunds run on the connected account and
  claw back the proportional application fee. Not-yet-onboarded
  restaurants keep platform charges (demo mode).

### For Zizo
1. Paste supabase/migrations/0002_stripe_connect.sql in the SQL editor.
2. Sign in at /en/login (temp password from create-owner output — store in
   a password manager; password-change UI not built yet).
3. Settings → Set up payouts → complete Stripe test onboarding → place a
   4242 order → the $0.79 fee appears under Connect in the Stripe
   dashboard.

### Next
Phase 7 (billing tiers + internal admin) per build order, then 5 → 6 → 8.
Password change/reset UI, staff invites from Settings, Connect webhooooks at
deploy time.

## 2026-08-13 (cont.) — Today-tile fix + menu manager + settings

### Fixed (Zizo's bug report on order J575)
- Dashboard tiles froze mid-animation (rAF pausing stranded count-up at
  ~5% of target — the $0.66 readings). Tiles now render final values
  instantly server-side (`animate={false}`); the count-up hook got a
  guaranteed-completion timer for marketing uses.
- Revenue defined as the restaurant's take: subtotal + tip + delivery fee
  (the $0.79 service fee is Sofratak's), refunds subtracted, clamped ≥ 0.
  J575 shows $11.26 as expected. Live-order rows keep the diner total.
- Day windows use the restaurant's timezone, not the server's.

### Built — Phase 4 remainder (menu + settings)
- **Menu manager** (`/dashboard/{slug}/menu`): items grouped by category,
  one-tap sold-out toggle, editor sheet (EN/AR names + descriptions, price,
  category, delete), add item per category. Modifier-group editing is
  support-side for now (noted in UI). Verified end-to-end: price change via
  UI → Supabase → diner storefront.
- **Settings** (`/dashboard/{slug}/settings`): pickup/delivery toggles,
  delivery fee + minimum, prep minutes, per-day hours with closed days.
  Verified persistence to Supabase.
- Store: upsert/deleteMenuItem + updateRestaurantSettings (Supabase impl;
  local fallback is read-only for these).

### Phase 4 "done when" status
Owner can change a price ✓, pause orders ✓, issue a partial refund ✓ —
all verified from phone-sized UI. Remaining Phase 4 scope: owner/staff
logins (Supabase Auth), Stripe Connect onboarding, holiday overrides,
delivery zones, photo upload.

## 2026-08-13 — Supabase is live

Migration applied by Zizo (SQL editor), seed script run: Beit Zizo restaurant
+ 25 items + 6 categories + 5 modifier groups upserted. Backend picker now
selects SupabaseStore (no fallback warning). Verified reads are live by
patching a menu item name via REST and watching the storefront change and
revert. Note: order history starts fresh in Supabase — the two dev orders
(Q473, P525) live only in the old .data/store.json.

## 2026-08-12 (night) — Supabase wiring + Phase 4 dashboard (part 1)

### Supabase
- `SupabaseStore` implements the full `DataStore` interface (service-role
  client, snake↔camel mapping, atomic pending→paid flip). Backend picked at
  runtime: Supabase when the schema is applied, else local JSON store with a
  console warning. **Blocked on one manual step**: Zizo pastes
  `supabase/migrations/0001_init.sql` into the Supabase SQL editor (DDL needs
  dashboard access we don't have), then `npx tsx scripts/seed-supabase.ts`
  seeds Beit Zizo. Keys are in `.env.local` (moved out of the tracked
  template again).
- Migration updated: text ids matching app ids, `refunds` jsonb,
  `unaccepted_alert_sent_at`, payment_status includes `pending`.

### Phase 4 dashboard (`/{locale}/dashboard/{slug}`)
- Shell: mobile bottom tabs / desktop sidebar, EN/AR, links to kitchen +
  storefront, **big Pause/Resume button** with red banner (verified live —
  paused blocks checkout server-side).
- **Today view**: today's revenue (net of refunds), orders, average ticket,
  this-week-vs-last with delta; live orders list.
- **Orders history**: search (number/name/phone) + status filter + CSV
  export; detail page with full receipt.
- **Itemized refunds** (the Owner.com gap): per-line quantity selectors or
  full remaining balance; Stripe refunds via payment_intent (mock-paid dev
  orders refund mock-style); diner gets an automatic SMS; revenue math
  subtracts refunds. Verified: partial $13.74 line refund → order
  partially_refunded + SMS.
- **CRM**: customer book auto-built from paid orders (name, phone, count,
  total, last order, SMS opt-in), auto-tags VIP (≥5 orders or ≥$150) /
  lapsed (30+ days) / new; one-click CSV (verified). Orders CSV too.

### Still open in Phase 4 (next session)
- Menu manager (add/edit items, photos, prices, modifiers, sold-out toggle).
- Hours & holiday overrides, delivery zone/fee settings.
- Supabase Auth (owner/staff logins) — after the migration is applied.
- Stripe Connect onboarding + $0.79 application-fee routing.


## 2026-08-12 (evening) — Real Stripe test payments + Zizo's checkout decisions

### Business decisions implemented (confirmed by Zizo)
- **No sales tax in test mode**; Stripe Tax before first live order
  (FL prepared food taxable — Hillsborough 7.5%; MI 6%).
- **Tips**: No tip / 10 / 15 / 20% / custom; preselects **15% on delivery,
  No tip on pickup**; an explicit tap always wins; 100% to restaurant.
- **Prices display "$9.49" in both EN and AR** (src/lib/money.ts).
- Stripe self-handled (standard 2.9% + 30¢) — no Managed Payments add-on.

### Built
- **Stripe hosted Checkout** (`src/lib/payments/stripe.ts`) behind the same
  `PaymentProvider` interface (mock still auto-activates if no key):
  itemized line items incl. the $0.79 "Service fee" line, EN/AR names,
  success → order status page, cancel → checkout with "cart untouched" note.
- **Pending → paid flow**: orders are created `pending`; `finalizePaidOrder`
  (idempotent) flips to paid exactly once, then sends the confirmation SMS
  and dispatches OrderChannels. Called from the status page on redirect
  (works locally) and from `POST /api/webhooks/stripe` with signature
  verification (production; set STRIPE_WEBHOOK_SECRET).
- Pending orders never appear on the kitchen board/feed; the cart survives
  a canceled Stripe payment and clears only when the order is paid.
- Keys live in `.env.local` (gitignored). TODO at Phase 4: Stripe Connect
  destination charges + $0.79 application fee to Sofratak.

### Verified
Checkout produced a real Stripe test session (verified via Stripe API:
correct $7.28 total + orderId metadata); pending order hidden from kitchen;
pending status page renders. Full card tap-through is Zizo's next step
(test card 4242 4242 4242 4242) — my preview browser can't leave localhost.


## 2026-08-12 (later) — Phase 3: order routing to the kitchen

### Built
- **`OrderChannel` adapter** (`src/lib/orders/channels.ts`) with the three
  implementations from the brief: kitchen web view (v1 default — the board
  pulls), SMS + printable ticket (`/kitchen/{slug}/ticket/{orderId}`), and
  the **Otter stub** properly isolated in `src/lib/integrations/otter/`
  behind `OtterClient` (mock only until partner API access lands). New paid
  orders fan out to all channels via `Promise.allSettled` — a channel
  failure can never lose or block a paid order.
- **Kitchen board** (`/{locale}/kitchen/{slug}`): tablet-friendly three-
  column view (New / Preparing / Ready-or-on-the-way), 5s polling, WebAudio
  triple-beep on new orders behind a sound toggle (autoplay policy needs a
  tap), accept → preparing → ready|out_for_delivery → complete, cancel,
  per-order print ticket, "N completed today" counter. EN/AR.
- **Lifecycle → diner SMS** (`src/lib/orders/lifecycle.ts`): guarded status
  transitions; preparing/ready/out-for-delivery/canceled each text the diner
  in their checkout language. Diner status page picks changes up via its
  10s poll.
- **Never lose an order silently**: orders unaccepted for 5+ minutes SMS
  the restaurant's phone once (flagged via `unacceptedAlertSentAt`); the
  check piggybacks the kitchen feed poll (a real cron replaces this at
  deploy time).
- **Fixed**: LocalStore no longer caches in memory — Next dev compiles
  routes/actions into separate module graphs, so instances must treat the
  JSON file as the single source of truth.

### Verified end-to-end
Storefront order → appeared on kitchen board (New, highlighted) → overdue
alert SMS fired to owner after 5 min → Accept/Ready/Complete each sent the
right diner SMS ("being prepared" / "ready for pickup!") → board shows
"1 completed today". Ticket page renders print-ready.

### Known gaps (deliberate, phase-ordered)
- Kitchen routes are **unauthenticated until Phase 4** — don't share URLs.
- Overdue check runs on feed polls, not a cron (fine while a kitchen tab
  is open; needs a scheduled job in production).
- Canceled orders say "you will be refunded" but refunds are mocked until
  Stripe lands (Phase 4 does itemized refunds).


## 2026-08-12 — Phase 2: diner storefront (demo-complete on local adapters)

### Built
- **Constitution updated**: Zizo's business constants + renumbered phases
  (build order 2 → 3 → 4 → 7 → 5 → 6 → 8) are now in CLAUDE.md.
- **Adapters** (no real keys exist on this machine yet — see CLAUDE.md
  "Local dev fallbacks"):
  - `src/lib/db/` — `DataStore` interface + local JSON store
    (`.data/store.json`, gitignored). Full Supabase schema **with RLS** ready
    in `supabase/migrations/0001_init.sql` for when credentials arrive.
  - `src/lib/payments/` — `PaymentProvider` interface + mock (auto-approves).
    Stripe Connect slots in behind the same interface.
  - `src/lib/sms/` — `SmsChannel` interface + console channel that persists
    messages so flows are verifiable.
- **Tenant routing**: `beitzizo.localhost:3000` (and `*.sofratak.com` in prod)
  rewrites to that restaurant's storefront; `/{locale}/s/{slug}` also works.
- **Storefront** (`src/app/[locale]/(storefront)/s/[slug]/`):
  menu page (restaurant branding via CSS vars, cover, halal badge, category
  chips, EN/AR item names + descriptions, schema.org Restaurant+Menu JSON-LD),
  item sheet with modifier groups (required/optional, price deltas), cart
  (localStorage per restaurant), checkout (pickup/delivery toggle, ASAP or
  30-min schedule slots, guest details w/ required phone, SMS marketing
  opt-in checkbox, tip presets 10/15/20%/custom — 100% to restaurant,
  **$0.79 service fee line**, delivery fee + minimum), order confirmation +
  SMS with tracking link, live order status page (10s polling).
  Server reprices every order from the live menu — client totals are never
  trusted.
- **Demo restaurant**: Beit Zizo Shawarma (`beitzizo`), 25 items across 6
  categories, full EN/AR, 5 modifier groups, Tampa hours/address.
- **Verified end-to-end** on a phone viewport: menu → modifiers → cart →
  checkout → paid (mock) → confirmation + SMS record + status page. Build
  and lint clean.

### Flagged for Zizo (checkout-visible defaults I chose)
- Tip presets 10/15/20% with 15% preselected.
- Sales tax is NOT charged/shown (needs a decision: who files, per-county FL
  rates, Stripe Tax?).
- Mock payment shows a "Test mode" note instead of a card form until Stripe
  keys exist.
- Arabic prices render as "9.49 US$" (proper ar-locale currency, Latin
  digits). Alternative: force "$9.49" style in AR too.

### Next
- Phase 3: `OrderChannel` adapter + kitchen web view with new-order alert,
  accept/preparing/ready/complete; SMS + printable ticket fallback; Otter
  stub; unaccepted-order alerting.


## 2026-08-12 — Phase 0, part 1: scaffold + design system + styleguide

### Built
- **Scaffold**: Next.js 15 App Router + TypeScript + Tailwind v4, npm. Route
  groups per CLAUDE.md under `src/app/[locale]/`: `(marketing)` (live),
  `(storefront)` / `(dashboard)` / `(admin)` (placeholder pages for Phase 1).
- **i18n**: next-intl v4, EN + AR with true RTL (`dir="rtl"` on `<html>`,
  logical properties throughout — mirrored nav, flipped select chevrons,
  RTL-native forms). Messages in `src/messages/{en,ar}.json`.
- **Fonts** via next/font: Manrope (UI), IBM Plex Sans Arabic (Arabic UI —
  falls through the font stack automatically for Arabic glyphs), Cormorant
  Garamond (display; **self-hosted** in `src/fonts/` because Google Fonts'
  CDN 404s the version next/font/google requests).
- **Design tokens** in `src/app/globals.css` (`@theme`): all brand colors,
  radii (btn/field 14px, card/modal 24px), font stacks, rise/fade keyframes
  with reduced-motion opt-out.
- **Components** (`src/components/`): Button (primary/secondary/dark ×
  sm/md/lg), Card (white/ivory, hover-lift option), Badge (6 variants),
  Input, Select, Modal (portal, Esc, scroll lock), StatCard (brass money
  numbers, count-up on scroll, green/red deltas, Latin digits in AR),
  Navbar (sticky, mobile menu), Footer, LocaleSwitcher, Wordmark (arch mark).
- **/styleguide** (`/en/styleguide`, `/ar/styleguide`): every component
  shown side-by-side in English LTR and Arabic RTL.
- Production build passes; all routes prerender statically in both locales.

### Decisions / deviations to flag
- Primary button is brass bg + **ivory** text (brand kit says olive text;
  olive-on-brass is ~2.5:1 contrast vs ivory's ~3.5:1). Awaiting Ahmad's call.
- Money/stat numbers use Latin digits in Arabic UI (brand consistency +
  avoids server/client ICU hydration mismatches).

### Next
1. Ahmad reviews the styleguide (⏸ stopped here per Phase 0 instructions).
2. Marketing homepage (hero, problem, solution cards, savings section,
   4 pillars, footer, arch dividers).
3. /calculator page with savings math, count-up outputs, disclaimer,
   Book a Demo form (stubbed submit).
4. Design-check pass over every screen, then update this file.
