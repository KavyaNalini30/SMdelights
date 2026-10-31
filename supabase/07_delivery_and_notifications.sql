-- =============================================================================
-- SM Delights — 07: courier delivery, fast delivery on WhatsApp, order notifications
-- Run once in Supabase -> SQL Editor (after 01–06). Safe to re-run.
--
--   * Delivery options: pickup, standard courier ("delivery"), fast delivery on
--     WhatsApp ("fast_whatsapp", Chennai only).
--   * Courier charge = weight-based slabs per zone (ST Courier rate card), set in
--     Admin -> Courier rates. NULL = not set yet -> courier to that zone is off.
--   * Each product size gets a packed weight (estimates below; correct in admin).
--   * order_notifications: one row per order / audience / channel, so each
--     email or WhatsApp message is sent at most once.
-- =============================================================================

-- ---------- New enum values ---------------------------------------------------
alter type public.fulfilment_type add value if not exists 'fast_whatsapp';
alter type public.payment_method  add value if not exists 'whatsapp';

-- ---------- Product weights ---------------------------------------------------
alter table public.product_variants
  add column if not exists weight_grams int check (weight_grams is null or weight_grams between 1 and 50000);

-- Estimated packed weights (box + packaging included). Only fills sizes that have no
-- weight yet, so re-running never overwrites what the client typed in admin.
update public.product_variants v set weight_grams = w.grams
from public.products p, public.categories c,
  (values
    ('brownies',         null,                        'Per piece', 120),
    ('brownies',         null,                        'Tub',       300),
    ('brownies',         null,                        'Single',    150),
    ('brownies',         null,                        'Double',    150),
    ('brownies',         null,                        'Triple',    150),
    ('brownies',         null,                        'Nutella',   150),
    ('tea-cakes',        null,                        'Cake',      600),
    ('tea-cakes',        null,                        'Cup',       300),
    ('cookies-biscuits', null,                        '250 g',     320),
    ('cookies-biscuits', null,                        '500 g',     600),
    ('drinks',           null,                        null,        300),
    ('gift-boxes',       null,                        '½ kg',      600),
    ('gift-boxes',       null,                        '1 kg',     1150),
    ('gift-boxes',       null,                        '5 pieces',  650),
    ('gift-boxes',       null,                        '10 pieces',1250),
    ('gift-boxes',       null,                        'Combo',     300),
    ('gift-boxes',       'tea-time-family-box',       null,       1000),
    ('gift-boxes',       'cookie-lovers-box',         null,        900),
    ('gift-boxes',       'sm-delights-family-box',    null,       1500)
  ) as w(category, product_slug, label, grams)
where v.product_id = p.id
  and p.category_id = c.id
  and c.slug = w.category
  and (w.product_slug is null or p.slug = w.product_slug)
  and (w.label is null or v.label = w.label)
  and v.weight_grams is null;

-- ---------- Courier rates per zone --------------------------------------------
-- Charge = base_fee for the first base_weight_g, then step_fee for every started
-- step_weight_g above that. Example: 500 g = ₹60, each extra 500 g = ₹30
-- -> 1.2 kg costs 60 + 2 × 30 = ₹120.
alter table public.delivery_zones
  add column if not exists base_weight_g  int not null default 500 check (base_weight_g > 0),
  add column if not exists base_fee_paise int check (base_fee_paise is null or base_fee_paise >= 0),
  add column if not exists step_weight_g  int not null default 500 check (step_weight_g > 0),
  add column if not exists step_fee_paise int check (step_fee_paise is null or step_fee_paise >= 0),
  add column if not exists allows_fast    boolean not null default false;

-- Zones: a pincode uses the zone with the LONGEST matching prefix.
-- Puducherry shares Tamil Nadu's / Kerala's / Andhra's pincode ranges and is treated as those.
-- Chennai suburbs (601–603: Ponneri, Sriperumbudur, Chengalpattu …) may ask for fast delivery;
-- the owner confirms on WhatsApp whether it's possible.
update public.delivery_zones set name = 'Tamil Nadu' where name = 'Rest of Tamil Nadu';

insert into public.delivery_zones (name, description, pincode_prefixes, is_local, allows_fast, sort) values
  ('Chennai',         'All Chennai areas (600xxx). Courier in 2–3 days, or same-day fast delivery arranged on WhatsApp.', '{600}',          true,  true,  1),
  ('Chennai suburbs', 'Areas around Chennai (601–603xxx). Courier in 2–3 days, or fast delivery arranged on WhatsApp.',   '{601,602,603}',  true,  true,  2),
  ('Tamil Nadu',      'Courier across Tamil Nadu in 2–3 days.',                                                           '{60,61,62,63,64}', false, false, 3),
  ('Bengaluru',       'Courier to Bengaluru in 2–3 days.',                                                                '{560}',          false, false, 4),
  ('Karnataka',       'Courier across Karnataka in 2–3 days.',                                                            '{56,57,58,59}',  false, false, 5),
  ('Kerala',          'Courier across Kerala in 2–3 days.',                                                               '{67,68,69}',     false, false, 6),
  ('Andhra Pradesh',  'Courier across Andhra Pradesh in 2–3 days.',                                                       '{51,52,53}',     false, false, 7),
  ('Telangana',       'Courier across Telangana, including Hyderabad, in 2–3 days.',                                     '{50}',           false, false, 8)
on conflict (name) do update set
  description = excluded.description, pincode_prefixes = excluded.pincode_prefixes,
  is_local = excluded.is_local, allows_fast = excluded.allows_fast, sort = excluded.sort;

-- ---------- Orders -------------------------------------------------------------
-- Courier and fast-delivery orders have no customer-chosen date.
alter table public.orders alter column delivery_date drop not null;
alter table public.orders add column if not exists courier_weight_g int check (courier_weight_g is null or courier_weight_g >= 0);
-- Customer agreed at checkout to receive order updates on WhatsApp (Meta requires opt-in).
alter table public.orders add column if not exists whatsapp_opt_in boolean not null default false;

-- ---------- Notifications ------------------------------------------------------
create table if not exists public.order_notifications (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  audience    text not null check (audience in ('customer', 'owner')),
  channel     text not null check (channel in ('email', 'whatsapp')),
  status      text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'skipped')),
  detail      text,        -- error message, or why it was skipped
  provider_id text,        -- Resend email id / WhatsApp message id
  attempts    int not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (order_id, audience, channel)
);
create index if not exists order_notifications_order_idx on public.order_notifications(order_id);

drop trigger if exists order_notifications_updated_at on public.order_notifications;
create trigger order_notifications_updated_at before update on public.order_notifications
  for each row execute function public.set_updated_at();

-- Written only by the server (service role). Admins can read them.
alter table public.order_notifications enable row level security;
revoke all on public.order_notifications from anon;
grant select on public.order_notifications to authenticated;
drop policy if exists smd_notifications_admin_read on public.order_notifications;
create policy smd_notifications_admin_read on public.order_notifications
  for select using ((select public.is_admin()));

-- ---------- Check ---------------------------------------------------------------
select name, pincode_prefixes, allows_fast, base_fee_paise from public.delivery_zones order by sort;
