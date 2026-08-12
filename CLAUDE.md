# Sofratak — Project Constitution

## Product
Multi-tenant restaurant operating system. Each restaurant gets a branded ordering storefront on its own subdomain, a dashboard (orders, menu, CRM, marketing, reports), and diners order + pay online. I (platform owner) manage everything from a super-admin panel.

## Tech stack (do not deviate without asking)
- Next.js 14+ App Router + TypeScript, one monorepo
- Supabase: Postgres + Auth + Row Level Security for tenant isolation
- Stripe Connect: each restaurant is a connected account, money goes to them, platform can take a per-order fee. Card data never touches our servers — Stripe Checkout/Elements only. Money stored in cents (integers).
- Twilio (SMS), Resend (email)
- Vercel hosting, wildcard subdomains: {restaurant}.sofratak.com
- Tailwind CSS with the Sofratak design tokens from docs/branding.md. shadcn/ui allowed but always restyled to brand — never default shadcn look.
- next-intl: English + Arabic with TRUE RTL (mirrored nav, reversed arrows, native-feeling forms). Never just right-align LTR layouts.
- Otter integration: isolated module /lib/integrations/otter/ behind an interface with a MOCK implementation. Nothing else imports Otter directly. Real API later.

## Roles & structure
- Roles: super_admin (me), restaurant (owner/staff, scoped to their tenant), diner (customers).
- Every tenant table has restaurant_id + RLS policy. No cross-tenant reads ever. Write RLS tests.
- Route groups: app/(marketing) public site · app/(storefront) diner ordering via subdomain middleware · app/(dashboard) restaurant · app/(admin) super admin.

## Phases (build in order, never skip ahead)
- Phase 0: design system + marketing site + savings calculator
- Phase 1: tenants, auth (3 roles), menu builder with modifier groups, storefront + cart + Stripe Checkout (test mode), live orders screen
- Phase 2: CRM (customer book auto-built from orders), segments, SMS/email campaigns, weekly report
- Phase 3: real Otter, loyalty, catering, Business Vault, inventory, delivery zones
- Payroll: permanently out of scope.

## Quality bar
- Mobile-first (restaurant owners live on phones). Accessible: visible focus, strong contrast, reduced motion respected.
- Conventional commits. After each session update docs/PROGRESS.md with what was built + what's next.
- Any decision not covered here: propose and ask before implementing.
