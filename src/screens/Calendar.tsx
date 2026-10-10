import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Button, Field, Header, Input, Sheet, Toggle, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { addDays, dayKey, monthGrid, type AgendaItem, type AgendaSource } from '../lib/calendar'
import { useAgenda } from '../components/agenda'

const SOURCE: Record<AgendaSource, { icon: string; tile: string }> = {
  mine: { icon: 'calendar', tile: 'tile-1' },
  event: { icon: 'users', tile: 'tile-3' },
  order: { icon: 'bag', tile: 'tile-4' },
  waste: { icon: 'trash', tile: 'tile-2' },
  plan: { icon: 'star', tile: 'tile-5' },
}

/** Prywatny kalendarz: miesiąc z kropkami, lista wybranego dnia, najbliższe terminy i „Dodaj termin”. */
export function Calendar() {
  const { t, locale, account, addCalendarEntry, removeCalendarEntry } = useStore()
  const items = useAgenda()
  const today = dayKey(Date.now())
  const [day, setDay] = useState(today)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<AgendaItem | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [remind, setRemind] = useState(true)

  const byDay = useMemo(() => {
    const m = new Map<string, AgendaItem[]>()
    for (const i of items) m.set(i.date, [...(m.get(i.date) ?? []), i])
    return m
  }, [items])
  const grid = monthGrid(month)
  const [y, mo] = month.split('-').map(Number)
  const monthName = new Date(y, mo - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const weekdays = Array.from({ length: 7 }, (_, k) => new Date(2026, 0, 5 + k).toLocaleDateString(locale, { weekday: 'narrow' }))
  const shift = (n: number) => setMonth(dayKey(new Date(y, mo - 1 + n, 1)).slice(0, 7))
  const dayLabel = (d: string) => (d === today ? t('cal.today') : d === addDays(today, 1) ? t('cal.tomorrow') : new Date(`${d}T12:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }))
  const upcoming = items.filter((i) => i.date > day && i.date <= addDays(today, 30)).slice(0, 8)

  const startAdd = () => {
    setTitle('')
    setDate(day)
    setTime('')
    setNote('')
    setRemind(true)
    setAdding(true)
  }
  const save = () => {
    addCalendarEntry({ title, date, time: time || undefined, note: note || undefined, remind })
    setDay(date)
    setMonth(date.slice(0, 7))
    setAdding(false)
  }

  const Row = ({ i }: { i: AgendaItem }) => {
    const s = SOURCE[i.source]
    const body = (
      <>
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-[11px]', s.tile)}><Icon name={s.icon} size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{i.title}</span>
          <span className="block text-[12.5px] text-muted">{i.time ?? t('cal.allDay')} · {t(`cal.src.${i.source}`)}</span>
        </span>
        <Icon name="chevron" size={15} className="shrink-0 text-fill-strong" />
      </>
    )
    const cls = 'flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left active:bg-fill'
    return i.link ? <Link to={i.link} className={cls}>{body}</Link> : <button type="button" onClick={() => setOpen(i)} className={cls}>{body}</button>
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <Header back title={t('cal.title')} right={<button type="button" onClick={startAdd} className="press grid size-10 place-items-center rounded-full bg-primary text-primary-ink" aria-label={t('cal.add')}><Icon name="plus" size={20} strokeWidth={2.4} /></button>} />

      <section className="card mx-4 p-3">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="press grid size-9 place-items-center rounded-full active:bg-fill" aria-label="←"><Icon name="back" size={18} /></button>
          <p className="text-[15px] font-bold capitalize">{monthName}</p>
          <button type="button" onClick={() => shift(1)} className="press grid size-9 place-items-center rounded-full active:bg-fill" aria-label="→"><Icon name="chevron" size={18} /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted uppercase">
          {weekdays.map((w, k) => <span key={k} className="py-1">{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {grid.map((d) => {
            const has = byDay.get(d)
            const other = d.slice(0, 7) !== month
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                aria-pressed={d === day}
                aria-label={dayLabel(d)}
                className={cx('press mx-auto flex size-10 flex-col items-center justify-center rounded-full text-[14px] tnum', d === day ? 'bg-primary font-bold text-primary-ink' : d === today ? 'bg-primary-soft font-bold text-primary-strong' : other ? 'text-muted/50' : '')}
              >
                {Number(d.slice(8))}
                <span className={cx('mt-0.5 size-1 rounded-full', has ? (d === day ? 'bg-primary-ink' : 'bg-primary') : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-4 text-[15px] font-bold first-letter:uppercase">{dayLabel(day)}</h2>
        <div className="card mx-4 overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
          {(byDay.get(day) ?? []).length ? (byDay.get(day) ?? []).map((i) => <Row key={i.id} i={i} />) : <p className="px-4 py-3 text-[14px] text-muted">{t('cal.dayEmpty')}</p>}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-4 text-[15px] font-bold">{t('cal.upcoming')}</h2>
          <div className="card mx-4 overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
            {upcoming.map((i) => (
              <div key={i.id} className="flex items-center">
                <span className="tnum w-16 shrink-0 pl-3 text-[12px] font-semibold text-muted">{new Date(`${i.date}T12:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                <div className="min-w-0 flex-1"><Row i={i} /></div>
              </div>
            ))}
          </div>
        </section>
      )}
      {items.length === 0 && <p className="px-5 text-[14px] text-muted">{t('cal.empty')}</p>}
      <p className="flex items-center justify-center gap-1.5 px-5 text-[12.5px] text-muted"><Icon name="lock" size={13} /> {t('cal.private')}</p>

      {adding && (
        <Sheet title={t('cal.add')} onClose={() => setAdding(false)}>
          <div className="flex flex-col gap-3">
            <Field id="cal-title" label={t('cal.what')}>
              <Input id="cal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('cal.whatPh')} maxLength={120} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id="cal-date" label={t('cal.date')}><Input id="cal-date" type="date" value={date} onChange={(e) => setDate(e.target.value || today)} /></Field>
              <Field id="cal-time" label={t('cal.time')}><Input id="cal-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
            </div>
            <Field id="cal-note" label={t('cal.note')}><Input id="cal-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
            <div className="card overflow-hidden"><Toggle id="cal-remind" label={t('cal.remind')} checked={remind} onChange={setRemind} /></div>
            <Button disabled={title.trim().length < 2} onClick={save}>{t('save')}</Button>
          </div>
        </Sheet>
      )}
      {open && (
        <Sheet title={open.title} onClose={() => setOpen(null)}>
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[15px]">{dayLabel(open.date)}{open.time ? ` · ${open.time}` : ''}</p>
            {open.entryId && <p className="px-1 text-[14px] text-muted">{account.calendar?.find((e) => e.id === open.entryId)?.note}</p>}
            {open.entryId && (
              <Button variant="danger" onClick={() => { removeCalendarEntry(open.entryId!); setOpen(null) }}>{t('cal.delete')}</Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(null)}>{t('close')}</Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
