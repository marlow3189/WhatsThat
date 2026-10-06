import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Header, Notice, Thumb, cx, readPhoto, relationText, timeAgo } from '../components/ui'
import { Icon } from '../components/icons'
import { formatPLN } from '../lib/money'
import { ME } from '../data/seed'

const LINK = /(https?:\/\/|www\.)\S+/i

export function Messages() {
  const { t, chats, users, listings, readAt } = useStore()
  const sorted = [...chats].filter((c) => c.messages.length).sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))
  return (
    <>
      <Header title={t('m.title')} />
      {sorted.length === 0 && <p className="px-4 py-6 text-muted">{t('m.empty')}</p>}
      <ul className="mx-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {sorted.map((c) => {
          const other = users[c.members.find((m) => m !== ME)!]
          const listing = listings.find((l) => l.id === c.listingId)
          const last = c.messages.at(-1)!
          const unread = last.from !== ME && last.at > (readAt[c.id] ?? 0)
          return (
            <li key={c.id}>
              <Link to={`/czat/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-sunken">
                <Avatar user={other} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cx('truncate', unread ? 'font-bold' : 'font-semibold')}>{other.name}</span>
                    <span className="tnum shrink-0 text-[12px] text-muted">{timeAgo(last.at, t)}</span>
                  </div>
                  <div className="truncate text-[13px] text-muted">{listing?.title}</div>
                  <div className={cx('truncate text-[14px]', !unread && 'text-muted')}>
                    {last.orderId ? t('o.title') : last.photo ? t('m.photo') : last.text}
                  </div>
                </div>
                {unread && <span className="size-2.5 shrink-0 rounded-full bg-accent" aria-hidden />}
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function ChatScreen() {
  const { id } = useParams()
  const { t, account, chats, users, listings, orders, sendMessage, relation, markRead } = useStore()
  const chat = chats.find((c) => c.id === id)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const count = chat?.messages.length
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
    if (id) markRead(id)
  }, [count, id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!chat) return <><Header title="" back /><p className="p-6 text-muted">{t('m.empty')}</p></>
  const other = users[chat.members.find((m) => m !== ME)!]
  const listing = listings.find((l) => l.id === chat.listingId)
  const hasLink = chat.messages.some((m) => m.from !== ME && m.text && LINK.test(m.text)) || LINK.test(text)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(chat.id, text.trim())
    setText('')
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        back
        title={
          <span className="flex items-center gap-2">
            <Avatar user={other} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-[16px] leading-tight">{other.name}</span>
              <span className="block truncate text-[12px] font-normal text-muted">{relationText(relation(other.id), other, users, t)}</span>
            </span>
          </span>
        }
      />
      {listing && (
        <Link to={`/l/${listing.id}`} className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2">
          <Thumb listing={listing} size={40} className="rounded-md" />
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{listing.title}</span>
          <Icon name="chevron" size={18} className="text-muted" />
        </Link>
      )}
      {other.restricted && <div className="px-3 pt-3"><Notice tone="danger">{t('l.restricted')}</Notice></div>}
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-4">
        {chat.messages.map((m) => {
          const mine = m.from === ME
          const order = m.orderId ? orders.find((o) => o.id === m.orderId) : undefined
          if (order) {
            return (
              <Link key={m.id} to={`/zamowienie/${order.id}`} className="my-2 flex items-center gap-3 self-center rounded-xl border border-line bg-surface px-4 py-3 text-[14px]" style={{ width: 'min(100%, 22rem)' }}>
                <Icon name="bag" className="text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t('m.order', { status: t(`o.status.${order.status}`) })}</span>
                  {order.total > 0 && <span className="tnum block text-muted">{formatPLN(order.total)}</span>}
                </span>
                <Icon name="chevron" size={18} className="text-muted" />
              </Link>
            )
          }
          return (
            <div key={m.id} className={cx('max-w-[80%] rounded-2xl px-3 py-2', mine ? 'self-end rounded-br-md bg-accent-soft' : 'self-start rounded-bl-md border border-line bg-surface')}>
              {m.photo && <img src={m.photo} alt={t('m.photo')} className="mb-1 max-h-60 rounded-xl" />}
              {m.text && <p className="break-words whitespace-pre-wrap">{m.text}</p>}
              <p className="tnum text-right text-[11px] text-muted">{new Date(m.at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {hasLink && <div className="px-3 pb-2"><Notice tone="danger">{t('m.linkWarn')}</Notice></div>}
      {account.restricted ? (
        <div className="px-3 pb-3"><Notice tone="danger">{t('r.banner')}</Notice></div>
      ) : (
        <form onSubmit={submit} className="sticky bottom-[calc(64px+env(safe-area-inset-bottom,0px))] flex items-end gap-2 border-t border-line bg-bg px-3 py-2">
          <label htmlFor="chat-photo" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted" aria-label={t('m.photo')}>
            <Icon name="camera" />
            <input id="chat-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) sendMessage(chat.id, '', await readPhoto(f, 700))
            }} />
          </label>
          <input id="chat-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('m.ph')} className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 outline-none focus:border-ink" />
          <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink" aria-label={t('m.send')}>
            <Icon name="send" size={20} />
          </button>
        </form>
      )}
    </div>
  )
}
