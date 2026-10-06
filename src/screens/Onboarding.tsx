import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useStore, DEFAULT_NOTIF } from '../data/store'
import { Avatar, Button, Field, Input, Notice, Toggle, cx, hueOf, inputCls } from '../components/ui'
import { KeyTerms, TermsSheet } from '../components/terms'
import { Icon, Mark } from '../components/icons'
import { LANGS, localeOf, translator } from '../i18n'
import { VOIVODESHIPS, TOWNS, nearestTown } from '../lib/geo'
import { COUNTRIES, countryByCode, countryName } from '../lib/countries'
import { CATEGORIES } from '../lib/categories'
import { BRAND } from '../config'
import type { Lang, NotificationPrefs, Place } from '../lib/types'

const STEPS = ['lang', 'place', 'phone', 'code', 'name', 'interests', 'contacts', 'notif', 'terms'] as const
type Step = (typeof STEPS)[number]

/** Rejestracja bez haseł: język, kraj i okolica, numer + SMS, imię, zainteresowania, kontakty, powiadomienia, zasady. */
export function Onboarding() {
  const { finishOnboarding, users, listings, relation } = useStore()
  const [step, setStep] = useState<Step>('lang')
  const [lang, setLang] = useState<Lang>('pl')
  const [country, setCountry] = useState('PL')
  const [voivodeship, setVoivodeship] = useState('mazowieckie')
  const [region, setRegion] = useState('')
  const [townName, setTownName] = useState('')
  const [gpsPlace, setGpsPlace] = useState<Place>()
  const [gpsError, setGpsError] = useState(false)
  const [dial, setDial] = useState('+48')
  const [changeDial, setChangeDial] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  // Wszystko włączone na start (sugerowane); użytkownik tylko wyłącza.
  const [interests, setInterests] = useState<string[]>(() => CATEGORIES.filter((c) => c.id !== 'other').map((c) => c.id))
  const [fullTerms, setFullTerms] = useState(false)
  const [contactsAllowed, setContactsAllowed] = useState(false)
  const [notif, setNotif] = useState<NotificationPrefs>(DEFAULT_NOTIF)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const t = translator(lang)
  const locale = localeOf(lang)

  /** Kto z Twojej orbity (znajomi i ich znajomi) działa albo wystawia w danej kategorii. */
  const people = useMemo(() => {
    const byCat: Record<string, Set<string>> = {}
    const add = (cat: string | undefined, id: string) => {
      if (cat) (byCat[cat] ??= new Set()).add(id)
    }
    for (const u of Object.values(users)) {
      if (u.id !== 'me' && !u.restricted && relation(u.id).circle <= 2) add(u.work, u.id)
    }
    for (const l of listings) if (l.ownerId !== 'me' && !users[l.ownerId]?.restricted && relation(l.ownerId).circle <= 2) add(l.category, l.ownerId)
    return byCat
  }, [users, listings, relation])
  const friends = users.me.friends.map((id) => users[id]).filter((u) => u && !u.restricted)
  const industries = [...new Set(friends.map((u) => u.work).filter(Boolean) as string[])]

  const index = STEPS.indexOf(step)
  const go = (s: Step) => {
    setError('')
    setStep(s)
  }
  const next = () => go(STEPS[index + 1])
  const digits = phone.replace(/\D/g, '')
  const isPL = country === 'PL'

  const chooseLang = (l: Lang) => {
    setLang(l)
    const c = COUNTRIES.find((x) => x.lang === l)
    if (c) chooseCountry(c.code)
  }
  const chooseCountry = (code: string) => {
    setCountry(code)
    setDial(countryByCode(code).dial)
    setGpsPlace(undefined)
  }

  const place = (): Place => {
    if (gpsPlace) return { ...gpsPlace, country }
    if (isPL) {
      const known = TOWNS.find((p) => p.town.toLowerCase() === townName.trim().toLowerCase())
      if (known) return { ...known, country }
      const capital = VOIVODESHIPS.find((v) => v.voivodeship === voivodeship)!
      return { ...capital, town: townName.trim() || capital.town, country }
    }
    const c = countryByCode(country)
    return { lat: c.lat, lng: c.lng, town: townName.trim() || region.trim() || countryName(country, locale), voivodeship: region.trim() || countryName(country, locale), country }
  }

  const locate = () => {
    setGpsError(false)
    if (!('geolocation' in navigator)) return setGpsError(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = nearestTown(pos.coords.latitude, pos.coords.longitude)
        setGpsPlace(p)
        setVoivodeship(p.voivodeship)
        setTownName(p.town)
      },
      () => setGpsError(true),
      { timeout: 8000 },
    )
  }

  const finish = () =>
    finishOnboarding({
      lang, country, currency: countryByCode(country).currency, place: place(), phone: `${dial} ${phone}`.trim(),
      email: email.trim(), name: name.trim(), interests, contactsAllowed, notif,
    })

  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col px-5 pt-6 pb-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-[20px] font-extrabold tracking-[-0.02em]"><Mark size={32} /> {BRAND.name}</span>
        {index > 0 && (
          <div className="h-2 w-28 overflow-hidden rounded-full bg-fill-strong" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-valuenow={index} aria-label={t('ob.step', { n: index, total: STEPS.length - 1 })}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / (STEPS.length - 1)) * 100}%` }} />
          </div>
        )}
      </div>

      {step === 'lang' && (
        <Screen title={t('ob.lang.title')} text={t('tagline')}>
          <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
            {LANGS.map((l) => (
              <button key={l.id} type="button" onClick={() => chooseLang(l.id)} aria-pressed={lang === l.id} className="flex min-h-[52px] w-full items-center justify-between px-4 text-left active:bg-fill">
                <span lang={l.id}>{l.name}</span>
                {lang === l.id && <Icon name="check" className="text-link" strokeWidth={2.4} />}
              </button>
            ))}
          </div>
          <Footer><Button className="w-full" onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'place' && (
        <Screen title={t('ob.country.title')} text={t('ob.country.text')}>
          <Field id="country" label={t('ob.country.label')}>
            <select id="country" value={country} onChange={(e) => chooseCountry(e.target.value)} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryName(c.code, locale)}</option>)}
            </select>
          </Field>
          {isPL ? (
            <Field id="voivodeship" label={t('ob.region.voivodeship')}>
              <select id="voivodeship" value={voivodeship} onChange={(e) => { setVoivodeship(e.target.value); setGpsPlace(undefined) }} className={inputCls}>
                {VOIVODESHIPS.map((v) => <option key={v.voivodeship} value={v.voivodeship}>{v.voivodeship}</option>)}
              </select>
            </Field>
          ) : (
            <Field id="region" label={t('ob.region.region')}>
              <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
            </Field>
          )}
          <Field id="town" label={t('ob.region.town')}>
            <Input id="town" list="towns" value={townName} placeholder={t('ob.region.townPh')} onChange={(e) => { setTownName(e.target.value); setGpsPlace(undefined) }} />
            {isPL && <datalist id="towns">{TOWNS.filter((x) => x.voivodeship === voivodeship).map((x) => <option key={x.town} value={x.town} />)}</datalist>}
          </Field>
          <Button variant="plain" className="self-start" onClick={locate}><Icon name="pin" size={18} /> {t('ob.region.gps')}</Button>
          {gpsError && <Notice>{t('ob.region.gpsFail')}</Notice>}
          <Footer><Button className="w-full" onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'phone' && (
        <Screen title={t('ob.phone.title')} text={t('ob.phone.text')}>
          <Field id="phone" label={t('ob.phone.label')}>
            <div className="flex gap-2">
              {changeDial ? (
                <select aria-label="Prefix" autoFocus value={dial} onChange={(e) => { setDial(e.target.value); setChangeDial(false) }} onBlur={() => setChangeDial(false)} className={cx(inputCls, '!w-[7.5rem] shrink-0')}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.dial}>{c.code} {c.dial}</option>)}
                </select>
              ) : (
                <button type="button" onClick={() => setChangeDial(true)} className="press flex min-h-[50px] shrink-0 items-center gap-1 rounded-[14px] bg-surface px-3.5 text-[17px] shadow-[var(--shadow)]" aria-label={`Prefix ${dial}`}>
                  <span className="text-[13px] font-semibold text-muted">{country}</span>
                  <span className="tnum">{dial}</span>
                  <Icon name="chevron" size={14} className="rotate-90 text-muted" />
                </button>
              )}
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 100 200" className="tnum flex-1" />
            </div>
          </Field>
          {error && <Notice tone="danger">{error}</Notice>}
          <Button variant="plain" className="self-start" onClick={() => setPhone('600 100 200')}>{t('ob.code.demo').split(':')[0]}: 600 100 200</Button>
          <Footer>
            <Button className="w-full" onClick={() => (digits.length >= 7 ? next() : setError(t('ob.phone.invalid')))}>{t('ob.phone.send')}</Button>
          </Footer>
        </Screen>
      )}

      {step === 'code' && (
        <Screen title={t('ob.code.title')} text={t('ob.code.text', { phone: `${dial} ${phone}` })}>
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="tnum text-center text-[28px] tracking-[0.5em]" placeholder="••••••" />
          <Button variant="plain" className="self-start" onClick={() => setCode('123456')}>{t('ob.code.demo')}</Button>
          <Footer><Button className="w-full" disabled={code.length !== 6} onClick={next}>{t('ob.code.verify')}</Button></Footer>
        </Screen>
      )}

      {step === 'name' && (
        <Screen title={t('ob.name.title')} text={t('ob.name.text')}>
          <Field id="name" label={t('ob.name.label')}>
            <Input id="name" autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="email" label={t('ob.email.label')} hint={t('ob.email.hint')}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Footer><Button className="w-full" disabled={name.trim().length < 2} onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'interests' && (
        <Screen title={t('ob.interests.title')} text={t('ob.interests.text')}>
          {industries.length > 0 && (
            <div className="card flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {friends.slice(0, 5).map((u) => <span key={u.id} className="rounded-full ring-2 ring-surface"><Avatar user={u} size={32} /></span>)}
                </div>
                <p className="text-[14px] leading-tight font-semibold">{t('ob.interests.work')}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {industries.map((id) => {
                  const c = CATEGORIES.find((x) => x.id === id)!
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-[13px] font-semibold">
                      <Icon name={c.icon} size={14} /> {c.label[lang]}
                      <span className="tnum text-muted">{friends.filter((u) => u.work === id).length}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-[24px] bg-sun p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface"><Icon name="house" size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-[16px] font-bold">{t('ob.interests.neighbors')}</span>
                <Icon name="lock" size={16} className="text-ink/60" />
              </span>
              <span className="mt-1 block text-[14px] leading-snug text-ink/75">{t('ob.interests.neighborsD')}</span>
            </span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-[12px] font-bold text-ok">{t('ob.interests.suggested')}</span>
            <span className="tnum text-[13px] text-muted">{interests.length} / {CATEGORIES.length - 1}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.filter((c) => c.id !== 'other').map((c) => {
              const on = interests.includes(c.id)
              const n = people[c.id]?.size ?? 0
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setInterests((xs) => (on ? xs.filter((x) => x !== c.id) : [...xs, c.id]))}
                  className={cx('press flex min-h-[96px] flex-col justify-between gap-2 rounded-[22px] p-3.5 text-left transition', on ? 'bg-surface shadow-[var(--shadow)] ring-2 ring-ink' : 'bg-fill text-ink/55')}
                >
                  <span className="flex items-start justify-between">
                    <span className={cx('grid size-9 place-items-center rounded-full', on ? 'tint' : 'bg-surface')} style={{ '--h': hueOf(c.id) } as CSSProperties}>
                      <Icon name={c.icon} size={19} />
                    </span>
                    <span className={cx('grid size-5 place-items-center rounded-full', on ? 'bg-ink text-white' : 'border-2 border-fill-strong')}>
                      {on && <Icon name="check" size={12} strokeWidth={3.2} />}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] leading-tight font-bold">{c.label[lang]}</span>
                    {n > 0 && (
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-muted">
                        <Icon name="users" size={13} /> <span className="tnum">{n}</span>
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
          <Footer><Button className="w-full" onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'contacts' && (
        <Screen title={t('ob.contacts.title')} text={t('ob.contacts.text')}>
          {contactsAllowed && (
            <div className="card flex flex-col gap-3 p-4">
              <p className="flex items-center gap-2 text-[15px] font-bold text-ok"><Icon name="check" size={18} strokeWidth={2.6} /> {t('ob.contacts.found', { n: friends.length })}</p>
              <div className="flex flex-wrap gap-3">
                {friends.map((u) => (
                  <span key={u.id} className="flex w-14 flex-col items-center gap-1">
                    <Avatar user={u} size={48} />
                    <span className="w-full truncate text-center text-[12px]">{u.name.split(' ')[0]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <Footer>
            {contactsAllowed ? (
              <Button className="w-full" onClick={next}>{t('next')}</Button>
            ) : (
              <>
                <Button className="w-full" onClick={() => setContactsAllowed(true)}>{t('ob.contacts.allow')}</Button>
                <Button variant="plain" className="w-full" onClick={next}>{t('later')}</Button>
              </>
            )}
          </Footer>
        </Screen>
      )}

      {step === 'notif' && (
        <Screen title={t('ob.notif.title')} text={t('ob.notif.text')}>
          <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
            {(['friendsNew', 'messages', 'orders', 'fofNew', 'nearby', 'quiet'] as const).map((k) => (
              <Toggle key={k} id={`ob-${k}`} label={t(`notif.${k}`)} checked={notif[k]} onChange={(v) => setNotif((n) => ({ ...n, [k]: v }))} />
            ))}
          </div>
          <Footer><Button className="w-full" onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'terms' && (
        <Screen title={t('ob.terms.title')} text={t('ob.terms.lead')}>
          <KeyTerms t={t} />
          <button type="button" onClick={() => setFullTerms(true)} className="press flex min-h-12 items-center gap-2 self-start rounded-full bg-surface px-4 text-[15px] font-semibold shadow-[var(--shadow)]">
            <Icon name="doc" size={18} /> {t('ob.terms.read')} <Icon name="globe" size={16} className="text-muted" /> <span className="tnum text-muted">{LANGS.length}</span>
          </button>
          <label htmlFor="accept" className={cx('flex cursor-pointer items-center gap-3 rounded-[20px] p-4 transition', accepted ? 'bg-mint' : 'card')}>
            <input id="accept" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="size-6 shrink-0 accent-[var(--ink)]" />
            <span className="text-[15px] font-semibold">{t('ob.terms.accept')}</span>
          </label>
          <Footer><Button className="w-full" disabled={!accepted} onClick={finish}>{t('ob.finish')}</Button></Footer>
          {fullTerms && <TermsSheet lang={lang} t={t} onClose={() => setFullTerms(false)} />}
        </Screen>
      )}

      {index > 0 && (
        <button type="button" onClick={() => go(STEPS[index - 1])} className="mt-3 min-h-11 self-center text-[16px] text-link">{t('back')}</button>
      )}
    </div>
  )
}

function Screen({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.03em]">{title}</h1>
        {text && <p className="text-[16px] leading-snug text-muted">{text}</p>}
      </div>
      {children}
    </div>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-2 pt-6">{children}</div>
}
