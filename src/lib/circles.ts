import type { Circle, User } from './types'

export interface Relation {
  circle: Circle
  /** wspólni znajomi, przez których znasz osobę z kręgu 2 */
  via: string[]
}

/**
 * Krąg osoby względem mnie, liczony z grafu znajomości (wzajemne kontakty w telefonach):
 * 1 = bezpośredni znajomy, 2 = znajomy znajomego, 3 = wszyscy inni.
 */
export function relationTo(meId: string, otherId: string, users: Record<string, User>): Relation {
  if (meId === otherId) return { circle: 1, via: [] }
  const me = users[meId]
  if (!me) return { circle: 3, via: [] }
  if (me.friends.includes(otherId)) return { circle: 1, via: [] }
  const via = me.friends.filter((f) => users[f]?.friends.includes(otherId))
  return via.length ? { circle: 2, via } : { circle: 3, via: [] }
}

/** Ogłoszenie widać, jeśli mój krąg względem właściciela mieści się w jego zasięgu. */
export const canSee = (viewerCircle: Circle, visibility: Circle) => viewerCircle <= visibility
