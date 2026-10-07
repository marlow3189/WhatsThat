import { describe, expect, it } from 'vitest'
import { LIVE, checkConnection } from './backend'

describe('tryb pracy', () => {
  it('bez zmiennych Supabase aplikacja działa w trybie demo', async () => {
    expect(LIVE).toBe(false)
    const h = await checkConnection(() => Promise.reject(new Error('nie powinno pytać sieci')))
    expect(h.ok).toBe(false)
    expect(h.detail).toMatch(/demo/i)
  })
})
