import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Header, Notice, Thumb, cx, money, readPhoto, relationText, timeAgo } from '../components/ui'
import { Icon } from '../components/icons'
import { ME } from '../data/seed'

const LINK = /(https?:\/\/|www\.)\S+/i

export function Messages() {
  const { t, chats, users, listings, readAt } = useStore()
  const sorted = [...chats].filter((c) => c.messages.length).sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))
  return (
    <div className="pb-6">
      <Header large title={t('m.title')} />
      {sorted.length === 0 && <p className="px-5 text-muted">{t('m.empty')}</p>}
      <ul className="card mx-4 overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
        {sorted.map((c) => {
          const other = users[c.members.find((m) => m !== ME)!]
          const listing = listings.find((l) => l.id === c.listingId)
          const last = c.messages.at(-1)!
          const unread = last.from !== ME && last.at > (readAt[c.id] ?? 0)
          return (
            <li key={c.id}>
              <Link to={`/czat/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-fill">
                <Avatar user={other} size={50} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{other.name}</span>
                    <span className={cx('tnum shrink-0 text-[13px]', unread ? 'font-semibold text-link' : 'text-muted')}>{timeAgo(last.at, t)}</span>
                  </div>
                  <div className="truncate text-[14px] text-muted">{listing?.title}</div>
                  <div className={cx('truncate text-[15px]', unread ? 'font-medium' : 'text-muted')}>{last.orderId ? t('o.title') : last.photo ? t('m.photo') : last.text}</div>
                </div>
                {unread && <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden />}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ChatScreen() {
  const { id } = useParams()
  const { t, locale, account, chats, users, listings, orders, sendMessage, relation, markRead } = useStore()
  const chat = chats.find((c) => c.id === id)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const count = chat?.messages.length
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
    if (id) markRead(id)
  }, [count, id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!chat) return <><Header back title="" /><p className="p-6 text-muted">{t('m.empty')}</p></>
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
          <span className="inline-flex max-w-full flex-col items-center leading-tight">
            <span className="truncate text-[17px]">{other.name}</span>
            <span className="truncate text-[12px] font-normal text-muted">{relationText(relation(other.id), other, users, t)}</span>
          </span>
        }
        right={<Avatar user={other} size={34} />}
      />
      {listing && (
        <Link to={`/l/${listing.id}`} className="card mx-3 mt-2 flex items-center gap-3 p-2 pr-3">
          <Thumb listing={listing} size={44} className="rounded-[12px]" />
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{listing.title}</span>
          <Icon name="chevron" size={16} strokeWidth={2.4} className="text-fill-strong" />
        </Link>
      )}
      {other.restricted && <div className="px-3 pt-3"><Notice tone="danger" icon="lock">{t('l.restricted')}</Notice></div>}
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-4">
        {chat.messages.map((m) => {
          const mine = m.from === ME
          const order = m.orderId ? orders.find((o) => o.id === m.orderId) : undefined
          if (order) {
            return (
              <Link key={m.id} to={`/zamowienie/${order.id}`} className="card my-2 flex items-center gap-3 self-center px-4 py-3 text-[15px]" style={{ width: 'min(100%, 22rem)' }}>
                <span className="grid size-9 place-items-center rounded-full bg-fill"><Icon name="bag" size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t('m.order', { status: t(`o.status.${order.status}`) })}</span>
                  {order.total > 0 && <span className="tnum block text-muted">{money(order.total, order.currency, locale)}</span>}
                </span>
                <Icon name="chevron" size={16} strokeWidth={2.4} className="text-fill-strong" />
              </Link>
            )
          }
          return (
            <div key={m.id} className={cx('max-w-[78%] rounded-[20px] px-3.5 py-2', mine ? 'self-end rounded-br-[6px] bg-primary text-white' : 'self-start rounded-bl-[6px] bg-surface')}>
              {m.photo && <img src={m.photo} alt={t('m.photo')} className="mb-1 max-h-60 rounded-[14px]" />}
              {m.text && <p className="break-words whitespace-pre-wrap">{m.text}</p>}
              <p className={cx('tnum text-right text-[11px]', mine ? 'text-white/70' : 'text-muted')}>{new Date(m.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {hasLink && <div className="px-3 pb-2"><Notice tone="danger" icon="shield">{t('m.linkWarn')}</Notice></div>}
      {account.restricted ? (
        <div className="px-3 pb-3"><Notice tone="danger">{t('r.banner')}</Notice></div>
      ) : (
        <form onSubmit={submit} className="glass sticky bottom-[calc(84px+env(safe-area-inset-bottom,0px))] mx-3 mb-2 flex items-center gap-1.5 rounded-full p-1.5 shadow-[var(--shadow)]">
          <label htmlFor="chat-photo" className="press grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted" aria-label={t('m.photo')}>
            <Icon name="camera" />
            <input id="chat-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) sendMessage(chat.id, '', await readPhoto(f, 700))
            }} />
          </label>
          <input id="chat-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('m.ph')} className="min-h-10 min-w-0 flex-1 bg-transparent px-2 text-[17px] outline-none placeholder:text-muted" />
          <button type="submit" disabled={!text.trim()} className="press grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-40" aria-label={t('m.send')}>
            <Icon name="send" size={18} />
          </button>
        </form>
      )}
    </div>
  )
}
