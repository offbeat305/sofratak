# Sofratak — Progress Log

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
