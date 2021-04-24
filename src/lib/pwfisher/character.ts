import { Character } from '../../types'

export const isMeleeType = (c: Character) => ['Paladin', 'Rogue', 'Warrior'].includes(c.ctype)
