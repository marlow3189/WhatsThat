// Test APK na emulatorze Androida (GitHub Actions): instaluje aplikację, przechodzi rejestrację jak człowiek
// i robi zrzuty ekranu prawdziwego telefonu. Użycie: node scripts/apk-smoke.cjs miliorbit-test.apk zrzuty/
const { _android: android } = require('playwright-core')
const fs = require('fs')
const path = require('path')

const [apk, out = 'zrzuty'] = process.argv.slice(2)
const PKG = process.env.APP_PKG || 'com.miliorbit.app'
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
  // Zgoda na kontakty z góry (na prawdziwym telefonie pyta okno systemu; w teście nie ma kto go kliknąć).
  await device.shell(`pm grant ${PKG} android.permission.READ_CONTACTS`).catch(() => {})
  const sdk = (await device.shell('getprop ro.build.version.sdk')).toString().trim()
  console.log('Android API', sdk)
  await device.shell(`am start -W -n ${PKG}/com.miliorbit.app.MainActivity`)
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
    contactsPlugin: window.Capacitor?.isPluginAvailable?.('PhoneNumbers'),
    voice: window.Capacitor?.isPluginAvailable?.('Voice'),
    tts: window.Capacitor?.isPluginAvailable?.('TextToSpeech'),
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

  // Rejestracja w 4 krokach. Emulator ma język angielski, więc najpierw zmieniamy język na polski (przycisk u góry).
  await step('start', async () => {
    await tap('button:has(span[lang])')
    await tap('button:has(span[lang="pl"])')
    await page.waitForSelector('text=Twój numer telefonu')
  })
  await step('numer', async () => {
    await tap('text=600 100 200')
    await tap('button:has-text("Zgadzam się i dalej")')
    await page.waitForSelector('text=Kod z SMS-a')
  })
  await step('profil', async () => {
    // kod sprawdza się sam po 6 cyfrach
    await tap('text=Wersja demo: wpisz dowolne 6 cyfr.')
    await page.waitForSelector('text=Twój profil')
    await page.fill('#name', 'Test Emulator')
    await tap('button[role=radio]:has-text("Kobieta")')
    await page.selectOption('#region', 'mazowieckie')
    await page.fill('#town', 'Warszawa')
  })
  await step('kontakty', async () => {
    await tap('button:has-text("Dalej")')
    await page.waitForSelector('text=Znajdź znajomych')
  })
  await step('glowna', async () => {
    await tap('text=Zezwól na dostęp do kontaktów')
    await page.waitForSelector('text=Skróty numerów usunięte z serwera', { timeout: 30_000 })
    await tap('button:has-text("Zaczynamy")')
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
  // Najważniejsza ścieżka: dodanie ogłoszenia od początku do końca.
  await step('dodaj', async () => {
    await tap('nav a[aria-label="Dodaj"]')
    await page.waitForSelector('text=Co chcesz zrobić?')
  })
  await step('dodaj-kategoria', async () => {
    await tap('button:has-text("Sprzedaż")')
    await tap('button:has-text("Narzędzia i maszyny")')
    await tap('button:has-text("Pomiń i przejdź dalej")')
    await page.waitForSelector('#title')
  })
  await step('dodaj-opis', async () => {
    await page.fill('#title', 'Wiertarka udarowa Bosch')
    await page.fill('#price', '120')
    await tap('button:has-text("Dalej")')
    await page.waitForSelector('text=Kto zobaczy?')
  })
  await step('dodaj-opublikowane', async () => {
    await tap('button:has-text("Opublikuj")')
    await page.waitForSelector('text=Opublikowane')
  })
  await step('szukaj-glos', async () => {
    await tap('nav a[aria-label="Szukaj"]')
    await page.waitForSelector('#q')
  })
  await step('ja', async () => {
    await tap('nav a[aria-label="Ja"]')
    await page.waitForSelector('text=/Miliorbit 0\\.\\d/')
  })

  // Stuknięcie palcem w element (adb input tap) według położenia WebView ustalonego niżej.
  let origin = [0, 0]
  let dpr = 1
  const tapTouchExternal = async (selector) => {
    const el = page.locator(selector).first()
    await el.waitFor({ state: 'visible', timeout: 8000 })
    const r = await el.evaluate((node) => { const b = node.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
    await device.shell(`input tap ${Math.round(origin[0] + r.x * dpr)} ${Math.round(origin[1] + r.y * dpr)}`)
  }

  // ——— Dotyk jak palcem: prawdziwe stuknięcia przez Androida (adb input tap), nie przez JavaScript ———
  // Położenie WebView na ekranie bierzemy z uiautomator, współrzędne elementów z przeglądarki.
  const touch = []
  try {
    dpr = await page.evaluate(() => window.devicePixelRatio)
    // Gdzie na ekranie zaczyna się WebView: stukamy raz w środek ekranu i patrzymy, gdzie strona dostała dotyk
    // (to stuknięcie niczego nie klika). Zapasowo: układ okien z uiautomator.
    const calibrate = async () => {
      const size = (await device.shell('wm size')).toString().match(/(\d+)x(\d+)/)
      if (!size) return null
      const sx = Math.round(+size[1] / 2), sy = Math.round(+size[2] / 2)
      await page.evaluate(() => {
        window.__touch = null
        addEventListener('pointerdown', (e) => (window.__touch = { x: e.clientX, y: e.clientY }), { once: true, capture: true })
        addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation() }, { once: true, capture: true })
      })
      await device.shell(`input tap ${sx} ${sy}`)
      await page.waitForTimeout(500)
      const t = await page.evaluate(() => window.__touch)
      return t ? [Math.round(sx - t.x * dpr), Math.round(sy - t.y * dpr)] : null
    }
    origin = await calibrate().catch(() => null)
    if (!origin) {
      await device.shell('uiautomator dump /sdcard/ui.xml').catch(() => {})
      const xml = (await device.shell('cat /sdcard/ui.xml').catch(() => '')).toString()
      const m = xml.match(/class="android\.webkit\.WebView"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)
      origin = m ? [+m[1], +m[2]] : [0, 0]
    }
    const [ox, oy] = origin
    console.log('[dotyk] WebView od', ox, oy, 'dpr', dpr)
    // Ile miejsca zajmuje pasek stanu (Android 15+ rysuje aplikację pod nim) i gdzie zaczyna się górny pasek aplikacji.
    const insets = await page.evaluate(() => {
      const d = document.createElement('div')
      d.style.cssText = 'position:fixed;top:0;height:var(--sat);width:1px'
      document.body.appendChild(d)
      const sat = d.getBoundingClientRect().height
      d.remove()
      return { sat, sosTop: document.querySelector('a[aria-label="SOS"]')?.getBoundingClientRect().top ?? -1 }
    })
    touch.push(`ekran: WebView od y=${oy}px, pasek stanu w aplikacji ${insets.sat}px, przycisk SOS od ${Math.round(insets.sosTop)}px`)
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
    await tapTouch('zakładka Okolica', 'nav a[href="#/"]', 'text=Co dziś załatwiamy?')
    await page.evaluate(() => window.scrollTo(0, 0))
    await tapTouch('SOS (u góry ekranu)', 'a[aria-label="SOS"]', 'text=Zadzwoń 112')
    await tapTouch('wstecz (u góry ekranu)', 'header button[aria-label="Wstecz"]', 'text=Co dziś załatwiamy?')
    await page.evaluate(() => window.scrollTo(0, 0))
    await tapTouch('dzwonek (u góry ekranu)', 'a[href="#/powiadomienia"]', 'header')
    await tapTouch('zakładka Okolica', 'nav a[href="#/"]', 'text=Co dziś załatwiamy?')
    await tapTouch('pole „Co dziś załatwiamy?”', 'a[href="#/szukaj"]', '#q')
    await tapTouch('zakładka Okolica', 'nav a[href="#/"]', 'text=Co dziś załatwiamy?')
    await tapTouch('pomysł AI', 'a[href*="szukaj?q="]', '#q')
    await tapTouch('zakładka Okolica', 'nav a[href="#/"]', 'text=Co dziś załatwiamy?')
    await tapTouch('kafelek tablicy', 'a[href^="#/l/"]', 'h1')
    await tapTouch('zakładka Dodaj', 'nav a[aria-label="Dodaj"]', 'text=Co chcesz zrobić?')
    await tapTouch('Sprzedaż', 'button:has-text("Sprzedaż")', 'text=Narzędzia i maszyny')
    await tapTouch('kategoria', 'button:has-text("Narzędzia i maszyny")', 'text=Pomiń i przejdź dalej')
    await tapTouch('pomiń podkategorię', 'button:has-text("Pomiń i przejdź dalej")', '#title')
    await tapTouch('zakładka Czaty', 'nav a[aria-label="Czaty"]', 'h1')
    await tapTouch('zakładka Ja', 'nav a[aria-label="Ja"]', 'text=/Miliorbit 0\\.\\d/')
    await tapTouch('zakładka Szukaj', 'nav a[aria-label="Szukaj"]', '#q')
  } catch (e) {
    touch.push(`✗ dotyk: ${e.message.split('\n')[0]}`)
  }
  console.log('[dotyk]\n' + touch.join('\n'))
  fs.writeFileSync(path.join(out, 'dotyk.txt'), touch.join('\n') + '\n')
  await page.screenshot({ path: path.join(out, '11-po-dotyku.png') }).catch(() => {})

  // ——— Scenariusz 2: jak u testera (Samsung, język niemiecki, prawdziwe kontakty w telefonie, przycisk lokalizacji) ———
  // Zgłoszenie: po rejestracji biały ekran. Odtwarzamy: wylogowanie, rejestracja po niemiecku, 40 kontaktów, GPS.
  const consoleErrors = []
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 300)))
  const addContacts = async (n) => {
    for (let i = 0; i < n; i++) await device.shell('content insert --uri content://com.android.contacts/raw_contacts --bind account_type:s:test --bind account_name:s:test').catch(() => {})
    const ids = ((await device.shell('content query --uri content://com.android.contacts/raw_contacts --projection _id').catch(() => '')).toString().match(/_id=(\d+)/g) || []).map((x) => x.slice(4))
    for (const [i, id] of ids.entries()) {
      const tel = i % 5 === 0 ? `0171 23456${String(i).padStart(2, '0')}` : `+49 171 98765${String(i).padStart(2, '0')}`
      await device.shell(`content insert --uri content://com.android.contacts/data --bind raw_contact_id:i:${id} --bind mimetype:s:vnd.android.cursor.item/phone_v2 --bind data1:s:'${tel}' --bind data2:i:2`).catch(() => {})
    }
    return ids.length
  }
  await step('de-kontakty-w-telefonie', async () => {
    const n = await addContacts(40)
    console.log('[de] kontakty w telefonie:', n)
    for (const perm of ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION']) await device.shell(`pm grant ${PKG} android.permission.${perm}`).catch(() => {})
    await tap('nav a[aria-label="Ja"]')
    await tap('button:has-text("Wyloguj i wyczyść dane demo")')
    await page.waitForSelector('#phone')
  })
  await step('de-numer', async () => {
    await tap('button:has(span[lang])')
    await tap('button:has(span[lang="de"])')
    await page.waitForSelector('text=Deine Telefonnummer')
    await tap('text=600 100 200')
    await tap('button:has-text("Zustimmen und weiter")')
    await tap('text=Demo: beliebige 6 Ziffern eingeben.')
    await page.waitForSelector('#name')
  })
  await step('de-profil', async () => {
    await page.fill('#name', 'Mar')
    await tap('button[role=radio]:has-text("Mann")')
    await page.selectOption('#region', 'Baden-Württemberg')
    await tap('button:has-text("Meinen Standort verwenden")')
    await page.waitForTimeout(3000)
  })
  await step('de-kontakty', async () => {
    await tap('button:has-text("Weiter")')
    await tap('button:has-text("Zugriff auf Kontakte erlauben")')
    await page.waitForSelector('text=Hashwerte vom Server gelöscht', { timeout: 30_000 })
  })
  await step('de-glowna', async () => {
    await tap('button:has-text("Los geht")')
    await page.waitForSelector('text=Was erledigen wir heute?')
  })
  await step('de-glowna-po-12s', async () => {
    await page.waitForTimeout(12_000)
    await page.waitForSelector('text=Was erledigen wir heute?')
  })
  // Kalendarz: termin na dziś, potem karta „Heute” na głównej.
  await step('de-kalender', async () => {
    await tap('a[aria-label="Kalender"]')
    await tap('button[aria-label="Termin hinzufügen"]')
    await page.fill('#cal-title', 'Zahnarzt')
    await page.fill('#cal-time', '09:30')
    await tap('button:has-text("Speichern")')
    await page.waitForSelector('text=Zahnarzt')
  })
  await step('de-glowna-kalender', async () => {
    await tap('header button[aria-label="Zurück"]')
    await page.waitForSelector('a[href="#/kalendarz"] >> text=Zahnarzt')
  })
  // Prawdziwy ekran telefonu (nie tylko strona): czy zmienia się po stuknięciu w zakładkę?
  try {
    const crypto = require('crypto')
    const md5 = (b) => crypto.createHash('md5').update(b).digest('hex').slice(0, 8)
    const before = await device.screenshot({ path: path.join(out, 'de-ekran-1-glowna.png') })
    await tapTouchExternal('nav a[aria-label="Anbieten"]')
    await page.waitForTimeout(1500)
    const after = await device.screenshot({ path: path.join(out, 'de-ekran-2-anbieten.png') })
    const line = `ekran telefonu: główna ${md5(before)} → po stuknięciu „Anbieten” ${md5(after)} (${md5(before) === md5(after) ? '✗ EKRAN STOI' : '✓ zmienił się'}), adres ${await page.evaluate(() => location.hash)}`
    console.log('[de]', line)
    touch.push(line)
  } catch (e) {
    touch.push(`✗ ekran telefonu: ${e.message.split('\n')[0]}`)
  }
  const pageText = await page.evaluate(() => document.getElementById('root')?.innerText.slice(0, 80) ?? 'BRAK #root')
  touch.push(`de: treść strony na końcu: ${JSON.stringify(pageText)}`)
  touch.push(`de: błędy strony: ${errors.filter((e) => !e.startsWith('de-')).length}, błędy konsoli: ${consoleErrors.length ? consoleErrors.join(' | ') : 'brak'}`)
  const diagErrors = await page.evaluate(() => localStorage.getItem('miliorbit:errors') || '[]')
  touch.push(`de: zapisane błędy aplikacji: ${diagErrors}`)
  fs.writeFileSync(path.join(out, 'dotyk.txt'), touch.join('\n') + '\n')

  await diag('na końcu').catch(() => {})
  fs.writeFileSync(path.join(out, 'wynik.txt'), errors.length ? `BŁĘDY:\n${errors.join('\n')}\n` : 'OK: wszystkie kroki przeszły\n')
  console.log(errors.length ? `Błędy:\n${errors.join('\n')}` : 'Wszystkie kroki przeszły')
  await device.close()
  process.exit(errors.length ? 1 : 0)
})().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
