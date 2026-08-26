# Design Pass 7 — Marketing Site Completion

**From Zizo.** Three pages plus a global system upgrade. Uses design-pass-3
glow utilities. Reduced-motion gated, EN/AR RTL, 390px first.

Build order: **this is first**. Pricing being empty and /contact not existing
are launch blockers.

---

## A. Pricing page (currently too empty)

1. **Hero**: "Flat monthly. Zero commission. Forever." with sub "The apps take
   15 to 30 percent of every order. We take a flat fee and nothing else."
2. **Interactive savings bar above the tiers**: a slider ("How many online
   orders a month?") that live-updates each tier card with "You'd keep ~$X/mo
   vs the apps". Instant personalization, brass odometer numbers. **This is the
   empty-page fix: make the page do something.**
3. **Three tier cards**: Growth elevated (olive, glow, MOST POPULAR ribbon), no
   monthly/annual toggle because we are month-to-month (say so), brass check
   icons, and, important, a **"what's included in every tier" band** under the
   cards: your own EN/AR ordering site, $0 commission, your customer list
   exportable, directory listing, changes within 24 hours, no setup fee for
   founding restaurants.
4. **Comparison table** (this is what's missing most): Sofratak vs
   DoorDash/UberEats vs "typical restaurant SaaS". Rows: commission per order,
   who owns the customer, setup fee, contract, Arabic support, changes
   turnaround, listing on a community app. Sticky header row, brass checks vs
   stone dashes. **Never name competitors negatively beyond the marketplaces.
   Compare to "typical platforms."**
5. **Fee transparency block**: diner pays $0.79 service fee, restaurant pays $0
   commission, Stripe processing at cost (2.9% + 30 cents), catering 5 percent
   capped at $50. Plain language, no asterisks.
6. **Pricing FAQ** (schema.org FAQPage): what if I cancel? / do you take a cut
   of tips? (no, 100 percent to the restaurant) / is there a setup fee? / what
   about processing? / can I switch tiers?
7. **Closing CTA band** plus "Not sure? See your number first" linking to the
   estimator.

## B. Cities pages (nicer)

- **City hero**: dark olive with a subtle animated map-line motif of that
  metro. H1 "Commission-free online ordering for [City] restaurants". Live stat
  chips pulled from our own DB: "N Arab and halal restaurants listed in [City]"
  using real data that updates itself.
- **New: embed a mini directory preview**, 6 real listing cards from that metro
  (reuse /eat card components) plus "See all N restaurants". Turns thin SEO
  pages into genuinely useful pages, which is also what Google rewards.
- Local paragraph stays (Busch Blvd, Warren Ave, and so on), then the math
  strip, the halal/Arabic line, FAQ block, CTA.
- **Cities index**: a proper grid of metro cards with listing counts plus a
  "Not in your city yet? Tell us" capture (kind `city_request`, widen the leads
  constraint in the same migration as the stories signup).

## C. NEW: Contact page (/contact)

- **Three routes as glass cards**, each with its own action: Restaurant owner?
  goes to book a demo (form or calendar). Already a customer? goes to sign in
  to Requests (24-hour promise). Something else goes to a general form.
- **WhatsApp as the hero contact method**, big button. This audience answers
  WhatsApp, not email. Then phone, then email, then Instagram.
- **Response-time promise displayed**: "We reply within one business day.
  Existing restaurants: 24 hours, guaranteed."
- **Simple form** (name, restaurant, phone, message, honeypot, rate-limited)
  writing to the leads table (kind `contact`, same migration).
- **Location line**: "Offbeat Creative LLC, Tampa, FL, serving Florida and
  Michigan."
- **Link it in the footer AND the navbar.**

## D. Site-wide "more tech" system (the real ask)

Add these consistently to every marketing page. This is what separates us from
Owner and Zay-OS visually.

1. **Monospace accents**: small labels, stats, and data points in a mono font
   (JetBrains Mono or IBM Plex Mono) with letter-spacing, for example
   `$0.79 / ORDER`, `588 RESTAURANTS`, `~2 WEEKS`. Instant tech credibility
   without changing the brand fonts.
2. **Subtle grid / blueprint backgrounds** on dark sections (1px olive lines at
   4 percent opacity, 64px grid). The Linear / Vercel signature.
3. **Data-viz moments** instead of plain text stats: tiny sparklines, radial
   progress, animated bars wherever we quote a number.
4. **Terminal / receipt-style detail cards** where it fits (the fee breakdown
   as a stylized receipt, the order flow as a status log). Playful, on brand,
   very tech.
5. **Cursor-follow glow** on hero sections (a soft brass radial that tracks the
   pointer, desktop only, disabled on touch and reduced-motion).
6. **Consistent page architecture** across every marketing page: dark glow hero,
   interactive/proof element, substance section, FAQ (schema), dark CTA band.
   No page should be text-only. This is why pricing feels empty: it is missing
   the interactive element and the CTA band.

## Definition of done

- [ ] Pricing slider updates all three tiers live
- [ ] Comparison table readable at 390px
- [ ] City pages show real listing counts plus 6 live cards
- [ ] /contact live with WhatsApp primary and form writing to leads
- [ ] Mono accents and grid backgrounds applied site-wide
- [ ] One migration widens the leads `kind` constraint for `contact`,
      `city_request`, `story_signup`
- [ ] Screenshots vs owner.com/pricing and zay-os pricing committed
