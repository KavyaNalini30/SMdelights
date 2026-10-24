-- =============================================================================
-- SM Delights — 02_rls_policies.sql
-- Run SECOND. Turns on Row Level Security for every table and defines who can do what.
--
--   Public (anyone)   : read active catalogue, active delivery zones, approved reviews;
--                       submit a corporate enquiry or a review (reviews start unapproved).
--   Signed-in customer: read/update own profile (not role), manage own addresses,
--                       read own orders.
--   Admin             : everything.
--   Orders & payments are only ever WRITTEN by the server (service role key),
--   which bypasses RLS — never from the browser.
-- Safe to re-run.
-- =============================================================================

alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.profiles             enable row level security;
alter table public.addresses            enable row level security;
alter table public.delivery_zones       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments             enable row level security;
alter table public.corporate_enquiries  enable row level security;
alter table public.reviews              enable row level security;
alter table public.rate_limits          enable row level security; -- no policies: service role only

-- ---------- Table privileges -------------------------------------------------
-- Explicit grants (newer Supabase projects don't always add them automatically).
-- Privileges say which operations are possible at all; the policies below decide which ROWS.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_variants,
                public.delivery_zones, public.reviews to anon, authenticated;
grant insert on public.corporate_enquiries, public.reviews to anon, authenticated;
grant select, insert, update, delete on
  public.categories, public.products, public.product_variants, public.delivery_zones,
  public.addresses, public.corporate_enquiries, public.reviews to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.payments to authenticated;
grant select, insert on public.order_status_history to authenticated;
grant select on public.profiles to authenticated;
revoke all on public.rate_limits from anon, authenticated;

-- Drop old versions of our policies so this file can be re-run.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and policyname like 'smd_%'
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ---------- Catalogue --------------------------------------------------------
create policy smd_categories_read on public.categories
  for select using (is_active or (select public.is_admin()));
create policy smd_categories_admin on public.categories
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy smd_products_read on public.products
  for select using (is_active or (select public.is_admin()));
create policy smd_products_admin on public.products
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy smd_variants_read on public.product_variants
  for select using (
    (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active))
    or (select public.is_admin())
  );
create policy smd_variants_admin on public.product_variants
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy smd_zones_read on public.delivery_zones
  for select using (is_active or (select public.is_admin()));
create policy smd_zones_admin on public.delivery_zones
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Profiles ---------------------------------------------------------
create policy smd_profiles_read on public.profiles
  for select using (id = (select auth.uid()) or (select public.is_admin()));
create policy smd_profiles_update_own on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy smd_profiles_admin on public.profiles
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

-- Customers may only change these columns of their own row — never `role`.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated; -- rows come from the sign-up trigger

-- ---------- Addresses --------------------------------------------------------
create policy smd_addresses_own on public.addresses
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy smd_addresses_admin_read on public.addresses
  for select using ((select public.is_admin()));

-- ---------- Orders (read-only for customers) ---------------------------------
create policy smd_orders_read on public.orders
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy smd_orders_admin_update on public.orders
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

create policy smd_order_items_read on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin())))
  );

create policy smd_order_history_read on public.order_status_history
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin())))
  );
create policy smd_order_history_admin_insert on public.order_status_history
  for insert with check ((select public.is_admin()));

create policy smd_payments_admin_read on public.payments
  for select using ((select public.is_admin()));

-- ---------- Corporate enquiries ---------------------------------------------
create policy smd_enquiries_submit on public.corporate_enquiries
  for insert to anon, authenticated
  with check (status = 'new' and admin_note is null);
create policy smd_enquiries_admin on public.corporate_enquiries
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Reviews ----------------------------------------------------------
create policy smd_reviews_read on public.reviews
  for select using (is_approved or (select public.is_admin()));
create policy smd_reviews_submit on public.reviews
  for insert to anon, authenticated
  with check (is_approved = false and image_url is null);
create policy smd_reviews_admin on public.reviews
  for all using ((select public.is_admin())) with check ((select public.is_admin()));
