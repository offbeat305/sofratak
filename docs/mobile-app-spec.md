# Diner Mobile App — Spec

**From Zizo (Aug 2026), via Cowork.** He wants a real native diner ordering
app — "amazing on phone," native feel, its own design — built now, in
parallel with the remaining launch checklist (`docs/LAUNCH.md`), so the app
and the website can go live together. Not a mini-project on the side: this
is a second client for the same product, and should be scoped and staffed
that way.

**This supersedes `mobile/`** (the Capacitor WebView wrapper shipped
2026-08-30 by Cowork). That was a fast, low-effort placeholder — literally
the website in a native shell, zero custom UI. Zizo has now explicitly said
he wants a real native-feeling app instead, not a wrapped webview. Leave
`mobile/` in the repo for now (harmless, and genuinely useful later — see
"Optional: ship the wrapper first" below) but the real work described here
is a separate, proper build.

---

## 1. Decision needed from Zizo before starting: stack

Not yet confirmed — flag this back to him before sinking real time in.
**Recommendation: React Native + Expo.**

- Same language (TypeScript) and a lot of the same mental model as the
  Next.js app already — lowest ramp-up cost, one team can own both.
- One codebase for iOS + Android, instead of two fully separate native
  builds (Swift/SwiftUI + Kotlin/Compose) — that alternative is a much
  bigger, slower, costlier project and isn't what "native-feeling" requires.
  React Native screens ARE native (native navigation, native gestures,
  native components under the hood) — "native-feeling" does not mean
  "must be written in Swift."
- Expo specifically (vs bare React Native) because it removes most of the
  native-build-toolchain pain (no local Xcode project to hand-maintain,
  EAS Build can produce real .ipa/.apk in the cloud without a Mac in the
  loop for every build) — relevant since this repo has been built and
  deployed entirely without local Xcode/Android Studio access so far.

If Zizo wants something else (Flutter, fully-native-per-platform, etc.),
get that in writing before starting — this choice is expensive to reverse
once screens exist.

## 2. Scope: v1 mirrors Phase 2 exactly, nothing more

Same feature set as the diner storefront (`docs/` Phase 2 definition), no
more, no less, for the same reason Phase 2 was scoped tight originally —
ship the core loop, expand later:

- Menu browse, modifiers, EN/AR item names/RTL.
- Cart, checkout: pickup/delivery, scheduled orders, tip (100% to
  restaurant), the $0.79 service fee line, Stripe payment.
- Order confirmation, live order status.
- Guest checkout with required phone (no account/login for v1, matching
  web).
- Restaurant branding (colors/logo per tenant) carried into the app shell
  the same way the web storefront themes itself per subdomain.

Explicitly OUT of v1: owner dashboard, kitchen screen, loyalty/marketing
features, anything from Phase 4/5/6. Diner ordering only, per Zizo's answer
when this was scoped.

**One legitimate net-new feature for v1, because it's a real native app
now and this is cheap to add while building the screens anyway:** push
notifications for order-status changes (accepted / preparing / ready).
The web app has no equivalent (it relies on SMS) — worth it here since
it's the one thing a native app does meaningfully better than a mobile
browser tab for this exact use case. Confirm with Zizo before building —
listed here as a recommendation, not a decision.

## 3. The real technical dependency: an API layer for the app to call

**This is the part most likely to get skipped and cause pain later —
read this section first.** The web storefront's cart/checkout/order-status
logic today is built as Next.js Server Actions (`"use server"` functions),
which are a framework-specific RPC mechanism over a proprietary wire
format — they are not a stable, callable HTTP API. A React Native app
cannot call a Server Action directly.

Two paths, pick one before writing app screens against anything:

1. **Add real REST/JSON API routes** (`src/app/api/mobile/...` or similar)
   that wrap the same underlying logic the Server Actions call into
   (menu fetch, cart operations, order placement, order status poll/push).
   The business logic (pricing, fee calculation, tenant isolation via RLS)
   stays shared; only the transport layer gets duplicated. This is the
   standard approach and the one to default to.
2. Extract the shared logic into plain functions callable from BOTH a
   Server Action (web) and a Route Handler (app), so there's no
   real duplication, just two thin entry points. Preferable if time allows
   — do this if the Server Actions aren't already too tangled with
   Next.js-specific request context (cookies, headers) to extract cleanly.

Either way: **RLS and tenant isolation rules apply identically** — the
app is just another client, same as a browser. No special-cased trust for
"it's our own app calling this."

## 4. Payments

Web uses Stripe Checkout (hosted redirect page) — wrong UX for a native
app. Use **Stripe's React Native SDK** (`@stripe/stripe-react-native`,
PaymentSheet) for a proper in-app native payment flow, still hitting the
existing Connect account structure (direct charges to the restaurant,
platform fee same as web — no changes to money movement, only to how the
card entry UI is presented).

## 5. What Zizo needs to do (same external-account pattern as the web launch)

- Apple Developer Program ($99/yr) and Google Play Console ($25
  one-time) — required regardless of stack, same as noted in
  `mobile/README.md`.
- Decide the real bundle ID (`com.sofratak.app` is a placeholder from the
  earlier wrapper) before either store listing is created.
- Store listing assets eventually: screenshots, description, privacy
  policy URL, support contact — later-stage, not a blocker to starting
  the build.

## 6. Optional: ship the wrapper first as a stopgap

Since `mobile/` (the Capacitor wrapper) already exists and works today —
worth Zizo's call, not a default — it could go out to app stores now as
a placeholder "app" (same content as the coming-soon page today, the
real storefront once `MAINTENANCE_MODE` lifts) while the real native app
is built behind it, then get replaced with the real submission when v1
is ready. Pro: something real in the stores sooner, and stores' own review
lead time is absorbed early. Con: two submissions instead of one, and a
placeholder app is a real thing to explain if anyone downloads it in the
meantime. Flag to Zizo, don't decide unilaterally.

## 7. Honest timeline expectation

"Launch together" is the goal, not a guarantee the timelines naturally
match. A native ordering app with a real payment flow, EN/AR + RTL, and
app-store review cycles (which have their own multi-day-to-week turnaround
per submission, outside anyone's control) is a genuinely multi-week build
even reusing all the backend logic and business rules already proven out
on web — this is not a reskin, it's building the ordering UI a second
time in a different framework. Set that expectation with Zizo explicitly
rather than let "in parallel" quietly become a deadline.

## Definition of done (v1)

- [ ] Stack decision confirmed in writing (Zizo, §1).
- [ ] API layer (§3) built and covers: menu fetch, cart, checkout,
      order placement, order status — verified against RLS the same way
      every other tenant-facing surface is.
- [ ] Full ordering flow works end-to-end on a real iOS device and a real
      Android device: browse → cart → checkout (Stripe PaymentSheet) →
      confirmation → live status.
- [ ] EN/AR + RTL verified on-device (not just simulator — RTL layout bugs
      often only show on real devices/keyboards).
- [ ] Push notifications for order status, if approved per §2.
- [ ] Per-tenant branding carries into the app shell.
- [ ] `docs/PROGRESS.md` updated same as every other phase.
