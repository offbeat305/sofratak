# Phase 5 Marketing Suite — Competitive Spec

Prepared 2026-08-23. For review — no code written. Full formatted version:
see artifact link shared with Zizo (or re-request).

## Recommendation

Build the five pillars — email, SMS, automations, offer codes, loyalty —
on top of the CRM segmentation and email/SMS adapters already shipped.
Bundle it into the **Growth** tier at no extra charge, matching
Owner.com's all-in-one pricing rather than Toast's pay-per-module
approach. That's not just the more competitive move — it's already the
promise on the live pricing page today (see below).

## Why this can't wait

The public `/pricing` page lists **"SMS and email campaigns"** and
**"Offer codes and win-back automation"** as included in Growth
($349/mo), and **"Loyalty program"** as included in Partner ($499/mo).
Anyone reading that page today is being told these exist. This is a gap
between what's marketed and what's built, not a someday feature.

## Owner.com vs. Toast vs. Sofratak

Confirmed from each platform's own product pages and support docs.

| Capability | Owner.com | Toast | Sofratak (proposed) |
|---|---|---|---|
| How it's sold | Bundled into base plan ($249–499/mo), no separate fee | À la carte add-on ($185/mo Marketing Essentials) or $499/mo "IQ Grow" bundle on top of POS | **Match Owner** — bundled into Growth ($349/mo), already promised |
| Email campaigns | Pre-built templates + custom sends | Automated, pulls from POS + ordering data | **Match** — branded HTML templates on the email adapter already shipped |
| SMS campaigns | Automated + manual sends | One-time + automated, AI copy assistant, image/GIF support | **Match core** — AI copy assist and MMS are a fast-follow, not v1 |
| Customer segmentation | Order-history based | Order-history + visit-count based | **Beat** — VIP/lapsed/new tags already auto-compute from orders, zero setup |
| Automations | Win-back, promo, holiday, cart-abandon, new-customer | Welcome, "we miss you," big-spender, repeat-guest, post-purchase | **Match** — win-back, welcome, VIP, and review-request |
| Review requests | Not a named feature | Not a named feature | **Beat** — `googleReviewsUrl` already stored; an automated post-order ask is a real edge neither competitor names |
| Offer codes | Bundled into promo campaigns | Bundled into campaigns + loyalty | **Match** — code creation, redemption tracking at checkout |
| Loyalty program | Points-based, phone/email signup, no app/password | Points or visit-based, shared across multi-location, ties to gift cards | **Match** — points-based v1; multi-location sharing is later (Sofratak is single-location today) |
| Compliance tooling | Opt-in enforced at signup | Quiet hours, content restrictions, consent logging, CSV import rules | **Match** — same rules, see below |

## The five pillars

### Email campaigns — Match
Already built: Resend email adapter with attachments, VIP/lapsed/new
segments computed from real orders, CSV export pattern to reuse for
send-list building.
Net-new: a small set of branded HTML templates, campaign compose/
schedule UI, unsubscribe link + suppression list (legally required),
open/click tracking.

### SMS campaigns — Match
Already built: SMS adapter interface (Console impl; Twilio wiring is
the one real gap), `smsOptIn` already captured at checkout.
Net-new: Twilio implementation, a marketing-specific opt-in separate
from the transactional order-status opt-in (TCPA treats them
differently), STOP/HELP handling, quiet-hours enforcement, consent
logging (see Compliance below).

### Automations — Match
Already built: the `lapsed` tag (30+ days) drives win-back targeting
for free; `restaurant.googleReviewsUrl` already exists so a
review-request automation just needs a trigger.
Net-new: a scheduled job to evaluate triggers daily (win-back,
new-customer welcome), post-order review-request send, birthday
automation (needs a birthday field — not collected today).

### Offer codes — Match
Already built: checkout flow + order pricing pipeline just needs a
discount line item.
Net-new: offer code data model (code, type, value, expiry, usage cap),
checkout-time validation + redemption, dashboard UI to create/track
codes.

### Loyalty — Match
Already built: customers are already keyed by phone number — the
natural loyalty identity.
Net-new: points ledger (earn on paid orders, redeem at checkout),
owner-configurable earn rate + reward catalog, balance shown to the
diner in checkout/order-status flow.

## SMS compliance, specifically

Pulled from Toast's own published rules, not assumed:

- **Separate opt-in** — marketing texts need their own consent, distinct
  from the transactional order-status opt-in already captured at checkout.
- **Quiet hours** — marketing sends only 8am–9pm in the recipient's
  local time zone.
- **STOP handling** — a reply of STOP must immediately and permanently
  suppress future marketing sends from that number.
- **Content restrictions** — no adult, hate, firearms, or tobacco/
  cannabis content; alcohol promotions require age-gating.
- **Consent logging** — every opt-in needs a timestamp and source on
  record.
- **Bulk import rule** — an imported customer list needs documented
  prior consent per number before any SMS marketing — no cold-importing
  a phone list.

## Suggested build order

1. **Email + segments** — fastest to ship, adapter and segments already
   exist. Closes what's already promised on Growth.
2. **Offer codes** — self-contained, touches checkout once, and
   campaigns become more useful once there's a code to send.
3. **SMS + compliance layer** — Twilio wiring plus the rules above,
   built once and shared by every future SMS send.
4. **Automations** — win-back and review-requests first (data already
   exists for both); birthday waits on a capture point.
5. **Loyalty** — last, deliberately: the most schema-heavy piece (a
   points ledger), and benefits from offer-code redemption UX already
   being proven at checkout.

## Before building anything — open questions for Zizo

1. Bundle the whole suite into Growth at $349/mo as already priced, or
   hold any piece for Partner-only?
2. Birthday capture — add to checkout (adds friction to every order) or
   a post-order opt-in prompt (slower list-building, zero checkout
   friction)?
3. Loyalty reward catalog — owner picks their own rewards (more setup,
   more flexible) or Sofratak ships smart defaults (dollars-off at
   spend thresholds) they can edit later?
4. Sender identity for SMS — one shared Twilio number pool across all
   restaurants, or does each restaurant get its own number (higher
   cost, better deliverability/branding)?
