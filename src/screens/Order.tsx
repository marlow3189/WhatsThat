import { useState } from 'react'
import { useParams } from 'react-router'
import { useStore } from '../data/store'
import { Button, Field, Group, Header, Input, ListingRow, Notice, Row, Segmented, cx, formatDay, money, stampedPhoto } from '../components/ui'
import { Icon } from '../components/icons'
import { countryName } from '../lib/countries'
import { RightsSheet } from './Listing'
import type { Key } from '../i18n'
import type { Kind, Order, OrderStatus, PayMethod } from '../lib/types'
import { ME } from '../data/seed'

type Step = Exclude<OrderStatus, 'cancelled'>

export function stepsFor(kind: Kind, pay: Order['pay']): Step[] {
  if (kind === 'sell') return pay === 'cash' ? ['requested', 'accepted', 'ready', 'done'] : ['paid', 'ready', 'done']
  if (kind === 'rent') return ['requested', 'accepted', 'paid', 'done']
  return ['requested', 'accepted', 'done']
}

export function OrderScreen() {
  const { id } = useParams()
  const { t, locale, account, orders, listings, users, payOrder, advanceOrder, addProtocolPhoto } = useStore()
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

      <div className="flex flex-col gap-3 px-4">
        {seller && order.status === 'paid' && <Notice tone="ok" icon="card">{t('o.sellerPaid', { name: other.name, amount })}</Notice>}
        {!seller && order.status === 'paid' && <Notice tone="ok" icon="check">{t('o.paidInfo')}</Notice>}
        {order.status === 'ready' && !seller && <Notice tone="ok" icon="bag">{t('n.ready', { title: listing.title })}</Notice>}
        {order.pay === 'cash' && listing.kind === 'sell' && order.status !== 'done' && <Notice tone="info" icon="info">{t('o.cashInfo')}</Notice>}
        {seller && order.delivery !== 'pickup' && order.status === 'paid' && <Notice tone="info" icon="truck">{t('o.labelInfo')}</Notice>}
        {order.status === 'cancelled' && <Notice tone="danger">{t('o.status.cancelled')}</Notice>}
      </div>

      <Group>
        <ListingRow listing={listing} t={t} locale={locale} meta={other.name} />
        {listing.kind === 'sell' && <Row title={t('l.qty')} value={`${String(order.qty).replace('.', ',')} ${t(`unit.${listing.unit}`)}`} />}
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
