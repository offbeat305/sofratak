-- Directory comprehensive-coverage layer (Zizo, Aug 2026): bulk OSM
-- import + community "Add a restaurant" suggestions.

-- 'osm' source: rows imported from OpenStreetMap via Overpass. OSM data
-- is ODbL-licensed and legally storable; the UI carries the required
-- "© OpenStreetMap contributors" attribution.
alter table directory_listings drop constraint directory_listings_source_check;
alter table directory_listings add constraint directory_listings_source_check
  check (source in ('seed', 'places', 'manual', 'osm'));

-- Stable OSM element id ("node/123", "way/456") — the dedupe key for
-- re-imports, same role google_place_id plays for Places rows.
alter table directory_listings add column if not exists osm_id text;
create unique index if not exists directory_listings_osm_id
  on directory_listings (osm_id) where osm_id is not null;

-- Review queue: OSM hits whose ONLY cuisine tag is the ambiguous
-- "mediterranean" (could be Greek/Italian) import unpublished; Zizo
-- approves which are actually Arab from /admin/directory. Everything
-- already live stays published (default true).
alter table directory_listings add column if not exists published boolean not null default true;

-- Community suggestions land in leads for MANUAL approval — a
-- suggestion never auto-publishes a listing.
alter table leads drop constraint leads_kind_check;
alter table leads add constraint leads_kind_check
  check (kind in ('demo', 'estimate', 'grader', 'claim', 'suggestion'));
