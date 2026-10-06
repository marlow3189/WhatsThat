import { useState } from 'react'
import { useParams } from 'react-router'
import { useStore } from '../data/store'
import { Button, Field, Group, Header, Input, ListingRow, Notice, Row, Segmented, Sheet, cx, formatDay, inputCls, money, stampedPhoto } from '../components/ui'
import { Icon } from '../components/icons'
import { countryName } from '../lib/countries'
import { RightsSheet } from './Listing'
import type { Key, T } from '../i18n'
import type { DisputeReason, Kind, Order, OrderStatus, PayMethod } from '../lib/types'
import { AUTO_RELEASE_H, COUNTABLE } from '../lib/pricing'
import { ME } from '../data/seed'

type Step = Exclude<OrderStatus, 'cancelled'>

export function stepsFor(kind: Kind, pay: Order['pay']): Step[] {
  if (kind === 'sell') return pay === 'cash' ? ['requested', 'accepted', 'ready', 'done'] : ['paid', 'ready', 'done']
  if (kind === 'rent') return ['requested', 'accepted', 'paid', 'done']
  return ['requested', 'accepted', 'done']
}

export function OrderScreen() {
  const { id } = useParams()
  const { t, locale, account, orders, listings, users, payOrder, advanceOrder, addProtocolPhoto, openDispute, settleDispute } = useStore()
  const [problem, setProblem] = useState(false)
  const [code, setCode] = useState('')
  const [blik, setBlik] = useState('')
  const [pay, setPay] = useState<PayMethod>('blik')
  const [rights, setRights] = useState(false)
  const order = orders.find((o) => o.id === id)
  const listing = order && listings.find((l) => l.id === order.listingId)
  if (!order || !listing) return <><Header back title={t('o.title')} /><p className="p-6 text-muted">{t('o.none')}</p></>

  const seller = order.sellerId === ME
  const other = users[seller ? order.buyerId : order.sellerId]
  const steps = stepsFor(listing.kind, order.pay)
  const current = order.status === 'cancelled' ? -1 : steps.indexOf(order.status)
  const when = order.pickup?.startsWith('pick.') ? t(order.pickup as Key) : order.pickup
  const amount = money(order.total, order.currency, locale)

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Header back title={t('o.title')} />

      <ol className="card mx-4 flex items-start px-2 py-4" aria-label={t(`o.status.${order.status}`)}>
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={cx('h-[3px] flex-1 rounded-full', i === 0 ? 'opacity-0' : i <= current ? 'bg-ok' : 'bg-fill-strong')} />
              <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', i <= current ? 'bg-ok text-white' : 'bg-fill-strong text-muted')}>
                {i <= current ? <Icon name="check" size={16} strokeWidth={3} /> : <span className="tnum text-[13px] font-semibold">{i + 1}</span>}
              </span>
              <span className={cx('h-[3px] flex-1 rounded-full', i === steps.length - 1 ? 'opacity-0' : i < current ? 'bg-ok' : 'bg-fill-strong')} />
            </div>
            <span className={cx('text-[12px]', i === current ? 'font-semibold' : 'text-muted')}>{t(`o.step.${s}`)}</span>
          </li>
        ))}
      </ol>

      <SafePay order={order} seller={seller} amount={amount} deposit={order.deposit ? money(order.deposit, order.currency, locale) : undefined} code={code} setCode={setCode} onRelease={() => advanceOrder(order.id, 'done')} t={t} />

      {order.dispute && <DisputeCard order={order} mine={order.dispute.by === ME} amount={(v) => money(v, order.currency, locale)} onSettle={(ok) => settleDispute(order.id, ok)} t={t} />}

      <div className="flex flex-col gap-3 px-4">
        {seller && order.status === 'paid' && <Notice tone="ok" icon="card">{t('o.sellerPaid', { name: other.name, amount })}</Notice>}
        {!seller && order.status === 'paid' && <Notice tone="ok" icon="check">{t('o.paidInfo')}</Notice>}
        {order.status === 'ready' && !seller && !order.dispute && <Notice tone="ok" icon="bag">{t('n.ready', { title: listing.title })}</Notice>}
        {order.pay === 'cash' && listing.kind === 'sell' && order.status !== 'done' && <Notice tone="info" icon="info">{t('o.cashInfo')}</Notice>}
        {seller && order.delivery !== 'pickup' && order.status === 'paid' && <Notice tone="info" icon="truck">{t('o.labelInfo')}</Notice>}
        {order.status === 'cancelled' && <Notice tone="danger">{t('o.status.cancelled')}</Notice>}
      </div>

      <Group>
        <ListingRow listing={listing} t={t} locale={locale} meta={other.name} />
        {listing.kind === 'sell' && COUNTABLE.includes(listing.unit) && <Row title={t('l.qty')} value={`${String(order.qty).replace('.', ',')} ${t(`unit.${listing.unit}`)}`} />}
        <Row title={t('l.delivery')} value={t(`del.${order.delivery}`)} detail={order.lockerCode} />
        {when && <Row title={t('l.pickup')} value={when} />}
        {order.from && <Row title={t('l.from')} value={formatDay(order.from, locale)} />}
        {order.to && <Row title={t('l.to')} value={formatDay(order.to, locale)} />}
        {order.total > 0 && <Row title={t('l.total')} value={<span className="tnum font-semibold text-ink">{amount}</span>} detail={t(`pay.${order.pay}`)} />}
        <Row to={`/czat/${order.chatId}`} icon="chat" title={t('o.chat')} />
        {listing.kind === 'sell' && <Row icon="info" title={t('rights.button')} onClick={() => setRights(true)} />}
      </Group>

      <div className="flex flex-col gap-3 px-4">
        {seller && order.status === 'requested' && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => advanceOrder(order.id, 'cancelled')}>{t('o.decline')}</Button>
            <Button onClick={() => advanceOrder(order.id, 'accepted')}>{t('o.accept')}</Button>
          </div>
        )}
        {seller && (order.status === 'paid' || (order.status === 'accepted' && listing.kind === 'sell')) && (
          <Button onClick={() => advanceOrder(order.id, 'ready')}>{t('o.markReady')}</Button>
        )}
        {!seller && listing.kind === 'rent' && order.status === 'accepted' && (
          <>
            <Segmented<PayMethod> label={t('l.payMethod')} value={pay} onChange={setPay} options={(['blik', 'transfer'] as PayMethod[]).map((p) => ({ value: p, label: t(`pay.${p}`) }))} />
            {pay === 'blik' ? (
              <Field id="blik" label={t('l.blikCode')} hint={t('l.blikHint')}>
                <Input id="blik" inputMode="numeric" maxLength={6} value={blik} onChange={(e) => setBlik(e.target.value.replace(/\D/g, ''))} className="tnum text-center text-[22px] tracking-[0.35em]" />
              </Field>
            ) : (
              <p className="text-[14px] text-muted">{t('l.transferHint')}</p>
            )}
            <Button disabled={pay === 'blik' && blik.length !== 6} onClick={() => payOrder(order.id, pay)}>{t('l.pay', { amount })}</Button>
            <p className="text-[13px] text-muted">{t('l.noFee')}</p>
          </>
        )}
        {!seller && (order.status === 'ready' || (order.status === 'accepted' && !['rent', 'sell'].includes(listing.kind)) || (order.status === 'paid' && listing.kind === 'rent' && order.photosAfter.length > 0)) && (
          <Button onClick={() => advanceOrder(order.id, 'done')}>{t('o.markDone')}</Button>
        )}
      </div>

      {listing.kind === 'rent' && ['accepted', 'paid', 'done'].includes(order.status) && (
        <section className="flex flex-col gap-4 px-4">
          <div className="px-1">
            <h2 className="text-[20px] font-bold">{t('o.protocol')}</h2>
            <p className="text-[15px] text-muted">{t('o.protocolHint')}</p>
          </div>
          <Photos label={t('o.before')} id="before" photos={order.photosBefore} add={t('o.addPhoto')} onAdd={async (f) => addProtocolPhoto(order.id, 'before', await stampedPhoto(f))} />
          <Photos label={t('o.after')} id="after" photos={order.photosAfter} add={t('o.addPhoto')} disabled={order.photosBefore.length === 0} onAdd={async (f) => addProtocolPhoto(order.id, 'after', await stampedPhoto(f))} />
        </section>
      )}
      {!order.dispute && order.status !== 'cancelled' && order.status !== 'requested' && (
        <button type="button" onClick={() => setProblem(true)} className="press mx-4 flex min-h-12 items-center justify-center gap-2 rounded-full border border-danger/25 bg-surface text-[15px] font-bold text-danger">
          <Icon name="flag" size={18} /> {t('d.report')}
        </button>
      )}
      {problem && <ProblemSheet kind={listing.kind} seller={seller} t={t} onClose={() => setProblem(false)} onSend={(r, note) => { openDispute(order.id, r, note); setProblem(false) }} />}
      {rights && <RightsSheet t={t} business={!!users[order.sellerId].business} country={countryName(account.country, locale)} onClose={() => setRights(false)} />}
    </div>
  )
}

