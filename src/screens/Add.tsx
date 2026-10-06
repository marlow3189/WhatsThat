import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../data/store'
import { Button, Field, Group, Header, Input, Notice, Row, ShareSheet, Toggle, cx, inputCls, listingUrl, readPhoto } from '../components/ui'
import { Icon } from '../components/icons'
import { CATEGORIES, categoryById } from '../lib/categories'
import { PLANS, UNITS_BY_KIND } from '../lib/pricing'
import { formatPLN, zl } from '../lib/money'
import type { Circle, Kind, Unit } from '../lib/types'

const KINDS: Kind[] = ['sell', 'rent', 'service', 'give', 'swap', 'garage']
const KIND_ICON: Record<Kind, string> = { sell: 'bag', rent: 'calendar', service: 'hand', give: 'box', swap: 'users', garage: 'house' }

type Step = 'kind' | 'category' | 'details' | 'who' | 'done'

/** Dodawanie w czterech krótkich krokach, zamiast jednego długiego formularza. */
export function Add() {
  const { t, account, canAdd, myActive, limit, buyAnnual, addListing } = useStore()
  const lang = account.lang
  const [step, setStep] = useState<Step>('kind')
  const [kind, setKind] = useState<Kind>('sell')
  const [category, setCategory] = useState('')
  const [sub, setSub] = useState('')
  const [photo, setPhoto] = useState<string>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState<Unit>('fixed')
  const [condition, setCondition] = useState<'new' | 'used'>('used')
  const [deal, setDeal] = useState(false)
  const [stock, setStock] = useState('')
  const [pickupHours, setPickupHours] = useState('')
  const [shipping, setShipping] = useState(false)
  const [deposit, setDeposit] = useState('')
  const [garageDate, setGarageDate] = useState(new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10))
  const [swapFor, setSwapFor] = useState('')
  const [visibility, setVisibility] = useState<Circle>(3)
  const [error, setError] = useState('')
  const [publishedId, setPublishedId] = useState('')
  const [share, setShare] = useState(false)

  const annualPrice = formatPLN(PLANS.annual.yearly)
  const paid = kind === 'sell' || kind === 'rent' || kind === 'service'
  const isFarm = category === 'farm'

  if (step !== 'done' && !canAdd) {
    return (
      <>
        <Header title={t('a.title')} />
        <div className="flex flex-col gap-4 px-4">
          {account.restricted ? (
            <Notice tone="danger">{t('a.restricted')}</Notice>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
              <p className="text-[18px] font-semibold">{t('a.limitTitle', { n: myActive })}</p>
              <p className="text-muted">{t('a.limitText', { n: limit, price: annualPrice })}</p>
              <Button onClick={buyAnnual}>{t('a.buyAnnual', { price: annualPrice })}</Button>
              <Link to="/znajomi" className="text-center text-[15px] text-accent">{t('f.reward')}</Link>
            </div>
          )}
        </div>
      </>
    )
  }

  const chooseKind = (k: Kind) => {
    setKind(k)
    setUnit(UNITS_BY_KIND[k][0])
    if (k === 'garage') {
      setCategory('other')
      setSub('misc')
      setStep('details')
    } else {
      setCategory('')
      setStep('category')
    }
  }

  const chooseCategory = (id: string) => {
    setCategory(id)
    setSub('')
    if (id === 'farm') {
      setUnit('kg')
      setVisibility(3)
    }
  }

  const toWho = () => {
    if (title.trim().length < 3) return setError(t('a.errTitle'))
    if (paid && !(Number(price.replace(',', '.')) > 0)) return setError(t('a.errPrice'))
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
      price: paid ? zl(Number(price.replace(',', '.'))) : undefined,
      unit: paid ? unit : 'fixed',
      condition: kind === 'sell' && !isFarm ? condition : undefined,
      deal: kind === 'sell' && deal ? true : undefined,
      stock: stock ? Number(stock.replace(',', '.')) : undefined,
      pickupHours: pickupHours.trim() || undefined,
      shipping: shipping || undefined,
      deposit: kind === 'rent' && deposit ? zl(Number(deposit.replace(',', '.'))) : undefined,
      garageDate: kind === 'garage' ? garageDate : undefined,
      swapFor: kind === 'swap' ? swapFor.trim() || undefined : undefined,
      photo,
      place: account.place,
      visibility,
    })
    if (id) {
      setPublishedId(id)
      setStep('done')
    }
  }

  const back = { kind: undefined, category: 'kind', details: kind === 'garage' ? 'kind' : 'category', who: 'details', done: undefined }[step] as Step | undefined
  const stepNo = { kind: 1, category: 2, details: 3, who: 4, done: 4 }[step]

  return (
    <>
      <Header
        title={t('a.title')}
        right={step !== 'done' && <span className="tnum pb-1 text-[13px] text-muted">{t('ob.step', { n: stepNo, total: 4 })}</span>}
      />
      <div className="flex flex-col gap-5 pb-6">
        {back && (
          <button type="button" onClick={() => setStep(back)} className="-mt-1 flex items-center gap-1 self-start px-4 text-[15px] text-accent">
            <Icon name="back" size={18} /> {t('back')}
          </button>
        )}

        {step === 'kind' && (
          <Group label={t('a.what')}>
            {KINDS.map((k) => (
              <Row key={k} icon={KIND_ICON[k]} title={t(`kind.${k}`)} detail={t(`kindDesc.${k}`)} onClick={() => chooseKind(k)} />
            ))}
          </Group>
        )}

        {step === 'category' && (
          <>
            <Group label={`${t(`kind.${kind}`)} · ${t('a.category')}`}>
              {CATEGORIES.filter((c) => c.kinds.includes(kind)).map((c) => (
                <Row key={c.id} icon={c.icon} title={c.label[lang]} value={category === c.id ? <Icon name="check" className="text-accent" /> : undefined} chevron={false} onClick={() => chooseCategory(c.id)} />
              ))}
            </Group>
            {category && (
              <div className="flex flex-col gap-3 px-4">
                <div className="flex flex-wrap gap-2">
                  {categoryById(category).subs.map((s) => (
                    <button key={s.id} type="button" onClick={() => setSub(s.id)} aria-pressed={sub === s.id} className={cx('min-h-10 rounded-lg border px-3 text-[14px]', sub === s.id ? 'border-ink bg-ink text-bg' : 'border-line bg-surface')}>
                      {s.label[lang]}
                    </button>
                  ))}
                </div>
                <Button onClick={() => setStep('details')}>{t('next')}</Button>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <div className="flex flex-col gap-4 px-4">
            <label htmlFor="photo" className="grid aspect-[16/9] max-w-full cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-surface text-muted">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1"><Icon name="camera" size={28} /><span className="text-ink">{t('a.photo')}</span></span>}
              <input id="photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) setPhoto(await readPhoto(f))
              }} />
            </label>
            <Field id="title" label={t('a.titleLabel')}>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('a.titlePh')} />
            </Field>
            {paid && (
              <div className="grid grid-cols-[1fr_8.5rem] gap-3">
                <Field id="price" label={t('a.price')}>
                  <div className="relative">
                    <Input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="tnum pr-10" />
                    <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted">zł</span>
                  </div>
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
              <Field id="garageDate" label={t('a.garageDate')}>
                <Input id="garageDate" type="date" value={garageDate} onChange={(e) => setGarageDate(e.target.value)} />
              </Field>
            )}
            {(isFarm || kind === 'garage' || kind === 'give') && (
              <Field id="pickupHours" label={t('a.pickupHours')}>
                <Input id="pickupHours" value={pickupHours} onChange={(e) => setPickupHours(e.target.value)} placeholder={t('a.pickupPh')} />
              </Field>
            )}
            {kind === 'rent' && (
              <Field id="deposit" label={t('a.deposit')} hint={t('a.depositHint')}>
                <Input id="deposit" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="tnum" placeholder="0 zł" />
              </Field>
            )}
            {kind === 'swap' && (
              <Field id="swapFor" label={t('a.swapFor')}>
                <Input id="swapFor" value={swapFor} onChange={(e) => setSwapFor(e.target.value)} />
              </Field>
            )}
            <Field id="description" label={t('a.desc')}>
              <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('a.descPh')} className={cx(inputCls, 'py-3')} />
            </Field>
            {(kind === 'sell' || kind === 'give' || kind === 'swap') && !isFarm && (
              <div className="-mx-4">
                <Group>
                  {kind === 'sell' && <Toggle id="deal" label={t('a.deal')} checked={deal} onChange={setDeal} />}
                  <Toggle id="shipping" label={t('a.shipping')} hint="InPost, Orlen Paczka, DPD Pickup" checked={shipping} onChange={setShipping} />
                </Group>
              </div>
            )}
            {error && <Notice tone="danger">{error}</Notice>}
            <Button onClick={toWho}>{t('next')}</Button>
          </div>
        )}

        {step === 'who' && (
          <>
            <Group label={t('a.who')} footer={t('a.notifyNote')}>
              {([1, 2, 3] as Circle[]).map((c) => (
                <button key={c} type="button" onClick={() => setVisibility(c)} aria-pressed={visibility === c} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-sunken">
                  <span className="min-w-0 flex-1">
                    <span className="block">{t(`a.who${c}`)}</span>
                    <span className="block text-[13px] text-muted">{t(`a.who${c}d`)}</span>
                  </span>
                  <span className={cx('grid size-6 place-items-center rounded-full border-2', visibility === c ? 'border-accent bg-accent text-accent-ink' : 'border-line')}>
                    {visibility === c && <Icon name="check" size={14} strokeWidth={3} />}
                  </span>
                </button>
              ))}
            </Group>
            <div className="px-4"><Button className="w-full" onClick={publish}>{t('a.publish')}</Button></div>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col gap-4 px-4">
            <Notice tone="ok">{t('a.published')}</Notice>
            <p className="text-muted">{t('a.shareNow')}</p>
            <Button onClick={() => setShare(true)}><Icon name="share" size={20} /> {t('l.shareTitle')}</Button>
            <Link to={`/l/${publishedId}`} className="text-center text-[15px] text-accent">{t('a.view')}</Link>
          </div>
        )}
      </div>
      {share && <ShareSheet text={title} url={listingUrl(publishedId)} t={t} onClose={() => setShare(false)} />}
    </>
  )
}
