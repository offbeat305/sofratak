-- Sofratak Directory (docs/directory-spec.md): every Arab/halal
-- restaurant in target metros listed; Sofratak clients render as
-- Verified with Order Now, everyone else is a factual listing with a
-- claim funnel. Public factual data by design.

create table directory_listings (
  id uuid primary key default gen_random_uuid(),
  -- metro slug ('tampa', 'dearborn') — see src/content/eat-cities.ts
  city text not null,
  slug text not null,
  name text not null,
  address text not null default '',
  lat double precision,
  lng double precision,
  phone text,
  -- DayHours[] shape when present; null = hours unknown (most seeds)
  hours jsonb,
  cuisines text[] not null default '{}',
  -- Three-state rule (marketplace-vision.md legal guardrail #4):
  -- 'verified' is only ever set on claimed rows (enforced in app code);
  -- 'reported' needs a credible source; default is no badge at all.
  halal_status text not null default 'unknown'
    check (halal_status in ('verified', 'reported', 'unknown')),
  -- Store the Google place ID ONLY — never cached Places content
  -- (legal guardrail #5, same rule as the Grader).
  google_place_id text,
  claimed_restaurant_id text references restaurants(id) on delete set null,
  source text not null default 'seed' check (source in ('seed', 'places', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city, slug)
);
create index directory_listings_city on directory_listings (city);

alter table directory_listings enable row level security;
-- Deliberately public-read (unlike the 0008 lockdown): this table IS
-- the public product — factual listing data, nothing sensitive.
create policy "public read directory" on directory_listings
  for select using (true);
-- Writes stay service-role only (no insert/update/delete policies).

-- Claim/takedown submissions flow into the existing leads pipeline.
alter table leads drop constraint leads_kind_check;
alter table leads add constraint leads_kind_check
  check (kind in ('demo', 'estimate', 'grader', 'claim'));
