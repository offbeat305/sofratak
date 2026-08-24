# Delivery API Applications — DoorDash Drive + Uber Direct

Per `docs/marketplace-vision.md` §Sequencing (5): white-label courier
APIs, diner-paid flat delivery fee, Sofratak never pays or hires
drivers. Approval has weeks-long lead time → **apply now**, integrate
post-launch through the existing `OrderChannel` adapter.

Both applications require creating accounts and submitting business
details — that's a Zizo task (Claude can't create accounts for you).
This doc makes each a ~10-minute job.

## What to have ready (both applications)

- Legal business name: Offbeat Creative LLC (Tampa, FL) + EIN
- Business website: https://www.sofratak.com (better if already live —
  another reason DNS goes first in LAUNCH.md)
- What you're building (canonical answer, keep consistent):
  > "Sofratak is a commission-free online ordering platform for
  > independent restaurants. We're integrating white-label delivery so
  > our restaurants' direct online orders can be fulfilled by courier —
  > order volume across multiple restaurant locations in Tampa Bay and
  > Metro Detroit."
- Expected volume: give an honest ramp (e.g. "10–50 deliveries/week at
  launch, growing with restaurant count").

## 1 · DoorDash Drive

- Start: https://developer.doordash.com → Sign Up (developer account is
  instant; sandbox access is immediate).
- IMPORTANT current caveat (from their own docs): **production access
  to the Drive API is restricted** and they don't commit to a
  certification timeline. Their guidance: register interest / submit a
  production access request early — which is exactly why this is being
  done now. After development they review + schedule a demo before
  granting production keys.
- Action items:
  1. Create the developer account, generate sandbox credentials.
  2. Submit the production-access interest form (linked from their
     Drive docs / FAQs) describing the use case above.
  3. Forward whatever reply arrives — the timeline shapes when the
     integration gets built.

## 2 · Uber Direct

- Start: https://merchants.uber.com/uber-direct.html (sign-up flows
  through merchants.ubereats.com — being on the Uber Eats marketplace
  is NOT required).
- Developer docs: https://developer.uber.com/docs/deliveries/overview
- Action items:
  1. Sign up as a merchant (company info + business type).
  2. Request Direct API access from the dashboard once the merchant
     account exists.
  3. Same use-case description as above.

## 3 · Otter dispatch (third option, keep warm)

Per the vision doc: when the Otter partner conversation happens (their
application is still pending), ask whether their dispatch product can
broker DoorDash/Uber couriers for us — one integration instead of two.
Don't wait on it; the direct applications above proceed regardless.

## What happens after approval (engineering side, post-launch)

- New `DeliveryProvider` adapter alongside the existing OrderChannel
  pattern; quote → create delivery → webhook tracking.
- Diner-paid flat delivery fee line at checkout (restaurant may
  subsidize part — per-restaurant setting). Requires Zizo sign-off per
  CLAUDE.md since it changes what the diner sees at checkout.
- Not blocked architecturally by anything shipped so far (deliberate —
  directory spec's "don't block it" requirement).
