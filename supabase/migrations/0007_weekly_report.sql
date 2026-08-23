-- Phase 6: weekly Monday owner report. Reuses automation_log as the
-- idempotency guard (one report per restaurant per ISO week) — just
-- needs the kind constraint widened.

alter table automation_log drop constraint automation_log_kind_check;
alter table automation_log add constraint automation_log_kind_check
  check (kind in ('win_back', 'welcome', 'review_request', 'birthday', 'weekly_report'));
