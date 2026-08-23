-- Phase 8A: RLS lockdown. Every storefront/marketing read is server-
-- rendered through the service-role client (verified: the browser
-- Supabase client is used for auth only — sign-in/sign-out — and the
-- anon-key server client touches only restaurant_members). The blanket
-- public-read policies from 0001/0006 therefore serve no code path and
-- only expose data to anonymous PostgREST queries:
--   - restaurants: stripe_customer_id / subscription_id / loyalty +
--     automation configs (the known Phase-7 audit item)
--   - menu tables: full-catalog scraping
--   - offer_codes: enumeration of every active discount code
-- Offer-code checkout validation is NOT affected: it reads and
-- increments via the service role (supabase-store.ts), never anon.

drop policy "public read restaurants" on restaurants;
drop policy "public read categories" on menu_categories;
drop policy "public read modifier groups" on modifier_groups;
drop policy "public read items" on menu_items;
drop policy "public read active offer codes" on offer_codes;
