import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Listing, User } from '../lib/types'
import type { Relation } from '../lib/circles'
import { categoryById } from '../lib/categories'
import { formatPLN } from '../lib/money'
import type { T } from '../i18n'
import { BRAND } from '../config'
import { Icon } from './icons'

export function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ')
}

export function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const initials = (user.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${user.hue} 32% 42%)` }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Zdjęcie albo spokojny zastępnik z ikoną kategorii. */
export function Thumb({ listing, size, className }: { listing: Listing; size?: number; className?: string }) {
  const icon = categoryById(listing.category).icon
  return (
    <div
      className={cx('grid shrink-0 place-items-center overflow-hidden bg-sunken text-muted', className)}
      style={size ? { width: size, height: size } : undefined}
    >
      {listing.photo ? <img src={listing.photo} alt="" className="h-full w-full object-cover" /> : <Icon name={icon} size={size ? size * 0.42 : 56} strokeWidth={1.3} />}
    </div>
  )
}

export function priceText(l: Listing, t: T): string {
  if (l.kind === 'give') return t('price.free')
  if (l.kind === 'swap') return t('price.swap')
  if (l.kind === 'garage') return l.garageDate ? formatDay(l.garageDate) : t('kind.garage')
  if (l.price === undefined) return ''
  const price = formatPLN(l.price)
  return l.unit === 'fixed' ? price : t('price.per', { price, unit: t(`unit.${l.unit}`) })
}

export function formatDay(iso: string, locale = 'pl-PL') {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function relationText(rel: Relation, user: User, users: Record<string, User>, t: T): string {
  if (user.restricted) return t('rel.restricted')
  if (rel.circle === 1) return t('rel.friend')
  if (rel.circle === 2) return t('rel.fof', { names: rel.via.map((v) => users[v]?.name.split(' ')[0]).filter(Boolean).slice(0, 2).join(', ') })
  return user.business ? `${t('rel.business')} · ${t('rel.stranger')}` : t('rel.stranger')
}

export function timeAgo(ms: number, t: T): string {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60_000))
  if (m < 1) return t('time.now')
  if (m < 60) return t('time.min', { n: m })
  const h = Math.round(m / 60)
  if (h < 24) return t('time.h', { n: h })
  return t('time.d', { n: Math.round(h / 24) })
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' | 'danger' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-opacity disabled:opacity-40',
        variant === 'primary' && 'bg-accent text-accent-ink active:opacity-85',
        variant === 'secondary' && 'border border-line bg-surface text-ink active:bg-sunken',
        variant === 'text' && 'min-h-10 px-2 text-accent',
        variant === 'danger' && 'bg-danger text-white active:opacity-85',
        className,
      )}
    />
  )
}

/** Nagłówek: duży tytuł na ekranach głównych, mały ze strzałką na podstronach. */
export function Header({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  if (!back) {
    return (
      <header className="flex items-end justify-between gap-3 px-4 pt-5 pb-2">
        <h1 className="min-w-0 truncate text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
        {right}
      </header>
    )
  }
  return (
    <header
      className="sticky z-20 flex min-h-13 items-center gap-1 border-b border-line bg-bg/95 px-2 backdrop-blur"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <button type="button" onClick={() => nav(-1)} className="grid size-11 place-items-center rounded-full text-accent" aria-label="←">
        <Icon name="back" size={24} />
      </button>
      <div className="min-w-0 flex-1 truncate text-[17px] font-semibold">{title}</div>
      {right}
    </header>
  )
}

/** Pogrupowana lista jak w ustawieniach telefonu. */
export function Group({ label, children, footer }: { label?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      {label && <h2 className="px-4 text-[13px] font-semibold text-muted">{label}</h2>}
      <div className="mx-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">{children}</div>
      {footer && <p className="px-4 text-[13px] text-muted">{footer}</p>}
    </section>
  )
}

export function Row({
  to,
  onClick,
  icon,
  title,
  detail,
  value,
  danger,
  chevron = true,
}: {
  to?: string
  onClick?: () => void
  icon?: string
  title: ReactNode
  detail?: ReactNode
  value?: ReactNode
  danger?: boolean
  chevron?: boolean
}) {
  const body = (
    <>
      {icon && <Icon name={icon} className={danger ? 'text-danger' : 'text-muted'} />}
      <span className="min-w-0 flex-1">
        <span className={cx('block', danger && 'text-danger')}>{title}</span>
        {detail && <span className="block text-[13px] text-muted">{detail}</span>}
      </span>
      {value && <span className="shrink-0 text-[15px] text-muted">{value}</span>}
      {chevron && (to || onClick) && <Icon name="chevron" size={18} className="shrink-0 text-muted" />}
    </>
  )
  const cls = 'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-sunken'
  if (to) return <Link to={to} className={cls}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>
  return <div className={cls}>{body}</div>
}

export function Toggle({ checked, onChange, label, hint, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-[30px] w-[50px] shrink-0 rounded-full bg-line transition-colors peer-checked:bg-ok peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-[2px] after:left-[2px] after:size-[26px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  )
}

export function Field({ label, hint, id, children }: { label: ReactNode; hint?: ReactNode; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-muted">{label}</label>
      {children}
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  )
}

export const inputCls =
  'min-h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[16px] outline-none placeholder:text-muted/70 focus:border-ink focus-visible:outline-none'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />
}

/** Wiersz ogłoszenia: zdjęcie, tytuł, cena, kto i jak daleko. */
export function ListingRow({ listing, meta, t }: { listing: Listing; meta?: ReactNode; t: T }) {
  return (
    <Link to={`/l/${listing.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-sunken">
      <Thumb listing={listing} size={64} className="rounded-lg" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 leading-snug">{listing.title}</span>
        <span className="tnum mt-0.5 block font-semibold">{priceText(listing, t)}</span>
        {meta && <span className="block truncate text-[13px] text-muted">{meta}</span>}
      </span>
    </Link>
  )
}

