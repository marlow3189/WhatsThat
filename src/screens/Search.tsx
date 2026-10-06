import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useStore } from '../data/store'
import { Group, ListingRow, Row, cx, inputCls, relationText } from '../components/ui'
import { Icon } from '../components/icons'
import { CATEGORIES, categoryById } from '../lib/categories'
import { distanceKm, formatDistance, matchesLocation, type Scope } from '../lib/geo'
import type { Circle, Kind } from '../lib/types'

const KINDS: Kind[] = ['sell', 'rent', 'service', 'give', 'swap', 'garage']
const RADII = [2, 5, 10, 25, 50, 100]

/** Szukanie: tekst, a filtry schowane w trzech prostych listach rozwijanych. */
export function Search() {
  const { t, account, users, visibleListings } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [circle, setCircle] = useState<Circle>(3)
  const [where, setWhere] = useState<string>('10')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const cat = params.get('k') ?? ''
  const sub = params.get('p') ?? ''
  const showCategories = !q && !cat
  const lang = account.lang

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

  const selectCls = 'min-h-10 w-full rounded-lg border border-line bg-surface px-2 text-[14px]'
  const category = cat ? categoryById(cat) : null

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="sticky z-20 flex flex-col gap-3 border-b border-line bg-bg/95 px-4 pt-4 pb-3 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5">
          <Icon name="search" size={20} className="text-muted" />
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchPh')} className={cx(inputCls, 'border-0 px-0')} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-semibold text-muted">
            {t('search.who')}
            <select id="who" value={circle} onChange={(e) => setCircle(Number(e.target.value) as Circle)} className={selectCls}>
              {([1, 2, 3] as Circle[]).map((c) => <option key={c} value={c}>{t(`circle.${c}`)}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-semibold text-muted">
            {t('search.where')}
            <select id="where" value={where} onChange={(e) => setWhere(e.target.value)} className={selectCls} disabled={circle < 3}>
              {RADII.map((r) => <option key={r} value={r}>{t('scope.radius', { km: r })}</option>)}
              <option value="town">{account.place.town}</option>
              <option value="voivodeship">{account.place.voivodeship}</option>
              <option value="country">{t('scope.country')}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-semibold text-muted">
            {t('search.what')}
            <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as Kind | 'all')} className={selectCls}>
              <option value="all">{t('search.all')}</option>
              {KINDS.map((k) => <option key={k} value={k}>{t(`kind.${k}`)}</option>)}
            </select>
          </label>
        </div>
      </div>

      {showCategories ? (
        <Group label={t('search.categories')}>
          {CATEGORIES.map((c) => (
            <Row key={c.id} icon={c.icon} title={c.label[lang]} onClick={() => setCat(c.id)} />
          ))}
        </Group>
      ) : (
        <>
          {category && (
            <div className="flex flex-col gap-2 px-4">
              <button type="button" onClick={() => setCat('')} className="flex items-center gap-1 self-start text-[15px] text-accent">
                <Icon name="back" size={18} /> {t('search.categories')}
              </button>
              <h1 className="text-[24px] font-bold tracking-tight">{category.label[lang]}</h1>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {[{ id: '', label: t('search.allIn') }, ...category.subs.map((s) => ({ id: s.id, label: s.label[lang] }))].map((s) => (
                  <button
                    key={s.id || 'all'}
                    type="button"
                    onClick={() => setCat(category.id, s.id)}
                    aria-pressed={sub === s.id}
                    className={cx('min-h-9 shrink-0 rounded-lg border px-3 text-[14px] whitespace-nowrap', sub === s.id ? 'border-ink bg-ink text-bg' : 'border-line bg-surface')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Group label={t('search.results', { n: results.length })}>
            {results.length ? (
              results.map(({ listing, rel, km }) => (
                <ListingRow key={listing.id} listing={listing} t={t} meta={`${formatDistance(km)} · ${relationText(rel, users[listing.ownerId], users, t)}`} />
              ))
            ) : (
              <p className="px-4 py-4 text-[15px] text-muted">{t('search.empty')}</p>
            )}
          </Group>
        </>
      )}
    </div>
  )
}
