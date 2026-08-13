# Founder Story — Content Spec

**Source:** written by Zizo, Aug 2026. This is final copy — Code implements as-is, no rewriting. Formatting/section breaks below are implementation guidance, not optional.

Byline everywhere: **Zizo (Ahmad Zeidan)** — per `docs/branding.md` Voice rule. Never "Ahmad Zeidan" alone, never "Zizo" alone in formal placements.

---

## 1. Full About page — `/about` (EN, then mirror AR after Zizo review)

Route: `app/(marketing)/about/page.tsx`. Layout: Cormorant headers per section, Manrope body, olive/ivory/sand band rhythm per `docs/design-pass.md` §3 (don't let this become a wall of white text — alternate 2-3 bands down the page same as home). Founder photo `public/brand/founder-zizo.png` — use as a large portrait near the top (hero-style, not a tiny circular avatar) and again by the closing note.

### Hero block
- Eyebrow: "MEET THE FOUNDER"
- H1 (Cormorant): **Zizo (Ahmad Zeidan)**
- Subhead: Founder of Sofratak
- Lede paragraph:
  > Sofratak wasn't created by someone looking for a software idea. It was created after years of working directly with the people who run restaurants.
  >
  > Ahmad Zeidan — known to many as Zizo — is an entrepreneur whose businesses sit at the intersection of hospitality, marketing, culture, events, and technology.
  >
  > As the founder of Offbeat Creative, Ahmad and his team work closely with restaurants across the United States, with a particularly strong presence in the Arab-American hospitality community. From Lebanese and Mediterranean restaurants to growing multi-location concepts, Offbeat helps restaurant owners with branding, social media, advertising, content, SEO, customer acquisition, and digital growth.
  >
  > That work gave Ahmad something more valuable than market research: a front-row seat to how restaurants actually operate.

### Section: Built From the Other Side of the Table
> For years, Ahmad sat with restaurant owners and saw the same challenges repeatedly.
>
> Great restaurants were spending heavily to build their brands and attract customers — but once the customer was ready to order, much of that relationship was handed over to someone else.
>
> One company handled ordering. Another handled delivery. Another handled customer data. Another handled email. Another handled SMS. Another handled inventory. Another handled reviews. Another handled analytics.
>
> More subscriptions. More dashboards. More passwords. And often, less control for the restaurant owner.
>
> That became the foundation for Sofratak.

*(Implementation note: the "One company handled X" lines are a strong candidate for a short staggered fade-in list per the motion system, not a flat paragraph — makes the fragmentation point land visually.)*

### Section: Deeply Connected to the Arab Hospitality Community
> Ahmad's connection to the Arab business community goes beyond restaurants.
>
> Through The HOUR Events, he created and developed cultural nightlife brands including Ahla Sahra, AYLA, and DAR HOUSE.
>
> Ahla Sahra has grown into a destination Lebanese nightlife experience, bringing together guests who travel from across the United States for major live events, artists, and cultural celebrations.
>
> DAR HOUSE was created around a new generation of Arabic House music and global Eastern sounds.
>
> Across restaurants, nightlife, hospitality, and marketing, Ahmad has spent years understanding how Arab consumers discover brands, how they make decisions, what creates loyalty, and — most importantly — how cultural understanding changes the way a business should communicate.
>
> That experience became an important part of Sofratak's DNA.

### Section: Why Sofratak?
> **Because the restaurant created the customer. It should own the relationship.**
>
> While helping restaurants grow through Offbeat Creative, Ahmad began asking a bigger question: what happens after the marketing works?
>
> A restaurant can invest thousands into its food, team, location, branding, photography, advertising, and social media. It creates the demand. It earns the customer's attention.
>
> But too often, the restaurant then sends that customer into an ecosystem it does not own. The customer data sits somewhere else. The ordering relationship sits somewhere else. The marketing tools sit somewhere else. And every additional tool creates another dependency.
>
> Sofratak was created to change that.

*(Note: "ecosystem" appears here in Zizo's own draft describing the problem — that's fine, it's describing what restaurants are trapped in, not Sofratak's pitch. `branding.md` bans "ecosystem" as marketing language for Sofratak itself; don't let this line bleed into other banned-word contexts.)*

### Section: Take Control. Own Your Growth. (brand slogan as section header)
> Sofratak is being built as an all-in-one restaurant operating and growth platform designed to give operators greater ownership over: their customers, their orders, their data, their marketing, their operations, their growth.
>
> Instead of forcing restaurants to operate through a disconnected collection of platforms, Sofratak brings essential tools into one connected ecosystem: direct online ordering, CRM, delivery, inventory, email and SMS marketing, customer intelligence, SEO and GEO tools, AI-powered automation, operations, analytics, and more.
>
> The goal isn't to give restaurant owners another dashboard. The goal is to give them control.

*(Note: only current, live-in-product items should read as present-tense claims — ordering, CRM/leads, SMS fallback exist now; delivery/inventory/AI automation are roadmap. Phrase this section as vision/direction, consistent with "being built as" — keep that framing, don't let it slide into "Sofratak already does X" for things not shipped.)*

### Section: Why the Name Sofratak?
> The name comes from Sufra — سفرة. The table. The place where people gather around food. Where hospitality happens. Where conversations begin. Where relationships are built.
>
> Sofratak makes that idea personal. Your table. Your customers. Your business. Your growth.

### Section: Built With Arab Restaurants in Mind. Built for Restaurants Everywhere.
> Sofratak's earliest inspiration came from working closely with Arab restaurant owners. Family businesses. Second-generation operators. Entrepreneurs opening their second, third, or fourth locations.
>
> Owners who know hundreds of customers personally but may not yet have a system capable of turning those relationships into usable customer intelligence. Operators running Instagram, WhatsApp, Google, delivery apps, reservations, staff, orders, marketing, and inventory simultaneously.
>
> We understand that world because we already work inside it.
>
> But the problem is not exclusive to Arab restaurants. Independent restaurant owners everywhere are dealing with the same fragmentation, the same dependency, and the same lack of ownership. That is why Sofratak's ambition is much bigger.

### Section: From Marketing Restaurants to Building Their Growth Infrastructure
> Offbeat Creative taught us how restaurants acquire customers. Sofratak is being built to help restaurants keep, understand, and grow those customers. That is an important distinction.
>
> Marketing should not end with an impression, a click, or even an order. The restaurant should know: who ordered, what they ordered, how often they return, what they respond to, what their lifetime value is, when they are likely to come back — and how to reach them again without paying another platform for access to their own customer.
>
> That is where real ownership begins.

### Section: The Bigger Vision
> Sofratak is not being built simply to replace individual restaurant software. The bigger vision is to create the infrastructure behind restaurant growth — a system where technology quietly handles complexity in the background while giving the operator something much more valuable: clarity, ownership, control.
>
> Independent restaurants should have access to technology powerful enough to compete with much larger companies without giving away the customer relationships they worked so hard to build. That is what we are building.

### Closing: A Note From Ahmad
Layout as a distinct letter/pull-quote block — second (or repeated) founder photo, Cormorant italic or a quote-styled treatment, signed.
> I've spent years sitting across the table from restaurant owners.
>
> I've seen incredibly talented operators build businesses people genuinely love while still relying on systems that take too much, communicate too little, and leave the restaurant with less control than it should have.
>
> Sofratak came from those conversations. We are building the platform I kept wishing our restaurant clients already had. Something powerful enough for serious operators, but practical enough to actually use every day.
>
> Our story starts with restaurants and with a community I know extremely well. But our ambition goes much further.
>
> Restaurants should own their customers. They should own their data. And they should own their growth.
>
> That's why we built Sofratak.
>
> **Zizo (Ahmad Zeidan)**
> Founder, Sofratak

---

## 2. Where else this content gets reused

Don't just link to About — pull specific lines into other pages so the founder story reinforces the pitch everywhere, not just on one page nobody clicks.

**Homepage — new short section, after "Who it's for" and before the pricing teaser (sand band per design-pass rhythm):**
- Small founder photo (cropped, not the full portrait) + 3-4 sentence version:
  > "Built by someone who's sat on the other side of the table." Ahmad Zeidan (Zizo) spent years growing Arab restaurants through Offbeat Creative before building Sofratak — this isn't a generic SaaS guess at what restaurants need.
- Pull-quote treatment (large Cormorant italic, brass accent mark): **"Because the restaurant created the customer. It should own the relationship."**
- Link: "Read our story →" to `/about`

**Footer — mission line (all pages):**
Replace/augment the current one-line mission with something drawn from this story, e.g.:
> "Built by Offbeat Creative — working with Arab restaurants across the US since [Offbeat's founding]. Take Control. Own Your Growth."
(Keep both slogans as already speced in design-pass §8; this is the sentence above them.)

**About/credibility trust badge — usable on homepage hero trust chips row AND pricing page AND demo booking page:**
Short badge text — name real clients, no invented headcount: "Built by the team behind La Vie Mediterranean, Sirocco, Shishka, Shawarmaz, and many Arab restaurants like them" (or shorten to "...and many Arab restaurants like them" if space is tight) — linking to `/about`. Use sparingly (badge, not paragraph) outside the About page itself. Never use a "50+" style number claim anywhere on the site.

**City pages (`src/content/cities.ts`) — one optional trust sentence, not mandatory per page:**
> "Sofratak comes from Offbeat Creative, which has worked with Arab and Mediterranean restaurants across the country — including here in [city]." (Only use the "[city]" claim if actually true for that market; otherwise drop the local clause and keep it generic.)

**Book a Demo page — near the form, short reassurance line:**
> "You'll be talking to Zizo (Ahmad Zeidan) directly, not a call center." (matches the family-business/no-corporate-bio tone from `docs/website-spec.md`)

**Meta description, `/about`:**
> "Meet Zizo (Ahmad Zeidan), founder of Sofratak — built after years growing Arab restaurants through Offbeat Creative. Restaurants should own their customers, their data, and their growth."

**"Why the name Sofratak" explainer:**
This is strong standalone content — also usable as a small callout box on the homepage near the hero or footer (سفرة / "your table" concept), not just buried in the About page. Optional placement, Code's call on fit, but flag it as reusable.

---

## 3. Rules for Code

- English ships as-is above — this is final, approved copy.
- Arabic translation of this page is NOT approved yet — Zizo reviews every Arabic line before it ships (standing rule). Build the About page in English first; hold AR behind the review.
- Roadmap items in "Take Control. Own Your Growth." section (delivery, inventory, AI automation, GEO tools) must not be phrased as available today anywhere they're reused outside the About page's "being built as" framing — check `CLAUDE.md` phase list before implying anything is live.
- Follow `docs/branding.md` for founder name formatting, palette, type, motion — same rules as the rest of the site.
