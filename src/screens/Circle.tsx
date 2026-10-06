import { useState } from 'react'
import { useStore } from '../data/store'
import { Avatar, Button, Header, Rings, Section } from '../components/ui'
import { ME } from '../data/seed'

/** Kontakty z telefonu, których jeszcze nie ma w aplikacji (w wersji natywnej: wtyczka Contacts). */
const PHONE_CONTACTS = ['Agnieszka (sąsiadka)', 'Wujek Staszek', 'Kuba z pracy', 'Monika', 'Paweł rower', 'Basia']
const REWARD_AT = 3

export function CircleScreen() {
  const { users, me, listings, relation, invited, invite } = useStore()
  const [copied, setCopied] = useState('')
  const friends = me.friends.map((id) => users[id])
  const fof = Object.values(users).filter((u) => u.id !== ME && relation(u.id).circle === 2)
  const inCircle = listings.filter((l) => l.ownerId !== ME && relation(l.ownerId).circle <= Math.min(2, l.visibility)).length
  const progress = Math.min(invited.length, REWARD_AT)

  const sendInvite = async (name: string) => {
    invite(name)
    const msg = `Cześć! Wrzucam rzeczy do pożyczenia na WhatsThat, zobacz co mam: https://whatsthat.app/z/ty`
    try {
      if (navigator.share) await navigator.share({ text: msg })
      else await navigator.clipboard.writeText(msg)
      setCopied(`Zaproszenie dla: ${name} gotowe do wysłania.`)
    } catch {
      setCopied(msg)
    }
  }

  return (
    <>
      <Header title="Mój krąg" />
      <div className="flex flex-col gap-6 px-4 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: friends.length, l: 'znajomych', c: 1 as const },
            { n: fof.length, l: 'ich znajomych', c: 2 as const },
            { n: inCircle, l: 'rzeczy w kręgu', c: 3 as const },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface px-2 py-3">
              <Rings circle={s.c} size={18} />
              <span className="tnum font-display text-2xl font-bold">{s.n}</span>
              <span className="text-xs text-muted">{s.l}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-brand-soft p-4">
          <p className="font-display text-lg font-bold">Zaproś 3 osoby, dostaniesz 3 miesiące Pro</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(progress / REWARD_AT) * 100}%` }} />
          </div>
          <p className="tnum text-sm">{progress}/{REWARD_AT} zaproszonych{progress >= REWARD_AT ? ' · nagroda odblokowana' : ''}</p>
        </div>
        {copied && <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm break-all text-ok">{copied}</p>}

        <Section title="Z Twoich kontaktów">
          <ul className="flex flex-col gap-2">
            {PHONE_CONTACTS.map((c) => (
              <li key={c} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-sunken font-semibold text-muted">{c[0]}</span>
                <span className="min-w-0 flex-1 truncate">{c}</span>
                <Button variant={invited.includes(c) ? 'ghost' : 'soft'} className="min-h-9 px-3 text-sm" onClick={() => sendInvite(c)}>
                  {invited.includes(c) ? 'Wyślij ponownie' : 'Zaproś'}
                </Button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Znajomi w aplikacji">
          <ul className="flex flex-col gap-3">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-3">
                <Avatar user={f} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{f.name}</span>
                  <span className="tnum block text-sm text-muted">{listings.filter((l) => l.ownerId === f.id).length} rzeczy · {f.place.city}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Znajomi znajomych">
          <ul className="flex flex-col gap-3">
            {fof.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <Avatar user={u} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{u.name}</span>
                  <span className="block truncate text-sm text-muted">zna: {relation(u.id).via.map((v) => users[v].name.split(' ')[0]).join(', ')}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}
