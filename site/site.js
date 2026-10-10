// regioorbit.com: strona z linkami do aplikacji. Rozpoznaje telefon i prowadzi do właściwego sklepu.
// Linki do sklepów są w site/stores.json (build zapisuje je do /stores.js jako window.STORES).
;(function () {
  var S = window.STORES || { android: '', ios: '' }
  var ua = navigator.userAgent || ''
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  var android = /Android/i.test(ua)
  var os = android ? 'android' : ios ? 'ios' : 'desktop'
  var en = !/^pl/i.test(navigator.language || 'pl')
  var params = new URLSearchParams(location.search)
  var invite = location.pathname.match(/^\/z\/([\w-]{1,64})/)
  var ref = params.get('ref') || (invite ? invite[1] : '')
  var $ = function (sel) { return document.querySelector(sel) }
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)) }
  var body = document.body
  body.classList.add(os)

  // Teksty po angielsku dla przeglądarek w innym języku (reszta języków: w aplikacji).
  if (en) {
    document.documentElement.lang = 'en'
    $$('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en') })
  }

  // Źródło (QR, zaproszenie, kampania) trafia do sklepu, żeby aplikacja wiedziała, skąd ktoś przyszedł.
  var source = params.get('utm_source') || (ref ? 'invite' : 'site')
  var referrer = 'utm_source=' + source + '&utm_medium=' + (params.get('utm_medium') || 'web') + (ref ? '&ref=' + ref : '')
  var play = S.android && S.android + (S.android.indexOf('?') > -1 ? '&' : '?') + 'referrer=' + encodeURIComponent(referrer)
  var store = { android: play, ios: S.ios }

  $$('[data-store]').forEach(function (a) {
    var id = a.getAttribute('data-store')
    if (store[id]) {
      a.href = store[id]
      if (id === os || (os === 'desktop' && id === 'android')) a.classList.add('primary')
      if (id === os) a.parentNode.insertBefore(a, a.parentNode.firstChild)
    } else {
      a.removeAttribute('href')
      a.setAttribute('aria-disabled', 'true')
      var small = a.querySelector('small')
      if (small && small.hasAttribute('data-soon')) small.textContent = en ? small.getAttribute('data-soon-en') : small.getAttribute('data-soon')
    }
  })

  // Safari na iPhonie: systemowy pasek „Otwórz w App Store”, gdy aplikacja już tam jest.
  var appId = (S.ios.match(/id(\d+)/) || [])[1]
  if (appId) {
    var meta = document.createElement('meta')
    meta.name = 'apple-itunes-app'
    meta.content = 'app-id=' + appId
    document.head.appendChild(meta)
  }

  // /pobierz (kod QR): od razu do sklepu, jeśli wiemy, który to telefon.
  if (body.hasAttribute('data-auto')) {
    var status = $('#status')
    if (os !== 'desktop' && store[os]) {
      if (status) status.textContent = en ? 'Opening the store…' : 'Otwieram sklep…'
      location.replace(store[os])
    } else if (os !== 'desktop' && status) {
      status.textContent = en ? 'The app is coming soon to this store. Meanwhile use it in the browser.' : 'Aplikacja wkrótce w tym sklepie. Do tego czasu korzystaj w przeglądarce.'
    }
  }

  // /l/…, /u/…, /z/…, /sos, /zastrzez: link otwarty bez aplikacji (z aplikacją otwiera go system).
  if (body.hasAttribute('data-open')) {
    var path = location.pathname.replace(/\/+$/, '')
    var m = path.match(/^\/(l|u|z)\/([\w-]{1,64})$/)
    var target = '/'
    if (m) target = m[1] === 'z' ? '/znajomi' : '/' + m[1] + '/' + m[2]
    else if (path === '/sos' || path === '/zastrzez') target = path
    var web = '/app/#' + target
    // Pilne sprawy bez zbędnego kroku: alarm i zastrzeżenie konta otwieramy od razu.
    if (path === '/sos' || path === '/zastrzez') return location.replace(web)
    if (!m) return location.replace('/')
    var title = $('#title')
    var lead = $('#lead')
    if (m[1] === 'z') {
      title.textContent = en ? 'A friend invites you' : 'Znajomy zaprasza Cię do Regioorbit'
      lead.textContent = en ? 'Install the app: you will see what your friends lend, sell and need, and who lives nearby.' : 'Zainstaluj aplikację: zobaczysz, co pożyczają, sprzedają i czego szukają Twoi znajomi oraz kto mieszka obok.'
    } else if (m[1] === 'u') {
      title.textContent = en ? 'Profile on Regioorbit' : 'Profil w Regioorbit'
    }
    var browser = $('#browser')
    if (browser) browser.href = web
  }
})()
