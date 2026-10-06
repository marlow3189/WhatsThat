import { useStore } from '../data/store'
import { Avatar, Group, Header, ListingRow, Row, Toggle, inputCls } from '../components/ui'
import { Icon } from '../components/icons'
import { LANGS, localeOf } from '../i18n'
import { PLANS } from '../lib/pricing'
import { VOIVODESHIPS } from '../lib/geo'
import { formatPLN } from '../lib/money'
import type { Lang } from '../lib/types'
import { ME } from '../data/seed'

export function Me() {
  const { t, account, users, listings, orders, myActive, limit, buyAnnual, setLang, setPlace, reset } = useStore()
  const me = users[ME]
  const annual = account.plan === 'annual'
  const open = orders.filter((o) => !['done', 'cancelled'].includes(o.status)).length
  const mine = listings.filter((l) => l.ownerId === ME).length

  return (
    <div className="flex flex-col gap-6 pb-6">
      <Header title={t('nav.me')} />
      <div className="flex items-center gap-3 px-4">
        <Avatar user={me} size={60} />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-semibold">{account.name}</p>
          <p className="tnum text-muted">{account.phone}</p>
          <p className="flex items-center gap-1 text-[13px] text-ok"><Icon name="shield" size={14} /> {t('me.verified')}</p>
        </div>
      </div>

      <Group label={t('me.plan')}>
        <Row
          title={annual ? t('me.planAnnual') : t('me.planFree')}
          detail={annual ? t('me.planAnnualD', { date: new Date(account.planUntil ?? 0).toLocaleDateString(localeOf(account.lang)) }) : t('me.planFreeD', { used: myActive, limit })}
        />
        {!annual && <Row onClick={buyAnnual} title={<span className="text-accent">{t('me.upgrade', { price: formatPLN(PLANS.annual.yearly) })}</span>} />}
      </Group>

      <Group>
        <Row to="/zamowienia" icon="bag" title={t('me.orders')} value={open || undefined} />
        <Row to="/moje" icon="list" title={t('me.mine')} value={mine} />
        <Row to="/znajomi" icon="users" title={t('me.friends')} />
      </Group>

      <Group label={t('me.settings')}>
        <label className="flex min-h-12 items-center gap-3 px-4 py-2">
          <Icon name="globe" className="text-muted" />
          <span className="flex-1">{t('me.lang')}</span>
          <select id="lang" value={account.lang} onChange={(e) => setLang(e.target.value as Lang)} className={`${inputCls} min-h-10 w-auto border-0 bg-transparent px-0 text-right text-muted`}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 px-4 py-2">
          <Icon name="pin" className="text-muted" />
          <span className="flex-1">{t('me.region')}</span>
          <select
            id="region"
            value={account.place.voivodeship}
            onChange={(e) => setPlace(VOIVODESHIPS.find((v) => v.voivodeship === e.target.value)!)}
            className={`${inputCls} min-h-10 w-auto max-w-[55%] border-0 bg-transparent px-0 text-right text-muted`}
          >
            {VOIVODESHIPS.map((v) => <option key={v.voivodeship} value={v.voivodeship}>{v.voivodeship === account.place.voivodeship ? account.place.town : v.voivodeship}</option>)}
          </select>
        </label>
        <Row to="/ustawienia/powiadomienia" icon="bell" title={t('me.notif')} />
        <Row to="/zaufani" icon="shield" title={t('me.trusted')} value={`${account.trusted.length}/2`} />
        <Row to="/instaluj" icon="download" title={t('me.install')} />
        <Row icon="chat" title={t('me.email')} value={account.email || t('me.noEmail')} />
      </Group>

      <Group footer={t('me.restrictD')}>
        <Row to="/zastrzez" icon="lock" title={t('me.restrict')} danger />
      </Group>

      <Group>
        <Row onClick={reset} title={<span className="text-muted">{t('me.logout')}</span>} chevron={false} />
      </Group>
    </div>
  )
}

export function MyListings() {
  const { t, listings } = useStore()
  const mine = listings.filter((l) => l.ownerId === ME)
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Header title={t('me.mine')} back />
      <Group>
        {mine.length ? mine.map((l) => <ListingRow key={l.id} listing={l} t={t} meta={t(`kind.${l.kind}`)} />) : <p className="px-4 py-4 text-muted">{t('me.noListings')}</p>}
      </Group>
    </div>
  )
}

export function NotificationSettings() {
  const { t, account, setNotif } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Header title={t('me.notif')} back />
      <Group footer={t('ob.notif.text')}>
        {(['friendsNew', 'messages', 'orders', 'fofNew', 'nearby', 'quiet'] as const).map((k) => (
          <Toggle key={k} id={`n-${k}`} label={t(`notif.${k}`)} checked={account.notif[k]} onChange={(v) => setNotif(k, v)} />
        ))}
      </Group>
    </div>
  )
}

export function Orders() {
  const { t, orders, listings, users } = useStore()
  const groups = [
    { label: t('o.buying'), items: orders.filter((o) => o.buyerId === ME) },
    { label: t('o.selling'), items: orders.filter((o) => o.sellerId === ME) },
  ]
  return (
    <div className="flex flex-col gap-6 pb-6">
      <Header title={t('me.orders')} back />
      {groups.map((g) => (
        <Group key={g.label} label={g.label}>
          {g.items.length ? (
            g.items.map((o) => {
              const l = listings.find((x) => x.id === o.listingId)
              const other = users[o.buyerId === ME ? o.sellerId : o.buyerId]
              return <Row key={o.id} to={`/zamowienie/${o.id}`} title={l?.title} detail={`${other.name} · ${t(`o.status.${o.status}`)}`} value={o.total ? formatPLN(o.total) : undefined} />
            })
          ) : (
            <p className="px-4 py-3 text-muted">{t('o.none')}</p>
          )}
        </Group>
      ))}
    </div>
  )
}
