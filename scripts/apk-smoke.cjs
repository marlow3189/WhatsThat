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
  console.log('[platforma]', JSON.stringify(await page.evaluate(() => ({
    native: window.Capacitor?.isNativePlatform?.(),
    contactsPlugin: window.Capacitor?.isPluginAvailable?.('Contacts'),
    picker: !!navigator.contacts && 'ContactsManager' in window,
    ua: navigator.userAgent,
  }))))
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
    // Zrzut aplikacji z WebView. Ekran emulatora bez okna (-no-window) w chmurze nie odświeża klatek,
    // więc zrzut całego telefonu robimy tylko na starcie (pasek stanu Androida, ikona, prawdziwy ekran).
    await page.screenshot({ path: path.join(out, `${file}.png`) })
    if (n === 1) await device.screenshot({ path: path.join(out, `00-telefon.png`) })
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

  // ——— Dotyk jak palcem: prawdziwe stuknięcia przez Androida (adb input tap), nie przez JavaScript ———
  // Położenie WebView na ekranie bierzemy z uiautomator, współrzędne elementów z przeglądarki.
  const touch = []
  try {
    await device.shell('uiautomator dump /sdcard/ui.xml')
    const xml = (await device.shell('cat /sdcard/ui.xml')).toString()
    const m = xml.match(/class="android\.webkit\.WebView"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)
    const [ox, oy] = m ? [+m[1], +m[2]] : [0, 0]
    const dpr = await page.evaluate(() => window.devicePixelRatio)
    console.log('[dotyk] WebView od', ox, oy, 'dpr', dpr)
    const tapTouch = async (label, selector, expect) => {
      try {
        const el = page.locator(selector).first()
        await el.waitFor({ state: 'visible', timeout: 8000 })
        await el.evaluate((node) => node.scrollIntoView({ block: 'center' }))
        await page.waitForTimeout(300)
        const r = await el.evaluate((node) => { const b = node.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
        const onTop = await page.evaluate(({ x, y }) => { const t = document.elementFromPoint(x, y); return t ? (t.closest('a,button,input,label')?.getAttribute('aria-label') || t.closest('a,button,input,label')?.textContent?.trim().slice(0, 30) || t.tagName) : 'nic' }, r)
        await device.shell(`input tap ${Math.round(ox + r.x * dpr)} ${Math.round(oy + r.y * dpr)}`)
        await page.waitForTimeout(900)
        const ok = expect ? await page.locator(expect).first().isVisible().catch(() => false) : true
        const where = await page.evaluate(() => location.hash)
        touch.push(`${ok ? '✓' : '✗'} ${label} → ${where} (pod palcem: ${onTop})`)
      } catch (e) {
        touch.push(`✗ ${label}: ${e.message.split('\n')[0]}`)
      }
    }
    await tapTouch('zakładka Główna', 'nav a[href="#/"]', 'text=Co dziś załatwiamy?')
    await tapTouch('SOS', 'a[aria-label="SOS"]', 'text=Zadzwoń 112')
    await tapTouch('wstecz', 'header button', 'text=Co dziś załatwiamy?')
    await tapTouch('pomysł AI: jajka', 'a[href*="szukaj?q="]', 'input')
    await tapTouch('zakładka Główna', 'nav a[href="#/"]', 'text=Co dziś załatwiamy?')
    await tapTouch('kafelek tablicy', 'a[href^="#/l/"]', 'h1')
    await tapTouch('zakładka Dodaj', 'nav a[aria-label="Dodaj"]', 'text=Co chcesz zrobić?')
    await tapTouch('Sprzedaż', 'button:has-text("Sprzedaż")', 'text=Kategoria')
    await tapTouch('kategoria', 'section button', '#title, text=Co dokładnie?')
    await tapTouch('zakładka Czaty', 'nav a[href="#/wiadomosci"]', 'h1')
    await tapTouch('zakładka Ja', 'nav a[href="#/ja"]', 'text=Twój plan')
    await tapTouch('zakładka Szukaj', 'nav a[href="#/szukaj"]', 'input')
  } catch (e) {
    touch.push(`✗ dotyk: ${e.message.split('\n')[0]}`)
  }
  console.log('[dotyk]\n' + touch.join('\n'))
  fs.writeFileSync(path.join(out, 'dotyk.txt'), touch.join('\n') + '\n')
  await page.screenshot({ path: path.join(out, '11-po-dotyku.png') }).catch(() => {})

  await diag('na końcu').catch(() => {})
  fs.writeFileSync(path.join(out, 'wynik.txt'), errors.length ? `BŁĘDY:\n${errors.join('\n')}\n` : 'OK: wszystkie kroki przeszły\n')
  console.log(errors.length ? `Błędy:\n${errors.join('\n')}` : 'Wszystkie kroki przeszły')
  await device.close()
  process.exit(errors.length ? 1 : 0)
})().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
