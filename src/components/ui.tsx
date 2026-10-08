import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Currency, Listing, User } from '../lib/types'
import type { Relation } from '../lib/circles'
import { categoryById } from '../lib/categories'
import { formatMoney } from '../lib/money'
import type { T } from '../i18n'
import { BRAND } from '../config'
import { Icon } from './icons'
import { identicon } from '../lib/identity'

export function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ')
}

/** Odcień tła zastępczego dla kategorii (miękkie, pastelowe kafelki). */
const HUES: Record<string, number> = {
  farm: 95, cars: 212, homes: 30, services: 265, jobs: 190, tools: 38, home: 45, beauty: 335,
  fashion: 250, kids: 48, electronics: 200, sport: 160, events: 12, pets: 28, community: 220, heating: 18, other: 240,
}
export const hueOf = (category: string) => HUES[category] ?? 240

/** Kolorowy kwadrat ikony w listach (kolor zależy od motywu): stały dla danej ikony, żeby ekran nie „mrugał”. */
const PASTELS = ['tile-1', 'tile-2', 'tile-3', 'tile-4', 'tile-5']
export function pastelOf(key: string) {
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PASTELS[h % PASTELS.length]
}

export function Avatar({ user, size = 40, anonymous }: { user: User; size?: number; anonymous?: boolean }) {
  if (!anonymous && user.anon && user.anonKey) return <KeyAvatar anonKey={user.anonKey} size={size} />
  const ordinal = user.name?.match(/#(\d+)/)
  const initials = anonymous
    ? '?'
    : ordinal
      ? `#${ordinal[1]}`
      : (user.name || '?')
          .split(/\s+/)
          // tylko słowa zaczynające się literą i dłuższe niż jeden znak („Heniek z Lipowej” → HL)
          .filter((w, _i, all) => (/^\p{L}/u.test(w) && w.length > 1) || all.length === 1)
          .map((p) => p[0].toUpperCase())
          .slice(0, 2)
          .join('') || '?'
  return (
    <span
      className={cx('inline-grid shrink-0 place-items-center rounded-full font-bold', anonymous && 'bg-fill-strong text-muted')}
      style={{ width: size, height: size, fontSize: size * 0.36, ...(anonymous ? {} : { background: `hsl(${user.hue} 80% 86%)`, color: `hsl(${user.hue} 55% 26%)` }) }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Awatar z anonimowego klucza: ten sam klucz zawsze daje ten sam wzór, bez imienia i numeru. */
export function KeyAvatar({ anonKey, size = 40 }: { anonKey: string; size?: number }) {
  const { hue, cells } = identicon(anonKey)
  return (
    <span className="inline-grid shrink-0 place-items-center overflow-hidden rounded-full" style={{ width: size, height: size, background: `hsl(${hue} 70% 92%)` }} aria-hidden>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 5 5" shapeRendering="crispEdges">
        {cells.map((on, i) => (on ? <rect key={i} x={i % 5} y={Math.floor(i / 5)} width="1" height="1" fill={`hsl(${hue} 55% 38%)`} /> : null))}
      </svg>
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
  if (l.category === 'community') {
    if (l.sub === 'ask') return t('board.ask')
    if (l.sub === 'help') return t('board.help')
    if ((l.sub === 'localevents' || l.sub === 'meet') && l.garageDate) return formatDay(l.garageDate, locale)
  }
  if (l.kind === 'give') return t('price.free')
  if (l.kind === 'swap') return t('price.swap')
  if (l.kind === 'wanted') return t('price.wanted')
  if (l.kind === 'garage') return l.garageDate ? formatDay(l.garageDate, locale) : t('kind.garage')
  if (l.price === undefined) return ''
  const price = money(l.price, l.currency, locale)
  const text = l.unit === 'fixed' ? price : t('price.per', { price, unit: t(`unit.${l.unit}`) })
  // Praca: zawsze stawka do ręki, żeby było jasne, ile się zarobi.
  return l.category === 'jobs' && l.kind === 'service' ? `${text} ${t('price.net')}` : text
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
        'press inline-flex items-center justify-center gap-2 rounded-full font-bold disabled:pointer-events-none disabled:opacity-35',
        size === 'lg' ? 'min-h-11 px-5 text-[15px]' : 'min-h-9 px-4 text-[14px]',
        variant === 'primary' && 'bg-primary text-primary-ink',
        variant === 'secondary' && 'bg-surface text-ink shadow-[var(--shadow)]',
        variant === 'plain' && 'min-h-10 px-2 text-link',
        variant === 'danger' && 'bg-danger text-white',
        variant === 'accent' && 'bg-accent text-accent-ink',
        className,
      )}
    />
  )
}

/**
 * Górny pasek jak w WhatsAppie: na zakładkach tytuł po lewej (22 px) i ikony po prawej,
 * na podstronach strzałka wstecz i tytuł obok niej. Pasek zostaje na górze przy przewijaniu.
 */
export function Header({ title, back, right, large, onBack }: { title: ReactNode; back?: boolean; right?: ReactNode; large?: boolean; onBack?: () => void }) {
  const nav = useNavigate()
  if (large) {
    return (
      <header className="flex min-h-14 items-center justify-between gap-3 px-4 pt-3 pb-1">
        <h1 className="min-w-0 truncate text-[22px] leading-tight font-bold">{title}</h1>
        {right}
      </header>
    )
  }
  return (
    <header className="sticky z-20 flex min-h-14 items-center gap-1 border-b border-line bg-surface px-1" style={{ top: 'var(--sat)' }}>
      {back && (
        <button type="button" onClick={() => (onBack ? onBack() : nav(-1))} className="press grid size-12 shrink-0 place-items-center rounded-full text-ink active:bg-fill" aria-label={backLabel()}>
          <Icon name="back" size={22} strokeWidth={2.2} />
        </button>
      )}
      <div className={cx('min-w-0 flex-1 truncate text-[18px] font-bold', !back && 'pl-3')}>{title}</div>
      <div className="flex min-w-12 shrink-0 items-center justify-end pr-1">{right}</div>
    </header>
  )
}

/** Podpis przycisku wstecz w języku strony (czytniki ekranu i testy szukają „Wstecz”). */
function backLabel() {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'pl'
  return ({ pl: 'Wstecz', en: 'Back', de: 'Zurück', uk: 'Назад', cs: 'Zpět', sk: 'Späť', hu: 'Vissza', it: 'Indietro', es: 'Atrás', hi: 'वापस' } as Record<string, string>)[lang] ?? 'Wstecz'
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
      {label && <h2 className="px-5 text-[15px] font-bold">{label}</h2>}
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
        <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', iconBg ?? (danger ? 'bg-danger-soft' : pastelOf(icon)), danger ? 'text-danger' : 'text-ink')}>
          <Icon name={icon} size={17} />
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
  const cls = 'flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left active:bg-fill'
  if (to) return <Link to={to} className={cls}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>
  return <div className={cls}>{body}</div>
}

export function Toggle({ checked, onChange, label, hint, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
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
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-full bg-fill-strong/60 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx('min-h-8 truncate rounded-full px-2 text-[14px] font-medium transition', o.value === value ? 'bg-surface font-semibold shadow-sm' : 'text-ink/75')}
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
      className={cx('press inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] whitespace-nowrap', active ? 'bg-primary-soft font-semibold text-primary' : 'bg-fill text-ink')}
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

export const inputCls = 'block min-h-11 w-full min-w-0 rounded-[12px] border border-line bg-surface px-3.5 text-[16px] text-ink outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/25'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />
}

/** Kafelek ogłoszenia: kwadratowe zdjęcie, tytuł, cena, jedna linijka kontekstu. */
export function Tile({ listing, t, meta, promoted, locale, width }: { listing: Listing; t: T; meta?: ReactNode; promoted?: string; locale: string; width?: number }) {
  return (
    <Link to={`/l/${listing.id}`} className="press flex min-w-0 shrink-0 flex-col gap-1.5" style={width ? { width } : undefined}>
      <div className="relative">
        <Thumb listing={listing} className={cx('aspect-square w-full rounded-[16px]', listing.status === 'sold' && 'opacity-45 grayscale')} iconSize={40} />
        {promoted && <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-bold text-accent-ink">{promoted}</span>}
        {listing.status !== 'active' && <StatusBadge status={listing.status} t={t} className="absolute right-2 bottom-2" />}
      </div>
      <div className="min-w-0 px-0.5">
        <p className="line-clamp-2 text-[14px] leading-tight font-medium">{listing.title}</p>
        <p className="tnum mt-0.5 text-[14px] font-semibold">{priceText(listing, t, locale)}</p>
        {meta && <p className="truncate text-[12px] text-muted">{meta}</p>}
      </div>
    </Link>
  )
}

export function StatusBadge({ status, t, className }: { status: Listing['status']; t: T; className?: string }) {
  if (status === 'active' || status === 'removed') return null
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold', status === 'sold' ? 'bg-ink text-white' : 'bg-sun text-ink', className)}>
      {status === 'sold' && <Icon name="check" size={12} strokeWidth={3} />}
      {t(`status.${status}`)}
    </span>
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
        style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
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

/**
 * Poziome przewijanie jak relacje na Instagramie i w WhatsAppie: palcem na telefonie,
 * myszką przez przeciągnięcie albo strzałki na komputerze. Przeciągnięcie nie otwiera kafelka.
 */
export function Scroller({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [edges, setEdges] = useState({ l: false, r: false })
  const update = () => {
    const el = ref.current
    if (!el) return
    setEdges({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }
  useEffect(() => {
    update()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="group/scroller relative">
      <div
        ref={ref}
        role={label ? 'region' : undefined}
        aria-label={label}
        onScroll={update}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !ref.current) return
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d || !ref.current) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 5) d.moved = true
          if (d.moved) ref.current.scrollLeft = d.left - dx
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className={cx('no-scrollbar flex snap-x snap-proximity scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 select-none [&>*]:snap-start', className)}
      >
        {children}
      </div>
      {edges.l && (
        <button type="button" onClick={() => by(-1)} aria-label="←" className="press absolute top-1/2 left-1.5 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-[0_4px_14px_rgb(20_27_45/0.16)] [@media(hover:hover)]:grid">
          <Icon name="back" size={18} strokeWidth={2.4} />
        </button>
      )}
      {edges.r && (
        <button type="button" onClick={() => by(1)} aria-label="→" className="press absolute top-1/2 right-1.5 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-[0_4px_14px_rgb(20_27_45/0.16)] [@media(hover:hover)]:grid">
          <Icon name="chevron" size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  )
}
