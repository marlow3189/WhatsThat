import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Tile, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { categoryById } from '../lib/categories'
import { distanceKm, formatDistance } from '../lib/geo'

const NEARBY_KM = 15

/**
 * Główna bez przytłaczania: nowe od znajomych, potem rząd kafelków dla każdego zainteresowania.
 * Pierwszy kafelek w rzędzie to zawsze „Polecane”: firma albo ktoś z drugiej linii znajomych.
 */
export function Home() {
  const { t, locale, account, users, visibleListings, notifications, reminder, daysLeft } = useStore()
  const unread = notifications.filter((n) => !n.read).length
  const here = account.place
  const withKm = visibleListings.map((r) => ({ ...r, km: distanceKm(here, r.listing.place) }))

  const fromFriends = withKm.filter((r) => r.rel.circle === 1).sort((a, b) => b.listing.createdAt - a.listing.createdAt)
  const friendsWithNew = [...new Set(fromFriends.map((r) => r.listing.ownerId))].slice(0, 8)

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

  return (
    <div className="flex flex-col gap-7 pb-6">
      <header className="flex items-center justify-between gap-3 px-5 pt-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[15px] text-muted"><Icon name="pin" size={15} />{here.town}</p>
          <h1 className="truncate text-[34px] leading-[1.1] font-bold tracking-[-0.02em]">{t('home.hello', { name: first })}</h1>
        </div>
        <Link to="/powiadomienia" className="press card relative grid size-12 shrink-0 place-items-center rounded-full" aria-label={t('home.notifications')}>
          <Icon name="bell" size={22} />
          {unread > 0 && <span className="tnum absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[12px] font-bold text-white">{unread}</span>}
        </Link>
      </header>

      <Link to="/szukaj" className="press mx-4 flex min-h-[50px] items-center gap-2 rounded-[14px] bg-fill-strong/70 px-4 text-muted">
        <Icon name="search" size={20} />
        <span className="min-w-0 flex-1 truncate">{t('home.searchPh')}</span>
      </Link>

      {reminder && daysLeft !== null && (
        <Link to="/ja" className="press mx-4 flex items-center gap-3 rounded-[18px] bg-warn-soft px-4 py-3 text-warn">
          <Icon name="calendar" />
          <span className="flex-1 text-[15px]">{t('home.renew', { n: daysLeft })}</span>
          <span className="font-semibold">{t('home.renewCta')}</span>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle title={t('home.friendsNew')} />
        {friendsWithNew.length ? (
          <>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-5">
              {friendsWithNew.map((id) => (
                <div key={id} className="flex w-16 shrink-0 flex-col items-center gap-1">
                  <span className="rounded-full bg-accent p-[3px]"><span className="block rounded-full bg-bg p-[2px]"><Avatar user={users[id]} size={52} /></span></span>
                  <span className="w-full truncate text-center text-[12px]">{users[id].name.split(' ')[0]}</span>
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

      {rows.map(({ cat, promoted, rest }) =>
        promoted || rest.length ? (
          <section key={cat} className="flex flex-col gap-3">
            <SectionTitle title={categoryById(cat).label[account.lang]} to={`/szukaj?k=${cat}`} more={t('home.seeAll')} />
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

      <div className="mx-4 flex flex-col gap-3 rounded-[24px] bg-accent p-5 text-accent-ink">
        <p className="text-[20px] leading-tight font-bold">{t('home.invite')}</p>
        <p className="text-[15px] leading-snug opacity-80">{t('home.inviteText')}</p>
        <Link to="/znajomi" className="self-start"><Button size="sm" className="bg-[#0b0b0c]! text-white!">{t('f.invite')}</Button></Link>
      </div>

      <Link to="/ja/zainteresowania" className="self-center text-[15px] text-link">{t('home.interests')}</Link>
    </div>
  )
}

function SectionTitle({ title, to, more }: { title: string; to?: string; more?: string }) {
  return (
    <div className="flex items-baseline justify-between px-5">
      <h2 className="text-[22px] font-bold tracking-[-0.01em]">{title}</h2>
      {to && more && <Link to={to} className="text-[16px] text-link">{more}</Link>}
    </div>
  )
}

export function Carousel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('no-scrollbar flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [&>*]:snap-start', className)}>{children}</div>
}
