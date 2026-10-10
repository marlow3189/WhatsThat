import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, cx } from './ui'
import { Icon, Mark } from './icons'
import { BRAND } from '../config'
import { ME } from '../data/seed'

/** Boczne menu (☰ na ekranie Okolica): wszystko, czego nie ma w dolnym pasku, w jednym miejscu. */
export function MenuDrawer({ onClose }: { onClose: () => void }) {
  const { t, account, users } = useStore()
  const items = [
    { to: '/kalendarz', icon: 'calendar', label: t('cal.title'), tone: 'tile-1' },
    { to: '/moje', icon: 'list', label: t('me.mine'), tone: 'tile-3' },
    { to: '/zamowienia', icon: 'bag', label: t('me.orders'), tone: 'tile-2' },
    { to: '/znajomi', icon: 'users', label: t('me.invite'), tone: 'tile-4' },
    { to: '/szukaj?mapa=1', icon: 'pin', label: t('home.map'), tone: 'tile-4' },
    { to: '/paliwa', icon: 'fuel', label: t('fuel.title'), tone: 'tile-3' },
    { to: '/qr', icon: 'qr', label: t('qr.title'), tone: 'tile-5' },
    { to: '/ja', icon: 'user', label: t('menu.settings'), tone: 'tile-5' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex bg-black/35" onClick={onClose} role="dialog" aria-modal aria-label={t('menu.title')}>
      <nav
        className="drawer-in flex h-full w-[82%] max-w-[20rem] flex-col gap-1 overflow-y-auto bg-bg px-3"
        style={{ paddingTop: 'calc(var(--sat) + 12px)', paddingBottom: 'calc(var(--sab) + 12px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-2 pb-3 text-[20px] font-extrabold text-primary"><Mark size={30} /> {BRAND.name}</div>
        <Link to="/ja" onClick={onClose} className="press mb-2 flex items-center gap-3 rounded-[16px] bg-surface p-3 shadow-[var(--shadow)]">
          <Avatar user={users[ME]} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold">{account.name}</span>
            <span className="block truncate text-[12.5px] text-muted">{account.place.town} · {account.place.voivodeship}</span>
          </span>
        </Link>
        {items.map((i) => (
          <Link key={i.to} to={i.to} onClick={onClose} className="press flex min-h-12 items-center gap-3 rounded-[14px] px-2 active:bg-fill">
            <span className={cx('grid size-9 shrink-0 place-items-center rounded-[11px]', i.tone)}><Icon name={i.icon} size={18} /></span>
            <span className="text-[15px] font-semibold">{i.label}</span>
          </Link>
        ))}
        <Link to="/sos" onClick={onClose} className="press mt-2 flex min-h-12 items-center gap-3 rounded-[14px] bg-danger px-3 text-white">
          <span className="text-[13px] font-extrabold tracking-wide">SOS</span>
          <span className="min-w-0 truncate text-[13px] font-semibold">{t('sos.meD')}</span>
        </Link>
      </nav>
    </div>
  )
}
