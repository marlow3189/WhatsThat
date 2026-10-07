import { useEffect, useRef, useState } from 'react'
import { useStore } from '../data/store'
import { Avatar, Button, Group, Header, Notice, Sheet, Toggle, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { MapView } from '../components/map'
import { distanceKm, formatDistance } from '../lib/geo'
import { bestMode, formatMinutes, minutes } from '../lib/travel'
import type { SosKind } from '../lib/types'
import { ME } from '../data/seed'

const KINDS: { id: SosKind; icon: string }[] = [
  { id: 'danger', icon: 'alert' },
  { id: 'health', icon: 'drop' },
  { id: 'accident', icon: 'car' },
  { id: 'fire', icon: 'flame' },
  { id: 'other', icon: 'more' },
]
const HOLD_MS = 2000
const COUNTDOWN = 3
const SHARE_MINUTES = [15, 30, 60]

/**
 * SOS: najpierw 112 (jeden przycisk), potem alarm do bliskich i sąsiadów pomocników.
 * Przytrzymanie przez 2 s i 3 s na anulowanie chronią przed przypadkowym alarmem. Bez internetu: SMS z położeniem.
 * Do tego „Jestem bezpieczny/a” (np. po ostrzeżeniu RCB) i „Odprowadź mnie” (lokalizacja na żywo na 15–60 min).
 */
export function Sos() {
  const { t, locale, account, users, sos, sosRecipients, sosNeighbors, startSos, endSos, checkInSafe, shareLocation, stopShare, setSosHelper } = useStore()
  const [kind, setKind] = useState<SosKind>('danger')
  const [count, setCount] = useState<number | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>()
  const [pick, setPick] = useState(false)
  const [preview, setPreview] = useState(false)
  const [safe, setSafe] = useState(false)
  const active = sos && !sos.endedAt ? sos : undefined
  const names = sosRecipients.map((id) => users[id].name.split(' ')[0])

  // Odliczanie po przytrzymaniu: 3, 2, 1 → alarm. „Anuluj” przerywa.
  useEffect(() => {
    if (count === null) return
    if (count === 0) {
      startSos(kind, coords)
      setCount(null)
      return
    }
    const id = window.setTimeout(() => setCount((c) => (c === null ? c : c - 1)), 1000)
    return () => clearTimeout(id)
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps

  const armed = () => {
    setCount(COUNTDOWN)
    // Dokładne położenie pobieramy dopiero przy alarmie (zgoda systemu); bez zgody wysyłamy przybliżone.
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords(undefined),
      { timeout: 4000, maximumAge: 30_000, enableHighAccuracy: true },
    )
  }

  const at = active ? { lat: active.lat, lng: active.lng } : account.place
  const mapLink = `https://maps.google.com/?q=${at.lat.toFixed(5)},${at.lng.toFixed(5)}`
  const phones = (active?.to ?? sosRecipients).map((id) => users[id].phone?.replace(/\s/g, '')).filter(Boolean)
  const sms = `sms:${phones.join(',')}?&body=${encodeURIComponent(t('sos.sms', { name: account.name || '—', what: t(`sos.k.${active?.kind ?? kind}`), link: mapLink }))}`
  const shareLeft = account.share && account.share.until > Date.now() ? Math.ceil((account.share.until - Date.now()) / 60_000) : 0

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={t('sos.title')} />

      <a href="tel:112" className="press mx-4 flex items-center gap-3 rounded-[22px] bg-danger-soft p-4 text-danger">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-danger text-[15px] font-extrabold text-white">112</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-extrabold">{t('sos.call112')}</span>
          <span className="block text-[14px] leading-snug text-ink/75">{t('sos.call112D')}</span>
        </span>
        <Icon name="phone" size={22} />
      </a>

      {active ? (
        <>
          <section className="mx-4 flex flex-col gap-3 rounded-[28px] bg-danger p-5 text-white" role="status" aria-live="polite">
            <p className="flex items-center gap-2 text-[13px] font-bold tracking-wide uppercase opacity-85">
              <span className="sos-pulse size-2.5 rounded-full bg-white" /> {t('sos.active')} · {new Date(active.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[24px] leading-tight font-extrabold">{t(`sos.k.${active.kind}`)}</p>
            <p className="text-[15px] leading-snug opacity-90">{t(active.precise ? 'sos.precise' : 'sos.approx')}</p>
          </section>
          <div className="px-4">
            <MapView center={{ ...account.place, lat: active.lat, lng: active.lng }} points={[{ id: 'me', lat: active.lat, lng: active.lng, label: 'SOS', tone: 'other' }]} height={190} label={t('sos.title')} fitKm={1} />
          </div>
          <Group label={t('sos.who')}>
            {active.to.map((id) => {
              const r = active.replies[id]
              return (
                <div key={id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                  <Avatar user={users[id]} size={38} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{users[id].name}</span>
                  <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold', r?.status === 'coming' ? 'bg-ok-soft text-ok' : r?.status === 'calling' ? 'bg-sun text-ink' : 'bg-fill text-muted')}>
                    {t(`sos.st.${r?.status ?? 'sent'}`, { n: r?.eta ?? 0 })}
                  </span>
                </div>
              )
            })}
            {active.neighbors > 0 && <p className="px-4 py-3 text-[14px] text-muted">{t('sos.neighborsSent', { n: active.neighbors })}</p>}
          </Group>
          <div className="flex flex-col gap-2 px-4">
            <a href={sms} className="press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-surface px-6 text-[17px] font-bold shadow-[var(--shadow)]"><Icon name="send" size={18} /> {t('sos.smsBtn')}</a>
            <p className="px-1 text-center text-[13px] text-muted">{t('sos.smsHint')}</p>
            <Button className="bg-ok! text-white!" onClick={endSos}><Icon name="check" size={20} strokeWidth={2.6} /> {t('sos.end')}</Button>
          </div>
        </>
      ) : count !== null ? (
        <section className="mx-4 flex flex-col items-center gap-4 rounded-[28px] bg-danger p-6 text-center text-white" role="alert">
          <p className="text-[17px] font-bold">{t('sos.sending')}</p>
          <p className="tnum text-[88px] leading-none font-extrabold">{count}</p>
          <p className="text-[15px] opacity-90">{t('sos.to', { names: names.join(', ') })}</p>
          <button type="button" onClick={() => setCount(null)} className="press min-h-[52px] w-full rounded-full bg-white text-[17px] font-extrabold text-danger">{t('cancel')}</button>
        </section>
      ) : (
        <>
          {sos?.endedAt && <div className="px-4"><Notice tone="ok" icon="check">{t('sos.ended', { names: sos.to.map((id) => users[id].name.split(' ')[0]).join(', ') })}</Notice></div>}
          <section className="flex flex-col gap-3">
            <p className="px-5 text-[15px] font-bold">{t('sos.what')}</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
              {KINDS.map((k) => (
                <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={cx('press inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold', kind === k.id ? 'bg-danger text-white' : 'bg-surface shadow-[var(--shadow)]')}>
                  <Icon name={k.icon} size={16} /> {t(`sos.k.${k.id}`)}
                </button>
              ))}
            </div>
          </section>

          <div className="flex flex-col items-center gap-3 py-2">
            <HoldButton onDone={armed} label={t('sos.hold')} />
            <p className="max-w-[18rem] text-center text-[14px] leading-snug text-muted">{t('sos.holdD')}</p>
          </div>

          <section className="card mx-4 flex items-center gap-3 p-4">
            <div className="flex -space-x-2.5">
              {sosRecipients.map((id) => <span key={id} className="rounded-full ring-2 ring-surface"><Avatar user={users[id]} size={36} /></span>)}
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-muted">{t('sos.who')}</span>
              <span className="block truncate font-bold">{names.join(', ') || '—'}</span>
              {sosNeighbors > 0 && <span className="block text-[13px] text-muted">{t('sos.plusNeighbors', { n: sosNeighbors })}</span>}
            </span>
            <button type="button" onClick={() => setPick(true)} className="min-h-10 shrink-0 px-1 text-[15px] font-bold text-link">{t('a.change')}</button>
          </section>

          <div className="flex flex-col gap-2 px-4">
            <Button variant="secondary" onClick={() => { checkInSafe(); setSafe(true) }}><Icon name="shield" size={18} /> {t('safe.btn')}</Button>
            {safe && <Notice tone="ok" icon="check">{t('safe.sent', { names: names.join(', ') })}</Notice>}
          </div>
        </>
      )}

      <section className="card mx-4 flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="tile-3 grid size-10 shrink-0 place-items-center rounded-[12px]"><Icon name="walk" size={20} /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t('share.title')}</span>
            <span className="block text-[14px] leading-snug text-muted">{shareLeft ? t('share.on', { names: names.join(', '), n: shareLeft }) : t('share.text')}</span>
          </span>
        </div>
        {shareLeft ? (
          <Button variant="secondary" onClick={stopShare}>{t('share.stop')}</Button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {SHARE_MINUTES.map((m) => <button key={m} type="button" onClick={() => shareLocation(m)} className="press tnum min-h-11 rounded-full bg-fill text-[15px] font-bold">{m} min</button>)}
          </div>
        )}
      </section>

      <Group footer={t('sos.helperD')}>
        <Toggle id="sos-helper" label={t('sos.helper')} checked={!!account.sosHelper} onChange={setSosHelper} />
      </Group>

      <div className="flex flex-col gap-3 px-4">
        <Button variant="plain" className="self-center" onClick={() => setPreview(true)}>{t('sos.preview')}</Button>
        <p className="px-1 text-[13px] leading-snug text-muted">{t('sos.note')}</p>
      </div>

      {pick && <RecipientsSheet onClose={() => setPick(false)} />}
      {preview && <IncomingPreview kind={active?.kind ?? kind} onClose={() => setPreview(false)} />}
    </div>
  )
}

/** Duży przycisk: trzeba przytrzymać 2 s (pierścień się wypełnia), puszczenie wcześniej niczego nie wysyła. */
function HoldButton({ onDone, label }: { onDone: () => void; label: string }) {
  const [p, setP] = useState(0)
  const raf = useRef(0)
  const start = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const stop = () => {
    cancelAnimationFrame(raf.current)
    start.current = 0
    setP(0)
  }
  const begin = () => {
    if (start.current) return
    start.current = performance.now()
    const tick = (now: number) => {
      const v = Math.min(1, (now - start.current) / HOLD_MS)
      setP(v)
      if (v >= 1) {
        start.current = 0
        navigator.vibrate?.(180)
        onDone()
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const R = 92
  const C = 2 * Math.PI * R
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          begin()
        }
      }}
      onKeyUp={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="no-callout relative grid size-[200px] place-items-center rounded-full"
    >
      <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--danger-soft)" strokeWidth="10" />
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--danger)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      </svg>
      <span className={cx('grid size-[164px] place-items-center rounded-full bg-danger text-white', p === 0 && 'sos-pulse')} style={{ transform: `scale(${1 - p * 0.06})` }}>
        <span className="flex flex-col items-center">
          <span className="text-[44px] leading-none font-extrabold tracking-[-0.02em]">SOS</span>
          <span className="mt-1.5 text-[13px] font-bold opacity-90">{label}</span>
        </span>
      </span>
    </button>
  )
}

/** Komu wysyłać alarm: do 5 znajomych. */
function RecipientsSheet({ onClose }: { onClose: () => void }) {
  const { t, users, sosRecipients, setSosContacts } = useStore()
  const [sel, setSel] = useState<string[]>(sosRecipients)
  const friends = users[ME].friends.map((id) => users[id]).filter((u) => u && !u.restricted)
  return (
    <Sheet title={t('sos.who')} onClose={onClose}>
      <p className="mb-3 px-1 text-[14px] text-muted">{t('sos.pickD')}</p>
      <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
        {friends.map((u) => {
          const on = sel.includes(u.id)
          const full = !on && sel.length >= 5
          return (
            <button key={u.id} type="button" disabled={full} aria-pressed={on} onClick={() => setSel((xs) => (on ? xs.filter((x) => x !== u.id) : [...xs, u.id]))} className={cx('flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left', full && 'opacity-40')}>
              <Avatar user={u} size={36} />
              <span className="flex-1">{u.name}</span>
              <span className={cx('grid size-6 place-items-center rounded-full border-2', on ? 'border-danger bg-danger text-white' : 'border-fill-strong')}>{on && <Icon name="check" size={14} strokeWidth={3} />}</span>
            </button>
          )
        })}
      </div>
      <Button className="mt-4 w-full" disabled={!sel.length} onClick={() => { setSosContacts(sel); onClose() }}>{t('save')}</Button>
    </Sheet>
  )
}

/** Podgląd: tak alarm wygląda u znajomego (pełny ekran, mapa, „Jadę” / „Dzwonię”). */
function IncomingPreview({ kind, onClose }: { kind: SosKind; onClose: () => void }) {
  const { t, account, users, sosRecipients } = useStore()
  const viewer = users[sosRecipients[0]]
  const km = viewer ? distanceKm(viewer.place, account.place) : 0
  const mode = bestMode(km)
  return (
    <Sheet onClose={onClose}>
      <p className="mb-2 px-1 text-[13px] font-semibold text-muted">{t('sos.previewD', { name: viewer?.name.split(' ')[0] ?? '' })}</p>
      <div className="overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow)]">
        <div className="flex flex-col gap-1 bg-danger p-5 text-white">
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-wide uppercase"><span className="sos-pulse size-2.5 rounded-full bg-white" /> SOS · {t('time.now')}</p>
          <p className="text-[24px] leading-tight font-extrabold">{account.name || '—'}</p>
          <p className="text-[15px] opacity-90">{t(`sos.k.${kind}`)} · {formatDistance(km)} · {formatMinutes(minutes(km, mode))} {t(`go.${mode}`)}</p>
        </div>
        <MapView center={account.place} points={[{ id: 'sos', lat: account.place.lat, lng: account.place.lng, label: 'SOS', tone: 'other' }]} height={160} label="SOS" fitKm={1} />
        <div className="grid grid-cols-2 gap-2 p-3">
          <Button size="sm" className="min-h-12" onClick={onClose}><Icon name="route" size={16} /> {t('sos.in.going')}</Button>
          <Button size="sm" variant="secondary" className="min-h-12" onClick={onClose}><Icon name="phone" size={16} /> {t('sos.in.call')}</Button>
          <Button size="sm" variant="danger" className="min-h-12" onClick={onClose}>{t('sos.in.call112')}</Button>
          <Button size="sm" variant="secondary" className="min-h-12" onClick={onClose}>{t('sos.in.cant')}</Button>
        </div>
      </div>
    </Sheet>
  )
}
