import { useEffect, useMemo, useRef, useState } from 'react'
import type { Place } from '../lib/types'
import { distanceKm } from '../lib/geo'
import { cx } from './ui'
import { Icon } from './icons'

export interface MapPoint {
  id: string
  lat: number
  lng: number
  /** krótki napis na pinezce: numer kroku albo cena */
  label: string
  tone: 'friend' | 'fof' | 'other'
}

const TILE = 256
/** Kafelki OpenStreetMap w prototypie; w produkcji dostawca z kluczem (MapTiler, Stadia) zgodnie z ich zasadami. */
const TILE_URL = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

function project(lat: number, lng: number, z: number) {
  const scale = TILE * 2 ** z
  const s = Math.sin((lat * Math.PI) / 180)
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale }
}

/** Metry na piksel na danej szerokości i powiększeniu. */
const mpp = (lat: number, z: number) => (156_543.03 * Math.cos((lat * Math.PI) / 180)) / 2 ** z

/**
 * Mapa „gdzie są moje sprawy”: Ty w środku, kręgi 1/3/5 km, pinezki z numerem kroku albo ceną.
 * Bez biblioteki i bez klucza: kafelki OSM, a gdy nie wczytają się (brak sieci), czysty plan z kręgami.
 */
export function MapView({ center, points, selected, onSelect, height = 300, label }: { center: Place; points: MapPoint[]; selected?: string; onSelect?: (id: string) => void; height?: number; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(360)
  const [tilesOk, setTilesOk] = useState(true)
  useEffect(() => {
    const el = box.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Powiększenie dobrane tak, żeby najdalszy punkt zmieścił się z marginesem.
  const far = Math.max(1, ...points.map((p) => distanceKm(center, p)))
  const fit = (Math.min(width, height) / 2 - 28) / (far * 1000)
  // Powiększenie ułamkowe: pozycje liczymy dokładnie, a kafelki z najbliższego niższego poziomu skalujemy.
  const z = Math.max(8, Math.min(16, Math.log2(156_543.03 * Math.cos((center.lat * Math.PI) / 180) * fit)))
  const zi = Math.floor(z)
  const size = TILE * 2 ** (z - zi)
  const c = project(center.lat, center.lng, z)
  const left = c.x - width / 2
  const top = c.y - height / 2
  const pxPerKm = 1000 / mpp(center.lat, z)
  const rings = [1, 2, 5, 10, 20, 50].filter((km) => km * pxPerKm > 26 && km * pxPerKm < Math.min(width, height) / 2 - 6).slice(-3)

  const tiles = useMemo(() => {
    const out: { key: string; x: number; y: number; src: string }[] = []
    const n = 2 ** zi
    for (let tx = Math.floor(left / size); tx <= Math.floor((left + width) / size); tx++) {
      for (let ty = Math.floor(top / size); ty <= Math.floor((top + height) / size); ty++) {
        if (ty < 0 || ty >= n) continue
        out.push({ key: `${zi}/${tx}/${ty}`, x: tx * size - left, y: ty * size - top, src: TILE_URL(zi, ((tx % n) + n) % n, ty) })
      }
    }
    return out
  }, [zi, size, left, top, width, height])

  // Pinezki w tym samym miejscu (np. dwie oferty jednego składu) rozsuwamy wachlarzem, żeby każdą dało się stuknąć.
  const placed: { p: MapPoint; x: number; y: number }[] = []
  for (const p of points) {
    const q = project(p.lat, p.lng, z)
    let x = Math.max(18, Math.min(width - 18, q.x - left))
    let y = Math.max(34, Math.min(height - 4, q.y - top))
    const busy = () => placed.some((o) => Math.abs(o.x - x) < 30 && Math.abs(o.y - y) < 26) || (Math.abs(width / 2 - x) < 26 && Math.abs(height / 2 + 12 - y) < 30)
    for (let k = 1; busy() && k < 16; k++) {
      const a = k * 2.4
      x = Math.max(18, Math.min(width - 18, q.x - left + Math.cos(a) * 18 * Math.ceil(k / 3)))
      y = Math.max(34, Math.min(height - 4, q.y - top + Math.sin(a) * 18 * Math.ceil(k / 3)))
    }
    placed.push({ p, x, y })
  }

  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-[24px] bg-[#e9eef7]" style={{ height }} role="img" aria-label={label}>
      {tilesOk ? (
        tiles.map((t) => (
          <img key={t.key} src={t.src} alt="" draggable={false} onError={() => setTilesOk(false)} className="absolute max-w-none opacity-80 saturate-[0.7]" style={{ left: t.x, top: t.y, width: size, height: size }} />
        ))
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(#dfe6f2_1px,transparent_1px),linear-gradient(90deg,#dfe6f2_1px,transparent_1px)] bg-[size:28px_28px]" />
      )}
      {rings.map((km) => (
        <span key={km} className="pointer-events-none absolute rounded-full border border-dashed border-primary/35" style={{ width: km * 2 * pxPerKm, height: km * 2 * pxPerKm, left: width / 2 - km * pxPerKm, top: height / 2 - km * pxPerKm }}>
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-surface/90 px-1.5 text-[10px] font-bold text-primary">{km} km</span>
        </span>
      ))}
      <span className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-[0_0_0_6px_rgb(46_91_255/0.18)]" style={{ left: width / 2, top: height / 2 }}>
        <Icon name="user" size={18} />
      </span>
      {placed.map(({ p, x, y }) => {
        const on = p.id === selected
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect?.(p.id)}
            aria-pressed={on}
            className={cx(
              'press absolute flex -translate-x-1/2 -translate-y-full flex-col items-center',
              on ? 'z-20' : 'z-10',
            )}
            style={{ left: x, top: y }}
          >
            <span
              className={cx(
                'tnum rounded-full px-2.5 py-1 text-[12px] font-extrabold whitespace-nowrap shadow-[0_4px_12px_rgb(20_27_45/0.18)]',
                on ? 'bg-ink text-white' : p.tone === 'friend' ? 'bg-primary text-white' : p.tone === 'fof' ? 'bg-lilac text-ink' : 'bg-surface text-ink',
              )}
            >
              {p.label}
            </span>
            <span className={cx('-mt-1 size-2.5 rotate-45', on ? 'bg-ink' : p.tone === 'friend' ? 'bg-primary' : p.tone === 'fof' ? 'bg-lilac' : 'bg-surface')} />
          </button>
        )
      })}
      {tilesOk && <span className="absolute right-2 bottom-1.5 rounded bg-white/80 px-1 text-[10px] text-muted">© OpenStreetMap</span>}
    </div>
  )
}

/** Trasa przez wszystkie punkty w Mapach Google: najpierw najbliższy, potem kolejny najbliższy. */
export function routeUrl(from: Place, stops: { lat: number; lng: number }[]): string {
  const left = [...stops]
  const order: { lat: number; lng: number }[] = []
  let here: { lat: number; lng: number } = from
  while (left.length) {
    left.sort((a, b) => distanceKm(here, a) - distanceKm(here, b))
    here = left.shift()!
    order.push(here)
  }
  const fmt = (p: { lat: number; lng: number }) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
  const dest = order.at(-1)
  const via = order.slice(0, -1).map(fmt).join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${fmt(from)}&destination=${dest ? fmt(dest) : fmt(from)}${via ? `&waypoints=${encodeURIComponent(via)}` : ''}&travelmode=driving`
}
