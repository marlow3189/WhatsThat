-- Miliorbit: bezpieczna płatność, spory, kaucje, alerty sąsiedzkie, reklamy, zaproszenia i ochrona przed nadużyciami.
-- Pieniądze trzyma operator płatności (np. Stripe Connect z ręczną wypłatą albo PayU Marketplace),
-- baza zapisuje tylko stan i decyzje. Uruchamiać po 0001_init.sql.

-- 1. Zamówienia: kod odbioru (tylko skrót), wypłata, zwrot, kaucja
alter table public.orders
  add column handover_code_hash text,                 -- sha256(kod + sól); kod widzi tylko kupujący
  add column released_at timestamptz,                 -- operator wypłacił sprzedającemu
  add column refunded_at timestamptz,                 -- operator zwrócił kupującemu
  add column deposit integer,                         -- grosze; blokada na karcie (manual capture)
  add column deposit_status text check (deposit_status in ('held', 'released', 'claimed')),
  add column auto_release_at timestamptz;             -- 48 h po wydaniu, jeśli nikt nie zgłosi problemu

-- 2. Spory: wstrzymują wypłatę, druga strona ma 48 h, potem mediacja (człowiek, z uzasadnieniem)
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  reason text not null check (reason in ('not_received', 'not_as_described', 'damaged', 'not_returned', 'deposit', 'no_show')),
  note text check (char_length(note) <= 1000),
  status text not null default 'open' check (status in ('open', 'proposed', 'mediation', 'resolved')),
  proposal text check (proposal in ('refund', 'partial', 'release')),
  amount integer check (amount >= 0),
  outcome text check (outcome in ('refund', 'partial', 'release')),
  decided_by uuid references public.profiles(id),       -- mediator (rola operatora)
  reasoning text,                                        -- uzasadnienie decyzji dla obu stron
  respond_by timestamptz not null default now() + interval '48 hours',
  created_at timestamptz not null default now(),
  unique (order_id)
);
alter table public.disputes enable row level security;
create policy "dispute parties read" on public.disputes for select
  using (exists (select 1 from public.orders o where o.id = order_id and auth.uid() in (o.buyer_id, o.seller_id)));
create policy "dispute party opens" on public.disputes for insert
  with check (opened_by = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and auth.uid() in (o.buyer_id, o.seller_id)));
-- zmiany statusu i decyzje tylko przez funkcje serwerowe (Edge Function z kluczem service_role), nie z aplikacji

-- Spór wstrzymuje automatyczną wypłatę
create or replace function public.on_dispute_open() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update orders set auto_release_at = null where id = new.order_id;
  insert into notifications (user_id, kind, payload)
  select case when o.buyer_id = new.opened_by then o.seller_id else o.buyer_id end, 'dispute_opened', jsonb_build_object('order', o.id)
  from orders o where o.id = new.order_id;
  return new;
end $$;
create trigger dispute_open after insert on public.disputes for each row execute function public.on_dispute_open();

-- 3. Zaproszenia: każdy numer liczy się raz (skrót numeru); bez nagród pieniężnych, tylko żeby nie wysyłać dwa razy
create table public.invites (
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  phone_hash text not null,                           -- sha256 numeru; numeru nie przechowujemy
  sent_at timestamptz not null default now(),
  opened_at timestamptz,                              -- ktoś otworzył link /z/<kod>
  joined_at timestamptz,
  primary key (inviter_id, phone_hash)
);
alter table public.invites enable row level security;
create policy "own invites" on public.invites for all using (inviter_id = auth.uid()) with check (inviter_id = auth.uid());

-- 4. Reklamy lokalne (tylko na planie darmowym), z danymi wymaganymi przez DSA art. 26
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.profiles(id),
  listing_id uuid references public.listings(id) on delete cascade,
  paid_by text not null,                              -- kto płaci (może różnić się od reklamodawcy)
  targeting text not null default 'okolica do 15 km, bez profilowania',
  radius_km integer not null default 15,
  starts_at timestamptz not null, ends_at timestamptz not null,
  impressions integer not null default 0, clicks integer not null default 0
);
alter table public.ads enable row level security;
create policy "ads readable" on public.ads for select using (now() between starts_at and ends_at);
alter table public.profiles add column ad_hidden_at timestamptz;

-- 5. Ochrona przed nadużyciami: limity zapytań na konto (SMS, wiadomości, ogłoszenia, zgłoszenia)
create table public.rate_limits (
  user_key text not null,                             -- uid albo skrót IP / numeru
  action text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (user_key, action, window_start)
);
alter table public.rate_limits enable row level security;   -- brak polityk = tylko serwer

create or replace function public.hit_limit(p_key text, p_action text, p_max integer, p_window interval) returns boolean
language plpgsql security definer set search_path = public as $$
declare w timestamptz := date_bin(p_window, now(), timestamptz '2026-01-01'); n integer;
begin
  insert into rate_limits (user_key, action, window_start) values (p_key, p_action, w)
  on conflict (user_key, action, window_start) do update set hits = rate_limits.hits + 1
  returning hits into n;
  return n <= p_max;
end $$;
revoke all on function public.hit_limit from public, anon, authenticated;

-- 6. Dziennik zdarzeń bezpieczeństwa (logowania, zastrzeżenia, decyzje moderatorów), tylko do odczytu dla operatora
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  target text,
  meta jsonb
);
alter table public.audit_log enable row level security;

-- Automaty (pg_cron): wypłata po 48 h bez sporu, przypomnienie o odpowiedzi w sporze
-- select cron.schedule('auto-release', '*/15 * * * *', $$
--   update orders set released_at = now() where auto_release_at < now() and released_at is null and refunded_at is null $$);
-- (sama wypłata: Edge Function `payouts` czyta te wiersze i zleca transfer u operatora płatności)
