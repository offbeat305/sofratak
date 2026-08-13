# Design Pass — Make sofratak.com Feel Expensive

**From Zizo. This overrides the current homepage design. Follow it literally.**
The current site is structurally correct but visually flat: too much empty ivory, weak hero, no motion, no wow. Target feeling: a premium hospitality brand that happens to be software. Benchmark: side-by-side with owner.com it must look MORE polished, and next to zay-os.com it must look like a different league.

Everything below stays inside `docs/branding.md` (palette, fonts, no bounce, reduced-motion respected). Logo assets: `public/brand/`.

---

## 1. Navbar

- Transparent over the hero; on scroll past ~80px it transitions (200ms ease) to solid olive `#2F4A3C` with a subtle bottom shadow.
- Left: logo (ivory variant on olive/dark, full-color on light). Height 36–40px.
- Right: How it works · Pricing · Cities · About · language toggle (EN | ع styled as a pill) · brass CTA button "Calculate Your Savings" (olive text on brass `#A9792B`, pill radius, slight scale-up on hover 1.03).
- Mobile: hamburger opens a full-screen olive drawer, links in Cormorant 28px, staggered fade-in (60ms delay each).

## 2. Hero — the calculator IS the hero

Full-viewport-height (min 88vh) olive `#2F4A3C` section with a barely-visible arch pattern watermark (5% ivory opacity, large repeating arches) and a very slow parallax drift.

Two-column grid (stacks on mobile, text first):

**Left column:**
- Eyebrow line, brass, Manrope 600, letter-spaced small caps: "FOR ARAB, MIDDLE EASTERN & HALAL RESTAURANTS"
- H1 in Cormorant SemiBold, ivory, ~clamp(40px, 6vw, 68px), tight leading:
  "The apps take 15–30% of every order." then on its own line in brass: "Keep it instead."
- Sub in Manrope 400 ivory/80: "Your own ordering website. Zero commission. Orders on the tablet you already run. Your customers stay yours."
- Both slogans under it, small: "Take Control. Own Your Growth." · شغلك تحت سيطرتك
- Row of three micro-trust chips (outlined, ivory/60): "0% commission" · "79¢ flat, diner-paid" · "Live in ~2 weeks"

**Right column: the live estimator card.**
- Ivory `#F7F2E8` card, 28px radius, generous 32px padding, soft deep shadow (olive-tinted, not gray), slight 3D tilt on mouse move (max 2deg, disabled on touch/reduced-motion).
- Title: "What are the apps costing you?" (Cormorant, olive, 26px)
- 3 sliders (orders/mo, avg order $, app rate % preset 25) — custom styled: olive track, brass thumb 22px with soft glow on drag, current value in a brass Manrope-bold bubble above the thumb.
- Result zone below sliders, olive panel inside the card: "Estimated $X/month → $Y/year going to the apps" with numbers in brass, Manrope 800, 34px, rolling odometer animation on every slider change (120ms).
- One line: "With Sofratak Growth ($349/mo flat): estimated difference $Z/year."
- Disclaimer line 11px stone, always visible.
- Under result: brass button "Book a 15-min demo" + ghost link "Text me this estimate".
- The card must be fully interactive in the hero — this is the product's first impression.

## 3. Section rhythm (fixes the "empty" feeling)

Alternate band colors down the page — never two ivory sections adjacent:
1. Hero — olive
2. Logo/press strip — ivory (thin)
3. "Where your $30 goes" comparison — sand `#D8C19A` tint band
4. What you get — ivory
5. Product tour carousel — olive
6. How it works — ivory
7. Who it's for + halal badge — sand tint
8. Pricing teaser — ivory
9. Data promise — olive
10. Final CTA — olive→deep gradient with arch watermark

Global rules: max-width 1200px content grid, section padding 96px desktop / 64px mobile (consistent!), every section header = Cormorant 36–44px olive (ivory on dark) + one-line Manrope sub, left-aligned on desktop.

## 4. New section: "Where your $30 order goes" (the wow graphic)

Animated horizontal bar comparison, triggers on scroll into view:
- Row A "On the apps": a $30 bar that fills, then a red-tinted 25% chunk visibly breaks off and slides away, leaving "$22.50 keeps" (numbers count as it happens). Caption: "estimated 25% blended marketplace cost".
- Row B "On your Sofratak site": $30 bar stays whole, a tiny 79¢ sliver (brass) detaches with the caption "your customer pays it — not you". "$30.00 keeps."
- 1.6s total, ease-out, plays once, replays on click. Pure CSS/JS, no video.

## 5. Product tour (olive band)

Horizontal snap-scroll carousel of 4 device mockups (real screenshots in phone/tablet frames):
storefront EN → same storefront flipped to AR (this transition sells the bilingual story — animate the flip) → kitchen screen with an order card sliding in → dashboard Today view.
Each slide: one Cormorant caption ("Your customers order in Arabic or English." etc). Dot navigation, drag on touch, auto-advance 5s pause-on-hover.

## 6. Motion system (site-wide)

- Scroll-reveal: sections fade-up 24px, 500ms ease-out, once. Stagger children 80ms (cards, steps, tiers).
- Every money number on the page counts up when it enters viewport (800ms).
- Cards: hover lift translateY(-4px) + shadow deepen, 180ms.
- Arch dividers between key sections: stroke draws in on scroll (SVG dash animation, 600ms).
- CTA buttons: on hover, subtle brass shine sweep (one 600ms gradient pass, no loop).
- `prefers-reduced-motion`: all of the above become simple opacity fades or static.
- Nothing bounces. Nothing loops forever. Nothing autoplays sound/video.

## 7. Pricing teaser polish

Three cards on ivory; Growth card elevated: olive background, ivory text, brass "MOST POPULAR" ribbon, ~8% larger, listed benefits with brass check icons. Monthly prices in Manrope 800 44px with count-up. Under cards, one honest line: "Diner pays 79¢/order. You pay $0 per order. Card processing at cost."

## 8. Footer (currently an afterthought)

Deep olive, 3 columns: logo + one-line mission + slogans (both languages) · page links · contact block (WhatsApp button, phone, IG icon). Bottom bar: © Offbeat Creative LLC · privacy · terms · language toggle. A final thin arch motif line above it in brass/20.

## 9. RTL

Every new element mirror-checked in Arabic: sliders run right-to-left, carousel direction flips, arch dividers mirror, count-ups use Latin numerals per the pricing rule ("$9.49" both languages).

## 10. Definition of done for this pass

- [ ] Hero calculator interactive above the fold on a 390px-wide phone
- [ ] No two adjacent same-color bands; zero sections without at least one motion moment
- [ ] The $30 comparison animation runs clean at 60fps on a mid-range phone
- [ ] Product carousel uses real app screenshots, EN→AR flip working
- [ ] Reduced-motion audit passes
- [ ] Screenshot of our home vs owner.com home attached to the commit — ours must read more premium
