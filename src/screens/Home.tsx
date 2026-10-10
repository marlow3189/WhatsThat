import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Scroller, Sheet, Thumb, Tile, cx, priceText, timeAgo } from '../components/ui'
import { Icon, Mark } from '../components/icons'
import { deviceOs, isNative, isStandalone } from '../lib/platform'
import { BRAND } from '../config'
import { StoryViewer } from '../components/stories'
import { MenuDrawer } from '../components/menu'
import { OrbitSection } from '../components/orbit'
import { useWarnings, providersFor } from '../lib/warnings'
import { cheapest, formatFuel } from '../lib/fuel'
import { isOpen } from '../lib/privacy'
import { categoryById } from '../lib/categories'
import { distanceKm, formatDistance } from '../lib/geo'
import { RECIPES } from '../lib/planner'
import { useWeather } from '../lib/weather'
import { useCouncil } from '../lib/council'
import { useAgenda } from '../components/agenda'
import { addDays, dayKey } from '../lib/calendar'
import { DAY } from '../lib/pricing'
import type { Listing } from '../lib/types'

const NEARBY_KM = 15
/** „Sąsiedzi”: tak blisko, że oferta interesuje z definicji, bez względu na zainteresowania. */
const NEIGHBOR_KM = 3
/** Alerty sąsiedzkie (zaginione zwierzę, zbiórka, znalezione) z tego promienia i z ostatniego tygodnia. */
const ALERT_KM = 10
const ALERT_SUBS = ['missing', 'meet', 'lost']
/** Reklama wraca po 3 dniach od ukrycia; na płatnych planach jej nie ma. */
const AD_PAUSE = 3 * DAY
/** Pasek „Pobierz aplikację” w przeglądarce telefonu wraca po 2 tygodniach od ukrycia. */
const APP_BANNER_PAUSE = 14 * DAY

/** Tablica okolicy: prośby o pomoc, pytania, wydarzenia i praca dorywcza ze stawką netto (z 20 km, z 2 tygodni). */
const BOARD = [
  { id: 'all', icon: 'list' },
  { id: 'help', icon: 'hand', subs: ['help'] },
  { id: 'ask', icon: 'chat', subs: ['ask'] },
  { id: 'events', icon: 'calendar', subs: ['localevents', 'meet'] },
  { id: 'jobs', icon: 'bag' },
] as const
type BoardTab = (typeof BOARD)[number]['id']
const boardTab = (l: Listing): BoardTab | null =>
  l.category === 'jobs' && l.kind === 'service' ? 'jobs'
  : l.category !== 'community' ? null
  : l.sub === 'help' ? 'help'
  : l.sub === 'ask' ? 'ask'
  : l.sub === 'localevents' || l.sub === 'meet' ? 'events'
  : null

/**
 * Główna: pasek z miastem i pogodą, pytanie „czego potrzebujesz?” z podpowiedziami AI, alerty sąsiedzkie,
 * „Twoja orbita”, relacje znajomych (stuknij, żeby obejrzeć), sąsiedzi, Twoje ogłoszenia, rzędy zainteresowań.
 */
