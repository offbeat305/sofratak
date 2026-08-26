# Sofratak — Project Constitution

## Sessions (read WORKING.md FIRST, before anything else)
Two sessions work this repo — the Claude Code terminal session and Cowork —
and **only one writes at a time**. `WORKING.md` at the repo root is the lock:
it names who currently holds it. Read it before your first edit, claim it if
free, stop if held by someone else. Release it on handoff. Claiming and
releasing are commits, so the other session can see them. Full protocol is in
the file.

## Product
Multi-tenant restaurant operating system. Each restaurant gets a branded ordering storefront on its own subdomain, a dashboard (orders, menu, CRM, marketing, reports), and diners order + pay online. I (platform owner) manage everything from a super-admin panel.

## Tech stack (do not deviate without asking)
- Next.js 14+ App Router + TypeScript, one monorepo
- Supabase: Postgres + Auth + Row Level Security for tenant isolation
- Stripe Connect: each restaurant is a connected account, money goes to them, platform can take a per-order fee. Card data never touches our servers — Stripe Checkout/Elements only. Money stored in cents (integers).
- Twilio (SMS), Resend (email)
- Vercel hosting, wildcard subdomains: {restaurant}.sofratak.com
- Tailwind CSS with the Sofratak design tokens from docs/branding.md. shadcn/ui allowed but always restyled to brand — never default shadcn look.
- next-intl: English + Arabic with TRUE RTL (mirrored nav, reversed arrows, native-feeling forms). Never just right-align LTR layouts.
- Otter integration: isolated module /lib/integrations/otter/ behind an interface with a MOCK implementation. Nothing else imports Otter directly. Real API later.

## Roles & structure
- Roles: super_admin (me), restaurant (owner/staff, scoped to their tenant), diner (customers).
- Every tenant table has restaurant_id + RLS policy. No cross-tenant reads ever. Write RLS tests.
- Route groups: app/(marketing) public site · app/(storefront) diner ordering via subdomain middleware · app/(dashboard) restaurant · app/(admin) super admin.

## Business constants (from Zizo, Aug 2026 — do not change without asking)
- Pricing tiers (Stripe subscriptions): Starter $249/mo · Growth $349/mo · Partner $499/mo, per location, month-to-month. No setup fee for first 20 clients.
- Per-order fee: diner pays flat $0.79/order (pickup or delivery), shown as its own "Service fee" line at checkout. Restaurant pays $0 commission on food. Catering: 5% diner-paid service fee, capped at $50.
- Stripe processing (2.9% + $0.30) passes through to the restaurant at cost. Stripe Connect: food revenue settles to the restaurant, $0.79 routes to Sofratak.
- Data is the restaurant's: every list (customers, orders) exportable to CSV in one click. Sales promise — never make export hard.
- Otter is NOT confirmed (partner application pending). All order routing goes through the `OrderChannel` adapter interface; ship fallbacks (kitchen web view, SMS/printable ticket) until Otter lands. When Otter API access is approved, wiring its adapter jumps to the top of the queue.
- Ask Zizo before any decision that changes pricing, fees, or what the restaurant/diner sees at checkout.

## Phases (build in order, never skip ahead — renumbered by Zizo Aug 2026)
- Phase 0 ✅ design system + styleguide (marketing site + calculator moved to Phase 8)
- Phase 2: diner storefront — menu w/ modifiers + EN/AR item names, cart, checkout (pickup/delivery, scheduled, tip 100% to restaurant, $0.79 fee line, Stripe), SMS confirmation, order status page, restaurant branding, guest checkout w/ required phone, SEO + schema.org. Demo restaurant: "Beit Zizo Shawarma", 25-item EN/AR menu. Done when a test order completes end-to-end in <90s on a phone.
- Phase 3: order routing — `OrderChannel` adapter: (1) kitchen web view w/ new-order alert + accept/preparing/ready/complete, (2) SMS + printable ticket fallback, (3) Otter stub. Lifecycle events drive diner SMS. Unaccepted-order alerting: never lose an order silently.
- Phase 4: owner dashboard — today view, orders history w/ search + itemized full/partial refunds (Owner.com can't; we exploit that), menu manager (phone-simple), hours/holiday/delivery-zone/pause-orders, CRM w/ tags + CSV export, settings (branding, Stripe Connect onboarding, owner vs staff roles).
- Phase 7 (early, right after 4): Stripe Billing for the 3 tiers, dunning, cancel flow (auto-email full CSV exports on cancel — sales weapon). Internal Sofratak admin: onboarding, menu import helper (text/photo/PDF → draft menu), impersonation w/ audit log, tenant health.
- Phase 5: marketing tools (Growth+) — SMS campaigns (TCPA: opt-in at checkout, STOP, quiet hours), email campaigns, automations (30-day win-back w/ offer code, post-order review request), offer codes, loyalty v1 (every Nth order).
- Phase 6: weekly Monday owner report (email + SMS link) — orders/revenue/avg ticket vs prior week, new vs returning, best sellers, "estimated savings vs 25% marketplace rate" (never "guaranteed"), one suggested action w/ deep link. EN/AR, under one screen.
- Phase 8: launch polish — public sofratak.com marketing site EN/AR + pricing page + Tampa & Dearborn/Detroit city pages, savings estimator (the demo closer), demo mode (seeded, resettable), per-restaurant order funnel analytics, RLS audit + rate limiting + webhook signature checks + backups.
- Build order: 2 → 3 → 4 → 7 → 5 → 6 → 8. Ship each phase to the demo restaurant before moving on.
- Payroll: permanently out of scope.

## Local dev fallbacks (until real keys exist)
- No Docker / Supabase / Stripe / Twilio credentials on this machine yet. Data access goes through `src/lib/db/` (interface w/ local JSON store fallback; Supabase impl + SQL migrations ready in /supabase). Payments via `src/lib/payments/` (mock provider until Stripe keys). SMS via `src/lib/sms/` (console/store channel until Twilio keys). Swap = env vars, no code changes outside the adapter.

## Quality bar
- Mobile-first (restaurant owners live on phones). Accessible: visible focus, strong contrast, reduced motion respected.
- Conventional commits. After each session update docs/PROGRESS.md with what was built + what's next.
- Any decision not covered here: propose and ask before implementing.
