-- Miliorbit 0.8: zweryfikowane instytucje (gmina, spółdzielnia, sołectwo, szkoła, wodociągi…),
-- ich komunikaty i harmonogram wywozu śmieci, oraz język hindi.
--
-- Zasada: nikt nie może podszyć się pod gminę. Konto zwykłego użytkownika NIGDY nie publikuje komunikatu
-- „urzędowego”. Robi to tylko członek instytucji o statusie `verified`, a status nadaje wyłącznie operator
-- (service_role, panel /operator) po sprawdzeniu:
--   1) adres e-mail w domenie urzędu z BIP / gov.pl (np. @gmina-tarczyn.pl) albo skrzynka ePUAP,
--   2) oddzwonienie na numer sekretariatu z BIP (nie na numer podany we wniosku),
--   3) upoważnienie podpisane przez wójta / burmistrza / prezesa (PDF w prywatnym schowku `org-docs`).
-- Komunikaty instytucji mają w aplikacji znaczek „Zweryfikowana instytucja” i nie da się ich dodać z ekranu Dodaj.

-- ——— Hindi ———
alter table public.profiles drop constraint if exists profiles_lang_check;
alter table public.profiles add constraint profiles_lang_check
  check (lang in ('pl', 'en', 'de', 'uk', 'cs', 'sk', 'hu', 'it', 'es', 'hi'));

-- ——— Instytucje ———
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('municipality', 'village', 'housing', 'school', 'utility', 'police', 'other')),
  name text not null check (length(name) between 3 and 120),
  country text not null default 'PL',
  region text not null,                          -- województwo / Bundesland / stan
  official_code text,                            -- TERYT gminy (PL), Gemeindeschlüssel (DE)…
  center geography(point, 4326) not null,
  radius_km numeric not null default 10 check (radius_km between 0.2 and 80),
  website text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'suspended')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.organizations on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  added_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Wniosek o konto instytucji (składa pracownik urzędu z aplikacji albo strony). Decyzję podejmuje człowiek.
create table public.org_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  kind text not null check (kind in ('municipality', 'village', 'housing', 'school', 'utility', 'police', 'other')),
  name text not null check (length(name) between 3 and 120),
  official_code text,
  official_email text not null check (official_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  office_phone text,                             -- numer sekretariatu z BIP, na który oddzwaniamy
  document_path text,                            -- upoważnienie w schowku org-docs (prywatnym)
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decision_note text,
  org_id uuid references public.organizations on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- Czy użytkownik może publikować w imieniu instytucji (tylko zweryfikowanej).
create or replace function public.is_org_editor(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members m join public.organizations o on o.id = m.org_id
    where m.org_id = org and m.user_id = auth.uid() and o.status = 'verified'
  )
$$;

-- ——— Komunikaty instytucji ———
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  kind text not null check (kind in ('notice', 'alert', 'outage', 'event', 'waste')),
  title text not null check (length(title) between 3 and 140),
  body text not null default '' check (length(body) <= 4000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid not null references public.profiles default auth.uid(),
  created_at timestamptz not null default now()
);
create index announcements_org_time on public.announcements (org_id, starts_at desc);

-- ——— Harmonogram wywozu śmieci ———
-- Gmina dzieli teren na rejony (ulice / sołectwa), a mieszkaniec raz wybiera swój rejon.
create table public.waste_zones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  name text not null check (length(name) between 2 and 120),
  streets text[] not null default '{}',
  unique (org_id, name)
);

create table public.waste_pickups (
  zone_id uuid not null references public.waste_zones on delete cascade,
  fraction text not null check (fraction in ('mixed', 'paper', 'plastic', 'glass', 'bio', 'green', 'bulky', 'hazardous')),
  pickup_date date not null,
  primary key (zone_id, fraction, pickup_date)
);
create index waste_pickups_date on public.waste_pickups (pickup_date);

