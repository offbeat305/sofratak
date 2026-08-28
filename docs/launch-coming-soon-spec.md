# Launch: Coming Soon Gate

**From Zizo. Get sofratak.com live today with a "coming soon" holding page,**
**without waiting for the rest of the build.** This is a single-flag maintenance
gate, not a new page in isolation — when the site is ready, Zizo flips one env
var and the real site appears instantly. No re-deploy, no code change, no
digging out the gate later.

---

## 1. The gate

- New env var: `MAINTENANCE_MODE` (`"true"` / unset). Read in `src/middleware.ts`.
- When `MAINTENANCE_MODE=true`: every request except `/admin/*`, `/api/*`, and
  the coming-soon route itself gets rewritten to `/{locale}/coming-soon`. This
  keeps `/admin` reachable so Zizo can still work, and keeps API routes (cron,
  webhooks) alive.
- When unset or `false`: middleware behaves exactly as it does today. No other
  behavior changes.
- This must be a rewrite, not a redirect — the URL bar should still show
  whatever the visitor typed (sofratak.com stays sofratak.com), not
  /coming-soon, so nothing looks broken when it flips off later.

## 2. The page — `/{locale}/coming-soon`

On-brand, calm, one screen, no scroll needed on a phone:

- Ivory background, dot-grid/arch texture at 2-3% olive per branding.md.
- Logo/wordmark centered top.
- Cormorant headline: EN "Something good is cooking." / AR equivalent (queue
  for Zizo's Arabic review, do not ship unreviewed copy).
- Manrope sub-line: "Sofratak is almost here. The first restaurant platform
  built for Arab and halal restaurants, commission-free ordering, real
  control." 
- Email capture: single input + brass button "Notify me" -> reuses the
  existing `src/lib/leads.ts` path, `kind: 'coming_soon'` (needs adding to the
  `leads_kind_check` constraint the same way `city_request`/`story_signup`
  were added in migration 0014 — new migration, don't hand-edit 0014).
- Small footer: WhatsApp contact link (`NEXT_PUBLIC_WHATSAPP_NUMBER`), EN/AR
  toggle, "(c) 2026 Sofratak, an Offbeat Creative company."
- No nav, no other links. This is a wall, not a mini-site.
- One subtle brass glow behind the headline, per the design-pass-3 glow
  system, reduced-motion-gated. Everything else calm and static.

## 3. What does NOT change

- `/admin` stays fully reachable so Zizo can keep working behind the gate.
- The dashboard, storefront, and every existing route stay in the codebase
  untouched — the gate sits in front of them, it doesn't remove them.
- No changes to any pricing, fee, or checkout logic (nothing here touches
  that surface).

## Definition of done

- [ ] `MAINTENANCE_MODE=true` locally shows the coming-soon page on every
      route except `/admin/*` and `/api/*`; URL bar unaffected (rewrite not
      redirect)
- [ ] `MAINTENANCE_MODE` unset/false: zero behavior change from today
- [ ] Email capture creates a lead with `kind: 'coming_soon'`, migration adds
      it to the `leads_kind_check` constraint
- [ ] Coming-soon page: 390px mobile, EN/AR + RTL, reduced-motion audit
- [ ] Confirms in the handoff which env var to set in Vercel to turn it on,
      and confirms turning it off requires no redeploy (just flip the var)
