/**
 * Szacunek miesięcznych kosztów usługi w zł. Ceny z października 2026, do sprawdzenia przed startem:
 * Supabase Pro 25 USD (100 tys. MAU, 8 GB bazy, 250 GB transferu w cenie),
 * SMS PRO 0,11–0,17 zł netto, Cloudflare R2 0,015 USD/GB bez opłat za transfer,
 * Stripe BLIK 1,6% + 1 zł za płatność za plan.
 */
export const USD_PLN = 3.7

export interface CostInput {
  mau: number
  newUsers: number
  /** odsetek aktywnych na płatnym planie, np. 0.05 */
  conversion: number
  annualPrice?: number // zł brutto
  vatPayer?: boolean
}

export interface CostLine {
  label: string
  pln: number
}

export function monthlyCosts({ mau, newUsers, conversion, annualPrice = 99 }: CostInput): CostLine[] {
  const computeUsd = mau > 50_000 ? 60 : mau > 20_000 ? 15 : 10 // micro / small / medium
  const supabaseUsd = 25 + Math.max(0, computeUsd - 10) + Math.max(0, mau - 100_000) * 0.00325
  const photosGb = (mau * 2 * 3 * 0.25) / 1024 // ok. 2 ogłoszenia × 3 zdjęcia × 250 KB na osobę
  const smsPrice = newUsers > 5000 ? 0.11 : newUsers > 500 ? 0.14 : 0.17
  const sms = (newUsers * 1.3 + mau * 0.02) * smsPrice // ponowne próby i zmiany telefonu
  const email = mau > 30_000 ? 20 * USD_PLN : 0
  const paying = mau * conversion
  const paymentFees = (paying * (annualPrice * 0.016 + 1)) / 12
  const support = mau >= 100_000 ? 8000 : mau >= 30_000 ? 4000 : 0
  return [
    { label: 'Baza, logowanie, czat (Supabase)', pln: supabaseUsd * USD_PLN },
    { label: 'Zdjęcia (Cloudflare R2)', pln: photosGb * 0.015 * USD_PLN },
    { label: 'SMS z kodem logowania', pln: sms },
    { label: 'E-maile', pln: email },
    { label: 'Powiadomienia push', pln: 0 },
    { label: 'Prowizje operatora za plany', pln: paymentFees },
    { label: 'Księgowość', pln: 400 },
    { label: 'Domena, sklepy z aplikacjami (średnio)', pln: 45 },
    { label: 'Obsługa i moderacja', pln: support },
  ]
}

export function monthlyRevenue({ mau, conversion, annualPrice = 99, vatPayer = false }: CostInput): number {
  const gross = (mau * conversion * annualPrice) / 12
  return vatPayer ? gross / 1.23 : gross
}

export const sum = (lines: CostLine[]) => lines.reduce((s, l) => s + l.pln, 0)
