-- 0014: widen the leads kind constraint for the marketing completion pass
-- (docs/design-pass-7-marketing-complete.md).
--
--   contact       the new /contact page form
--   city_request  "not in your city yet? tell us" on the cities index
--   story_signup  "get new guides when they drop" on /stories
--
-- Same drop/add shape as 0005, 0010, and 0011.

alter table leads drop constraint leads_kind_check;
alter table leads add constraint leads_kind_check
  check (kind in (
    'demo', 'estimate', 'grader', 'claim', 'suggestion',
    'contact', 'city_request', 'story_signup'
  ));
