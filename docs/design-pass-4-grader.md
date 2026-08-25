# Design Pass 4 — Grader Rebuild ("the demo closer page")

**From Zizo. The /grader page is currently a bare search box — "ugly and weird." It's
our #1 lead magnet and the direct answer to grader.zay-os.com (study it: trust strip,
problem section, stats, FAQ — a full landing page wrapped around the scan) and
grader.owner.com (study its clean single-purpose hero). Rebuild /grader as a full
landing page + a cinematic scan + a report that looks like a real audit.**

Uses the glow system from design-pass-3 (brass halos, dusk gradients, glass). All
reduced-motion-gated. Palette/type per branding.md.

---

## 1. Page structure (it's a landing page, not a form)

1. **Hero (dark olive, glow treatment):** eyebrow "FREE RESTAURANT GRADER"; H1
   (Cormorant): "Is your restaurant losing orders online?" + brass line "Find out in
   60 seconds."; the search input as the glowing focal object (same treatment as the
   homepage estimator card): big glass input, brass halo, Places autocomplete
   dropdown styled to brand (not default browser UI). Sub-line: "Free · No card ·
   No spam. We scan Google, reviews, and your ordering setup."
2. **"What we check" strip** — 4 glass chips with icons: Google presence · Reviews &
   rating · Online ordering · Who's taking your customers. Fade-up stagger.
3. **Sample report teaser** — a blurred/angled mock report card with score ring
   visible ("See what you'll get") so the page isn't empty before anyone searches.
4. **Stats strip** (live count-ups): "588 restaurants tracked · 3 metros · built for
   Arab & halal restaurants".
5. **How it works** — 3 numbered steps, one line each.
6. **FAQ** (5 items, accordion, schema.org FAQ markup): free? · card needed? · what
   do you scan? · is my data safe? · what happens after?
7. **Final CTA band** — dark, single glowing button scrolling back to the input.

## 2. The scan moment (make the 60 seconds feel alive)

After a restaurant is picked: transition to a **scan screen** — the restaurant's name
+ Google photo up top, then a checklist that animates through stages ("Checking your
Google listing… ✓ / Reading your reviews… ✓ / Looking for online ordering… ✓ /
Scanning your competition…") with a progress bar and skeleton shimmer. Each stage
ticks as the real API work completes (min 400ms per stage so it never flashes by).
This is theater AND honesty — it's doing real work; show it.

## 3. The report (the part that gets screenshotted)

- **Score hero:** big animated ring gauge (SVG stroke draw, 0→score count-up), letter
  grade in Cormorant inside the ring. Ring color: brass ≥80, olive 60-79, clay <60
  (usability exception to the clay cap). One-line verdict under it, e.g. "Strong
  presence — but you're paying for orders you could own."
- **Category cards** (4, the "more things on it" ask): Google Presence · Reviews ·
  Online Ordering · Competition. Each: mini score bar, 2-3 real findings as bullet
  rows with ✓/✗/! icons ("4.6★ across 861 reviews — top 10% in Tampa" / "✗ No direct
  ordering found — customers must use commission apps"), and one recommendation line.
- **The money slide:** if no direct ordering found, show the estimator math inline:
  "Restaurants your size lose an estimated $X/mo to app commissions" + disclaimer
  (branding.md wording) + brass CTA "See your exact number" → estimator.
- **Competition row:** "N other Arab restaurants within 3 miles are on the Sofratak
  directory" with 3 blurred-name cards — real data from our directory, creates FOMO.
- **Unlock gate (existing flow, redesigned):** report shows top section free; full
  category detail behind the email/phone unlock card (glass, brass glow, one field +
  button, "We text it to you — no spam"). Same lead capture, better dressed.
- **Share/save:** "Text me this report" + a clean print/PDF-friendly layout.

## 4. Follow-through

- Grade → lead already works; add the restaurant's score into the lead `data` snapshot
  so sales outreach can open with it.
- OG card for shared grader links: typographic score card (next/og, no photos).
- Mobile-first: the whole scan+report must feel native at 390px — Zizo runs this live
  at restaurant tables.
- EN/AR both; Arabic queued for Zizo's review batch.

## Definition of done
- [ ] /grader reads as a full landing page before any search happens
- [ ] Autocomplete styled to brand; scan screen animates through real stages
- [ ] Report: ring gauge, 4 category cards with real findings, money slide, competition
      row, redesigned unlock
- [ ] Side-by-side screenshot vs grader.zay-os.com committed — ours must look a
      generation newer
- [ ] 390px + RTL verified; reduced-motion audit passes
