import { Component, type ErrorInfo, type ReactNode } from 'react'
import { deviceSummary, logError } from '../lib/diag'

/** Teksty awaryjne bez sklepu i tłumaczeń (gdy coś się zepsuło, nie polegamy na reszcie aplikacji). */
const TEXT: Record<string, [string, string, string, string]> = {
  pl: ['Coś poszło nie tak', 'Aplikacja trafiła na błąd. Uruchom ją ponownie, Twoje dane zostają na telefonie. Jeśli to się powtarza, skopiuj opis i wyślij go nam.', 'Uruchom ponownie', 'Kopiuj opis błędu'],
  en: ['Something went wrong', 'The app hit an error. Restart it, your data stays on your phone. If it happens again, copy the details and send them to us.', 'Restart', 'Copy error details'],
  de: ['Etwas ist schiefgelaufen', 'Die App hatte einen Fehler. Starte sie neu, deine Daten bleiben auf dem Handy. Wenn es wieder passiert, kopiere die Details und schick sie uns.', 'Neu starten', 'Fehlerdetails kopieren'],
  uk: ['Щось пішло не так', 'У застосунку сталася помилка. Перезапустіть його, ваші дані залишаться на телефоні. Якщо повториться, скопіюйте опис і надішліть нам.', 'Перезапустити', 'Копіювати опис помилки'],
  cs: ['Něco se pokazilo', 'Aplikace narazila na chybu. Spusť ji znovu, data zůstávají v telefonu. Pokud se to opakuje, zkopíruj popis a pošli nám ho.', 'Spustit znovu', 'Kopírovat popis chyby'],
  sk: ['Niečo sa pokazilo', 'Aplikácia narazila na chybu. Spusť ju znova, údaje zostávajú v telefóne. Ak sa to opakuje, skopíruj popis a pošli nám ho.', 'Spustiť znova', 'Kopírovať popis chyby'],
  hu: ['Valami hiba történt', 'Az alkalmazás hibába ütközött. Indítsd újra, az adataid a telefonon maradnak. Ha megismétlődik, másold ki a leírást és küldd el nekünk.', 'Újraindítás', 'Hibaleírás másolása'],
  it: ['Qualcosa è andato storto', 'L’app ha avuto un errore. Riavviala, i tuoi dati restano sul telefono. Se succede di nuovo, copia i dettagli e inviaceli.', 'Riavvia', 'Copia dettagli errore'],
  es: ['Algo salió mal', 'La app tuvo un error. Reiníciala, tus datos se quedan en el teléfono. Si vuelve a pasar, copia los detalles y envíanoslos.', 'Reiniciar', 'Copiar detalles del error'],
  hi: ['कुछ गड़बड़ हो गई', 'ऐप में गड़बड़ी हुई। ऐप दोबारा शुरू करें, आपका डेटा फ़ोन में सुरक्षित है। फिर से हो तो विवरण कॉपी करके हमें भेजें।', 'फिर से शुरू करें', 'गड़बड़ी का विवरण कॉपी करें'],
}

/**
 * Zamiast białego ekranu: komunikat, przycisk „Uruchom ponownie” i opis błędu do skopiowania
 * (wersja, Android, WebView, treść błędu). Błąd trafia też do Ja → Diagnostyka.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; copied: boolean }> {
  state = { error: null as Error | null, copied: false }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('render', Object.assign(error, { stack: `${error.stack ?? ''}\n${info.componentStack ?? ''}`.slice(0, 1500) }))
  }

  render() {
    const { error, copied } = this.state
    if (!error) return this.props.children
    const lang = document.documentElement.lang || 'pl'
    const [title, text, restart, copy] = TEXT[lang] ?? TEXT.en
    const details = `${deviceSummary(__BUILD__)}\n${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(0, 8).join('\n')}`
    return (
      <div className="mx-auto flex min-h-full max-w-[34rem] flex-col justify-center gap-4 px-6" style={{ paddingTop: 'var(--sat)', paddingBottom: 'calc(var(--sab) + 16px)' }} role="alert">
        <p className="text-[22px] leading-tight font-bold">{title}</p>
        <p className="text-[15px] leading-snug text-muted">{text}</p>
        <button type="button" onClick={() => location.reload()} className="press min-h-12 rounded-full bg-primary text-[16px] font-bold text-primary-ink">{restart}</button>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(details).then(() => this.setState({ copied: true })).catch(() => {})
          }}
          className="press min-h-11 rounded-full bg-fill text-[15px] font-semibold"
        >
          {copied ? '✓' : copy}
        </button>
        <pre className="max-h-48 overflow-auto rounded-[12px] bg-fill p-3 text-[11px] leading-snug whitespace-pre-wrap text-muted select-all">{details}</pre>
      </div>
    )
  }
}
