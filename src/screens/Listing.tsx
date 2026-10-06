import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Field, Group, Header, Input, Notice, Row, ShareSheet, Thumb, cx, formatDay, inputCls, listingUrl, priceText, relationText } from '../components/ui'
import { Icon } from '../components/icons'
import { categoryById, subById } from '../lib/categories'
import { COUNTABLE, orderTotal } from '../lib/pricing'
import { distanceKm, formatDistance } from '../lib/geo'
import { formatPLN } from '../lib/money'
import { localeOf } from '../i18n'
import { ME } from '../data/seed'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const PICKUPS = ['pick.today', 'pick.tomorrow', 'pick.saturday'] as const

export function ListingScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, account, listings, users, relation, openChat, placeOrder } = useStore()
  const listing = listings.find((l) => l.id === id)
  const [share, setShare] = useState(false)
  const [qty, setQty] = useState(1)
  const [pickup, setPickup] = useState<string>(PICKUPS[0])
  const [pay, setPay] = useState<'blik' | 'cash'>('blik')
  const [blik, setBlik] = useState('')
  const today = new Date()
  const [from, setFrom] = useState(iso(new Date(today.getTime() + 86_400_000)))
  const [to, setTo] = useState(iso(new Date(today.getTime() + 3 * 86_400_000)))
  const [note, setNote] = useState('')

  if (!listing) {
    return (
      <>
        <Header title="" back />
        <p className="p-6 text-muted">{t('l.missing')}</p>
      </>
    )
  }

  const owner = users[listing.ownerId]
  const rel = relation(listing.ownerId)
  const mine = listing.ownerId === ME
  const lang = account.lang
  const category = categoryById(listing.category)
  const sub = subById(listing.category, listing.sub)
  const countable = listing.kind === 'sell' && COUNTABLE.includes(listing.unit)
  const step = listing.unit === 'kg' ? 0.5 : 1
  const total = listing.price !== undefined ? orderTotal({ price: listing.price, unit: listing.unit, kind: listing.kind, qty, from, to }) : 0
  const blocked = account.restricted || owner.restricted

  const tags = [t(`kind.${listing.kind}`), listing.condition && t(`cond.${listing.condition}`), listing.deal && t('deal')].filter(Boolean).join(' · ')

  const submit = () => {
    const orderId = placeOrder({
      listing,
      qty,
      total,
      pay: listing.kind === 'sell' ? pay : 'cash',
      from: listing.kind === 'rent' || listing.kind === 'service' ? from : undefined,
      to: listing.kind === 'rent' ? to : undefined,
      pickup: listing.kind === 'sell' ? pickup : undefined,
      note: note.trim() || undefined,
    })
    if (orderId) nav(`/zamowienie/${orderId}`)
  }

  const cta =
    listing.kind === 'sell'
      ? pay === 'blik' ? t('l.pay', { amount: formatPLN(total) }) : t('l.reserve')
      : listing.kind === 'rent' ? t('l.request')
      : listing.kind === 'service' ? t('l.requestService')
      : listing.kind === 'give' ? t('l.requestFree')
      : t('l.propose')

  const canSubmit = listing.kind !== 'sell' || pay === 'cash' || blik.length === 6

  return (
    <div className="pb-6">
      <Header
        title={category.label[lang]}
        back
        right={
          <button type="button" onClick={() => setShare(true)} className="flex min-h-11 items-center gap-1.5 px-2 text-[15px] font-semibold text-accent">
            <Icon name="share" size={20} /> {t('l.share')}
          </button>
        }
      />
      <Thumb listing={listing} className="aspect-[4/3] max-h-[46vh] w-full max-w-full" />

      <div className="flex flex-col gap-1 px-4 pt-4">
        <p className="text-[13px] text-muted">{[tags, sub?.label[lang]].filter(Boolean).join(' · ')}</p>
        <h1 className="text-[24px] leading-tight font-bold tracking-tight">{listing.title}</h1>
        <p className="tnum text-[22px] font-semibold">{priceText(listing, t)}</p>
      </div>

      <div className="mt-5 flex flex-col gap-6">
        {owner.restricted && <div className="px-4"><Notice tone="danger">{t('l.restricted')}</Notice></div>}

        <Group>
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar user={owner} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{mine ? account.name : owner.name}</p>
              <p className="flex items-center gap-1 text-[13px] text-muted">
                {!owner.restricted && <Icon name="shield" size={14} className="text-ok" />}
                {mine ? t('me.verified') : relationText(rel, owner, users, t)}
              </p>
            </div>
            {!mine && !blocked && (
              <Button variant="secondary" className="min-h-10 px-3" onClick={() => nav(`/czat/${openChat(listing)}`)}>
                {t('l.write')}
              </Button>
            )}
          </div>
        </Group>

        <Group>
          <Row icon="pin" title={listing.place.town} detail={mine ? undefined : t('l.distance', { d: formatDistance(distanceKm(account.place, listing.place)) })} />
          {listing.garageDate && <Row icon="calendar" title={formatDay(listing.garageDate, localeOf(lang))} detail={listing.pickupHours} />}
          {listing.pickupHours && !listing.garageDate && <Row icon="calendar" title={t('l.pickup')} detail={listing.pickupHours} />}
          {listing.stock !== undefined && <Row icon="bag" title={t('l.stock', { n: listing.stock, unit: t(`unit.${listing.unit}`) })} />}
          {listing.shipping && <Row icon="truck" title={t('l.shipping')} />}
          {listing.deposit ? <Row icon="lock" title={t('l.deposit', { amount: formatPLN(listing.deposit) })} /> : null}
          {listing.swapFor && <Row icon="list" title={t('l.swapFor', { what: listing.swapFor })} />}
        </Group>

        <p className="px-4 leading-relaxed">{listing.description}</p>

        {mine ? (
          <div className="px-4"><Notice tone="ok">{t('l.yours')}</Notice></div>
        ) : blocked ? null : listing.kind === 'garage' ? null : (
          <section className="mx-4 flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
            {countable && (
              <Field id="qty" label={t('l.qty')}>
                <div className="flex items-center gap-3">
                  <button type="button" className="grid size-11 place-items-center rounded-lg border border-line text-[20px]" onClick={() => setQty((q) => Math.max(step, +(q - step).toFixed(1)))} aria-label="−">−</button>
                  <span id="qty" className="tnum min-w-16 text-center text-[18px] font-semibold">{String(qty).replace('.', ',')} {t(`unit.${listing.unit}`)}</span>
                  <button type="button" className="grid size-11 place-items-center rounded-lg border border-line text-[20px]" onClick={() => setQty((q) => Math.min(listing.stock ?? 999, +(q + step).toFixed(1)))} aria-label="+">+</button>
                </div>
              </Field>
            )}
            {listing.kind === 'sell' && (
              <Field id="pickup" label={t('l.when')}>
                <select id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className={inputCls}>
                  {PICKUPS.map((p) => <option key={p} value={p}>{t(p)}</option>)}
                </select>
              </Field>
            )}
            {(listing.kind === 'rent' || listing.kind === 'service') && (
              <div className={cx('grid gap-3', listing.kind === 'rent' && 'grid-cols-2')}>
                <Field id="from" label={t('l.from')}>
                  <Input id="from" type="date" value={from} min={iso(today)} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                {listing.kind === 'rent' && (
                  <Field id="to" label={t('l.to')}>
                    <Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
                  </Field>
                )}
              </div>
            )}
            {listing.kind !== 'sell' && (
              <Field id="note" label={t('l.note')}>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            )}
            {listing.kind === 'sell' && (
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                {(['blik', 'cash'] as const).map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={pay === p} onClick={() => setPay(p)} className={cx('min-h-11 rounded-lg border px-2 text-[14px] font-semibold', pay === p ? 'border-ink bg-ink text-bg' : 'border-line')}>
                    {p === 'blik' ? t('l.payBlik') : t('l.payCash')}
                  </button>
                ))}
              </div>
            )}
            {listing.kind === 'sell' && pay === 'blik' && (
              <Field id="blik" label={t('l.blikCode')} hint={t('l.blikHint')}>
                <Input id="blik" inputMode="numeric" maxLength={6} value={blik} onChange={(e) => setBlik(e.target.value.replace(/\D/g, ''))} className="tnum text-center text-[20px] tracking-[0.3em]" placeholder="••• •••" />
              </Field>
            )}
            {total > 0 && (
              <div className="tnum flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-muted">{t('l.total')}</span>
                <span className="text-[20px] font-bold">{formatPLN(total)}</span>
              </div>
            )}
            <Button disabled={!canSubmit} onClick={submit}>{cta}</Button>
            {(listing.kind === 'sell' || listing.kind === 'rent') && <p className="text-[13px] text-muted">{t('l.noFee')}</p>}
          </section>
        )}
      </div>

      {share && <ShareSheet text={`${listing.title} · ${priceText(listing, t)}`} url={listingUrl(listing.id)} t={t} onClose={() => setShare(false)} />}
    </div>
  )
}
