import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '../data/store'
import { Button, CATEGORIES, Header, MODE_LABEL, Rings, Segmented, Toggle, cx, readPhoto } from '../components/ui'
import { QuoteView } from '../components/QuoteView'
import { PRICING, quoteRental, quoteSale } from '../lib/fees'
import { zl } from '../lib/money'
import type { Category, Circle, CrossPostTarget, Mode } from '../lib/types'
import { ME } from '../data/seed'

const EMOJI: Record<Category, string> = {
  narzedzia: '🔧', ogrod: '🌱', outdoor: '⛺', sport: '🚴', auto: '🚗', elektronika: '🎧', dom: '🏠', impreza: '🎉', dzieci: '🧸', inne: '📦',
}

const VISIBILITY: { value: Circle; title: string; text: string }[] = [
  { value: 1, title: 'Tylko znajomi', text: 'Osoby z Twoich kontaktów. Bez opłat.' },
  { value: 2, title: 'Znajomi znajomych', text: 'Widzą, przez kogo się znacie. Opłata 5% po stronie biorącego.' },
  { value: 3, title: 'Market w okolicy', text: 'Każdy w pobliżu. Płatność, kaucja i ochrona w aplikacji.' },
]

const CROSS: { value: CrossPostTarget; label: string }[] = [
  { value: 'olx', label: 'OLX' },
  { value: 'allegro', label: 'Allegro Lokalnie' },
  { value: 'facebook', label: 'Facebook Marketplace' },
  { value: 'vinted', label: 'Vinted' },
  { value: 'ebay', label: 'eBay' },
]

