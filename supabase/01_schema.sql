-- =============================================================================
-- SM Delights — 01_schema.sql
-- Run FIRST in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run on an empty project. All money is stored in integer PAISE (₹1 = 100).
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('pending', 'paid', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fulfilment_type as enum ('delivery', 'pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('razorpay', 'pay_at_pickup', 'demo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.enquiry_status as enum ('new', 'contacted', 'quoted', 'confirmed', 'closed');
exception when duplicate_object then null; end $$;

-- ---------- Helpers ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Catalogue --------------------------------------------------------
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name            text not null check (length(name) between 1 and 80),
  description     text,
  image           text,
  sort            int  not null default 0,
  is_active       boolean not null default true,
  is_enquiry_only boolean not null default false, -- e.g. Bulk / Corporate: no cart
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories(id) on delete restrict,
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name          text not null check (length(name) between 1 and 120),
  description   text,
  images        text[] not null default '{}',  -- first image is the main one
  shelf_life    text,                          -- shown on the product page
  is_bestseller boolean not null default false,
  is_active     boolean not null default true, -- false = hidden from the shop
  chennai_only  boolean not null default false,-- cannot ship outside Chennai
  allows_note   boolean not null default false,-- e.g. "choose your flavours"
  note_prompt   text,
  sort          int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id, sort);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  label       text not null check (length(label) between 1 and 60), -- "250 g", "Per piece"
  price_paise int  not null check (price_paise > 0),
  sort        int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, label)
);
create index if not exists variants_product_idx on public.product_variants(product_id, sort);

-- ---------- Customers --------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  phone      text,
  role       public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  label          text,                -- "Home", "Office"
  recipient_name text not null,
  phone          text not null,
  line1          text not null,
  line2          text,
  area           text,
  city           text not null,
  state          text not null,
  pincode        text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);

-- ---------- Delivery ---------------------------------------------------------
-- A pincode matches the zone with the LONGEST matching prefix (so "600" beats "60").
-- fee_paise NULL = fee not set yet -> delivery to that zone can't be ordered online.
create table if not exists public.delivery_zones (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  description      text,
  pincode_prefixes text[] not null,
  fee_paise        int check (fee_paise is null or fee_paise >= 0),
  is_local         boolean not null default false, -- true = Chennai (chennai_only items allowed)
  sort             int not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- Orders -----------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique default ('SMD-' || nextval('public.order_number_seq')),
  access_token       uuid not null default gen_random_uuid(), -- lets guests view their order
  user_id            uuid references auth.users(id) on delete set null,
  customer_name      text not null,
  customer_phone     text not null,
  customer_email     text,
  fulfilment         public.fulfilment_type not null,
  address_line1      text,
  address_line2      text,
  area               text,
  city               text,
  state              text,
  pincode            text,
  zone_id            uuid references public.delivery_zones(id) on delete set null,
  zone_name          text,                -- snapshot
  delivery_date      date not null,       -- delivery or pickup date
  subtotal_paise     int not null check (subtotal_paise >= 0),
  delivery_fee_paise int not null default 0 check (delivery_fee_paise >= 0),
  total_paise        int not null check (total_paise = subtotal_paise + delivery_fee_paise),
  status             public.order_status not null default 'pending',
  payment_method     public.payment_method not null,
  paid_at            timestamptz,
  razorpay_order_id  text unique,
  is_demo            boolean not null default false,
  customer_note      text check (customer_note is null or length(customer_note) <= 500),
  admin_note         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint delivery_needs_address check (
    fulfilment = 'pickup' or (address_line1 is not null and city is not null and pincode is not null)
  )
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status, created_at desc);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  variant_id       uuid references public.product_variants(id) on delete set null,
  product_name     text not null,   -- snapshots: an order never changes if the menu does
  variant_label    text not null,
  unit_price_paise int  not null check (unit_price_paise > 0),
  quantity         int  not null check (quantity between 1 and 50),
  line_total_paise int  generated always as (unit_price_paise * quantity) stored,
  note             text check (note is null or length(note) <= 200)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     public.order_status not null,
  note       text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_history_order_idx on public.order_status_history(order_id, created_at);

create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  razorpay_payment_id text unique,
  razorpay_order_id   text,
  amount_paise        int not null,
  status              text not null,  -- captured, failed, demo, cash …
  method              text,           -- upi, card, netbanking …
  source              text not null check (source in ('verify', 'webhook', 'admin', 'demo')),
  raw                 jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments(order_id);

-- ---------- Enquiries & reviews ---------------------------------------------
create table if not exists public.corporate_enquiries (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(name) between 1 and 100),
  phone             text not null check (length(phone) between 8 and 20),
  email             text check (email is null or length(email) <= 200),
  company           text check (company is null or length(company) <= 150),
  event_date        date,
  quantity          text check (quantity is null or length(quantity) <= 100),
  items_of_interest text[] not null default '{}',
  message           text check (message is null or length(message) <= 2000),
  status            public.enquiry_status not null default 'new',
  admin_note        text,
  created_at        timestamptz not null default now()
);

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(customer_name) between 1 and 80),
  rating        int  not null check (rating between 1 and 5),
  body          text not null check (length(body) between 1 and 1000),
  image_url     text,          -- e.g. a screenshot the client uploads
  source        text,          -- "Instagram", "WhatsApp", "Website"
  is_approved   boolean not null default false,
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------- Rate limiting (used by server routes via the service role) --------
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         int not null
);

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;

-- ---------- updated_at triggers ---------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['categories', 'products', 'product_variants', 'profiles', 'delivery_zones', 'orders']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- Profile row for every new sign-up -------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(nullif(new.raw_user_meta_data ->> 'full_name', ''), 100),
    left(nullif(new.raw_user_meta_data ->> 'phone', ''), 20)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Admin check (used by RLS policies) -------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;
