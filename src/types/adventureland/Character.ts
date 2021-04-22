import { BankPackKey, CharacterType, ItemKey } from './enum'
import { Entity } from './Entity'
import { Item } from './Item'

export type CharacterKey = string // no spaces or special characters, also used for display.

/**
 * @see https://github.com/earthiverse/ALClient/blob/master/source/Character.ts
 */
export type Character = Entity & {
  bank: { [T in Exclude<BankPackKey, 'gold'>]: Item[] } & { gold: number }
  // channeling actions
  c: {
    town?: { ms: number }
  }
  ctype: CharacterType // e.g. "merchant"
  items: Item[] // aka "inventory"
  gold: number // in inventory
  goldm: number // gold multiplier
  luckm: number // luck multiplier
  ping: number
  // queued actions
  q: {
    // len = total ms; ms = ms remaining; num = to slot; nums = from slots
    compound?: { len: number; ms: number; num: number; nums: number[] }
    upgrade?: { len: number; ms: number; num: number }
    exchange?: { id: ItemKey; len: number; ms: number; name: ItemKey; num: number; q: number }
  }
  range: number
  speed: number
  // A bit of extra range that we can use to attack further monsters. It's variable.
  // If you attack a monster using this extra range, it decreases for the next attack.
  xrange: number
}
