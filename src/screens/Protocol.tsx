import { useParams } from 'react-router'
import { useStore } from '../data/store'
import { Button, Header, cx, readPhoto } from '../components/ui'
import { formatPLN } from '../lib/money'
import { STATUS } from './Chats'

/** Nanosi datę i godzinę na zdjęcie. To dowód w razie sporu o uszkodzenie. */
async function stamped(file: File): Promise<string> {
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

export function Protocol() {
  const { id } = useParams()
  const { bookings, listings, addProtocolPhoto, setBookingStatus } = useStore()
  const booking = bookings.find((b) => b.id === id)
  if (!booking) return <><Header title="Protokół" back /><p className="p-6 text-muted">Nie znaleziono wypożyczenia.</p></>
  const listing = listings.find((l) => l.id === booking.listingId)
  const s = STATUS[booking.status]
  const returned = booking.status === 'returned'

  return (
    <>
      <Header title="Protokół" back right={<span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', s.tone)}>{s.label}</span>} />
      <div className="flex flex-col gap-6 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold">{listing?.title}</h1>
          <p className="text-sm text-muted">
            Zrób 3–4 zdjęcia przy odbiorze i tyle samo przy zwrocie. Na każdym zapisujemy datę i godzinę.
            Jeśli coś się zepsuje, porównujemy zdjęcia i decydujemy o kaucji.
          </p>
        </div>
        <PhotoStep
          title="Przy odbiorze"
          id="before"
          photos={booking.photosBefore}
          disabled={returned}
          onAdd={async (f) => addProtocolPhoto(booking.id, 'before', await stamped(f))}
        />
        <PhotoStep
          title="Przy zwrocie"
          id="after"
          photos={booking.photosAfter}
          disabled={returned || booking.photosBefore.length === 0}
          hint={booking.photosBefore.length === 0 ? 'Najpierw zdjęcia przy odbiorze.' : undefined}
          onAdd={async (f) => addProtocolPhoto(booking.id, 'after', await stamped(f))}
        />
        {returned ? (
          <p className="rounded-xl bg-ok-soft px-3 py-3 text-sm text-ok">
            Zwrot potwierdzony. {booking.quote.depositHold > 0 ? `Blokada ${formatPLN(booking.quote.depositHold)} zwolniona.` : ''} Wystaw opinię w czacie.
          </p>
        ) : (
          <Button disabled={booking.photosAfter.length === 0} onClick={() => setBookingStatus(booking.id, 'returned')}>
            Potwierdź zwrot{booking.quote.depositHold > 0 ? ' i zwolnij kaucję' : ''}
          </Button>
        )}
      </div>
    </>
  )
}

function PhotoStep({ title, id, photos, onAdd, disabled, hint }: { title: string; id: string; photos: string[]; onAdd: (f: File) => void; disabled?: boolean; hint?: string }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">{title}</h2>
        <span className="tnum text-sm text-muted">{photos.length} zdj.</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => <img key={i} src={p} alt={`${title}, zdjęcie ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />)}
        <label htmlFor={`photo-${id}`} className={cx('grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-sm font-semibold text-muted', disabled ? 'opacity-40' : 'cursor-pointer')}>
          + Zdjęcie
          <input id={`photo-${id}`} type="file" accept="image/*" capture="environment" className="sr-only" disabled={disabled} onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onAdd(f)
            e.target.value = ''
          }} />
        </label>
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </section>
  )
}
