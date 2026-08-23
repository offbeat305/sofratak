-- Phase 5: marketing suite — email/SMS campaigns, offer codes, automations,
-- loyalty. Already promised on the public pricing page (Growth: "SMS and
-- email campaigns", "Offer codes and win-back automation"; Partner:
-- "Loyalty program") — this migration is closing that gap, not adding a
-- speculative feature. See docs/phase5-marketing-spec.md.

-- ── Campaigns (email + SMS) ─────────────────────────────────────────────
create table campaigns (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  segment text not null check (segment in ('all', 'vip', 'lapsed', 'new')),
  subject text,               -- email only
  body text not null,
  recipient_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index campaigns_restaurant_created on campaigns (restaurant_id, created_at desc);

-- ── Marketing SMS/email opt-in — separate from the transactional
-- smsOptIn captured per-order (orders.customer->>'smsOptIn'). TCPA
-- treats marketing consent as its own thing; STOP must suppress this
-- record permanently without touching transactional order texts.
create table marketing_optins (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  phone text not null,
  email text,
  sms_opted_in boolean not null default false,
  email_opted_in boolean not null default false,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text not null default 'checkout',
  unique (restaurant_id, phone)
);

-- ── Customer profile extras (birthday today; room to grow) — populated
-- from a post-order opt-in prompt, never added to checkout itself so the
-- core ordering flow never gets slower.
create table customer_profiles (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  phone text not null,
  birthday date,
  updated_at timestamptz not null default now(),
  unique (restaurant_id, phone)
);

-- ── Offer codes ─────────────────────────────────────────────────────────
create table offer_codes (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  code text not null,
  type text not null check (type in ('percent', 'flat')),
  -- percent: 1-100; flat: cents off
  value int not null check (value > 0),
  max_uses int,                 -- null = unlimited
  use_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, code)
);
alter table orders add column if not exists offer_code text;
alter table orders add column if not exists discount_cents int not null default 0;

-- ── Loyalty ─────────────────────────────────────────────────────────────
alter table restaurants add column if not exists loyalty_settings jsonb not null default
  '{"enabled": false, "centsPerPoint": 100, "rewards": []}';

create table loyalty_accounts (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  phone text not null,
  points int not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  unique (restaurant_id, phone)
);
create table loyalty_ledger (
  id text primary key default gen_random_uuid()::text,
  account_id text not null references loyalty_accounts(id) on delete cascade,
  delta int not null,           -- positive = earn, negative = redeem
  reason text not null,         -- e.g. 'order:<orderId>', 'redeem:<rewardId>'
  created_at timestamptz not null default now()
);

-- ── Automations ─────────────────────────────────────────────────────────
alter table restaurants add column if not exists automations jsonb not null default
  '{"winBack": true, "welcome": true, "reviewRequest": true, "birthday": false}';

-- Idempotency guard: a (restaurant, kind, phone, ref) row can only exist
-- once, so a retried cron run or webhook redelivery never double-sends.
-- ref = the order id for post-order triggers, a "YYYY-MM" bucket for
-- recurring ones like win-back.
create table automation_log (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  kind text not null check (kind in ('win_back', 'welcome', 'review_request', 'birthday')),
  phone text not null,
  ref text not null,
  sent_at timestamptz not null default now(),
  unique (restaurant_id, kind, phone, ref)
);

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table campaigns enable row level security;
alter table marketing_optins enable row level security;
alter table customer_profiles enable row level security;
alter table offer_codes enable row level security;
alter table loyalty_accounts enable row level security;
alter table loyalty_ledger enable row level security;
alter table automation_log enable row level security;

create policy "members manage campaigns" on campaigns
  for all using (is_member_of(restaurant_id) or is_super_admin());
create policy "members manage optins" on marketing_optins
  for all using (is_member_of(restaurant_id) or is_super_admin());
create policy "members manage profiles" on customer_profiles
  for all using (is_member_of(restaurant_id) or is_super_admin());
create policy "members manage offer codes" on offer_codes
  for all using (is_member_of(restaurant_id) or is_super_admin());
create policy "members read loyalty accounts" on loyalty_accounts
  for select using (is_member_of(restaurant_id) or is_super_admin());
create policy "members read loyalty ledger" on loyalty_ledger
  for select using (
    exists (
      select 1 from loyalty_accounts a
      where a.id = loyalty_ledger.account_id
        and (is_member_of(a.restaurant_id) or is_super_admin())
    )
  );
create policy "members read automation log" on automation_log
  for select using (is_member_of(restaurant_id) or is_super_admin());

-- Redeeming an offer code at checkout needs a public, narrow read (code +
-- validity only) — same shape as "public read restaurants" in 0001. The
-- server still does the atomic use_count increment via service role.
create policy "public read active offer codes" on offer_codes
  for select using (active = true);
