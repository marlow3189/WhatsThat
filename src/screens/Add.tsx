import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useStore } from '../data/store'
import { Avatar, Button, Field, Group, Header, Input, Notice, Row, ShareSheet, Tile, Toggle, cx, hueOf, inputCls, listingUrl, money, readPhoto } from '../components/ui'
import { Icon } from '../components/icons'
import { CATEGORIES, categoryById } from '../lib/categories'
import { PRICES, UNITS_BY_KIND } from '../lib/pricing'
import type { Circle, Delivery, Kind, Unit } from '../lib/types'
import { ME } from '../data/seed'

const KINDS: Kind[] = ['sell', 'rent', 'service', 'wanted', 'give', 'swap', 'garage']
const KIND_ICON: Record<Kind, string> = { sell: 'bag', rent: 'calendar', service: 'hand', give: 'box', swap: 'users', garage: 'house', wanted: 'search' }
const CARRIERS: Delivery[] = ['inpost', 'orlen', 'dpd', 'dhl', 'poczta', 'courier', 'other']

type Step = 'kind' | 'category' | 'details' | 'who' | 'done'
type Who = Circle | 'incognito'

/** Dodawanie w czterech krótkich krokach. Z rozszerzenia przeglądarki przychodzi tytuł i zdjęcie (?t=, ?img=). */
export function Add() {
  const { t, locale, account, users, listings, canAdd, mustRefresh, addedThisMonth, freeLimit, buyPlan, refresh, addListing } = useStore()
  const [params] = useSearchParams()
  const lang = account.lang
  const [step, setStep] = useState<Step>('kind')
  const [kind, setKind] = useState<Kind>('sell')
  const [category, setCategory] = useState('')
  const [sub, setSub] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(params.get('img') ?? undefined)
  const [title, setTitle] = useState(params.get('t') ?? '')
  const [description, setDescription] = useState(params.get('u') ? `\n${params.get('u')}` : '')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState<Unit>('fixed')
  const [condition, setCondition] = useState<'new' | 'used'>('used')
  const [deal, setDeal] = useState(false)
  const [stock, setStock] = useState('')
  const [pickupHours, setPickupHours] = useState('')
  const [delivery, setDelivery] = useState<Delivery[]>(['pickup'])
  const [shippingPrice, setShippingPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [garageDate, setGarageDate] = useState(new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10))
  const [swapFor, setSwapFor] = useState('')
  const [who, setWho] = useState<Who>(3)
  const [hiddenFrom, setHiddenFrom] = useState<string[]>([])
  const [showHide, setShowHide] = useState(false)
  const [error, setError] = useState('')
  const [publishedId, setPublishedId] = useState('')
  const [share, setShare] = useState(false)
  // Ogłoszenia sąsiedzkie (zaginione zwierzę, zbiórka) są zawsze darmowe, także po wykorzystaniu limitu.
  const [community, setCommunity] = useState(false)
  // Każdy krok zaczyna się od góry ekranu (formularz nie zostaje przewinięty w połowie).
  useEffect(() => window.scrollTo(0, 0), [step, category])

  const published = publishedId ? listings.find((l) => l.id === publishedId) : undefined
  const prices = PRICES[account.currency]
  const paid = kind === 'sell' || kind === 'rent' || kind === 'service'
  const isFarm = category === 'farm'
  const friends = users[ME].friends.map((id) => users[id]).filter(Boolean)
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(locale, { day: 'numeric', month: 'long' })

  if (step !== 'done' && !canAdd && !(community && !account.restricted)) {
    return (
      <div className="pb-6">
        <Header large title={t('a.title')} />
        <div className="flex flex-col gap-4 px-4">
          {account.restricted ? (
            <Notice tone="danger" icon="lock">{t('a.restricted')}</Notice>
          ) : mustRefresh ? (
            <div className="card flex flex-col gap-3 p-5">
              <p className="text-[20px] leading-tight font-bold">{t('a.refreshTitle')}</p>
              <p className="text-muted">{t('a.refreshText', { n: freeLimit, price: money(prices.refresh, account.currency, locale) })}</p>
              <Button onClick={refresh}>{t('a.refreshCta', { price: money(prices.refresh, account.currency, locale) })}</Button>
              <Button variant="secondary" onClick={() => buyPlan('annual')}>{t('a.buyAnnual', { price: money(prices.annual, account.currency, locale) })}</Button>
            </div>
          ) : (
            <div className="card flex flex-col gap-3 p-5">
              <p className="text-[20px] leading-tight font-bold">{t('a.limitTitle')}</p>
              <p className="text-muted">{t('a.limitText', { n: freeLimit, date: nextMonth, price: money(prices.annual, account.currency, locale) })}</p>
              <Button onClick={() => buyPlan('annual')}>{t('a.buyAnnual', { price: money(prices.annual, account.currency, locale) })}</Button>
              <Button variant="secondary" onClick={() => buyPlan('business')}>{t('a.buyBusiness', { price: money(prices.business, account.currency, locale) })}</Button>
              <p className="tnum text-center text-[13px] text-muted">{addedThisMonth} / {freeLimit}</p>
            </div>
          )}
          {!account.restricted && (
            <button type="button" onClick={() => { setCommunity(true); setKind('wanted'); setCategory('community'); setSub('missing'); setStep('details') }} className="press flex items-center gap-3 rounded-[22px] bg-danger-soft p-4 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-danger"><Icon name="paw" size={20} /></span>
              <span className="min-w-0">
                <span className="block font-bold">{t('a.alertTitle')}</span>
                <span className="block text-[14px] leading-snug text-ink/70">{t('a.alertText')}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }

  const chooseKind = (k: Kind) => {
    setKind(k)
    setUnit(UNITS_BY_KIND[k][0])
    if (k === 'garage') {
      setCategory('other')
      setSub('other')
      setStep('details')
    } else {
      setCategory('')
      setStep('category')
    }
  }

  const chooseCategory = (id: string) => {
    setCategory(id)
    setSub('')
    if (id === 'farm') setUnit('kg')
  }

  const num = (v: string) => Number(v.replace(',', '.'))
  const toWho = () => {
    if (title.trim().length < 3) return setError(t('a.errTitle'))
    if (paid && !(num(price) > 0)) return setError(t('a.errPrice'))
    setError('')
    setStep('who')
  }

  const publish = () => {
    const id = addListing({
      kind,
      category,
      sub: sub || undefined,
      title: title.trim(),
      description: description.trim(),
      price: paid ? Math.round(num(price) * 100) : undefined,
      currency: account.currency,
      unit: paid ? unit : 'fixed',
      condition: kind === 'sell' && !isFarm ? condition : undefined,
      deal: kind === 'sell' && deal ? true : undefined,
      stock: stock ? num(stock) : undefined,
      pickupHours: pickupHours.trim() || undefined,
      delivery,
      shippingPrice: delivery.length > 1 && shippingPrice ? Math.round(num(shippingPrice) * 100) : undefined,
      deposit: kind === 'rent' && deposit ? Math.round(num(deposit) * 100) : undefined,
      garageDate: kind === 'garage' ? garageDate : undefined,
      swapFor: kind === 'swap' ? swapFor.trim() || undefined : undefined,
      photo,
      place: account.place,
      visibility: who === 'incognito' ? 3 : who,
      incognito: who === 'incognito' || undefined,
      hiddenFrom: hiddenFrom.length ? hiddenFrom : undefined,
    })
    if (id) {
      setPublishedId(id)
      setStep('done')
    }
  }

  const back = ({ kind: undefined, category: 'kind', details: kind === 'garage' ? 'kind' : 'category', who: 'details', done: undefined } as const)[step]
  const stepNo = { kind: 1, category: 2, details: 3, who: 4, done: 4 }[step]
  const toggleDelivery = (d: Delivery, on: boolean) => setDelivery((xs) => (on ? [...xs, d] : xs.filter((x) => x !== d)))

  return (
    <div className="pb-8">
      {back ? (
        <Header back onBack={() => setStep(back)} title={t('a.title')} right={<span className="tnum pr-2 text-[15px] text-muted">{stepNo}/4</span>} />
      ) : (
        <Header large title={t('a.title')} />
      )}
      <div className="flex flex-col gap-5 pt-2">
        {step === 'kind' && (
          <Group label={t('a.what')}>
            {KINDS.map((k) => <Row key={k} icon={KIND_ICON[k]} title={t(`kind.${k}`)} detail={t(`kindDesc.${k}`)} onClick={() => chooseKind(k)} />)}
          </Group>
        )}

        {step === 'category' && !category && (
          <section className="flex flex-col gap-2">
            <h2 className="px-5 text-[15px] font-bold">{`${t(`kind.${kind}`)} · ${t('a.category')}`}</h2>
            <div className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-3">
              {CATEGORIES.filter((c) => c.kinds.includes(kind)).map((c) => (
                <button key={c.id} type="button" onClick={() => chooseCategory(c.id)} className="press flex min-h-[76px] flex-col items-start justify-between gap-2 rounded-[20px] bg-surface p-3 text-left shadow-[var(--shadow)]">
                  <span className="tint grid size-9 place-items-center rounded-full" style={{ '--h': hueOf(c.id) } as CSSProperties}><Icon name={c.icon} size={19} /></span>
                  <span className="text-[14px] leading-tight font-bold">{c.label[lang]}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'category' && category && (
          <section className="flex flex-col gap-4 px-4">
            <div className="card flex items-center gap-3 p-3">
              <span className="tint grid size-11 shrink-0 place-items-center rounded-full" style={{ '--h': hueOf(category) } as CSSProperties}><Icon name={categoryById(category).icon} size={22} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-muted">{t('a.category')}</span>
                <span className="block font-bold">{categoryById(category).label[lang]}</span>
              </span>
              <button type="button" onClick={() => setCategory('')} className="min-h-10 px-2 text-[15px] font-semibold text-link">{t('a.change')}</button>
            </div>
            <p className="px-1 text-[15px] font-bold">{t('a.subPick')}</p>
            <div className="flex flex-wrap gap-2">
              {categoryById(category).subs.map((s) => (
                <button key={s.id} type="button" onClick={() => { setSub(s.id); setStep('details') }} className="press min-h-11 rounded-full bg-surface px-4 text-[15px] font-semibold shadow-[var(--shadow)]">
                  {s.label[lang]}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={() => setStep('details')}>{t('a.skip')}</Button>
          </section>
        )}

        {step === 'details' && (
          <div className="flex flex-col gap-4 px-4">
            <label htmlFor="photo" className="press card grid aspect-[16/10] max-w-full cursor-pointer place-items-center overflow-hidden text-link">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2"><span className="grid size-14 place-items-center rounded-full bg-fill"><Icon name="camera" size={28} /></span><span className="font-medium">{t('a.photo')}</span></span>}
              <input id="photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) setPhoto(await readPhoto(f))
              }} />
            </label>
            <Field id="title" label={t('a.titleLabel')}>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'wanted' ? t('a.wantedPh') : t('a.titlePh')} />
            </Field>
            {paid && (
              <div className="grid grid-cols-[1fr_8rem] gap-3">
                <Field id="price" label={t('a.price')}>
                  <Input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={account.currency} className="tnum" />
                </Field>
                <Field id="unit" label={t('a.unit')}>
                  <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={inputCls}>
                    {UNITS_BY_KIND[kind].map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
                  </select>
                </Field>
              </div>
            )}
            {kind === 'sell' && !isFarm && (
              <Field id="condition" label={t('a.condition')}>
                <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as 'new' | 'used')} className={inputCls}>
                  <option value="used">{t('cond.used')}</option>
                  <option value="new">{t('cond.new')}</option>
                </select>
              </Field>
            )}
            {isFarm && (
              <Field id="stock" label={t('a.stock')}>
                <Input id="stock" inputMode="decimal" value={stock} onChange={(e) => setStock(e.target.value)} className="tnum" placeholder={`100 ${t(`unit.${unit}`)}`} />
              </Field>
            )}
            {kind === 'garage' && (
              <Field id="garageDate" label={t('a.garageDate')}><Input id="garageDate" type="date" value={garageDate} onChange={(e) => setGarageDate(e.target.value)} /></Field>
            )}
            {(isFarm || kind === 'garage' || kind === 'give') && (
              <Field id="pickupHours" label={t('a.pickupHours')}><Input id="pickupHours" value={pickupHours} onChange={(e) => setPickupHours(e.target.value)} placeholder={t('a.pickupPh')} /></Field>
            )}
            {kind === 'rent' && (
              <Field id="deposit" label={t('a.deposit')} hint={t('a.depositHint')}>
                <Input id="deposit" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="tnum" placeholder={`0 ${account.currency}`} />
              </Field>
            )}
            {kind === 'swap' && <Field id="swapFor" label={t('a.swapFor')}><Input id="swapFor" value={swapFor} onChange={(e) => setSwapFor(e.target.value)} /></Field>}
            <Field id="description" label={t('a.desc')}>
              <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('a.descPh')} className={cx(inputCls, 'py-3')} />
            </Field>
            {kind === 'sell' && !isFarm && <div className="card overflow-hidden"><Toggle id="deal" label={t('a.deal')} checked={deal} onChange={setDeal} /></div>}
            {kind === 'sell' && (
              <div className="-mx-4">
                <Group label={t('a.delivery')}>
                  <Toggle id="d-pickup" label={t('del.pickup')} checked={delivery.includes('pickup')} onChange={(v) => toggleDelivery('pickup', v)} />
                  {CARRIERS.map((d) => <Toggle key={d} id={`d-${d}`} label={t(`del.${d}`)} checked={delivery.includes(d)} onChange={(v) => toggleDelivery(d, v)} />)}
                </Group>
              </div>
            )}
            {kind === 'sell' && delivery.some((d) => d !== 'pickup') && (
              <Field id="shippingPrice" label={t('a.shippingPrice')}><Input id="shippingPrice" inputMode="decimal" value={shippingPrice} onChange={(e) => setShippingPrice(e.target.value)} className="tnum" placeholder={`15,99 ${account.currency}`} /></Field>
            )}
            {error && <Notice tone="danger">{error}</Notice>}
            <Button onClick={toWho}>{t('next')}</Button>
          </div>
        )}

        {step === 'who' && (
          <>
            <Group label={t('a.who')} footer={t('a.notifyNote')}>
              {([1, 2, 3, 'incognito'] as Who[]).map((c) => (
                <button key={c} type="button" onClick={() => setWho(c)} aria-pressed={who === c} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-fill">
                  <span className="min-w-0 flex-1">
                    <span className="block">{c === 'incognito' ? t('a.incognito') : t(`a.who${c}`)}</span>
                    <span className="block text-[14px] text-muted">{c === 'incognito' ? t('a.incognitoD') : t(`a.who${c}d`)}</span>
                  </span>
                  <span className={cx('grid size-6 place-items-center rounded-full border-2', who === c ? 'border-ink bg-ink text-white' : 'border-fill-strong')}>
                    {who === c && <Icon name="check" size={14} strokeWidth={3} />}
                  </span>
                </button>
              ))}
            </Group>
            {who !== 'incognito' && (
              <Group>
                <Row icon="eyeoff" title={t('a.hideFrom')} value={hiddenFrom.length ? t('a.hiddenCount', { n: hiddenFrom.length }) : undefined} onClick={() => setShowHide((v) => !v)} />
                {showHide &&
                  friends.map((u) => {
                    const on = hiddenFrom.includes(u.id)
                    return (
                      <button key={u.id} type="button" onClick={() => setHiddenFrom((xs) => (on ? xs.filter((x) => x !== u.id) : [...xs, u.id]))} className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left">
                        <Avatar user={u} size={32} />
                        <span className="flex-1">{u.name}</span>
                        {on && <Icon name="eyeoff" className="text-danger" />}
                      </button>
                    )
                  })}
              </Group>
            )}
            <div className="px-4"><Button className="w-full" onClick={publish}>{t('a.publish')}</Button></div>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col gap-4 px-4">
            <div className="card flex flex-col items-center gap-3 p-6 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-ok text-white"><Icon name="check" size={32} strokeWidth={3} /></span>
              <p className="text-[22px] font-bold">{t('a.published')}</p>
              <p className="text-muted">{t('a.shareNow')}</p>
            </div>
            {published && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-[13px] font-bold text-muted">{t('a.preview')}</p>
                <Tile listing={published} t={t} locale={locale} width={180} meta={t('rel.friend')} />
              </div>
            )}
            <Button onClick={() => setShare(true)}><Icon name="share" size={20} /> {t('l.shareTitle')}</Button>
            <Link to={`/l/${publishedId}`} className="text-center text-[17px] text-link">{t('a.view')}</Link>
          </div>
        )}
      </div>
      {share && <ShareSheet text={title} url={listingUrl(publishedId)} t={t} onClose={() => setShare(false)} />}
    </div>
  )
}
