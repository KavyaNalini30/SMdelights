-- =============================================================================
-- SM Delights — 06_remove_products.sql   (catalogue update, 25 October 2026)
-- Run once in the Supabase SQL Editor on a database that was set up before this date.
-- (New projects don't need it: 03_seed_data.sql no longer contains these products.)
-- Safe to re-run.
--
-- 1. Removes Brownie Family Box, Fruit & Nut Cake and Cookie Tin.
--    Products that appear in past orders are HIDDEN instead of deleted, so order
--    history stays intact; the others are deleted (their sizes/prices go with them).
-- 2. Points four products at their new photos.
-- =============================================================================

with retired as (
  select id from public.products
  where slug in ('brownie-family-box', 'fruit-and-nut-cake', 'cookie-tin')
),
in_orders as (
  select distinct product_id as id from public.order_items where product_id in (select id from retired)
),
hidden as (
  update public.products set is_active = false, is_bestseller = false
  where id in (select id from in_orders)
  returning slug
)
delete from public.products
where id in (select id from retired) and id not in (select id from in_orders);

-- New photos (only replaces the built-in /images/... paths, never photos uploaded in the admin panel).
update public.products p
set images = array[v.image]
from (values
  ('london-cake',                 '/images/products/london-cake.webp'),
  ('nutella-boba-shake',          '/images/products/nutella-boba-shake.webp'),
  ('lychee-sago-drink',           '/images/products/lychee-sago-drink.webp'),
  ('brownie-hot-chocolate-combo', '/images/products/brownie-hot-chocolate-combo.webp')
) as v(slug, image)
where p.slug = v.slug
  and (p.images = '{}' or p.images[1] like '/images/%');

-- Gift box copy no longer mentions cookie tins.
update public.categories
set description = 'Brownie boxes, family boxes and combos — perfect for celebrations and gifting.'
where slug = 'gift-boxes';

-- Check: should return no rows for the removed products (or show them with is_active = false).
select slug, is_active from public.products
where slug in ('brownie-family-box', 'fruit-and-nut-cake', 'cookie-tin');
