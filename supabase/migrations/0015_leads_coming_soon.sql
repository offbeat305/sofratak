-- 0015: widen the leads kind constraint for the launch coming-soon gate
-- (docs/launch-coming-soon-spec.md).
--
--   coming_soon   the email capture on /coming-soon
--
-- Same drop/add shape as 0005, 0010, 0011, and 0014 — additive, does not
-- touch 0014.

alter table leads drop constraint leads_kind_check;
alter table leads add constraint leads_kind_check
  check (kind in (
    'demo', 'estimate', 'grader', 'claim', 'suggestion',
    'contact', 'city_request', 'story_signup', 'coming_soon'
  ));
