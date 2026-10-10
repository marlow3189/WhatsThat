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
writeFileSync('dist/stores.js', `window.STORES = ${JSON.stringify({ android: stores.android ?? '', ios: stores.ios ?? '' })}\n`)

// Kod QR na stronę główną i /pobierz (komputer): prowadzi na /pobierz, która na telefonie wybiera sklep.
const qr = qrcode(0, 'M')
qr.addData('https://regioorbit.com/pobierz?utm_source=site&utm_medium=qr')
qr.make()
writeFileSync('dist/qr.svg', qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }))

console.log('dist/ gotowe: strona (/) + aplikacja (/app/) + linki do aplikacji (/.well-known)')
