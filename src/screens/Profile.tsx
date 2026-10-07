import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Header, Input, Tile, cx, relationText } from '../components/ui'
import { Icon } from '../components/icons'
import { routeUrl } from '../components/map'
import { categoryById } from '../lib/categories'
import { distanceKm, formatDistance } from '../lib/geo'
import { formatMinutes, minutes, type Mode } from '../lib/travel'
import { isOpen, maskPhone } from '../lib/privacy'
import { ME } from '../data/seed'

const MODES: Mode[] = ['walk', 'bike', 'car']

/**
 * Profil osoby albo firmy z orbity: kto to (znajomy z imienia, reszta po pseudonimie), ile minut dojazdu,
 * kiedy sprzedaje (np. piekarz 6–13), co oferuje i co umie. Gwiazdka dodaje do ulubionych z tematem.
 */
export function Profile() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { t, locale, account, users, relation, visibleListings, nameOf, shown, toggleFavorite, openChat } = useStore()
  const [topic, setTopic] = useState('')
  const [asking, setAsking] = useState(false)
  const u = users[id]
  if (!u || id === ME) return <><Header back title="" /><p className="p-6 text-muted">{t('l.missing')}</p></>

  const rel = relation(id)
  const km = distanceKm(account.place, u.place)
  const offers = visibleListings.filter((r) => r.listing.ownerId === id && !r.listing.incognito).map((r) => r.listing)
  const fav = account.favorites.find((f) => f.id === id)
  const open = isOpen(u.hours)
  const friend = rel.circle === 1
  const write = () => offers[0] && nav(`/czat/${openChat(offers[0])}`)

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={nameOf(id)} />
      <section className="card mx-4 flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar user={shown(id)} size={64} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[20px] font-extrabold">{nameOf(id)}</p>
            <p className="truncate text-[14px] text-muted">{relationText(rel, u, users, t)}</p>
            {!friend && !u.business && <p className="tnum text-[13px] text-muted">{maskPhone(u.phone)} · {t('up.anon')}</p>}
          </div>
          <button
            type="button"
            onClick={() => (fav ? toggleFavorite(id) : setAsking(true))}
            aria-pressed={!!fav}
            aria-label={t(fav ? 'fav.remove' : 'fav.add')}
            className={cx('press grid size-11 shrink-0 place-items-center rounded-full', fav ? 'bg-accent text-accent-ink' : 'bg-fill text-muted')}
          >
            <Icon name="star" size={22} fill={fav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {asking && !fav && (
          <div className="flex flex-col gap-2 rounded-[18px] bg-fill p-3">
            <label htmlFor="topic" className="text-[14px] font-bold">{t('fav.topic')}</label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('fav.topicPh')} />
            <Button size="sm" className="min-h-11" onClick={() => { toggleFavorite(id, topic); setAsking(false) }}><Icon name="star" size={17} /> {t('fav.add')}</Button>
          </div>
        )}
        {fav?.topic && <p className="flex items-center gap-2 text-[15px] font-semibold"><Icon name="star" size={16} className="text-accent" /> {fav.topic}</p>}

        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <div key={m} className="flex flex-col items-center gap-1 rounded-[16px] bg-fill px-2 py-2.5">
              <Icon name={m === 'walk' ? 'walk' : m} size={20} />
              <span className="tnum text-[15px] font-extrabold">{formatMinutes(minutes(km, m))}</span>
              <span className="text-[12px] text-muted">{t(`go.${m}`)}</span>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-muted">{formatDistance(km)} · {t('up.eta')}</p>

        {u.hours && (
          <p className="flex items-center gap-2 text-[15px]">
            <Icon name="calendar" size={18} /> {u.hours}
            {open !== undefined && <span className={cx('rounded-full px-2.5 py-0.5 text-[12px] font-bold', open ? 'bg-ok-soft text-ok' : 'bg-fill text-muted')}>{t(open ? 'fav.open' : 'fav.closed')}</span>}
          </p>
        )}
        {u.work && <p className="flex items-center gap-2 text-[15px]"><Icon name={categoryById(u.work).icon} size={18} /> {t('up.work', { what: categoryById(u.work).label[account.lang] })}</p>}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" className="min-h-11" disabled={!offers.length} onClick={write}><Icon name="chat" size={17} /> {t('st.reply')}</Button>
          <a href={routeUrl(account.place, [u.place])} target="_blank" rel="noreferrer" className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-bold text-primary-ink">
            <Icon name="route" size={17} /> {t('up.route')}
          </a>
        </div>
        {!u.business && <p className="text-[12px] leading-snug text-muted">{t('up.approx')}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-5 text-[18px] font-extrabold">{t('up.offers', { n: offers.length })}</h2>
        {offers.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 sm:grid-cols-3">
            {offers.map((l) => <Tile key={l.id} listing={l} t={t} locale={locale} />)}
          </div>
        ) : (
          <p className="px-5 text-muted">{t('up.none')}</p>
        )}
      </section>
    </div>
  )
}
