-- 0012: hand-written listing descriptions (Zizo's directory decision #5b/#5c)
--
-- custom_blurb overrides Google's live editorialSummary on the listing
-- page when present. Curated blurbs for top restaurants arrive as data;
-- claimed restaurants edit theirs from the dashboard (written to their
-- claimed listing row). Nullable on purpose — most rows have neither.

alter table directory_listings
  add column if not exists custom_blurb text,
  add column if not exists custom_blurb_ar text;
