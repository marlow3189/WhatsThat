import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Scroller, Sheet, Thumb, Tile, cx, priceText } from '../components/ui'
import { Icon, Mark } from '../components/icons'
import { StoryViewer } from '../components/stories'
import { categoryById } from '../lib/categories'
import { distanceKm, formatDistance } from '../lib/geo'
import { RECIPES } from '../lib/planner'
import { useWeather } from '../lib/weather'
import { DAY } from '../lib/pricing'
import { ME } from '../data/seed'
import type { T } from '../i18n'
import type { Listing, User } from '../lib/types'

const NEARBY_KM = 15
/** „Sąsiedzi”: tak blisko, że oferta interesuje z definicji, bez względu na zainteresowania. */
const NEIGHBOR_KM = 3
/** Alerty sąsiedzkie (zaginione zwierzę, zbiórka, znalezione) z tego promienia i z ostatniego tygodnia. */
const ALERT_KM = 10
const ALERT_SUBS = ['missing', 'meet', 'lost']
/** Reklama wraca po 3 dniach od ukrycia; na płatnych planach jej nie ma. */
const AD_PAUSE = 3 * DAY

/**
 * Główna: pasek z miastem i pogodą, pytanie „czego potrzebujesz?” z podpowiedziami AI, alerty sąsiedzkie,
 * „Twoja orbita”, relacje znajomych (stuknij, żeby obejrzeć), sąsiedzi, Twoje ogłoszenia, rzędy zainteresowań.
 */