export function Home() {
  const { t, locale, account, users, shown, visibleListings, mine, notifications, reminder, daysLeft, plan, seen, markSeen, hideAd, listings, nameOf, stations, checkInSafe, hideAppBanner } = useStore()
  const [tab, setTab] = useState<BoardTab>('all')
  const warnings = useWarnings(account.place, account.country, account.warnings !== false)
  const weather = useWeather(account.place)
  const agendaItems = useAgenda()
  const council = useCouncil(account.place, { org: t('org.demoName', { town: account.place.town }), notice: t('org.demoNotice') })
  const [story, setStory] = useState<number | null>(null)
  const [why, setWhy] = useState(false)
  const [menu, setMenu] = useState(false)
  const unread = notifications.filter((n) => !n.read).length
  const here = account.place
  const lang = account.lang
  const now = Date.now()
  const withKm = visibleListings.map((r) => ({ ...r, km: distanceKm(here, r.listing.place) }))

  const fromFriends = withKm.filter((r) => r.rel.circle === 1 && r.listing.category !== 'community').sort((a, b) => b.listing.createdAt - a.listing.createdAt)
  const storyOwners = [...new Set(fromFriends.map((r) => r.listing.ownerId))].slice(0, 10).map((id) => ({ id, items: fromFriends.filter((r) => r.listing.ownerId === id).map((r) => r.listing).slice(0, 6) }))
  const alerts = withKm.filter((r) => r.listing.category === 'community' && ALERT_SUBS.includes(r.listing.sub ?? '') && r.km <= ALERT_KM && now - r.listing.createdAt < 7 * DAY).sort((a, b) => b.listing.createdAt - a.listing.createdAt)
  const neighbors = withKm.filter((r) => r.km <= NEIGHBOR_KM && r.rel.circle === 3 && !users[r.listing.ownerId].business && r.listing.category !== 'community').sort((a, b) => a.km - b.km)

  const rows = account.interests.map((cat) => {
    const inCat = withKm.filter((r) => r.listing.category === cat && (r.rel.circle < 3 || r.km <= NEARBY_KM * 4))
    const promoted = inCat
      .filter((r) => users[r.listing.ownerId].business || r.rel.circle === 2)
      .sort((a, b) => Number(!!b.listing.promoted) - Number(!!a.listing.promoted) || a.km - b.km)[0]
    const rest = inCat.filter((r) => r !== promoted).sort((a, b) => a.rel.circle - b.rel.circle || b.listing.createdAt - a.listing.createdAt).slice(0, 8)
    return { cat, promoted, rest }
  })

  const garage = withKm.filter((r) => r.listing.kind === 'garage' && r.km <= 30)
  const boardAll = withKm.filter((r) => boardTab(r.listing) && r.km <= ALERT_KM * 2 && now - r.listing.createdAt < 14 * DAY).sort((a, b) => b.listing.createdAt - a.listing.createdAt)
  const board = tab === 'all' ? boardAll : boardAll.filter((r) => boardTab(r.listing) === tab)
  // Aplikacja jest głównie na telefon: w przeglądarce telefonu podpowiadamy pobranie (raz na 2 tygodnie, da się ukryć).
  const os = deviceOs()
  const appBanner = !isNative() && !isStandalone() && os !== 'desktop' && (!account.appBannerHiddenAt || now - account.appBannerHiddenAt > APP_BANNER_PAUSE)
  // Na co dzień: najtańsze paliwo, opał w okolicy, ulubieni dostawcy (piekarz…) z informacją, czy otwarte.
  const fuelNear = stations.map((s) => ({ ...s, km: distanceKm(here, s.place) }))
  const pb = cheapest(fuelNear, 'pb95')
  const heat = withKm.filter((r) => r.listing.category === 'heating' && r.listing.kind === 'sell' && r.listing.price !== undefined && r.km <= 40)
  const pellet = heat.filter((r) => r.listing.sub === 'pellet').sort((a, b) => a.listing.price! - b.listing.price!)[0]
  const favs = account.favorites.filter((f) => users[f.id])

  // Jedna chmurka reklamy na darmowym planie: firma z okolicy, z oznaczeniem i „Dlaczego to widzę?” (DSA art. 26).
  const ad = plan === 'free' && (!account.adHiddenAt || now - account.adHiddenAt > AD_PAUSE) ? withKm.filter((r) => users[r.listing.ownerId].business && r.listing.promoted).sort((a, b) => a.km - b.km)[0] : undefined
  const myListings = mine.filter((l) => l.status !== 'removed').sort((a, b) => b.createdAt - a.createdAt)

  const ideas = [
    { label: RECIPES[0].goal[lang], q: RECIPES[0].goal[lang], icon: 'route', bg: 'tile-1' },
    { label: t('plan.eggsLabel'), q: t('plan.eggs'), icon: 'leaf', bg: 'tile-2' },
    { label: RECIPES[2].goal[lang], q: RECIPES[2].goal[lang], icon: 'route', bg: 'tile-3' },
    { label: RECIPES[3].goal[lang], q: RECIPES[3].goal[lang], icon: 'flame', bg: 'tile-4' },
    { label: RECIPES[1].goal[lang], q: RECIPES[1].goal[lang], icon: 'truck', bg: 'tile-5' },
  ]

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex flex-col gap-3 px-4 pt-2">
        <div className="flex min-h-12 items-center gap-1">
          <button type="button" onClick={() => setMenu(true)} className="press -ml-2 grid size-11 shrink-0 place-items-center rounded-full active:bg-fill" aria-label={t('menu.title')}>
            <Icon name="menu" size={23} />
          </button>
          <p className="flex min-w-0 flex-1 items-center gap-2 text-[21px] leading-none font-extrabold text-primary"><Mark size={30} /> <span className="truncate">{BRAND.name}</span></p>
          <Link to="/sos" className="press grid h-8 shrink-0 place-items-center rounded-full bg-danger px-3 text-[12.5px] font-extrabold tracking-wide text-white" aria-label={t('sos.title')}>SOS</Link>
          <Link to="/powiadomienia" className="press relative grid size-11 shrink-0 place-items-center rounded-full active:bg-fill" aria-label={t('home.notifications')}>
            <Icon name="bell" size={23} />
            {unread > 0 && <span className="tnum absolute top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-ink ring-2 ring-bg">{unread}</span>}
          </Link>
        </div>
        {/* Okrągłe skróty jak w relacjach: znajomi z nowościami, mapa okolicy, zaproszenie. */}
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4" role="list" aria-label={t('home.friendsNew')}>
          {storyOwners.map((o, i) => {
            const fresh = o.items.some((l) => !seen.includes(l.id))
            return (
              <button key={o.id} type="button" role="listitem" onClick={() => setStory(i)} className="press flex w-[60px] shrink-0 flex-col items-center gap-1" aria-label={`${users[o.id].name}: ${o.items.length}`}>
                <span className={cx('rounded-full p-[2.5px]', fresh ? 'ring-story' : 'bg-fill-strong')}>
                  <span className="block rounded-full bg-bg p-[2px]"><Avatar user={users[o.id]} size={50} /></span>
                </span>
                <span className={cx('w-full truncate text-center text-[11.5px]', fresh ? 'font-bold' : 'text-muted')}>{users[o.id].name.split(' ')[0]}</span>
              </button>
            )
          })}
          <Link to="/szukaj?mapa=1" role="listitem" className="press flex w-[60px] shrink-0 flex-col items-center gap-1">
            <span className="grid size-[59px] place-items-center rounded-full bg-sky text-[#3d6e93]"><Icon name="pin" size={24} /></span>
            <span className="w-full truncate text-center text-[11.5px] text-muted">{t('home.map')}</span>
          </Link>
          <Link to="/znajomi" role="listitem" className="press flex w-[60px] shrink-0 flex-col items-center gap-1">
            <span className="grid size-[59px] place-items-center rounded-full border-2 border-dashed border-primary/50 text-primary-strong"><Icon name="plus" size={24} /></span>
            <span className="w-full truncate text-center text-[11.5px] text-muted">{t('home.inviteShort')}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/szukaj" className="press flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-surface pr-2 pl-3.5 shadow-[var(--shadow)]">
            <Icon name="sparkle" size={20} className="shrink-0 text-primary-strong" />
            <span className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] leading-tight font-bold">{t('home.title')}</h1>
              <span className="block truncate text-[11.5px] text-muted">{t('home.searchPh')}</span>
            </span>
          </Link>
          <Link to="/szukaj?mow=1" className="press grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-ink" aria-label={t('voice.ask')}>
            <Icon name="mic" size={20} />
          </Link>
        </div>
        {/* Cztery kolorowe kafle jak w identyfikacji Regioorbit: najczęstsze sprawy sąsiedzkie jednym stuknięciem. */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { to: '/dodaj?c=help', title: t('a.c.help'), cta: t('board.post'), icon: 'hand', tone: 'tile-1', card: 'bg-peach' },
            { to: '/szukaj?k=tools', title: t('home.tool'), cta: t('home.find'), icon: 'wrench', tone: 'tile-3', card: 'bg-sun' },
            { to: '/dodaj?c=localevents', title: t('a.c.localevents'), cta: t('home.create'), icon: 'calendar', tone: 'tile-2', card: 'bg-mint' },
            { to: '#tablica', title: t('board.title'), cta: t('home.see'), icon: 'users', tone: 'tile-4', card: 'bg-sky' },
          ].map((c) => {
            const body = (
              <>
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[15px] leading-tight font-extrabold">{c.title}</span>
                  <span className={cx('grid size-9 shrink-0 place-items-center rounded-[12px] bg-surface/80', c.tone, '!bg-surface/80')}><Icon name={c.icon} size={19} /></span>
                </span>
                <span className="self-start rounded-full bg-primary px-3 py-1.5 text-[12.5px] font-bold text-primary-ink">{c.cta}</span>
              </>
            )
            const cls = cx('press flex min-h-[104px] flex-col justify-between gap-2 rounded-[20px] p-3', c.card)
            return c.to.startsWith('#') ? (
              <button key={c.to} type="button" onClick={() => document.getElementById('tablica')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className={cx(cls, 'text-left')}>{body}</button>
            ) : (
              <Link key={c.to} to={c.to} className={cls}>{body}</Link>
            )
          })}
        </div>
      </header>

      {appBanner && (
        <div className="relative mx-4 -mt-2 flex items-center gap-3 rounded-[22px] bg-surface p-3 pr-11 shadow-[var(--shadow)]">
          <Mark size={44} />
          <Link to="/instaluj" className="min-w-0 flex-1">
            <span className="block text-[15px] leading-tight font-extrabold">{t('app.bannerTitle', { app: BRAND.name })}</span>
            <span className="block text-[13px] leading-snug text-muted">{t('app.bannerText')}</span>
            <span className="mt-1 inline-block text-[14px] font-bold text-link">{t(os === 'ios' ? 'app.ios' : 'app.android')}</span>
          </Link>
          <button type="button" onClick={hideAppBanner} aria-label={t('ad.hide')} className="press absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-fill text-muted">
            <Icon name="plus" size={18} className="rotate-45" />
          </button>
        </div>
      )}

      <section className="flex flex-col gap-1.5" aria-label={t('home.plan')}>
        <p className="flex items-center gap-1 px-4 text-[12px] font-semibold text-muted"><Icon name="sparkle" size={13} className="text-primary-strong" /> {t('home.plan')}</p>
        <Scroller label={t('home.plan')}>
          {ideas.map((x) => (
            <Link key={x.label} to={`/szukaj?q=${encodeURIComponent(x.q)}`} draggable={false} className="press flex w-[66px] shrink-0 flex-col items-center gap-1 text-center">
              <span className={cx('grid size-11 place-items-center rounded-[14px]', x.bg)}><Icon name={x.icon} size={20} /></span>
              <span className="line-clamp-2 text-[11px] leading-tight font-medium">{x.label}</span>
            </Link>
          ))}
        </Scroller>
      </section>

      {weather && weather.rainTomorrow >= 60 && (
        <p className="mx-4 -mt-3 flex items-center gap-2 rounded-[18px] bg-sky px-4 py-2.5 text-[14px] font-semibold"><Icon name="rain" size={18} /> {t('w.tomorrow', { p: weather.rainTomorrow })}</p>
      )}

      {warnings.length > 0 && (
        <section className="mx-4 flex flex-col gap-2" aria-label={t('wr.title')}>
          {warnings.slice(0, 2).map((w) => (
            <div key={w.id} className={cx('flex items-start gap-2.5 rounded-[18px] p-3', w.level === 3 ? 'bg-danger text-white' : w.level === 2 ? 'bg-warn-soft' : 'bg-sun')}>
              <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', w.level === 3 ? 'bg-white/20' : 'bg-surface')}><Icon name="alert" size={17} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-[12px] font-bold tracking-wide uppercase opacity-80">
                  {w.source} · {t('wr.level', { n: w.level })}
                  {w.demo && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-white normal-case">{t('wr.demo')}</span>}
                </p>
                <p className="text-[15px] leading-tight font-bold">{w.title} · {w.area}</p>
                {w.until && <p className="text-[13px] opacity-80">{t('wr.until', { date: new Date(w.until.replace(' ', 'T')).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) })}</p>}
                <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] font-semibold">
                  <a href={w.url} target="_blank" rel="noreferrer" className="underline">{t('wr.source')}</a>
                  {providersFor(account.country).filter((p) => p.note !== 'meteo').map((p) => <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="underline">{p.name}</a>)}
                </p>
                {w.level >= 2 && (
                  <button type="button" onClick={checkInSafe} className={cx('press mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold', w.level === 3 ? 'bg-white text-danger' : 'bg-surface')}>
                    <Icon name="shield" size={15} /> {t('safe.btn')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {(() => {
        // Kalendarz na dziś i jutro (bez wywozu śmieci, który ma własną kartę gminy niżej).
        const today = dayKey(now)
        const soon = agendaItems.filter((i) => i.source !== 'waste' && (i.date === today || i.date === addDays(today, 1))).slice(0, 3)
        if (!soon.length) return null
        return (
          <Link to="/kalendarz" className="press mx-4 flex flex-col gap-1.5 rounded-[18px] bg-surface p-3 shadow-[var(--shadow)]">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted"><Icon name="calendar" size={14} className="text-primary-strong" /> {t('cal.title')}</span>
            {soon.map((i) => (
              <span key={i.id} className="flex items-center gap-2 text-[14px]">
                <span className="w-14 shrink-0 text-[12px] font-bold text-primary-strong">{i.date === today ? t('cal.today') : t('cal.tomorrow')}</span>
                <span className="tnum shrink-0 text-[12px] text-muted">{i.time ?? ''}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{i.title}</span>
              </span>
            ))}
          </Link>
        )
      })()}

      {(council.notices.length > 0 || council.pickups.length > 0) && (
        <section className="mx-4 overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow)]" aria-label={t('org.title')}>
          {council.notices.slice(0, 2).map((n) => (
            <div key={n.id} className="flex items-start gap-3 border-b border-line p-3.5 last:border-b-0">
              <span className="tile-1 grid size-9 shrink-0 place-items-center rounded-[11px]"><Icon name="bank" size={18} /></span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] font-semibold text-muted">
                  <span className="truncate">{n.org}</span>
                  <span className="inline-flex items-center gap-0.5 text-ok"><Icon name="check" size={13} strokeWidth={2.8} /> {t('org.verified')}</span>
                </p>
                <p className="text-[15px] leading-snug font-semibold">{n.title}</p>
              </div>
            </div>
          ))}
          {council.pickups.length > 0 && (() => {
            const first = council.pickups[0].date
            const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
            const what = council.pickups.filter((p) => p.date === first).map((p) => (['paper', 'plastic', 'mixed'].includes(p.fraction) ? t(`waste.${p.fraction as 'paper' | 'plastic' | 'mixed'}`) : p.fraction)).join(', ')
            return (
              <div className="flex items-center gap-3 bg-mint/60 p-3.5">
                <span className="tile-2 grid size-9 shrink-0 place-items-center rounded-[11px]"><Icon name="trash" size={18} /></span>
                <p className="min-w-0 text-[15px] leading-snug">
                  <span className="block text-[13px] font-semibold text-muted">{t('org.waste')}</span>
                  <span className="font-semibold">{first === tomorrow ? t('org.wasteTomorrow', { what }) : `${new Date(first).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}: ${what}`}</span>
                </p>
              </div>
            )
          })()}
        </section>
      )}

      {alerts.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.alerts')} sub={t('home.alertsD')} />
          <Scroller label={t('home.alerts')}>
            {alerts.map(({ listing, km }) => (
              <Link key={listing.id} to={`/l/${listing.id}`} draggable={false} className={cx('press flex w-[248px] shrink-0 items-start gap-2.5 rounded-[18px] p-3', listing.sub === 'meet' ? 'bg-mint' : 'bg-danger-soft')}>
                <span className={cx('grid size-8 shrink-0 place-items-center rounded-full bg-surface', listing.sub === 'meet' ? 'text-ok' : 'text-danger')}>
                  <Icon name={listing.sub === 'meet' ? 'users' : listing.sub === 'missing' ? 'paw' : 'flag'} size={20} />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[14px] leading-tight font-bold">{listing.title}</span>
                  <span className="mt-1 block truncate text-[13px] text-ink/70">{nameOf(listing.ownerId, true)} · {formatDistance(km)}</span>
                </span>
              </Link>
            ))}
          </Scroller>
        </section>
      )}

      {boardAll.length > 0 && (
        <section id="tablica" className="flex scroll-mt-4 flex-col gap-3">
          <SectionTitle title={t('board.title')} sub={t('board.sub')} to="/dodaj" more={t('board.post')} />
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4" role="tablist" aria-label={t('board.title')}>
            {BOARD.map((b) => (
              <button key={b.id} type="button" role="tab" aria-selected={tab === b.id} onClick={() => setTab(b.id)} className={cx('press inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px]', tab === b.id ? 'bg-primary-soft font-bold text-primary-strong' : 'bg-surface font-medium shadow-[var(--shadow)]')}>
                <Icon name={b.icon} size={15} /> {t(`board.tab.${b.id}`)}
              </button>
            ))}
          </div>
          {/* Wpisy jak posty w aplikacji sąsiedzkiej: kto, kiedy, tytuł, kilka słów i zdjęcie po prawej. */}
          <div className="mx-4 flex flex-col gap-2.5">
            {board.length ? board.slice(0, 4).map(({ listing, km }) => {
              const kind = boardTab(listing)!
              const icon = BOARD.find((b) => b.id === kind)!.icon
              const stat = kind === 'ask' ? t('board.answers', { n: listing.answers?.length ?? 0 }) : kind === 'events' ? t('board.going', { n: listing.going?.length ?? 0 }) : kind === 'jobs' ? priceText(listing, t, locale) : t('board.free')
              return (
                <Link key={listing.id} to={`/l/${listing.id}`} className="press flex flex-col gap-2 rounded-[18px] bg-surface p-3 shadow-[var(--shadow)]">
                  <span className="flex items-center gap-2 text-[12.5px] text-muted">
                    <Avatar user={shown(listing.ownerId)} size={26} />
                    <span className="min-w-0 flex-1 truncate"><span className="font-bold text-ink">{nameOf(listing.ownerId, true)}</span> · {timeAgo(listing.createdAt, t)} · {formatDistance(km)}</span>
                    <span className={cx('grid size-7 shrink-0 place-items-center rounded-[9px]', ({ all: 'tile-4', help: 'tile-1', ask: 'tile-4', events: 'tile-2', jobs: 'tile-3' } as Record<BoardTab, string>)[kind])}><Icon name={icon} size={15} /></span>
                  </span>
                  <span className="flex gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[15px] leading-tight font-extrabold">{listing.title}</span>
                      {listing.description && <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{listing.description}</span>}
                    </span>
                    {listing.photo && <Thumb listing={listing} size={64} className="rounded-[12px]" />}
                  </span>
                  <span className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-muted">{t(`board.tab.${kind}`)}</span>
                    <span className="tnum font-bold text-primary-strong">{stat}</span>
                  </span>
                </Link>
              )
            }) : <p className="px-1 text-[15px] text-muted">{t('board.empty')}</p>}
          </div>
        </section>
      )}

      {reminder && daysLeft !== null && (
        <Link to="/ja" className="press mx-4 flex items-center gap-3 rounded-[20px] bg-warn-soft px-4 py-3 text-warn">
          <Icon name="calendar" />
          <span className="flex-1 text-[15px]">{t('home.renew', { n: daysLeft })}</span>
          <span className="font-bold">{t('home.renewCta')}</span>
        </Link>
      )}

      <OrbitSection />

      <section className="flex flex-col gap-3">
        <SectionTitle title={t('daily.title')} />
        <Scroller label={t('daily.title')}>
          {pb && (
            <Link to="/paliwa" draggable={false} className="press flex w-[148px] shrink-0 flex-col gap-2 rounded-[18px] bg-surface p-3 shadow-[var(--shadow)]">
              <span className="tile-1 grid size-9 place-items-center rounded-[11px]"><Icon name="fuel" size={18} /></span>
              <span>
                <span className="block text-[13px] text-muted">{t('daily.fuel')}</span>
                <span className="tnum block text-[19px] leading-tight font-bold">{formatFuel(pb.prices.pb95!)}</span>
                <span className="block truncate text-[12px] text-muted">{formatDistance(pb.km)} · {t(`fuel.src.${pb.source}`)}</span>
              </span>
            </Link>
          )}
          {heat.length > 0 && (
            <Link to="/szukaj?k=heating" draggable={false} className="press flex w-[148px] shrink-0 flex-col gap-2 rounded-[18px] bg-surface p-3 shadow-[var(--shadow)]">
              <span className="tile-3 grid size-9 place-items-center rounded-[11px]"><Icon name="flame" size={18} /></span>
              <span>
                <span className="block text-[13px] text-muted">{t('daily.heating')}</span>
                <span className="tnum block text-[19px] leading-tight font-bold">{pellet ? priceText(pellet.listing, t, locale) : heat.length}</span>
                <span className="block truncate text-[12px] text-muted">{t('daily.heatingD', { n: heat.length })}</span>
              </span>
            </Link>
          )}
          {favs.map((f) => {
            const open = isOpen(users[f.id].hours)
            return (
              <Link key={f.id} to={`/u/${f.id}`} draggable={false} className="press flex w-[148px] shrink-0 flex-col gap-2 rounded-[18px] bg-surface p-3 shadow-[var(--shadow)]">
                <span className="tile-4 grid size-9 place-items-center rounded-[11px]"><Icon name="star" size={18} /></span>
                <span>
                  <span className="block truncate text-[13px] text-muted">{f.topic || t('fav.title')}</span>
                  <span className="block truncate text-[15px] leading-tight font-bold">{nameOf(f.id)}</span>
                  {open !== undefined && <span className={cx('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold', open ? 'bg-ok-soft text-ok' : 'bg-fill text-muted')}>{t(open ? 'fav.open' : 'fav.closed')} · {users[f.id].hours}</span>}
                </span>
              </Link>
            )
          })}
        </Scroller>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle title={t('home.friendsNew')} sub={storyOwners.length ? t('home.storiesD') : undefined} />
        {storyOwners.length ? (
          <>
            <Scroller label={t('home.friendsNew')} className="gap-4">
              {storyOwners.map((o, i) => {
                const fresh = o.items.some((l) => !seen.includes(l.id))
                return (
                  <button key={o.id} type="button" onClick={() => setStory(i)} className="press flex w-[68px] shrink-0 flex-col items-center gap-1" aria-label={`${users[o.id].name}: ${o.items.length}`}>
                    <span className={cx('rounded-full p-[2.5px]', fresh ? 'ring-story' : 'bg-fill-strong')}>
                      <span className="block rounded-full bg-bg p-[2px]"><Avatar user={users[o.id]} size={56} /></span>
                    </span>
                    <span className={cx('w-full truncate text-center text-[12px]', fresh ? 'font-bold' : 'text-muted')}>{users[o.id].name.split(' ')[0]}</span>
                  </button>
                )
              })}
            </Scroller>
            <Scroller label={t('home.friendsNew')}>
              {fromFriends.slice(0, 10).map(({ listing }) => (
                <Tile key={listing.id} listing={listing} t={t} locale={locale} width={132} meta={users[listing.ownerId].name.split(' ')[0]} />
              ))}
            </Scroller>
          </>
        ) : (
          <p className="px-5 text-[15px] text-muted">{t('home.friendsEmpty')}</p>
        )}
      </section>

      {ad && (
        <div className="relative mx-4 flex items-center gap-3 rounded-[22px] border border-line bg-surface p-3 pr-11 shadow-[var(--shadow)]">
          <Link to={`/l/${ad.listing.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Thumb listing={ad.listing} size={56} className="rounded-[16px]" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-muted uppercase">{t('ad.label')} · {users[ad.listing.ownerId].name}</span>
              <span className="line-clamp-1 text-[15px] font-bold">{ad.listing.title}</span>
              <span className="tnum text-[14px] font-semibold text-primary-strong">{priceText(ad.listing, t, locale)} · {formatDistance(ad.km)}</span>
            </span>
          </Link>
          <button type="button" onClick={() => setWhy(true)} className="absolute right-11 bottom-2 text-[11px] font-semibold text-muted underline">{t('ad.why')}</button>
          <button type="button" onClick={hideAd} aria-label={t('ad.hide')} className="press absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-fill text-muted">
            <Icon name="plus" size={18} className="rotate-45" />
          </button>
        </div>
      )}

      {neighbors.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.neighbors')} sub={t('home.neighborsD')} />
          <Scroller label={t('home.neighbors')}>
            {neighbors.map(({ listing, km }) => <Tile key={listing.id} listing={listing} t={t} locale={locale} width={132} meta={`${nameOf(listing.ownerId, true)} · ${formatDistance(km)}`} />)}
          </Scroller>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle title={t('home.mine')} to="/moje" more={t('home.seeAll')} />
        <Scroller label={t('home.mine')}>
          <Link to="/dodaj" draggable={false} className="press flex w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-primary/30 bg-surface text-primary-strong" style={{ minHeight: 132 }}>
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-ink"><Icon name="plus" size={22} strokeWidth={2.4} /></span>
            <span className="text-[14px] font-bold">{t('home.addNew')}</span>
          </Link>
          {myListings.map((l) => <Tile key={l.id} listing={l} t={t} locale={locale} width={132} meta={t('home.mineMeta', { n: viewsOf(l, listings) })} />)}
        </Scroller>
      </section>

      {rows.map(({ cat, promoted, rest }) =>
        promoted || rest.length ? (
          <section key={cat} className="flex flex-col gap-3">
            <SectionTitle title={categoryById(cat).label[lang]} to={`/szukaj?k=${cat}`} more={t('home.seeAll')} />
            <Scroller label={categoryById(cat).label[lang]}>
              {promoted && (
                <Tile
                  listing={promoted.listing}
                  t={t}
                  locale={locale}
                  width={132}
                  promoted={t('home.promoted')}
                  meta={users[promoted.listing.ownerId].business ? users[promoted.listing.ownerId].name : t('rel.fof', { names: promoted.rel.via.map((v) => users[v].name.split(' ')[0]).join(', ') })}
                />
              )}
              {rest.map(({ listing, km, rel }) => (
                <Tile key={listing.id} listing={listing} t={t} locale={locale} width={132} meta={rel.circle === 1 ? users[listing.ownerId].name.split(' ')[0] : formatDistance(km)} />
              ))}
            </Scroller>
          </section>
        ) : null,
      )}

      {garage.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.garage')} />
          <Scroller label={t('home.garage')}>
            {garage.map(({ listing, km }) => <Tile key={listing.id} listing={listing} t={t} locale={locale} width={132} meta={`${listing.place.town} · ${formatDistance(km)}`} />)}
          </Scroller>
        </section>
      )}

      <div className="mx-4 flex flex-col gap-3 rounded-[28px] bg-accent p-5 text-accent-ink">
        <p className="text-[19px] leading-tight font-bold">{t('home.invite')}</p>
        <p className="text-[15px] leading-snug opacity-80">{t('home.inviteText')}</p>
        <Link to="/znajomi" className="self-start"><Button size="sm" className="bg-ink! text-white!">{t('f.invite')}</Button></Link>
      </div>

      <Link to="/ja/zainteresowania" className="min-h-10 self-center text-[15px] font-semibold text-link">{t('home.interests')}</Link>

      {menu && <MenuDrawer onClose={() => setMenu(false)} />}
      {story !== null && <StoryViewer owners={storyOwners} start={story} onSeen={markSeen} onClose={() => setStory(null)} />}
      {why && ad && (
        <Sheet title={t('ad.why')} onClose={() => setWhy(false)}>
          <div className="card flex flex-col gap-3 p-5 text-[15px] leading-snug">
            <p>{t('ad.whyText', { name: users[ad.listing.ownerId].name })}</p>
            <p className="text-muted">{t('ad.noAds')}</p>
            <Button variant="secondary" onClick={() => { hideAd(); setWhy(false) }}>{t('ad.hide')}</Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

/** Demo: „wyświetlenia” liczone stabilnie z id, żeby kafelek wyglądał jak w prawdziwej aplikacji. */
function viewsOf(l: Listing, all: Listing[]) {
  let h = 7
  for (const c of l.id) h = (h * 31 + c.charCodeAt(0)) % 97
  return 3 + (h % 40) + (all.length % 3)
}

function SectionTitle({ title, sub, to, more }: { title: string; sub?: string; to?: string; more?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-4">
      <div className="min-w-0">
        <h2 className="text-[17px] leading-tight font-bold">{title}</h2>
        {sub && <p className="text-[12.5px] text-muted">{sub}</p>}
      </div>
      {to && more && <Link to={to} className="flex min-h-9 shrink-0 items-center text-[14px] font-semibold text-primary-strong">{more}</Link>}
    </div>
  )
}
