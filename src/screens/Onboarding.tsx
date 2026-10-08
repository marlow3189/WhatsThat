import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { GENDERS, anonKey, formatKey, type Gender } from '../lib/identity'
import { contactSource, hashContacts, readContacts } from '../lib/contacts'
import { useStore } from '../data/store'
import { Avatar, Button, Field, Input, KeyAvatar, Notice, Sheet, cx, inputCls } from '../components/ui'
import { TermsSheet } from '../components/terms'
import { Icon, Mark } from '../components/icons'
import { LANGS, localeOf, useTranslator } from '../i18n'
import { TOWNS } from '../lib/geo'
import { COUNTRIES, countryByCode, countryName } from '../lib/countries'
import { REGION_KIND, nearestRegion, regionsOf } from '../lib/regions'
import { CATEGORIES } from '../lib/categories'
import { BRAND } from '../config'
import type { Lang, Place } from '../lib/types'

const STEPS = ['phone', 'code', 'profile', 'contacts'] as const
type Step = (typeof STEPS)[number]

/**
 * Rejestracja w 4 krokach, jak w WhatsAppie: numer (i zgoda na zasady jednym przyciskiem) → kod SMS
 * (sprawdza się sam po 6 cyfrach) → profil: imię, płeć (raz) i okolica → znajomi z kontaktów.
 * Język bierzemy z telefonu (zmienisz go u góry), zainteresowania i powiadomienia są włączone domyślnie
 * i zmienisz je w zakładce Ja.
 */
