import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Group, ListingRow, Row, relationText, timeAgo } from '../components/ui'
import { Icon, Mark } from '../components/icons'
import { distanceKm, formatDistance } from '../lib/geo'
import { BRAND } from '../config'

const NEARBY_KM = 10

/** Spokojny start: najpierw to, co dodali znajomi, potem kilka rzeczy z okolicy. */
export function Home() {
  const { t, account, users, visibleListings, notifications } = useStore()
  const here = account.place
  const unread = notifications.filter((n) => !n.read).length

  const fromFriends = visibleListings
    .filter(({ rel }) => rel.circle === 1)
    .sort((a, b) => b.listing.createdAt - a.listing.createdAt)
    .slice(0, 5)

  const withKm = visibleListings.map((r) => ({ ...r, km: distanceKm(here, r.listing.place) }))
  const garage = withKm.filter((r) => r.listing.kind === 'garage' && r.km <= 30)
  const nearby = withKm
    .filter((r) => r.rel.circle > 1 && r.km <= NEARBY_KM && r.listing.kind !== 'garage')
    .sort((a, b) => b.listing.createdAt - a.listing.createdAt)
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-6 pb-4">
      <header className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="flex items-center gap-2 text-[22px] font-bold tracking-tight">
          <Mark /> {BRAND.name}
        </span>
        <Link to="/powiadomienia" className="relative grid size-11 place-items-center rounded-full" aria-label={t('home.notifications')}>
          <Icon name="bell" size={24} />
          {unread > 0 && <span className="tnum absolute top-1.5 right-1.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">{unread}</span>}
        </Link>
      </header>

      <Link to="/szukaj" className="mx-4 flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-muted">
        <Icon name="search" size={20} />
        <span className="min-w-0 flex-1 truncate">{t('home.searchPh')}</span>
        <span className="flex shrink-0 items-center gap-1 text-[13px]"><Icon name="pin" size={14} />{here.town}</span>
      </Link>

      <Group label={t('home.friends')}>
        {fromFriends.length ? (
          fromFriends.map(({ listing }) => (
            <ListingRow key={listing.id} listing={listing} t={t} meta={`${users[listing.ownerId].name} · ${timeAgo(listing.createdAt, t)}`} />
          ))
        ) : (
          <p className="px-4 py-4 text-[15px] text-muted">{t('home.friendsEmpty')}</p>
        )}
      </Group>

      {garage.length > 0 && (
        <Group label={t('home.garage')}>
          {garage.map(({ listing, km }) => (
            <ListingRow key={listing.id} listing={listing} t={t} meta={`${listing.place.town} · ${formatDistance(km)}`} />
          ))}
        </Group>
      )}

      <Group label={`${t('home.nearby')} · ${t('scope.radius', { km: NEARBY_KM })}`}>
        {nearby.map(({ listing, rel, km }) => (
          <ListingRow key={listing.id} listing={listing} t={t} meta={`${formatDistance(km)} · ${relationText(rel, users[listing.ownerId], users, t)}`} />
        ))}
        <Row to="/szukaj" title={<span className="text-accent">{nearby.length ? t('home.more') : t('home.browse')}</span>} />
      </Group>

      <Group>
        <Row to="/szukaj?kategorie=1" icon="list" title={t('home.browse')} />
        <Row to="/znajomi" icon="users" title={t('home.invite')} detail={t('f.reward')} />
      </Group>
    </div>
  )
}
