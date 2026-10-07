import stores from '../site/stores.json'

/** Marka w jednym miejscu. Zmiana marki = zmiana tego pliku. */
export const BRAND = {
  name: 'Miliorbit',
  /** domena: strona z linkami do sklepów; aplikacja w przeglądarce pod /app/ */
  domain: 'miliorbit.com',
  /** punkt kontaktowy DSA (art. 11–12) */
  email: 'hello@miliorbit.com',
}

/**
 * Linki do sklepów. Jedno źródło dla aplikacji i strony głównej: site/stores.json.
 * Google Play: adres znany od razu (identyfikator pakietu). App Store: wpisz po utworzeniu aplikacji w App Store Connect.
 */
export const STORES: { android: string; ios: string } = stores
