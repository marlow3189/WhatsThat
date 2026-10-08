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
  // Ekran emulatora ma być włączony i odblokowany przez cały test (inaczej Android wstrzymuje aplikację:
  // nie rysuje nowych klatek i nie odpala timerów JavaScriptu).
  for (const cmd of ['svc power stayon true', 'settings put system screen_off_timeout 1800000', 'input keyevent KEYCODE_WAKEUP', 'wm dismiss-keyguard', 'input keyevent 82'])
    await device.shell(cmd).catch(() => {})
  await device.installApk(fs.readFileSync(apk))
  await device.shell(`am start -W -n ${PKG}/.MainActivity`)
  const webview = await device.webView({ pkg: PKG }, { timeout: 120_000 })
  const page = await webview.page()
  page.setDefaultTimeout(20_000)
  // Diagnostyka: czy aplikacja jest na pierwszym planie, czy strona jest widoczna i czy działają timery.
  const diag = async (label) => {
    const power = (await device.shell('dumpsys power | grep -m1 mWakefulness=')).toString().trim()
    const top = (await device.shell('dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity"')).toString().trim()
    const js = await page.evaluate(() => new Promise((ok) => {
      const t0 = Date.now()
      setTimeout(() => ok({ visibility: document.visibilityState, focus: document.hasFocus(), timerMs: Date.now() - t0 }), 100)
      setTimeout(() => ok({ visibility: document.visibilityState, focus: document.hasFocus(), timerMs: -1 }), 3000)
    }))
    console.log(`[${label}]`, power, '|', top, '|', JSON.stringify(js))
  }
  await diag('po starcie').catch((e) => console.log('diag', e.message))
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  // W WebView na Androidzie kliknięcia „myszą” po współrzędnych bywają zawodne, więc klikamy jak skrypt strony
  // (element.click()), po upewnieniu się, że element jest widoczny.
  const tap = async (selector) => {
    const el = page.locator(selector).first()
    await el.waitFor({ state: 'visible' })
    await el.evaluate((node) => node.click())
    await page.waitForTimeout(250)
  }
  let n = 0
  const shot = async (name) => {
    await page.waitForTimeout(600)
    const file = `${String(++n).padStart(2, '0')}-${name}`
    await device.screenshot({ path: path.join(out, `${file}.png`) })
    // zrzut samej strony (z WebView), gdyby ekran emulatora nie odświeżył klatki
    await page.screenshot({ path: path.join(out, `strona-${file}.png`) }).catch(() => {})
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
    await tap('text=Polski')
    await tap('button:has-text("Dalej")')
    await page.fill('#town', 'Warszawa')
  })
  await step('kod-sms', async () => {
    await tap('button:has-text("Dalej")')
    await tap('text=600 100 200')
    await tap('text=Wyślij kod SMS')
    await tap('text=Wersja demo: wpisz dowolne 6 cyfr.')
  })
  await step('plec-zablokowana', async () => {
    await tap('text=Potwierdź')
    await page.fill('#name', 'Test Emulator')
    await tap('button:has-text("Dalej")')
    await tap('button[role=radio]:has-text("Kobieta")')
    await tap('text=Zatwierdź na stałe')
  })
  await step('kontakty-zgoda', async () => {
    await tap('button:has-text("Dalej")')
    await tap('button:has-text("Dalej")')
    await tap('text=Zezwól na dostęp do kontaktów')
  })
  await step('glowna', async () => {
    await tap('button:has-text("Pozwól")')
    await page.waitForSelector('text=Skróty numerów usunięte z serwera')
    await tap('button:has-text("Dalej")')
    await tap('button:has-text("Dalej")')
    await tap('#accept')
    await tap('text=Zaczynamy')
    await page.waitForSelector('text=Co dziś załatwiamy?')
  })
  await step('tablica-okolicy', async () => {
    await page.locator('text=Tablica okolicy').scrollIntoViewIfNeeded()
  })
  await step('sos', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await tap('a[aria-label="SOS"]')
    await page.waitForSelector('text=Zadzwoń 112')
  })
  await step('dodaj', async () => {
    await tap('nav a[aria-label="Dodaj"]')
    await page.waitForSelector('text=Zapytaj sąsiadów')
  })
  await step('ja', async () => {
    await tap('nav a:has-text("Ja")')
    await page.waitForSelector('text=/Miliorbit 0\\.7/')
  })

  await diag('na końcu').catch(() => {})
  fs.writeFileSync(path.join(out, 'wynik.txt'), errors.length ? `BŁĘDY:\n${errors.join('\n')}\n` : 'OK: wszystkie kroki przeszły\n')
  console.log(errors.length ? `Błędy:\n${errors.join('\n')}` : 'Wszystkie kroki przeszły')
  await device.close()
  process.exit(errors.length ? 1 : 0)
})().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
