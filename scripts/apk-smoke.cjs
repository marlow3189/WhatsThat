// Test APK na emulatorze Androida (GitHub Actions): instaluje aplikację, przechodzi rejestrację jak człowiek
// i robi zrzuty ekranu prawdziwego telefonu. Użycie: node scripts/apk-smoke.cjs miliorbit-test.apk zrzuty/
const { _android: android } = require('playwright-core')
const fs = require('fs')
const path = require('path')

const [apk, out = 'zrzuty'] = process.argv.slice(2)
const PKG = 'com.miliorbit.app'
fs.mkdirSync(out, { recursive: true })

;(async () => {
  // Sterownik Playwrighta niepotrzebny: klikamy w aplikacji przez WebView (CDP), zrzuty robi adb.
  const [device] = await android.devices({ omitDriverInstall: true })
  if (!device) throw new Error('Brak emulatora (adb devices jest puste)')
  console.log('Urządzenie:', device.model(), device.serial())
  await device.installApk(fs.readFileSync(apk))
  await device.shell(`am start -n ${PKG}/.MainActivity`)
  const webview = await device.webView({ pkg: PKG }, { timeout: 120_000 })
  const page = await webview.page()
  page.setDefaultTimeout(20_000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  let n = 0
  const shot = async (name) => {
    await page.waitForTimeout(600)
    await device.screenshot({ path: path.join(out, `${String(++n).padStart(2, '0')}-${name}.png`) })
  }
  const step = async (name, fn) => {
    try {
      await fn()
      await shot(name)
      console.log('✓', name)
    } catch (e) {
      errors.push(`${name}: ${e.message.split('\n')[0]}`)
      await shot(`${name}-blad`).catch(() => {})
      console.log('✗', name, e.message.split('\n')[0])
    }
  }

  await step('start', async () => {
    await page.waitForSelector('text=Polski')
  })
  await step('okolica', async () => {
    await page.click('text=Polski')
    await page.click('button:has-text("Dalej")')
    await page.fill('#town', 'Warszawa')
  })
  await step('kod-sms', async () => {
    await page.click('button:has-text("Dalej")')
    await page.click('text=600 100 200')
    await page.click('text=Wyślij kod SMS')
    await page.click('text=Wersja demo: wpisz dowolne 6 cyfr.')
  })
  await step('plec-zablokowana', async () => {
    await page.click('text=Potwierdź')
    await page.fill('#name', 'Test Emulator')
    await page.click('button:has-text("Dalej")')
    await page.click('button[role=radio]:has-text("Kobieta")')
    await page.click('text=Zatwierdź na stałe')
  })
  await step('kontakty-zgoda', async () => {
    await page.click('button:has-text("Dalej")')
    await page.click('button:has-text("Dalej")')
    await page.click('text=Zezwól na dostęp do kontaktów')
  })
  await step('glowna', async () => {
    await page.click('button:has-text("Pozwól")')
    await page.waitForSelector('text=Skróty numerów usunięte z serwera')
    await page.click('button:has-text("Dalej")')
    await page.click('button:has-text("Dalej")')
    await page.click('#accept')
    await page.click('text=Zaczynamy')
    await page.waitForSelector('text=Co dziś załatwiamy?')
  })
  await step('tablica-okolicy', async () => {
    await page.locator('text=Tablica okolicy').scrollIntoViewIfNeeded()
  })
  await step('sos', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.click('a[aria-label="SOS"]')
    await page.waitForSelector('text=Zadzwoń 112')
  })
  await step('dodaj', async () => {
    await page.click('nav a[aria-label="Dodaj"]')
    await page.waitForSelector('text=Zapytaj sąsiadów')
  })
  await step('ja', async () => {
    await page.click('nav a:has-text("Ja")')
    await page.waitForSelector('text=/Miliorbit 0\\.7/')
  })

  fs.writeFileSync(path.join(out, 'wynik.txt'), errors.length ? `BŁĘDY:\n${errors.join('\n')}\n` : 'OK: wszystkie kroki przeszły\n')
  console.log(errors.length ? `Błędy:\n${errors.join('\n')}` : 'Wszystkie kroki przeszły')
  await device.close()
  process.exit(errors.length ? 1 : 0)
})().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
