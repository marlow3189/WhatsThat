import { useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Currency, Listing, User } from '../lib/types'
import type { Relation } from '../lib/circles'
import { categoryById } from '../lib/categories'
import { formatMoney } from '../lib/money'
import type { T } from '../i18n'
import { BRAND } from '../config'
import { Icon } from './icons'

export function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ')
}

/** Odcień tła zastępczego dla kategorii (miękkie, pastelowe kafelki). */
const HUES: Record<string, number> = {
  farm: 95, cars: 212, homes: 30, services: 265, jobs: 190, tools: 38, home: 45, beauty: 335,
  fashion: 250, kids: 48, electronics: 200, sport: 160, events: 12, pets: 28, community: 220, other: 240,
}
export const hueOf = (category: string) => HUES[category] ?? 240

export function Avatar({ user, size = 40, anonymous }: { user: User; size?: number; anonymous?: boolean }) {
  const initials = anonymous
    ? '?'
    : (user.name || '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
  return (
    <span
      className={cx('inline-grid shrink-0 place-items-center rounded-full font-semibold', anonymous ? 'bg-fill-strong text-muted' : 'text-white')}
      style={{ width: size, height: size, fontSize: size * 0.38, background: anonymous ? undefined : `hsl(${user.hue} 30% 45%)` }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Zdjęcie albo pastelowy kafelek z ikoną kategorii. */
export function Thumb({ listing, size, className, iconSize }: { listing: Listing; size?: number; className?: string; iconSize?: number }) {
  const icon = categoryById(listing.category).icon
  return (
    <div
      className={cx('tint grid shrink-0 place-items-center overflow-hidden', className)}
      style={{ '--h': hueOf(listing.category), ...(size ? { width: size, height: size } : {}) } as CSSProperties}
    >
      {listing.photo ? (
        <img src={listing.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon name={icon} size={iconSize ?? (size ? size * 0.4 : 44)} strokeWidth={1.4} />
      )}
    </div>
  )
}

export function money(minor: number, currency: Currency | undefined, locale: string) {
  return formatMoney(minor, currency ?? 'PLN', locale)
}

export function priceText(l: Listing, t: T, locale = 'pl-PL'): string {
  if (l.kind === 'give') return t('price.free')
  if (l.kind === 'swap') return t('price.swap')
  if (l.kind === 'wanted') return t('price.wanted')
  if (l.kind === 'garage') return l.garageDate ? formatDay(l.garageDate, locale) : t('kind.garage')
  if (l.price === undefined) return ''
  const price = money(l.price, l.currency, locale)
  return l.unit === 'fixed' ? price : t('price.per', { price, unit: t(`unit.${l.unit}`) })
}

export function formatDay(iso: string, locale = 'pl-PL') {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function relationText(rel: Relation, user: User, users: Record<string, User>, t: T, incognito?: boolean): string {
  if (user.restricted) return t('rel.restricted')
  if (incognito) return `${t('rel.incognito')} · ${t('rel.stranger')}`
  if (rel.circle === 1) return t('rel.friend')
  if (rel.circle === 2) return t('rel.fof', { names: rel.via.map((v) => users[v]?.name.split(' ')[0]).filter(Boolean).slice(0, 2).join(', ') })
  if (user.business) return `${t('rel.business')} · ${t('rel.stranger')}`
  if (user.trusted) return `${t('rel.trusted')} · ${t('rel.stranger')}`
  return t('rel.stranger')
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
  size = 'lg',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'plain' | 'danger' | 'accent'; size?: 'lg' | 'sm' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'press inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:pointer-events-none disabled:opacity-35',
        size === 'lg' ? 'min-h-[52px] px-6 text-[17px]' : 'min-h-9 px-4 text-[15px]',
        variant === 'primary' && 'bg-primary text-primary-ink',
        variant === 'secondary' && 'bg-fill text-ink',
        variant === 'plain' && 'min-h-10 px-2 text-link',
        variant === 'danger' && 'bg-danger text-white',
        variant === 'accent' && 'bg-accent text-accent-ink',
        className,
      )}
    />
  )
}

/** Nawigacja: duży tytuł na ekranach głównych, pasek ze strzałką na podstronach. */
export function Header({ title, back, right, large, onBack }: { title: ReactNode; back?: boolean; right?: ReactNode; large?: boolean; onBack?: () => void }) {
  const nav = useNavigate()
  if (large) {
    return (
      <header className="flex items-end justify-between gap-3 px-5 pt-6 pb-3">
        <h1 className="min-w-0 truncate text-[34px] leading-[1.1] font-bold tracking-[-0.02em]">{title}</h1>
        {right}
      </header>
    )
  }
  return (
    <header className="glass sticky z-20 flex min-h-[52px] items-center gap-1 px-2" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      {back && (
        <button type="button" onClick={() => (onBack ? onBack() : nav(-1))} className="press grid size-11 place-items-center rounded-full text-link" aria-label="←">
          <Icon name="back" size={26} strokeWidth={2.2} />
        </button>
      )}
      <div className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold">{title}</div>
      <div className="flex min-w-11 justify-end">{right}</div>
    </header>
  )
}

export function CircleButton({ icon, label, onClick, className }: { icon: string; label: string; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cx('press glass grid size-10 place-items-center rounded-full text-ink', className)}>
      <Icon name={icon} size={20} strokeWidth={2} />
    </button>
  )
}

/** Lista pogrupowana jak w Ustawieniach iOS. */
export function Group({ label, children, footer, className }: { label?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <section className={cx('flex flex-col gap-2', className)}>
      {label && <h2 className="px-5 text-[13px] font-medium tracking-wide text-muted uppercase">{label}</h2>}
      <div className="card mx-4 overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">{children}</div>
      {footer && <p className="px-5 text-[13px] leading-snug text-muted">{footer}</p>}
    </section>
  )
}

export function Row({
  to,
  onClick,
  icon,
  iconBg,
  title,
  detail,
  value,
  danger,
  chevron = true,
}: {
  to?: string
  onClick?: () => void
  icon?: string
  iconBg?: string
  title: ReactNode
  detail?: ReactNode
  value?: ReactNode
  danger?: boolean
  chevron?: boolean
}) {
  const body = (
    <>
      {icon && (
        <span className={cx('grid size-8 shrink-0 place-items-center rounded-[9px]', iconBg ?? 'bg-fill', danger ? 'text-danger' : 'text-ink')}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cx('block', danger && 'text-danger')}>{title}</span>
        {detail && <span className="block text-[14px] leading-snug text-muted">{detail}</span>}
      </span>
      {value !== undefined && value !== null && <span className="shrink-0 text-right text-[16px] text-muted">{value}</span>}
      {chevron && (to || onClick) && <Icon name="chevron" size={16} strokeWidth={2.4} className="shrink-0 text-fill-strong" />}
    </>
  )
  const cls = 'flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-fill'
  if (to) return <Link to={to} className={cls}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>
  return <div className={cls}>{body}</div>
}

export function Toggle({ checked, onChange, label, hint, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {hint && <span className="block text-[14px] text-muted">{hint}</span>}
      </span>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill-strong transition-colors peer-checked:bg-switch peer-focus-visible:outline-2 peer-focus-visible:outline-link after:absolute after:top-[2px] after:left-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow-md after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  )
}

/** Przełącznik segmentowy iOS. */
export function Segmented<V extends string | number>({ value, options, onChange, label }: { value: V; options: { value: V; label: ReactNode }[]; onChange: (v: V) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-[11px] bg-fill p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx('min-h-8 truncate rounded-[9px] px-2 text-[14px] font-medium transition', o.value === value ? 'bg-surface shadow-sm' : 'text-ink/80')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({ active, children, onClick, icon }: { active?: boolean; children: ReactNode; onClick?: () => void; icon?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx('press inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] whitespace-nowrap', active ? 'bg-primary text-primary-ink' : 'bg-surface text-ink shadow-[var(--shadow)]')}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

export function Field({ label, hint, id, children }: { label: ReactNode; hint?: ReactNode; id: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="px-1 text-[13px] font-medium text-muted">{label}</label>
      {children}
      {hint && <p className="px-1 text-[13px] leading-snug text-muted">{hint}</p>}
    </div>
  )
}

export const inputCls = 'block min-h-[50px] w-full min-w-0 rounded-[14px] bg-surface px-4 text-[17px] text-ink outline-none placeholder:text-muted/70 shadow-[var(--shadow)] focus:ring-2 focus:ring-link/40'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />
}

/** Kafelek ogłoszenia: kwadratowe zdjęcie, tytuł, cena, jedna linijka kontekstu. */
export function Tile({ listing, t, meta, promoted, locale, width }: { listing: Listing; t: T; meta?: ReactNode; promoted?: string; locale: string; width?: number }) {
  return (
    <Link to={`/l/${listing.id}`} className="press flex min-w-0 shrink-0 flex-col gap-2" style={width ? { width } : undefined}>
      <div className="relative">
        <Thumb listing={listing} className="aspect-square w-full rounded-[20px]" />
        {promoted && <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[12px] font-semibold text-accent-ink">{promoted}</span>}
        {listing.status !== 'active' && (
          <span className="absolute right-2 bottom-2 rounded-full bg-primary px-2 py-0.5 text-[12px] font-semibold text-primary-ink">{t(`status.${listing.status === 'sold' ? 'sold' : 'reserved'}`)}</span>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <p className="line-clamp-2 text-[15px] leading-tight font-medium">{listing.title}</p>
        <p className="tnum mt-0.5 text-[15px] font-semibold">{priceText(listing, t, locale)}</p>
        {meta && <p className="truncate text-[13px] text-muted">{meta}</p>}
      </div>
    </Link>
  )
}

/** Wiersz ogłoszenia do list (zamówienia, moje ogłoszenia). */
export function ListingRow({ listing, meta, t, locale }: { listing: Listing; meta?: ReactNode; t: T; locale: string }) {
  return (
    <Link to={`/l/${listing.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-fill">
      <Thumb listing={listing} size={56} className="rounded-[14px]" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 font-medium">{listing.title}</span>
        <span className="tnum block text-[15px] font-semibold">{priceText(listing, t, locale)}</span>
        {meta && <span className="block truncate text-[13px] text-muted">{meta}</span>}
      </span>
      <Icon name="chevron" size={16} strokeWidth={2.4} className="text-fill-strong" />
    </Link>
  )
}

export function Notice({ tone = 'warn', children, icon }: { tone?: 'warn' | 'ok' | 'danger' | 'info'; children: ReactNode; icon?: string }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cx(
        'flex gap-2.5 rounded-[16px] px-4 py-3 text-[15px] leading-snug',
        tone === 'warn' && 'bg-warn-soft text-warn',
        tone === 'ok' && 'bg-ok-soft text-ok',
        tone === 'danger' && 'bg-danger-soft text-danger',
        tone === 'info' && 'bg-fill text-ink',
      )}
    >
      {icon && <Icon name={icon} size={20} className="mt-px shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Arkusz od dołu, jak w iOS. */
export function Sheet({ title, onClose, children }: { title?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35" onClick={onClose} role="dialog" aria-modal>
      <div
        className="sheet-in max-h-[88vh] w-full max-w-[34rem] overflow-y-auto rounded-t-[28px] bg-bg px-4 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-fill-strong" />
        {title && <p className="mb-3 px-1 text-[20px] font-bold">{title}</p>}
        {children}
      </div>
    </div>
  )
}

export function listingUrl(id: string) {
  return `https://${BRAND.domain}/l/${id}`
}

/** Wysyłanie linku tam, gdzie ludzie już są. Instagram i TikTok nie przyjmują linku z zewnątrz, więc kopiujemy i podpowiadamy. */
export function ShareSheet({ text, url, t, onClose }: { text: string; url: string; t: T; onClose: () => void }) {
  const [hint, setHint] = useState('')
  const full = `${text}\n${url}`
  const enc = encodeURIComponent
  const copy = async (app?: string) => {
    try {
      await navigator.clipboard.writeText(full)
    } catch {
      /* zaznacz ręcznie */
    }
    setHint(app ? t('l.pasteHint', { app }) : t('l.copied'))
  }
  const links: { label: string; href?: string; color: string; onClick?: () => void }[] = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(full)}`, color: '#25d366' },
    { label: 'Messenger', href: `fb-messenger://share/?link=${enc(url)}`, color: '#0866ff' },
    { label: 'SMS', href: `sms:?&body=${enc(full)}`, color: '#34c759' },
    { label: 'E-mail', href: `mailto:?subject=${enc(text)}&body=${enc(full)}`, color: '#007aff' },
    { label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, color: '#26a5e4' },
    { label: 'Viber', href: `viber://forward?text=${enc(full)}`, color: '#7360f2' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: '#0866ff' },
    { label: 'X', href: `https://x.com/intent/post?text=${enc(full)}`, color: '#000000' },
    { label: 'Instagram', onClick: () => copy('Instagram'), color: '#e1306c' },
    { label: 'TikTok', onClick: () => copy('TikTok'), color: '#111111' },
  ]
  const native = typeof navigator !== 'undefined' && 'share' in navigator
  return (
    <Sheet title={t('l.shareTitle')} onClose={onClose}>
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-1 pb-4">
        {links.map((x) => {
          const inner = (
            <>
              <span className="grid size-14 place-items-center rounded-[16px] text-[20px] font-bold text-white" style={{ background: x.color }} aria-hidden>
                {x.label[0]}
              </span>
              <span className="text-[12px]">{x.label}</span>
            </>
          )
          return x.href ? (
            <a key={x.label} href={x.href} target="_blank" rel="noreferrer" className="press flex flex-col items-center gap-1.5">{inner}</a>
          ) : (
            <button key={x.label} type="button" onClick={x.onClick} className="press flex flex-col items-center gap-1.5">{inner}</button>
          )
        })}
        {native && (
          <button type="button" onClick={() => navigator.share({ title: text, text, url }).catch(() => {})} className="press flex flex-col items-center gap-1.5">
            <span className="grid size-14 place-items-center rounded-[16px] bg-fill-strong text-ink"><Icon name="more" size={26} /></span>
            <span className="text-[12px]">{t('l.more')}</span>
          </button>
        )}
      </div>
      <div className="card flex items-center gap-2 p-2 pl-4">
        <span className="min-w-0 flex-1 truncate text-[15px] text-muted select-all">{url}</span>
        <Button size="sm" variant="secondary" onClick={() => copy()}>{t('l.copy')}</Button>
      </div>
      {hint && <p className="mt-3 px-1 text-[14px] text-ok">{hint}</p>}
    </Sheet>
  )
}

/** Zmniejsza zdjęcie z aparatu, żeby nie zapychało telefonu (oryginał trafia na serwer). */
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
