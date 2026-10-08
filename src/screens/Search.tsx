import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useStore } from '../data/store'
import { Group, Header, ListingRow, Row, Segmented, Tile, cx, relationText } from '../components/ui'
import { Link } from 'react-router'
import { Icon } from '../components/icons'
import { CATEGORIES, categoryById } from '../lib/categories'
import { distanceKm, formatDistance, matchesLocation, type Scope } from '../lib/geo'
import type { Circle, Kind } from '../lib/types'
import { findRecipe, plan, searchByCircle, type Hit } from '../lib/planner'
import { MapView, routeUrl, type MapPoint } from '../components/map'
import { formatMoney } from '../lib/money'
import { canListen, canSpeak, listen as listenVoice, speak, stopSpeaking } from '../lib/voice'
import { askPlanner } from '../lib/ai'
import type { Recipe } from '../lib/planner'

const KINDS: Kind[] = ['sell', 'rent', 'service', 'give', 'swap', 'garage', 'wanted']
const RADII = [2, 5, 10, 25, 50, 100, 250]

/** Szukanie: pole tekstowe, krąg jako przełącznik, miejsce i rodzaj jako dwa menu. */
export function Search() {
  const { t, locale, account, users, visibleListings } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const voice = canListen()
  /** Mikrofon: mówisz, co chcesz załatwić, tekst trafia do pola i od razu szuka. */
  const ask = async () => {
    setListening(true)
    const text = await listenVoice(locale, t('voice.prompt'))
    setListening(false)
    if (text) setQ(text)
  }
  // Wejście z mikrofonu na głównej (?mow=1): od razu słuchamy, potem usuwamy znacznik z adresu.
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !params.get('mow')) return
    started.current = true
    setParams((p) => {
      p.delete('mow')
      return p
    }, { replace: true })
    if (voice) void ask()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => void stopSpeaking(), [])
  const [circle, setCircle] = useState<Circle>(3)
  const [where, setWhere] = useState('25')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const cat = params.get('k') ?? ''
  const sub = params.get('p') ?? ''
  const lang = account.lang
  const showCategories = !q && !cat && kind === 'all' && !params.get('mapa')

  const scope: Scope = /^\d+$/.test(where) ? 'radius' : (where as Scope)
  const radiusKm = scope === 'radius' ? Number(where) : 0

  /** Wszystko, co pasuje do filtrów; słowa z pola wyszukiwania dopasowuje planer (odmiana, polskie znaki). */
  const pool = useMemo<Hit[]>(
    () =>
      visibleListings
        .filter(({ rel }) => rel.circle <= circle)
        .filter(({ listing, rel }) => rel.circle < 3 || matchesLocation(account.place, listing.place, { scope, radiusKm }))
        .filter(({ listing }) => kind === 'all' || listing.kind === kind)
        .filter(({ listing }) => !cat || listing.category === cat)
        .filter(({ listing }) => !sub || listing.sub === sub)
        .map((r) => ({ ...r, km: distanceKm(account.place, r.listing.place) }))
        .sort((a, b) => a.rel.circle - b.rel.circle || a.km - b.km),
    [visibleListings, circle, account.place, scope, radiusKm, kind, cat, sub],
  )
  const query = q.trim()
  // Plan: najpierw gotowe przepisy (od razu, bez internetu), a na żywo model AI dla innych celów.
  const [remote, setRemote] = useState<{ q: string; recipe: Recipe | null }>()
  const local = query ? findRecipe(query) : undefined
  useEffect(() => {
    if (!query || local || query.split(/\s+/).length < 2) return
    let live = true
    const id = window.setTimeout(() => askPlanner(query, lang, account.country).then((recipe) => live && setRemote({ q: query, recipe })), 700)
    return () => {
      live = false
      clearTimeout(id)
    }
  }, [query, local, lang, account.country])
  const recipe = local ?? (remote?.q === query ? remote.recipe ?? undefined : undefined)
  // W planie tylko oferty (bez „Szukam” i ogłoszeń sąsiedzkich), żeby krok nie podsuwał cudzych próśb.
  const steps = recipe ? plan(recipe, pool.filter((h) => h.listing.kind !== 'wanted' && h.listing.category !== 'community'), 4) : []
  const groups = query ? searchByCircle(query, pool) : null
  const results = groups ? [...groups.friends, ...groups.fof, ...groups.nearby] : pool
  const [view, setView] = useState<'list' | 'map'>(() => (params.get('mapa') ? 'map' : 'list'))
  const [sel, setSel] = useState('')
  const tone = (h: Hit): MapPoint['tone'] => (h.rel.circle === 1 ? 'friend' : h.rel.circle === 2 ? 'fof' : 'other')
  const short = (h: Hit) => (h.listing.price !== undefined ? formatMoney(h.listing.price, h.listing.currency ?? 'PLN', locale).replace(/[,.]00(?=\D|$)/, '') : t(`kind.${h.listing.kind}`))
  // Plan: po jednej, najlepszej ofercie na krok, z numerem kroku. Zwykłe wyszukiwanie: wyniki z ceną.
  const planStops = steps.flatMap(({ hits }, i) => (hits[0] ? [{ hit: hits[0], n: i + 1 }] : []))
  const points: MapPoint[] = recipe
    ? planStops.map(({ hit, n }) => ({ id: hit.listing.id, lat: hit.listing.place.lat, lng: hit.listing.place.lng, label: `${n}`, tone: tone(hit) }))
    : results.slice(0, 40).map((h) => ({ id: h.listing.id, lat: h.listing.place.lat, lng: h.listing.place.lng, label: short(h), tone: tone(h) }))
  const selected = sel ? (recipe ? planStops.map((x) => x.hit) : results).find((h) => h.listing.id === sel) : undefined
  /** Najtańsze oferty w kroku: porównujemy tylko w tej samej jednostce (zł za worek z zł za worek). */
  const cheapestIn = (hits: Hit[]): Set<Hit> => {
    const best = new Set<Hit>()
    const byUnit = new Map<string, Hit[]>()
    for (const h of hits) if (h.listing.price !== undefined) byUnit.set(h.listing.unit, [...(byUnit.get(h.listing.unit) ?? []), h])
    for (const group of byUnit.values()) if (group.length > 1) best.add(group.reduce((a, b) => (b.listing.price! < a.listing.price! ? b : a)))
    return best
  }
  const metaOf = (h: Hit) => (h.rel.circle === 1 ? users[h.listing.ownerId].name.split(' ')[0] : `${relationText(h.rel, users[h.listing.ownerId], users, t, h.listing.incognito)} · ${formatDistance(h.km)}`)

  const setCat = (k: string, p = '') => {
    const next = new URLSearchParams()
    if (k) next.set('k', k)
    if (p) next.set('p', p)
    setParams(next)
  }
  const category = cat ? categoryById(cat) : null
  const menuCls = 'press min-h-10 w-full truncate rounded-full bg-surface pr-8 pl-4 text-[15px] font-semibold shadow-[var(--shadow)] appearance-none'

  return (
    <div className="flex flex-col gap-4 pb-6">
      {category ? <Header back title={category.label[lang]} /> : <Header large title={t('nav.search')} />}
      <div className="flex flex-col gap-3 px-4">
        <label className="flex min-h-12 items-center gap-2 rounded-full bg-fill-strong/60 pr-1 pl-4 text-muted focus-within:ring-2 focus-within:ring-primary/25">
          <Icon name="search" size={19} />
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchPh')} className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted focus-visible:outline-none" />
          {recipe && <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary"><Icon name="sparkle" size={13} /> AI</span>}
          {voice && (
            <button type="button" onClick={ask} aria-label={t('search.voice')} aria-pressed={listening} className={cx('press grid size-10 shrink-0 place-items-center rounded-full', listening ? 'bg-danger text-white' : 'bg-primary text-primary-ink')}>
              <Icon name="mic" size={19} />
            </button>
          )}
        </label>
        <Segmented<Circle>
          label={t('search.who')}
          value={circle}
          onChange={setCircle}
          options={[1, 2, 3].map((c) => ({ value: c as Circle, label: t(`circle.${c as Circle}`) }))}
        />
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <select id="where" aria-label={t('search.where')} value={where} onChange={(e) => setWhere(e.target.value)} className={menuCls} disabled={circle < 3}>
              {RADII.map((r) => <option key={r} value={r}>{t('scope.radius', { km: r })}</option>)}
              <option value="town">{account.place.town}</option>
              <option value="voivodeship">{account.place.voivodeship}</option>
              <option value="country">{t('scope.country')}</option>
              <option value="europe">{t('scope.europe')}</option>
            </select>
            <Icon name="chevron" size={14} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-muted" />
          </div>
          <div className="relative min-w-0 flex-1">
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
                <button key={s.id || 'all'} type="button" onClick={() => setCat(category.id, s.id)} aria-pressed={sub === s.id} className={cx('press min-h-9 shrink-0 rounded-full px-3.5 text-[15px] whitespace-nowrap', sub === s.id ? 'bg-ink text-white' : 'bg-surface shadow-[var(--shadow)]')}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {(recipe || results.length > 0) && (
            <div className="px-4">
              <Segmented<'list' | 'map'> label={t('map.view')} value={view} onChange={setView} options={[{ value: 'list', label: t('map.list') }, { value: 'map', label: t('map.map') }]} />
            </div>
          )}
          {view === 'map' && (recipe || results.length > 0) && (
            <section className="flex flex-col gap-3 px-4">
              <MapView center={account.place} points={points} selected={sel} onSelect={setSel} height={340} label={t('map.map')} />
              {selected ? (
                <div className="card overflow-hidden">
                  <ListingRow listing={selected.listing} t={t} locale={locale} meta={metaOf(selected)} />
                  <a href={routeUrl(account.place, [selected.listing.place])} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 border-t border-line text-[15px] font-bold text-link">
                    <Icon name="route" size={18} /> {t('map.route')}
                  </a>
                </div>
              ) : (
                <p className="px-1 text-[14px] text-muted">{t('map.tap')}</p>
              )}
              {recipe && planStops.length > 1 && (
                <a href={routeUrl(account.place, planStops.map((x) => x.hit.listing.place))} target="_blank" rel="noreferrer" className="press flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary text-[16px] font-bold text-white">
                  <Icon name="route" size={19} /> {t('map.routeAll', { n: planStops.length })}
                </a>
              )}
            </section>
          )}
          {recipe && view === 'list' && (
            <section className="mx-4 flex flex-col gap-3 rounded-[28px] bg-lilac p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white"><Icon name="sparkle" size={20} /></span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold tracking-wide text-ink/60 uppercase">{t('plan.title')}</p>
                  <h2 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em]">{recipe.goal[lang]}</h2>
                  <p className="mt-0.5 text-[14px] leading-snug text-ink/70">{t('plan.lead')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setView('map')} className="press flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-[15px] font-bold text-link">
                  <Icon name="pin" size={18} /> {t('map.showPlan')}
                </button>
                {canSpeak() && (
                  <button
                    type="button"
                    aria-pressed={speaking}
                    onClick={() => {
                      if (speaking) {
                        setSpeaking(false)
                        return void stopSpeaking()
                      }
                      setSpeaking(true)
                      const lines = steps.map(({ step, hits }, i) => `${t('plan.step', { n: i + 1 })}: ${step.title[lang]}. ${hits[0] ? `${hits[0].listing.title}, ${metaOf(hits[0])}.` : t('plan.none')}`)
                      speak([recipe.goal[lang], ...lines].join(' '), locale).finally(() => setSpeaking(false))
                    }}
                    className={cx('press flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-bold', speaking ? 'bg-ink text-white' : 'bg-surface text-link')}
                  >
                    <Icon name="speaker" size={18} /> {t(speaking ? 'voice.stop' : 'voice.read')}
                  </button>
                )}
              </div>
              <ol className="flex flex-col gap-2.5">
                {steps.map(({ step, hits }, i) => (
                  <li key={step.id} className="overflow-hidden rounded-[20px] bg-surface">
                    <p className="flex items-center gap-2.5 px-4 pt-3 pb-1 text-[15px] font-bold">
                      <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] text-white">{i + 1}</span>
                      {step.title[lang]}
                    </p>
                    {hits.length ? (
                      <div className="[&>*+*]:border-t [&>*+*]:border-line">
                        {hits.map((h) => <ListingRow key={h.listing.id} listing={h.listing} t={t} locale={locale} meta={cheapestIn(hits).has(h) ? `${t('fuel.cheapest')} · ${metaOf(h)}` : metaOf(h)} />)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3">
                        <p className="text-[14px] text-muted">{t('plan.none')}</p>
                        <Link to={`/dodaj?t=${encodeURIComponent(step.title[lang])}`} className="shrink-0 text-[14px] font-bold text-link">{t('plan.wanted')}</Link>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <p className="px-1 text-[12px] leading-snug text-ink/60">{t('plan.note')}</p>
            </section>
          )}
          {view === 'list' && groups && !recipe && results.length > 0 && (
            <div className="flex flex-col gap-5">
              {([['search.friends', groups.friends], ['search.fof', groups.fof], ['search.nearby', groups.nearby]] as const).map(([label, hits]) =>
                hits.length ? (
                  <Group key={label} label={<span className="flex items-center gap-2">{t(label)} <span className="tnum rounded-full bg-surface px-2 text-[13px] text-muted shadow-[var(--shadow)]">{hits.length}</span></span>}>
                    {hits.map((h) => <ListingRow key={h.listing.id} listing={h.listing} t={t} locale={locale} meta={metaOf(h)} />)}
                  </Group>
                ) : null,
              )}
            </div>
          )}
          {view === 'list' && !(groups && !recipe && results.length > 0) && !recipe && <p className="px-5 text-[15px] font-bold">{t('search.results', { n: results.length })}</p>}
          {view === 'map' || recipe || (groups && results.length > 0) ? null : results.length ? (
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
