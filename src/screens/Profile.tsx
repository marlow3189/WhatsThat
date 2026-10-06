import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Header, ListingCard, Section, cx } from '../components/ui'
import { STATUS } from './Chats'
import { PRICING } from '../lib/fees'
import { formatPLN, zl } from '../lib/money'
import type { Plan } from '../lib/types'
import { ME } from '../data/seed'

const PLANS: { id: Plan; name: string; price: string; points: string[] }[] = [
  { id: 'free', name: 'Free', price: '0 zł', points: ['Bez limitu w kręgu znajomych', '5 ogłoszeń w markecie', 'Czat, kaucje, protokół zdjęć'] },
  { id: 'pro', name: 'Pro', price: '19 zł/mies.', points: ['Bez limitu w markecie', 'Wystawianie na OLX, Allegro, Vinted, FB, eBay', 'Kalendarz dostępności i statystyki'] },
  { id: 'biznes', name: 'Biznes', price: '79 zł/mies.', points: ['Dla wypożyczalni i firm', 'Rezerwacje online i faktury', 'Profil firmy i wyróżnienie w okolicy'] },
]

export function Profile() {
  const { me, users, listings, bookings, relation, setPlan, reset } = useStore()
  const mine = listings.filter((l) => l.ownerId === ME)
  const [items, setItems] = useState(5)
  const [perDay, setPerDay] = useState(30)
  const [daysRented, setDaysRented] = useState(4)
  const monthly = zl(items * perDay * daysRented)

  return (
    <>
      <Header title="Ja" />
      <div className="flex flex-col gap-7 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar user={me} size={56} />
          <div className="min-w-0">
            <p className="font-display text-xl font-bold">Twój profil</p>
            <p className="tnum text-sm text-muted">★ {me.rating.toFixed(1)} · {me.reviews} opinie · {me.place.city}</p>
          </div>
        </div>

        <Section title="Ile mogą zarobić Twoje rzeczy">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            {[
              { id: 'calc-items', label: 'Rzeczy do wynajęcia', v: items, set: setItems, min: 1, max: 30, unit: '' },
              { id: 'calc-price', label: 'Średnia cena za dzień', v: perDay, set: setPerDay, min: 5, max: 200, unit: ' zł' },
              { id: 'calc-days', label: 'Dni wynajmu w miesiącu', v: daysRented, set: setDaysRented, min: 1, max: 20, unit: '' },
            ].map((f) => (
              <label key={f.id} htmlFor={f.id} className="flex flex-col gap-1 text-sm">
                <span className="flex justify-between"><span className="text-muted">{f.label}</span><span className="tnum font-semibold">{f.v}{f.unit}</span></span>
                <input id={f.id} type="range" min={f.min} max={f.max} value={f.v} onChange={(e) => f.set(Number(e.target.value))} />
              </label>
            ))}
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="font-semibold">Miesięcznie</span>
              <span className="tnum font-display text-2xl font-extrabold text-brand">{formatPLN(monthly)}</span>
            </div>
            <p className="text-xs text-muted">Dostajesz 100% swojej ceny. Opłatę serwisową płaci wypożyczający.</p>
          </div>
        </Section>

        <Section title="Plan">
          <div className="flex flex-col gap-2">
            {PLANS.map((p) => (
              <button key={p.id} type="button" onClick={() => setPlan(p.id)} aria-pressed={me.plan === p.id} className={cx('flex flex-col gap-1 rounded-2xl border p-4 text-left', me.plan === p.id ? 'border-brand bg-brand-soft' : 'border-line bg-surface')}>
                <span className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold">{p.name}</span>
                  <span className="tnum font-semibold">{p.price}</span>
                </span>
                <ul className="text-sm text-muted">
                  {p.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Wersja demo: zmiana planu nic nie kosztuje. Opłaty transakcyjne: znajomi 0%, znajomi znajomych {PRICING.rentServiceFee[2] * 100}%, market {PRICING.rentServiceFee[3] * 100}%.</p>
        </Section>

        <Section title="Moje wypożyczenia" aside={<span className="tnum text-sm text-muted">{bookings.length}</span>}>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted">Jeszcze nic nie wypożyczyłeś. <Link to="/" className="font-semibold text-brand">Rozejrzyj się</Link></p>
          ) : (
            <ul className="flex flex-col gap-2">
              {bookings.map((b) => {
                const l = listings.find((x) => x.id === b.listingId)
                return (
                  <li key={b.id}>
                    <Link to={`/protokol/${b.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
                      <span className="min-w-0 truncate font-medium">{l?.title}</span>
                      <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', STATUS[b.status].tone)}>{STATUS[b.status].label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section title="Moje ogłoszenia" aside={<Link to="/dodaj" className="text-sm font-semibold text-brand">Dodaj</Link>}>
          {mine.length === 0 ? (
            <p className="text-sm text-muted">Wystaw pierwszą rzecz. Najlepiej idą narzędzia, sprzęt turystyczny i rzeczy na imprezy.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {mine.map((l) => <ListingCard key={l.id} listing={l} rel={relation(ME)} users={users} />)}
            </div>
          )}
        </Section>

        <Button variant="ghost" onClick={reset}>Przywróć dane demo</Button>
      </div>
    </>
  )
}
