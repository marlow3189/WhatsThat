-- Miliorbit: schemat produkcyjny (Supabase / Postgres + PostGIS).
-- Model „łącznika”: nie trzymamy cudzych pieniędzy i nie pobieramy prowizji.
-- Tożsamość = numer telefonu (Supabase Auth, logowanie SMS), opcjonalnie e-mail.

create extension if not exists postgis;

-- Profile -------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,   -- auth.users trzyma numer telefonu
  display_name text not null,
  lang text not null default 'pl' check (lang in ('pl', 'en', 'de', 'uk', 'cs', 'sk', 'hu', 'it', 'es')),
  country text not null default 'PL',
  currency text not null default 'PLN',
  interests text[] not null default '{}',
  terms_accepted_at timestamptz not null default now(),
  voivodeship text not null,
  town text,
  home geography(point, 4326) not null,
  status text not null default 'active' check (status in ('active', 'restricted')),
  restricted_at timestamptz,
  plan text not null default 'free' check (plan in ('free', 'annual', 'business')),
  plan_until timestamptz,
  refresh_due timestamptz not null default now() + interval '1 year',  -- konto darmowe: pierwszy rok gratis, potem odświeżenie 10 zł/rok
  kyc text not null default 'none' check (kyc in ('none', 'pending', 'verified')),
  business boolean not null default false,       -- firma: obowiązki DSA/Omnibus, faktury
  payout_account_id text,                        -- konto sprzedającego u operatora płatności
  created_at timestamptz not null default now()
);

-- Dopasowanie kontaktów: numery hashowane na telefonie (SHA-256 z E.164), serwer widzi tylko skrót.
create table public.phone_hashes (
  user_id uuid primary key references public.profiles on delete cascade,
  phone_sha256 text not null unique
);

-- Znajomość = oboje mają się w kontaktach. Para zapisana raz (a < b).
create table public.friendships (
  a uuid not null references public.profiles on delete cascade,
  b uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index on public.friendships (b);

-- „Nie pokazuj mi rzeczy tej osoby” i „zapomnij kontakt”.
create table public.mutes (
  user_id uuid not null references public.profiles on delete cascade,
  muted_id uuid not null references public.profiles on delete cascade,
  primary key (user_id, muted_id)
);
create table public.forgotten (
  user_id uuid not null references public.profiles on delete cascade,
  forgotten_id uuid not null references public.profiles on delete cascade,
  primary key (user_id, forgotten_id)
);

create or replace view public.friends with (security_invoker = true) as
  select a as user_id, b as friend_id from public.friendships
  union all
  select b, a from public.friendships;

-- 1 = znajomy, 2 = znajomy znajomego, 3 = reszta.
create or replace function public.circle_of(viewer uuid, other uuid)
returns int language sql stable security definer set search_path = public as $$
  select case
    when viewer = other then 1
    when exists (select 1 from friends where user_id = viewer and friend_id = other
                 and not exists (select 1 from forgotten where user_id = viewer and forgotten_id = other)) then 1
    when exists (
      select 1 from friends f1 join friends f2 on f2.user_id = f1.friend_id
      where f1.user_id = viewer and f2.friend_id = other
        and not exists (select 1 from forgotten where user_id = viewer and forgotten_id = f1.friend_id)
    ) then 2
    else 3
  end
$$;

create or replace function public.is_active(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'active' from profiles where id = uid), false)
$$;

-- Zastrzeżenie numeru -------------------------------------------------------
-- Dwie zaufane osoby, które potwierdzają tożsamość przy odblokowaniu.
create table public.trusted_contacts (
  user_id uuid not null references public.profiles on delete cascade,
  trusted_id uuid not null references public.profiles on delete cascade,
  primary key (user_id, trusted_id),
  check (user_id <> trusted_id)
);

create or replace function public.limit_trusted() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.trusted_contacts where user_id = new.user_id) >= 2 then
    raise exception 'Można mieć najwyżej dwie zaufane osoby';
  end if;
  return new;
end $$;
create trigger trusted_max_two before insert on public.trusted_contacts
  for each row execute function public.limit_trusted();

