# Sofratak — Build Roadmap for Claude Code

**From:** Business side (Zizo / Offbeat Creative LLC)
**To:** Claude Code
**Date:** Aug 2026

Step 1 is done. This is everything else, in build order. Work through the phases top to bottom. If anything below was already covered in step 1, skip it and move on. Ask Zizo before making any decision that changes pricing, fees, or what the restaurant/diner sees at checkout.

---

## Business constants (do not change without asking Zizo)

- **Product:** Sofratak — branded online ordering sites for independent restaurants + owner dashboard. Multi-tenant SaaS: one codebase, many restaurants, each on its own domain/subdomain.
- **Target user:** Family-run Arab, Middle Eastern, Mediterranean, and halal restaurant owners. Not tech-savvy. Everything they touch must be simple and bilingual.
- **Pricing tiers (Stripe subscriptions):** Starter $249/mo · Growth $349/mo · Partner $499/mo, per location, month-to-month. No setup fee for first 20 clients.
- **Per-order fees:** Diner pays a flat **$0.79** per order (pickup or delivery), shown as its own line at checkout ("Service fee"). Restaurant pays $0 commission on food. Catering orders: 5% diner-paid service fee, capped at $50.
- **Payments:** Stripe (2.9% + $0.30 passes through to the restaurant at cost). Use Stripe Connect so food revenue settles to the restaurant's account and the $0.79 fee routes to Sofratak.
- **Stack:** Supabase (DB/auth), Twilio (SMS), hosting per current setup. Keep monthly infra cost lean — the model assumes ~$75/mo base.
- **Copy rules for anything user-facing:** short, confident, practical. Never use: ecosystem, synergy, revolutionary, disruptive, omnichannel, digital transformation. Never "guaranteed savings" — always "estimated" or "potential savings." Slogan: "Take Control. Own Your Growth." / Arabic: شغلك تحت سيطرتك

## Cross-cutting requirements (apply to every phase)

1. **Bilingual EN/AR with full RTL support** on the diner-facing site and dashboard. Language toggle everywhere. Menu items can have English + Arabic names.
2. **Mobile-first.** Most diners order from phones; most owners will check the dashboard from phones.
3. **Multi-tenant from the ground up.** Row-level security in Supabase per restaurant. One restaurant can never see another's data.
4. **Data is the restaurant's.** Every list (customers, orders) exportable to CSV in one click. This is a sales promise — never make export hard.
5. **Otter is not confirmed yet.** Partner application is in progress. Build all order-routing behind an adapter interface (`OrderChannel`) so Otter can be plugged in later. Until then, ship fallbacks (see Phase 3).

---

## Phase 2 — Diner-facing ordering storefront

The money page. A branded, fast ordering site per restaurant.

- Menu with categories, item photos, modifiers (size, spice, add-ons), item-level EN/AR names and descriptions.
- Cart → checkout: pickup or delivery toggle, scheduled orders (ASAP + pick a time), tip option (100% to restaurant), Stripe payment, $0.79 service fee line, order confirmation screen + SMS to diner.
- Restaurant branding: logo, colors, cover photo, hours, address/map, halal badge, links to Instagram/Google reviews.
- Guest checkout allowed; phone number required (feeds CRM). Optional account creation after first order.
- Order status page for the diner (received → preparing → ready/out for delivery).
- SEO basics per site: proper meta, schema.org Restaurant + Menu markup, fast load.

**Done when:** a demo restaurant ("Beit Zizo Shawarma" — build it with a realistic 25-item menu, EN/AR) can take a real test order end to end in under 90 seconds on a phone.

## Phase 3 — Order routing to the kitchen

- `OrderChannel` adapter interface. Implementations, in priority order:
  1. **Kitchen web view** (v1 default): a tablet-friendly page showing incoming orders with loud new-order alert, accept / preparing / ready / complete flow. Works on any tablet the restaurant already has.
  2. **SMS + printable ticket fallback** for owners who won't keep a browser open.
  3. **Otter adapter** — stub it now with the interface and mock; wire it when API access lands.
- Order lifecycle events drive diner SMS updates automatically.
- Failure handling: if an order isn't accepted in X minutes, alert the owner by SMS/call and flag it in the dashboard. Never lose an order silently.

