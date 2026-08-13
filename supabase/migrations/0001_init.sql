-- Sofratak Phase 2 schema: tenants, menus, orders.
-- Multi-tenant: every tenant table carries restaurant_id + RLS (CLAUDE.md).
-- Money is integer cents everywhere.

create extension if not exists "pgcrypto";

-- ── Tenants ─────────────────────────────────────────────────────────────
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name jsonb not null,             -- {en, ar}
  tagline jsonb not null default '{"en":"","ar":""}',
  logo_url text,
  cover_url text,
  brand jsonb not null default '{"primary":"#2F4A3C","accent":"#A9792B"}',
  halal boolean not null default false,
  phone text not null default '',
  address jsonb not null default '{}',
  timezone text not null default 'America/New_York',
  hours jsonb not null default '[]',
  instagram_url text,
  google_reviews_url text,
  ordering jsonb not null default '{"pickup":true,"delivery":false,"deliveryFeeCents":0,"deliveryMinimumCents":0,"prepMinutes":20,"paused":false}',
  created_at timestamptz not null default now()
);

-- Staff membership: which auth user belongs to which tenant, with what role.
create table restaurant_members (
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  primary key (restaurant_id, user_id)
);

create or replace function is_member_of(rid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from restaurant_members
    where restaurant_id = rid and user_id = auth.uid()
  );
$$;

create or replace function is_super_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin';
$$;

-- ── Menu ────────────────────────────────────────────────────────────────
create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name jsonb not null,
  sort int not null default 0
);

create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name jsonb not null,
  min int not null default 0,
  max int not null default 1,
  options jsonb not null default '[]'  -- [{id, name:{en,ar}, priceDeltaCents}]
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references menu_categories(id) on delete cascade,
  name jsonb not null,
  description jsonb not null default '{"en":"","ar":""}',
  price_cents int not null check (price_cents >= 0),
  image_url text,
  sold_out boolean not null default false,
  modifier_group_ids uuid[] not null default '{}',
  sort int not null default 0
);

-- ── Orders ──────────────────────────────────────────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  number text not null,
  status text not null default 'received'
    check (status in ('received','preparing','ready','out_for_delivery','completed','canceled')),
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  scheduled_for timestamptz,           -- null = ASAP
  customer jsonb not null,             -- {name, phone, smsOptIn}
  delivery_address text,
  lines jsonb not null,                -- denormalized order lines (see types.ts)
  subtotal_cents int not null,
  service_fee_cents int not null,      -- $0.79 diner-paid Sofratak fee
  delivery_fee_cents int not null default 0,
  tip_cents int not null default 0,    -- 100% to restaurant
  total_cents int not null,
  payment_status text not null default 'paid'
    check (payment_status in ('paid','refunded','partially_refunded')),
  payment_ref text not null default '',
  locale text not null default 'en' check (locale in ('en','ar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_restaurant_created on orders (restaurant_id, created_at desc);

create table sms_log (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  to_phone text not null,
  body text not null,
  sent_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────
alter table restaurants enable row level security;
alter table restaurant_members enable row level security;
alter table menu_categories enable row level security;
alter table modifier_groups enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table sms_log enable row level security;

-- Storefront is public: anyone may read restaurant + menu.
create policy "public read restaurants" on restaurants
  for select using (true);
create policy "public read categories" on menu_categories
  for select using (true);
create policy "public read modifier groups" on modifier_groups
  for select using (true);
create policy "public read items" on menu_items
  for select using (true);

-- Tenant staff manage their own restaurant; super admin manages all.
create policy "members update restaurant" on restaurants
  for update using (is_member_of(id) or is_super_admin());
create policy "admin insert restaurant" on restaurants
  for insert with check (is_super_admin());

create policy "members read own membership" on restaurant_members
  for select using (user_id = auth.uid() or is_super_admin());
create policy "admin manage members" on restaurant_members
  for all using (is_super_admin());

create policy "members write categories" on menu_categories
  for all using (is_member_of(restaurant_id) or is_super_admin());
create policy "members write modifier groups" on modifier_groups
  for all using (is_member_of(restaurant_id) or is_super_admin());
create policy "members write items" on menu_items
  for all using (is_member_of(restaurant_id) or is_super_admin());

-- Orders: no anonymous reads (diner status page + order creation go through
-- the server with the service role; the order id is the capability).
-- Tenant staff see only their own orders. No cross-tenant reads, ever.
create policy "members read own orders" on orders
  for select using (is_member_of(restaurant_id) or is_super_admin());
create policy "members update own orders" on orders
  for update using (is_member_of(restaurant_id) or is_super_admin());

create policy "members read own sms" on sms_log
  for select using (is_member_of(restaurant_id) or is_super_admin());