export function AddListing() {
  const nav = useNavigate()
  const { me, here, listings, addListing, setPlan } = useStore()
  const [photo, setPhoto] = useState<string>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('narzedzia')
  const [mode, setMode] = useState<Mode>('rent')
  const [amount, setAmount] = useState('30')
  const [deposit, setDeposit] = useState('200')
  const [value, setValue] = useState('')
  const [swapFor, setSwapFor] = useState('')
  const [visibility, setVisibility] = useState<Circle>(3)
  const [cross, setCross] = useState<CrossPostTarget[]>([])
  const [error, setError] = useState('')

  const isPro = me.plan !== 'free'
  const marketCount = listings.filter((l) => l.ownerId === ME && l.visibility === 3).length
  const marketLimit = PRICING.plans[me.plan].marketListings
  const overLimit = visibility === 3 && marketCount >= marketLimit
  const price = zl(Number(amount.replace(',', '.')) || 0)

  const preview =
    mode === 'rent'
      ? quoteRental({ pricePerDay: price, days: 1, circle: visibility, protection: false })
      : mode === 'sell'
        ? quoteSale({ price, circle: visibility, inApp: visibility > 1 })
        : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3) return setError('Dodaj tytuł, co najmniej 3 znaki.')
    if ((mode === 'rent' || mode === 'sell') && price <= 0) return setError('Podaj cenę większą od zera.')
    if (overLimit) return setError(`Darmowy plan ma ${marketLimit} ogłoszeń w markecie. Przejdź na Pro albo wybierz krąg znajomych.`)
    const id = addListing({
      title: title.trim(),
      description: description.trim() || 'Bez opisu.',
      category,
      mode,
      pricePerDay: mode === 'rent' ? price : undefined,
      price: mode === 'sell' ? price : undefined,
      deposit: mode !== 'sell' ? zl(Number(deposit) || 0) : undefined,
      value: value ? zl(Number(value) || 0) : undefined,
      swapFor: mode === 'swap' ? swapFor : undefined,
      emoji: EMOJI[category],
      photo,
      place: here,
      visibility,
      crossPost: isPro ? cross : [],
    })
    nav(`/l/${id}`, { replace: true })
  }

  const input = 'min-h-11 w-full rounded-xl border border-line bg-surface px-3 outline-none focus:border-brand'

  return (
    <>
      <Header title="Nowe ogłoszenie" />
      <form onSubmit={submit} className="flex flex-col gap-5 px-4 py-4">
        <label htmlFor="photo" className={cx('grid aspect-[16/9] max-w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-surface text-center', photo && 'border-solid')}>
          {photo ? (
            <img src={photo} alt="Zdjęcie przedmiotu" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-muted">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3.5" /></svg>
              <span className="font-semibold text-ink">Zrób zdjęcie</span>
              <span className="text-xs">albo wybierz z galerii</span>
            </span>
          )}
          <input id="photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) setPhoto(await readPhoto(f))
          }} />
        </label>

        <Segmented<Mode> label="Rodzaj" value={mode} onChange={setMode} options={(Object.keys(MODE_LABEL) as Mode[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))} />

        <label htmlFor="title" className="flex flex-col gap-1.5 font-medium">
          Co to jest?
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Wiertarka udarowa Bosch" className={input} />
        </label>

        <label htmlFor="category" className="flex flex-col gap-1.5 font-medium">
          Kategoria
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className={input}>
            {(Object.keys(CATEGORIES) as Category[]).map((c) => <option key={c} value={c}>{CATEGORIES[c]}</option>)}
          </select>
        </label>

        {(mode === 'rent' || mode === 'sell') && (
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="amount" className="flex flex-col gap-1.5 font-medium">
              {mode === 'rent' ? 'Cena za dzień' : 'Cena'}
              <div className="relative">
                <input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={cx(input, 'tnum pr-9')} />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">zł</span>
              </div>
            </label>
            {mode === 'rent' && (
              <label htmlFor="deposit" className="flex flex-col gap-1.5 font-medium">
                Kaucja
                <div className="relative">
                  <input id="deposit" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} className={cx(input, 'tnum pr-9')} />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">zł</span>
                </div>
              </label>
            )}
          </div>
        )}
        {mode === 'rent' && (
          <label htmlFor="value" className="flex flex-col gap-1.5 font-medium">
            Wartość rzeczy <span className="text-sm font-normal text-muted">Do ochrony przed zniszczeniem. Opcjonalnie.</span>
            <input id="value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="np. 750" className={cx(input, 'tnum')} />
          </label>
        )}
        {mode === 'swap' && (
          <label htmlFor="swapFor" className="flex flex-col gap-1.5 font-medium">
            Na co się wymienisz?
            <input id="swapFor" value={swapFor} onChange={(e) => setSwapFor(e.target.value)} placeholder="np. rower MTB, konsola" className={input} />
          </label>
        )}

        <label htmlFor="description" className="flex flex-col gap-1.5 font-medium">
          Opis
          <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Stan, co jest w zestawie, gdzie odbiór" className={cx(input, 'py-2.5')} />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-medium">Kto to zobaczy?</legend>
          {VISIBILITY.map((v) => (
            <label key={v.value} htmlFor={`vis-${v.value}`} className={cx('flex cursor-pointer items-start gap-3 rounded-2xl border p-3', visibility === v.value ? 'border-brand bg-brand-soft' : 'border-line bg-surface')}>
              <input id={`vis-${v.value}`} type="radio" name="visibility" checked={visibility === v.value} onChange={() => setVisibility(v.value)} className="sr-only" />
              <Rings circle={v.value} size={22} />
              <span className="min-w-0">
                <span className="block font-semibold">{v.title}</span>
                <span className="block text-sm text-muted">{v.text}</span>
              </span>
            </label>
          ))}
          {visibility === 3 && !isPro && (
            <p className="tnum text-sm text-muted">W darmowym planie: {Math.min(marketCount, marketLimit)}/{marketLimit} ogłoszeń w markecie.</p>
          )}
        </fieldset>

        {visibility === 3 && (
          <fieldset className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <legend className="sr-only">Publikuj też na innych portalach</legend>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Wystaw też na innych portalach</p>
              {!isPro && <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-bold">PRO</span>}
            </div>
            <p className="-mt-2 text-sm text-muted">Jedno ogłoszenie, pięć serwisów. Gdy rzecz zejdzie, zdejmujemy ją wszędzie.</p>
            {CROSS.map((c) => (
              <Toggle
                key={c.value}
                id={`cross-${c.value}`}
                label={c.label}
                checked={cross.includes(c.value)}
                onChange={(on) => (isPro ? setCross((s) => (on ? [...s, c.value] : s.filter((x) => x !== c.value))) : undefined)}
              />
            ))}
            {!isPro && (
              <Button type="button" variant="soft" onClick={() => setPlan('pro')}>
                Włącz Pro za 19 zł/mies.
              </Button>
            )}
          </fieldset>
        )}

        {preview && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-2 font-semibold">{mode === 'rent' ? 'Za 1 dzień biorący zapłaci' : 'Kupujący zapłaci'}</p>
            <QuoteView quote={preview} />
            <p className="mt-2 text-sm font-semibold text-ok">Ty dostajesz 100% swojej ceny.</p>
          </div>
        )}

        {error && <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn" role="alert">{error}</p>}
        <Button type="submit" className="min-h-12 text-base">Opublikuj</Button>
      </form>
    </>
  )
}
