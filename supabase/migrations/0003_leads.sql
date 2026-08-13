-- Marketing site lead capture: demo requests + estimator "text me" forms.
-- Service-role access only (no public policies) — forms go through the server.
create table leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('demo', 'estimate')),
  name text not null default '',
  phone text not null default '',
  email text,
  restaurant text,
  city text,
  message text,
  data jsonb not null default '{}',   -- estimator numbers snapshot, etc.
  locale text not null default 'en' check (locale in ('en','ar')),
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
