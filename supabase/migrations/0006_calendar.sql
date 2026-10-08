-- Miliorbit 0.8: prywatny kalendarz użytkownika.
-- Widzi go tylko właściciel (RLS). Pozostałe pozycje kalendarza (wydarzenia z „Będę”, odbiory i zwroty
-- z zamówień, wywóz śmieci) aplikacja liczy z innych tabel, więc nie dublujemy ich tutaj.

create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  client_id text not null check (length(client_id) between 1 and 40),   -- id nadane w aplikacji (działa też offline)
  title text not null check (length(title) between 1 and 120),
  day date not null,
  at_time time,
  note text check (length(note) <= 500),
  remind boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index calendar_entries_user_day on public.calendar_entries (user_id, day);

alter table public.calendar_entries enable row level security;
create policy "own calendar" on public.calendar_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Przypomnienia push (gdy będzie Firebase, krok 6 planu): funkcja `calendar-remind` z cron o 7:00 czasu polskiego
-- wybiera wpisy z remind = true na dziś i wysyła powiadomienie na telefon właściciela.
-- select cron.schedule('calendar-remind', '0 5 * * *', $$ select net.http_post('https://<projekt>.functions.supabase.co/calendar-remind') $$);