create table public.user_waste_zone (
  user_id uuid primary key references public.profiles on delete cascade default auth.uid(),
  zone_id uuid not null references public.waste_zones on delete cascade,
  remind boolean not null default true           -- przypomnienie dzień wcześniej o 19:00
);

-- ——— Uprawnienia (RLS) ———
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.org_applications enable row level security;
alter table public.announcements enable row level security;
alter table public.waste_zones enable row level security;
alter table public.waste_pickups enable row level security;
alter table public.user_waste_zone enable row level security;

-- Instytucje i ich komunikaty widzą wszyscy zalogowani; zmiany statusu tylko operator (service_role omija RLS).
create policy "orgs readable" on public.organizations for select using (auth.role() = 'authenticated' and status = 'verified');
create policy "members see own membership" on public.org_members for select using (user_id = auth.uid() or public.is_org_editor(org_id));

create policy "apply for org" on public.org_applications for insert
  with check (user_id = auth.uid() and status = 'pending' and org_id is null and decided_at is null);
create policy "see own applications" on public.org_applications for select using (user_id = auth.uid());

create policy "announcements readable" on public.announcements for select
  using (auth.role() = 'authenticated' and exists (select 1 from public.organizations o where o.id = org_id and o.status = 'verified'));
create policy "editors publish" on public.announcements for insert
  with check (public.is_org_editor(org_id) and created_by = auth.uid());
create policy "editors edit" on public.announcements for update
  using (public.is_org_editor(org_id)) with check (public.is_org_editor(org_id));
create policy "editors delete" on public.announcements for delete using (public.is_org_editor(org_id));

create policy "zones readable" on public.waste_zones for select using (auth.role() = 'authenticated');
create policy "editors manage zones" on public.waste_zones for all
  using (public.is_org_editor(org_id)) with check (public.is_org_editor(org_id));
create policy "pickups readable" on public.waste_pickups for select using (auth.role() = 'authenticated');
create policy "editors manage pickups" on public.waste_pickups for all
  using (public.is_org_editor((select z.org_id from public.waste_zones z where z.id = zone_id)))
  with check (public.is_org_editor((select z.org_id from public.waste_zones z where z.id = zone_id)));
create policy "own waste zone" on public.user_waste_zone for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Komunikaty z okolicy dla ekranu Okolica: zweryfikowane instytucje, w których zasięgu mieszkasz.
create or replace function public.announcements_near(lim int default 20)
returns table (id uuid, org_id uuid, org_name text, org_kind text, kind text, title text, body text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, o.id, o.name, o.kind, a.kind, a.title, a.body, a.starts_at, a.ends_at
  from public.announcements a
  join public.organizations o on o.id = a.org_id and o.status = 'verified'
  join public.profiles p on p.id = auth.uid()
  where a.starts_at <= now() + interval '14 days'
    and (a.ends_at is null or a.ends_at > now())
    and ST_DWithin(o.center, p.home, o.radius_km * 1000)
  order by (a.kind = 'alert') desc, a.starts_at desc
  limit least(greatest(lim, 1), 50)
$$;

-- Najbliższe odbiory śmieci w Twoim rejonie (na kartę „Jutro wywóz: papier, plastik”).
create or replace function public.my_waste_pickups(days int default 14)
returns table (pickup_date date, fraction text, zone text)
language sql stable security definer set search_path = public as $$
  select w.pickup_date, w.fraction, z.name
  from public.user_waste_zone u
  join public.waste_zones z on z.id = u.zone_id
  join public.waste_pickups w on w.zone_id = z.id
  where u.user_id = auth.uid() and w.pickup_date between current_date and current_date + least(greatest(days, 1), 60)
  order by w.pickup_date, w.fraction
$$;

alter publication supabase_realtime add table public.announcements;

-- Przypomnienia dzień przed wywozem (19:00 czasu polskiego) wysyła funkcja Edge `waste-remind` z cron:
-- select cron.schedule('waste-remind', '0 17 * * *', $$ select net.http_post('https://<projekt>.functions.supabase.co/waste-remind') $$);
