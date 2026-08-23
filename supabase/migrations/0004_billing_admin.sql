-- Phase 7: platform subscription billing + internal Sofratak admin.
-- Subscription billing is SEPARATE from Stripe Connect (0002): Connect
-- moves diner→restaurant food money; this is restaurant→Sofratak SaaS fee,
-- billed on the platform's own Stripe account (no connected-account header).

alter table restaurants add column if not exists stripe_customer_id text;
alter table restaurants add column if not exists subscription_id text;
alter table restaurants add column if not exists subscription_tier text
  check (subscription_tier in ('starter', 'growth', 'partner'));
alter table restaurants add column if not exists subscription_status text
  not null default 'none'
  check (subscription_status in ('none', 'active', 'past_due', 'canceled'));
alter table restaurants add column if not exists subscription_period_end timestamptz;
alter table restaurants add column if not exists subscription_canceled_at timestamptz;
-- Set once per restaurant so a retried/duplicate webhook never re-sends
-- the cancellation data export.
alter table restaurants add column if not exists cancel_export_sent_at timestamptz;

-- Internal-only audit trail: every sensitive admin action (impersonation,
-- onboarding, menu import commits) gets a row. Service-role write only.
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  actor_email text not null,
  action text not null,
  target_restaurant_id text references restaurants(id) on delete set null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table admin_audit_log enable row level security;

create policy "super admin reads audit log" on admin_audit_log
  for select using (is_super_admin());

-- NOTE: restaurants already has "public read restaurants" (0001, for the
-- storefront), which now also exposes stripe_customer_id/subscription_id
-- on that same row to anon reads. Low-severity (IDs are useless without
-- our secret key, not credentials) but worth tightening in the Phase 8
-- RLS audit — e.g. split billing fields into a service-role-only table.