create table public.unlock_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  sms_verified boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours'
);
create table public.unlock_approvals (
  request_id uuid not null references public.unlock_requests on delete cascade,
  approver_id uuid not null references public.profiles on delete cascade,
  approved_at timestamptz not null default now(),
  primary key (request_id, approver_id)
);

-- Zastrzeżenie działa od razu: konto, ogłoszenia, wiadomości i płatności stają.
-- Wywoływane z aplikacji (zalogowany) albo z Edge Function strony /zastrzez (kod z e-maila lub zaufana osoba).
create or replace function public.restrict_account(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set status = 'restricted', restricted_at = now() where id = target;
  insert into notifications (user_id, kind, payload)
    select friend_id, 'friend_restricted', jsonb_build_object('user_id', target) from friends where user_id = target;
end $$;

-- Odblokowanie: kod SMS + obie zaufane osoby potwierdziły.
create or replace function public.try_unlock(req uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare r unlock_requests;
begin
  select * into r from unlock_requests where id = req and expires_at > now();
  if r is null or not r.sms_verified then return false; end if;
  if (select count(*) from unlock_approvals a
        join trusted_contacts t on t.trusted_id = a.approver_id and t.user_id = r.user_id
      where a.request_id = req) < 2 then
    return false;
  end if;
  update profiles set status = 'active', restricted_at = null where id = r.user_id;
  return true;
end $$;

-- Ogłoszenia ----------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('sell', 'rent', 'service', 'give', 'swap', 'garage', 'wanted')),
  category text not null,
  sub_category text,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  price int check (price >= 0),                   -- najmniejsza jednostka waluty
  currency text not null default 'PLN',
  unit text not null default 'fixed'
    check (unit in ('item', 'kg', 'pack', 'litre', 'tonne', 'hour', 'day', 'week', 'month', 'night', 'fixed')),
  condition text check (condition in ('new', 'used')),
  deal boolean not null default false,            -- okazja
  stock numeric,                                  -- rolnik: ile zostało
  pickup_hours text,
  delivery text[] not null default '{pickup}',    -- pickup, inpost, orlen, dpd, dhl, poczta, courier, other
  shipping_price int,
  deposit int,                                    -- grosze, informacyjnie: płatna właścicielowi
  garage_date date,
  swap_for text,
  photos text[] not null default '{}',
  location geography(point, 4326) not null,
  town text not null,
  voivodeship text not null,
  visibility int not null default 3 check (visibility between 1 and 3),
  incognito boolean not null default false,       -- znajomi nie widzą, obcy bez imienia
  hidden_from uuid[] not null default '{}',
  promoted boolean not null default false,
  paused boolean not null default false,          -- rolnik: „dziś niedostępne”
  status text not null default 'active' check (status in ('active', 'reserved', 'sold', 'removed', 'deleted')),
  sold_at timestamptz,                            -- „Kupione” widać jeszcze dobę
  created_at timestamptz not null default now()
);
create index listings_location_idx on public.listings using gist (location);
create index on public.listings (owner_id, status);
create index on public.listings (category, sub_category, status);

-- Plan darmowy: 2 nowe ogłoszenia w miesiącu kalendarzowym, o ile konto jest odświeżone na ten rok.
-- Roczny i Firma: bez limitu do daty ważności. Kupowanie i czaty zawsze bez opłat.
create or replace function public.enforce_listing_limit() returns trigger language plpgsql as $$
declare p profiles;
begin
  select * into p from public.profiles where id = new.owner_id;
  if p.status <> 'active' then raise exception 'Konto zastrzeżone'; end if;
  if not (p.plan in ('annual', 'business') and p.plan_until > now()) then
    if p.refresh_due <= now() then
      raise exception 'Odśwież darmowe konto (10 zł na rok), żeby dalej wystawiać.';
    end if;
    if (select count(*) from public.listings
        where owner_id = new.owner_id and created_at >= date_trunc('month', now())) >= 2 then
      raise exception 'Limit 2 darmowych ogłoszeń w miesiącu.';
    end if;
  end if;
  return new;
end $$;
create trigger listing_limit before insert on public.listings
  for each row execute function public.enforce_listing_limit();

