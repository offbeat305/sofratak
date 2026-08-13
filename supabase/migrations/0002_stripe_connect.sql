-- Stripe Connect: each restaurant is a connected account (direct charges —
-- restaurant is merchant of record, pays processing at cost; Sofratak takes
-- the $0.79 application fee per order).
alter table restaurants add column if not exists stripe_account_id text;
alter table restaurants add column if not exists stripe_charges_enabled boolean not null default false;
