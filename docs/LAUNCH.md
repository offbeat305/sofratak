# Sofratak — Launch Runbook

Step-by-step from this repo to a live production platform. Work top to
bottom; each section says what you do vs. what's already handled in code.
Keep `.env.local` values out of chat/screenshots while doing this.

## 1 · Supabase (production readiness)

- [ ] Apply any unapplied migrations in order (`supabase/migrations/`) —
      as of this writing: `0008_rls_lockdown.sql`, `0009_funnel_events.sql`.
- [ ] **After applying 0008**: run one test checkout WITH an offer code
      applied and confirm the discount lands and `use_count` increments
      (the redemption path uses the service role, so it should be
      unaffected — this verifies it). Baseline before 0008 is recorded in
      PROGRESS.md (order Z156, code PHASE8TEST).
- [ ] Storage: the `menu-images` bucket (public read, 4MB,
      jpeg/png/webp) already exists in the current project. For a fresh
      project, create it with the same settings (Dashboard → Storage, or
      POST /storage/v1/bucket) — menu photo uploads depend on it.
- [ ] Enable backups: Supabase Dashboard → Database → Backups. Daily
      backups come with the Pro plan; enable **PITR** (point-in-time
      recovery) for a real restore window. This is the primary backup
      story — no app-side backup job exists. (Storage bucket contents
      are separate from DB backups — menu photos aren't in PITR.)
- [ ] Auth hardening: Dashboard → Auth → enable leaked-password
      protection; review email templates (they'll be diner/owner-facing).
- [ ] Confirm the super-admin account exists in prod:
      `npx tsx scripts/promote-super-admin.ts <email>` (after creating
      the login with `scripts/create-owner.ts` if needed).

## 2 · Vercel project

- [ ] Import the repo into Vercel (framework: Next.js — zero config).
- [ ] Set env vars (copy names from `.env.example`; values from your
      password manager, NOT from any chat log):
      - `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
      - `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` —
        **live keys** (`sk_live_` / `pk_live_`)
      - `STRIPE_WEBHOOK_SECRET` (created in step 4)
      - `IMPERSONATION_SECRET` (generate fresh: `openssl rand -hex 32`)
      - `GOOGLE_PLACES_API_KEY` (restricted — step 6)
      - `RESEND_API_KEY`, `LEADS_EMAIL`
      - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`,
        `TWILIO_WEBHOOK_URL` (step 5)
      - `CRON_SECRET` (generate fresh: `openssl rand -hex 32`) — Vercel
        automatically sends it as the bearer token for scheduled crons
      - `NEXT_PUBLIC_SITE_URL=https://www.sofratak.com`
      - `NEXT_PUBLIC_WHATSAPP_NUMBER`
- [ ] Confirm both crons appear under Settings → Cron Jobs after the
      first deploy (daily automations 15:00 UTC; weekly report Mon 13:00 UTC).

## 3 · Domains & DNS

- [ ] Add `www.sofratak.com` and `sofratak.com` to the Vercel project
      (apex redirects to www — canonical domain).
- [ ] Add the **wildcard** domain `*.sofratak.com` to the same project —
      this powers `{restaurant}.sofratak.com` storefronts. The subdomain
      → storefront rewrite is already implemented in `src/middleware.ts`;
      nothing to code.
- [ ] At your DNS provider: `www` and `*` as CNAME to
      `cname.vercel-dns.com`, apex per Vercel's instructions (A record).
- [ ] After DNS settles, verify `https://beitzizo.sofratak.com` serves
      the demo storefront.

## 4 · Stripe (live mode)

- [ ] Complete live-mode activation on the Stripe account (business
      details, bank account).
- [ ] Developers → Webhooks → add endpoint
      `https://www.sofratak.com/api/webhooks/stripe` with events:
      `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted`, `invoice.payment_failed`,
      `invoice.payment_succeeded`. Copy the signing secret into
      `STRIPE_WEBHOOK_SECRET` on Vercel and redeploy.
- [ ] End-to-end test in **test mode** first (still owed from Phase 7):
      one full subscription checkout from Dashboard → Settings → Billing,
      then a cancel — confirm the status flips and the CSV export email
      arrives. Then repeat a $1-tier smoke test in live mode if desired.
- [ ] Connect: onboard the first real restaurant via Settings → Payouts
      and confirm a live order settles to their account.

## 5 · Twilio

- [ ] Create the account, buy one US number (shared across all
      restaurants — see below), set `TWILIO_*` env vars on Vercel.
- [ ] Point the number's "A message comes in" webhook at
      `https://www.sofratak.com/api/webhooks/twilio-sms` (POST) and set
      `TWILIO_WEBHOOK_URL` to that exact URL — signature validation
      compares against it byte-for-byte.
- [ ] Register the number for A2P 10DLC (US carrier requirement for
      business SMS) — without it, delivery rates will be poor.
- [ ] Send a test order-confirmation SMS and a test STOP reply; confirm
      the STOP suppresses marketing sends (marketing_optins row flips).
- [ ] Post-launch upgrade path: per-restaurant numbers (better branding
      and deliverability) — the adapter already isolates this in
      `src/lib/sms/twilio.ts`.

## 6 · Google Cloud (Grader)

- [ ] Restrict `GOOGLE_PLACES_API_KEY`: API restrictions → only
      "Places API (New)" + "PageSpeed Insights API". (It's a
      server-side key — IP restriction isn't practical on Vercel's
      shifting egress IPs; API restriction is the meaningful control.)
- [ ] Set a **billing budget + alert** on the project (e.g. $25/mo).
      The app's daily caps (`GRADER_*_DAILY_CAP`) are a backstop, not a
      billing control.

## 7 · Resend (email)

- [ ] Verify the `sofratak.com` sending domain (SPF + DKIM records).
- [ ] Set `RESEND_FROM` if you want a branded sender (defaults to
      Resend's onboarding address otherwise — fine for testing, not for
      launch).

## 8 · Known limitations to track post-launch

- **Rate limiting is in-memory and per-instance.** On Vercel, each warm
  serverless instance keeps its own counters, so the effective global
  limit is (limit × concurrent instances). It stops single-source
  hammering, which is the launch threat model — but the planned upgrade
  is a Redis-backed limiter (e.g. Upstash) shortly after launch. The
  swap is contained to `src/lib/rate-limit.ts`.
- Campaign email open/click tracking isn't implemented (sends and
  failure counts only).
- Loyalty is single-location; multi-location groups are a later phase.
- The Grader's daily API caps fail open if Supabase is unreachable
  (deliberate — an infra hiccup shouldn't kill the lead funnel); the
  Google Cloud billing cap in §6 is the hard stop.

## 9 · Launch-day smoke test (15 minutes)

1. `https://www.sofratak.com` loads, EN + AR.
2. `https://beitzizo.sofratak.com` → place a real $ test order (then
   refund it from the dashboard).
3. Kitchen screen rings; order status page updates; diner SMS arrives.
4. Dashboard: Today tiles, funnel card, CSV exports.
5. `/grader`: grade a real restaurant, email unlock → lead row.
6. `/admin`: tenant list loads; demo reset works.
7. Billing: subscription checkout (test-mode toggle) completes.
8. Crons: `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/weekly-report`
   returns `{"ok":true,...}`.
