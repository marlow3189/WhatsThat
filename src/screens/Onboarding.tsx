import { useState, type ReactNode } from 'react'
import { useStore, DEFAULT_NOTIF } from '../data/store'
import { Button, Field, Group, Input, Notice, Toggle, inputCls } from '../components/ui'
import { Icon, Mark } from '../components/icons'
import { LANGS, translator } from '../i18n'
import { VOIVODESHIPS, TOWNS, nearestTown } from '../lib/geo'
import { BRAND } from '../config'
import type { Lang, NotificationPrefs, Place } from '../lib/types'

const STEPS = ['lang', 'region', 'phone', 'code', 'name', 'contacts', 'notif'] as const
type Step = (typeof STEPS)[number]

const PREFIXES = ['+48', '+49', '+43', '+380', '+44', '+420']

/** Rejestracja bez haseł: język, okolica, numer + SMS, imię, kontakty, powiadomienia. */
export function Onboarding() {
  const { finishOnboarding, users } = useStore()
  const [step, setStep] = useState<Step>('lang')
  const [lang, setLang] = useState<Lang>('pl')
  const [voivodeship, setVoivodeship] = useState('mazowieckie')
  const [townName, setTownName] = useState('')
  const [gpsPlace, setGpsPlace] = useState<Place>()
  const [gpsError, setGpsError] = useState(false)
  const [prefix, setPrefix] = useState('+48')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contactsAllowed, setContactsAllowed] = useState(false)
  const [notif, setNotif] = useState<NotificationPrefs>(DEFAULT_NOTIF)
  const [error, setError] = useState('')
  const t = translator(lang)

  const index = STEPS.indexOf(step)
  const go = (s: Step) => {
    setError('')
    setStep(s)
  }
  const next = () => go(STEPS[index + 1])
  const digits = phone.replace(/\D/g, '')

  const place = (): Place => {
    if (gpsPlace) return gpsPlace
    const known = TOWNS.find((p) => p.town.toLowerCase() === townName.trim().toLowerCase())
    if (known) return known
    const capital = VOIVODESHIPS.find((v) => v.voivodeship === voivodeship)!
    return townName.trim() ? { ...capital, town: townName.trim() } : capital
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

  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col px-4 pt-6 pb-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[20px] font-bold tracking-tight">
          <Mark /> {BRAND.name}
        </span>
        {index > 0 && <span className="tnum text-[13px] text-muted">{t('ob.step', { n: index, total: STEPS.length - 1 })}</span>}
      </div>

      {step === 'lang' && (
        <Screen title={t('ob.lang.title')} text={t('tagline')}>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {LANGS.map((l) => (
              <button key={l.id} type="button" onClick={() => setLang(l.id)} aria-pressed={lang === l.id} className="flex min-h-13 w-full items-center justify-between px-4 text-left active:bg-sunken">
                <span lang={l.id}>{l.name}</span>
                {lang === l.id && <Icon name="check" className="text-accent" />}
              </button>
            ))}
          </div>
          <Footer><Button className="w-full" onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'region' && (
        <Screen title={t('ob.region.title')} text={t('ob.region.text')}>
          <Field id="voivodeship" label={t('ob.region.voivodeship')}>
            <select id="voivodeship" value={voivodeship} onChange={(e) => { setVoivodeship(e.target.value); setGpsPlace(undefined) }} className={inputCls}>
              {VOIVODESHIPS.map((v) => <option key={v.voivodeship} value={v.voivodeship}>{v.voivodeship}</option>)}
            </select>
          </Field>
          <Field id="town" label={t('ob.region.town')}>
            <Input id="town" list="towns" value={townName} placeholder={t('ob.region.townPh')} onChange={(e) => { setTownName(e.target.value); setGpsPlace(undefined) }} />
            <datalist id="towns">{TOWNS.filter((x) => x.voivodeship === voivodeship).map((x) => <option key={x.town} value={x.town} />)}</datalist>
          </Field>
          <Button variant="text" className="self-start" onClick={locate}><Icon name="pin" size={18} /> {t('ob.region.gps')}</Button>
          {gpsError && <Notice>{t('ob.region.gpsFail')}</Notice>}
          <Footer><Button className="w-full" onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'phone' && (
        <Screen title={t('ob.phone.title')} text={t('ob.phone.text')}>
          <Field id="phone" label={t('ob.phone.label')}>
            <div className="flex gap-2">
              <select aria-label="Prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={`${inputCls} w-24 shrink-0`}>
                {PREFIXES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 100 200" className="tnum" />
            </div>
          </Field>
          {error && <Notice tone="danger">{error}</Notice>}
          <Footer>
            <Button className="w-full" onClick={() => (digits.length >= 9 ? next() : setError(t('ob.phone.invalid')))}>{t('ob.phone.send')}</Button>
          </Footer>
        </Screen>
      )}

      {step === 'code' && (
        <Screen title={t('ob.code.title')} text={t('ob.code.text', { phone: `${prefix} ${phone}` })}>
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="tnum text-center text-[24px] tracking-[0.4em]" placeholder="••••••" />
          <p className="text-[13px] text-muted">{t('ob.code.demo')}</p>
          <Footer><Button className="w-full" disabled={code.length !== 6} onClick={next}>{t('ob.code.verify')}</Button></Footer>
        </Screen>
      )}

      {step === 'name' && (
        <Screen title={t('ob.name.title')} text={t('ob.name.text')}>
          <Field id="name" label={t('ob.name.label')}>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="email" label={t('ob.email.label')} hint={t('ob.email.hint')}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Footer><Button className="w-full" disabled={name.trim().length < 2} onClick={next}>{t('next')}</Button></Footer>
        </Screen>
      )}

      {step === 'contacts' && (
        <Screen title={t('ob.contacts.title')} text={t('ob.contacts.text')}>
          {contactsAllowed && <Notice tone="ok">{t('ob.contacts.found', { n: users.me.friends.length })}</Notice>}
          <Footer>
            {contactsAllowed ? (
              <Button className="w-full" onClick={next}>{t('next')}</Button>
            ) : (
              <>
                <Button className="w-full" onClick={() => setContactsAllowed(true)}>{t('ob.contacts.allow')}</Button>
                <Button variant="text" className="w-full" onClick={next}>{t('later')}</Button>
              </>
            )}
          </Footer>
        </Screen>
      )}

      {step === 'notif' && (
        <Screen title={t('ob.notif.title')} text={t('ob.notif.text')}>
          <div className="-mx-4">
            <Group>
              {(['friendsNew', 'messages', 'orders', 'fofNew', 'nearby', 'quiet'] as const).map((k) => (
                <Toggle key={k} id={`ob-${k}`} label={t(`notif.${k}`)} checked={notif[k]} onChange={(v) => setNotif((n) => ({ ...n, [k]: v }))} />
              ))}
            </Group>
          </div>
          <Footer>
            <Button
              className="w-full"
              onClick={() => finishOnboarding({ lang, place: place(), phone: `${prefix} ${phone}`, email: email.trim(), name: name.trim(), contactsAllowed, notif })}
            >
              {t('ob.finish')}
            </Button>
          </Footer>
        </Screen>
      )}

      {index > 0 && (
        <button type="button" onClick={() => go(STEPS[index - 1])} className="mt-3 min-h-11 self-center text-[15px] text-muted">
          {t('back')}
        </button>
      )}
    </div>
  )
}

function Screen({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
        {text && <p className="text-muted">{text}</p>}
      </div>
      {children}
    </div>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-2 pt-6">{children}</div>
}
