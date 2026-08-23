-- Phase 8C: per-restaurant order funnel (storefront view → add to cart →
-- checkout started; "paid" comes from the orders table). No PII: the
-- session is a server-side hash of a random client id — no phone, no
-- name, no IP is ever stored here.

create table storefront_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants(id) on delete cascade,
  session_hash text not null,
  step text not null check (step in ('view', 'add_to_cart', 'checkout_start')),
  created_at timestamptz not null default now()
);
create index storefront_events_restaurant_created
  on storefront_events (restaurant_id, created_at desc);

alter table storefront_events enable row level security;
-- Writes go through the service role only (no anon/member insert policy).
create policy "members read own events" on storefront_events
  for select using (is_member_of(restaurant_id) or is_super_admin());