export function Notice({ tone = 'warn', children }: { tone?: 'warn' | 'ok' | 'danger'; children: ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cx(
        'rounded-xl px-3.5 py-3 text-[14px]',
        tone === 'warn' && 'bg-warn-soft text-warn',
        tone === 'ok' && 'bg-ok-soft text-ok',
        tone === 'danger' && 'bg-danger-soft text-danger',
      )}
    >
      {children}
    </div>
  )
}

export function listingUrl(id: string) {
  return `https://${BRAND.domain}/l/${id}`
}

/** Wysyłanie linku tam, gdzie ludzie już rozmawiają: WhatsApp, Messenger, SMS, e-mail. */
export function ShareSheet({ text, url, t, onClose }: { text: string; url: string; t: T; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const full = `${text}\n${url}`
  const enc = encodeURIComponent
  const targets = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(full)}` },
    { label: 'Messenger', href: `fb-messenger://share/?link=${enc(url)}` },
    { label: 'SMS', href: `sms:?&body=${enc(full)}` },
    { label: 'E-mail', href: `mailto:?subject=${enc(text)}&body=${enc(full)}` },
  ]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose} role="dialog" aria-modal aria-label={t('l.shareTitle')}>
      <div className="w-full max-w-[34rem] rounded-t-2xl bg-bg px-4 pt-3 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <p className="mb-3 font-semibold">{t('l.shareTitle')}</p>
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {targets.map((x) => (
            <a key={x.label} href={x.href} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between px-4 active:bg-sunken">
              {x.label}
              <Icon name="chevron" size={18} className="text-muted" />
            </a>
          ))}
          <button type="button" onClick={copy} className="flex min-h-12 w-full items-center justify-between px-4 text-left active:bg-sunken">
            {copied ? t('l.copied') : t('l.copy')}
            <Icon name={copied ? 'check' : 'chevron'} size={18} className={copied ? 'text-ok' : 'text-muted'} />
          </button>
        </div>
        <p className="mt-3 text-[13px] break-all text-muted select-all">{url}</p>
        <Button variant="secondary" className="mt-3 w-full" onClick={onClose}>{t('close')}</Button>
      </div>
    </div>
  )
}

/** Zmniejsza zdjęcie z aparatu, żeby zmieściło się w pamięci przeglądarki. */
export function readPhoto(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = reject
    img.src = url
  })
}

/** Zdjęcie z datą i godziną wypaloną w rogu: wspólny dowód przy wydaniu i zwrocie. */
export async function stampedPhoto(file: File): Promise<string> {
  const src = await readPhoto(file)
  const img = new Image()
  await new Promise((r) => ((img.onload = r), (img.src = src)))
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const label = new Date().toLocaleString('pl-PL')
  const size = Math.max(14, Math.round(img.width / 28))
  ctx.font = `600 ${size}px system-ui, sans-serif`
  const w = ctx.measureText(label).width + size
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(img.width - w - size / 2, img.height - size * 2, w, size * 1.6)
  ctx.fillStyle = '#fff'
  ctx.fillText(label, img.width - w, img.height - size * 0.85)
  return canvas.toDataURL('image/jpeg', 0.75)
}
