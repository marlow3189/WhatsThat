import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { loadLang } from './i18n'
import { savedLang } from './data/store'
import { initAnalytics } from './lib/analytics'
import { isNative } from './lib/platform'
import { installErrorLog } from './lib/diag'
import { ErrorBoundary } from './components/boundary'
import '@fontsource-variable/nunito'
import './index.css'

installErrorLog()
initAnalytics()

// Tłumaczenia języka z urządzenia wczytujemy przed pierwszym ekranem (polski jest w paczce od razu).
loadLang(savedLang())
  .catch(() => {})
  .finally(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    ),
  )

// Service worker tylko w przeglądarce (/app/); aplikacja ze sklepu ma pliki w paczce.
if (import.meta.env.PROD && import.meta.env.MODE !== 'preview' && !isNative() && 'serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
