// Minimalny service worker: działa offline na ostatnio otwartych zasobach.
const CACHE = 'regioorbit-v2'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./'])))
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Bez przekierowań (hosting zamienia /index.html na /): takiej odpowiedzi przeglądarka nie poda z pamięci.
        if (res.ok && !res.redirected) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
        }
        return res
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./'))),
  )
})