export function Onboarding() {
  const { finishOnboarding, users } = useStore()
  const [step, setStep] = useState<Step>('phone')
  const [lang, setLang] = useState<Lang>(phoneLang)
  const [pickLang, setPickLang] = useState(false)
  const [country, setCountry] = useState(phoneCountry)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>()
  const [region, setRegion] = useState(() => regionsOf(country)[0]?.region ?? '')
  const [townName, setTownName] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number }>()
  const [gpsError, setGpsError] = useState(false)
  const [fullTerms, setFullTerms] = useState(false)
  const [contactsAllowed, setContactsAllowed] = useState(false)
  const [contactsStage, setContactsStage] = useState<'ask' | 'system' | 'matching' | 'done' | 'denied'>('ask')
  const [howContacts, setHowContacts] = useState(false)
  const [checked, setChecked] = useState(0)
  const [error, setError] = useState('')
  const t = useTranslator(lang)
  const locale = localeOf(lang)
  const dial = countryByCode(country).dial
  const regions = useMemo(() => regionsOf(country), [country])
  const kind = REGION_KIND[country] ?? 'region'
  const friends = users.me.friends.map((id) => users[id]).filter((u) => u && !u.restricted)

  const index = STEPS.indexOf(step)
  const go = (s: Step) => {
    setError('')
    setStep(s)
  }
  const digits = phone.replace(/\D/g, '')

  const chooseLang = (l: Lang) => {
    setLang(l)
    setPickLang(false)
    const c = COUNTRIES.find((x) => x.lang === l)
    if (c) chooseCountry(c.code)
  }
  const chooseCountry = (code: string) => {
    setCountry(code)
    setRegion(regionsOf(code)[0]?.region ?? '')
    setGps(undefined)
  }

  // Kod SMS sprawdza się sam po wpisaniu 6 cyfr (w aplikacji Android podpowiada go klawiatura z SMS-a).
  useEffect(() => {
    if (step === 'code' && code.length === 6) go('profile')
  }, [code, step])

  const place = (): Place => {
    const r = regions.find((x) => x.region === region)
    const typed = townName.trim()
    const known = TOWNS.find((p) => p.town.toLowerCase() === typed.toLowerCase() && (country === 'PL'))
    if (gps) return { lat: gps.lat, lng: gps.lng, town: typed || r?.town || countryName(country, locale), voivodeship: region || countryName(country, locale), country }
    if (known) return { ...known, country }
    if (r) return { lat: r.lat, lng: r.lng, town: typed || r.town, voivodeship: r.region, country }
    const c = countryByCode(country)
    return { lat: c.lat, lng: c.lng, town: typed || countryName(country, locale), voivodeship: countryName(country, locale), country }
  }

  const locate = () => {
    setGpsError(false)
    if (!('geolocation' in navigator)) return setGpsError(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setGps({ lat, lng })
        const r = nearestRegion(country, lat, lng)
        if (r) {
          setRegion(r.region)
          if (!townName.trim()) setTownName(r.town)
        }
      },
      () => setGpsError(true),
      { timeout: 8000 },
    )
  }

  const finish = () =>
    finishOnboarding({
      lang, country, currency: countryByCode(country).currency, place: place(), phone: `${dial} ${phone}`.trim(),
      name: name.trim(), contactsAllowed, gender,
      // wszystkie zainteresowania włączone na start (wyłączysz w zakładce Ja → Zainteresowania)
      interests: CATEGORIES.filter((c) => c.id !== 'other').map((c) => c.id),
    })
  const key = gender ? anonKey(country, gender, `${dial} ${phone}`) : ''

  /** Zgoda na kontakty: w aplikacji okno systemu, w Chrome na Androidzie wybór kontaktów, w podglądzie wygląd okna. */
  const askContacts = async () => {
    if (import.meta.env.MODE !== 'preview' && contactSource() !== 'none') {
      setContactsStage('system')
      const list = await readContacts()
      if (!list) return setContactsStage('denied')
      const hashes = await hashContacts(list, dial)
      // Produkcja: supabase.rpc('match_contacts', { hashes }) → konta znajomych; skrótów serwer nie zapisuje.
      return match(hashes.length)
    }
    setContactsStage('system')
  }
  const match = (n: number) => {
    setChecked(n)
    setContactsStage('matching')
    window.setTimeout(() => {
      setContactsAllowed(true)
      setContactsStage('done')
    }, 900)
  }

  const profileOk = name.trim().length >= 2 && !!gender

  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col px-4 pt-3 pb-6" style={{ paddingTop: 'calc(var(--sat) + 12px)' }}>
      <div className="mb-5 flex min-h-12 items-center justify-between gap-3">
        {index > 0 ? (
          <button type="button" onClick={() => go(STEPS[index - 1])} className="press -ml-2 grid size-12 place-items-center rounded-full active:bg-fill" aria-label={t('back')}>
            <Icon name="back" size={22} strokeWidth={2.2} />
          </button>
        ) : (
          <span className="flex items-center gap-2 text-[20px] font-bold text-primary"><Mark size={30} /> {BRAND.name}</span>
        )}
        <div className="flex items-center gap-2">
          <div className="flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label={t('ob.step', { n: index + 1, total: STEPS.length })}>
            {STEPS.map((s, i) => <span key={s} className={cx('h-1.5 w-5 rounded-full', i <= index ? 'bg-primary' : 'bg-fill-strong')} />)}
          </div>
          {step === 'phone' && (
            <button type="button" onClick={() => setPickLang(true)} className="press flex min-h-10 items-center gap-1.5 rounded-full bg-fill-strong/60 px-3 text-[14px] font-semibold" aria-label={t('ob.lang.title')}>
              <Icon name="globe" size={17} /> <span lang={lang}>{LANGS.find((l) => l.id === lang)?.name}</span>
            </button>
          )}
        </div>
      </div>

      {step === 'phone' && (
        <Screen title={t('ob.phone.title')} text={t('ob.phone.text')}>
          <Field id="country" label={t('ob.country.label')}>
            <select id="country" value={country} onChange={(e) => chooseCountry(e.target.value)} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryName(c.code, locale)} ({c.dial})</option>)}
            </select>
          </Field>
          <Field id="phone" label={t('ob.phone.label')}>
            <div className="flex gap-2">
              <span className="tnum flex min-h-12 shrink-0 items-center rounded-[12px] border border-line bg-surface px-3.5 text-[16px]">{dial}</span>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 100 200" className="tnum flex-1" />
            </div>
          </Field>
          {error && <Notice tone="danger">{error}</Notice>}
          <Button variant="plain" className="self-start" onClick={() => setPhone('600 100 200')}>{t('ob.code.demo').split(':')[0]}: 600 100 200</Button>
          <Footer>
            <p className="px-1 text-center text-[13px] leading-snug text-muted">
              {t('ob.terms.inline')}{' '}
              <button type="button" onClick={() => setFullTerms(true)} className="font-semibold text-link underline">{t('ob.terms.read')}</button>
            </p>
            <Button className="w-full" onClick={() => (digits.length >= 7 ? go('code') : setError(t('ob.phone.invalid')))}>{t('ob.agree')}</Button>
          </Footer>
          {fullTerms && <TermsSheet lang={lang} t={t} onClose={() => setFullTerms(false)} />}
        </Screen>
      )}

      {step === 'code' && (
        <Screen title={t('ob.code.title')} text={t('ob.code.text', { phone: `${dial} ${phone}` })}>
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="tnum text-center text-[26px] tracking-[0.5em]" placeholder="••••••" aria-label={t('ob.code.title')} />
          <Button variant="plain" className="self-start" onClick={() => setCode('123456')}>{t('ob.code.demo')}</Button>
          <Button variant="plain" className="self-start" onClick={() => go('phone')}>{t('ob.code.change')}</Button>
        </Screen>
      )}

      {step === 'profile' && (
        <Screen title={t('ob.profile.title')} text={t('ob.profile.text')}>
          <Field id="name" label={t('ob.name.label')}>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="flex flex-col gap-1.5">
            <p id="gender-label" className="px-1 text-[13px] font-medium text-muted">{t('ob.gender.title')}</p>
            <div role="radiogroup" aria-labelledby="gender-label" className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button key={g} type="button" role="radio" aria-checked={gender === g} onClick={() => setGender(g)} className={cx('press flex min-h-12 items-center justify-center gap-1.5 rounded-[12px] border px-2 text-[14px] font-semibold', gender === g ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface')}>
                  {gender === g && <Icon name="check" size={16} strokeWidth={2.6} />} {t(`gender.${g}`)}
                </button>
              ))}
            </div>
            <p className="flex items-start gap-1.5 px-1 text-[12.5px] leading-snug text-muted"><Icon name="lock" size={14} className="mt-0.5 shrink-0" /> {t('ob.gender.once')}</p>
          </div>
          {key && (
            <div className="flex items-center gap-3 rounded-[16px] bg-surface p-3">
              <KeyAvatar anonKey={key} size={44} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-muted">{t('key.yours')}</p>
                <p className="tnum truncate text-[15px] font-bold">{formatKey(key)}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {regions.length > 0 ? (
              <Field id="region" label={t(`ob.region.${kind}`)}>
                <select id="region" value={region} onChange={(e) => { setRegion(e.target.value); setGps(undefined) }} className={inputCls}>
                  {regions.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                </select>
              </Field>
            ) : (
              <Field id="region" label={t('ob.region.region')}>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
              </Field>
            )}
            <Field id="town" label={t('ob.region.town')}>
              <Input id="town" list="towns" value={townName} placeholder={regions.find((r) => r.region === region)?.town ?? t('ob.region.townPh')} onChange={(e) => setTownName(e.target.value)} />
              {country === 'PL' && <datalist id="towns">{TOWNS.filter((x) => x.voivodeship === region).map((x) => <option key={x.town} value={x.town} />)}</datalist>}
            </Field>
          </div>
          <Button variant="plain" className="self-start" onClick={locate}><Icon name="pin" size={18} /> {t('ob.region.gps')}</Button>
          {gpsError && <Notice>{t('ob.region.gpsFail')}</Notice>}
          <Footer><Button className="w-full" disabled={!profileOk} onClick={() => go('contacts')}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'contacts' && (
        <Screen title={t('ob.contacts.title')} text={t('ob.contacts.text')}>
          {(contactsStage === 'ask' || contactsStage === 'system') && (
            <div className="card flex flex-col gap-3 p-4">
              {(['ob.contacts.p1', 'ob.contacts.p2', 'ob.contacts.p3'] as const).map((k, i) => (
                <p key={k} className="flex items-start gap-3 text-[14px] leading-snug">
                  <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', ['tile-1', 'tile-2', 'tile-4'][i])}><Icon name={['lock', 'shield', 'eyeoff'][i]} size={16} /></span>
                  <span className="pt-1">{t(k)}</span>
                </p>
              ))}
              <button type="button" onClick={() => setHowContacts(true)} className="min-h-10 self-start text-[14px] font-bold text-link">{t('ob.contacts.how')}</button>
            </div>
          )}
          {contactsStage === 'matching' && (
            <div className="card flex items-center gap-3 p-4" role="status">
              <span className="spin grid size-10 place-items-center rounded-full bg-fill"><Icon name="sparkle" size={20} /></span>
              <p className="text-[15px] font-semibold">{t('ob.contacts.matching', { n: checked })}</p>
            </div>
          )}
          {contactsStage === 'denied' && <Notice tone="info" icon="info">{t('ob.contacts.denied')}</Notice>}
          {contactsAllowed && (
            <div className="card flex flex-col gap-3 p-4">
              <p className="flex items-center gap-2 text-[15px] font-bold text-ok"><Icon name="check" size={18} strokeWidth={2.6} /> {t('ob.contacts.found', { n: friends.length })}</p>
              <div className="flex flex-wrap gap-3">
                {friends.map((u) => (
                  <span key={u.id} className="flex w-14 flex-col items-center gap-1">
                    <Avatar user={u} size={44} />
                    <span className="w-full truncate text-center text-[12px]">{u.name.split(' ')[0]}</span>
                  </span>
                ))}
              </div>
              <p className="flex items-center gap-2 text-[13px] text-muted"><Icon name="shield" size={15} className="text-ok" /> {t('ob.contacts.deleted')}</p>
            </div>
          )}
          <Footer>
            {contactsAllowed || contactsStage === 'denied' ? (
              <Button className="w-full" onClick={finish}>{t('ob.finish')}</Button>
            ) : contactsStage === 'matching' ? null : (
              <>
                <Button className="w-full" onClick={askContacts}>{t('ob.contacts.allow')}</Button>
                <Button variant="plain" className="w-full" onClick={finish}>{t('later')}</Button>
              </>
            )}
          </Footer>
          {contactsStage === 'system' && contactSource() === 'none' && (
            <SystemAlert
              title={t('sys.contacts.title', { app: BRAND.name })}
              body={t('sys.contacts.body')}
              note={t('sys.preview')}
              deny={t('sys.deny')}
              allow={t('sys.allow')}
              onDeny={() => setContactsStage('denied')}
              onAllow={() => match(214)}
            />
          )}
          {howContacts && (
            <Sheet title={t('ob.contacts.how')} onClose={() => setHowContacts(false)}>
              <ol className="card flex list-decimal flex-col gap-3 py-4 pr-4 pl-9 text-[15px] leading-snug">
                {(['ob.contacts.how1', 'ob.contacts.how2', 'ob.contacts.how3', 'ob.contacts.how4'] as const).map((k) => <li key={k}>{t(k)}</li>)}
              </ol>
              <Button variant="secondary" className="mt-3 w-full" onClick={() => setHowContacts(false)}>{t('close')}</Button>
            </Sheet>
          )}
        </Screen>
      )}

      {pickLang && (
        <Sheet title={t('ob.lang.title')} onClose={() => setPickLang(false)}>
          <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
            {LANGS.map((l) => (
              <button key={l.id} type="button" onClick={() => chooseLang(l.id)} aria-pressed={lang === l.id} className="flex min-h-12 w-full items-center justify-between px-4 text-left active:bg-fill">
                <span lang={l.id}>{l.name}</span>
                {lang === l.id && <Icon name="check" className="text-primary" strokeWidth={2.4} />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}

/** Kraj z ustawień telefonu (de-AT → Austria, en-US → USA); gdy go nie ma na liście, kraj języka. */
function phoneCountry(): string {
  const region = (typeof navigator !== 'undefined' ? navigator.language : 'pl-PL').split('-')[1]?.toUpperCase()
  return COUNTRIES.find((c) => c.code === region)?.code ?? COUNTRIES.find((c) => c.lang === phoneLang())?.code ?? 'PL'
}

/** Język telefonu, jeśli go obsługujemy; inaczej polski. */
function phoneLang(): Lang {
  const code = (typeof navigator !== 'undefined' ? navigator.language : 'pl').slice(0, 2).toLowerCase()
  return (LANGS.find((l) => l.id === code)?.id ?? 'pl') as Lang
}

function Screen({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[24px] leading-tight font-bold">{title}</h1>
        {text && <p className="text-[15px] leading-snug text-muted">{text}</p>}
      </div>
      {children}
    </div>
  )
}

/** Okno zgody jak w systemie telefonu (w aplikacji ze sklepu pokazuje je sam system). */
function SystemAlert({ title, body, note, deny, allow, onDeny, onAllow }: { title: string; body: string; note: string; deny: string; allow: string; onDeny: () => void; onAllow: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-8" role="alertdialog" aria-modal aria-label={title}>
      <div className="w-full max-w-[18rem] overflow-hidden rounded-[18px] bg-surface/95 text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)] backdrop-blur-xl">
        <div className="flex flex-col gap-1.5 px-4 pt-5 pb-4">
          <p className="text-[17px] leading-tight font-bold">{title}</p>
          <p className="text-[13px] leading-snug">{body}</p>
          <p className="text-[11px] text-muted">{note}</p>
        </div>
        <div className="grid grid-cols-2 border-t border-line">
          <button type="button" onClick={onDeny} className="min-h-11 border-r border-line text-[17px] text-link">{deny}</button>
          <button type="button" onClick={onAllow} className="min-h-11 text-[17px] font-semibold text-link">{allow}</button>
        </div>
      </div>
    </div>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-2 pt-6">{children}</div>
}
