// Składa rozszerzenie: kopiuje zbudowaną aplikację (dist/app) do extension/app i pakuje do .zip.
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

if (!existsSync('dist/app/index.html')) throw new Error('Najpierw: npm run build')
rmSync('extension/app', { recursive: true, force: true })
cpSync('dist/app', 'extension/app', { recursive: true })
rmSync('extension/app/sw.js', { force: true }) // service worker strony nie jest potrzebny w rozszerzeniu
mkdirSync('release', { recursive: true })
try {
  execSync('cd extension && zip -qr ../release/miliorbit-extension.zip .', { stdio: 'inherit' })
  console.log('release/miliorbit-extension.zip gotowe (Chrome Web Store, Edge Add-ons)')
} catch {
  console.log('Brak polecenia zip: załaduj folder extension/ jako rozszerzenie rozpakowane.')
}
