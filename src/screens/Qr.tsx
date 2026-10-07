import { useState } from 'react'
import { useStore } from '../data/store'
import { Button, Header, ShareSheet } from '../components/ui'
import { Icon } from '../components/icons'
import { QrCode } from '../components/qr'
import { BRAND } from '../config'
import { ME } from '../data/seed'

/**
 * Jeden kod QR do aplikacji: prowadzi na stronę /pobierz, która sama rozpozna telefon
 * (Android → Google Play, iPhone → App Store, komputer → oba linki i instalacja ze strony).
 */
export function Qr() {
  const { t } = useStore()
  const [share, setShare] = useState(false)
  const url = `https://${BRAND.domain}/pobierz?ref=${ME}`
  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={t('qr.title')} />
      <section className="card mx-4 flex flex-col items-center gap-4 p-6 text-center">
        <div className="rounded-[24px] bg-white p-3 shadow-[var(--shadow)]">
          <QrCode value={url} size={232} label={t('qr.title')} />
        </div>
        <p className="text-[20px] leading-tight font-extrabold">{t('qr.lead')}</p>
        <div className="grid w-full grid-cols-2 gap-2 text-left">
          <p className="flex items-start gap-2 rounded-[16px] bg-fill p-3 text-[13px] leading-snug"><Icon name="phone" size={18} className="shrink-0" /> {t('qr.android')}</p>
          <p className="flex items-start gap-2 rounded-[16px] bg-fill p-3 text-[13px] leading-snug"><Icon name="phone" size={18} className="shrink-0" /> {t('qr.ios')}</p>
        </div>
        <p className="tnum text-[13px] break-all text-muted select-all">{url}</p>
      </section>
      <div className="flex flex-col gap-2 px-4">
        <Button onClick={() => setShare(true)}><Icon name="share" size={18} /> {t('f.shareApp')}</Button>
        <p className="px-1 text-center text-[13px] text-muted">{t('qr.print')}</p>
      </div>
      {share && <ShareSheet text={t('f.inviteMsg', { link: url })} url={url} t={t} onClose={() => setShare(false)} />}
    </div>
  )
}
