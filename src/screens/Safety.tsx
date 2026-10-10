import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import { Avatar, Button, Group, Header, Notice, Row, ShareSheet, cx, timeAgo } from '../components/ui'
import { Icon } from '../components/icons'
import { BRAND, STORES } from '../config'
import { QrCode } from '../components/qr'
import { deviceOs } from '../lib/platform'
import { ME } from '../data/seed'
import { Link } from 'react-router'
import { distanceKm, formatDistance } from '../lib/geo'
import { bestMode, formatMinutes, minutes } from '../lib/travel'
import { isOpen, maskPhone } from '../lib/privacy'
import { missingInOrbit, orbitLevel, orbitScore, planCoverage } from '../lib/orbit'
import { categoryById } from '../lib/categories'

/** Zastrzeżenie numeru: jak zastrzeżenie PESEL, tylko dla konta w aplikacji. */
export function Restrict() {
  const { t, account, users, restrict, requestUnlock } = useStore()
  const [sent, setSent] = useState(false)
  const trusted = account.trusted.map((id) => users[id])
  const waiting = trusted.filter((u) => !account.unlockApprovals.includes(u.id))

  if (!account.restricted) {
    return (
      <div className="flex flex-col gap-5 pb-8">
        <Header back title={t('r.title')} />
        <div className="card mx-4 flex flex-col gap-3 p-5">
          <p className="text-[17px] font-semibold">{t('r.lead')}</p>
          <ul className="flex flex-col gap-2.5">
            {(['r.p1', 'r.p2', 'r.p3'] as const).map((k) => (
              <li key={k} className="flex gap-2.5"><Icon name="check" size={20} strokeWidth={2.4} className="mt-0.5 shrink-0 text-ok" /> {t(k)}</li>
            ))}
          </ul>
          <p className="text-[14px] text-muted">{t('r.web', { url: `${BRAND.domain}/zastrzez` })}</p>
        </div>
        <div className="flex flex-col gap-3 px-4">
          {sent && <Notice tone="ok" icon="check">{t('r.unlocked')}</Notice>}
          <Button variant="danger" onClick={restrict}><Icon name="lock" size={20} /> {t('r.confirm')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={t('r.unlockTitle')} />
      <div className="flex flex-col gap-3 px-4">
        <Notice tone="danger" icon="lock">{t('r.banner')}</Notice>
        <p>{t('r.unlockText')}</p>
      </div>
      {trusted.length < 2 ? (
        <div className="flex flex-col gap-3">
          <div className="px-4"><Notice>{t('r.noTrusted')}</Notice></div>
          <TrustedPicker />
        </div>
      ) : (
        <>
          <Group>
            {trusted.map((u) => {
              const ok = account.unlockApprovals.includes(u.id)
              return (
                <div key={u.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                  <Avatar user={u} size={36} />
                  <span className="flex-1">{ok ? t('r.approved', { name: u.name.split(' ')[0] }) : u.name}</span>
                  {ok && <Icon name="check" className="text-ok" strokeWidth={2.4} />}
                </div>
              )
            })}
          </Group>
          <div className="flex flex-col gap-3 px-4">
            {sent && waiting.length > 0 && <p className="text-[15px] text-muted">{t('r.waiting', { names: waiting.map((u) => u.name.split(' ')[0]).join(', ') })}</p>}
            <Button disabled={sent} onClick={() => { setSent(true); requestUnlock() }}>{t('r.sendRequests')}</Button>
          </div>
        </>
      )}
    </div>
  )
}

function TrustedPicker() {
  const { t, account, users, setTrusted } = useStore()
  const friends = users[ME].friends.map((id) => users[id]).filter((u) => u && !u.restricted)
  const toggle = (id: string) => {
    const has = account.trusted.includes(id)
    setTrusted(has ? account.trusted.filter((x) => x !== id) : [...account.trusted, id].slice(-2))
  }
  return (
    <Group label={t('r.pick')} footer={t('me.trustedD')}>
      {friends.map((u) => {
        const on = account.trusted.includes(u.id)
        return (
          <button key={u.id} type="button" onClick={() => toggle(u.id)} aria-pressed={on} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-fill">
            <Avatar user={u} size={36} />
            <span className="flex-1">{u.name}</span>
            <span className={cx('grid size-6 place-items-center rounded-full border-2', on ? 'border-ink bg-ink text-white' : 'border-fill-strong')}>
              {on && <Icon name="check" size={14} strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </Group>
  )
}

export function Trusted() {
  const { t } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.trusted')} />
      <TrustedPicker />
    </div>
  )
}

/** Kontakty z telefonu, których jeszcze tu nie ma (w aplikacji natywnej: wtyczka Contacts). */
const PHONE_CONTACTS = ['Agnieszka, sąsiadka', 'Wujek Staszek', 'Kuba z pracy', 'Monika', 'Paweł rower', 'Basia']

/**
 * Znajomi i polecanie bez nagród pieniężnych: pokazujemy „siłę orbity”, czyli ile spraw załatwisz u swoich,
 * i czego w okolicy brakuje. Zaproszenie to SMS z telefonu użytkownika (koszt 0 zł) albo kod QR.
 */
export function Friends() {
  const { t, users, listings, relation, account, invite, visibleListings, nameOf, shown } = useStore()
  const [shareApp, setShareApp] = useState(false)
  const here = account.place
  const friends = users[ME].friends.map((id) => users[id])
  const fof = Object.values(users).filter((u) => u.id !== ME && relation(u.id).circle === 2)
  const pool = visibleListings.map((r) => ({ ...r, km: distanceKm(here, r.listing.place) }))
  const near = pool.filter((h) => h.km <= 5).length
  const score = orbitScore(friends.filter((u) => !u.restricted).length, fof.length, near)
  const level = orbitLevel(score)
  const cover = planCoverage(pool)
  const missing = missingInOrbit(account.interests, pool.filter((h) => h.rel.circle <= 2).map((h) => h.listing)).slice(0, 4)
  const link = `https://${BRAND.domain}/z/${ME}`
  const msg = t('f.inviteMsg', { link })
  const km = (id: string) => distanceKm(here, users[id].place)
  const eta = (id: string) => {
    const d = km(id)
    const mode = bestMode(d)
    return `${formatDistance(d)} · ${formatMinutes(minutes(d, mode))} ${t(`go.${mode}`)}`
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Header back title={t('f.title')} />
      <section className="hero mx-4 flex flex-col gap-3 rounded-[28px] p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[20px] leading-tight font-extrabold">{t('f.strength')}</p>
          <p className="tnum text-[28px] leading-none font-extrabold">{score}</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={t('f.strength')}>
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${score}%` }} />
        </div>
        <p className="text-[15px] leading-snug font-semibold">{t(`f.level.${level}`)}</p>
        <p className="text-[15px] leading-snug font-semibold">{t('f.cover', { done: cover.done, total: cover.total })}</p>
        {missing.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold">{t('f.missing')}</p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((c) => <span key={c} className="rounded-full bg-white/20 px-3 py-1 text-[13px] font-bold">{categoryById(c).label[account.lang]}</span>)}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <a href={`sms:?&body=${encodeURIComponent(msg)}`} onClick={() => invite(...PHONE_CONTACTS)} className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-bold text-ink">
            <Icon name="send" size={17} /> {t('f.inviteNear')}
          </a>
          <Link to="/qr" className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-white/20 px-4 text-[15px] font-bold"><Icon name="qr" size={17} /> {t('qr.short')}</Link>
          <button type="button" onClick={() => setShareApp(true)} className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-white/20 px-4 text-[15px] font-bold"><Icon name="share" size={17} /> {t('f.shareApp')}</button>
        </div>
      </section>

      {account.favorites.length > 0 && (
        <Group label={t('fav.title')} footer={t('fav.hint')}>
          {account.favorites.filter((f) => users[f.id]).map((f) => {
            const u = users[f.id]
            const open = isOpen(u.hours)
            return (
              <Link key={f.id} to={`/u/${f.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2.5 active:bg-fill">
                <Avatar user={shown(f.id)} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5"><Icon name="star" size={15} className="shrink-0 text-accent" /><span className="truncate font-semibold">{nameOf(f.id)}</span></span>
                  <span className="block truncate text-[14px] text-muted">{[f.topic, u.hours].filter(Boolean).join(' · ')}</span>
                  <span className="block truncate text-[13px] text-muted">{eta(f.id)}</span>
                </span>
                {open !== undefined && <span className={cx('shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold', open ? 'bg-ok-soft text-ok' : 'bg-fill text-muted')}>{t(open ? 'fav.open' : 'fav.closed')}</span>}
              </Link>
            )
          })}
        </Group>
      )}

      <Group label={t('f.inApp')}>
        {friends.map((u) => (
          <Link key={u.id} to={`/u/${u.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-fill">
            <Avatar user={u} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{u.name}</span>
              <span className={cx('block truncate text-[14px]', u.restricted ? 'text-danger' : 'text-muted')}>
                {u.restricted ? t('rel.restricted') : [u.work && categoryById(u.work).label[account.lang], t('f.items', { n: listings.filter((l) => l.ownerId === u.id).length }), eta(u.id)].filter(Boolean).join(' · ')}
              </span>
            </span>
            <Icon name="chevron" size={16} strokeWidth={2.4} className="shrink-0 text-fill-strong" />
          </Link>
        ))}
      </Group>

      <Group label={t('f.fof')} footer={t('f.fofHint')}>
        {fof.map((u) => (
          <Link key={u.id} to={`/u/${u.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-fill">
            <Avatar user={shown(u.id)} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{nameOf(u.id)} <span className="tnum text-[13px] text-muted">{maskPhone(u.phone)}</span></span>
              <span className="block truncate text-[14px] text-muted">{t('rel.fof', { names: relation(u.id).via.map((v) => users[v].name.split(' ')[0]).join(', ') })} · {eta(u.id)}</span>
            </span>
            <Icon name="chevron" size={16} strokeWidth={2.4} className="shrink-0 text-fill-strong" />
          </Link>
        ))}
      </Group>

      <Group label={t('f.contacts')}>
        {PHONE_CONTACTS.map((c) => (
          <div key={c} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <span className="grid size-9 place-items-center rounded-full bg-fill font-semibold text-muted">{c[0]}</span>
            <span className="min-w-0 flex-1 truncate">{c}</span>
            <a href={`sms:?&body=${encodeURIComponent(msg)}`} onClick={() => invite(c)} className="press inline-flex min-h-9 items-center rounded-full bg-fill px-3.5 text-[15px] font-bold text-link">
              {account.invited.includes(c) ? t('f.again') : t('f.invite')}
            </a>
          </div>
        ))}
      </Group>
      {shareApp && <ShareSheet text={msg} url={link} t={t} onClose={() => setShareApp(false)} />}
    </div>
  )
}

/**
 * Pobieranie: najpierw aplikacja ze sklepu (Android, iPhone), przeglądarka jako opcja.
 * Na komputerze kod QR prowadzi na regioorbit.com/pobierz, która sama wybiera sklep.
 */
export function Install() {
  const { t } = useStore()
  const os = deviceOs()
  const download = `https://${BRAND.domain}/pobierz?ref=${ME}`
  const stores = [
    { id: 'android', label: 'Google Play', sub: 'Android', url: STORES.android },
    { id: 'ios', label: 'App Store', sub: 'iPhone, iPad', url: STORES.ios },
  ].sort((a, b) => Number(b.id === os) - Number(a.id === os))
  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={t('i.title')} />
      <p className="px-5 text-[17px] leading-snug">{t('i.text')}</p>
      <section className="flex flex-col gap-2 px-4">
        {stores.map((st) =>
          st.url ? (
            <a key={st.id} href={st.url} target="_blank" rel="noreferrer" className={cx('press flex min-h-[60px] items-center gap-3 rounded-[20px] px-4', st.id === os || os === 'desktop' ? 'bg-primary text-primary-ink' : 'bg-surface shadow-[var(--shadow)]')}>
              <Icon name="download" size={22} />
              <span className="min-w-0 flex-1"><span className="block text-[17px] font-extrabold">{st.label}</span><span className="block text-[13px] opacity-75">{st.sub}</span></span>
              <Icon name="chevron" size={16} strokeWidth={2.4} />
            </a>
          ) : (
            <div key={st.id} className="flex min-h-[60px] items-center gap-3 rounded-[20px] bg-fill px-4 text-muted">
              <Icon name="download" size={22} />
              <span className="min-w-0 flex-1"><span className="block text-[17px] font-extrabold">{st.label}</span><span className="block text-[13px]">{t('app.soon')}</span></span>
            </div>
          ),
        )}
      </section>
      {os === 'desktop' && (
        <section className="card mx-4 flex flex-col items-center gap-3 p-5 text-center">
          <div className="rounded-[20px] bg-white p-2.5"><QrCode value={download} size={184} label={t('i.qr')} /></div>
          <p className="font-bold">{t('i.qr')}</p>
        </section>
      )}
      <Group label={t('i.browser')}>
        <Row icon="phone" title="iPhone, iPad" detail={t('i.ios')} />
        <Row icon="phone" title="Android" detail={t('i.android')} />
        <Row icon="globe" title={t('i.computer')} detail={t('i.desktop', { url: `${BRAND.domain}/app` })} />
      </Group>
    </div>
  )
}

export function Notifications() {
  const { t, notifications, markNotificationsRead } = useStore()
  const [items] = useState(notifications)
  useEffect(() => markNotificationsRead(), []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('n.title')} />
      <Group>
        {items.length ? (
          items.map((n) => (
            <Row key={n.id} to={n.link} icon={n.tone === 'warn' ? 'lock' : 'bell'} danger={n.tone === 'warn'} title={<span className={cx('text-[15px] leading-snug', !n.read && 'font-semibold')}>{n.text}</span>} detail={timeAgo(n.at, t)} />
          ))
        ) : (
          <p className="px-4 py-3 text-muted">{t('n.empty')}</p>
        )}
      </Group>
    </div>
  )
}
