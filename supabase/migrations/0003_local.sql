-- Regioorbit: orbita na mapie (prywatność), ulubieni, adresy do wysyłki, ceny paliw z API stacji, ostrzeżenia.
-- Uruchamiać po 0001_init.sql i 0002_safety.sql.

-- 1. Profil: pseudonim dla osób spoza znajomych, godziny sprzedaży (piekarz), branża, wygląd, ostrzeżenia
alter table public.profiles
  add column pseudonym text check (char_length(pseudonym) between 2 and 24),
  add column hours text check (char_length(hours) <= 60),
  add column work text,
  add column skin text not null default 'color' check (skin in ('color', 'blue')),
  add column warnings boolean not null default true;

-- 2. Kto jest na orbicie: znajomi z imienia, reszta po pseudonimie albo numerze porządkowym,
--    telefon tylko jako kierunkowy + 2 cyfry, położenie osób prywatnych zaokrąglone do ok. 300 m.
create or replace function public.orbit_people(p_radius_km double precision default 5)
returns table (user_id uuid, label text, phone_hint text, circle int, business boolean, work text, hours text, approx geography)
language sql stable security definer set search_path = public as $$
  with me as (select home from profiles where id = auth.uid())
  select p.id,
         case when p.business or public.circle_of(auth.uid(), p.id) = 1 then p.display_name
              else coalesce(p.pseudonym, 'Osoba #' || row_number() over (order by p.id)) end,
         case when public.circle_of(auth.uid(), p.id) = 1 then null
              else left(regexp_replace(u.phone, '\D', '', 'g'), 4) || '…' end,
         public.circle_of(auth.uid(), p.id),
         p.business, p.work, p.hours,
         case when p.business then p.home
              else ST_SnapToGrid(p.home::geometry, 0.003)::geography end
  from profiles p join auth.users u on u.id = p.id, me
  where p.id <> auth.uid() and p.status = 'active'
    and (p_radius_km is null or ST_DWithin(p.home, me.home, p_radius_km * 1000))
  limit 200
$$;
revoke all on function public.orbit_people from public, anon;
grant execute on function public.orbit_people to authenticated;

-- 3. Ulubieni z tematem („chleb i bułki”)
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  topic text check (char_length(topic) <= 60),
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Adres tylko do wysyłek: podawany przy pierwszej wysyłce kurierem, widzi go właściciel,
--    a sprzedawca dopiero po opłaceniu zamówienia z dostawą kurierem (funkcja niżej).
create table public.addresses (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  street text not null check (char_length(street) <= 120),
  postcode text not null check (char_length(postcode) <= 12),
  city text not null check (char_length(city) <= 80),
  updated_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
create policy "own address" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.shipping_address(p_order uuid) returns public.addresses
language sql stable security definer set search_path = public as $$
  select a.* from addresses a join orders o on o.buyer_id = a.user_id
  where o.id = p_order and o.seller_id = auth.uid() and o.delivery = 'courier' and o.status in ('paid', 'ready')
$$;
revoke all on function public.shipping_address from public, anon;
grant execute on function public.shipping_address to authenticated;

-- 5. Stacje paliw i ceny: stacja podaje ceny przez API (klucz), kierowcy zgłaszają, reszta to ceny orientacyjne
create table public.fuel_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id),       -- konto firmy stacji (może być puste)
  location geography(point, 4326) not null,
  created_at timestamptz not null default now()
);
create index fuel_stations_location_idx on public.fuel_stations using gist (location);
alter table public.fuel_stations enable row level security;
create policy "stations readable" on public.fuel_stations for select using (true);

create table public.station_api_keys (
  station_id uuid not null references public.fuel_stations(id) on delete cascade,
  key_hash text primary key,                          -- sha256(klucz); samego klucza nie przechowujemy
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.station_api_keys enable row level security;  -- brak polityk: tylko serwer

create table public.fuel_prices (
  id bigint generated always as identity primary key,
  station_id uuid not null references public.fuel_stations(id) on delete cascade,
  fuel text not null check (fuel in ('pb95', 'on', 'lpg')),
  price integer not null,                             -- grosze za litr
  source text not null check (source in ('station', 'users', 'estimate')),
  reported_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((fuel = 'lpg' and price between 100 and 800) or (fuel <> 'lpg' and price between 300 and 1500))
);
create index on public.fuel_prices (station_id, fuel, created_at desc);
alter table public.fuel_prices enable row level security;
create policy "prices readable" on public.fuel_prices for select using (true);
-- Limit zgłoszeń liczony zawsze dla zalogowanego (nie da się „zużyć” limitu komuś innemu).
create or replace function public.can_report_fuel() returns boolean
language sql volatile security definer set search_path = public as $$
  select public.hit_limit(auth.uid()::text, 'fuel_report', 20, interval '1 day')
$$;
revoke all on function public.can_report_fuel from public, anon;
grant execute on function public.can_report_fuel to authenticated;

create policy "drivers report" on public.fuel_prices for insert
  with check (source = 'users' and reported_by = auth.uid() and public.can_report_fuel());

create view public.latest_fuel_prices with (security_invoker = true) as
  select distinct on (station_id, fuel) station_id, fuel, price, source, created_at
  from public.fuel_prices order by station_id, fuel, created_at desc;

-- 6. Ostrzeżenia (IMGW, Meteoalarm, NINA): pamięć podręczna wypełniana przez funkcję `warnings` co kilka minut
create table public.warnings_cache (
  country text not null,
  region text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (country, region)
);
alter table public.warnings_cache enable row level security;
create policy "warnings readable" on public.warnings_cache for select using (true);
