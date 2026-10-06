import { useState } from 'react'
import type { T } from '../i18n'
import { LANGS } from '../i18n'
import { TERMS } from '../legal/terms'
import { BRAND } from '../config'
import type { Lang } from '../lib/types'
import { Sheet, cx } from './ui'
import { Icon } from './icons'

/** Pięć najważniejszych zasad, każda z ikoną, krótkim tytułem i jednym zdaniem. */
const KEY_TERMS = [
  { icon: 'users', title: 'terms.h1', text: 'terms.1', bg: 'bg-peach' },
  { icon: 'card', title: 'terms.h2', text: 'terms.2', bg: 'bg-mint' },
  { icon: 'doc', title: 'terms.h3', text: 'terms.3', bg: 'bg-sky' },
  { icon: 'shield', title: 'terms.h4', text: 'terms.7', bg: 'bg-lilac' },
  { icon: 'lock', title: 'terms.h5', text: 'terms.9', bg: 'bg-sun' },
] as const

export function KeyTerms({ t }: { t: T }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {KEY_TERMS.map((k) => (
        <li key={k.title} className="card flex gap-3.5 p-4">
          <span className={cx('grid size-10 shrink-0 place-items-center rounded-full text-ink', k.bg)}>
            <Icon name={k.icon} size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] leading-tight font-bold">{t(k.title)}</span>
            <span className="mt-1 block text-[14px] leading-snug text-muted">{t(k.text)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

const fill = (s: string) => s.replace(/\{brand\}/g, BRAND.name).replace(/\{email\}/g, BRAND.email).replace(/\{domain\}/g, BRAND.domain)

/** Pełny regulamin z wyborem jednego z 9 języków (domyślnie język aplikacji). */
export function TermsSheet({ lang, t, onClose }: { lang: Lang; t: T; onClose: () => void }) {
  const [shown, setShown] = useState<Lang>(lang)
  const doc = TERMS[shown]
  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2" lang={shown}>
        <div className="flex items-start justify-between gap-3 px-1">
          <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.02em]">{fill(doc.title)}</h2>
          <button type="button" onClick={onClose} aria-label={t('close')} className="press grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[var(--shadow)]">
            <Icon name="plus" size={20} className="rotate-45" />
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label={t('terms.lang')}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={shown === l.id}
              onClick={() => setShown(l.id)}
              lang={l.id}
              className={cx('press min-h-9 shrink-0 rounded-full px-3.5 text-[14px] font-semibold', shown === l.id ? 'bg-ink text-white' : 'bg-surface shadow-[var(--shadow)]')}
            >
              {l.name}
            </button>
          ))}
        </div>
        <p className="px-1 text-[13px] text-muted">{doc.note}</p>
        <div className="card flex flex-col gap-4 p-5">
          {doc.sections.map(([h, body]) => (
            <section key={h} className="flex flex-col gap-1">
              <h3 className="text-[15px] font-bold">{fill(h)}</h3>
              <p className="text-[14px] leading-relaxed text-ink/80">{fill(body)}</p>
            </section>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
