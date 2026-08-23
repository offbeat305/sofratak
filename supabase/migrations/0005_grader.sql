-- Restaurant Grader (lead-gen tool): scan a restaurant's online presence,
-- score it, gate the full report behind an email → leads row.

alter table leads drop constraint leads_kind_check;
alter table leads add constraint leads_kind_check check (kind in ('demo', 'estimate', 'grader'));

-- Cache a completed scan by Google place_id for 7 days so a repeat grade
-- (same restaurant re-graded, or an anonymous visitor who never unlocks
-- the report) never re-pays for Places/PageSpeed calls. Not tied to a
-- lead row — a lead only gets written once someone unlocks the report
-- with their email (0005 comment: this is what keeps "every completed
-- grade = a lead" true without also making every anonymous scan billable
-- twice).
create table grader_cache (
  place_id text primary key,
  restaurant_name text not null,
  scan jsonb not null,
  score jsonb not null,
  created_at timestamptz not null default now()
);
alter table grader_cache enable row level security;

-- Hard daily cap on paid Places API calls (Zizo's ask: "with a hard daily
-- cap so it can't run away"). One row per day, atomically incremented
-- before each paid call; the app refuses new calls once the cap is hit
-- for that UTC day. Not meant to track real cost — the Places free tier
-- already covers normal volume — this is only a runaway-loop backstop.
create table grader_api_usage (
  usage_date date primary key default current_date,
  autocomplete_count int not null default 0,
  details_count int not null default 0
);
alter table grader_api_usage enable row level security;

-- Atomic "increment only if under cap" (same conditional-UPDATE idiom as
-- markOrderPaid/markCancelExportSent) — avoids a read-then-write race
-- letting concurrent requests blow past the daily cap.
create or replace function increment_grader_usage(column_name text, cap int)
returns boolean
language plpgsql
as $$
declare
  today date := current_date;
  updated int;
begin
  insert into grader_api_usage (usage_date) values (today) on conflict (usage_date) do nothing;
  if column_name = 'autocomplete_count' then
    update grader_api_usage set autocomplete_count = autocomplete_count + 1
      where usage_date = today and autocomplete_count < cap;
  elsif column_name = 'details_count' then
    update grader_api_usage set details_count = details_count + 1
      where usage_date = today and details_count < cap;
  else
    raise exception 'invalid column_name: %', column_name;
  end if;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;
