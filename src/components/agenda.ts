import { useMemo } from 'react'
import { useStore } from '../data/store'
import { agenda, type AgendaItem } from '../lib/calendar'
import { useCouncil } from '../lib/council'
import { ME } from '../data/seed'

/** Zbiera pozycje kalendarza z całej aplikacji (Twoje terminy, „Będę”, wynajem, śmieci, koniec planu). */
export function useAgenda(): AgendaItem[] {
  const { t, account, listings, orders } = useStore()
  const council = useCouncil(account.place, { org: t('org.demoName', { town: account.place.town }), notice: t('org.demoNotice') })
  return useMemo(
    () =>
      agenda({
        entries: account.calendar ?? [],
        listings,
        orders,
        me: ME,
        pickups: council.pickups,
        planUntil: account.plan !== 'free' ? account.planUntil : undefined,
        label: {
          waste: (what) => `${t('cal.src.waste')}: ${what}`,
          pickupOf: (title) => t('cal.pickupOf', { title }),
          returnOf: (title) => t('cal.returnOf', { title }),
          planEnds: t('cal.planEnds'),
          wasteName: (f) => (['paper', 'plastic', 'mixed'].includes(f) ? t(`waste.${f as 'paper' | 'plastic' | 'mixed'}`) : f),
        },
      }),
    [account.calendar, account.plan, account.planUntil, listings, orders, council.pickups, t],
  )
}

