# Sofratak Diner App (React Native + Expo)

The real native diner ordering app (docs/mobile-app-spec.md) — NOT the
Capacitor webview wrapper in `mobile/`, which it supersedes. Menu → cart →
checkout (Stripe PaymentSheet) → live order status, EN/AR with instant RTL,
per-tenant branding, push notifications for order status.

## How it talks to the backend

Everything goes through the REST layer at `/api/mobile/*` (see
`../src/app/api/mobile/` and `../src/lib/mobile/api.ts` — the wire types in
`src/types.ts` here must stay in lockstep with those serializers). The app
is just another client: server-side re-pricing, RLS, and rate limits apply
identically to web.

Base URL resolution (`src/api.ts`): `EXPO_PUBLIC_API_URL` env var →
`app.json` `extra.apiUrl` → the Expo dev host on port 3000 → production.

## Run it (dev)

```bash
# terminal 1 — backend (repo root). Empty Stripe key = mock payments,
# which auto-approve so the full flow works without PaymentSheet:
STRIPE_SECRET_KEY="" npx next dev

# terminal 2 — the app:
cd mobile-app && npx expo start
```

- **Physical phone (recommended, zero Mac setup):** install "Expo Go"
  from the App Store / Play Store, scan the QR from `expo start` (same
  Wi-Fi). Set `EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3000` first.
- **Web smoke test:** `npx expo start --web` (uses `src/stripe.ts` web
  stub; native modules excluded).
- Expo Go cannot run the real PaymentSheet or receive remote push —
  those need a dev build or EAS build (below). Mock mode covers the rest.

## Real builds (EAS — no local Xcode/Android Studio needed)

```bash
npm i -g eas-cli
eas login            # Zizo's Expo account
eas build:configure  # creates the EAS project id (also enables push tokens)
eas build --platform ios --profile preview      # installable .ipa
eas build --platform android --profile preview  # installable .apk
```

Requires (docs/mobile-app-spec.md §5, Zizo's accounts): Apple Developer
Program ($99/yr), Google Play Console ($25 once). The bundle id
`com.sofratak.app` in `app.json` is a PLACEHOLDER — Zizo confirms the real
one before any store listing is created.

## Payments

`src/stripe.native.ts` presents PaymentSheet with the client secret from
`POST /api/mobile/orders`; direct charges on the restaurant's connected
account with the $0.79 application fee, identical money movement to web.
After the sheet succeeds the app calls `/confirm` (server re-verifies with
Stripe — the app's word is never trusted); the `payment_intent.succeeded`
webhook is the backstop. `src/stripe.ts` is the web stub Metro picks for
the web target.

## Push

`src/push.ts` registers an Expo push token (best-effort: declining the
permission or running in Expo Go just means no token — SMS still covers
status updates). The token rides on the order (migration 0016); the server
pushes on payment confirmation and every kitchen status change.
