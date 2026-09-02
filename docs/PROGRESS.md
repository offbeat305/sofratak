# Sofratak — Progress Log

## 2026-09-02 (cont. 2) — Zizo's homepage edit pass (items 1-11)

Direct edit list from Zizo after reviewing every surface. All homepage-
scoped; more pages to come ("this is for the home page so far").

- **Halal de-emphasis (his #2/#9)**: hero eyebrow, who-it's-for line and
  badge, homepage metadata, the grid's "Halal badge" capability item, and
  the footer's directory link (new `eat.footerLink` key) no longer lead
  with halal. The /eat directory's halal filters/badges and its city-page
  SEO titles are untouched — those are diner search utility and a traffic
  decision to make separately, flagged to Zizo.
- **"Blended app rate" → "Average app commission"** (his #3), same fix in
  the $30 caption and the calculator disclaimer.
- **/demo rebuilt** (his #4): olive hero band, "what you'll see in 15
  minutes" checklist in owner terms, founder reassurance, WhatsApp, form
  as the page's single glowing object. Was a bare form.
- **Hero calculator "Text me this estimate" fix** (his #5): the revealed
  inputs inherited the hero section's ivory text onto white fields —
  invisible typing, no labels, hence "2 black spaces idk what they're
  for." Explicit text/placeholder colors + a one-line lead-in ("We'll
  text you this estimate — nothing else").
- **Now-serving strip** (his #6): South Florida first (display-order
  only; EAT_METROS untouched since /eat depends on it), plus an "Also
  serving" row of every other city page (Orlando, St. Pete, Detroit…).
- **$30 comparison reworked** (his #7): the red commission chunk was
  gone in under a second — now the timeline is ~3s, the chunk detaches
  and STAYS with "−$7.50" inside it and a red caption, dollar figures
  render inside both bars, an always-visible legend explains the three
  colors, and a plain-words explainer box closes the section. End state
  is fully self-explanatory with zero motion.
- **Feature cards rewritten in owner language** (his #8): "your customer
  list belongs to you," "no new hardware, nothing for your staff to
  relearn," etc. Grid sub sharpened ("no surprise add-ons").
- **Homepage How-it-works upgraded** (his #10): three flat numbered cards
  → four day-badged timeline cards (Day 1 / Day 2–4 / Week 2 / Week 3)
  with brass connectors, mirroring the /how-it-works page's framing, plus
  a "see the full day-by-day plan" link.

Arabic updated for every changed key (needs Zizo's review pass, as
always). Verified EN + AR live: zero halal mentions on the homepage,
metro order correct, all new sections rendering, RTL intact, tsc/eslint
clean.

## 2026-09-02 (cont.) — Payments fail closed on production without Stripe keys

Cowork found STRIPE_SECRET_KEY absent on Vercel Production; mock mode
would auto-approve real orders (free food), and the coming-soon wall
doesn't cover it because /api/mobile/* bypasses the gate by design.
Zizo approved unfreezing exactly this spot.

getPaymentProvider() now returns a DisabledPaymentProvider on Vercel
production when no key is set: payment starts refuse with "Ordering is
temporarily unavailable" (web + mobile, one shared choke point), verify
returns false, refunds error. Escape hatch: ALLOW_MOCK_PAYMENTS=true —
an explicit, visible env switch for device-testing windows before real
keys exist (weeks out behind the LLC filing). Local dev and preview
deployments keep mock mode untouched. No pricing/fee/checkout-math
changes — this only refuses service in a misconfigured production.

Verified locally in all three modes (refusal / override / dev-mock) and
against production post-deploy. Device-testing note: production order
placement now correctly FAILS until Zizo either sets real Stripe test
keys or temporarily sets ALLOW_MOCK_PAYMENTS=true in Vercel.

## 2026-09-02 — Production DNS flip verified: wildcard subdomains + tenant middleware

Cowork moved sofratak.com's nameservers to Vercel (`ns1/ns2.vercel-dns.com`)
with wildcard `*.sofratak.com` attached to the project. This session verified
the tenant-subdomain middleware against the live production deployment.

### Verified in production ✅
- **DNS delegation live**: NS records resolve to Vercel; apex, www, and the
  wildcard all resolve to Vercel IPs.
- **Wildcard TLS**: Vercel's wildcard cert for `*.sofratak.com` was NOT
  issued immediately after the flip — every subdomain failed the TLS
  handshake for ~35 min while apex/www (single-name certs) worked. It
  auto-issued ~00:39 EDT Sep 2 with no intervention. Expected one-time lag,
  noting it in case a future domain move looks "broken" at first.
- **Apex → www**: `sofratak.com` 308-redirects to `www.sofratak.com`
  (Vercel domain config).
- **MAINTENANCE_MODE=true is currently set in Vercel.** The coming-soon
  wall works exactly as specced on every host: `www`, `beitzizo`,
  `nosuchtenant`, `app`, `admin`, `api` subdomains all return 200 with
  `x-matched-path: /en/coming-soon` (`/ar/coming-soon` for `/ar` paths) —
  a rewrite, never a redirect, so the URL bar stays on the subdomain and
  the gate provably runs before the tenant rewrite.
- **Tenant rewrite is active on non-reserved subdomains** (proved via
  `/en/admin`, which bypasses the wall):
  `beitzizo.sofratak.com/en/admin` and `nosuchtenant.sofratak.com/en/admin`
  → rewritten to `/en/s/{slug}/admin` → clean 404 (`x-matched-path: /404`),
  no 5xx.
- **Reserved subdomains skip the tenant rewrite**: the same path on
  `www.sofratak.com` and `app.sofratak.com` hits the real admin route
  (`x-matched-path: /[locale]/admin`, 307 → `/en/login?next=/en/admin`).

### Blocked behind the wall — re-run when Zizo flips MAINTENANCE_MODE off
The wall masks storefront rendering, so these need a quick re-check later
(5 min of curl/phone once the wall is down):
1. `https://beitzizo.sofratak.com/` → locale redirect to `/en`, host kept.
2. `https://beitzizo.sofratak.com/en` → Beit Zizo storefront (menu renders,
   branding, EN/AR).
3. `https://nosuchtenant.sofratak.com/en` → 404, not an error page.
4. Canonical/OG tags on the live storefront page (metadataBase =
   `SITE_URL` = www.sofratak.com; storefront page sets no explicit
   canonical — confirm emitted URLs are what we want for tenant subdomains,
   or decide they should be subdomain-canonical).

### Environment note
- No node/npm/pnpm/bun on this machine's shell PATH from a fresh session,
  so a local prod-build cross-check wasn't possible here. The main
  checkout has `node_modules` + `.next`, so some environment can build —
  whichever session owns that setup should document how.

### Next
- When the wall drops: run the 4 re-checks above, then Phase-2 smoke test
  (test order end-to-end on a phone) against production.

## 2026-08-30 — Native diner app v1 (docs/mobile-app-spec.md): API layer + Expo app

Zizo confirmed the spec's two open decisions (React Native + Expo; push
notifications approved), so both halves got built. The Capacitor webview
wrapper in mobile/ is superseded but left in place per the spec.

**API layer** (committed separately, 10ee3c5 — see that entry): REST
routes under /api/mobile/*, shared createPricedOrder core, PaymentIntent
flow for PaymentSheet, order-status push via Expo's HTTP API, migration
0016 (orders.push_token, UNAPPLIED). Plus this commit: /api/mobile/loyalty
(punch-card status by phone, mirrors getLoyaltyStatusAction with the same
tight rate limit) and permissive CORS on /api/mobile/* only (cookie-less,
unauthenticated-by-design surface; CORS there is dev convenience for the
app's web target, not a security boundary).

**The app** (mobile-app/, Expo SDK 57, TypeScript, react-navigation
native stack): six screens — restaurant picker (the only Sofratak-branded
screen; remembers the choice), menu (tenant-branded header, category
chips, SectionList), item detail (modifier groups with min/max enforced,
radio vs checkbox by max, notes, qty), cart, checkout (pickup/delivery,
ASAP/scheduled slots, tip chips, offer code, loyalty punch-card
redemption once the phone matches, live totals with the $0.79 fee), and
live order status (confirm-on-mount + 5s poll + push on top). EN/AR via
logical RTL (row direction + text alignment driven by locale state, so
the toggle flips instantly without the I18nManager restart). Per-tenant
theming from brand.primary/accent with a luminance check for text-on-
primary. Stripe via src/stripe.native.ts (PaymentSheet) with a web-stub
twin — Metro resolves require() statically, so the native module must be
platform-split, not try/catch'd (found when the web bundle refused to
build). Cart persisted in AsyncStorage with a hydration gate so a
returning diner's initial route is Menu, not Picker (initialRouteName
only applies at navigator mount — rendering before hydration locked
returning users out of the shortcut).

**Verified on this machine**: root tsc + app tsc clean; expo export
bundles clean; full flow driven end-to-end in the app's web target
against the real dev backend (mock payments): picker → menu → modifiers →
cart → checkout → order E996 placed and paid → receipt totals matched the
server to the cent → kitchen status advanced server-side and the live
tracker moved on the next poll → Arabic toggle mid-session flipped the
whole UI RTL. The API side was separately proven against REAL test-mode
Stripe (direct charge, 79¢ application fee, confirm-refuses-unpaid).

**NOT verifiable on this machine — the honest gaps**: this Mac has no
full Xcode (command-line tools only), so no iOS Simulator and no local
device builds; PaymentSheet and real push tokens don't run in Expo Go
either. Still owed per the spec's definition of done: real-device iOS +
Android pass (Expo Go on Zizo's phone covers everything except
PaymentSheet/push today; an EAS build covers it all), on-device RTL
check, and a real PaymentSheet transaction on-device. EAS needs Zizo's
Expo account (free) + eas build:configure (also generates the projectId
push tokens need).

**For Zizo**: apply migration 0016; decide the real bundle id
(com.sofratak.app is a placeholder); Apple Developer ($99/yr) + Play
Console ($25) when store submission time comes; the spec's §6 stopgap
question (ship the old wrapper to the stores now or wait for this app)
is still his call — nothing here depends on it.

## 2026-08-30 — mobile/ scaffold: Sofratak diner app (Capacitor)

Zizo wants a mobile app ready to go for whenever the site itself
launches for real. Decided together: diner ordering app first (not
owner/kitchen), built by wrapping the existing web app in Capacitor
rather than a native rebuild from scratch — fastest path to something
in the App Store / Play Store, and every future web feature ships to
the app automatically since it's the same site in a WebView.

- New top-level `mobile/` directory — separate npm project, doesn't
  touch the Next.js app. `capacitor.config.ts` points the WebView at
  `SOFRATAK_APP_URL` (defaults to https://www.sofratak.com); override
  it to test against a preview deploy or a specific restaurant
  subdomain.
- `android/` and `ios/` native projects generated via `cap add` and
  committed (Capacitor's own convention — real projects to open in
  Android Studio / Xcode, not build output).
- App icon + splash cropped from the existing brand mark
  (`public/brand/logo-full.png`'s cloche + growth-chart glyph, no
  wordmark) onto the ivory brand background, hand-generated at every
  required size for both platforms — the usual `@capacitor/assets`
  generator needs a native `sharp` binary this sandbox's network
  policy blocks, so this was done manually with PIL instead.
  Placeholder-quality; `mobile/README.md` flags it for a real design
  pass before an actual store submission.
- `mobile/README.md` documents how to open/run it and what only Zizo
  can do from here: Apple Developer Program + Google Play Console
  accounts, final bundle ID decision (`com.sofratak.app` placeholder),
  store listing assets, push notifications (not built), and a
  real-device pass once `MAINTENANCE_MODE` comes off — right now the
  wrapped app just shows the coming-soon page, same as the website,
  since it's loading the same URL.
- **Cannot be built into a real .ipa/.apk from this session** — iOS
  needs Xcode (Mac-only, run locally), Android could theoretically
  build headlessly but signing/shipping either one needs the accounts
  above. This is the scaffold Zizo opens on his own machine next.

## 2026-08-27 (cont. 2) — Coming-soon copy revision

Zizo's follow-up: don't reveal what the product is yet, drop the
WhatsApp/contact option (keep the wall to just the email capture), and
swap the footer entity name to "Sofratak LLC" for now.

- Headline → "A new era is coming for Arab restaurants." Sub is now
  deliberately vague ("We're not ready to share the details. Be the
  first to know when we do.") — no mention of restaurant-platform,
  commission-free ordering, or anything else that gives away the
  mechanism. Still English-only/unreviewed-Arabic-pending per the
  standing rule.
- Removed the `<WhatsAppLink>` from the page footer entirely — this
  page's only ask is the email form now.
- Footer copyright is no longer the sitewide `footer.rights` string
  (which correctly still says Offbeat Creative LLC everywhere else on
  the site) — added a page-local `COMING_SOON_COPY.copyright` template
  ("© {year} Sofratak LLC. All rights reserved.") so only this one
  temporary page carries the placeholder entity name.

Re-verified EN + AR/RTL at 390px and 1280px, tsc/eslint clean.
Screenshots re-taken (docs/launch-coming-soon-*.png).

## 2026-08-27 (cont.) — Launch coming-soon maintenance gate (docs/launch-coming-soon-spec.md)

Launch blocker per Zizo: get sofratak.com showing a real holding page
today without waiting on the rest of the build, flip it off with zero
redeploy once ready.

**The gate** (`src/middleware.ts`): reads `MAINTENANCE_MODE` fresh on
every request (no build-time inlining, so Vercel env var flips take
effect immediately). When `"true"`, every request except `/admin/*` and
the `/coming-soon` route itself is REWRITTEN (not redirected) to
`/{locale}/coming-soon` — visitor's URL bar never changes, so turning it
off later is invisible. Runs before the tenant-subdomain and next-intl
logic, so it also covers storefront subdomains (`beitzizo.sofratak.com`).
`/api/*` never reaches this code at all — already excluded by the
existing middleware matcher. When the var is unset/false, the added
block is skipped entirely — verified byte-for-byte zero behavior change
by running the same routes against a server with the var unset.

**The page** (`src/app/[locale]/coming-soon/`): deliberately lives
OUTSIDE `(marketing)` — no Navbar/Footer/Assistant/sticky-CTA, a wall
not a mini-site. Logo, Cormorant headline + Manrope sub (dot-grid
texture, static `.glow-brass` halo behind the headline), single-email
capture (`ComingSoonEmailForm` + a dedicated `submitComingSoonEmail`
action — every other lead form on the site requires phone, this one
skips that contract on purpose since email-only is the whole point of a
low-friction wall), WhatsApp link + `LocaleSwitcher` + the existing
`footer.rights` string in the footer.

**Copy**: headline/sub are EN-only for now (`src/content/coming-soon.ts`,
gated the same way `founder-story.ts` already is) — Zizo hasn't reviewed
Arabic copy for this page yet, so nothing unreviewed ships. Everything
ELSE on the page (email placeholder, button, footer) uses the site's
normal, already-shipped en/ar message files, so the AR locale still
fully works structurally (RTL mirroring, EN/AR toggle) even with an
English headline.

**Migration** `0015_leads_coming_soon.sql` (NOT yet applied by Zizo,
same additive drop/add shape as 0005/0010/0011/0014, doesn't touch
0014): widens `leads_kind_check` to add `coming_soon`.

**Bugs caught and fixed**:
- A real, previously-shipped bug in the shared `<Button>` component
  (`src/components/marketing/button.tsx`): the plain-`<button>` branch
  spread `...rest` AFTER `className={cls}`, and `rest` still contained
  the ORIGINAL unprocessed `className` prop (TypeScript's `Omit` on the
  type didn't match the runtime destructure) — so `rest.className`
  silently overwrote the fully-computed class string on every single
  `<Button type="submit">` site-wide. Found because this page's own
  "Notify me" button rendered as unstyled plain text. Confirmed the same
  bug had already silently broken the /stories newsletter button and
  every other lead-capture submit button built earlier this session
  (contact, demo, city-request, claim, suggest, estimator, grader).
  Fixed at the root (excluded every CommonProps field from `rest`
  explicitly) — spot-verified the stories newsletter button now
  computes the correct `bg-brass` class after the fix.
- Bidi punctuation bug: the English-placeholder headline/sub inherited
  the page's `dir="rtl"` on `/ar/coming-soon`, which reordered trailing
  periods ("`.cooking`" instead of "`cooking.`"). Fixed by pinning
  `dir="ltr"` on just that text block, same fix category as the
  Stories article body's existing forced-LTR convention.

Verified end-to-end: gate on (pricing/homepage/tenant paths all rewrite
to the coming-soon page, URL bar unaffected; `/admin` still redirects to
its own login flow untouched; `/api/cron/*` still returns real JSON) and
gate off (zero behavior change, confirmed against a clean second dev
server). Email capture submitted live against Supabase — correctly
REJECTED by the not-yet-widened constraint and caught by the existing
"never lose a lead" local-backup fallback, proving the whole pipeline
end to end for the moment Zizo applies 0015. `tsc` / `eslint` / `next
build` all clean, both locales statically prerendered. 390px mobile +
1280px desktop, EN and AR + RTL screenshotted.

**Handoff for Zizo**:
- Apply `supabase/migrations/0015_leads_coming_soon.sql` (does not touch
  0014).
- In Vercel: add env var `MAINTENANCE_MODE` = `true` to turn the wall
  ON. No redeploy needed — it's read per-request. Removing the var (or
  setting it to anything other than `"true"`) turns it back off, also
  with no redeploy.
- Arabic headline/sub for `/coming-soon` still needs your review —
  currently English-only on both locales, `src/content/coming-soon.ts`.

## 2026-08-27 — Design pass 6: Stories rebuild (docs/design-pass-6-stories.md)

Built against the spec on disk, full A/B/C scope:

**Index (/stories)**: dark-olive blueprint hero, no stock imagery. Featured
article (largest, first by date) gets a generated 16:9 cover; the rest
render in a 2-3 col grid behind city/topic filter chips (client-side —
`StoriesGrid`), each with its own generated cover. Newsletter strip
("Get new guides when they drop") writes a `story_signup` lead —
migration 0014 (already applied) added that kind to the DB constraint.

**Covers**: `StoryCover` — deterministic per-slug SVG (hash → palette ×
pattern), arch motifs and geometric dividers only per branding.md, never
a photo. Keeps the no-scraping rule unbreakable even for share/index art.

**Article page**: reading typography lives in a new `.story-prose` class
in globals.css (real CSS, not the old `[&_h2]:` Tailwind-arbitrary soup —
too many child rules for that to stay readable) — pull-quotes (brass
quote mark), `[!TIP]`/`[!NOTE]` blockquotes rewritten into `.story-callout`
boxes, styled lists, 68ch max width. Sticky reading-progress bar
(scroll-linked, deliberately NOT gated behind reduced-motion — it's
direct feedback for a user action, not decoration). WhatsApp-first share
row: floating rail on the desktop START edge (mobile inlines it instead —
the END edge already carries the WhatsApp bubble + Assistant launcher
from layout.tsx, so a second floating cluster there would be clutter,
not restraint). TOC renders from two call sites — sticky sidebar on
desktop, and a mobile `<details>` placed right after the header (NOT
in the same grid cell as the desktop version, which would put it at the
bottom of a single-column mobile stack, after the reader has already
finished the article). Author card (real photo, one-line bio), 3 related
stories, soft CTA band to the grader, prev/next nav.

**Restaurant mentions**: `{{restaurant:city/slug}}` on its own markdown
line expands (server-side, in src/lib/stories.ts) into a live directory
card — real name/cuisines/halal status, Order Now for claimed listings,
View listing otherwise. This is the actual point of the pass: articles
now feed the directory instead of just linking off to it. Verified
against two real Tampa listings (one claimed, one not) so both card
variants got exercised, not just the happy path.

**Bugs caught in verification** (all fixed before commit):
- Two-comma shadow lesson held, but a NEW instance of the same root
  cause hit here: `bg-white` (shared button base) and `bg-[#25D366]`
  (WhatsApp override) merged onto one class string — Tailwind resolves
  same-property conflicts by ITS OWN stylesheet order, not by class-
  string order, so `bg-white` silently won and the WhatsApp share button
  rendered blank white with no icon color cue. Fixed by never letting two
  classes target the same CSS property on one element — moved the base
  color out of the shared class, into each variant explicitly.
- CSS Grid blowout on mobile: `.story-prose` sat in a `grid` cell with no
  `min-w-0`, so a grid item's default `min-width: auto` let content push
  the column wider than the viewport instead of wrapping — the whole
  article was horizontally scrolled off-screen on a 375px phone. Fixed
  with `min-w-0` on the prose div (standard CSS Grid overflow fix).
- `[!TIP]` callout regex silently never matched: marked preserves literal
  `\n` inside a blockquote paragraph (no `breaks:true`), and `.` doesn't
  cross newlines without the `s` flag — so the callout rendered as raw
  `[!TIP] ...` text instead of the styled box. Fixed by capturing with
  `[\s\S]*?` instead of `.*?`.
- TOC heading text carried raw HTML entities (`&amp;` for "Busch
  Boulevard & Temple Terrace") straight into JSX, which React then
  displays literally instead of decoding. Added a small entity-decode
  pass before slugifying/displaying heading text.
- Pre-existing bug found and fixed while touching this file: article
  dates rendered one day early for any reader west of UTC — `new
  Date("2026-08-24")` parses as UTC midnight, then `Intl.DateTimeFormat`
  without an explicit `timeZone` renders it in the browser's local zone.
  Added `timeZone: "UTC"` to both date formatters (story-card.tsx, the
  article page) since frontmatter dates are date-only, not instants.
- One dead link in the shipped article (`abu-naji-restaurant` — no such
  listing in the DB) removed while verifying the other 9 referenced
  slugs against Supabase.

Verified: EN + AR (chrome translated, article body stays English —
existing "Stories are EN-first" rule, unchanged), 390px mobile + 1280px
desktop, `tsc --noEmit` / `eslint` / `next build` all clean, all 6
definition-of-done items from the spec. Screenshots:
docs/design-pass-6-stories-index-desktop.png,
docs/design-pass-6-stories-article-desktop.png,
docs/design-pass-6-stories-article-mobile.png.

## 2026-08-26 (cont. 2) — Four targeted fixes: proof band, shared Button, grader grid, wizard picker

**1. Homepage "Now serving" strip replaced.** Was a thin ivory link
list; now `NowServingStrip` (new: `src/components/eat/now-serving-strip.tsx`)
— dark olive + blueprint grid, mono `NOW SERVING` label, three glass
metro cards with REAL published counts from the directory
(Tampa Bay 101 / Dearborn & Detroit 247 / Miami & South Florida 182),
count-up on scroll, each linking to its /eat metro. `CITIES`/`EatStatsStrip`
imports removed from the homepage as now-unused.

**2. Shared `<Button>` component** (`src/components/marketing/button.tsx`):
polymorphic (href → i18n Link, hash href → plain anchor for in-page
scroll, no href → real `<button>` for forms/onClick), variants
primary/secondary/ghost, tones dark/light, sizes sm/md/lg. Glow lives
in two new real CSS classes, `.btn-primary-glow` / `.btn-secondary-glow`
— soft halo at rest, ~30% brighter on hover (verified: rest alpha 0.20
→ hover 0.30, radius 16px → 26px), 0.98 press scale. **Deliberately
smaller than `.glow-brass`/`.glow-card-hero`**: those mark the one
focal object per screen; a button repeats many times per page, so its
halo has to stay quiet enough not to compete for that role.
Rolled out to ~24 call sites across every marketing page, /eat, and
the eat lead-capture forms (home, pricing, contact, grader, cities,
how-it-works, sticky-cta, live-demo, listing-profile, claim-form,
suggest-form, demo-form, estimator, city-request-form). Dashboard,
admin, kitchen, and storefront were left alone on purpose — glow on
every transactional "Save"/"Add to cart" would blow the ≤8% brass
budget and stop meaning anything; this is a marketing-surface system.
**Bonus fix caught in the process**: several primary CTAs had drifted
to ivory-on-brass text (how-it-works, pricing, grader, demo-form,
estimator); branding.md says primary = brass bg + OLIVE text always.
The shared component now enforces that, so the drift can't recur.
**Gotcha**: two batched Python edits (claim-form.tsx, suggest-form.tsx)
silently didn't persist — script printed success but the old `<button>`
markup was still on disk. Cause unclear (possibly a stale-read race
with a concurrent file-changed reminder); caught by ESLint's unused-
import warnings pointing at an imported-but-unused `Button`, redone
with the Edit tool instead. Lesson: after a batch Python rewrite,
grep-verify the actual result rather than trusting the script's stdout.

**3. Grader "what we check" 4-card grid fixed.** Was misaligned at the
tablet 2×2 breakpoint: CSS grid stretches items WITHIN a row, but row 1
and row 2 sized independently, so longer copy in row 1 made it visibly
taller than row 2. Fixed with `line-clamp-2` on both title and body
(reserves identical space per field regardless of copy length) plus a
fixed-size icon badge — content height becomes deterministic instead
of text-length-dependent, so all four cards read as one flush block at
768–1024px. Verified at 390 / 820 / 1440.

**4. Requests wizard storefront picker reworked.** The 5 hotspot zones
over the scaled iframe were cramped (max-w-xs = 320px) with labels
invisible until :hover, which doesn't exist on touch. Now: desktop
(sm+) gets a wider frame (max-w-sm, taller), always-visible seams
between every band (`border-t` regardless of hover), a full-width
centered label, and a `ring-brass` selected/hover state. **Mobile
(<640px) drops the overlay entirely for a clean full-width card list**
— same 5 real section names, ≥44px rows, forward chevron that flips
for RTL. Verified: desktop hotspot click correctly advances to step 3
("What do you need?"), mobile card list renders and is tappable, and
Arabic mirrors fully (back arrow reverses, cards RTL-aligned).
Verified via a temporary unauthenticated harness route
(`wizard-preview-tmp`, mounted `RequestWizard` directly) since no
dashboard login credentials were available in this session — screenshotted,
then deleted; confirmed 404 after removal and confirmed the stale
`.next` type cache it left behind (a `next build` type error pointing
at the deleted route) was cleared before the final green build.

## 2026-08-26 (cont.) — Pass 7 part 1 + the glow bug that made pass 3 invisible

### ⚠️ Root cause: every compound glow on the site was silently dead
Zizo said the homepage "looks unchanged" since design pass 3. He was
right, and the reason is a real bug, not perception:

**Tailwind's `shadow-[a,b]` arbitrary value fails to compile when it
contains two rgba() stops separated by a comma.** Computed style came
back `box-shadow` fully transparent. Exactly four elements used that
form, and they were precisely the four signature glows from pass 3:
the hero estimator card, the Growth tier card (both on /pricing and the
homepage teaser), and the active product-tour slide. So the pass-3 code
*was* committed and correct-looking in the source, but rendered nothing.

Fixed by defining real CSS classes (`.glow-card-hero`, `.glow-tier`,
`.glow-slide-active`) in globals.css. **Rule: never express a two-part
shadow as a Tailwind arbitrary utility.** Single-shadow `shadow-[...]`
values are fine and were always working.

Also removed `glow-hover` from the estimator card: it sets the whole
box-shadow on hover and would have dropped the depth layer, so
`.glow-card-hero:hover` now owns both states (halo ~30% brighter).

Before/after committed: `docs/design-pass-3-homepage-before-after.png`.

### Third instance of the same trap
`.grid-blueprint` set `background-image`, which beat the Tailwind
gradient utility on the pricing CTA band and flattened it to no
background. Converted to a `::before` overlay. This is now the third
time a custom class in globals.css has silently overridden a Tailwind
utility (after `.olive-luminous` vs `lg:sticky`). **Standing rule: a
utility class in globals.css must not set `position`, `background-image`,
or `box-shadow` on an element that also takes those from Tailwind. Use
an overlay child or a pseudo-element.**

### Design pass 7, part 1 (docs/design-pass-7-marketing-complete.md)
- **Migration 0014 (UNAPPLIED)**: widens the leads `kind` constraint for
  `contact`, `city_request`, `story_signup`. Until applied those form
  submissions fail the DB check and land in the local backup file
  instead, so no lead is lost either way.
- **§A Pricing**: rebuilt from 54 lines. Dark hero with mono
  `$0.79 / ORDER` label, live savings slider driving all three tier
  cards (brass odometer), "in every tier" band, comparison table
  (Sofratak vs delivery apps vs "typical platforms", sticky header,
  scrolls at 390px), fee block styled as a receipt, FAQ + FAQPage
  JSON-LD, dark CTA band.
- **§B Cities**: index gets a dusk hero, live stats strip, and a
  "not in your city yet?" capture. City pages get `CityDirectoryPreview`
  with real listing counts and 6 live cards from our own DB, mapped
  city→metro; Orlando and Jacksonville have no metro so the block
  renders nothing rather than showing another city's restaurants.
- **§C /contact**: new page. WhatsApp is the hero action, three glass
  route cards, response-time promise, form writing a `contact` lead
  (honeypot + rate limited), location line. Linked in navbar, footer,
  and sitemap.
- **§D system**: IBM Plex Mono wired as `--font-mono` with `.data-label`
  / `.data-figure`, `.grid-blueprint` blueprint backgrounds,
  `CursorGlow` (mouse-only, reduced-motion gated), `Sparkline` and
  `DataStat` in `components/marketing/tech.tsx`, receipt rule.
- Verified: 0px horizontal overflow on pricing at 390px, all new routes
  200, build clean at 85 routes.

**Still to do in pass 7**: mono/grid accents on the remaining marketing
pages, owner.com and zay-os pricing comparison screenshots.
**Then pass 6** (stories).

## 2026-08-26 — Design pass 5: How It Works rebuilt + site-wide em dash removal

**Design pass 5** (docs/design-pass-5-how-it-works.md), verified live:
hero, scroll-scrubbed day-by-day timeline, who-does-what split,
interactive kitchen feed, "what you don't need" strip, onboarding FAQ
with FAQPage JSON-LD, dark closing CTA.

- **Timeline** is the centerpiece: desktop section is 5 screens tall
  with a sticky viewport; scroll progress drives ONE `translate3d` on
  the track. Mobile and reduced-motion fall back to a vertical stack.
  Stage visuals use the REAL screenshots (storefront EN/AR, kitchen)
  plus designed compositions for the two non-product moments (their
  paper menu, outbound SMS).
- **Two bugs worth remembering**:
  1. Percentage transforms resolve against the *track's* width (five
     screens), so `translateX(-200%)` flew 5x too far. Panels are
     100vw each, so the travel unit must be **vw**, not %.
  2. `lg:sticky` silently lost to `.olive-luminous { position: relative }`
     from globals.css (equal specificity, later source order), so the
     pin never engaged and the section rendered blank. **Never put
     `olive-luminous` on an element that also needs positioning** —
     it now sits on its own absolute child layer. Same trap applies to
     any glow utility that sets `position`.
- Verified: sticky pins, rail tracks 1/5→5/5, RTL flips travel
  direction (rail fills right-to-left), 390px has **0px** horizontal
  overflow, "Approve" label localized.
- DoD screenshot: `docs/design-pass-5-vs-zayos.png`.

**Em dash removal (Zizo, site-wide)**: 0 em dashes left in any
user-facing surface — messages EN/AR (209), content files (98),
the story article (6), and JSX copy (18). Rule applied: a period when
what follows is a full clause, a comma for a short aside; Arabic uses
`،`. **Code comments keep theirs** (not user-facing). En dashes in
ranges (15–30%, Day 2–3) are correct typography and were left alone.
Copy rule is recorded in the design-pass-5 doc for future work.
**Gotcha**: my first sweep used a malformed nested ternary that
dropped text after the dash (`${listing.name} — ${listing.address}`
became `${listing.name}, `). Caught by diff review, reverted, redone.
Always diff a bulk copy edit.

## 2026-08-25 (cont. 5) — Concierge Requests ("done within 24 hours")

Full build of docs/concierge-requests-spec.md.

**⚠️ APPLY MIGRATION 0013** (`0013_service_requests.sql` — table + RLS
+ private `request-media` storage bucket). Until applied: the Requests
tab renders empty, submitting errors, admin queue is empty — all
graceful, nothing crashes.

**Fix (2026-08-25, caught by Zizo on first apply):** 0013's RLS
policies were written against a `memberships` table that does not
exist and raw `auth.jwt()` role checks — apply failed with
`42P01: relation "memberships" does not exist` and rolled back clean.
The real schema is `restaurant_members` (user_id is **uuid**, not
text) plus the 0001 helpers `is_member_of(rid)` / `is_super_admin()`,
which is the pattern every other tenant table uses (0006, 0009).
Policies rewritten to use the helpers. **Rule for future migrations:
never hand-roll the membership subquery — call the helpers.**
App code was audited and was already correct (both actions gate on
`getMembership()` → `restaurant_members`, and `getSuperAdmin()`;
`request-media.ts` touches storage only). The storage-bucket insert
is now marked as separately-runnable: the other two buckets were
created by hand in the dashboard, never via migration, so that insert
is the one statement most likely to fail on role permissions.

- **Owner side**: "Requests" tab in the dashboard nav (ConciergeBell
  icon, brass dot when a request is waiting-on-you or completed <48h).
  3-tap wizard: category cards → point at the thing — their REAL
  storefront in a scaled iframe with 5 tappable hotspot regions
  (hero/menu/photos/hours/footer, brass-ring select), their real menu
  items with search + multi-select, or dashboard-area cards; every
  step has "Not sure — skip" → fix/change/add/teach chips + optional
  note (EN/AR), 60s voice note (MediaRecorder → private bucket,
  playback + re-record), photo attach (4MB). Checkmark confirmation
  with the 24h promise. Requests tracked like order cards: status
  pills (Received/In progress/Waiting on you/Done), signed-URL voice
  playback, our reply, ONE owner follow-up per request (answering a
  "waiting" question flips it back to in_progress), Done cards show
  "Completed in Nh".
- **Admin side**: /admin/requests queue — SLA countdown badge (green
  <12h → brass <20h → clay overdue), filters (Open / Pricing-flagged /
  All), 💡 Insight tag on marketing/idea requests, voice player,
  one-click status buttons + reply box. Reply or Done → SMS to the
  restaurant via the existing adapter + dashboard update. All changes
  audit-logged (`request.update`).
- **Auto-flag per CLAUDE.md**: notes matching pricing/fee/checkout
  language (EN + AR regex) set `pricing_flag` → clay badge + ⚠ in the
  email — Zizo's explicit call required.
- **Notifications**: email to LEADS_EMAIL on every new request; daily
  digest cron `/api/cron/requests-digest` (vercel.json, 13:00 UTC =
  9am ET) — overdue requests first, then all open.
- **Media**: private `request-media` bucket, service-role writes,
  1-hour signed URLs minted server-side for playback — no public read.
- **Isolation**: RLS policies in 0013 (members ↔ own restaurant,
  super_admin all) + app-level checks in every action (membership +
  restaurantId match). ⚠️ Zizo: after applying 0013, verify from a
  second account that restaurant A can't read B's requests.
- Full EN/AR (dash.requests.* + admin.requests*), RTL-safe components
  (logical props, rtl icon flips). Arabic queued for the review batch.
- **0013 APPLIED 2026-08-25 (Zizo). Verified against the live DB:**
  table + private bucket exist (`request-media`, public=false, 4MB);
  **RLS proven with a real row present** — service role sees it, the
  anon key sees `[]` (not an empty-table false positive); digest cron
  reads it end-to-end through the store layer and renders
  `⚠ PRICING` correctly. Dashboard/admin pages 307 to login as
  designed; zero server errors.
- **Left in the DB on purpose**: one test row on Beit Zizo labeled
  `VERIFY-ROW …` (menu/change, pricing_flag=true) so Zizo can exercise
  the admin reply → SMS → status flow without composing one. Delete
  when done.
- Still needs a logged-in session (Zizo's smoke test): the 3-tap
  wizard incl. mic on a real phone, and the two-account cross-tenant
  read check. NOTE: TWILIO_* and RESEND_API_KEY are unset locally, so
  reply/Done SMS + emails print to the server log instead of sending;
  Beit Zizo's phone is a placeholder (813) 555-0142 anyway.

## 2026-08-25 (cont. 4) — Design pass 4: grader rebuilt as the demo closer

Full implementation of docs/design-pass-4-grader.md, verified end-to-end
with a real scan (Byblos Cafe Tampa → B 82/100).

- **Landing page** (`grader-experience.tsx` + rebuilt page): dusk hero
  with the glowing search as the focal object + branded autocomplete;
  4 glass "what we check" chips; angled blurred sample-report teaser
  with mini ring; live stats strip; 3-step how-it-works; 5-item FAQ
  accordion **with FAQPage JSON-LD**; dark final CTA anchoring back to
  the search. Old grader-tool.tsx deleted.
- **Scan moment**: staged checklist (Google → reviews → ordering →
  competition) ticking at ≥650ms/stage while the real action runs,
  progress bar, reduced-motion skips the theater.
- **Report**: animated SVG ring gauge (stroke draw + count-up; brass
  ≥80 / olive 60–79 / clay <60), verdict line by bucket; 4 category
  cards with REAL findings (positives derived from raw signals,
  negatives from scorer keys, ✓/✗/! icons + per-category
  recommendation); money slide (impact range + disclaimer + CTA to
  /calculator); **competition row from our own directory** (published
  listings within 3mi of the place's coords, 3 blurred names — the
  Byblos test showed "6 other Arab & halal restaurants within 3
  miles"); unlock gate redesigned (findings blur-gated, glass + halo
  card, same lead capture); print/save-PDF + regrade.
- **Plumbing**: Places details FieldMask + `location` + `photos.name`;
  PlaceDetails gains lat/lng/photoName; `GraderResult.competition`
  (recomputed on every cache hit from our DB — never cached, stays
  fresh as the directory grows); typographic OG card for /grader
  (ring + grade motif, EN/AR).
- **DoD screenshot committed**: docs/design-pass-4-vs-zayos.png —
  their black/cyan vs our dusk glow; a generation newer holds.
  Verified 1440 + 390px + AR RTL (Playwright captures).
- AR strings queued for Zizo's review batch as usual.

## 2026-08-25 (cont. 3) — Design pass 3: the glow pass

Full implementation of docs/design-pass-3-homepage-glow.md — verified
via Playwright full-page captures (desktop, 390px, AR RTL; the browser
pane was hidden client-side, so pane screenshots were blank — that was
the capture surface, not the page).

- **Glow system** (globals.css, documented): `glow-brass(-strong)` /
  `glow-hover` halos, `edge-light` top-edge gradient, `glass-olive` +
  `glass-pill`, `olive-luminous` (two ivory radials drifting 70/90s),
  `gradient-text-brass`, `texture-dots`, `blend-ivory/sand/olive`
  section blends, `glow-land(-now/-auto)` number pulse. All
  reduced-motion-gated.
  **Update (Zizo)**: the gradient section blends were REMOVED same
  day — "make it sharp like a modern app". Band edges are hard again;
  everything else in the glow system stays.
- **Hero**: dusk gradient (olive → #1E332A), luminance blobs,
  gradient-text "Keep it instead." (the one gradient text), glass
  trust chips, calculator card = the single glowing object (halo +
  edge light + slight glass tint, brightens on hover).
- **Sections**: $30 band moved to lit dark olive with a frosted-glass
  edge-lit panel, money numbers glow-pulse when the count lands;
  product tour frames edge-lit with reflective floor shadows + brass
  halo on the active slide + watermark parallax behind; Growth pricing
  card halo'd (others matte, glow on hover); stats-strip count glows
  once; final CTA is the darkest band with an ivory radial behind a
  glowing brass CTA.
- **Global**: glass navbar when scrolled; blended band edges; dot-grid
  texture on every light section; reveals now fade-up + scale;
  pricing / how-it-works / about / grader got textures + luminance so
  the site reads as one system.
- **DoD screenshots committed**: docs/design-pass-3-vs-linear.png
  (ours reads warmer) + docs/design-pass-3-vs-owner.png (ours reads
  dramatically more premium). Capture scripts:
  scripts/design-pass-3-shot.mjs, scripts/glow-verify-shots.mjs.
- Still pending from pass 2: the Yelp side-by-side (their bot wall
  flagged this IP; regenerate with scripts/design-pass-2-shot.mjs).

## 2026-08-25 (cont. 2) — Design pass 2: Yelp-grade /eat + site sharpening

Full implementation of docs/design-pass-2.md. All verified live
(desktop split view, 390px mobile, AR RTL).

**A1 — metro pages**: desktop 60/40 split with sticky map; dense
numbered Yelp-style rows (120px photo, live brass-star rating + count,
cuisine line, "Open until X" from listing hours, one-line Google
editorial summary, Order Now / Claim CTAs); row hover ⇄ pin pulse
both directions (pin click scrolls + flashes the row — with a jump
fallback because some engines silently drop smooth scrolling); pins
are numbered divIcons (olive, brass = claimed) matching row numbers;
sticky filter bar + sort (Recommended / Rating / Distance w/
geolocation / A–Z — Recommended is intentionally stable-ordered:
sorting by lazily-loaded live ratings would reshuffle rows under the
reader; only the explicit Rating sort does that). Mobile: list-first,
floating Map pill → full-screen map + snap card carousel (swipe ⇄ pan,
z-70 to clear the navbar).

**A2 — detail pages**: photo-collage hero (big + 2×2, Yelp pattern)
with olive scrim overlay (name/cuisine/live rating), "See all photos"
lightbox (keyboard nav, Google attribution); two-column body — about
(custom_blurb > editorialSummary), amenity pills (open-until / call /
directions), quiet halal row, hours accordion (today bolded, falls
back to live Google hours), map thumbnail → directions; sticky action
card (claimed: brass Order Now + phone + directions; unclaimed: claim
pitch anchoring to the form — every unclaimed page is a claim landing
page); nearby rail (6 closest, haversine); breadcrumb +
BreadcrumbList JSON-LD.

**A3**: every missing/failed photo state renders the designed
placeholder (olive arch motif + initial) — including img onError
(photo-proxy rate limit) fallbacks. All async loads skeleton-shimmer.

**B — site-wide**: card radius 24→20px + `card-crisp` (tight
olive-tinted shadow, 1px inner ivory line); heading letter-spacing
-0.01em; `press` (0.98 scale) + chip-pop micro-interactions; skeleton
shimmer system; Carto Positron light map tiles (modernizes the whole
map, ODbL+CARTO attribution kept); live stats strip (real published
counts, CountUp) on /eat landing + homepage now-serving strip; Grader
gets a result-skeleton while grading (estimator already had the
odometer); homepage hero ambient 30s gradient drift; 150ms marketing
page-transition fade (template.tsx). Everything reduced-motion-gated
in globals.css.

**Enrichment plumbing**: shared `useListingEnrichment` hook
(IntersectionObserver, one Places call per listing, feeds rows/hero/
rail); replaced places-enrichment.tsx + card-photo.tsx. Photo-proxy
rate limit 60→150/min (collage + rows + rail all stream through it).

**DoD gap**: the side-by-side vs yelp.com screenshot — Yelp's bot
wall blocked all capture attempts from this IP (network-flagged);
`scripts/design-pass-2-shot.mjs` is ready and the capture will be
committed as docs/design-pass-2-comparison.png once the block cools
down. Our side is captured and looks the part.

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
