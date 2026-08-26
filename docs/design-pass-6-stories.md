# Design Pass 6 — Stories / Articles

**From Zizo.** The /stories index and article pages have essentially no design,
just plain text on a page. They need to look like a real food publication
(think Eater / Bon Appetit / Substack caliber editorial), in our palette, using
the design-pass-3 glow system.

These pages are our SEO and PR engine. They get shared in WhatsApp groups, so
they must look premium on a phone.

Build order: **this is second**, after design pass 7 (pricing and /contact are
launch blockers).

---

## A. Stories index (/stories)

- **Hero band** (dark olive, glow): "Stories" in the display face plus one
  line: "Guides, spotlights, and where to eat, from the people who know these
  kitchens." No stock imagery.
- **Featured article first**: large card, 16:9 typographic OG-style cover (no
  photos, which keeps our no-scraping rule unbreakable), title 32 to 40px, dek,
  read time, date, city tag chip.
- **Below**: 2 to 3 column responsive grid of article cards. Each gets a
  generated cover (deterministic pattern per slug: arch motifs, olive / sand /
  brass color variants, so no two look alike), title, 2-line dek, read time.
  Hover: lift plus brass edge-light.
- **Filter chips** by city and topic (Tampa, South Florida, Dearborn, Guides,
  Spotlights). Same chip style as /eat.
- **Newsletter / WhatsApp capture strip** at the bottom: "Get new guides when
  they drop" writing to the leads table (kind `story_signup`, which needs the
  leads kind constraint widened in the pass-7 migration).

## B. Article page (the important one)

- **Reading experience is the product**: max-width 68ch, body 18 to 19px,
  line-height 1.75, generous paragraph spacing. Display face for h2/h3 with
  real hierarchy. This alone fixes 80 percent of "no design."
- **Article header**: city/topic chip, title (clamp 34 to 52px), dek in stone,
  byline "Zizo (Ahmad Zeidan)" plus date plus read time, thin brass rule
  beneath.
- **Sticky reading-progress bar** (brass, 2px, top) plus a floating share
  button. WhatsApp first, because that is how this audience shares, then
  copy-link, then X.
- **Restaurant mentions become live cards**: when an article links a directory
  listing, render an inline restaurant card (name, cuisine chips, rating, Order
  Now if claimed, View listing if not) instead of a plain link. This is the
  whole point: articles feed the directory, the directory feeds orders.
- **Pull-quote styling** (large italic display face, brass quote mark), styled
  lists with brass markers, callout / tip boxes (glass on light), and image
  support with captions for when we do have licensed photos.
- **Table of contents** for long guides: sticky sidebar on desktop, collapsible
  on mobile.
- **End of article**: author card (founder photo, one-line bio, link to
  /about), then "More stories" with 3 related cards, then a soft CTA band: "Own
  a restaurant? See what you're losing to the apps" linking to the grader.
- **Prev / next** article nav at the very bottom.

## C. Technical

- Typographic OG images already exist. Extend the same generator to the index
  card covers so index and share cards match.
- Article JSON-LD stays. Add breadcrumbs (Home, Stories, Title).
- EN and AR: RTL flips the whole layout including TOC side and progress
  direction.

## Definition of done

- [ ] Index reads like a magazine, not a link list
- [ ] Article page passes a "would I read this on my phone for 4 minutes" test
      at 390px
- [ ] Inline restaurant cards render live directory data
- [ ] WhatsApp share works from mobile
- [ ] Reduced-motion audit passes
- [ ] Screenshot committed
