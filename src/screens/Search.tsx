import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useStore } from '../data/store'
import { Group, Header, Row, Segmented, Tile, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { CATEGORIES, categoryById } from '../lib/categories'
import { distanceKm, formatDistance, matchesLocation, type Scope } from '../lib/geo'
import type { Circle, Kind } from '../lib/types'

const KINDS: Kind[] = ['sell', 'rent', 'service', 'give', 'swap', 'garage', 'wanted']
const RADII = [2, 5, 10, 25, 50, 100]

/** Szukanie: pole tekstowe, krąg jako przełącznik, miejsce i rodzaj jako dwa menu. */
export function Search() {
  const { t, locale, account, users, visibleListings } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [circle, setCircle] = useState<Circle>(3)
  const [where, setWhere] = useState('10')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const cat = params.get('k') ?? ''
  const sub = params.get('p') ?? ''
  const lang = account.lang
  const showCategories = !q && !cat && kind === 'all'

  const scope: Scope = /^\d+$/.test(where) ? 'radius' : (where as Scope)
  const radiusKm = scope === 'radius' ? Number(where) : 0

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return visibleListings
      .filter(({ rel }) => rel.circle <= circle)
      .filter(({ listing, rel }) => rel.circle < 3 || matchesLocation(account.place, listing.place, { scope, radiusKm }))
      .filter(({ listing }) => kind === 'all' || listing.kind === kind)
      .filter(({ listing }) => !cat || listing.category === cat)
      .filter(({ listing }) => !sub || listing.sub === sub)
      .filter(({ listing }) => !needle || `${listing.title} ${listing.description}`.toLowerCase().includes(needle))
      .map((r) => ({ ...r, km: distanceKm(account.place, r.listing.place) }))
      .sort((a, b) => a.rel.circle - b.rel.circle || a.km - b.km)
  }, [visibleListings, circle, account.place, scope, radiusKm, kind, cat, sub, q])

  const setCat = (k: string, p = '') => {
    const next = new URLSearchParams()
    if (k) next.set('k', k)
    if (p) next.set('p', p)
    setParams(next)
  }
  const category = cat ? categoryById(cat) : null
  const menuCls = 'press min-h-9 max-w-[48%] truncate rounded-full bg-surface pr-8 pl-3.5 text-[15px] shadow-[var(--shadow)] appearance-none'

  return (
    <div className="flex flex-col gap-4 pb-6">
      {category ? <Header back title={category.label[lang]} /> : <Header large title={t('nav.search')} />}
      <div className="flex flex-col gap-3 px-4">
        <label className="flex min-h-[44px] items-center gap-2 rounded-[12px] bg-fill-strong/70 px-3 text-muted">
          <Icon name="search" size={19} />
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchPh')} className="min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-muted" />
        </label>
        <Segmented<Circle>
          label={t('search.who')}
          value={circle}
          onChange={setCircle}
          options={[1, 2, 3].map((c) => ({ value: c as Circle, label: t(`circle.${c as Circle}`) }))}
        />
        <div className="flex gap-2">
          <div className="relative">
            <select id="where" aria-label={t('search.where')} value={where} onChange={(e) => setWhere(e.target.value)} className={menuCls} disabled={circle < 3}>
              {RADII.map((r) => <option key={r} value={r}>{t('scope.radius', { km: r })}</option>)}
              <option value="town">{account.place.town}</option>
              <option value="voivodeship">{account.place.voivodeship}</option>
              <option value="country">{t('scope.country')}</option>
            </select>
            <Icon name="chevron" size={14} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-muted" />
          </div>
          <div className="relative">
            <select id="kind" aria-label={t('search.what')} value={kind} onChange={(e) => setKind(e.target.value as Kind | 'all')} className={menuCls}>
              <option value="all">{t('search.all')}</option>
              {KINDS.map((k) => <option key={k} value={k}>{t(`kind.${k}`)}</option>)}
            </select>
            <Icon name="chevron" size={14} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-muted" />
          </div>
        </div>
      </div>

      {showCategories ? (
        <Group label={t('search.categories')}>
          {CATEGORIES.map((c) => <Row key={c.id} icon={c.icon} title={c.label[lang]} onClick={() => setCat(c.id)} />)}
        </Group>
      ) : (
        <>
          {category && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
              {[{ id: '', label: t('search.all') }, ...category.subs.map((s) => ({ id: s.id, label: s.label[lang] }))].map((s) => (
                <button key={s.id || 'all'} type="button" onClick={() => setCat(category.id, s.id)} aria-pressed={sub === s.id} className={cx('press min-h-9 shrink-0 rounded-full px-3.5 text-[15px] whitespace-nowrap', sub === s.id ? 'bg-primary text-primary-ink' : 'bg-surface shadow-[var(--shadow)]')}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <p className="px-5 text-[13px] font-medium tracking-wide text-muted uppercase">{t('search.results', { n: results.length })}</p>
          {results.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4">
              {results.map(({ listing, rel, km }) => (
                <Tile key={listing.id} listing={listing} t={t} locale={locale} meta={rel.circle === 1 ? users[listing.ownerId].name.split(' ')[0] : formatDistance(km)} />
              ))}
            </div>
          ) : (
            <p className="px-5 text-muted">{t('search.empty')}</p>
          )}
        </>
      )}
    </div>
  )
}
