-- Regioorbit: tożsamość (płeć ustawiana raz, anonimowy klucz), dopasowanie kontaktów po skrótach,
-- SOS i „Odprowadź mnie”, tablica okolicy (odpowiedzi, „Będę”). Uruchamiać po 0001–0003.

create extension if not exists pgcrypto with schema extensions;

-- 0. Jednostki dodane w aplikacji (worek, m³) — wcześniej brakowało ich w ograniczeniu.
alter table public.listings drop constraint if exists listings_unit_check;
alter table public.listings add constraint listings_unit_check
  check (unit in ('item', 'kg', 'pack', 'bag', 'litre', 'tonne', 'm3', 'hour', 'day', 'week', 'month', 'night', 'fixed'));

-- 1. Płeć (m = mężczyzna, w = kobieta, x = nie podaję) i anonimowy klucz -------------------------
alter table public.profiles
  add column gender text check (gender in ('m', 'w', 'x')),
  add column anon_key text unique check (anon_key ~ '^anonym[a-z]{2}[mwx][0-9]{10}$'),
  add column sos_helper boolean not null default false;   -- zgoda na alarmy SOS sąsiadów do 1 km

-- Klucz: „anonym” + kraj + płeć + 10 cyfr z HMAC-SHA-256 numeru telefonu. Cyfry NIE są numerem i nie da się
-- z nich go odtworzyć bez sekretu. Sekret trzymamy w Supabase Vault (SQL Editor, raz):
--   select vault.create_secret('<losowe 64 znaki>', 'anon_key_secret');
create or replace function public.make_anon_key(p_country text, p_gender text, p_phone text)
returns text language plpgsql stable security definer set search_path = public, extensions as $$
declare secret text; h bytea; n numeric := 0;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'anon_key_secret';
  if secret is null then raise exception 'Brak sekretu anon_key_secret w Vault'; end if;
  h := extensions.hmac(regexp_replace(p_phone, '[^0-9+]', '', 'g'), secret, 'sha256');
  for i in 0..7 loop n := n * 256 + get_byte(h, i); end loop;
  return 'anonym' || lower(left(p_country, 2)) || p_gender || lpad((n % 10000000000)::text, 10, '0');
end $$;
revoke all on function public.make_anon_key from public, anon, authenticated;

-- Płeć ustawia się raz. Zmienia ją tylko pomoc (sprostowanie danych, art. 16 RODO): service_role albo SQL Editor.
-- Klucz liczy zawsze serwer; użytkownik nie może go wpisać ani zmienić.
create or replace function public.profiles_identity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  support boolean := session_user in ('postgres', 'supabase_admin') or coalesce(auth.role(), '') = 'service_role';
  phone text;
  k text;
  attempt int := 0;
begin
  if tg_op = 'UPDATE' and old.gender is not null and new.gender is distinct from old.gender and not support then
    raise exception 'Płeć można zmienić tylko przez pomoc (%).', 'hello@regioorbit.com';
  end if;
  if new.gender is null then
    new.anon_key := null;
    return new;
  end if;
  if tg_op = 'INSERT' or new.gender is distinct from old.gender or old.anon_key is null then
    select u.phone into phone from auth.users u where u.id = new.id;
    loop
      -- przy kolizji (ok. 1 na 10 mld) liczymy skrót jeszcze raz z dopiskiem
      k := public.make_anon_key(new.country, new.gender, coalesce(phone, '') || case when attempt > 0 then '#' || attempt else '' end);
      exit when not exists (select 1 from profiles where anon_key = k and id <> new.id) or attempt > 5;
      attempt := attempt + 1;
    end loop;
    new.anon_key := k;
  else
    new.anon_key := old.anon_key;
  end if;
  return new;
end $$;
create trigger profiles_identity before insert or update on public.profiles
  for each row execute function public.profiles_identity();

-- 2. Dopasowanie kontaktów: telefon wysyła tylko skróty SHA-256 numerów (bez imion). --------------
-- Funkcja niczego nie zapisuje, zwraca tylko pasujące konta; limit 5 dopasowań na dobę, max 3000 numerów.
-- Uwaga: skrót numeru da się odgadnąć próbując wszystkich numerów, dlatego limit i brak zapisu są obowiązkowe.
create or replace function public.match_contacts(hashes text[])
returns table (user_id uuid, display_name text)
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(array_length(hashes, 1), 0) > 3000 then raise exception 'Za dużo numerów naraz'; end if;
  if not public.hit_limit(auth.uid()::text, 'match_contacts', 5, interval '1 day') then
    raise exception 'Limit dopasowań na dziś';
  end if;
  return query
    select h.user_id, p.display_name
    from phone_hashes h join profiles p on p.id = h.user_id
    where h.phone_sha256 = any(hashes) and p.status = 'active' and h.user_id <> auth.uid();
end $$;
revoke all on function public.match_contacts from public, anon;
grant execute on function public.match_contacts to authenticated;

-- 3. SOS ------------------------------------------------------------------------------------------
create table public.sos_contacts (
  owner_id uuid not null references public.profiles on delete cascade,
  contact_id uuid not null references public.profiles on delete cascade,
  primary key (owner_id, contact_id)
);
create or replace function public.limit_sos_contacts() returns trigger language plpgsql as $$
begin
  if (select count(*) from sos_contacts where owner_id = new.owner_id) >= 5 then
    raise exception 'Do SOS można wybrać najwyżej 5 osób';
  end if;
  return new;
