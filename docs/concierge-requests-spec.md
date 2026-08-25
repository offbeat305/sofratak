# Concierge Requests — "We fix it in 24 hours" (dashboard feature)

**From Zizo. Build after the current design passes.** A new dashboard tab where a
restaurant requests ANY change, fix, or idea — in under 30 seconds, on a phone,
without typing more than they want to. Promise shown everywhere: **"Done within 24
hours."** This is our answer to competitors charging $599/mo for "concierge" — ours is
included in every tier.

Not to be confused with self-serve editing (menu manager, settings — those stay).
This is for everything else: "fix this," "change that," "help me," "I have an idea."

---

## 1. The tab

Dashboard sidebar item: **"Requests"** with a brass dot badge when any request has an
update. Header: "Tell us what you need. We handle it within 24 hours." Sub: "Anything
— your site, your menu, your dashboard, marketing. No request is too small."

## 2. The flow (3 taps + optional note — this is the whole product)

**Step 1 — "What's it about?"** Big tappable cards (2-col grid mobile, glow-hover,
one emoji-free icon each, instant select, no Next button — tapping advances):
- My storefront (site/pages/photos/branding)
- My menu (items, prices, photos, descriptions)
- My dashboard (something confusing/broken/wanted)
- Orders & delivery
- Marketing & promos (campaigns, offers, SMS/email)
- 💡 An idea (suggestions for us — feature ideas, marketing ideas, anything)
- Something else

**Step 2 — "Show us where."** THE signature moment, per-category:
- *Storefront:* render a live mini-preview of THEIR actual storefront (scaled
  iframe/screenshot) with tappable hotspot regions — hero, menu section, hours,
  photos, footer. Tap the part that needs work; it highlights with a brass ring.
  ("Point at it like you'd point at a menu.")
- *Menu:* their real menu list (from the DB) with search — tap the item(s). Multi-
  select allowed.
- *Dashboard:* grid of dashboard areas (Today, Orders, Menu manager, Marketing,
  Settings, Reports) as cards.
- *Marketing / Idea / Something else:* skip straight to Step 3.
Every Step 2 screen has a "Not sure — skip" link. Never trap anyone.

**Step 3 — "What do you need?"** Chips (tap to select): Fix something broken ·
Change/update it · Add something new · Teach me how · Other. Then:
- **Note field** — optional, placeholder "Tell us in your own words — English or
  Arabic". 
- **Voice note button** — record up to 60s (MediaRecorder, upload to a private
  storage bucket). Restaurant owners talk faster than they type; this is the killer
  input. Playback + re-record before submit.
- **Photo attach** — snap a screenshot/photo (private bucket, 4MB cap, same rules as
  menu images).
- Big brass **Send request** button.

**Confirmation screen:** checkmark animation + "Got it. We're on it — done within 24
hours. We'll text you when it's live." (SMS via existing adapter.)

## 3. Request tracking (theirs)

The tab lists their requests like order cards: status pill **Received → In progress →
Done** (+ "Waiting on you" state if we asked a question), timestamps, the note/voice
attached, and our reply message on completion. Done cards show "Completed in 6h" —
the SLA becomes visible proof. They can reply once per request (thread-lite, not a
chat).

## 4. Our side (/admin)

- New /admin **Requests queue**: every request with restaurant, category, target
  (storefront section/menu item ids), note, voice player, photo, and an **SLA
  countdown badge** (green <12h, brass <20h, clay overdue). Sortable, filterable.
- One-click status changes + a reply box (reply triggers the diner-grade SMS +
  dashboard update). Audit-logged like other admin actions.
- Email notification to LEADS_EMAIL on every new request; anything overdue appears
  in a daily 9am digest (reuse cron infra).
- Requests tagged Marketing or Idea get a 💡 flag — these are product/marketing gold,
  never let them rot in a fix queue.

## 5. Data (migration)

`service_requests`: id, restaurant_id FK, category, target jsonb (e.g.
{page:'storefront', section:'hero'} or {menuItemIds:[...]}), kind, note, note_locale,
voice_url, photo_url, status ('received'|'in_progress'|'waiting'|'done'), reply text,
created_at, updated_at, completed_at. RLS: members manage own restaurant's rows;
super_admin all. Storage: private `request-media` bucket (voice+photos, no public
read).

## 6. Rules

- The 24-hour promise appears in the tab, the confirmation, and the SMS. (Zizo
  fulfills it — the system's job is to make it impossible to miss one.)
- Requests that touch pricing/fees/checkout get auto-flagged in admin per CLAUDE.md —
  those need Zizo's explicit call, the SLA badge still applies.
- EN/AR from day one (owners will write/speak Arabic — that's expected, not an edge
  case). Voice notes need no translation infra — Zizo speaks Arabic.
- Design language: glow system from design-pass-3, dense-and-modern like the
  design-pass-2 work. This tab should feel like the most premium screen in the
  dashboard — it's where we prove the "we take care of you" pitch.

## Definition of done
- [ ] 3-tap flow works on a 390px phone incl. voice note record/playback
- [ ] Storefront hotspot picker renders the restaurant's real storefront
- [ ] Menu picker lists their real items
- [ ] Request → admin queue with SLA countdown; reply → SMS + status update on both sides
- [ ] Email on new request; overdue digest wired to cron
- [ ] RLS verified (restaurant A can never see restaurant B's requests)
- [ ] EN + AR, RTL verified
