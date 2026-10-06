import type { Quote } from '../lib/types'
import { formatPLN } from '../lib/money'

export function QuoteView({ quote, totalLabel = 'Razem' }: { quote: Quote; totalLabel?: string }) {
  return (
    <div className="tnum flex flex-col gap-1.5 text-sm">
      {quote.lines.map((l) => (
        <div key={l.label} className="flex justify-between gap-3">
          <span className="text-muted">{l.label}</span>
          <span>{l.hint && l.amount === 0 ? <span className="font-medium text-ok">{l.hint}</span> : formatPLN(l.amount)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2 text-base font-bold">
        <span>{totalLabel}</span>
        <span>{formatPLN(quote.total)}</span>
      </div>
      {quote.depositHold > 0 && (
        <p className="rounded-lg bg-sunken px-3 py-2 text-xs text-muted">
          Kaucja {formatPLN(quote.depositHold)} to blokada na karcie, nie płatność. Zwalniamy ją po zwrocie z protokołem zdjęć.
        </p>
      )}
    </div>
  )
}
