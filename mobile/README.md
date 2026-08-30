# Sofratak mobile (diner app)

A thin **Capacitor** wrapper around the live web storefront
(`www.sofratak.com`) — not a second codebase. The app opens the real
Next.js site in a native WebView, so every ordering feature (menu,
cart, checkout, order status, EN/AR) ships from the one web app the
moment it's live. No local business logic, no offline mode, nothing to
keep in sync by hand.

Decided with Zizo (Aug 2026): diner ordering app first (not the
owner/kitchen apps), built by wrapping the existing site rather than a
from-scratch native rebuild — fastest path to "an app in the App
Store," and every future web feature is automatically in the app too.

## What's here

- `capacitor.config.ts` — points the app at `SOFRATAK_APP_URL`
  (defaults to production). Override for testing against a preview
  deploy or a specific restaurant subdomain, e.g.:
  `SOFRATAK_APP_URL=https://beitzizo.sofratak.com npx cap sync`
- `android/` — native Android project (Gradle). Committed to git, per
  Capacitor's own convention — this is a real project you open in
  Android Studio, not a build artifact.
- `ios/` — native Xcode project. Same deal, opened in Xcode.
- App icon: cropped from the brand cloche+growth-chart mark
  (`public/brand/logo-full.png`), centered on the ivory brand
  background. **Placeholder** — fine for internal testing, but worth a
  proper design pass (a designer or Zizo eyeballing it at actual
  device size) before a real App Store / Play Store submission.

## Running it

```
npm install
npx cap sync          # picks up capacitor.config.ts changes
npm run open:ios       # opens Xcode — needs a Mac with Xcode installed
npm run open:android   # opens Android Studio — works on Mac/Linux/Windows
```

From Xcode or Android Studio, run on a simulator/emulator or a
connected device like any other native app.

**Nothing in this folder can be built into a real app from this Claude
session** — iOS builds require Xcode (Mac-only, needs to run locally),
and while Android *could* theoretically build headlessly, actually
signing and shipping either one requires accounts only Zizo can create
(see below). This scaffold is what you open on your own machine when
you're ready to go further.

## Still needed before this can ship to real users

1. **Apple Developer Program** account ($99/yr) — required to run on a
   physical iPhone beyond a 7-day free provisioning profile, and
   required to submit to the App Store. Sign up at
   developer.apple.com.
2. **Google Play Console** account ($25 one-time) — required to
   publish to the Play Store. play.google.com/console.
3. **Bundle/package ID**: currently `com.sofratak.app` — a
   placeholder. Fine to keep, but worth deciding for real before
   either store listing is created (can't easily change later).
4. **App Store / Play Store listing assets**: screenshots (per device
   size), a real 1024×1024 icon (App Store rejects icons with
   transparency or rounded corners baked in — ours is flat, so it
   qualifies, but should get a real design pass), a short + long
   description, privacy policy URL (the site should already have one
   by launch), support URL/email.
5. **Push notifications** (order-ready alerts, etc.) aren't wired up
   yet — Capacitor supports this (`@capacitor/push-notifications` +
   Firebase Cloud Messaging for Android / APNs for iOS) but it's a
   real feature to design and build, not part of this scaffold.
6. **App Transport Security / native-feel polish**: status bar color,
   splash screen duration, and whether links that would normally open
   a new browser tab (e.g. Stripe Checkout) need `@capacitor/browser`
   instead of loading inside the wrapper — worth a real device test
   pass once the web app itself is live (currently gated behind
   `MAINTENANCE_MODE`, so the wrapped app just shows the coming-soon
   page for now, same as the website).

None of the above blocks having this ready to open and poke at now —
they're the steps between "scaffold exists" and "actual users have it
on their phone."
