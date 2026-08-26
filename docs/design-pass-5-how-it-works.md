# Design Pass 5 — How It Works Rebuild

**From Zizo. Our page is flat and thin.** Benchmark studied:
`grader.zay-os.com/zayos/how-it-works` — they do a day-by-day timeline, a
"what we handle / what you handle" split, a live kitchen-feed mockup, and an
onboarding FAQ. **We beat it by being more visual, more interactive, and
warmer.** Use the design-pass-3 glow system. All motion reduced-motion-gated.

---

## 1. Hero

Dark olive, glow treatment.

- H1: "Sign up Monday. Taking your own orders by Friday."
- Sub: "No new hardware. No new POS. No 6-week onboarding. Here's exactly what
  happens, day by day."
- Two CTAs: brass "Book a 15-min demo" + ghost "See your savings first".
- Small trust row: "Setup done for you · Live in ~2 weeks · Cancel anytime."

## 2. The interactive timeline (centerpiece)

Must beat Zay-OS's static list. Horizontal scroll-linked timeline on desktop
(vertical on mobile), 5 stages:

1. **Day 1** — You send us your menu, a photo is fine
2. **Day 2–3** — We build your site, EN + Arabic
3. **Day 4** — You approve it on your phone
4. **Week 2** — You go live + we set up payouts
5. **Week 3** — Marketing turns on

Each stage: time badge, one-line title, 2-sentence plain-English body, and the
differentiator — a live device mockup that animates as you scroll through that
stage (menu photo → built storefront → approval on a phone → a real order
arriving on the kitchen screen → an SMS campaign sending).

**Scroll-scrubbed, not autoplay.** This is the wow: Zay-OS shows text, we show
the product building itself.

## 3. "Who does what" split

Steal the pattern, do it better. Two glass columns on dark olive.

**We handle:** your site EN/AR · menu setup from a photo · Stripe payouts ·
hosting + uptime · SMS/email setup · your directory listing · changes within 24
hours (link to Requests) · security + backups.

**You handle:** decide your prices · tell us your hours · cook the food.

Make the asymmetry visual and almost funny — their column is 3 items, ours is
10+. Ours wins on "we do more for less."

## 4. Kitchen view

A real animated order feed (like Zay-OS's, but ours, olive/brass): order cards
sliding in with timestamps, tap-through states Accept → Preparing → Ready.

Caption: "One screen. Your staff learns it in 10 minutes."
Include the SMS/printed-ticket fallback line — we work even without a tablet.

## 5. "What you don't need" strip

Crossed-out chips: no new POS · no new hardware · no contracts · no setup fee
(founding restaurants) · no commission. Fast, scannable, memorable.

## 6. Onboarding FAQ

Accordion + schema.org FAQPage (SEO):

- Do I have to leave DoorDash? (No, this is additional)
- Do I need new equipment?
- Will my staff need training?
- What if I don't have a menu file?
- How fast can I actually go live?
- What if I want changes later? (→ Requests / 24hr promise)
- Can I cancel?

## 7. Closing CTA band

Darkest section, glowing brass CTA:
"Most restaurants are taking their own orders within two weeks."

## Definition of done

- [ ] Scroll-scrubbed timeline runs 60fps at 390px
- [ ] Device mockups use real screenshots
- [ ] FAQ passes Rich Results test
- [ ] EN + AR RTL verified (timeline scroll direction flips)
- [ ] Side-by-side screenshot vs Zay-OS's how-it-works committed — ours must
      look a generation newer and read simpler

## Copy rule (applies site-wide, same request)

**No em dashes anywhere in user-facing copy.** Use periods for separate
thoughts, commas for asides. Applies to EN and AR message files, content
files, and article bodies. Code comments are not user-facing and keep theirs.
