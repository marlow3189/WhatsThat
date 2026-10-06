import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, CircleBadge, Header, Thumb, cx, readPhoto } from '../components/ui'
import { formatPLN } from '../lib/money'
import type { Booking, BookingStatus } from '../lib/types'
import { ME } from '../data/seed'

const time = (ms: number) => new Date(ms).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
const date = (s: string) => new Date(s).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })

export const STATUS: Record<BookingStatus, { label: string; tone: string }> = {
  requested: { label: 'Czeka na akceptację', tone: 'bg-warn-soft text-warn' },
  accepted: { label: 'Zaakceptowane', tone: 'bg-ok-soft text-ok' },
  active: { label: 'U Ciebie', tone: 'bg-brand-soft text-brand' },
  returned: { label: 'Zwrócone', tone: 'bg-sunken text-muted' },
  declined: { label: 'Odrzucone', tone: 'bg-sunken text-muted' },
}

export function Chats() {
  const { chats, users, listings, relation } = useStore()
  const sorted = [...chats].sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))
  return (
    <>
      <Header title="Czaty" />
      {sorted.length === 0 && <p className="p-6 text-center text-muted">Napisz do kogoś z ogłoszenia, a rozmowa pojawi się tutaj.</p>}
      <ul className="divide-y divide-line">
        {sorted.map((c) => {
          const other = users[c.members.find((m) => m !== ME)!]
          const listing = listings.find((l) => l.id === c.listingId)
          const last = c.messages.at(-1)
          return (
            <li key={c.id}>
              <Link to={`/czat/${c.id}`} className="flex items-center gap-3 px-4 py-3">
                <Avatar user={other} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{other.name}</span>
                    {last && <span className="tnum shrink-0 text-xs text-muted">{time(last.at)}</span>}
                  </div>
                  <div className="truncate text-sm text-muted">{listing?.title}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{last ? (last.bookingId ? 'Prośba o wypożyczenie' : last.photo ? 'Zdjęcie' : last.text) : 'Nowa rozmowa'}</span>
                    <CircleBadge rel={relation(other.id)} users={users} />
                  </div>
                </div>
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
  const { chats, users, listings, bookings, sendMessage, relation, markRead } = useStore()
  const chat = chats.find((c) => c.id === id)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
    if (id) markRead(id)
  }, [chat?.messages.length, id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!chat) return <><Header title="Czat" back /><p className="p-6 text-muted">Nie ma takiej rozmowy.</p></>
  const other = users[chat.members.find((m) => m !== ME)!]
  const listing = listings.find((l) => l.id === chat.listingId)

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
              <span className="block truncate text-base leading-tight">{other.name}</span>
              <span className="block text-xs font-normal"><CircleBadge rel={relation(other.id)} users={users} /></span>
            </span>
          </span>
        }
      />
      {listing && (
        <Link to={`/l/${listing.id}`} className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2">
          <Thumb listing={listing} className="w-14 rounded-lg [&>span]:text-2xl" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{listing.title}</span>
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-2 px-3 py-4">
        {chat.messages.map((m) => {
          const mine = m.from === ME
          const booking = m.bookingId ? bookings.find((b) => b.id === m.bookingId) : undefined
          if (booking) return <BookingCard key={m.id} booking={booking} />
          return (
            <div key={m.id} className={cx('max-w-[80%] rounded-2xl px-3 py-2 shadow-sm', mine ? 'self-end rounded-br-md bg-bubble-me' : 'self-start rounded-bl-md bg-surface')}>
              {m.photo && <img src={m.photo} alt="Zdjęcie" className="mb-1 max-h-60 rounded-xl" />}
              {m.text && <p className="break-words whitespace-pre-wrap">{m.text}</p>}
              <p className="tnum text-right text-[11px] text-muted">{time(m.at)}</p>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="sticky bottom-20 flex items-end gap-2 border-t border-line bg-bg px-3 py-2">
        <label htmlFor="chat-photo" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-surface text-muted" aria-label="Wyślij zdjęcie">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3.5" /></svg>
          <input id="chat-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) sendMessage(chat.id, '', await readPhoto(f, 700))
          }} />
        </label>
        <input id="chat-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Wiadomość" className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 outline-none focus:border-brand" />
        <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink" aria-label="Wyślij">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 20.5 21 12 3 3.5l2.5 8.5L3 20.5Z" /></svg>
        </button>
      </form>
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const { listings } = useStore()
  const listing = listings.find((l) => l.id === booking.listingId)
  const s = STATUS[booking.status]
  return (
    <div className="my-1 flex flex-col gap-2 self-center rounded-2xl border border-line bg-surface p-3 text-sm" style={{ width: 'min(100%, 22rem)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">Wypożyczenie</span>
        <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', s.tone)}>{s.label}</span>
      </div>
      <p className="truncate">{listing?.title}</p>
      <div className="tnum flex justify-between text-muted">
        <span>{date(booking.from)} – {date(booking.to)}</span>
        <span className="font-semibold text-ink">{formatPLN(booking.quote.total)}</span>
      </div>
      {booking.quote.depositHold > 0 && <p className="tnum text-xs text-muted">Kaucja (blokada): {formatPLN(booking.quote.depositHold)}</p>}
      {booking.status !== 'requested' && booking.status !== 'declined' && (
        <Link to={`/protokol/${booking.id}`} className="mt-1 rounded-xl bg-brand-soft px-3 py-2 text-center font-semibold text-brand">
          {booking.status === 'returned' ? 'Zobacz protokół' : 'Protokół odbioru i zwrotu'}
        </Link>
      )}
    </div>
  )
}
