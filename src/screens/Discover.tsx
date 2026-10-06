import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useStore, useVisibleListings } from '../data/store'
import { CATEGORIES, Chip, ListingCard, MODE_LABEL, Rings, Segmented } from '../components/ui'
import { distanceKm, formatDistance, matchesLocation, nearestCity, type Scope } from '../lib/geo'
import type { Category, Circle, Mode } from '../lib/types'

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'radius', label: 'Promień' },
  { value: 'city', label: 'Miasto' },
  { value: 'voivodeship', label: 'Województwo' },
  { value: 'country', label: 'Kraj' },
]

export function Discover() {
  const { here, setHere, users } = useStore()
  const all = useVisibleListings()
  const [circle, setCircle] = useState<Circle>(3)
  const [mode, setMode] = useState<Mode | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [scope, setScope] = useState<Scope>('radius')
  const [radiusKm, setRadiusKm] = useState(10)
  const [q, setQ] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all
      .filter(({ rel }) => rel.circle <= circle)
      // znajomych pokazujemy niezależnie od odległości, filtr miejsca dotyczy marketu
      .filter(({ listing, rel }) => rel.circle < 3 || matchesLocation(here, listing.place, { scope, radiusKm }))
      .filter(({ listing }) => mode === 'all' || listing.mode === mode)
      .filter(({ listing }) => category === 'all' || listing.category === category)
      .filter(({ listing }) => !needle || `${listing.title} ${listing.description}`.toLowerCase().includes(needle))
      .map((r) => ({ ...r, km: distanceKm(here, r.listing.place) }))
      .sort((a, b) => {
        const boostA = (a.listing.boostedUntil ?? 0) > Date.now() ? 1 : 0
        const boostB = (b.listing.boostedUntil ?? 0) > Date.now() ? 1 : 0
        return boostB - boostA || a.rel.circle - b.rel.circle || a.km - b.km
      })
  }, [all, circle, here, scope, radiusKm, mode, category, q])

  const fromFriends = all.filter(({ rel }) => rel.circle === 1).length

  const locate = () => {
    setLocError('')
    if (!('geolocation' in navigator)) return setLocError('To urządzenie nie udostępnia lokalizacji.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHere(nearestCity(pos.coords.latitude, pos.coords.longitude))
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocError('Brak zgody na lokalizację. Szukam od miasta z profilu.')
      },
      { timeout: 8000 },
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-2xl font-extrabold tracking-tight">WhatsThat</span>
        </div>
        <button type="button" onClick={locate} className="flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
          <span className="truncate">{locating ? 'Szukam…' : here.city}</span>
        </button>
      </div>
      {locError && <p className="-mt-2 text-sm text-warn">{locError}</p>}

      <label className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input id="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Wiertarka, namiot, przyczepka…" className="min-h-12 w-full bg-transparent outline-none placeholder:text-muted" />
      </label>

      <Segmented<Circle>
        label="Krąg"
        value={circle}
        onChange={setCircle}
        options={[
          { value: 1, label: <><Rings circle={1} /> Znajomi</> },
          { value: 2, label: <><Rings circle={2} /> Ich znajomi</> },
          { value: 3, label: <><Rings circle={3} /> Market</> },
        ]}
      />

      {circle === 3 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {SCOPES.map((s) => (
              <Chip key={s.value} active={scope === s.value} onClick={() => setScope(s.value)}>
                {s.value === 'city' ? here.city : s.value === 'voivodeship' ? `woj. ${here.voivodeship}` : s.label}
              </Chip>
            ))}
          </div>
          {scope === 'radius' && (
            <label htmlFor="radius" className="flex items-center gap-3 text-sm">
              <span className="text-muted">Do</span>
              <input id="radius" type="range" min={1} max={100} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="flex-1" />
              <span className="tnum w-14 text-right font-semibold">{radiusKm} km</span>
            </label>
          )}
          <p className="text-xs text-muted">Ogłoszenia znajomych widzisz zawsze, filtr miejsca dotyczy marketu.</p>
        </div>
      )}

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={mode === 'all'} onClick={() => setMode('all')}>Wszystko</Chip>
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <Chip key={m} active={mode === m} onClick={() => setMode(m)}>{MODE_LABEL[m]}</Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 -mt-1 flex gap-2 overflow-x-auto px-4">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>Wszystkie kategorie</Chip>
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{CATEGORIES[c]}</Chip>
        ))}
      </div>

      <p className="tnum text-sm text-muted">
        {results.length} {results.length === 1 ? 'ogłoszenie' : 'ogłoszeń'}
        {circle === 1 && ` od ${new Set(results.map((r) => r.listing.ownerId)).size} znajomych`}
      </p>

      {results.length ? (
        <div className="grid grid-cols-2 gap-3">
          {results.map(({ listing, rel, km }) => (
            <ListingCard key={listing.id} listing={listing} rel={rel} users={users} distance={formatDistance(km)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <p className="font-semibold">Nic tu jeszcze nie ma</p>
          <p className="text-sm text-muted">
            {circle === 1 && fromFriends === 0
              ? 'Twoi znajomi jeszcze nic nie wystawili. Zaproś ich albo poszerz krąg.'
              : 'Zmień filtry, zwiększ promień albo poszerz krąg.'}
          </p>
          <Link to="/krag" className="font-semibold text-brand">Zaproś znajomych</Link>
        </div>
      )}
    </div>
  )
}

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 96 96" aria-hidden>
      <circle cx="48" cy="48" r="38" fill="none" stroke="var(--c3)" strokeWidth="9" />
      <circle cx="48" cy="48" r="23" fill="none" stroke="var(--c2)" strokeWidth="9" />
      <circle cx="48" cy="48" r="10" fill="var(--c1)" />
    </svg>
  )
}