-- Wyszukiwanie: znajomi i ich znajomi zawsze, reszta w promieniu albo w obszarze.
create or replace function public.listings_nearby(
  lat double precision,
  lng double precision,
  radius_km double precision default 10,
  max_circle int default 3,
  in_town text default null,
  in_voivodeship text default null
)
returns table (listing jsonb, circle int, distance_m double precision)
language sql stable security definer set search_path = public as $$
  with me as (select st_setsrid(st_makepoint(lng, lat), 4326)::geography as p)
  -- incognito: obcy nie dostają owner_id, więc nie da się ustalić, kto sprzedaje
  select case when l.incognito and l.owner_id <> auth.uid() then to_jsonb(l) - 'owner_id' else to_jsonb(l) end,
         c.circle, st_distance(l.location, me.p)
  from listings l, me,
       lateral (select circle_of(auth.uid(), l.owner_id) as circle) c
  where l.status = 'active'
    and is_active(l.owner_id)
    and (case when l.incognito then c.circle = 3 else c.circle <= least(l.visibility, max_circle) end)
    and not auth.uid() = any(l.hidden_from)
    and not exists (select 1 from mutes m where m.user_id = auth.uid() and m.muted_id = l.owner_id)
    and (
      c.circle < 3
      or (in_town is not null and l.town = in_town)
      or (in_voivodeship is not null and l.voivodeship = in_voivodeship)
      or (in_town is null and in_voivodeship is null and (radius_km is null or st_dwithin(l.location, me.p, radius_km * 1000)))
    )
  order by c.circle, st_distance(l.location, me.p)
  limit 200
$$;

-- Zamówienia, rezerwacje, protokół -----------------------------------------
-- Płatność: operator (np. Stripe Connect „direct charges”, Przelewy24 marketplace) obciąża kupującego
-- bezpośrednio na konto sprzedającego. My zapisujemy tylko identyfikator i status z webhooka.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete restrict,
  buyer_id uuid not null references public.profiles,
  seller_id uuid not null references public.profiles,
  qty numeric not null default 1,
  starts_on date,
  ends_on date,
  pickup_slot text,
  delivery text not null default 'pickup',
  locker_code text,
  total int not null default 0,                -- cena sprzedającego (+ wysyłka), bez naszych dopłat
  currency text not null default 'PLN',
  pay_method text not null check (pay_method in ('blik', 'transfer', 'card', 'cash')),
  provider_payment_id text,
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'paid', 'ready', 'done', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.handover_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  phase text not null check (phase in ('before', 'after')),
  taken_by uuid not null references public.profiles,
  storage_path text not null,
  taken_at timestamptz not null default now()   -- czas serwera, nie telefonu
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
  order_id uuid references public.orders,
  created_at timestamptz not null default now()
);
create index on public.messages (chat_id, created_at);

-- Powiadomienia -------------------------------------------------------------
create table public.notification_prefs (
  user_id uuid primary key references public.profiles on delete cascade,
  friends_new boolean not null default true,     -- domyślnie: znajomi dodali coś nowego
  messages boolean not null default true,
  orders boolean not null default true,
  fof_new boolean not null default false,
  nearby boolean not null default false,
  quiet_hours boolean not null default true
);

create table public.push_tokens (
  user_id uuid not null references public.profiles on delete cascade,
  token text not null,                          -- Web Push / FCM / APNs
  platform text not null check (platform in ('web', 'android', 'ios')),
  primary key (user_id, token)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null,                           -- friend_new, friend_restricted, order_paid, order_ready, message
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- Nowe ogłoszenie: powiadomienie do znajomych (wysyłkę push robi Edge Function nasłuchująca tej tabeli).
create or replace function public.notify_friends_new_listing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, payload)
    select f.friend_id, 'friend_new', jsonb_build_object('listing_id', new.id, 'title', new.title)
    from friends f join notification_prefs np on np.user_id = f.friend_id and np.friends_new
    where f.user_id = new.owner_id;
  return new;
end $$;
create trigger listing_notify after insert on public.listings
  for each row execute function public.notify_friends_new_listing();

