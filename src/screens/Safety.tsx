import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import { Avatar, Button, Group, Header, Notice, Row, ShareSheet, cx, timeAgo } from '../components/ui'
import { Icon } from '../components/icons'
import { BRAND } from '../config'
import { ME } from '../data/seed'

/** Zastrzeżenie numeru: jak zastrzeżenie PESEL, tylko dla konta w aplikacji. */
export function Restrict() {
  const { t, account, users, restrict, requestUnlock } = useStore()
  const [sent, setSent] = useState(false)
  const trusted = account.trusted.map((id) => users[id])
  const waiting = trusted.filter((u) => !account.unlockApprovals.includes(u.id))

  if (!account.restricted) {
    return (
      <div className="flex flex-col gap-5 pb-8">
        <Header back title={t('r.title')} />
        <div className="card mx-4 flex flex-col gap-3 p-5">
          <p className="text-[17px] font-semibold">{t('r.lead')}</p>
          <ul className="flex flex-col gap-2.5">
            {(['r.p1', 'r.p2', 'r.p3'] as const).map((k) => (
              <li key={k} className="flex gap-2.5"><Icon name="check" size={20} strokeWidth={2.4} className="mt-0.5 shrink-0 text-ok" /> {t(k)}</li>
            ))}
          </ul>
          <p className="text-[14px] text-muted">{t('r.web', { url: `${BRAND.domain}/zastrzez` })}</p>
        </div>
        <div className="flex flex-col gap-3 px-4">
          {sent && <Notice tone="ok" icon="check">{t('r.unlocked')}</Notice>}
          <Button variant="danger" onClick={restrict}><Icon name="lock" size={20} /> {t('r.confirm')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header back title={t('r.unlockTitle')} />
      <div className="flex flex-col gap-3 px-4">
        <Notice tone="danger" icon="lock">{t('r.banner')}</Notice>
        <p>{t('r.unlockText')}</p>
      </div>
      {trusted.length < 2 ? (
        <div className="flex flex-col gap-3">
          <div className="px-4"><Notice>{t('r.noTrusted')}</Notice></div>
          <TrustedPicker />
        </div>
      ) : (
        <>
          <Group>
            {trusted.map((u) => {
              const ok = account.unlockApprovals.includes(u.id)
              return (
                <div key={u.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                  <Avatar user={u} size={36} />
                  <span className="flex-1">{ok ? t('r.approved', { name: u.name.split(' ')[0] }) : u.name}</span>
                  {ok && <Icon name="check" className="text-ok" strokeWidth={2.4} />}
                </div>
              )
            })}
          </Group>
          <div className="flex flex-col gap-3 px-4">
            {sent && waiting.length > 0 && <p className="text-[15px] text-muted">{t('r.waiting', { names: waiting.map((u) => u.name.split(' ')[0]).join(', ') })}</p>}
            <Button disabled={sent} onClick={() => { setSent(true); requestUnlock() }}>{t('r.sendRequests')}</Button>
          </div>
        </>
      )}
    </div>
  )
}

function TrustedPicker() {
  const { t, account, users, setTrusted } = useStore()
  const friends = users[ME].friends.map((id) => users[id]).filter((u) => u && !u.restricted)
  const toggle = (id: string) => {
    const has = account.trusted.includes(id)
    setTrusted(has ? account.trusted.filter((x) => x !== id) : [...account.trusted, id].slice(-2))
  }
  return (
    <Group label={t('r.pick')} footer={t('me.trustedD')}>
      {friends.map((u) => {
        const on = account.trusted.includes(u.id)
        return (
          <button key={u.id} type="button" onClick={() => toggle(u.id)} aria-pressed={on} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-fill">
            <Avatar user={u} size={36} />
            <span className="flex-1">{u.name}</span>
            <span className={cx('grid size-6 place-items-center rounded-full border-2', on ? 'border-link bg-link text-white' : 'border-fill-strong')}>
              {on && <Icon name="check" size={14} strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </Group>
  )
}

export function Trusted() {
  const { t } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('me.trusted')} />
      <TrustedPicker />
    </div>
  )
}

/** Kontakty z telefonu, których jeszcze tu nie ma (w aplikacji natywnej: wtyczka Contacts). */
const PHONE_CONTACTS = ['Agnieszka, sąsiadka', 'Wujek Staszek', 'Kuba z pracy', 'Monika', 'Paweł rower', 'Basia']

/** Polecanie jak w WhatsAppie: SMS z linkiem do instalacji, wysyłany z telefonu użytkownika (koszt 0 zł). */
export function Friends() {
  const { t, users, listings, relation, account, invite } = useStore()
  const [shareApp, setShareApp] = useState(false)
  const friends = users[ME].friends.map((id) => users[id])
  const fof = Object.values(users).filter((u) => u.id !== ME && relation(u.id).circle === 2)
  const n = Math.min(account.invited.length, 3)
  const link = `https://${BRAND.domain}/z/${ME}`
  const msg = t('f.inviteMsg', { link })

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Header back title={t('f.title')} />
      <div className="mx-4 flex flex-col gap-3 rounded-[24px] bg-accent p-5 text-accent-ink">
        <p className="text-[18px] leading-tight font-bold">{t('f.reward')}</p>
        <div className="h-2 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-[#0b0b0c] transition-all" style={{ width: `${(n / 3) * 100}%` }} />
        </div>
        <p className="tnum text-[14px] opacity-80">{t('f.progress', { n })}</p>
        <Button size="sm" className="self-start bg-[#0b0b0c] text-white" onClick={() => setShareApp(true)}><Icon name="share" size={18} /> {t('f.shareApp')}</Button>
      </div>

      <Group label={t('f.contacts')}>
        {PHONE_CONTACTS.map((c) => (
          <div key={c} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <span className="grid size-9 place-items-center rounded-full bg-fill font-semibold text-muted">{c[0]}</span>
            <span className="min-w-0 flex-1 truncate">{c}</span>
            <a href={`sms:?&body=${encodeURIComponent(msg)}`} onClick={() => invite(c)} className="press inline-flex min-h-9 items-center rounded-full bg-fill px-3.5 text-[15px] font-semibold text-link">
              {account.invited.includes(c) ? t('f.again') : t('f.invite')}
            </a>
          </div>
        ))}
      </Group>

      <Group label={t('f.inApp')}>
        {friends.map((u) => (
          <div key={u.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <Avatar user={u} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{u.name}</span>
              <span className={cx('block text-[14px]', u.restricted ? 'text-danger' : 'text-muted')}>
                {u.restricted ? t('rel.restricted') : t('f.items', { n: listings.filter((l) => l.ownerId === u.id).length })}
              </span>
            </span>
          </div>
        ))}
      </Group>

      <Group label={t('f.fof')}>
        {fof.map((u) => <Row key={u.id} title={u.name} detail={t('rel.fof', { names: relation(u.id).via.map((v) => users[v].name.split(' ')[0]).join(', ') })} />)}
      </Group>
      {shareApp && <ShareSheet text={msg} url={link} t={t} onClose={() => setShareApp(false)} />}
    </div>
  )
}

export function Install() {
  const { t } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('i.title')} />
      <p className="px-5 text-[17px]">{t('i.text')}</p>
      <Group>
        <Row icon="phone" title="iPhone, iPad" detail={t('i.ios')} />
        <Row icon="phone" title="Android" detail={t('i.android')} />
        <Row icon="globe" title="Chrome, Edge, Safari" detail={t('i.desktop')} />
      </Group>
    </div>
  )
}

export function Notifications() {
  const { t, notifications, markNotificationsRead } = useStore()
  const [items] = useState(notifications)
  useEffect(() => markNotificationsRead(), []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Header back title={t('n.title')} />
      <Group>
        {items.length ? (
          items.map((n) => (
            <Row key={n.id} to={n.link} icon={n.tone === 'warn' ? 'lock' : 'bell'} danger={n.tone === 'warn'} title={<span className={cx('text-[15px] leading-snug', !n.read && 'font-semibold')}>{n.text}</span>} detail={timeAgo(n.at, t)} />
          ))
        ) : (
          <p className="px-4 py-3 text-muted">{t('n.empty')}</p>
        )}
      </Group>
    </div>
  )
}
