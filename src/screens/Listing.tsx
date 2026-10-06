import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, CATEGORIES, CircleBadge, Header, MODE_LABEL, Thumb, Toggle, priceLabel } from '../components/ui'
import { QuoteView } from '../components/QuoteView'
import { quoteFree, quoteRental, quoteSale, rentalDays } from '../lib/fees'
import { distanceKm, formatDistance } from '../lib/geo'
import { trustScore } from '../lib/circles'
import { formatPLN } from '../lib/money'
import { ME } from '../data/seed'

const iso = (d: Date) => d.toISOString().slice(0, 10)

export function ListingScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { listings, users, relation, here, openChat, requestBooking, boost } = useStore()
  const listing = listings.find((l) => l.id === id)

  const today = new Date()
  const [from, setFrom] = useState(iso(new Date(today.getTime() + 86_400_000)))
  const [to, setTo] = useState(iso(new Date(today.getTime() + 3 * 86_400_000)))
  const rel = listing ? relation(listing.ownerId) : { circle: 3 as const, via: [] }
  const [protection, setProtection] = useState(rel.circle === 3)
  const [safeBuy, setSafeBuy] = useState(rel.circle > 1)
  const [shared, setShared] = useState('')

  const days = rentalDays(from, to)
  const quote = useMemo(() => {
    if (!listing) return null
    if (listing.mode === 'rent')
      return quoteRental({ pricePerDay: listing.pricePerDay ?? 0, days, circle: rel.circle, protection, deposit: rel.circle === 1 ? 0 : listing.deposit })
    if (listing.mode === 'sell') return quoteSale({ price: listing.price ?? 0, circle: rel.circle, inApp: safeBuy })
    return quoteFree(rel.circle === 1 ? 0 : listing.deposit)
  }, [listing, days, rel.circle, protection, safeBuy])

  if (!listing || !quote) {
    return (
      <>
        <Header title="Ogłoszenie" back />
        <p className="p-6 text-muted">To ogłoszenie zniknęło albo nie masz do niego dostępu.</p>
      </>
    )
  }

  const owner = users[listing.ownerId]
  const mine = listing.ownerId === ME
  const trust = trustScore(owner, rel)
  const link = `https://whatsthat.app/l/${listing.id}`

  const share = async () => {
    const text = `${listing.title} — ${priceLabel(listing)} na WhatsThat`
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text, url: link })
        return
      }
      await navigator.clipboard.writeText(`${text}\n${link}`)
      setShared('Link skopiowany. Wklej go na WhatsAppie albo w grupie osiedlowej.')
    } catch {
      setShared(link)
    }
  }

  const act = () => {
    const chatId = openChat(listing)
    if (listing.mode === 'rent') {
      requestBooking({ listingId: listing.id, renterId: ME, ownerId: listing.ownerId, from, to, circle: rel.circle, protection, quote }, chatId)
    }
    nav(`/czat/${chatId}`)
  }

  const cta = { rent: 'Poproś o wypożyczenie', sell: 'Kupuję', lend: 'Poproś o pożyczenie', swap: 'Zaproponuj wymianę' }[listing.mode]

  return (
    <>
      <Header
        title={MODE_LABEL[listing.mode]}
        back
        right={
          <button type="button" onClick={share} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold">
            Udostępnij
          </button>
        }
      />
      <Thumb listing={listing} className="text-7xl [&>span]:text-8xl" />
      <div className="flex flex-col gap-5 px-4 py-4">
        {shared && <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm break-all text-ok">{shared}</p>}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">{CATEGORIES[listing.category]}</span>
          <h1 className="text-2xl leading-tight font-bold">{listing.title}</h1>
          <p className="tnum font-display text-2xl font-extrabold text-brand">{priceLabel(listing)}</p>
          {listing.mode === 'swap' && listing.swapFor && <p className="text-sm">Szukam: <strong>{listing.swapFor}</strong></p>}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <Avatar user={owner} size={46} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="truncate">{mine ? 'Twoje ogłoszenie' : owner.name}</span>
              {owner.verified && <span className="text-xs text-ok" title="Zweryfikowany">✓</span>}
              {owner.plan === 'biznes' && <span className="rounded bg-sunken px-1.5 text-[10px] font-bold uppercase">Firma</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
              {!mine && <CircleBadge rel={rel} users={users} />}
              <span className="tnum">★ {owner.rating.toFixed(1)} · {owner.reviews} opinii</span>
            </div>
          </div>
          {!mine && (
            <div className="text-center">
              <div className="tnum font-display text-xl font-bold">{trust}</div>
              <div className="text-[10px] font-semibold tracking-wide text-muted uppercase">zaufanie</div>
            </div>
          )}
        </div>

        <p className="leading-relaxed">{listing.description}</p>
        <p className="text-sm text-muted">
          {listing.place.city} · {formatDistance(distanceKm(here, listing.place))} od Ciebie
          {listing.value ? ` · wartość ${formatPLN(listing.value)}` : ''}
        </p>

        {mine ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <p className="font-semibold">Promuj ogłoszenie</p>
            <p className="text-sm text-muted">Wyróżnienie na 7 dni: na górze wyników w Twojej okolicy za 4,99 zł.</p>
            <Button variant="soft" onClick={() => boost(listing.id)} disabled={(listing.boostedUntil ?? 0) > Date.now()}>
              {(listing.boostedUntil ?? 0) > Date.now() ? 'Wyróżnione' : 'Wyróżnij za 4,99 zł'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
            {listing.mode === 'rent' && (
              <div className="grid grid-cols-2 gap-3">
                <label htmlFor="from" className="flex flex-col gap-1 text-sm font-medium">
                  Od
                  <input id="from" type="date" value={from} min={iso(today)} onChange={(e) => setFrom(e.target.value)} className="min-h-11 rounded-xl border border-line bg-bg px-3" />
                </label>
                <label htmlFor="to" className="flex flex-col gap-1 text-sm font-medium">
                  Do
                  <input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="min-h-11 rounded-xl border border-line bg-bg px-3" />
                </label>
              </div>
            )}
            {listing.mode === 'rent' && (
              <Toggle
                id="protection"
                checked={protection}
                onChange={setProtection}
                label="Ochrona przed zniszczeniem"
                hint={rel.circle === 1 ? 'Między znajomymi opcjonalna.' : 'Pokrywa naprawę lub wartość rzeczy, gdy coś pójdzie nie tak.'}
              />
            )}
            {listing.mode === 'sell' && rel.circle > 1 && (
              <Toggle id="safebuy" checked={safeBuy} onChange={setSafeBuy} label="Bezpieczny zakup" hint="Pieniądze trafią do sprzedającego, gdy potwierdzisz odbiór." />
            )}
            <QuoteView quote={quote} totalLabel={listing.mode === 'rent' ? 'Płacisz' : 'Razem'} />
            {!quote.inApp && listing.mode !== 'lend' && listing.mode !== 'swap' && (
              <p className="text-xs text-muted">Rozliczacie się sami: gotówka, BLIK na telefon albo przelew.</p>
            )}
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button variant="ghost" onClick={() => nav(`/czat/${openChat(listing)}`)}>Napisz</Button>
              <Button onClick={act}>{cta}</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