-- DAC7: dane do rocznego raportu (sprzedaż towarów, najem nieruchomości i środków transportu, usługi osobiste).
create or replace view public.dac7_sellers with (security_invoker = true) as
  select o.seller_id, l.kind, l.category, date_part('year', o.paid_at) as year,
         count(*) as transactions, sum(o.total) as total_grosze
  from public.orders o join public.listings l on l.id = o.listing_id
  where o.status in ('paid', 'ready', 'done')
  group by 1, 2, 3, 4;

-- Kto pierwszy zapłaci, ten ma: webhook operatora oznacza płatność i od razu wygasza ofertę.
-- Sprzedaż pojedynczej rzeczy → „Kupione”; wiele sztuk → maleje zapas, „Kupione” przy zerze; wynajem → zajęte.
create or replace function public.on_order_paid() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update listings set
      stock = case when stock is null then null else greatest(0, stock - new.qty) end,
      status = case
        when stock is not null and stock - new.qty > 0 then status
        when stock is null and kind = 'rent' then 'reserved'
        else 'sold' end,
      sold_at = case when (stock is null and kind <> 'rent') or stock - new.qty <= 0 then now() else sold_at end
    where id = new.listing_id and status = 'active';
    if not found then raise exception 'Ktoś był szybszy: rzecz już zarezerwowana'; end if;
  end if;
  return new;
end $$;
create trigger order_paid before update of status on public.orders
  for each row execute function public.on_order_paid();

-- DSA: zgłoszenia (art. 16) i decyzje z uzasadnieniem (art. 17), wysyłanym automatycznie obu stronom.
create table public.reports (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings on delete cascade,
  reporter_id uuid references public.profiles on delete set null,
  reporter_email text,                          -- zgłoszenie także bez konta, ze strony www
  reason text not null check (reason in ('scam', 'illegal', 'fake', 'rights', 'offensive', 'other')),
  note text,
  status text not null default 'new' check (status in ('new', 'removed', 'kept')),
  statement text,                               -- uzasadnienie decyzji
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.notify_report_decision() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and new.status in ('removed', 'kept') then
    if new.status = 'removed' then update listings set status = 'removed' where id = new.listing_id; end if;
    insert into notifications (user_id, kind, payload)
      select owner_id, 'report_decision', jsonb_build_object('report', new.id, 'decision', new.status, 'statement', new.statement)
      from listings where id = new.listing_id
      union all
      select new.reporter_id, 'report_decision', jsonb_build_object('report', new.id, 'decision', new.status)
      where new.reporter_id is not null;
  end if;
  return new;
end $$;
create trigger report_decision after update of status on public.reports
  for each row execute function public.notify_report_decision();

-- DAC7: dane sprzedawców (zbierane dopiero od 25 transakcji w roku) i roczne raporty.
create table public.seller_tax_data (
  user_id uuid primary key references public.profiles on delete cascade,
  legal_name text,
  address text,
  tax_id text,                                  -- NIP lub PESEL; w produkcji szyfrowane (pgsodium / Vault)
  birth_date date,
  iban text,
  updated_at timestamptz not null default now()
);

create table public.dac7_reports (
  year int primary key,
  prepared_at timestamptz,
  submitted_at timestamptz,                     -- po wysłaniu DPI-IS do Szefa KAS
  sellers_notified_at timestamptz,
  file_path text
);

-- Automaty (pg_cron): przypomnienia o planach i sezon DAC7. Panel operatora tylko pokazuje, co wysłać.
-- select cron.schedule('renewals', '0 9 * * *', $$
--   insert into notifications (user_id, kind, payload)
--   select id, 'plan_ending', jsonb_build_object('days', (plan_until::date - now()::date))
--   from profiles where plan <> 'free' and (plan_until::date - now()::date) in (30, 7, 1) $$);
-- select cron.schedule('dac7-season', '0 8 1 12 *', $$
--   insert into dac7_reports (year) values (extract(year from now())::int) on conflict do nothing $$);
-- select cron.schedule('dac7-ask-data', '0 10 * * *', $$
--   insert into notifications (user_id, kind)
--   select seller_id, 'dac7_data' from orders where status in ('paid','ready','done')
--     and paid_at >= date_trunc('year', now()) group by seller_id having count(*) >= 25 $$);

-- RLS -------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.phone_hashes enable row level security;
alter table public.friendships enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.unlock_requests enable row level security;
alter table public.unlock_approvals enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.handover_photos enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.mutes enable row level security;
alter table public.forgotten enable row level security;
alter table public.reports enable row level security;
alter table public.seller_tax_data enable row level security;
alter table public.dac7_reports enable row level security;

create policy "own mutes" on public.mutes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own forgotten" on public.forgotten for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "report anything" on public.reports for insert with check (reporter_id = auth.uid());
create policy "see own reports" on public.reports for select using (reporter_id = auth.uid());
create policy "own tax data" on public.seller_tax_data for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- dac7_reports: tylko service_role (panel operatora przez Edge Function).

create policy "profile readable" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profile own insert" on public.profiles for insert with check (id = auth.uid());
-- status i plan zmieniają tylko funkcje serwerowe (restrict_account, try_unlock, webhook płatności)
create policy "profile own update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and status = (select status from public.profiles where id = auth.uid())
              and plan = (select plan from public.profiles where id = auth.uid()));

