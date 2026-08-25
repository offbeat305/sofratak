# Design Pass 3 — Marketing Site Elevation ("the glow pass")

**From Zizo. The /eat redesign landed; the marketing site (home, pricing, how-it-works,
about, grader landing) did not get touched and now looks flat next to it. This pass
elevates the marketing site to modern premium-SaaS level — the Linear/Stripe/Vercel
"glow" aesthetic — executed strictly in the Sofratak palette.**

Reference feel: linear.app and stripe.com homepages — dark, luminous, glowing accents,
depth from light not from shadows. Ours = that language, but olive/brass/ivory, warm not
cold. Never neon, never blue/purple gradients, never gold overload (branding.md caps
brass at ~8%).

All motion reduced-motion-gated. Nothing loops except ambient drifts explicitly allowed
below.

---

## 1. The glow system (build once, reuse everywhere)

- **Brass glow:** `box-shadow: 0 0 40-80px rgba(169,121,43,0.25-0.4)` — halo behind
  CTAs, key numbers, and the hero calculator card. This is THE signature effect.
- **Olive luminance:** on dark olive sections, add 1-2 large radial gradients
  (ivory at 3-5% opacity, 600-900px radius) drifting VERY slowly (60s+, ambient) —
  makes dark sections feel lit from within instead of flat.
- **Edge light:** cards on dark backgrounds get a 1px top-edge gradient border
  (brass/40 → transparent) — the "lit from above" premium look.
- **Glass:** navbar when scrolled + floating elements get
  `backdrop-blur(12px) + olive/70` translucency instead of solid fill.

## 2. Hero (biggest change)

- Background: deepen the gradient (olive #2F4A3C → #1E332A near-black-olive at the
  bottom). Add the two drifting ivory radial glows + the existing arch watermark
  parallax. The hero should feel like dusk lighting, not a flat green rectangle.
- The estimator card gets the full treatment: brass halo glow (stronger on hover),
  1px brass/40 top edge light, slight glass tint. It should look like the single
  glowing object on the page — it IS the product's first impression.
- Headline: add a subtle brass→sand gradient text fill on the "Keep it instead." line
  (background-clip: text). One gradient text on the whole page, nowhere else.
- Trust chips: glass pills (blur + ivory/10 fill + ivory/25 border) instead of plain
  outlines.
- CTA button: brass glow halo + the existing shine sweep; on hover the halo brightens
  ~30%.

## 3. Section treatments

- **"$30 order" comparison band:** put the animation inside a glass panel on a dark
  olive section instead of the flat sand band — the money numbers get brass glow when
  they finish counting.
- **Product tour (olive band):** device mockups get reflective floor shadows +
  edge-light frames; active slide gets a soft brass halo. Add a slow parallax between
  the devices and the background.
- **Pricing cards:** Growth card gets the full glow treatment (halo + edge light);
  the other two stay matte — the contrast sells the tier. On hover any card lifts AND
  its halo fades in.
- **Stats strip:** live numbers (588 restaurants · 3 metros · orders processed) with
  count-up + brass glow pulse ONCE when each number lands.
- **Final CTA band:** darkest section on the page (near-black olive), single glowing
  brass CTA centered, arch watermark, ivory radial glow behind the button. Cinematic
  close.

## 4. Global polish

- Section transitions: replace hard color-band edges with 80-120px gradient blends —
  the page should flow, not stack.
- Scroll-reveals: upgrade from plain fade-up to fade-up + slight scale (0.98→1) —
  more dimensional, same 500ms.
- All ivory/light sections: add a barely-visible dot-grid or arch-line texture at
  2-3% olive opacity so no section is ever a flat empty color.
- Buttons/links: 150ms color+glow transitions everywhere; nothing snaps.
- Pricing, About, How-it-works, Grader landing: apply the same system (glows on key
  cards, glass navbar, gradient blends, textures) so the whole marketing site reads
  as one elevated product, not a glowing homepage with flat siblings.

## 5. Restraint rules (what keeps it premium, not gaudy)

- Max ONE glowing focal element visible per viewport-height of scrolling.
- Brass stays ≤8% of any screen (branding.md) — glow counts as brass presence.
- Glows are soft and large-radius; never sharp neon rims.
- Light sections stay calm — glass and glow live mostly on dark sections.
- Arabic RTL + 390px mobile verified; glows must not cause horizontal overflow.

## Definition of done

- [ ] Hero: dusk-lit gradient + drifting glows + glowing estimator card + gradient
      headline line
- [ ] Glow system implemented as reusable utilities (documented in code), applied per
      section list above
- [ ] Section edges blended, textures on light sections, glass navbar
- [ ] Full marketing site (home, pricing, how-it-works, about, grader) consistent
- [ ] Reduced-motion audit passes; 60fps scroll on a mid-range phone
- [ ] Side-by-side screenshots vs linear.app and vs owner.com committed — ours must
      read warmer than Linear and dramatically more premium than Owner
