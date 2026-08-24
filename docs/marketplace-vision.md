# Sofratak Eats — The Community Food App (Vision)

**Decided by Zizo, Aug 2026.** This is the official direction. Nothing here changes current
pricing, fees, or checkout (CLAUDE.md rules stand). Build order: AFTER launch + first paying
restaurants — see Sequencing.

## The idea in one line

The place where the Arab community orders food — every Arab/halal restaurant in America
listed, but only Sofratak restaurants take orders.

## Why this beats a marketplace (and Owner/Zay-OS)

We are NOT building Uber Eats. A commission marketplace would make us the thing our own
pitch attacks. Instead:

- **Discovery app, not marketplace.** Orders route to each restaurant's own Sofratak
  storefront. Restaurant keeps 100% of food revenue, pays $0 commission, owns the customer.
  Diner pays the same $0.79. Nothing about the money model changes.
- **The moat:** Uber Eats can't copy this without giving up 30% commissions. Owner.com and
  Zay-OS sell single-restaurant software — neither has a consumer destination, a community
  identity, or a reason for a diner to open their app. We'd have the only consumer-facing
  network for Arab/halal food, seeded by 50+ existing Offbeat relationships and The Hour
  Events audience.

## The listing model (Yelp playbook)

**List every Arab/halal restaurant — free, without asking.** Public factual info only:
name, address, phone, hours, cuisine, map. Same legal basis as Yelp/Google/TripAdvisor.

Two listing states:

| | Unclaimed (free, everyone) | Sofratak client |
|---|---|---|
| Listed with facts + map | ✓ | ✓ |
| "Order Now" button + live menu | — | ✓ |
| Photos, branding, glow-up, top placement | — | ✓ |
| Verified badge | — | ✓ |
| "This your restaurant? Claim it" link | ✓ → leads table | n/a |

The app is useful to diners on day one (every restaurant is on it) and every unclaimed
listing is a warm sales lead: "You're already on the app. People see you but can't order
from you — they order from the verified place down the street. $349 turns your button on."

## Pricing: unchanged

Tiers stay Starter $249 / Growth $349 / Partner $499. App listing included in EVERY tier —
density is the product; gating listings would starve the network. The app makes the
existing price feel underpriced; it is not a new line item.

Future revenue (flat-fee only, never % of food): featured placement ("first in Tampa"),
city sponsorships, upgrade pull toward Growth/Partner. All post-density, all Zizo-approved
before shipping.

## Sales pitch (canonical wording)

> "DoorDash charges you 30% of every order to reach customers. For $349 flat, Sofratak
> gives you your own ordering website in English and Arabic, zero commission, and a spot on
> the Sofratak app — where the Arab community goes to order. The apps take 30% forever.
> We take $349 and you keep everything: the money, the customer, the data."

One-liner: **"Same price. Your own website. Zero commission. Plus the only app built for
our community."**

Founding-restaurant framing until the app ships: "founding restaurants get on the app
first" — never promise a live app before it exists.

## Legal guardrails (from launch discussion — lawyer review before app launch)

1. Unclaimed listings must never imply affiliation or endorsement.
2. No scraped photos (Instagram/websites are copyrighted). Google Places photos only per
   API display rules, or our own/generic imagery.
3. Takedown requests honored same-day, no argument.
4. "Halal" on unclaimed listings only from verifiable sources; use "reported halal" vs
   "verified halal" (claimed). Community trust is the brand — never guess.
5. Google Places API: no prohibited caching (place IDs only) — same rules as the Grader.
6. No menus/prices on unclaimed listings. Facts only.

## Sequencing (do not reorder)

1. **Now:** launch Sofratak as planned (LAUNCH.md). Sign restaurants. Nothing changes.
2. **Sales kit + site update:** add "plus the Sofratak app" positioning (founding-restaurant
   framing). Seed data = existing Tampa + Dearborn/Detroit lead lists (80+ restaurants).
3. **~15–20 restaurants in one metro:** ship "order Arab food near you" directory web page
   on sofratak.com (cheap, SEO gold, proves the model).
4. **Real density:** consumer app. Killer feature: one loyalty account across every Arab
   restaurant in America.
5. **Delivery (decided, Zizo Aug 2026):** white-label courier APIs — DoorDash Drive and/or
   Uber Direct (possibly via Otter dispatch, same as Zay-OS). Orders stay on our platform;
   their drivers deliver for a flat ~$7–10 fee. The fee is paid by the diner (restaurant may
   choose to subsidize part of it — per-restaurant setting). Sofratak NEVER pays or
   subsidizes delivery, never hires drivers. Fits the existing `OrderChannel` adapter.
   Apply for DoorDash Drive + Uber Direct API access around launch (approval takes weeks);
   ask about dispatch when the Otter partner conversation happens.

## Open items

- Lawyer review of directory listing + halal labeling before app launch.
- Name TBD ("Sofratak Eats" is a placeholder — Zizo decides).
- Update one-pager/outreach/demo script with app positioning (business side, not Code).
