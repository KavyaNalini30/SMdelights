-- =============================================================================
-- SM Delights — 03_seed_data.sql
-- Run THIRD. Loads categories, products, prices and delivery zones.
-- Every item and price is taken from the client's "Client Input" document
-- (section 1, FINAL MENU PRICES). Prices are in paise: ₹70 = 7000.
-- Safe to re-run: existing rows are updated by slug, nothing is duplicated.
-- After launch, edit products in the admin panel rather than re-running this file
-- (re-running resets prices/descriptions of these products to the values below).
-- =============================================================================

-- ---------- Categories -------------------------------------------------------
insert into public.categories (slug, name, description, image, sort, is_enquiry_only) values
  ('brownies',         'Brownies',                      'Signature brownies, brownie tubs and marshmallow brownies — rich, fudgy, irresistible.', '/images/products/classic-melo-brownie.webp', 1, false),
  ('tea-cakes',        'Tea Cakes',                     'Soft, moist and perfect for tea time.',                                                  '/images/products/dry-fruit-and-nut-tea-cake.webp', 2, false),
  ('cookies-biscuits', 'Cookies & Biscuits',            'Crispy, buttery and freshly baked.',                                                     '/images/products/choco-chip-cookies.webp', 3, false),
  ('drinks',           'Drinks',                        'Hot chocolate, boba shakes and sago drinks.',                                            '/images/products/hot-chocolate.webp', 4, false),
  ('gift-boxes',       'Gift Boxes',                    'Brownie boxes, family boxes, cookie tins and combos — perfect for celebrations and gifting.', '/images/products/assorted-brownie-box.webp', 5, false),
  ('bulk-corporate',   'Bulk Party / Corporate Orders', 'Bulk, wedding, birthday and corporate gifting orders at custom pricing.',               '/images/bg/dusted-brownies.webp', 6, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, image = excluded.image,
  sort = excluded.sort, is_enquiry_only = excluded.is_enquiry_only;

-- ---------- Helper (session-only, removed automatically) ---------------------
create or replace function pg_temp.seed_product(
  p_category text, p_slug text, p_name text, p_description text, p_image text,
  p_shelf_life text, p_sort int, p_variants jsonb,
  p_chennai_only boolean default false, p_note_prompt text default null, p_active boolean default true
) returns void language plpgsql as $$
declare
  v_product uuid;
  v jsonb;
  i int := 0;
begin
  insert into public.products
    (category_id, slug, name, description, images, shelf_life, sort, chennai_only, allows_note, note_prompt, is_active)
  values (
    (select id from public.categories where slug = p_category),
    p_slug, p_name, p_description,
    case when p_image is null then '{}'::text[] else array[p_image] end,
    p_shelf_life, p_sort, p_chennai_only, p_note_prompt is not null, p_note_prompt, p_active
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    images = case when public.products.images = '{}' or public.products.images[1] like '/images/%'
                  then excluded.images else public.products.images end, -- keep admin-uploaded photos
    shelf_life = excluded.shelf_life, sort = excluded.sort, chennai_only = excluded.chennai_only,
    allows_note = excluded.allows_note, note_prompt = excluded.note_prompt
  returning id into v_product;

  for v in select * from jsonb_array_elements(p_variants) loop
    i := i + 1;
    insert into public.product_variants (product_id, label, price_paise, sort)
    values (v_product, v ->> 'label', ((v ->> 'rupees')::int) * 100, i)
    on conflict (product_id, label) do update set price_paise = excluded.price_paise, sort = excluded.sort;
  end loop;
end $$;

-- Shelf-life text, from section 2 of the document.
-- Brownies : room temp 3–7 days, fridge 1–2 weeks
-- Cookies  : room temp 3–7 days, fridge up to 2 weeks
-- Biscuits : room temp 1–2 days, fridge up to 2 weeks
-- Tea cakes: room temp 2–3 days, fridge 5–7 days
-- Boba     : best immediately; fridge max 24 h
-- Not given in the document (left blank, ask client): hot chocolate, sago drinks, London cake, combo.

-- ---------- 1. Brownies ------------------------------------------------------
-- Signature brownies — per piece. Descriptions from the client's menu poster.
select pg_temp.seed_product('brownies', 'classic-melo-brownie', 'Classic / Melo Brownie',
  'Our signature classic rich fudgy brownie.', '/images/products/classic-melo-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 1, '[{"label":"Per piece","rupees":70}]');
select pg_temp.seed_product('brownies', 'white-chocolate-brownie', 'White Chocolate Brownie',
  'White chocolate ganache & toppings.', '/images/products/white-chocolate-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 2, '[{"label":"Per piece","rupees":80}]');
select pg_temp.seed_product('brownies', 'cookies-and-cream-brownie', 'Cookies & Cream Brownie',
  'Cookies & cream frosting, Oreo topping.', '/images/products/cookies-and-cream-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 3, '[{"label":"Per piece","rupees":90}]');
select pg_temp.seed_product('brownies', 'ferrero-nutella-brownie', 'Ferrero Nutella Brownie',
  'Nutella filling, Ferrero Rocher chocolate, chocolate frosting.', '/images/products/ferrero-nutella-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 4, '[{"label":"Per piece","rupees":100}]');
select pg_temp.seed_product('brownies', 'triple-chocolate-brownie', 'Triple Chocolate Brownie',
  'Dark, milk & white chocolate.', '/images/products/triple-chocolate-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 5, '[{"label":"Per piece","rupees":100}]');
select pg_temp.seed_product('brownies', 'kitkat-brownie', 'KitKat Brownie',
  'White & milk chocolate cream, two KitKat bars on top.', '/images/products/kitkat-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 6, '[{"label":"Per piece","rupees":100}]');
select pg_temp.seed_product('brownies', 'dairy-milk-brownie', 'Dairy Milk Brownie',
  'Dairy Milk chocolate ganache & chocolate pieces.', '/images/products/dairy-milk-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 7, '[{"label":"Per piece","rupees":100}]');
select pg_temp.seed_product('brownies', 'pistachio-brownie', 'Pistachio Brownie',
  'Pistachio filling, pistachios & almonds.', '/images/products/pistachio-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 8, '[{"label":"Per piece","rupees":110}]');

-- Brownie tubs — one product per flavour (each has its own photo).
select pg_temp.seed_product('brownies', 'brownie-tub-milk-chocolate', 'Milk Chocolate Brownie Tub',
  'Rich, gooey, chocolatey brownie layers in a tub.', '/images/products/brownie-tub-milk-chocolate.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 9, '[{"label":"Tub","rupees":149}]');
select pg_temp.seed_product('brownies', 'brownie-tub-white-chocolate', 'White Chocolate Brownie Tub',
  'Rich, gooey, chocolatey brownie layers in a tub.', '/images/products/brownie-tub-white-chocolate.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 10, '[{"label":"Tub","rupees":149}]');
select pg_temp.seed_product('brownies', 'brownie-tub-dark-chocolate', 'Dark Chocolate Brownie Tub',
  'Rich, gooey, chocolatey brownie layers in a tub.', '/images/products/brownie-tub-dark-chocolate.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 11, '[{"label":"Tub","rupees":149}]');
select pg_temp.seed_product('brownies', 'brownie-tub-double-chocolate', 'Double Chocolate Brownie Tub',
  'Rich, gooey, chocolatey brownie layers in a tub.', '/images/products/brownie-tub-double-chocolate.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 12, '[{"label":"Tub","rupees":159}]');
select pg_temp.seed_product('brownies', 'brownie-tub-triple-chocolate', 'Triple Chocolate Brownie Tub',
  'Rich, gooey, chocolatey brownie layers in a tub.', '/images/products/brownie-tub-triple-chocolate.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 13, '[{"label":"Tub","rupees":169}]');
select pg_temp.seed_product('brownies', 'brownie-tub-pistachio-kunafa', 'Pistachio Kunafa Brownie Tub',
  'Rich, gooey brownie layers with pistachio kunafa.', '/images/products/brownie-tub-pistachio-kunafa.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 14, '[{"label":"Tub","rupees":179}]');

-- Marshmallow brownies — variant names exactly as in the document.
select pg_temp.seed_product('brownies', 'marshmallow-brownie', 'Marshmallow Brownie',
  'Soft, chewy, chocolatey — topped with toasted marshmallows.', '/images/products/marshmallow-brownie.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 15,
  '[{"label":"Single","rupees":109},{"label":"Double","rupees":119},{"label":"Triple","rupees":129},{"label":"Nutella","rupees":149}]');

-- ---------- 2. Tea cakes -----------------------------------------------------
select pg_temp.seed_product('tea-cakes', 'classic-vanilla-tea-cake', 'Classic Vanilla Tea Cake',
  'Soft, moist and perfect for tea time.', '/images/products/classic-vanilla-tea-cake.webp',
  'Room temperature: 2–3 days · Refrigerated: 5–7 days', 1, '[{"label":"Cake","rupees":200}]');
select pg_temp.seed_product('tea-cakes', 'chocolate-tea-cake', 'Chocolate Tea Cake',
  'Soft, moist and perfect for tea time.', '/images/products/chocolate-tea-cake.webp',
  'Room temperature: 2–3 days · Refrigerated: 5–7 days', 2, '[{"label":"Cake","rupees":250}]');
select pg_temp.seed_product('tea-cakes', 'banana-walnut-cake', 'Banana Walnut Cake',
  'Soft, moist and perfect for tea time.', '/images/products/banana-walnut-cake.webp',
  'Room temperature: 2–3 days · Refrigerated: 5–7 days', 3, '[{"label":"Cake","rupees":300}]');
select pg_temp.seed_product('tea-cakes', 'dry-fruit-and-nut-tea-cake', 'Dry Fruit & Nut Tea Cake',
  'Soft, moist and perfect for tea time.', '/images/products/dry-fruit-and-nut-tea-cake.webp',
  'Room temperature: 2–3 days · Refrigerated: 5–7 days', 4, '[{"label":"Cake","rupees":350}]');
select pg_temp.seed_product('tea-cakes', 'fruit-and-nut-cake', 'Fruit & Nut Cake',
  'Soft, moist and perfect for tea time.', null,
  'Room temperature: 2–3 days · Refrigerated: 5–7 days', 5, '[{"label":"Cake","rupees":350}]');
select pg_temp.seed_product('tea-cakes', 'london-cake', 'London Cake — Cake in a Cup',
  'Five layers of pure indulgence: chocolate sponge, chocolate cream, creamy chocolate filling, rich chocolate ganache and chocolate crumb.', null,
  null, 6, '[{"label":"Cup","rupees":69}]', true);

-- ---------- 3. Drinks (Chennai only — not suitable for shipping) -------------
select pg_temp.seed_product('drinks', 'hot-chocolate', 'Hot Chocolate',
  'Rich, creamy hot chocolate.', '/images/products/hot-chocolate.webp',
  null, 1, '[{"label":"200 ml","rupees":69},{"label":"250 ml","rupees":99}]', true);
select pg_temp.seed_product('drinks', 'white-chocolate-boba-shake', 'White Chocolate Boba Shake',
  'White chocolate shake with boba pearls.', '/images/products/white-chocolate-boba-shake.webp',
  'Best consumed immediately. Refrigerated: maximum 24 hours.', 2, '[{"label":"Shake","rupees":120}]', true);
select pg_temp.seed_product('drinks', 'nutella-boba-shake', 'Nutella Boba Shake',
  'Nutella shake with boba pearls.', null,
  'Best consumed immediately. Refrigerated: maximum 24 hours.', 3, '[{"label":"Shake","rupees":150}]', true);
select pg_temp.seed_product('drinks', 'lychee-sago-drink', 'Lychee Sago Drink',
  'Refreshing lychee drink with sago pearls.', null,
  null, 4, '[{"label":"Drink","rupees":100}]', true);
-- "Other available sago drink flavours ₹100": hidden until the client lists the flavours.
select pg_temp.seed_product('drinks', 'sago-drink', 'Sago Drink — Other Flavours',
  'Ask us on WhatsApp for today''s flavours.', null,
  null, 5, '[{"label":"Drink","rupees":100}]', true, 'Which flavour would you like?', false);

-- ---------- 4. Cookies & biscuits -------------------------------------------
select pg_temp.seed_product('cookies-biscuits', 'butter-cookies', 'Butter Cookies',
  'Crispy, buttery and freshly baked.', '/images/products/butter-cookies.webp',
  'Room temperature: 3–7 days · Refrigerated: up to 2 weeks', 1,
  '[{"label":"250 g","rupees":100},{"label":"500 g","rupees":180}]');
select pg_temp.seed_product('cookies-biscuits', 'salt-biscuits', 'Salt Biscuits',
  'Crispy, freshly baked salt biscuits.', '/images/products/salt-biscuits.webp',
  'Room temperature: 1–2 days · Refrigerated: up to 2 weeks', 2,
  '[{"label":"250 g","rupees":100},{"label":"500 g","rupees":180}]');
select pg_temp.seed_product('cookies-biscuits', 'millet-biscuits', 'Millet Biscuits',
  'Crispy, freshly baked millet biscuits.', '/images/products/millet-biscuits.webp',
  'Room temperature: 1–2 days · Refrigerated: up to 2 weeks', 3,
  '[{"label":"250 g","rupees":100},{"label":"500 g","rupees":180}]');
select pg_temp.seed_product('cookies-biscuits', 'jeera-biscuits', 'Jeera Biscuits',
  'Crispy, freshly baked jeera (cumin) biscuits.', '/images/products/jeera-biscuits.webp',
  'Room temperature: 1–2 days · Refrigerated: up to 2 weeks', 4,
  '[{"label":"250 g","rupees":100},{"label":"500 g","rupees":180}]');
select pg_temp.seed_product('cookies-biscuits', 'choco-chip-cookies', 'Choco Chip Cookies',
  'Crispy, buttery cookies loaded with chocolate chips.', '/images/products/choco-chip-cookies.webp',
  'Room temperature: 3–7 days · Refrigerated: up to 2 weeks', 5,
  '[{"label":"250 g","rupees":220},{"label":"500 g","rupees":420}]');
select pg_temp.seed_product('cookies-biscuits', 'double-chocolate-cookies', 'Double Chocolate Cookies',
  'Rich double chocolate cookies.', '/images/products/double-chocolate-cookies.webp',
  'Room temperature: 3–7 days · Refrigerated: up to 2 weeks', 6,
  '[{"label":"250 g","rupees":300},{"label":"500 g","rupees":550}]');

-- ---------- 5. Gift boxes & combos ------------------------------------------
-- Shelf life of a box = its shortest-lasting item.
select pg_temp.seed_product('gift-boxes', 'fudge-brownie-box', 'Fudge Brownie Box',
  'Pure chocolate bliss.', '/images/products/fudge-brownie-box.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 1,
  '[{"label":"½ kg","rupees":449},{"label":"1 kg","rupees":799}]');
select pg_temp.seed_product('gift-boxes', 'brownie-duo', 'Brownie Duo — 2 Flavours',
  'Two brownie flavours in one box.', '/images/products/brownie-duo.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 2,
  '[{"label":"½ kg","rupees":699}]', false, 'Which 2 flavours would you like?');
select pg_temp.seed_product('gift-boxes', 'brownie-trio', 'Brownie Trio — 3 Flavours',
  'Three brownie flavours in one box.', '/images/products/brownie-trio.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 3,
  '[{"label":"½ kg","rupees":749}]', false, 'Which 3 flavours would you like?');
select pg_temp.seed_product('gift-boxes', 'assorted-brownie-box', 'Assorted Brownie Box',
  'An assortment of our brownies.', '/images/products/assorted-brownie-box.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 4,
  '[{"label":"5 pieces","rupees":300},{"label":"10 pieces","rupees":580}]');
select pg_temp.seed_product('gift-boxes', 'tea-time-family-box', 'Tea-Time Family Box',
  'Butter cookies, salt biscuits, millet biscuits & tea cake.', '/images/products/tea-time-family-box.webp',
  'Contains biscuits — Room temperature: 1–2 days · Refrigerated: up to 2 weeks', 5,
  '[{"label":"Box","rupees":399}]');
select pg_temp.seed_product('gift-boxes', 'brownie-family-box', 'Brownie Family Box',
  '10 assorted brownies.', '/images/products/brownie-family-box.webp',
  'Room temperature: 3–7 days · Refrigerated: 1–2 weeks', 6,
  '[{"label":"Box","rupees":599}]');
select pg_temp.seed_product('gift-boxes', 'cookie-lovers-box', 'Cookie Lover''s Box',
  '250 g across 3 cookie flavours.', '/images/products/cookie-lovers-box.webp',
  'Room temperature: 3–7 days · Refrigerated: up to 2 weeks', 7,
  '[{"label":"Box","rupees":549}]', false, 'Which 3 cookie flavours would you like?');
select pg_temp.seed_product('gift-boxes', 'sm-delights-family-box', 'SM Delights Family Box',
  'Brownies, cookies, biscuits & tea cake.', '/images/products/sm-delights-family-box.webp',
  'Contains biscuits — Room temperature: 1–2 days · Refrigerated: up to 2 weeks', 8,
  '[{"label":"Box","rupees":849}]');
select pg_temp.seed_product('gift-boxes', 'cookie-tin', 'Cookie Tin',
  'Customise your cookie tin with your favourite compound chocolates.', null,
  'Room temperature: 3–7 days · Refrigerated: up to 2 weeks', 9,
  '[{"label":"Small — 250 g","rupees":350},{"label":"Large — 500 g","rupees":600}]', false, 'Any flavour preferences for your tin?');
select pg_temp.seed_product('gift-boxes', 'brownie-hot-chocolate-combo', 'Brownie + Hot Chocolate Combo',
  'A brownie with a hot chocolate.', null,
  null, 10, '[{"label":"Combo","rupees":159}]', true);

-- ---------- Delivery zones ---------------------------------------------------
-- Fees are NOT in the document: they start empty (NULL) and the client sets them in
-- Admin -> Delivery zones. Until a fee is set, that zone can't be ordered online.
insert into public.delivery_zones (name, description, pincode_prefixes, fee_paise, is_local, sort) values
  ('Chennai',          'All Chennai areas. Next-day delivery when ordered a day in advance.', '{600}',              null, true,  1),
  ('Rest of Tamil Nadu','Shipping for travel-friendly products. 1–2 working days.',           '{60,61,62,63,64}',  null, false, 2),
  ('Bengaluru',        'Shipping for travel-friendly products. 1–2 working days.',           '{560}',              null, false, 3)
on conflict (name) do update set
  description = excluded.description, pincode_prefixes = excluded.pincode_prefixes,
  is_local = excluded.is_local, sort = excluded.sort;

-- Quick check — should list 6 categories and the product count in each.
select c.name, count(p.id) as products
from public.categories c left join public.products p on p.category_id = c.id
group by c.name, c.sort order by c.sort;
