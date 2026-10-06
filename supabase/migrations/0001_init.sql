-- WhatsThat: schemat produkcyjny (Supabase / Postgres + PostGIS).
-- Kręgi zaufania liczone z grafu znajomości, widoczność pilnowana przez RLS.

create extension if not exists postgis;

-- Profile -------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  city text,
  voivodeship text,
  home geography(point, 4326),
  plan text not null default 'free' check (plan in ('free', 'pro', 'biznes')),
  verified boolean not null default false,          -- KYC przez Stripe Connect
  stripe_account_id text,                           -- konto Connect do wypłat
  rating numeric(2, 1) not null default 0,
  reviews_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Dopasowanie kontaktów: telefon nie wychodzi z urządzenia w jawnej postaci,
-- trzymamy tylko skrót SHA-256 numeru w formacie E.164 (+48...).
create table public.phone_hashes (
  user_id uuid primary key references public.profiles on delete cascade,
  phone_sha256 text not null unique
);

-- Znajomość jest symetryczna: zapisujemy parę (a < b).
create table public.friendships (
  a uuid not null references public.profiles on delete cascade,
  b uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index on public.friendships (b);

create or replace view public.friends with (security_invoker = true) as
  select a as user_id, b as friend_id from public.friendships
  union all
  select b, a from public.friendships;

-- 1 = znajomy, 2 = znajomy znajomego, 3 = reszta.
create or replace function public.circle_of(viewer uuid, other uuid)
returns int language sql stable security definer set search_path = public as $$
  select case
    when viewer = other then 1
    when exists (select 1 from friends where user_id = viewer and friend_id = other) then 1
    when exists (
      select 1 from friends f1 join friends f2 on f2.user_id = f1.friend_id
      where f1.user_id = viewer and f2.friend_id = other
    ) then 2
    else 3
  end
$$;

-- Ogłoszenia ----------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  category text not null,
  mode text not null check (mode in ('rent', 'sell', 'lend', 'swap')),
  price_per_day int check (price_per_day >= 0),   -- grosze
  price int check (price >= 0),                   -- grosze
  deposit int not null default 0,                 -- grosze, blokada na karcie
  item_value int,                                 -- grosze, podstawa ochrony
  swap_for text,
  photos text[] not null default '{}',
  location geography(point, 4326) not null,
  city text not null,
  voivodeship text not null,
  visibility int not null default 3 check (visibility between 1 and 3),
  cross_post text[] not null default '{}',
  boosted_until timestamptz,
  status text not null default 'active' check (status in ('active', 'paused', 'sold', 'deleted')),
  created_at timestamptz not null default now()
);
create index listings_location_idx on public.listings using gist (location);
create index on public.listings (owner_id);
create index on public.listings (city, status);

-- Wyszukiwanie: "w promieniu X km od mnie", z kręgiem liczonym dla każdego wyniku.
create or replace function public.listings_nearby(
  lat double precision,
  lng double precision,
  radius_km double precision default 10,
  max_circle int default 3
)
returns table (listing public.listings, circle int, distance_m double precision)
language sql stable security definer set search_path = public as $$
  with me as (select st_setsrid(st_makepoint(lng, lat), 4326)::geography as p)
  select l, c.circle, st_distance(l.location, me.p)
  from listings l, me,
       lateral (select circle_of(auth.uid(), l.owner_id) as circle) c
  where l.status = 'active'
    and c.circle <= least(l.visibility, max_circle)
    -- znajomi i ich znajomi zawsze, market tylko w promieniu
    and (c.circle < 3 or st_dwithin(l.location, me.p, radius_km * 1000))
  order by (l.boosted_until > now()) desc nulls last, c.circle, st_distance(l.location, me.p)
  limit 200
$$;

-- Rezerwacje, płatności, protokół -------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete restrict,
  renter_id uuid not null references public.profiles,
  owner_id uuid not null references public.profiles,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  circle int not null,
  protection boolean not null default false,
  total int not null,                -- grosze, co płaci biorący
  owner_payout int not null,
  platform_fee int not null,
  deposit_hold int not null default 0,
  stripe_payment_intent text,        -- capture_method=manual dla kaucji
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'active', 'returned', 'declined', 'disputed')),
  created_at timestamptz not null default now()
);

create table public.handover_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings on delete cascade,
  phase text not null check (phase in ('before', 'after')),
  taken_by uuid not null references public.profiles,
  storage_path text not null,
  taken_at timestamptz not null default now()   -- znacznik czasu z serwera, nie z telefonu
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete cascade,
  member_a uuid not null references public.profiles,
  member_b uuid not null references public.profiles,
  created_at timestamptz not null default now(),
  unique (listing_id, member_a, member_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats on delete cascade,
  sender_id uuid not null references public.profiles,
  body text,
  photo_path text,
  booking_id uuid references public.bookings,
  created_at timestamptz not null default now()
);
create index on public.messages (chat_id, created_at);

create table public.reviews (
  booking_id uuid not null references public.bookings on delete cascade,
  author_id uuid not null references public.profiles,
  subject_id uuid not null references public.profiles,
  stars int not null check (stars between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  primary key (booking_id, author_id)
);

-- DAC7: roczne raportowanie sprzedawców (od 30 transakcji lub 2000 EUR).
-- Tylko dla roli service_role (raport do KAS), niedostępne z aplikacji.
create or replace view public.dac7_sellers with (security_invoker = true) as
  select owner_id, date_part('year', created_at) as year,
         count(*) as transactions, sum(owner_payout) as payout_grosze
  from public.bookings where status = 'returned'
  group by 1, 2;

-- RLS -------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.phone_hashes enable row level security;
alter table public.friendships enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.handover_photos enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

create policy "profile readable" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profile own update" on public.profiles for update using (id = auth.uid());
create policy "profile own insert" on public.profiles for insert with check (id = auth.uid());

create policy "own phone hash" on public.phone_hashes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "see own friendships" on public.friendships for select using (auth.uid() in (a, b));

create policy "listing visible in circle" on public.listings for select
  using ((status = 'active' and public.circle_of(auth.uid(), owner_id) <= visibility) or owner_id = auth.uid());
create policy "listing own write" on public.listings for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "booking parties" on public.bookings for select using (auth.uid() in (renter_id, owner_id));
create policy "booking request" on public.bookings for insert with check (renter_id = auth.uid());
create policy "booking parties update" on public.bookings for update using (auth.uid() in (renter_id, owner_id));

create policy "photos parties" on public.handover_photos for select
  using (exists (select 1 from public.bookings b where b.id = booking_id and auth.uid() in (b.renter_id, b.owner_id)));
create policy "photos add" on public.handover_photos for insert
  with check (taken_by = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and auth.uid() in (b.renter_id, b.owner_id)));

create policy "chat members" on public.chats for select using (auth.uid() in (member_a, member_b));
create policy "chat start" on public.chats for insert with check (auth.uid() in (member_a, member_b));
create policy "messages members" on public.messages for select
  using (exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.member_a, c.member_b)));
create policy "messages send" on public.messages for insert
  with check (sender_id = auth.uid() and exists (
    select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.member_a, c.member_b)));

create policy "reviews readable" on public.reviews for select using (auth.role() = 'authenticated');
create policy "reviews after booking" on public.reviews for insert
  with check (author_id = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and b.status = 'returned'
      and auth.uid() in (b.renter_id, b.owner_id)));

revoke all on public.dac7_sellers from anon, authenticated;
