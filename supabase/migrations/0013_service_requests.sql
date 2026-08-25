-- 0013: Concierge Requests — "we fix it in 24 hours"
-- (docs/concierge-requests-spec.md)

create table service_requests (
  id text primary key default gen_random_uuid()::text,
  restaurant_id text not null references restaurants(id) on delete cascade,
  category text not null check (category in
    ('storefront','menu','dashboard','orders','marketing','idea','other')),
  -- where they pointed: {section:'hero'} | {menuItemIds:[...]} | {area:'orders'}
  target jsonb not null default '{}',
  kind text not null check (kind in ('fix','change','add','teach','other')),
  note text,
  note_locale text not null default 'en',
  voice_url text,
  photo_url text,
  status text not null default 'received'
    check (status in ('received','in_progress','waiting','done')),
  -- our completion/question message (shown in the dashboard + texted)
  reply text,
  -- the owner's one follow-up (thread-lite, not a chat)
  owner_reply text,
  -- CLAUDE.md: pricing/fee/checkout requests need Zizo's explicit call
  pricing_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index service_requests_restaurant_idx
  on service_requests (restaurant_id, created_at desc);
create index service_requests_open_idx
  on service_requests (status, created_at) where status <> 'done';

alter table service_requests enable row level security;

-- members manage their own restaurant's requests; super_admin sees all
create policy service_requests_member_select on service_requests
  for select using (
    exists (
      select 1 from memberships m
      where m.restaurant_id = service_requests.restaurant_id
        and m.user_id = auth.uid()::text
    )
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
create policy service_requests_member_insert on service_requests
  for insert with check (
    exists (
      select 1 from memberships m
      where m.restaurant_id = service_requests.restaurant_id
        and m.user_id = auth.uid()::text
    )
  );
create policy service_requests_admin_all on service_requests
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- Private media bucket: voice notes + photos. NO public read — the app
-- serves signed URLs; only the service role and super_admin touch it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-media', 'request-media', false, 4194304,
  array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;
