import { useState } from 'react'
import { useParams } from 'react-router'
import { useStore } from '../data/store'
import { Button, Field, Group, Header, Input, ListingRow, Notice, Row, cx, formatDay, stampedPhoto } from '../components/ui'
import { Icon } from '../components/icons'
import { formatPLN } from '../lib/money'
import { localeOf, type Key } from '../i18n'
import type { Kind, Order, OrderStatus } from '../lib/types'
import { ME } from '../data/seed'

export function stepsFor(kind: Kind, pay: Order['pay']): Exclude<OrderStatus, 'cancelled'>[] {
  if (kind === 'sell') return pay === 'blik' ? ['paid', 'ready', 'done'] : ['accepted', 'ready', 'done']
  if (kind === 'rent') return ['requested', 'accepted', 'paid', 'done']
  return ['requested', 'accepted', 'done']
}

export function OrderScreen() {
  const { id } = useParams()
  const { t, account, orders, listings, users, payOrder, advanceOrder, addProtocolPhoto } = useStore()
  const [blik, setBlik] = useState('')
  const order = orders.find((o) => o.id === id)
  const listing = order && listings.find((l) => l.id === order.listingId)
  if (!order || !listing) return <><Header title={t('o.title')} back /><p className="p-6 text-muted">{t('o.none')}</p></>

  const seller = order.sellerId === ME
  const other = users[seller ? order.buyerId : order.sellerId]
  const steps = stepsFor(listing.kind, order.pay)
  const current = order.status === 'cancelled' ? -1 : steps.indexOf(order.status)
  const locale = localeOf(account.lang)
  const when = order.pickup?.startsWith('pick.') ? t(order.pickup as Key) : order.pickup

  return (
    <div className="flex flex-col gap-6 pb-6">
      <Header title={t('o.title')} back />

      <ol className="flex items-start px-4" aria-label={t(`o.status.${order.status}`)}>
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={cx('h-0.5 flex-1', i === 0 ? 'opacity-0' : i <= current ? 'bg-ok' : 'bg-line')} />
              <span className={cx('grid size-7 shrink-0 place-items-center rounded-full border-2', i <= current ? 'border-ok bg-ok text-white' : 'border-line bg-surface')}>
                {i <= current && <Icon name="check" size={16} strokeWidth={2.5} />}
              </span>
              <span className={cx('h-0.5 flex-1', i === steps.length - 1 ? 'opacity-0' : i < current ? 'bg-ok' : 'bg-line')} />
            </div>
            <span className={cx('text-[12px]', i === current ? 'font-semibold' : 'text-muted')}>{t(`o.step.${s}`)}</span>
          </li>
        ))}
      </ol>

      <div className="px-4">
        {seller && order.status === 'paid' && <Notice tone="ok">{t('o.sellerPaid', { name: other.name, amount: formatPLN(order.total) })}</Notice>}
        {!seller && order.status === 'paid' && <Notice tone="ok">{t('o.paidInfo')}</Notice>}
        {order.status === 'ready' && !seller && <Notice tone="ok">{t('n.ready', { title: listing.title })}</Notice>}
        {order.pay === 'cash' && listing.kind === 'sell' && order.status === 'accepted' && <Notice>{t('o.cashInfo')}</Notice>}
        {order.status === 'cancelled' && <Notice tone="danger">{t('o.status.cancelled')}</Notice>}
      </div>

      <Group>
        <ListingRow listing={listing} t={t} meta={other.name} />
        {order.qty > 0 && listing.kind === 'sell' && <Row title={t('l.qty')} value={`${String(order.qty).replace('.', ',')} ${t(`unit.${listing.unit}`)}`} />}
        {when && <Row title={t('l.pickup')} value={when} />}
        {order.from && <Row title={t('l.from')} value={formatDay(order.from, locale)} />}
        {order.to && <Row title={t('l.to')} value={formatDay(order.to, locale)} />}
        {order.total > 0 && <Row title={t('l.total')} value={<span className="tnum font-semibold text-ink">{formatPLN(order.total)}</span>} />}
        <Row to={`/czat/${order.chatId}`} icon="chat" title={t('o.chat')} />
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
            <Field id="blik" label={t('l.blikCode')} hint={t('l.blikHint')}>
              <Input id="blik" inputMode="numeric" maxLength={6} value={blik} onChange={(e) => setBlik(e.target.value.replace(/\D/g, ''))} className="tnum text-center text-[20px] tracking-[0.3em]" />
            </Field>
            <Button disabled={blik.length !== 6} onClick={() => payOrder(order.id)}>{t('l.pay', { amount: formatPLN(order.total) })}</Button>
            <p className="text-[13px] text-muted">{t('l.noFee')}</p>
          </>
        )}
        {!seller && (order.status === 'ready' || (order.status === 'accepted' && listing.kind !== 'rent' && listing.kind !== 'sell') || (order.status === 'paid' && listing.kind === 'rent' && order.photosAfter.length > 0)) && (
          <Button onClick={() => advanceOrder(order.id, 'done')}>{t('o.markDone')}</Button>
        )}
      </div>

      {listing.kind === 'rent' && ['accepted', 'paid', 'done'].includes(order.status) && (
        <section className="flex flex-col gap-4 px-4">
          <div>
            <h2 className="font-semibold">{t('o.protocol')}</h2>
            <p className="text-[14px] text-muted">{t('o.protocolHint')}</p>
          </div>
          <Photos label={t('o.before')} id="before" photos={order.photosBefore} add={t('o.addPhoto')} onAdd={async (f) => addProtocolPhoto(order.id, 'before', await stampedPhoto(f))} />
          <Photos label={t('o.after')} id="after" photos={order.photosAfter} add={t('o.addPhoto')} disabled={order.photosBefore.length === 0} onAdd={async (f) => addProtocolPhoto(order.id, 'after', await stampedPhoto(f))} />
        </section>
      )}
    </div>
  )
}

function Photos({ label, id, photos, add, onAdd, disabled }: { label: string; id: string; photos: string[]; add: string; onAdd: (f: File) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => <img key={i} src={p} alt={`${label} ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />)}
        <label htmlFor={`photo-${id}`} className={cx('grid aspect-square place-items-center rounded-lg border border-dashed border-line text-center text-[13px] text-muted', disabled ? 'opacity-40' : 'cursor-pointer')}>
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
