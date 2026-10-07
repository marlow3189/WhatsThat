import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { Button, Group, Header, Notice, Row, Segmented, cx } from '../components/ui'
import { buildReport, deadline, isApproaching, isReportSeason, toCsv, type Dac7Activity } from '../lib/dac7'
import { monthlyCosts, monthlyRevenue, sum } from '../lib/costs'
import { formatPLN } from '../lib/money'
import { seedSales, seedSellerData } from '../data/seed'
import { BRAND } from '../config'
import { BACKEND_HOST, LIVE, checkConnection, type Health } from '../lib/backend'

/** Tryb pracy i test połączenia z bazą: pierwsze, co sprawdzasz po wdrożeniu (docs/START.md). */
function BackendCard() {
  const [h, setH] = useState<Health>()
  const [busy, setBusy] = useState(false)
  const test = async () => {
    setBusy(true)
    setH(await checkConnection())
    setBusy(false)
  }
  return (
    <Group label="Baza danych" footer={LIVE ? 'Dane zapisują się w Supabase.' : 'Dane przykładowe zapisują się tylko na tym urządzeniu. Tryb na żywo włącza się po dodaniu VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w Cloudflare (docs/PLAN.md, faza 1).'}>
      <Row icon="chart" title="Tryb" value={<span className={cx('rounded-full px-2.5 py-0.5 text-[13px] font-bold', LIVE ? 'bg-ok-soft text-ok' : 'bg-fill text-muted')}>{LIVE ? 'na żywo' : 'demo'}</span>} detail={BACKEND_HOST || undefined} />
      <div className="flex flex-col gap-2 p-4">
        <Button size="sm" variant="secondary" disabled={busy} onClick={test}>{busy ? 'Sprawdzam…' : 'Sprawdź połączenie z bazą'}</Button>
        {h && <Notice tone={h.ok ? 'ok' : 'warn'} icon={h.ok ? 'check' : 'info'}>{h.detail}</Notice>}
      </div>
    </Group>
  )
}

const ACT: Record<Dac7Activity, string> = { goods: 'sprzedaż towarów', property: 'najem nieruchomości', transport: 'najem pojazdów', services: 'usługi osobiste' }
const FIELD: Record<string, string> = { name: 'imię i nazwisko', address: 'adres', taxId: 'NIP/PESEL', birthDate: 'data urodzenia' }
const REASON: Record<string, string> = { scam: 'oszustwo', illegal: 'nielegalne', fake: 'podróbka', rights: 'naruszenie praw', offensive: 'obraźliwe', other: 'inne' }

/**
 * Panel operatora (tylko po polsku, dla właściciela serwisu).
 * Obowiązki, które da się zautomatyzować, dzieją się same; panel tylko podpowiada, co wysłać i kiedy.
 */