export function Home() {
  const { t, locale, account, users, relation, visibleListings, mine, notifications, reminder, daysLeft, plan, seen, markSeen, hideAd, listings } = useStore()
  const weather = useWeather(account.place)
  const [story, setStory] = useState<number | null>(null)
  const [why, setWhy] = useState(false)
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
  const first = account.name.split(' ')[0]
  const friends = users[ME].friends.map((id) => users[id]).filter((u) => u && !u.restricted)
  const fof = Object.values(users).filter((u) => u.id !== ME && relation(u.id).circle === 2)
  const near5 = withKm.filter((r) => r.km <= 5).length

  // Jedna chmurka reklamy na darmowym planie: firma z okolicy, z oznaczeniem i „Dlaczego to widzę?” (DSA art. 26).
  const ad = plan === 'free' && (!account.adHiddenAt || now - account.adHiddenAt > AD_PAUSE) ? withKm.filter((r) => users[r.listing.ownerId].business && r.listing.promoted).sort((a, b) => a.km - b.km)[0] : undefined
  const myListings = mine.filter((l) => l.status !== 'removed').sort((a, b) => b.createdAt - a.createdAt)

  const ideas = [
    { label: RECIPES[0].goal[lang], q: RECIPES[0].goal[lang], icon: 'route', bg: 'bg-sky' },
    { label: t('plan.eggsLabel'), q: t('plan.eggs'), icon: 'leaf', bg: 'bg-mint' },
    { label: RECIPES[2].goal[lang], q: RECIPES[2].goal[lang], icon: 'route', bg: 'bg-peach' },
    { label: RECIPES[1].goal[lang], q: RECIPES[1].goal[lang], icon: 'truck', bg: 'bg-lilac' },
  ]

  return (
    <div className="flex flex-col gap-7 pb-6">
      <header className="flex flex-col gap-5 px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/ja" aria-label={t('nav.me')} className="press shrink-0 rounded-full ring-2 ring-surface"><Avatar user={users[ME]} size={44} /></Link>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-muted">{t('home.hello', { name: first })}</p>
              <p className="flex min-w-0 items-center gap-1 text-[16px] font-extrabold">
                <Icon name="pin" size={16} className="shrink-0 text-primary" /><span className="truncate">{here.town}</span>
                {weather && (
                  <span className="ml-1 flex shrink-0 items-center gap-1 text-[14px] font-semibold text-muted" title={t(`w.${weather.sky}`)}>
                    · <Icon name={weather.sky} size={15} /> <span className="tnum">{weather.temp}°</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link to="/powiadomienia" className="press relative grid size-11 shrink-0 place-items-center rounded-full bg-surface shadow-[var(--shadow)]" aria-label={t('home.notifications')}>
            <Icon name="bell" size={21} />
            {unread > 0 && <span className="tnum absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[12px] font-bold text-white ring-2 ring-bg">{unread}</span>}
          </Link>
        </div>
        <h1 className="text-[30px] leading-[1.08] font-extrabold tracking-[-0.03em]">{t('home.title')}</h1>
      </header>

      <section className="-mt-2 flex flex-col gap-3">
        <Link to="/szukaj" className="press mx-4 flex min-h-[56px] items-center gap-3 rounded-[20px] bg-surface pr-2 pl-4 shadow-[var(--shadow)]">
          <Icon name="search" size={20} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-muted">{t('home.searchPh')}</span>
          <span className="flex shrink-0 items-center gap-1 rounded-[14px] bg-primary px-3 py-2.5 text-[13px] font-bold text-white"><Icon name="sparkle" size={15} /> AI</span>
        </Link>
        <Scroller label={t('home.plan')}>
          {ideas.map((x) => (
            <Link key={x.label} to={`/szukaj?q=${encodeURIComponent(x.q)}`} draggable={false} className="press flex w-[92px] shrink-0 flex-col items-center gap-1.5 text-center">
              <span className={cx('grid size-14 place-items-center rounded-[18px] text-ink', x.bg)}><Icon name={x.icon} size={24} /></span>
              <span className="line-clamp-2 text-[12px] leading-tight font-semibold">{x.label}</span>
            </Link>
          ))}
        </Scroller>
      </section>

      {weather && weather.rainTomorrow >= 60 && (
        <p className="mx-4 -mt-3 flex items-center gap-2 rounded-[18px] bg-sky px-4 py-2.5 text-[14px] font-semibold"><Icon name="rain" size={18} /> {t('w.tomorrow', { p: weather.rainTomorrow })}</p>
      )}

      {alerts.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.alerts')} sub={t('home.alertsD')} />
          <Scroller label={t('home.alerts')}>
            {alerts.map(({ listing, km }) => (
              <Link key={listing.id} to={`/l/${listing.id}`} draggable={false} className={cx('press flex w-[280px] shrink-0 items-start gap-3 rounded-[22px] p-4', listing.sub === 'meet' ? 'bg-mint' : 'bg-danger-soft')}>
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-full bg-surface', listing.sub === 'meet' ? 'text-ok' : 'text-danger')}>
                  <Icon name={listing.sub === 'meet' ? 'users' : listing.sub === 'missing' ? 'paw' : 'flag'} size={20} />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[15px] leading-tight font-bold">{listing.title}</span>
                  <span className="mt-1 block truncate text-[13px] text-ink/70">{users[listing.ownerId].name.split(' ')[0]} · {formatDistance(km)}</span>
                </span>
              </Link>
            ))}
          </Scroller>
        </section>
      )}

      {reminder && daysLeft !== null && (
        <Link to="/ja" className="press mx-4 flex items-center gap-3 rounded-[20px] bg-warn-soft px-4 py-3 text-warn">
          <Icon name="calendar" />
          <span className="flex-1 text-[15px]">{t('home.renew', { n: daysLeft })}</span>
          <span className="font-bold">{t('home.renewCta')}</span>
        </Link>
      )}

      <Orbit friends={friends} fof={fof} near={near5} t={t} />

      <section className="flex flex-col gap-3">
        <SectionTitle title={t('home.friendsNew')} sub={storyOwners.length ? t('home.storiesD') : undefined} />
        {storyOwners.length ? (
          <>
            <Scroller label={t('home.friendsNew')} className="gap-4">
              {storyOwners.map((o, i) => {
                const fresh = o.items.some((l) => !seen.includes(l.id))
                return (
                  <button key={o.id} type="button" onClick={() => setStory(i)} className="press flex w-[68px] shrink-0 flex-col items-center gap-1" aria-label={`${users[o.id].name}: ${o.items.length}`}>
                    <span className={cx('rounded-full p-[2.5px]', fresh ? 'bg-[conic-gradient(var(--primary),#7c9bff,var(--accent),var(--primary))]' : 'bg-fill-strong')}>
                      <span className="block rounded-full bg-bg p-[2px]"><Avatar user={users[o.id]} size={56} /></span>
                    </span>
                    <span className={cx('w-full truncate text-center text-[12px]', fresh ? 'font-bold' : 'text-muted')}>{users[o.id].name.split(' ')[0]}</span>
                  </button>
                )
              })}
            </Scroller>
            <Scroller label={t('home.friendsNew')}>
              {fromFriends.slice(0, 10).map(({ listing }) => (
                <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={users[listing.ownerId].name.split(' ')[0]} />
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
              <span className="tnum text-[14px] font-semibold text-primary">{priceText(ad.listing, t, locale)} · {formatDistance(ad.km)}</span>
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
            {neighbors.map(({ listing, km }) => <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={`${users[listing.ownerId].name.split(' ')[0]} · ${formatDistance(km)}`} />)}
          </Scroller>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle title={t('home.mine')} to="/moje" more={t('home.seeAll')} />
        <Scroller label={t('home.mine')}>
          <Link to="/dodaj" draggable={false} className="press flex w-[156px] shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-primary/30 bg-surface text-primary" style={{ minHeight: 156 }}>
            <span className="grid size-12 place-items-center rounded-full bg-primary text-white"><Icon name="plus" size={24} strokeWidth={2.4} /></span>
            <span className="text-[14px] font-bold">{t('home.addNew')}</span>
          </Link>
          {myListings.map((l) => <Tile key={l.id} listing={l} t={t} locale={locale} width={156} meta={t('home.mineMeta', { n: viewsOf(l, listings) })} />)}
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
                  width={156}
                  promoted={t('home.promoted')}
                  meta={users[promoted.listing.ownerId].business ? users[promoted.listing.ownerId].name : t('rel.fof', { names: promoted.rel.via.map((v) => users[v].name.split(' ')[0]).join(', ') })}
                />
              )}
              {rest.map(({ listing, km, rel }) => (
                <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={rel.circle === 1 ? users[listing.ownerId].name.split(' ')[0] : formatDistance(km)} />
              ))}
            </Scroller>
          </section>
        ) : null,
      )}

      {garage.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.garage')} />
          <Scroller label={t('home.garage')}>
            {garage.map(({ listing, km }) => <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={`${listing.place.town} · ${formatDistance(km)}`} />)}
          </Scroller>
        </section>
      )}

      <div className="mx-4 flex flex-col gap-3 rounded-[28px] bg-accent p-5 text-accent-ink">
        <p className="text-[22px] leading-tight font-extrabold tracking-[-0.02em]">{t('home.invite')}</p>
        <p className="text-[15px] leading-snug opacity-80">{t('home.inviteText')}</p>
        <Link to="/znajomi" className="self-start"><Button size="sm" className="bg-ink! text-white!">{t('f.invite')}</Button></Link>
      </div>

      <Link to="/ja/zainteresowania" className="min-h-10 self-center text-[15px] font-semibold text-link">{t('home.interests')}</Link>

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

/**
 * „Twoja orbita”: karta-bohater w kolorze marki. Ty w środku, znajomi na bliskim pierścieniu, ich znajomi na dalszym.
 * Każda liczba prowadzi dalej: znajomi → lista i zaproszenia, oferty do 5 km → mapa.
 */
function Orbit({ friends, fof, near, t }: { friends: User[]; fof: User[]; near: number; t: T }) {
  const ring = (people: User[], r: number, size: number, offset: number) =>
    people.slice(0, 6).map((u, i, arr) => {
      const a = (i / arr.length) * Math.PI * 2 + offset
      return (
        <span key={u.id} className="absolute" style={{ left: `calc(50% + ${(Math.cos(a) * r).toFixed(1)}px - ${size / 2}px)`, top: `calc(50% + ${(Math.sin(a) * r).toFixed(1)}px - ${size / 2}px)` }}>
          <span className="block rounded-full ring-2 ring-primary"><Avatar user={u} size={size} /></span>
        </span>
      )
    })
  return (
    <section className="mx-4 flex flex-col gap-4 overflow-hidden rounded-[28px] bg-primary p-5 text-white shadow-[0_14px_34px_rgb(46_91_255/0.32)]">
      <div className="flex items-center gap-4">
        <div className="relative size-[128px] shrink-0" aria-hidden>
          <span className="absolute inset-[4px] rounded-full border-[1.5px] border-dashed border-white/35" />
          <span className="absolute inset-[30px] rounded-full border-[1.5px] border-white/35" />
          <div className="orbit-spin absolute inset-0">
            {ring(fof, 60, 22, 0.4)}
            {ring(friends, 34, 26, 0)}
          </div>
          <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-primary"><Mark size={24} /></span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-[19px] leading-tight font-extrabold tracking-[-0.02em]">{t('home.orbit')}</p>
          <p className="text-[13px] leading-snug text-white/80">{t('home.orbitD')}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <OrbitStat to="/znajomi" n={friends.length} label={t('home.orbitFriends')} />
        <OrbitStat to="/znajomi" n={fof.length} label={t('home.orbitFof')} />
        <OrbitStat to="/szukaj?mapa=1" n={near} label={t('home.orbitNear')} />
      </div>
    </section>
  )
}

function OrbitStat({ to, n, label }: { to: string; n: number; label: string }) {
  return (
    <Link to={to} className="press flex flex-col rounded-[18px] bg-white/15 px-3 py-2.5 hover:bg-white/20">
      <span className="tnum text-[22px] leading-none font-extrabold">{n}</span>
      <span className="mt-1 truncate text-[12px] text-white/85">{label}</span>
    </Link>
  )
}

function SectionTitle({ title, sub, to, more }: { title: string; sub?: string; to?: string; more?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-5">
      <div className="min-w-0">
        <h2 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em]">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {to && more && <Link to={to} className="shrink-0 text-[14px] font-bold text-primary">{more}</Link>}
    </div>
  )
}
