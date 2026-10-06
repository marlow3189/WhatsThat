import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, CircleButton, Field, Group, Header, Input, Notice, Row, ShareSheet, Sheet, Thumb, cx, formatDay, inputCls, listingUrl, money, priceText, relationText } from '../components/ui'
import { Icon } from '../components/icons'
import { categoryById, subById } from '../lib/categories'
import { COUNTABLE, isAvailable, orderTotal } from '../lib/pricing'
import { distanceKm, formatDistance } from '../lib/geo'
import { countryName } from '../lib/countries'
import type { Delivery, PayMethod, ReportReason } from '../lib/types'
import type { T } from '../i18n'
import { ME } from '../data/seed'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const PICKUPS = ['pick.today', 'pick.tomorrow', 'pick.saturday'] as const
const QUICK = ['quick.available', 'quick.when', 'quick.price', 'quick.ship'] as const
const REASONS: ReportReason[] = ['scam', 'illegal', 'fake', 'rights', 'offensive', 'other']

export function ListingScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const store = useStore()
  const { t, locale, account, listings, users, relation, openChat, sendMessage, placeOrder, mute, forget, report } = store
  const listing = listings.find((l) => l.id === id)
  const [sheet, setSheet] = useState<'share' | 'rights' | 'more' | 'report' | null>(null)
  const [qty, setQty] = useState(1)
  const [pickup, setPickup] = useState<string>(PICKUPS[0])
  const [delivery, setDelivery] = useState<Delivery>('pickup')
  const [locker, setLocker] = useState('')
  const [pay, setPay] = useState<PayMethod>('blik')
  const [blik, setBlik] = useState('')
  const today = new Date()
  const [from, setFrom] = useState(iso(new Date(today.getTime() + 86_400_000)))
  const [to, setTo] = useState(iso(new Date(today.getTime() + 3 * 86_400_000)))
  const [note, setNote] = useState('')
  const [flash, setFlash] = useState('')
  const [reason, setReason] = useState<ReportReason>('scam')
  const [reportNote, setReportNote] = useState('')

  if (!listing || listing.status === 'removed') {
    return (
      <>
        <Header back title="" />
        <p className="p-6 text-muted">{t('l.missing')}</p>
      </>
    )
  }

  const owner = users[listing.ownerId]
  const rel = relation(listing.ownerId)
  const mine = listing.ownerId === ME
  const lang = account.lang
  const anon = !!listing.incognito && !mine
  const category = categoryById(listing.category)
  const sub = subById(listing.category, listing.sub)
  const countable = listing.kind === 'sell' && COUNTABLE.includes(listing.unit)
  const step = listing.unit === 'kg' || listing.unit === 'litre' ? 0.5 : 1
  const shipping = delivery !== 'pickup' ? listing.shippingPrice ?? 0 : 0
  const total = listing.price !== undefined ? orderTotal({ price: listing.price, unit: listing.unit, kind: listing.kind, qty, from, to, shipping }) : 0
  const available = isAvailable(listing)
  const blocked = account.restricted || owner.restricted
  const sellerReady = !!owner.payouts
  const isMuted = account.muted.includes(owner.id)
  const tags = [t(`kind.${listing.kind}`), listing.condition && t(`cond.${listing.condition}`), listing.deal && t('deal'), sub?.label[lang]].filter(Boolean).join(' · ')
  const payable = (listing.kind === 'sell' || listing.kind === 'rent') && total > 0
  const effectivePay: PayMethod = sellerReady ? pay : 'cash'

  const quick = (key: (typeof QUICK)[number]) => {
    const chatId = openChat(listing)
    sendMessage(chatId, t(key))
    nav(`/czat/${chatId}`)
  }

  const submit = () => {
    const orderId = placeOrder({
      listing, qty, total, pay: listing.kind === 'sell' ? effectivePay : 'cash', delivery, lockerCode: locker || undefined,
      from: listing.kind === 'rent' || listing.kind === 'service' ? from : undefined,
      to: listing.kind === 'rent' ? to : undefined,
      pickup: listing.kind === 'sell' && delivery === 'pickup' ? pickup : undefined,
      note: note.trim() || undefined,
    })
    if (orderId) nav(`/zamowienie/${orderId}`)
    else setFlash(t('l.unavailable'))
  }

  const cta =
    listing.kind === 'sell'
      ? effectivePay === 'cash' ? t('l.requestCash') : t('l.pay', { amount: money(total, listing.currency, locale) })
      : listing.kind === 'rent' ? t('l.request')
      : listing.kind === 'service' ? t('l.requestService')
      : listing.kind === 'give' ? t('l.requestFree')
      : listing.kind === 'wanted' ? t('l.haveIt')
      : t('l.propose')
  const canSubmit = available && (listing.kind !== 'sell' || effectivePay !== 'blik' || blik.length === 6) && (delivery === 'pickup' || delivery === 'courier' || locker.length >= 3 || delivery === 'other')

  return (
    <div className="pb-8">
      <div className="relative">
        <Thumb listing={listing} className="aspect-[4/3] max-h-[52vh] w-full" iconSize={84} />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <CircleButton icon="back" label={t('back')} onClick={() => nav(-1)} />
          <div className="flex gap-2">
            <CircleButton icon="share" label={t('l.share')} onClick={() => setSheet('share')} />
            {!mine && <CircleButton icon="more" label="…" onClick={() => setSheet('more')} />}
          </div>
        </div>
        {!available && <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-[14px] font-semibold text-primary-ink">{t(listing.status === 'sold' ? 'status.sold' : listing.paused ? 'status.paused' : 'status.reserved')}</span>}
      </div>

      <div className="flex flex-col gap-1 px-5 pt-5">
        <p className="text-[14px] text-muted">{category.label[lang]} · {tags}</p>
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{listing.title}</h1>
        <p className="tnum text-[24px] font-semibold">{priceText(listing, t, locale)}</p>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        {owner.restricted && <div className="px-4"><Notice tone="danger" icon="lock">{t('l.restricted')}</Notice></div>}
        {flash && <div className="px-4"><Notice tone="danger">{flash}</Notice></div>}

        <div className="card mx-4 flex items-center gap-3 p-3.5">
          <Avatar user={owner} size={48} anonymous={anon} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{mine ? account.name : anon ? t('rel.incognito') : owner.name}</p>
            <p className="flex items-center gap-1 text-[14px] text-muted">
              {!owner.restricted && <Icon name="shield" size={14} className="text-ok" />}
              <span className="truncate">{mine ? t('me.verified') : relationText(rel, owner, users, t, anon)}</span>
            </p>
          </div>
          {!mine && !blocked && <Button size="sm" variant="secondary" onClick={() => nav(`/czat/${openChat(listing)}`)}>{t('l.write')}</Button>}
        </div>

        {!mine && !blocked && (
          <div className="flex flex-col gap-2">
            <p className="px-5 text-[13px] font-medium tracking-wide text-muted uppercase">{t('l.quick')}</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
              {QUICK.map((k) => (
                <button key={k} type="button" onClick={() => quick(k)} className="press min-h-9 shrink-0 rounded-full bg-surface px-3.5 text-[15px] whitespace-nowrap text-link shadow-[var(--shadow)]">{t(k)}</button>
              ))}
            </div>
          </div>
        )}

        <Group>
          <Row icon="pin" title={listing.place.town} detail={mine ? undefined : t('l.distance', { d: formatDistance(distanceKm(account.place, listing.place)) })} />
          {listing.garageDate && <Row icon="calendar" title={formatDay(listing.garageDate, locale)} detail={listing.pickupHours} />}
          {listing.pickupHours && !listing.garageDate && <Row icon="calendar" title={t('l.pickup')} detail={listing.pickupHours} />}
          {listing.stock !== undefined && <Row icon="bag" title={t('l.stock', { n: String(listing.stock).replace('.', ','), unit: t(`unit.${listing.unit}`) })} />}
          {listing.delivery.length > 1 && <Row icon="truck" title={t('l.delivery')} detail={listing.delivery.filter((d) => d !== 'pickup').map((d) => t(`del.${d}`)).join(', ')} />}
          {listing.deposit ? <Row icon="lock" title={t('l.deposit', { amount: money(listing.deposit, listing.currency, locale) })} /> : null}
          {listing.swapFor && <Row icon="list" title={t('l.swapFor', { what: listing.swapFor })} />}
        </Group>

        {listing.description && <p className="px-5 leading-relaxed">{listing.description}</p>}

        {mine ? (
          <div className="px-4"><Notice tone="ok">{t('l.yours')}</Notice></div>
        ) : blocked || listing.kind === 'garage' ? null : (
          <section className="card mx-4 flex flex-col gap-4 p-4">
            {countable && (
              <Field id="qty" label={t('l.qty')}>
                <div className="flex items-center justify-between rounded-[14px] bg-fill p-1.5">
                  <button type="button" className="press grid size-10 place-items-center rounded-[10px] bg-surface" onClick={() => setQty((q) => Math.max(step, +(q - step).toFixed(1)))} aria-label="−"><Icon name="minus" /></button>
                  <span id="qty" className="tnum text-[18px] font-semibold">{String(qty).replace('.', ',')} {t(`unit.${listing.unit}`)}</span>
                  <button type="button" className="press grid size-10 place-items-center rounded-[10px] bg-surface" onClick={() => setQty((q) => Math.min(listing.stock ?? 999, +(q + step).toFixed(1)))} aria-label="+"><Icon name="plus" /></button>
                </div>
              </Field>
            )}
            {listing.kind === 'sell' && listing.delivery.length > 1 && (
              <Field id="delivery" label={t('l.delivery')}>
                <select id="delivery" value={delivery} onChange={(e) => setDelivery(e.target.value as Delivery)} className={cx(inputCls, 'bg-fill shadow-none')}>
                  {listing.delivery.map((d) => <option key={d} value={d}>{t(`del.${d}`)}{d !== 'pickup' && listing.shippingPrice ? ` · ${money(listing.shippingPrice, listing.currency, locale)}` : ''}</option>)}
                </select>
              </Field>
            )}
            {['inpost', 'orlen', 'dpd', 'dhl', 'poczta'].includes(delivery) && (
              <Field id="locker" label={t('l.locker')}>
                <Input id="locker" value={locker} onChange={(e) => setLocker(e.target.value.toUpperCase())} placeholder="WAW123M" className="bg-fill shadow-none" />
              </Field>
            )}
            {listing.kind === 'sell' && delivery === 'pickup' && (
              <Field id="pickup" label={t('l.when')}>
                <select id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className={cx(inputCls, 'bg-fill shadow-none')}>
                  {PICKUPS.map((p) => <option key={p} value={p}>{t(p)}</option>)}
                </select>
              </Field>
            )}
            {(listing.kind === 'rent' || listing.kind === 'service') && (
              <div className={cx('grid gap-3', listing.kind === 'rent' && 'grid-cols-2')}>
                <Field id="from" label={t('l.from')}><Input id="from" type="date" value={from} min={iso(today)} onChange={(e) => setFrom(e.target.value)} className="bg-fill shadow-none" /></Field>
                {listing.kind === 'rent' && <Field id="to" label={t('l.to')}><Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="bg-fill shadow-none" /></Field>}
              </div>
            )}
            {listing.kind !== 'sell' && (
              <Field id="note" label={t('l.note')}><Input id="note" value={note} onChange={(e) => setNote(e.target.value)} className="bg-fill shadow-none" /></Field>
            )}
            {listing.kind === 'sell' && (
              sellerReady ? (
                <Field id="pay" label={t('l.payMethod')}>
                  <div role="radiogroup" id="pay" className="overflow-hidden rounded-[14px] bg-fill [&>*+*]:border-t [&>*+*]:border-line">
                    {(delivery === 'pickup' ? (['blik', 'transfer', 'cash'] as PayMethod[]) : (['blik', 'transfer'] as PayMethod[])).map((p) => (
                      <button key={p} type="button" role="radio" aria-checked={pay === p} onClick={() => setPay(p)} className="flex min-h-12 w-full items-center justify-between px-4 text-left">
                        {t(`pay.${p}`)}
                        <span className={cx('grid size-6 place-items-center rounded-full border-2', pay === p ? 'border-link bg-link text-white' : 'border-fill-strong')}>
                          {pay === p && <Icon name="check" size={14} strokeWidth={3} />}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              ) : (
                <Notice tone="info" icon="info">{t('l.sellerNotReady')}</Notice>
              )
            )}
            {listing.kind === 'sell' && effectivePay === 'blik' && (
              <Field id="blik" label={t('l.blikCode')} hint={t('l.blikHint')}>
                <Input id="blik" inputMode="numeric" maxLength={6} value={blik} onChange={(e) => setBlik(e.target.value.replace(/\D/g, ''))} className="tnum bg-fill text-center text-[22px] tracking-[0.35em] shadow-none" placeholder="••• •••" />
              </Field>
            )}
            {listing.kind === 'sell' && effectivePay === 'transfer' && <p className="text-[14px] text-muted">{t('l.transferHint')}</p>}
            {payable && (
              <div className="tnum flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-muted">{t('l.total')}{shipping ? ` (${t('l.shipping', { amount: money(shipping, listing.currency, locale) })})` : ''}</span>
                <span className="text-[22px] font-bold">{money(total, listing.currency, locale)}</span>
              </div>
            )}
            <Button disabled={!canSubmit} onClick={submit}>{cta}</Button>
            {listing.kind === 'sell' && (
              <button type="button" onClick={() => setSheet('rights')} className="flex items-center gap-2 text-left text-[14px] text-link">
                <Icon name="info" size={18} /> {t('rights.button')}
              </button>
            )}
            {payable && <p className="text-[13px] leading-snug text-muted">{t('l.noFee')} {listing.kind === 'sell' && effectivePay !== 'cash' ? t('l.payFirst') : ''}</p>}
          </section>
        )}
      </div>

      {sheet === 'share' && <ShareSheet text={`${listing.title} · ${priceText(listing, t, locale)}`} url={listingUrl(listing.id)} t={t} onClose={() => setSheet(null)} />}
      {sheet === 'rights' && <RightsSheet t={t} business={!!owner.business} country={countryName(account.country, locale)} onClose={() => setSheet(null)} />}
      {sheet === 'more' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
            <Row icon="flag" title={t('l.report')} onClick={() => setSheet('report')} />
            <Row icon="eyeoff" title={isMuted ? t('l.unmute') : t('l.mute')} onClick={() => { mute(owner.id, !isMuted); setFlash(isMuted ? '' : t('l.muted')); setSheet(null) }} />
            {rel.circle === 1 && <Row icon="users" title={t('l.forget')} danger onClick={() => { forget(owner.id); setFlash(t('l.forgotten')); setSheet(null) }} />}
          </div>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setSheet(null)}>{t('cancel')}</Button>
        </Sheet>
      )}
      {sheet === 'report' && (
        <Sheet title={t('report.title')} onClose={() => setSheet(null)}>
          <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className="flex min-h-[52px] w-full items-center justify-between px-4 text-left">
                {t(`report.${r}`)}
                {reason === r && <Icon name="check" className="text-link" strokeWidth={2.4} />}
              </button>
            ))}
          </div>
          <div className="mt-3"><Field id="report-note" label={t('report.note')}><Input id="report-note" value={reportNote} onChange={(e) => setReportNote(e.target.value)} /></Field></div>
          <Button className="mt-4 w-full" onClick={() => { const rid = report(listing.id, reason, reportNote.trim() || undefined); setFlash(t('report.sent', { id: rid })); setSheet(null) }}>{t('report.send')}</Button>
        </Sheet>
      )}
    </div>
  )
}

export function RightsSheet({ t, business, country, onClose }: { t: T; business: boolean; country: string; onClose: () => void }) {
  return (
    <Sheet title={t('rights.title')} onClose={onClose}>
      <div className="card flex flex-col gap-3 p-4 text-[15px] leading-snug">
        <p>{t(business ? 'rights.business1' : 'rights.private1')}</p>
        <p>{t(business ? 'rights.business2' : 'rights.private2')}</p>
        <p>{t('rights.both')}</p>
        <p className="text-muted">{t('rights.country', { country })}</p>
      </div>
      <Button variant="secondary" className="mt-3 w-full" onClick={onClose}>{t('close')}</Button>
    </Sheet>
  )
}
