import { useState } from 'react'
import { useStore } from '../data/store'
import { Button, Header, Input, Notice, Segmented, Sheet, cx, timeAgo } from '../components/ui'
import { Icon } from '../components/icons'
import { MapView, routeUrl } from '../components/map'
import { distanceKm, formatDistance } from '../lib/geo'
import { formatMinutes, minutes } from '../lib/travel'
import { FUELS, formatFuel, type Fuel as FuelType } from '../lib/fuel'

/**
 * Paliwa w okolicy: najtańsza stacja dla wybranego paliwa, odległość i minuty dojazdu, źródło ceny.
 * Stacje mogą podawać ceny przez API (albo w panelu), kierowcy zgłaszają zmiany. Ceny orientacyjne są tak oznaczone.
 */
export function Fuel() {
  const { t, account, stations, reportFuel } = useStore()
  const [fuel, setFuel] = useState<FuelType>('pb95')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [sel, setSel] = useState('')
  const [report, setReport] = useState('')
  const [value, setValue] = useState('')
  const [panel, setPanel] = useState(false)
  const [error, setError] = useState(false)

  const list = stations
    .filter((s) => s.prices[fuel] !== undefined)
    .map((s) => ({ ...s, km: distanceKm(account.place, s.place) }))
    .sort((a, b) => a.prices[fuel]! - b.prices[fuel]! || a.km - b.km)
  const best = list[0]?.prices[fuel]

  const send = (id: string) => {
    const grosze = Math.round(Number(value.replace(',', '.')) * 100)
    const ok = reportFuel(id, fuel, grosze)
    setError(!ok)
    if (ok) {
      setReport('')
      setValue('')
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('fuel.title')} />
      <div className="flex flex-col gap-3 px-4">
        <Segmented<FuelType> label={t('fuel.title')} value={fuel} onChange={setFuel} options={FUELS.map((f) => ({ value: f, label: t(`fuel.${f}`) }))} />
        <Segmented<'list' | 'map'> label={t('map.view')} value={view} onChange={setView} options={[{ value: 'list', label: t('map.list') }, { value: 'map', label: t('map.map') }]} />
        <p className="px-1 text-[13px] leading-snug text-muted">{t('fuel.note')}</p>
      </div>

      {view === 'map' && (
        <div className="px-4">
          <MapView center={account.place} points={list.map((s) => ({ id: s.id, lat: s.place.lat, lng: s.place.lng, label: formatFuel(s.prices[fuel]!), tone: s.prices[fuel] === best ? 'friend' : 'other' }))} selected={sel} onSelect={setSel} height={300} label={t('fuel.title')} />
        </div>
      )}

      <section className="card mx-4 overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
        {list.map((s) => (
          <div key={s.id} className={cx('flex flex-col gap-2 px-4 py-3', sel === s.id && 'bg-fill')}>
            <button type="button" onClick={() => setSel(sel === s.id ? '' : s.id)} className="flex w-full items-center gap-3 text-left">
              <span className={cx('grid size-10 shrink-0 place-items-center rounded-[12px]', s.prices[fuel] === best ? 'tile-2' : 'tile-5')}><Icon name="fuel" size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{s.name}</span>
                <span className="block truncate text-[13px] text-muted">{formatDistance(s.km)} · {formatMinutes(minutes(s.km, 'car'))} {t('go.car')}</span>
                <span className="block truncate text-[12px] text-muted">{t(`fuel.src.${s.source}`)} · {timeAgo(s.updatedAt, t)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="tnum text-[19px] font-extrabold">{formatFuel(s.prices[fuel]!)}</span>
                {s.prices[fuel] === best && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">{t('fuel.cheapest')}</span>}
              </span>
            </button>
            {sel === s.id && (
              <div className="flex flex-wrap gap-2">
                <a href={routeUrl(account.place, [s.place])} target="_blank" rel="noreferrer" className="press inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-[14px] font-bold text-primary-ink"><Icon name="route" size={16} /> {t('up.route')}</a>
                <button type="button" onClick={() => setReport(s.id)} className="press inline-flex min-h-10 items-center gap-2 rounded-full bg-surface px-4 text-[14px] font-bold shadow-[var(--shadow)]"><Icon name="camera" size={16} /> {t('fuel.report')}</button>
              </div>
            )}
            {report === s.id && (
              <div className="flex gap-2">
                <Input aria-label={t('fuel.report')} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="5,89" className="tnum flex-1" />
                <Button size="sm" className="min-h-[50px]" onClick={() => send(s.id)}>{t('save')}</Button>
              </div>
            )}
            {report === s.id && error && <p className="text-[13px] text-danger">{t('fuel.invalid')}</p>}
          </div>
        ))}
      </section>

      <section className="mx-4 flex items-start gap-3 rounded-[24px] bg-surface p-4 shadow-[var(--shadow)]">
        <span className="tile-1 grid size-10 shrink-0 place-items-center rounded-[12px]"><Icon name="store" size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{t('fuel.forStations')}</span>
          <span className="block text-[14px] leading-snug text-muted">{t('fuel.forStationsD')}</span>
          <button type="button" onClick={() => setPanel(true)} className="mt-2 min-h-10 text-[15px] font-bold text-link">{t('fuel.panel')}</button>
        </span>
      </section>

      {panel && <StationPanel onClose={() => setPanel(false)} />}
    </div>
  )
}

/** Panel stacji (demo): stacja wpisuje ceny ręcznie albo wysyła je ze swojego systemu przez API. */
function StationPanel({ onClose }: { onClose: () => void }) {
  const { t, stations, reportFuel } = useStore()
  const [id, setId] = useState(stations[0]?.id ?? '')
  const [vals, setVals] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const station = stations.find((s) => s.id === id)
  const save = () => {
    let ok = true
    for (const f of FUELS) {
      const v = vals[f]
      if (v) ok = reportFuel(id, f, Math.round(Number(v.replace(',', '.')) * 100), 'station') && ok
    }
    setDone(ok)
  }
  return (
    <Sheet title={t('fuel.panel')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <select aria-label={t('fuel.station')} value={id} onChange={(e) => { setId(e.target.value); setDone(false) }} className="min-h-[50px] rounded-[14px] bg-surface px-4 text-[16px] shadow-[var(--shadow)]">
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          {FUELS.map((f) => (
            <label key={f} className="flex flex-col gap-1 text-[13px] font-semibold text-muted">
              {t(`fuel.${f}`)}
              <Input inputMode="decimal" value={vals[f] ?? ''} placeholder={station?.prices[f] ? (station.prices[f]! / 100).toFixed(2).replace('.', ',') : '—'} onChange={(e) => setVals((v) => ({ ...v, [f]: e.target.value }))} className="tnum" />
            </label>
          ))}
        </div>
        <Button onClick={save}>{t('save')}</Button>
        {done && <Notice tone="ok" icon="check">{t('fuel.saved')}</Notice>}
        <p className="px-1 text-[13px] font-bold">{t('fuel.api')}</p>
        <pre className="overflow-x-auto rounded-[14px] bg-ink p-3 text-[12px] leading-relaxed text-white">{`curl -X POST https://<projekt>.supabase.co/functions/v1/fuel-prices \\
  -H "Authorization: Bearer <klucz-stacji>" \\
  -H "Content-Type: application/json" \\
  -d '{"pb95": 5.89, "on": 5.99, "lpg": 2.79}'`}</pre>
      </div>
    </Sheet>
  )
}
