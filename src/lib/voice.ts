/**
 * Głos: mikrofon (mowa → tekst) i głośnik (tekst → mowa) do rozmowy z planerem AI i wyszukiwarką.
 *
 * - Aplikacja na Androida: mikrofon przez systemowe okno rozpoznawania mowy (wtyczka „Voice” w
 *   android/app/src/main/java/com/miliorbit/app/VoicePlugin.java), głośnik przez systemową syntezę mowy
 *   (@capacitor-community/text-to-speech). Nie nagrywamy dźwięku i nic nie wysyłamy sami.
 * - Przeglądarka: Web Speech API (Chrome, Edge, Safari). Gdy go brak, przyciski się nie pokazują.
 */

type VoiceNative = { listen: (o: { language?: string; prompt?: string }) => Promise<{ text: string }> }
type Cap = { isNativePlatform?: () => boolean; isPluginAvailable?: (name: string) => boolean; Plugins?: { Voice?: VoiceNative } }
type Recognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const cap = () => (window as unknown as { Capacitor?: Cap }).Capacitor
const native = () => !!cap()?.isNativePlatform?.()
const Recognizer = () => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/** Czy da się mówić do aplikacji. */
export function canListen(): boolean {
  if (typeof window === 'undefined') return false
  if (native()) return !!cap()?.isPluginAvailable?.('Voice')
  return !!Recognizer()
}

/** Słucha jednego zdania i zwraca tekst (pusty, gdy ktoś nic nie powiedział albo zamknął okno). */
export async function listen(locale: string, prompt?: string): Promise<string> {
  if (native()) {
    const voice = cap()?.Plugins?.Voice
    if (!voice) return ''
    try {
      return (await voice.listen({ language: locale, prompt })).text ?? ''
    } catch {
      return ''
    }
  }
  const R = Recognizer()
  if (!R) return ''
  return new Promise((resolve) => {
    const r = new R()
    let text = ''
    r.lang = locale
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => (text = e.results[0]?.[0]?.transcript ?? '')
    r.onerror = () => resolve('')
    r.onend = () => resolve(text)
    r.start()
    // Bezpiecznik: po 15 s kończymy, nawet gdy przeglądarka nie zamknie nasłuchu sama.
    setTimeout(() => r.stop(), 15_000)
  })
}

/** Czy aplikacja może czytać na głos. */
export function canSpeak(): boolean {
  if (typeof window === 'undefined') return false
  return native() ? !!cap()?.isPluginAvailable?.('TextToSpeech') : 'speechSynthesis' in window
}

/** Czyta tekst na głos w języku użytkownika. Kolejne wywołanie przerywa poprzednie. */
export async function speak(text: string, locale: string): Promise<void> {
  if (!text.trim()) return
  if (native()) {
    try {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
      await TextToSpeech.stop().catch(() => {})
      await TextToSpeech.speak({ text, lang: locale, rate: 1, category: 'playback' })
    } catch {
      /* brak głosu dla języka albo wyłączona synteza mowy */
    }
    return
  }
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = locale
  synth.speak(u)
}

/** Przerywa czytanie. */
export async function stopSpeaking(): Promise<void> {
  if (native()) {
    try {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
      await TextToSpeech.stop()
    } catch {
      /* nic */
    }
    return
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
