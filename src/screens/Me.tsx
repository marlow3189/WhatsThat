import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Field, Group, Header, Input, ListingRow, Notice, Row, Toggle, cx, inputCls, money, pastelOf } from '../components/ui'
import { Icon } from '../components/icons'
import { LANGS } from '../i18n'
import { PRICES, isAvailable } from '../lib/pricing'
import { VOIVODESHIPS } from '../lib/geo'
import { CATEGORIES, FARM_TEMPLATES } from '../lib/categories'
import { KeyTerms, TermsSheet } from '../components/terms'
import type { Lang, Unit } from '../lib/types'
import { ME } from '../data/seed'

export function Me() {
  const { t, locale, account, users, orders, mine, plan, daysLeft, addedThisMonth, freeLimit, buyPlan, refresh, setLang, setPlace, reset } = useStore()
  const me = users[ME]
  const prices = PRICES[account.currency]
  const open = orders.filter((o) => !['done', 'cancelled'].includes(o.status)).length
  const date = (ms?: number) => new Date(ms ?? 0).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const fmt = (v: number) => money(v, account.currency, locale)

  return (
    <div className="flex flex-col gap-7 pb-8">
      <Header large title={t('nav.me')} />
      <div className="card mx-4 flex items-center gap-4 p-4">
        <Avatar user={me} size={64} />
        <div className="min-w-0">
          <p className="truncate text-[22px] font-bold">{account.name}</p>
          <p className="tnum text-muted">{account.phone}</p>
          <p className="flex items-center gap-1 text-[14px] text-ok"><Icon name="shield" size={15} /> {t('me.verified')}</p>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="px-5 text-[15px] font-bold">{t('me.plan')}</h2>
        <div className={cx('mx-4 flex flex-col gap-3 rounded-[24px] p-5', plan === 'free' ? 'card' : 'bg-accent text-accent-ink')}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[22px] font-bold">{plan === 'free' ? t('me.planFree') : plan === 'annual' ? t('me.planAnnual') : t('me.planBusiness')}</p>
            {plan !== 'free' && daysLeft !== null && daysLeft <= 30 && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[13px] font-semibold text-white">{t('me.planEnds', { n: daysLeft })}</span>}
          </div>
          <p className={cx('text-[15px] leading-snug', plan === 'free' ? 'text-muted' : 'opacity-80')}>
            {plan === 'free'
              ? t('me.planFreeD', { used: addedThisMonth, limit: freeLimit, date: date(account.refreshDue), price: fmt(prices.refresh) })
              : t('me.planUntil', { date: date(account.planUntil) })}
          </p>
          {plan === 'free' ? (
            <>
              <Button onClick={() => buyPlan('annual')}>{t('me.upgrade', { price: fmt(prices.annual) })}</Button>
              <Button variant="secondary" onClick={() => buyPlan('business')}>{t('me.upgradeBusiness', { price: fmt(prices.business) })}</Button>
              <button type="button" onClick={refresh} className="min-h-10 text-[14px] font-semibold text-link">{t('me.refresh', { price: fmt(prices.refresh) })}</button>
            </>
          ) : (
            <Button className="bg-ink! text-white!" onClick={() => buyPlan(plan)}>{t('me.renew', { price: fmt(plan === 'annual' ? prices.annual : prices.business) })}</Button>
          )}
        </div>
      </section>

      <Group>
        <Row to="/ja/stragan" icon="store" iconBg="bg-accent" title={t('me.panel')} detail={t('me.panelD')} />
        <Row to="/ja/platnosci" icon="card" title={t('me.payouts')} value={account.kyc === 'verified' ? <Icon name="check" className="text-ok" strokeWidth={2.4} /> : t('kyc.none')} />
        <Row to="/zamowienia" icon="bag" title={t('me.orders')} value={open || undefined} />
        <Row to="/moje" icon="list" title={t('me.mine')} value={mine.length} />
        <Row to="/znajomi" icon="users" title={t('me.invite')} detail={t('home.inviteText')} />
      </Group>

      <Group label={t('me.settings')}>
        <label className="flex min-h-[52px] items-center gap-3 px-4 py-1.5">
          <span className={cx('grid size-9 place-items-center rounded-full', pastelOf('globe'))}><Icon name="globe" size={18} /></span>
          <span className="flex-1">{t('me.lang')}</span>
          <select id="lang" value={account.lang} onChange={(e) => setLang(e.target.value as Lang)} className="max-w-[50%] bg-transparent text-right text-[16px] text-muted outline-none">
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        {account.country === 'PL' && (
          <label className="flex min-h-[52px] items-center gap-3 px-4 py-1.5">
            <span className={cx('grid size-9 place-items-center rounded-full', pastelOf('pin'))}><Icon name="pin" size={18} /></span>
            <span className="flex-1">{t('me.region')}</span>
            <select id="region" value={account.place.voivodeship} onChange={(e) => setPlace({ ...VOIVODESHIPS.find((v) => v.voivodeship === e.target.value)!, country: 'PL' })} className="max-w-[55%] bg-transparent text-right text-[16px] text-muted outline-none">
              {VOIVODESHIPS.map((v) => <option key={v.voivodeship} value={v.voivodeship}>{v.voivodeship === account.place.voivodeship ? account.place.town : v.voivodeship}</option>)}
            </select>
          </label>
        )}
        <Row to="/ja/zainteresowania" icon="list" title={t('home.interests')} />
        <Row to="/ustawienia/powiadomienia" icon="bell" title={t('me.notif')} />
        <Row to="/ja/ukryte" icon="eyeoff" title={t('me.muted')} value={account.muted.length || undefined} />
        <Row to="/zaufani" icon="shield" title={t('me.trusted')} value={`${account.trusted.length}/2`} />
        <Row to="/instaluj" icon="download" title={t('me.install')} />
        <Row to="/ja/prywatnosc" icon="lock" title={t('me.privacy')} />
        <Row to="/ja/regulamin" icon="doc" title={t('me.terms')} />
      </Group>

      <Group footer={t('me.restrictD')}>
        <Row to="/zastrzez" icon="lock" title={t('me.restrict')} danger />
      </Group>

      <Group>
        <Row to="/operator" icon="chart" title="Panel operatora (demo)" detail="DAC7, zgłoszenia DSA, plany, koszty" />
        <Row onClick={reset} title={<span className="text-danger">{t('me.logout')}</span>} chevron={false} />
      </Group>
    </div>
  )
}

/** „Mój stragan”: rolnik prowadzi sprzedaż z jednego ekranu. */
export function Stall() {
  const { t, locale, account, mine, orders, listings, users, updateListing, advanceOrder, addListing, canAdd, buyPlan } = useStore()
  const [adding, setAdding] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [unit, setUnit] = useState<Unit>('kg')
  const [hours, setHours] = useState(mine.find((l) => l.pickupHours)?.pickupHours ?? 'pon–sob 16:00–19:00')
  const lang = account.lang
  const selling = orders.filter((o) => o.sellerId === ME)
  const toPack = selling.filter((o) => o.status === 'paid' || (o.status === 'accepted' && o.pay === 'cash'))
  const waiting = selling.filter((o) => o.status === 'ready')
  const weekAgo = Date.now() - 7 * 86_400_000
  const week = selling.filter((o) => (o.paidAt ?? o.createdAt) > weekAgo && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const fmt = (v: number) => money(v, account.currency, locale)
  const products = mine.filter((l) => l.kind === 'sell')

  const create = () => {
    const tpl = FARM_TEMPLATES.find((f) => f.id === adding)
    const title = tpl ? tpl.label[lang] : customName.trim()
    const p = Number(price.replace(',', '.'))
    if (!title || !(p > 0)) return
    addListing({
      kind: 'sell', category: 'farm', sub: tpl?.sub ?? 'other', title, description: '', price: Math.round(p * 100), currency: account.currency,
      unit: tpl?.unit ?? unit, stock: stock ? Number(stock.replace(',', '.')) : undefined, pickupHours: hours, delivery: ['pickup'],
      place: account.place, visibility: 3,
    })
    setAdding(null)
    setPrice('')
    setStock('')
    setCustomName('')
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Header back title={t('p.title')} />
      <div className="grid grid-cols-3 gap-2 px-4">
        {[
          { n: toPack.length, l: t('p.toPack') },
          { n: waiting.length, l: t('p.waiting') },
          { n: fmt(week), l: t('p.week') },
        ].map((s) => (
          <div key={s.l} className="card flex flex-col gap-1 p-3">
            <span className="tnum truncate text-[22px] font-bold">{s.n}</span>
            <span className="text-[12px] leading-tight text-muted">{s.l}</span>
          </div>
        ))}
      </div>

      {account.kyc !== 'verified' && (
        <div className="px-4"><Notice tone="info" icon="card"><Link to="/ja/platnosci" className="text-link">{t('kyc.title')}</Link>: {t('kyc.none')}</Notice></div>
      )}

      <Group label={t('p.toPack')}>
        {toPack.length ? (
          toPack.map((o) => {
            const l = listings.find((x) => x.id === o.listingId)
            return (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l?.title}</span>
                  <span className="tnum block text-[14px] text-muted">{[users[o.buyerId].name, l && l.unit !== 'fixed' && `${String(o.qty).replace('.', ',')} ${t(`unit.${l.unit}`)}`, fmt(o.total)].filter(Boolean).join(' · ')}</span>
                </span>
                <Button size="sm" onClick={() => advanceOrder(o.id, 'ready')}>{t('o.step.ready')}</Button>
              </div>
            )
          })
        ) : (
          <p className="px-4 py-3 text-muted">{t('p.nothing')}</p>
        )}
      </Group>

      <Group label={t('p.products')}>
        {products.length ? (
          products.map((l) => (
            <div key={l.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.title}</span>
                  <span className="tnum block text-[14px] text-muted">{l.price !== undefined && `${fmt(l.price)} / ${t(`unit.${l.unit}`)}`}</span>
                </span>
                <label className="flex items-center gap-2 text-[13px] text-muted">
                  {t('p.availableToday')}
                  <input type="checkbox" checked={!l.paused && isAvailable({ ...l, paused: false })} onChange={(e) => updateListing(l.id, { paused: !e.target.checked })} className="size-5 accent-[var(--switch)]" />
                </label>
              </div>
              {l.stock !== undefined && (
                <div className="flex items-center justify-between rounded-[12px] bg-fill p-1">
                  <button type="button" className="press grid size-9 place-items-center rounded-[9px] bg-surface" onClick={() => updateListing(l.id, { stock: Math.max(0, (l.stock ?? 0) - 10), status: 'active' })} aria-label="−10"><Icon name="minus" size={18} /></button>
                  <span className="tnum text-[15px]">{t('p.stock')}: <strong>{l.stock}</strong> {t(`unit.${l.unit}`)}</span>
                  <button type="button" className="press grid size-9 place-items-center rounded-[9px] bg-surface" onClick={() => updateListing(l.id, { stock: (l.stock ?? 0) + 10, status: 'active' })} aria-label="+10"><Icon name="plus" size={18} /></button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="px-4 py-3 text-muted">{t('p.empty')}</p>
        )}
      </Group>

      <section className="flex flex-col gap-3">
        <h2 className="px-5 text-[15px] font-bold">{t('p.quickAdd')}</h2>
        {canAdd ? (
          <>
            <div className="no-scrollbar flex flex-wrap gap-2 px-4">
              {FARM_TEMPLATES.map((f) => (
                <button key={f.id} type="button" onClick={() => setAdding(f.id)} aria-pressed={adding === f.id} className={cx('press min-h-9 rounded-full px-3.5 text-[15px]', adding === f.id ? 'bg-ink text-white' : 'bg-surface shadow-[var(--shadow)]')}>
                  {f.label[lang]}
                </button>
              ))}
              <button type="button" onClick={() => setAdding('other')} aria-pressed={adding === 'other'} className={cx('press min-h-9 rounded-full px-3.5 text-[15px]', adding === 'other' ? 'bg-ink text-white' : 'bg-accent text-accent-ink')}>
                + {t('p.other')}
              </button>
            </div>
            {adding && (
              <div className="card mx-4 flex flex-col gap-3 p-4">
                {adding === 'other' && <Field id="pname" label={t('a.titleLabel')}><Input id="pname" value={customName} onChange={(e) => setCustomName(e.target.value)} className="bg-fill shadow-none" /></Field>}
                <div className="grid grid-cols-3 gap-2">
                  <Field id="pprice" label={t('a.price')}><Input id="pprice" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="tnum bg-fill shadow-none" /></Field>
                  {adding === 'other' ? (
                    <Field id="punit" label={t('a.unit')}>
                      <select id="punit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={cx(inputCls, 'bg-fill shadow-none')}>
                        {(['kg', 'item', 'pack', 'litre', 'fixed'] as Unit[]).map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
                      </select>
                    </Field>
                  ) : (
                    <Field id="punit2" label={t('a.unit')}><div id="punit2" className="flex min-h-[50px] items-center px-2 text-muted">{t(`unit.${FARM_TEMPLATES.find((f) => f.id === adding)!.unit}`)}</div></Field>
                  )}
                  <Field id="pstock" label={t('p.stock')}><Input id="pstock" inputMode="decimal" value={stock} onChange={(e) => setStock(e.target.value)} className="tnum bg-fill shadow-none" /></Field>
                </div>
                <Button onClick={create}>{t('p.add')}</Button>
              </div>
            )}
          </>
        ) : (
          <div className="card mx-4 flex flex-col gap-3 p-4">
            <p className="text-[15px] text-muted">{t('a.limitTitle')}</p>
            <Button onClick={() => buyPlan('annual')}>{t('a.buyAnnual', { price: money(PRICES[account.currency].annual, account.currency, locale) })}</Button>
          </div>
        )}
      </section>

      <div className="px-4">
        <Field id="hours" label={t('p.hours')}>
          <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} onBlur={() => products.forEach((l) => updateListing(l.id, { pickupHours: hours }))} />
        </Field>
      </div>

      <Group label={t('p.faq')}>
        {(['p.faq1', 'p.faq2', 'p.faq3', 'p.faq4'] as const).map((k) => <Row key={k} icon="info" title={<span className="text-[15px] leading-snug">{t(k)}</span>} />)}
      </Group>
    </div>
  )
}

/** Weryfikacja robi operator płatności; my tylko otwieramy jego formularz. */
export function Payouts() {
  const { t, account, startKyc } = useStore()
  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={t('kyc.title')} />
      <div className="flex flex-col gap-4 px-4">
        <p className="text-[17px] leading-snug">{t('kyc.text')}</p>
        {account.kyc === 'verified' ? (
          <Notice tone="ok" icon="check">{t('kyc.ok')}</Notice>
        ) : account.kyc === 'pending' ? (
          <Notice tone="info" icon="info">{t('kyc.pending')}</Notice>
        ) : (
          <Button onClick={startKyc}>{t('kyc.start')}</Button>
        )}
        <p className="text-[14px] text-muted">{t('kyc.dac7')}</p>
      </div>
    </div>
  )
}

export function Interests() {
  const { t, account, setInterests } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('home.interests')} />
      <div className="mx-4 flex items-start gap-3 rounded-[24px] bg-sun p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface"><Icon name="house" size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2"><span className="font-bold">{t('ob.interests.neighbors')}</span><Icon name="lock" size={16} className="text-ink/60" /></span>
          <span className="mt-1 block text-[14px] leading-snug text-ink/75">{t('ob.interests.neighborsD')}</span>
          <Link to="/ja/ukryte" className="mt-2 inline-block text-[14px] font-bold text-link">{t('me.muted')}</Link>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-4">
        {CATEGORIES.filter((c) => c.id !== 'other').map((c) => {
          const on = account.interests.includes(c.id)
          return (
            <button key={c.id} type="button" aria-pressed={on} onClick={() => setInterests(on ? account.interests.filter((x) => x !== c.id) : [...account.interests, c.id])} className={cx('press flex min-h-[64px] items-center gap-2.5 rounded-[18px] px-3.5 text-left text-[15px] font-medium', on ? 'bg-surface font-bold shadow-[var(--shadow)] ring-2 ring-ink' : 'bg-fill text-ink/55')}>
              <Icon name={c.icon} size={22} />
              <span className="min-w-0 leading-tight">{c.label[account.lang]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Muted() {
  const { t, account, users, mute } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.muted')} />
      <Group>
        {account.muted.length ? (
          account.muted.map((id) => <Row key={id} title={users[id]?.name} value={<span className="text-link">{t('l.unmute').split(' ')[0]}</span>} onClick={() => mute(id, false)} chevron={false} />)
        ) : (
          <p className="px-4 py-3 text-muted">{t('mu.empty')}</p>
        )}
      </Group>
    </div>
  )
}

export function Privacy() {
  const { t, reset } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.privacy')} />
      <Group>
        {(['pr.1', 'pr.2', 'pr.3'] as const).map((k) => <Row key={k} icon="lock" title={<span className="text-[15px] leading-snug">{t(k)}</span>} />)}
      </Group>
      <Group>
        <Row icon="phone" title={t('pr.clear')} onClick={reset} chevron={false} />
        <Row icon="lock" title={t('pr.delete')} danger onClick={reset} chevron={false} />
      </Group>
    </div>
  )
}

export function Terms() {
  const { t, account } = useStore()
  const [full, setFull] = useState(false)
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.terms')} />
      <div className="flex flex-col gap-3 px-4">
        <KeyTerms t={t} />
        <Button variant="secondary" onClick={() => setFull(true)}><Icon name="doc" size={18} /> {t('ob.terms.read')}</Button>
        <p className="px-1 text-[13px] text-muted">{t('terms.contact')}</p>
      </div>
      {full && <TermsSheet lang={account.lang} t={t} onClose={() => setFull(false)} />}
    </div>
  )
}

export function MyListings() {
  const { t, locale, mine } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.mine')} />
      <Group>
        {mine.length ? mine.map((l) => <ListingRow key={l.id} listing={l} t={t} locale={locale} meta={[t(`kind.${l.kind}`), l.incognito && t('a.incognito'), l.status !== 'active' && t(`status.${l.status === 'sold' ? 'sold' : 'reserved'}`)].filter(Boolean).join(' · ')} />) : <p className="px-4 py-3 text-muted">{t('me.noListings')}</p>}
      </Group>
    </div>
  )
}

export function NotificationSettings() {
  const { t, account, setNotif } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.notif')} />
      <Group footer={t('ob.notif.text')}>
        {(['friendsNew', 'messages', 'orders', 'fofNew', 'nearby', 'quiet'] as const).map((k) => (
          <Toggle key={k} id={`n-${k}`} label={t(`notif.${k}`)} checked={account.notif[k]} onChange={(v) => setNotif(k, v)} />
        ))}
      </Group>
    </div>
  )
}

export function Orders() {
  const { t, locale, orders, listings, users } = useStore()
  const groups = [
    { label: t('o.buying'), items: orders.filter((o) => o.buyerId === ME) },
    { label: t('o.selling'), items: orders.filter((o) => o.sellerId === ME) },
  ]
  return (
    <div className="flex flex-col gap-6 pb-8">
      <Header back title={t('me.orders')} />
      {groups.map((g) => (
        <Group key={g.label} label={g.label}>
          {g.items.length ? (
            g.items.map((o) => {
              const l = listings.find((x) => x.id === o.listingId)
              const other = users[o.buyerId === ME ? o.sellerId : o.buyerId]
              return <Row key={o.id} to={`/zamowienie/${o.id}`} title={l?.title} detail={`${other.name} · ${t(`o.status.${o.status}`)}`} value={o.total ? money(o.total, o.currency, locale) : undefined} />
            })
          ) : (
            <p className="px-4 py-3 text-muted">{t('o.none')}</p>
          )}
        </Group>
      ))}
    </div>
  )
}
