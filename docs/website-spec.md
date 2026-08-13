# Sofratak Public Website — Spec (sofratak.com)

**For:** Zizo (content/look approval) + Claude Code (build, Phase 8 — can be pulled earlier)
**Look & feel:** everything follows `docs/branding.md` (olive/sand/brass/ivory palette, Cormorant Garamond heroes, Manrope body, IBM Plex Sans Arabic). No stereotype Middle East theming. Premium hospitality, not generic SaaS.

## Who it's for

1. **Restaurant owners** (primary) — family-run Arab, Middle Eastern, Mediterranean, halal. Reading on a phone, between rushes, possibly in Arabic. Goal: get them to one action — see their number (savings estimator) or book a demo.
2. **Search engines** (secondary) — Zay-OS is already running SEO pages for OUR cities (Tampa, Dearborn, Detroit). The city pages below are how we contest that ground.
3. Diners never use this site — they order on the restaurant's own subdomain.

Every page: EN + AR with true RTL, language toggle top-right, mobile-first.

## Pages (v1 — nothing more)

1. **Home** — see section map below
2. **Pricing** — the 3 tiers, straight
3. **Savings estimator** — the demo closer, also the main CTA target
4. **How it works** — 3 steps, owner's point of view
5. **City pages** — tiered rollout, see City pages section ("Online ordering for [city] restaurants")
6. **About / founder story** — Zizo, Tampa, why this exists. Family-business tone, photo of Zizo, no corporate bio
7. **Book a demo** — form + WhatsApp button
8. Privacy + Terms (footer only)

**Not in v1:** blog, AI chatbot, comparison pages (add "vs Owner.com" and "vs DoorDash fees" pages in v2 — Zay-OS runs 15 of these), customer logos we don't have yet, fake testimonials — never.

## Homepage, section by section

1. **Hero** — olive background. Headline (Cormorant): "The apps take 15–30% of every order. Keep it instead." Sub: "Your own ordering website. Zero commission. Your customers stay yours." Slogan under logo: Take Control. Own Your Growth. / شغلك تحت سيطرتك. CTAs: brass "Calculate Your Savings" + secondary "Book a Demo". Visual: phone mockup of a storefront (use Beit Zizo demo, relabeled).
2. **The math strip** — one line, big brass numbers: "500 app orders/mo × 25% ≈ $3,000+/mo gone. Estimated." Links to estimator. Disclaimer text per brand kit.
3. **What you get** — 5 cards (from the one-pager): your own site EN/AR · orders on the tablet you already use · your customer list, exportable · marketing that fills slow nights · a weekly report you can read in one minute.
4. **How it works** — 3 steps: send us your menu (photo is fine) → we build your site in ~2 weeks → orders flow, you keep the money. "No new hardware. Your staff learns nothing new."
5. **Who it's for** — say the niche plainly: "Built for Arab, Middle Eastern, Mediterranean, and halal restaurants." Halal badge shown. This sentence is the moat; don't soften it.
6. **Pricing teaser** — three tier cards, "From $249/mo · month-to-month · no setup fee for founding restaurants." Link to pricing page.
7. **The promise block** — olive band, ivory text: "Your data is yours. Every customer, every order — export it in one click, even if you leave. Cancel anytime." (This is the anti-Owner.com trust move.)
8. **Final CTA** — "See your number." Estimator button + WhatsApp link + phone number.

Footer: language toggle, contact, Instagram, privacy/terms, "Offbeat Creative LLC, Tampa FL".

## Savings estimator (functional spec)

- Inputs (3 sliders/fields, phone-friendly): app orders per month · average order $ · blended app rate (preset 25%, adjustable 15–30%).
- Output, instant, no signup wall: "Estimated $X/month → $Y/year going to the apps." Below it: "Sofratak: $349/mo flat + $0 commission. Estimated difference: $Z/year." Brass numbers, count-up per brand kit.
- Required line under every result: "Illustrative estimate based on the information provided. Actual results may vary." Never the word "guaranteed."
- Soft capture AFTER showing the number: "Text me this estimate" → name + phone (goes to admin/CRM + email notification to Zizo). Optional, not gating.
- Zizo uses this exact page live in demos (demo script minute 13–15), so it must work perfectly on a phone held sideways at a restaurant table.

## City pages (SEO — the Zay-OS counter)

Target: every major Arab/Middle Eastern/halal community in the US, rolled out in tiers. Zay-OS already indexes most of these — we out-write them with real local content, not boilerplate.

**Tier 1 — launch with the site (our home turf + all Florida):**
Tampa · St. Petersburg · Orlando · Jacksonville · Miami · Fort Lauderdale · Hollywood FL · West Palm Beach · Dearborn · Dearborn Heights · Detroit · Hamtramck

**Tier 2 — within a month of launch (the national Arab hubs):**
Anaheim CA (Little Arabia) · Chicago + Bridgeview IL (Little Palestine) · Paterson NJ (Little Ramallah) · Brooklyn NY (Bay Ridge) · Houston TX · Dallas/Richardson TX · El Cajon CA (Chaldean community) · Sterling Heights MI · Minneapolis MN · Toledo OH · Northern Virginia/DC · Philadelphia PA

**Rollout rule (important for SEO):** publish a page only when it has real localized content — 20-plus thin duplicate pages published at once can hurt rankings more than help. Ship Tier 1 with genuinely local paragraphs (we know these streets); Tier 2 at 3–4 pages/week as content gets written. Every page indexed via sitemap.xml.

Template, one per city, real content not boilerplate:
- H1: "Commission-free online ordering for [city] restaurants"
- One paragraph naming the local food scene honestly (Tampa: Busch Blvd halal corridor, Temple Terrace; Dearborn: Warren Ave; etc.)
- The math strip + estimator link
- "Built for the community": EN/AR line + halal note
- FAQ block with schema.org FAQ markup (5 questions: cost, commission, tablet, data ownership, cancel)
- Meta/OG per city; schema.org LocalBusiness + Service markup; fast static pages.

## Functional requirements

- Next.js app/(marketing) route group (already in the architecture), statically generated, <2s LCP on 4G
- EN/AR routing (next-intl, same as product), full RTL mirror
- Lead capture: all forms write to the database (a `leads` table) AND email zizo — never a lost lead; honeypot spam protection
- WhatsApp deep link on every page (wa.me/[number]) — this audience answers WhatsApp, not contact forms
- Analytics: page views + estimator completions + form submits (privacy-light, e.g. Plausible or Vercel Analytics)
- OG images per page so links look right when shared in WhatsApp groups
- Accessibility per quality bar: contrast, focus states, reduced motion

## Copy rules (enforced)

Brand voice from branding.md: short, confident, practical — money, time, orders, control. Banned words: ecosystem, synergy, revolutionary, disruptive, omnichannel, digital transformation. Savings always "estimated/potential" + disclaimer. Arabic copy written properly, not machine-translated word-for-word — Zizo reviews every Arabic line before launch.

## Definition of done

- [ ] All 8 pages live in EN + AR, RTL verified on a real phone
- [ ] Estimator produces correct math and the capture form delivers to email + DB
- [ ] City pages pass Google Rich Results test (FAQ + LocalBusiness schema)
- [ ] Zizo can run the demo-close on the estimator page from his phone
- [ ] Every page passes the branding.md design check list