create policy "own phone hash" on public.phone_hashes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "see own friendships" on public.friendships for select using (auth.uid() in (a, b));

create policy "own trusted" on public.trusted_contacts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "trusted sees requests" on public.unlock_requests for select
  using (user_id = auth.uid() or exists (select 1 from public.trusted_contacts t where t.user_id = unlock_requests.user_id and t.trusted_id = auth.uid()));
create policy "own unlock request" on public.unlock_requests for insert with check (user_id = auth.uid());
create policy "trusted approves" on public.unlock_approvals for insert
  with check (approver_id = auth.uid() and exists (
    select 1 from public.unlock_requests r join public.trusted_contacts t on t.user_id = r.user_id
    where r.id = request_id and t.trusted_id = auth.uid()));

create policy "listing visible in circle" on public.listings for select
  using (owner_id = auth.uid()
         or ((status in ('active', 'reserved') or (status = 'sold' and sold_at > now() - interval '1 day'))
             and public.is_active(owner_id) and not auth.uid() = any(hidden_from)
             and case when incognito then public.circle_of(auth.uid(), owner_id) = 3
                      else public.circle_of(auth.uid(), owner_id) <= visibility end));
create policy "listing own write" on public.listings for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.is_active(auth.uid()));

create policy "order parties" on public.orders for select using (auth.uid() in (buyer_id, seller_id));
create policy "order create" on public.orders for insert with check (buyer_id = auth.uid() and public.is_active(auth.uid()) and public.is_active(seller_id));
create policy "order parties update" on public.orders for update using (auth.uid() in (buyer_id, seller_id) and public.is_active(auth.uid()));

create policy "photos parties" on public.handover_photos for select
  using (exists (select 1 from public.orders o where o.id = order_id and auth.uid() in (o.buyer_id, o.seller_id)));
create policy "photos add" on public.handover_photos for insert
  with check (taken_by = auth.uid() and exists (
    select 1 from public.orders o where o.id = order_id and auth.uid() in (o.buyer_id, o.seller_id)));

create policy "chat members" on public.chats for select using (auth.uid() in (member_a, member_b));
create policy "chat start" on public.chats for insert with check (auth.uid() in (member_a, member_b) and public.is_active(auth.uid()));
create policy "messages members" on public.messages for select
  using (exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.member_a, c.member_b)));
create policy "messages send" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_active(auth.uid()) and exists (
    select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.member_a, c.member_b)));

create policy "own prefs" on public.notification_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tokens" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "mark read" on public.notifications for update using (user_id = auth.uid());

revoke all on public.dac7_sellers from anon, authenticated;
revoke execute on function public.restrict_account(uuid) from anon, authenticated;
revoke execute on function public.try_unlock(uuid) from anon, authenticated;

-- Zastrzeżenie z poziomu aplikacji: tylko własne konto.
create or replace function public.restrict_me()
returns void language sql security definer set search_path = public as $$
  select restrict_account(auth.uid())
$$;
grant execute on function public.restrict_me() to authenticated;
