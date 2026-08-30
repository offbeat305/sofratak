-- 0016: Expo push token per order, for the native diner app
-- (docs/mobile-app-spec.md §2). Nullable — web orders never set it. The
-- app sends its token at order placement; status transitions then push
-- to it in addition to the existing SMS. Additive, no constraint changes.

alter table orders add column push_token text;