**Done when:** a test order placed on the storefront rings on a kitchen tablet, and status changes flow back to the diner's status page + SMS.

## Phase 4 — Owner dashboard

- Today view: live orders, today's revenue, week-to-date vs last week.
- Orders history with search/filter/refund (itemized refunds — full and partial per line item; Owner.com's inability to do this is a known complaint we exploit).
- Menu manager: add/edit items, photos, prices, modifiers, mark sold-out, EN/AR fields. Simple enough for a 55-year-old owner on a phone.
- Hours & holiday overrides, delivery zone/fee settings, pause orders button (big and obvious).
- CRM: customer list auto-built from orders (name, phone, order count, total spent, last order date), tags (VIP, lapsed), CSV export.
- Settings: branding, Stripe Connect onboarding, staff logins (owner vs staff roles).

**Done when:** the demo restaurant owner can change a price, pause orders, and issue a partial refund from a phone without help.

## Phase 5 — Marketing tools (Growth tier and up)

- SMS campaigns via Twilio: compose (EN/AR templates), pick audience segment (all / VIP / lapsed 30+ days), send or schedule. Hard requirement: TCPA compliance — opt-in checkbox at checkout, STOP handling, quiet hours.
- Email campaigns (basic): same segments, simple templates.
- Automations v1: (a) lapsed-customer win-back after 30 days with offer code, (b) post-order Google review request with direct review link.
- Offer codes: percent or dollar off, min order, expiry, usage caps.
- Loyalty v1 (simple): every Nth order gets a reward the owner defines.

**Done when:** a lapsed-customer SMS campaign can be sent to a segment of the demo restaurant's customers and an offer code from it redeems at checkout.

## Phase 6 — Weekly owner report

The retention feature. Every Monday morning, each owner gets a plain-language report by email + SMS link:

- Orders, revenue, average ticket vs prior week.
- New vs returning customers; best-selling items.
- **Estimated savings line:** what this week's direct orders would have cost on a 25% blended marketplace rate — worded as "estimated," never "guaranteed."
- One suggested action ("12 customers haven't ordered in 30 days — send them a win-back offer" with a deep link that pre-builds the campaign).
- EN/AR per owner preference. Keep it under one screen.

**Done when:** the Monday job generates a correct report from the demo restaurant's real order data.

## Phase 7 — Billing & internal admin

- Stripe Billing for the three tiers; dunning emails on failed payment; downgrade/cancel flows (month-to-month, no lock-in — on cancel, auto-email the owner their full CSV exports; keeping this promise is a sales weapon).
- Internal admin panel (Sofratak staff only): create/onboard a restaurant, menu import helper (paste text or upload photo/PDF of a menu → structured draft menu for review), impersonate-owner support mode with audit log, tenant health view (orders/day, last login, churn risk).

**Done when:** a new restaurant can go from signed to live storefront in under a day of admin work.

## Phase 8 — Launch polish & sales support

- **Savings estimator page** on sofratak.com: prospect enters monthly app orders + average ticket → estimated annual commission cost vs Sofratak cost. This is the demo closer (competitors run graders; ours ends the sales demo).
- Public sofratak.com marketing site: EN/AR, the slogan, pricing page with the three tiers, city pages for Tampa and Dearborn/Detroit (competing directly with Zay-OS's SEO pages).
- Demo mode: a polished fake-restaurant flow for live sales meetings (seeded data, resettable).
- Analytics: per-restaurant order funnel (visits → carts → orders) surfaced in the dashboard; basic error monitoring/alerting for us.
- Load/security pass: RLS audit, rate limiting, webhook signature checks (Stripe/Twilio), backup policy.

**Done when:** Zizo can run a full sales demo — storefront order → kitchen tablet → dashboard → savings estimate — on his phone with no engineer present.

---

## Build order recap

Phase 2 → 3 → 4 → 7 (billing early enough to sign real clients) → 5 → 6 → 8. Ship each phase to the demo restaurant before moving on. When Otter API access is approved (business side is preparing the application), wiring the Otter adapter jumps to the top of the queue.
