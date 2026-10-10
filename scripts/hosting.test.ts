import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// (Plik poza src/, bo sprawdza konfigurację serwera, nie aplikację.)
// Dwa hostingi tej samej strony: Cloudflare Pages (site/_headers, site/_redirects) i Vercel (vercel.json).
// Test pilnuje, żeby nie rozjechały się nagłówki bezpieczeństwa ani reguły linków z aplikacji.

const read = (f: string) => readFileSync(f, 'utf8')
const vercel = JSON.parse(read('vercel.json')) as {
  outputDirectory: string
  redirects: { source: string; destination: string }[]
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const cfHeader = (name: string) => read('site/_headers').match(new RegExp(`^\\s+${name}: (.+)$`, 'm'))?.[1]
const vercelHeader = (name: string) => vercel.headers.find((h) => h.source === '/(.*)')?.headers.find((h) => h.key === name)?.value

describe('hosting', () => {
  it('skrót skryptu startowego z index.html jest w CSP obu hostingów', () => {
    const inline = read('index.html').match(/<script>([\s\S]*?)<\/script>/)![1]
    const hash = `'sha256-${createHash('sha256').update(inline).digest('base64')}'`
    expect(cfHeader('Content-Security-Policy')).toContain(hash)
    expect(vercelHeader('Content-Security-Policy')).toContain(hash)
  })

  it('te same nagłówki bezpieczeństwa na Cloudflare i Vercel', () => {
    for (const name of ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy']) {
      expect(vercelHeader(name), name).toBe(cfHeader(name))
    }
  })

  it('te same linki z aplikacji (/l/…, /u/…, /z/…, /sos, /zastrzez) i /app → /app/', () => {
    const rules = read('site/_redirects')
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => l.trim().split(/\s+/) as [string, string, string?])
    const cfOpen = rules.filter(([, to, code]) => to === '/open' && code === '200').map(([from]) => from.replace('/*', '/:path*'))
    expect(vercel.rewrites.map((r) => r.source).sort()).toEqual(cfOpen.sort())
    expect(vercel.rewrites.every((r) => r.destination === '/open')).toBe(true)
    expect(rules.some(([from, to]) => from === '/app' && to === '/app/')).toBe(true)
    expect(vercel.redirects).toContainEqual(expect.objectContaining({ source: '/app', destination: '/app/' }))
    expect(vercel.outputDirectory).toBe('dist')
  })
})
