import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import { Avatar, Button, Group, Header, Notice, Row, cx, timeAgo } from '../components/ui'
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
      <div className="flex flex-col gap-5 pb-6">
        <Header title={t('r.title')} back />
        <div className="flex flex-col gap-3 px-4">
          <p className="font-semibold">{t('r.lead')}</p>
          <ul className="flex flex-col gap-2">
            {(['r.p1', 'r.p2', 'r.p3'] as const).map((k) => (
              <li key={k} className="flex gap-2"><Icon name="check" size={20} className="mt-0.5 shrink-0 text-ok" /> {t(k)}</li>
            ))}
          </ul>
          <p className="text-[14px] text-muted">{t('r.web', { url: `${BRAND.domain}/zastrzez` })}</p>
          {sent && <Notice tone="ok">{t('r.unlocked')}</Notice>}
          <Button variant="danger" onClick={restrict}><Icon name="lock" size={20} /> {t('r.confirm')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <Header title={t('r.unlockTitle')} back />
      <div className="flex flex-col gap-3 px-4">
        <Notice tone="danger">{t('r.banner')}</Notice>
        <p>{t('r.unlockText')}</p>
      </div>
      {trusted.length < 2 ? (
        <div className="flex flex-col gap-3 px-4">
          <Notice>{t('r.noTrusted')}</Notice>
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
                  <Icon name={ok ? 'check' : 'chevron'} className={ok ? 'text-ok' : 'text-line'} />
                </div>
              )
            })}
          </Group>
          <div className="flex flex-col gap-3 px-4">
            {sent && waiting.length > 0 && <p className="text-[14px] text-muted">{t('r.waiting', { names: waiting.map((u) => u.name.split(' ')[0]).join(', ') })}</p>}
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
    <div className="-mx-4">
      <Group label={t('r.pick')} footer={t('me.trustedD')}>
        {friends.map((u) => {
          const on = account.trusted.includes(u.id)
          return (
            <button key={u.id} type="button" onClick={() => toggle(u.id)} aria-pressed={on} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-sunken">
              <Avatar user={u} size={36} />
              <span className="flex-1">{u.name}</span>
              <span className={cx('grid size-6 place-items-center rounded-full border-2', on ? 'border-accent bg-accent text-accent-ink' : 'border-line')}>
                {on && <Icon name="check" size={14} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </Group>
    </div>
  )
}

export function Trusted() {
  const { t } = useStore()
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Header title={t('me.trusted')} back />
      <div className="px-4"><TrustedPicker /></div>
    </div>
  )
}

/** Kontakty z telefonu, których jeszcze tu nie ma (w aplikacji natywnej: wtyczka Contacts). */
const PHONE_CONTACTS = ['Agnieszka, sąsiadka', 'Wujek Staszek', 'Kuba z pracy', 'Monika', 'Paweł rower', 'Basia']

export function Friends() {
  const { t, users, listings, relation, account, invite } = useStore()
  const [shareFor, setShareFor] = useState('')
  const friends = users[ME].friends.map((id) => users[id])
  const fof = Object.values(users).filter((u) => u.id !== ME && relation(u.id).circle === 2)
  const n = Math.min(account.invited.length, 3)
  const msg = t('f.inviteMsg', { link: `https://${BRAND.domain}/z/${ME}` })
  const enc = encodeURIComponent

  return (
    <div className="flex flex-col gap-6 pb-6">
      <Header title={t('f.title')} back />
      <div className="mx-4 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <p className="font-semibold">{t('f.reward')}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${(n / 3) * 100}%` }} />
        </div>
        <p className="tnum text-[13px] text-muted">{t('f.progress', { n })}</p>
      </div>

      <Group label={t('f.contacts')}>
        {PHONE_CONTACTS.map((c) => (
          <div key={c}>
            <div className="flex min-h-14 items-center gap-3 px-4 py-2">
              <span className="grid size-9 place-items-center rounded-full bg-sunken font-semibold text-muted">{c[0]}</span>
              <span className="min-w-0 flex-1 truncate">{c}</span>
              <Button variant="secondary" className="min-h-9 px-3 text-[14px]" onClick={() => { invite(c); setShareFor(shareFor === c ? '' : c) }}>
                {account.invited.includes(c) ? t('f.again') : t('f.invite')}
              </Button>
            </div>
            {shareFor === c && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {[
                  ['SMS', `sms:?&body=${enc(msg)}`],
                  ['WhatsApp', `https://wa.me/?text=${enc(msg)}`],
                  ['Messenger', `fb-messenger://share/?link=${enc(`https://${BRAND.domain}`)}`],
                  ['E-mail', `mailto:?subject=${enc(BRAND.name)}&body=${enc(msg)}`],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" className="min-h-9 rounded-lg border border-line px-3 py-1.5 text-[14px]">{label}</a>
                ))}
              </div>
            )}
          </div>
        ))}
      </Group>

      <Group label={t('f.inApp')}>
        {friends.map((u) => (
          <div key={u.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <Avatar user={u} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{u.name}</span>
              <span className={cx('block text-[13px]', u.restricted ? 'text-danger' : 'text-muted')}>
                {u.restricted ? t('rel.restricted') : t('f.items', { n: listings.filter((l) => l.ownerId === u.id).length })}
              </span>
            </span>
          </div>
        ))}
      </Group>

      <Group label={t('f.fof')}>
        {fof.map((u) => (
          <Row key={u.id} title={u.name} detail={t('rel.fof', { names: relation(u.id).via.map((v) => users[v].name.split(' ')[0]).join(', ') })} />
        ))}
      </Group>
    </div>
  )
}

export function Install() {
  const { t } = useStore()
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Header title={t('i.title')} back />
      <p className="px-4">{t('i.text')}</p>
      <Group>
        <Row icon="phone" title="iPhone, iPad" detail={t('i.ios')} />
        <Row icon="phone" title="Android" detail={t('i.android')} />
      </Group>
      {ios && <div className="px-4"><Notice tone="ok">{t('i.ios')}</Notice></div>}
    </div>
  )
}

export function Notifications() {
  const { t, notifications, markNotificationsRead } = useStore()
  const [items] = useState(notifications)
  useEffect(() => markNotificationsRead(), []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Header title={t('n.title')} back />
      <Group>
        {items.length ? (
          items.map((n) => (
            <Row key={n.id} to={n.link} icon={n.tone === 'warn' ? 'lock' : 'bell'} danger={n.tone === 'warn'} title={<span className={cx(!n.read && 'font-semibold')}>{n.text}</span>} detail={timeAgo(n.at, t)} />
          ))
        ) : (
          <p className="px-4 py-4 text-muted">{t('n.empty')}</p>
        )}
      </Group>
    </div>
  )
}
