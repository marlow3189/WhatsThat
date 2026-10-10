// Składa stronę regioorbit.com: dist/ = strona z linkami do sklepów, dist/app/ = aplikacja w przeglądarce
// (zbudowana wcześniej przez `vite build`). Linki do sklepów biorą się z site/stores.json.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import qrcode from 'qrcode-generator'

if (!existsSync('dist/app/index.html')) throw new Error('Najpierw: vite build (aplikacja do dist/app)')

// Czyścimy wszystko poza aplikacją, żeby nie zostały stare pliki strony.
for (const f of readdirSync('dist')) if (f !== 'app') rmSync(`dist/${f}`, { recursive: true, force: true })

cpSync('site', 'dist', { recursive: true, filter: (src) => !src.endsWith('stores.json') })
cpSync('public/icon.svg', 'dist/icon.svg')
// Link bez aplikacji, który nie pasuje do żadnej reguły: ta sama strona, która obsługuje /l/…
cpSync('site/open.html', 'dist/404.html')

const stores = JSON.parse(readFileSync('site/stores.json', 'utf8'))
// Strona testowa: SITE_ANDROID_URL może wskazać plik APK z GitHuba, zanim aplikacja trafi do Google Play.
const android = process.env.SITE_ANDROID_URL || stores.android || ''
const ios = process.env.SITE_IOS_URL || stores.ios || ''
writeFileSync('dist/stores.js', `window.STORES = ${JSON.stringify({ android, ios })}\n`)

// Kod QR na stronę główną i /pobierz (komputer): prowadzi na /pobierz, która na telefonie wybiera sklep.
// Na stronie testowej (np. Vercel) adres bierze się z VITE_SITE_URL, na produkcji to regioorbit.com.
const site = (process.env.VITE_SITE_URL || 'https://regioorbit.com').trim().replace(/\/+$/, '')
const qr = qrcode(0, 'M')
qr.addData(`${site}/pobierz?utm_source=site&utm_medium=qr`)
qr.make()
writeFileSync('dist/qr.svg', qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }))

console.log('dist/ gotowe: strona (/) + aplikacja (/app/) + linki do aplikacji (/.well-known)')
