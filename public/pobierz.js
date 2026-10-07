// Jedna strona do kodu QR: rozpoznaje telefon i prowadzi do właściwego sklepu.
// Uzupełnij adresy po publikacji w sklepach. Puste = instalacja aplikacji ze strony (PWA).
const PLAY_URL = '' // np. 'https://play.google.com/store/apps/details?id=com.miliorbit.app'
const APP_STORE_URL = '' // np. 'https://apps.apple.com/app/id0000000000'

;(function () {
  const ua = navigator.userAgent || ''
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const android = /Android/i.test(ua)
  const en = !/^pl/i.test(navigator.language || 'pl')
  const ref = new URLSearchParams(location.search).get('ref') || ''
  const $ = (id) => document.getElementById(id)
  const say = (pl, eng) => (en ? eng : pl)

  if (en) {
    const lead = document.querySelector('.lead')
    lead.textContent = lead.dataset.en
    $('web').textContent = 'Open in the browser'
  }
  // Źródło polecenia trafia do aplikacji (pomiar kampanii i zaproszeń).
  const play = PLAY_URL && PLAY_URL + '&referrer=' + encodeURIComponent('utm_source=qr&utm_medium=invite&ref=' + ref)
  $('web').href = './?utm_source=qr&utm_medium=invite' + (ref ? '&ref=' + encodeURIComponent(ref) : '')
  $('android').href = play || $('web').href
  $('ios').href = APP_STORE_URL || $('web').href
  if (!PLAY_URL) $('android').hidden = true
  if (!APP_STORE_URL) $('ios').hidden = true

  if (android && play) {
    $('status').textContent = say('Otwieram Google Play…', 'Opening Google Play…')
    location.replace(play)
  } else if (ios && APP_STORE_URL) {
    $('status').textContent = say('Otwieram App Store…', 'Opening the App Store…')
    location.replace(APP_STORE_URL)
  } else if (ios) {
    $('hint').textContent = say('Na iPhonie: otwórz w Safari, stuknij Udostępnij → „Do ekranu początkowego”.', 'On iPhone: open in Safari, tap Share → “Add to Home Screen”.')
  } else if (android) {
    $('hint').textContent = say('Na Androidzie: otwórz w Chrome i wybierz „Zainstaluj aplikację”.', 'On Android: open in Chrome and choose “Install app”.')
  } else {
    $('hint').textContent = say('Zeskanuj ten kod telefonem albo otwórz aplikację w przeglądarce.', 'Scan the code with your phone or open the app in the browser.')
  }
})()
