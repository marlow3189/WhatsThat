import type { Circle, User } from './types'

export interface Relation {
  circle: Circle
  /** wspólni znajomi, przez których widzisz osobę z kręgu 2 */
  via: string[]
}

/**
 * Krąg osoby względem mnie, liczony z grafu znajomości (kontakty z telefonu):
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

/** Prosty wskaźnik zaufania 0–100: weryfikacja, opinie, wspólni znajomi. */
export function trustScore(user: User, relation: Relation): number {
  let score = 30
  if (user.verified) score += 25
  score += Math.min(25, user.reviews * 2) * (user.rating / 5)
  if (relation.circle === 1) score += 20
  else if (relation.circle === 2) score += Math.min(20, relation.via.length * 8)
  return Math.round(Math.min(100, score))
}

export const CIRCLE_LABEL: Record<Circle, string> = {
  1: 'Znajomi',
  2: 'Znajomi znajomych',
  3: 'Market',
}
