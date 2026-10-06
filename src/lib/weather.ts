import { useEffect, useState } from 'react'
import type { Place } from './types'

/** Pogoda z Open-Meteo (bez klucza, bez śledzenia). Gdy brak sieci, panel po prostu się nie pokazuje. */
export type Sky = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

export interface Weather {
  temp: number
  sky: Sky
  /** szansa opadów jutro, % */
  rainTomorrow: number
}

/** Kody pogody WMO → kilka prostych stanów. */
export function skyOf(code: number): Sky {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain'
}

export function useWeather(place: Place): Weather | null {
  const [w, setW] = useState<Weather | null>(null)
  useEffect(() => {
    const key = `wx:${place.lat.toFixed(2)},${place.lng.toFixed(2)}`
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) ?? 'null')
      if (cached && Date.now() - cached.at < 30 * 60_000) return setW(cached.w)
    } catch {
      /* brak pamięci sesji */
    }
    const ctrl = new AbortController()
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lng}&current=temperature_2m,weather_code&daily=precipitation_probability_max&forecast_days=2&timezone=auto`
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const next: Weather = { temp: Math.round(d.current.temperature_2m), sky: skyOf(d.current.weather_code), rainTomorrow: d.daily.precipitation_probability_max?.[1] ?? 0 }
        setW(next)
        try {
          sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), w: next }))
        } catch {
          /* nic */
        }
      })
      .catch(() => setW(null))
    return () => ctrl.abort()
  }, [place.lat, place.lng])
  return w
}
