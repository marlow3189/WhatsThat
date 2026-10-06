import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Tile, cx } from '../components/ui'
import { Icon, Mark } from '../components/icons'
import { categoryById } from '../lib/categories'
import { distanceKm, formatDistance } from '../lib/geo'
import { RECIPES } from '../lib/planner'
import { useWeather } from '../lib/weather'
import { ME } from '../data/seed'
import type { T } from '../i18n'
import type { User } from '../lib/types'

const NEARBY_KM = 15
/** „Sąsiedzi”: tak blisko, że oferta interesuje z definicji, bez względu na zainteresowania. */
const NEIGHBOR_KM = 3

/**
 * Główna: orbita (kto jest wokół), pytanie „czego potrzebujesz?” z podpowiedziami AI,
 * nowe od znajomych, sąsiedzi, potem rząd kafelków dla każdego zainteresowania.
 * Pierwszy kafelek w rzędzie to „Polecane”: firma albo ktoś z drugiej linii znajomych.
 */
export function Home() {
  const { t, locale, account, users, relation, visibleListings, notifications, reminder, daysLeft } = useStore()
  const weather = useWeather(account.place)
  const unread = notifications.filter((n) => !n.read).length
  const here = account.place
  const lang = account.lang
  const withKm = visibleListings.map((r) => ({ ...r, km: distanceKm(here, r.listing.place) }))

  const fromFriends = withKm.filter((r) => r.rel.circle === 1).sort((a, b) => b.listing.createdAt - a.listing.createdAt)
  const friendsWithNew = [...new Set(fromFriends.map((r) => r.listing.ownerId))].slice(0, 8)
  const neighbors = withKm.filter((r) => r.km <= NEIGHBOR_KM && r.rel.circle === 3 && !users[r.listing.ownerId].business).sort((a, b) => a.km - b.km)

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

  const ideas = [
    { label: RECIPES[0].goal[lang], q: RECIPES[0].goal[lang], icon: 'route' },
    { label: t('plan.eggsLabel'), q: t('plan.eggs'), icon: 'leaf' },
    { label: RECIPES[2].goal[lang], q: RECIPES[2].goal[lang], icon: 'route' },
  ]

  return (
    <div className="flex flex-col gap-7 pb-6">
      <header className="flex flex-col gap-4 px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Link to="/ja" className="press flex min-w-0 items-center gap-2 rounded-full bg-surface py-1.5 pr-3.5 pl-1.5 shadow-[var(--shadow)]">
            <Mark size={30} />
            <span className="flex min-w-0 items-center gap-1 text-[14px] font-semibold"><Icon name="pin" size={15} className="shrink-0" /><span className="truncate">{here.town}</span></span>
            {weather && (
              <span className="flex shrink-0 items-center gap-1 border-l border-line pl-2 text-[14px] font-semibold" title={t(`w.${weather.sky}`)}>
                <Icon name={weather.sky} size={16} /> <span className="tnum">{weather.temp}°</span>
              </span>
            )}
          </Link>
          <Link to="/powiadomienia" className="press relative grid size-11 shrink-0 place-items-center rounded-full bg-surface shadow-[var(--shadow)]" aria-label={t('home.notifications')}>
            <Icon name="bell" size={21} />
            {unread > 0 && <span className="tnum absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[12px] font-bold text-white ring-2 ring-bg">{unread}</span>}
          </Link>
        </div>
        <h1 className="text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em]">{t('home.hello', { name: first })}</h1>
      </header>

      <section className="flex flex-col gap-3 px-4">
        <Link to="/szukaj" className="press flex min-h-[56px] items-center gap-3 rounded-full bg-surface pr-2 pl-5 shadow-[var(--shadow)]">
          <Icon name="search" size={20} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-muted">{t('home.searchPh')}</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-2 text-[13px] font-bold text-white"><Icon name="sparkle" size={15} /> AI</span>
        </Link>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {ideas.map((x) => (
            <Link key={x.label} to={`/szukaj?q=${encodeURIComponent(x.q)}`} className="press flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-lilac px-3.5 text-[14px] font-semibold">
              <Icon name={x.icon} size={15} /> {x.label}
            </Link>
          ))}
        </div>
      </section>

      {weather && weather.rainTomorrow >= 60 && (
        <p className="mx-4 -mt-3 flex items-center gap-2 rounded-[18px] bg-sky px-4 py-2.5 text-[14px] font-semibold"><Icon name="rain" size={18} /> {t('w.tomorrow', { p: weather.rainTomorrow })}</p>
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
        <SectionTitle title={t('home.friendsNew')} />
        {friendsWithNew.length ? (
          <>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-5">
              {friendsWithNew.map((id) => (
                <div key={id} className="flex w-16 shrink-0 flex-col items-center gap-1">
                  <span className="rounded-full bg-[conic-gradient(var(--primary),var(--accent),var(--primary))] p-[2.5px]"><span className="block rounded-full bg-bg p-[2px]"><Avatar user={users[id]} size={52} /></span></span>
                  <span className="w-full truncate text-center text-[12px] font-semibold">{users[id].name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <Carousel>
              {fromFriends.slice(0, 10).map(({ listing }) => (
                <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={users[listing.ownerId].name.split(' ')[0]} />
              ))}
            </Carousel>
          </>
        ) : (
          <p className="px-5 text-[15px] text-muted">{t('home.friendsEmpty')}</p>
        )}
      </section>

      {neighbors.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.neighbors')} sub={t('home.neighborsD')} />
          <Carousel>
            {neighbors.map(({ listing, km }) => <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={`${users[listing.ownerId].name.split(' ')[0]} · ${formatDistance(km)}`} />)}
          </Carousel>
        </section>
      )}

      {rows.map(({ cat, promoted, rest }) =>
        promoted || rest.length ? (
          <section key={cat} className="flex flex-col gap-3">
            <SectionTitle title={categoryById(cat).label[lang]} to={`/szukaj?k=${cat}`} more={t('home.seeAll')} />
            <Carousel>
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
            </Carousel>
          </section>
        ) : null,
      )}

      {garage.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title={t('home.garage')} />
          <Carousel>
            {garage.map(({ listing, km }) => <Tile key={listing.id} listing={listing} t={t} locale={locale} width={156} meta={`${listing.place.town} · ${formatDistance(km)}`} />)}
          </Carousel>
        </section>
      )}

      <div className="mx-4 flex flex-col gap-3 rounded-[28px] bg-accent p-5 text-accent-ink">
        <p className="text-[22px] leading-tight font-extrabold tracking-[-0.02em]">{t('home.invite')}</p>
        <p className="text-[15px] leading-snug opacity-80">{t('home.inviteText')}</p>
        <Link to="/znajomi" className="self-start"><Button size="sm" className="bg-ink! text-white!">{t('f.invite')}</Button></Link>
      </div>

      <Link to="/ja/zainteresowania" className="min-h-10 self-center text-[15px] font-semibold text-link">{t('home.interests')}</Link>
    </div>
  )
}

/**
 * „Twoja orbita”: Ty w środku, znajomi na bliskim pierścieniu, ich znajomi na dalszym.
 * W jednym rzucie oka widać, ilu ludzi jest obok; stuknięcie prowadzi do zapraszania.
 */
function Orbit({ friends, fof, near, t }: { friends: User[]; fof: User[]; near: number; t: T }) {
  const ring = (people: User[], r: number, size: number, offset: number) =>
    people.slice(0, 6).map((u, i, arr) => {
      const a = (i / arr.length) * Math.PI * 2 + offset
      return (
        <span key={u.id} className="absolute" style={{ left: `calc(50% + ${(Math.cos(a) * r).toFixed(1)}px - ${size / 2}px)`, top: `calc(50% + ${(Math.sin(a) * r).toFixed(1)}px - ${size / 2}px)` }}>
          <span className="block rounded-full ring-2 ring-sky"><Avatar user={u} size={size} /></span>
        </span>
      )
    })
  return (
    <Link to="/znajomi" className="press mx-4 flex items-center gap-4 overflow-hidden rounded-[28px] bg-sky p-4">
      <div className="relative size-[132px] shrink-0" aria-hidden>
        <span className="absolute inset-[4px] rounded-full border-[1.5px] border-dashed border-ink/20" />
        <span className="absolute inset-[30px] rounded-full border-[1.5px] border-ink/20" />
        <div className="orbit-spin absolute inset-0">
          {ring(fof, 62, 22, 0.4)}
          {ring(friends, 36, 26, 0)}
        </div>
        <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-white"><Icon name="user" size={18} /></span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[18px] leading-tight font-extrabold tracking-[-0.02em]">{t('home.orbit')}</p>
        <Stat n={friends.length} label={t('home.orbitFriends')} dot="bg-primary" />
        <Stat n={fof.length} label={t('home.orbitFof')} dot="bg-ink/40" />
        <Stat n={near} label={t('home.orbitNear')} dot="bg-switch" />
      </div>
    </Link>
  )
}

function Stat({ n, label, dot }: { n: number; label: string; dot: string }) {
  return (
    <p className="flex items-center gap-2 text-[14px] leading-tight">
      <span className={cx('size-2 shrink-0 rounded-full', dot)} />
      <span className="tnum font-extrabold">{n}</span>
      <span className="min-w-0 truncate text-ink/70">{label}</span>
    </p>
  )
}

function SectionTitle({ title, sub, to, more }: { title: string; sub?: string; to?: string; more?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-5">
      <div className="min-w-0">
        <h2 className="text-[21px] leading-tight font-extrabold tracking-[-0.02em]">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {to && more && <Link to={to} className="shrink-0 rounded-full bg-surface px-3 py-1 text-[14px] font-semibold shadow-[var(--shadow)]">{more}</Link>}
    </div>
  )
}

export function Carousel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('no-scrollbar flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [&>*]:snap-start', className)}>{children}</div>
}
