import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '../data/store'
import type { Listing } from '../lib/types'
import { Avatar, Thumb, cx, priceText, timeAgo } from './ui'
import { Icon } from './icons'

const STORY_MS = 5000

/**
 * Relacje znajomych jak w WhatsAppie i na Instagramie: każda nowa oferta to jedna plansza,
 * pasek postępu u góry, stuknięcie z prawej = dalej, z lewej = wstecz, przytrzymanie = pauza.
 */
export function StoryViewer({ owners, start, onSeen, onClose }: { owners: { id: string; items: Listing[] }[]; start: number; onSeen: (id: string) => void; onClose: () => void }) {
  const { t, locale, users, openChat } = useStore()
  const nav = useNavigate()
  const [o, setO] = useState(start)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const owner = owners[o]
  const item = owner?.items[i]

  const next = () => {
    if (!owner) return onClose()
    if (i < owner.items.length - 1) setI(i + 1)
    else if (o < owners.length - 1) {
      setO(o + 1)
      setI(0)
    } else onClose()
  }
  const prev = () => {
    if (i > 0) setI(i - 1)
    else if (o > 0) {
      setO(o - 1)
      setI(0)
    }
  }

  useEffect(() => {
    if (item) onSeen(item.id)
  }, [item?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (paused || !item) return
    const id = window.setTimeout(next, STORY_MS)
    return () => clearTimeout(id)
  }, [o, i, paused]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const key = (e: KeyboardEvent) => (e.key === 'Escape' ? onClose() : e.key === 'ArrowRight' ? next() : e.key === 'ArrowLeft' ? prev() : undefined)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  if (!owner || !item) return null
  const user = users[owner.id]
  const go = (path: string) => {
    onClose()
    nav(path)
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-[#0b1020]" role="dialog" aria-modal aria-label={user.name}>
      <div className="relative flex h-full w-full max-w-[34rem] flex-col">
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 bg-gradient-to-b from-black/50 to-transparent px-3 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}>
          <div className="flex gap-1">
            {owner.items.map((x, k) => (
              <span key={x.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                <span
                  key={`${o}-${i}-${String(paused)}`}
                  className={cx('block h-full rounded-full bg-white', k === i && !paused && 'story-progress')}
                  style={{ width: k < i ? '100%' : k === i ? undefined : '0%', animationDuration: `${STORY_MS}ms` }}
                />
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2.5 text-white">
            <Avatar user={user} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold">{user.name}</span>
              <span className="block text-[12px] opacity-75">{timeAgo(item.createdAt, t)}</span>
            </span>
            <button type="button" onClick={onClose} aria-label={t('close')} className="press grid size-10 place-items-center rounded-full bg-white/15">
              <Icon name="plus" size={22} className="rotate-45" />
            </button>
          </div>
        </div>

        <div
          className="relative flex-1 select-none"
          onPointerDown={() => setPaused(true)}
          onPointerUp={(e) => {
            setPaused(false)
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            if (e.clientX - r.left < r.width / 3) prev()
            else next()
          }}
          onPointerLeave={() => setPaused(false)}
        >
          <Thumb listing={item} className="h-full w-full" iconSize={120} />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pt-16 text-white" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }}>
          <div>
            <p className="text-[22px] leading-tight font-extrabold">{item.title}</p>
            <p className="tnum mt-1 text-[18px] font-bold">{priceText(item, t, locale)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(`/l/${item.id}`)} className="press min-h-12 flex-1 rounded-full bg-white text-[16px] font-bold text-ink">{t('st.view')}</button>
            <button type="button" onClick={() => go(`/czat/${openChat(item)}`)} className="press flex min-h-12 items-center gap-2 rounded-full bg-white/20 px-5 text-[16px] font-bold">
              <Icon name="chat" size={20} /> {t('st.reply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
