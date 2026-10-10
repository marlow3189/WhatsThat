import stores from '../site/stores.json'

/** Marka w jednym miejscu. Zmiana marki = zmiana tego pliku. */
/**
 * Adres strony: w wersji testowej (np. Vercel) podajesz go w zmiennej VITE_SITE_URL, żeby linki z aplikacji
 * prowadziły tam, gdzie testujecie; bez zmiennej docelowa domena regioorbit.com.
 */
const SITE = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '')

export const BRAND = {
  name: 'Regioorbit',
  /** domena: strona z linkami do sklepów; aplikacja w przeglądarce pod /app/ */
  domain: SITE ? SITE.replace(/^https?:\/\//, '') : 'regioorbit.com',
  /** punkt kontaktowy DSA (art. 11–12) */
  email: 'hello@regioorbit.com',
}

/**
 * Linki do sklepów. Jedno źródło dla aplikacji i strony głównej: site/stores.json.
 * Google Play: adres znany od razu (identyfikator pakietu). App Store: wpisz po utworzeniu aplikacji w App Store Connect.
 */
export const STORES: { android: string; ios: string } = stores