export function Operator() {
  const { reports, listings, users, decideReport } = useStore()
  const [mau, setMau] = useState(10_000)
  const [csv, setCsv] = useState('')
  const [asked, setAsked] = useState(false)
  const [notified, setNotified] = useState(false)
  const year = 2026
  const now = new Date()
  const due = deadline(year)
  const season = isReportSeason(year, now)
  const daysToDue = Math.ceil((due.getTime() - now.getTime()) / 86_400_000)
  const rows = useMemo(() => buildReport(seedSales, seedSellerData), [])
  const approaching = seedSales.filter(isApproaching)
  const missing = rows.filter((r) => r.missing.length)

  const scenario = { mau, newUsers: Math.round(mau * 0.08), conversion: 0.06, refreshRate: 0.25 }
  const costs = monthlyCosts(scenario)
  const revenue = monthlyRevenue(scenario)
  const total = sum(costs)

  return (
    <div className="flex flex-col gap-7 pb-10">
      <Header back title="Panel operatora" />

      <BackendCard />

      <Group label="Raport DAC7 za 2026" footer={`Informacja DPI-IS do Szefa KAS w XML według schematu Ministerstwa Finansów. Termin ${due.toLocaleDateString('pl-PL')}. W tym samym terminie sprzedawcy dostają swoje dane.`}>
        <div className="p-4">
          {season ? (
            <Notice tone="warn" icon="calendar">Sezon raportowy: do terminu zostało {daysToDue} dni. Przygotuj plik i powiadom sprzedawców.</Notice>
          ) : (
            <Notice tone="info" icon="calendar">Przypomnienie pojawi się tu 1 grudnia {year}. Termin: {due.toLocaleDateString('pl-PL')} ({daysToDue} dni).</Notice>
          )}
        </div>
        {rows.map((r) => (
          <Row
            key={r.sellerId}
            title={users[r.sellerId]?.name ?? r.sellerId}
            detail={`${r.activities.map((a) => ACT[a]).join(', ')} · ${r.count} transakcji`}
            value={
              <span className="flex flex-col items-end">
                <span className="tnum text-ink">{formatPLN(r.totalPln)}</span>
                {r.missing.length ? <span className="text-[12px] text-danger">brak: {r.missing.map((m) => FIELD[m]).join(', ')}</span> : <span className="text-[12px] text-ok">dane kompletne</span>}
              </span>
            }
          />
        ))}
        <div className="flex flex-col gap-2 p-4">
          <Button size="sm" variant="secondary" disabled={asked || !missing.length} onClick={() => setAsked(true)}>
            {asked ? `Wysłano prośbę o dane do ${missing.length} osób` : `Poproś o brakujące dane (${missing.length})`}
          </Button>
          <Button size="sm" onClick={() => setCsv(toCsv(rows, seedSellerData))}>Przygotuj plik roboczy</Button>
          <Button size="sm" variant="secondary" disabled={notified} onClick={() => setNotified(true)}>{notified ? 'Sprzedawcy powiadomieni' : 'Powiadom sprzedawców o raporcie'}</Button>
        </div>
        {csv && <pre className="max-h-56 overflow-auto bg-fill p-3 text-[11px] leading-relaxed">{csv}</pre>}
      </Group>

      <Group label="Zbliżają się do progu" footer="Sprzedaż towarów: wyłączeni tylko ci z mniej niż 30 transakcjami i poniżej 2 000 EUR. Od 25 transakcji aplikacja sama prosi o dane.">
        {approaching.length ? approaching.map((a) => <Row key={a.sellerId + a.activity} title={users[a.sellerId]?.name} detail={`${a.count} transakcji · ${formatPLN(a.totalPln)}`} value="poproszono o dane" />) : <p className="px-4 py-3 text-muted">Nikt.</p>}
      </Group>

      <Group label="Zgłoszenia (DSA art. 16–17)" footer={`Punkt kontaktowy: ${BRAND.email}. Decyzja wysyła obu stronom uzasadnienie automatycznie. Jako mikro lub mała firma nie musisz prowadzić wewnętrznego systemu odwołań ani raportów przejrzystości (art. 19, 29), dopóki nie przekroczysz progów.`}>
        {reports.map((r) => {
          const l = listings.find((x) => x.id === r.listingId)
          return (
            <div key={r.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{r.id} · {REASON[r.reason]}</span>
                <span className={cx('text-[13px]', r.status === 'new' ? 'text-warn' : r.status === 'removed' ? 'text-danger' : 'text-ok')}>
                  {r.status === 'new' ? 'nowe' : r.status === 'removed' ? 'usunięte, uzasadnienie wysłane' : 'pozostawione, uzasadnienie wysłane'}
                </span>
              </div>
              <span className="text-[14px] text-muted">{l?.title}{r.note ? ` · „${r.note}”` : ''}</span>
              {r.status === 'new' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => decideReport(r.id, 'removed')}>Usuń ogłoszenie</Button>
                  <Button size="sm" variant="secondary" onClick={() => decideReport(r.id, 'kept')}>Zostaw</Button>
                </div>
              )}
            </div>
          )
        })}
      </Group>

      <section className="flex flex-col gap-2">
        <h2 className="px-5 text-[15px] font-bold">Koszty i przychód miesięcznie (aktywni użytkownicy)</h2>
        <div className="px-4">
          <Segmented<number> label="Skala" value={mau} onChange={setMau} options={[1_000, 10_000, 100_000].map((v) => ({ value: v, label: `${v / 1000} tys.` }))} />
        </div>
        <div className="card mx-4 overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">
          {costs.map((c) => <Row key={c.label} title={<span className="text-[15px]">{c.label}</span>} value={<span className="tnum">{Math.round(c.pln).toLocaleString('pl-PL')} zł</span>} />)}
          <Row title={<strong>Koszty razem</strong>} value={<strong className="tnum text-ink">{Math.round(total).toLocaleString('pl-PL')} zł</strong>} />
          <Row title="Przychód (6% płaci 99 zł/rok, 25% odświeża za 10 zł)" value={<span className="tnum text-ink">{Math.round(revenue).toLocaleString('pl-PL')} zł</span>} />
          <Row title={<strong>Wynik</strong>} value={<strong className={cx('tnum', revenue - total >= 0 ? 'text-ok' : 'text-danger')}>{Math.round(revenue - total).toLocaleString('pl-PL')} zł</strong>} />
        </div>
        <p className="px-5 text-[13px] text-muted">Bez VAT, ZUS i Twojej pensji. Odsetek płacących (6%) to założenie do sprawdzenia.</p>
      </section>
    </div>
  )
}