function Photos({ label, id, photos, add, onAdd, disabled }: { label: string; id: string; photos: string[]; add: string; onAdd: (f: File) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[15px] font-bold">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => <img key={i} src={p} alt={`${label} ${i + 1}`} className="aspect-square w-full rounded-[16px] object-cover" />)}
        <label htmlFor={`photo-${id}`} className={cx('card grid aspect-square place-items-center text-center text-[13px] text-link', disabled ? 'opacity-40' : 'press cursor-pointer')}>
          <span className="flex flex-col items-center gap-1"><Icon name="camera" />{add}</span>
          <input id={`photo-${id}`} type="file" accept="image/*" capture="environment" className="sr-only" disabled={disabled} onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onAdd(f)
            e.target.value = ''
          }} />
        </label>
      </div>
    </div>
  )
}

/**
 * Bezpieczna płatność: pieniądze nie trafiają ani do nas, ani od razu do sprzedającego. Czekają u licencjonowanego
 * operatora płatności do odbioru. Kupujący podaje 4-cyfrowy kod dopiero przy odbiorze; bez zgłoszenia problemu
 * wypłata idzie automatycznie po 48 h od wydania. Kaucja przy wynajmie to blokada na karcie, nie przelew.
 */
function SafePay({ order, seller, amount, deposit, code, setCode, onRelease, t }: { order: Order; seller: boolean; amount: string; deposit?: string; code: string; setCode: (v: string) => void; onRelease: () => void; t: T }) {
  if (order.pay === 'cash' && !order.deposit) return null
  const paid = !!order.paidAt
  const state = order.refundedAt ? 'refunded' : order.releasedAt ? 'released' : order.dispute && order.dispute.status !== 'resolved' ? 'frozen' : paid ? 'held' : 'waiting'
  const canHand = paid && !order.releasedAt && !order.refundedAt && !order.dispute && (order.status === 'ready' || order.status === 'paid')
  return (
    <section className="mx-4 flex flex-col gap-3 rounded-[24px] bg-sky p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white"><Icon name="shield" size={20} /></span>
        <div className="min-w-0">
          <p className="text-[16px] font-extrabold">{t('sp.title')}</p>
          <p className="text-[14px] leading-snug text-ink/75">{t(`sp.${state}`, { amount, h: AUTO_RELEASE_H })}</p>
        </div>
      </div>
      {canHand && !seller && order.handoverCode && (
        <div className="flex items-center justify-between gap-3 rounded-[18px] bg-surface p-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold">{t('sp.code')}</p>
            <p className="text-[12px] leading-snug text-muted">{t('sp.codeHint')}</p>
          </div>
          <span className="tnum shrink-0 rounded-[12px] bg-ink px-3 py-2 text-[24px] font-extrabold tracking-[0.2em] text-white">{order.handoverCode}</span>
        </div>
      )}
      {canHand && seller && (
        <div className="flex flex-col gap-2 rounded-[18px] bg-surface p-3">
          <label htmlFor="hcode" className="text-[13px] font-bold">{t('sp.enter')}</label>
          <div className="flex gap-2">
            <input id="hcode" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={cx(inputCls, 'tnum flex-1 text-center text-[20px] tracking-[0.3em]')} />
            <Button size="sm" className="min-h-[50px]" disabled={code !== order.handoverCode} onClick={onRelease}>{t('sp.confirm')}</Button>
          </div>
          {code.length === 4 && code !== order.handoverCode && <p className="text-[13px] text-danger">{t('sp.wrong')}</p>}
        </div>
      )}
      {deposit && (
        <p className="flex items-start gap-2 rounded-[16px] bg-surface/70 px-3 py-2 text-[13px] leading-snug">
          <Icon name="lock" size={16} className="mt-px shrink-0" />
          <span>{t(`sp.deposit.${order.depositStatus ?? 'planned'}`, { amount: deposit })}</span>
        </p>
      )}
    </section>
  )
}

