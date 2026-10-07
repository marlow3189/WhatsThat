import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, cx, relationText } from './ui'
import { Icon, Mark } from './icons'
import { MapView, routeUrl, type MapPoint } from './map'
import { categoryById } from '../lib/categories'
import { distanceKm, formatDistance } from '../lib/geo'
import { bestMode, formatMinutes, minutes } from '../lib/travel'
import { ME } from '../data/seed'
import type { User } from '../lib/types'

export type Radius = 2 | 5 | 25 | 'country' | 'europe'
const RADII: Radius[] = [2, 5, 25, 'country', 'europe']

/**
 * „Twoja orbita” z mapą pod spodem: kto jest wokół Ciebie (znajomi z imienia, reszta anonimowo),
 * co oferuje albo umie zrobić i ile minut zajmie dotarcie. Zasięg od 2 km po całą Europę (sprawy przygraniczne).
 */
export function OrbitSection() {
  const { t, account, users, relation, visibleListings, nameOf, shown } = useStore()
  const [radius, setRadius] = useState<Radius>(5)
  const [sel, setSel] = useState('')
  const here = account.place
  const country = account.country
  const inRange = (place: User['place'], km: number) =>
    typeof radius === 'number' ? km <= radius : radius === 'country' ? (place.country ?? 'PL') === country : true

  const offers = visibleListings.map((r) => ({ ...r, km: distanceKm(here, r.listing.place) })).filter((r) => inRange(r.listing.place, r.km))
  const offersBy = (id: string) => offers.filter((r) => r.listing.ownerId === id)
  const people = Object.values(users)
    .filter((u) => u.id !== ME && !u.restricted)
    .map((u) => ({ u, rel: relation(u.id), km: distanceKm(here, u.place) }))
    .filter(({ u, rel, km }) => inRange(u.place, km) && (rel.circle <= 2 || offersBy(u.id).length > 0))
    .sort((a, b) => a.rel.circle - b.rel.circle || a.km - b.km)
    .slice(0, 40)
  const friends = people.filter((p) => p.rel.circle === 1).length
  const fof = people.filter((p) => p.rel.circle === 2).length
  const far = Math.max(1, ...people.map((p) => p.km))

  const points: MapPoint[] = people.map(({ u, rel }) => ({
    id: u.id,
    lat: u.place.lat,
    lng: u.place.lng,
    label: nameOf(u.id),
    tone: rel.circle === 1 ? 'friend' : rel.circle === 2 ? 'fof' : 'other',
    node: <Avatar user={shown(u.id)} size={rel.circle === 1 ? 30 : 24} />,
  }))
  const chosen = people.find((p) => p.u.id === sel)
  const radiusLabel = (r: Radius) => (typeof r === 'number' ? `${r} km` : t(`orbit.${r}`))

  return (
    <section className="flex flex-col gap-3">
      <div className="hero mx-4 flex flex-col gap-4 overflow-hidden rounded-[28px] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white"><Mark size={30} /></span>
          <div className="min-w-0">
            <p className="text-[20px] leading-tight font-extrabold tracking-[-0.02em]">{t('home.orbit')}</p>
            <p className="text-[14px] leading-snug font-semibold">{t('orbit.lead')}</p>
          </div>
        </div>
        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5" role="radiogroup" aria-label={t('orbit.range')}>
          {RADII.map((r) => (
            <button key={String(r)} type="button" role="radio" aria-checked={radius === r} onClick={() => { setRadius(r); setSel('') }} className={cx('press min-h-9 shrink-0 rounded-full px-3.5 text-[14px] font-bold whitespace-nowrap', radius === r ? 'bg-white text-ink' : 'bg-white/20')}>
              {radiusLabel(r)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat to="/znajomi" n={friends} label={t('home.orbitFriends')} />
          <Stat to="/znajomi" n={fof} label={t('home.orbitFof')} />
          <Stat to="/szukaj?mapa=1" n={offers.length} label={t('orbit.offers', { r: radiusLabel(radius) })} />
        </div>
      </div>

      <div className="mx-4 flex flex-col gap-3">
        <MapView center={here} points={points} selected={sel} onSelect={setSel} height={260} fitKm={typeof radius === 'number' ? radius : far} label={t('home.orbit')} />
        {chosen ? (
          <PersonCard id={chosen.u.id} km={chosen.km} offers={offersBy(chosen.u.id).length} relation={relationText(chosen.rel, chosen.u, users, t)} />
        ) : (
          <p className="px-1 text-[13px] text-muted">{t('orbit.tap')}</p>
        )}
      </div>
    </section>
  )
}

function PersonCard({ id, km, offers, relation }: { id: string; km: number; offers: number; relation: string }) {
  const { t, account, users, nameOf, shown } = useStore()
  const u = users[id]
  const mode = bestMode(km)
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar user={shown(id)} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{nameOf(id)}</p>
          <p className="truncate text-[13px] text-muted">{relation}{u.work ? ` · ${categoryById(u.work).label[account.lang]}` : ''}</p>
        </div>
        <span className="flex shrink-0 flex-col items-end">
          <span className="tnum flex items-center gap-1 text-[15px] font-extrabold"><Icon name={mode === 'walk' ? 'walk' : mode} size={16} /> {formatMinutes(minutes(km, mode))}</span>
          <span className="tnum text-[12px] text-muted">{formatDistance(km)}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/u/${id}`} className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-fill text-[14px] font-bold">
          <Icon name="list" size={16} /> {t('orbit.offersOf', { n: offers })}
        </Link>
        <a href={routeUrl(account.place, [u.place])} target="_blank" rel="noreferrer" className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-bold text-primary-ink">
          <Icon name="route" size={16} /> {t('up.route')}
        </a>
      </div>
    </div>
  )
}

function Stat({ to, n, label }: { to: string; n: number; label: string }) {
  return (
    <Link to={to} className="press flex min-w-0 flex-col rounded-[18px] bg-white/15 px-3 py-2.5 hover:bg-white/20">
      <span className="tnum text-[22px] leading-none font-extrabold">{n}</span>
      <span className="mt-1 truncate text-[12px] font-semibold">{label}</span>
    </Link>
  )
}