end $$;
create trigger sos_contacts_limit before insert on public.sos_contacts for each row execute function public.limit_sos_contacts();

create table public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('danger', 'health', 'accident', 'fire', 'other')),
  location geography(point, 4326),           -- dokładne położenie: usuwane po 24 h (cron niżej)
  precise boolean not null default false,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create table public.sos_recipients (
  alert_id uuid not null references public.sos_alerts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  via text not null check (via in ('contact', 'neighbor')),
  status text not null default 'sent' check (status in ('sent', 'seen', 'calling', 'coming', 'declined')),
  eta_min int check (eta_min between 0 and 600),
  updated_at timestamptz not null default now(),
  primary key (alert_id, user_id)
);

-- Wysłanie alarmu: wybrane osoby (albo zaufane / pierwsi znajomi) + sąsiedzi pomocnicy do 1 km.
-- Konto zastrzeżone wysyła tylko do bliskich. Limit: 3 alarmy na godzinę (fałszywe alarmy blokują konto).
create or replace function public.send_sos(p_kind text, p_lat double precision, p_lng double precision, p_precise boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a uuid; here geography;
begin
  if not public.hit_limit(me::text, 'sos', 3, interval '1 hour') then raise exception 'Za dużo alarmów, dzwoń 112'; end if;
  here := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  insert into sos_alerts (user_id, kind, location, precise) values (me, p_kind, here, p_precise) returning id into a;
  insert into sos_recipients (alert_id, user_id, via)
    select a, c.contact_id, 'contact' from sos_contacts c where c.owner_id = me
    union
    select a, t.trusted_id, 'contact' from trusted_contacts t
      where t.user_id = me and not exists (select 1 from sos_contacts where owner_id = me)
    on conflict do nothing;
  if (select status from profiles where id = me) = 'active' then
    insert into sos_recipients (alert_id, user_id, via)
      select a, p.id, 'neighbor' from profiles p
      where p.sos_helper and p.status = 'active' and p.id <> me and ST_DWithin(p.home, here, 1000)
      limit 30
      on conflict do nothing;
  end if;
  return a;   -- powiadomienia push wysyła funkcja `sos-push` (webhook bazy na insert do sos_recipients)
end $$;
revoke all on function public.send_sos from public, anon;
grant execute on function public.send_sos to authenticated;

-- 4. „Odprowadź mnie”: lokalizacja na żywo dla bliskich do ustalonej godziny ----------------------
create table public.location_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  viewers uuid[] not null,
  location geography(point, 4326),
  until timestamptz not null check (until <= now() + interval '3 hours'),
  updated_at timestamptz not null default now()
);

-- 5. Tablica okolicy: odpowiedzi na pytania i „Będę” na wydarzeniach ---------------------------------
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index on public.answers (listing_id, created_at);
create table public.event_rsvps (
  listing_id uuid not null references public.listings on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);
create or replace function public.can_answer() returns boolean
language sql volatile security definer set search_path = public as $$
  select public.hit_limit(auth.uid()::text, 'answer', 30, interval '1 hour')
$$;
revoke all on function public.can_answer from public, anon;
grant execute on function public.can_answer to authenticated;

-- 6. RLS ------------------------------------------------------------------------------------------
alter table public.sos_contacts enable row level security;
alter table public.sos_alerts enable row level security;
alter table public.sos_recipients enable row level security;
alter table public.location_shares enable row level security;
alter table public.answers enable row level security;
alter table public.event_rsvps enable row level security;

create policy "own sos contacts" on public.sos_contacts for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.circle_of(auth.uid(), contact_id) = 1);
-- alarm widzi autor i adresaci; zapis tylko przez send_sos
create policy "sos author or recipient" on public.sos_alerts for select using (
  user_id = auth.uid() or exists (select 1 from sos_recipients r where r.alert_id = id and r.user_id = auth.uid()));
create policy "sos end own" on public.sos_alerts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sos recipients visible" on public.sos_recipients for select using (
  user_id = auth.uid() or exists (select 1 from sos_alerts s where s.id = alert_id and s.user_id = auth.uid()));
create policy "sos reply" on public.sos_recipients for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "share own" on public.location_shares for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "share viewers" on public.location_shares for select using (auth.uid() = any(viewers) and until > now());
-- odpowiedzi widzi ten, kto widzi pytanie (RLS ogłoszeń działa w podzapytaniu)
create policy "answers visible" on public.answers for select using (exists (select 1 from listings l where l.id = listing_id));
create policy "answer own" on public.answers for insert with check (
  author_id = auth.uid() and public.is_active(auth.uid()) and public.can_answer()
  and exists (select 1 from listings l where l.id = listing_id and l.category = 'community' and l.sub_category = 'ask'));
create policy "answer delete own" on public.answers for delete using (author_id = auth.uid());
create policy "rsvp visible" on public.event_rsvps for select using (exists (select 1 from listings l where l.id = listing_id));
create policy "rsvp own" on public.event_rsvps for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Statusy alarmu na żywo u wysyłającego (Supabase Realtime)
alter publication supabase_realtime add table public.sos_recipients;

-- 7. Sprzątanie (pg_cron): położenie z alarmów po 24 h, wpisy SOS po 30 dniach, wygasłe udostępnienia
-- select cron.schedule('sos-cleanup', '15 * * * *', $$
--   update public.sos_alerts set location = null where location is not null and created_at < now() - interval '24 hours';
--   delete from public.sos_alerts where created_at < now() - interval '30 days';
--   delete from public.location_shares where until < now() - interval '1 hour';
-- $$);