const REASONS: Record<'buyer' | 'seller', Record<'sell' | 'rent' | 'other', DisputeReason[]>> = {
  buyer: { sell: ['not_received', 'not_as_described', 'no_show'], rent: ['not_received', 'not_as_described', 'deposit', 'no_show'], other: ['no_show', 'not_as_described'] },
  seller: { sell: ['no_show'], rent: ['not_returned', 'damaged', 'no_show'], other: ['no_show'] },
}

function ProblemSheet({ kind, seller, t, onClose, onSend }: { kind: Kind; seller: boolean; t: T; onClose: () => void; onSend: (r: DisputeReason, note: string) => void }) {
  const list = REASONS[seller ? 'seller' : 'buyer'][kind === 'sell' || kind === 'rent' ? kind : 'other']
  const [reason, setReason] = useState<DisputeReason>(list[0])
  const [note, setNote] = useState('')
  return (
    <Sheet title={t('d.report')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="px-1 text-[14px] leading-snug text-muted">{t('d.how')}</p>
        <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
          {list.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r} className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left active:bg-fill">
              <span className="flex-1">{t(`d.r.${r}`)}</span>
              <span className={cx('grid size-6 place-items-center rounded-full border-2', reason === r ? 'border-primary bg-primary text-white' : 'border-fill-strong')}>
                {reason === r && <Icon name="check" size={14} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('d.notePh')} aria-label={t('d.notePh')} className={cx(inputCls, 'py-3')} />
        <Button variant="danger" onClick={() => onSend(reason, note.trim())}>{t('d.send')}</Button>
      </div>
    </Sheet>
  )
}

function DisputeCard({ order, mine, amount, onSettle, t }: { order: Order; mine: boolean; amount: (v: number) => string; onSettle: (accept: boolean) => void; t: T }) {
  const d = order.dispute!
  return (
    <section className={cx('mx-4 flex flex-col gap-3 rounded-[24px] p-4', d.status === 'resolved' ? 'bg-mint' : 'bg-danger-soft')}>
      <div className="flex items-start gap-3">
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-full bg-surface', d.status === 'resolved' ? 'text-ok' : 'text-danger')}><Icon name={d.status === 'resolved' ? 'check' : 'flag'} size={20} /></span>
        <div className="min-w-0">
          <p className="text-[16px] font-extrabold">{t(`d.s.${d.status}`)}</p>
          <p className="text-[14px] leading-snug text-ink/75">{t(`d.r.${d.reason}`)}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
      </div>
      {d.status === 'open' && <p className="text-[14px] leading-snug">{t('d.openText')}</p>}
      {d.status === 'proposed' && (
        <>
          <p className="rounded-[16px] bg-surface p-3 text-[15px] leading-snug font-semibold">{t(`d.p.${d.proposal ?? 'refund'}`, { amount: amount(d.amount ?? order.total) })}</p>
          {mine && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" className="min-h-11" onClick={() => onSettle(false)}>{t('d.mediate')}</Button>
              <Button size="sm" className="min-h-11" onClick={() => onSettle(true)}>{t('d.accept')}</Button>
            </div>
          )}
        </>
      )}
      {d.status === 'mediation' && <p className="text-[14px] leading-snug">{t('d.mediationText')}</p>}
      {d.status === 'resolved' && <p className="text-[14px] leading-snug">{t(`d.o.${d.outcome ?? 'refund'}`, { amount: amount(d.amount ?? order.total) })}</p>}
    </section>
  )
}
