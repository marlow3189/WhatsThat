import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Circle, Listing, User } from '../lib/types'
import type { Relation } from '../lib/circles'
import { CIRCLE_LABEL } from '../lib/circles'
import { formatShort } from '../lib/money'

export const CATEGORIES = {
  narzedzia: 'Narzędzia',
  ogrod: 'Ogród',
  outdoor: 'Outdoor',
  sport: 'Sport',
  auto: 'Auto',
  elektronika: 'Elektronika',
  dom: 'Dom',
  impreza: 'Imprezy',
  dzieci: 'Dzieci',
  inne: 'Inne',
} as const

export const MODE_LABEL = { rent: 'Wynajem', lend: 'Za darmo', sell: 'Sprzedaż', swap: 'Wymiana' } as const

const circleColor: Record<Circle, string> = { 1: 'var(--c1)', 2: 'var(--c2)', 3: 'var(--c3)' }

export function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ')
}

export function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${user.hue} 55% 46%)` }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Trzy kręgi: wypełnione do poziomu kręgu. */
export function Rings({ circle, size = 14 }: { circle: Circle; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7" fill="none" stroke={circleColor[3]} strokeWidth="1.6" opacity={circle >= 3 ? 1 : 0.25} />
      <circle cx="8" cy="8" r="4.4" fill="none" stroke={circleColor[2]} strokeWidth="1.6" opacity={circle >= 2 ? 1 : 0.25} />
      <circle cx="8" cy="8" r="2" fill={circleColor[1]} />
    </svg>
  )
}

export function CircleBadge({ rel, users }: { rel: Relation; users: Record<string, User> }) {
  const via = rel.via.map((id) => users[id]?.name.split(' ')[0]).filter(Boolean)
  const text = rel.circle === 2 && via.length ? `przez ${via.slice(0, 2).join(', ')}` : CIRCLE_LABEL[rel.circle]
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium" style={{ color: circleColor[rel.circle] }}>
      <Rings circle={rel.circle} size={12} />
      <span className="truncate">{text}</span>
    </span>
  )
}

export function priceLabel(l: Listing): string {
  switch (l.mode) {
    case 'rent':
      return `${formatShort(l.pricePerDay ?? 0)}/dzień`
    case 'sell':
      return formatShort(l.price ?? 0)
    case 'lend':
      return 'Za darmo'
    case 'swap':
      return 'Wymiana'
  }
}

export function Thumb({ listing, className }: { listing: Listing; className?: string }) {
  const hue = (listing.title.length * 37 + listing.category.length * 53) % 360
  return (
    <div
      className={cx('relative grid aspect-[4/3] max-w-full place-items-center overflow-hidden', className)}
      style={{ background: `hsl(${hue} 60% 50% / 0.14)` }}
    >
      {listing.photo ? (
        <img src={listing.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-5xl" aria-hidden>
          {listing.emoji}
        </span>
      )}
    </div>
  )
}

export function ListingCard({
  listing,
  rel,
  users,
  distance,
}: {
  listing: Listing
  rel: Relation
  users: Record<string, User>
  distance?: string
}) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now()
  return (
    <Link
      to={`/l/${listing.id}`}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-transform active:scale-[0.98]"
    >
      <div className="relative">
        <Thumb listing={listing} />
        <span className="absolute top-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
          {MODE_LABEL[listing.mode]}
        </span>
        {boosted && (
          <span className="absolute top-2 right-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
            Wyróżnione
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">{listing.title}</h3>
        <p className="tnum font-display text-lg font-bold">{priceLabel(listing)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted">
          <CircleBadge rel={rel} users={users} />
          {distance && <span className="tnum shrink-0">{distance}</span>}
        </div>
      </div>
    </Link>
  )
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition disabled:opacity-40',
        variant === 'primary' && 'bg-brand text-brand-ink active:brightness-95',
        variant === 'soft' && 'bg-brand-soft text-brand',
        variant === 'ghost' && 'border border-line bg-surface text-ink',
        className,
      )}
    />
  )
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition',
        active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink',
      )}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-sunken p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition',
            o.value === value ? 'bg-surface shadow-sm' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Header({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header
      className="sticky z-20 flex min-h-14 items-center gap-2 border-b border-line bg-bg/90 px-4 backdrop-blur"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      {back && (
        <button type="button" onClick={() => nav(-1)} className="-ml-2 grid size-10 place-items-center rounded-full" aria-label="Wstecz">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1 truncate font-display text-xl font-bold">{title}</div>
      {right}
    </header>
  )
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Toggle({ checked, onChange, label, hint, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}

/** Zmniejsza zdjęcie z aparatu, żeby mieściło się w pamięci przeglądarki. */
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
