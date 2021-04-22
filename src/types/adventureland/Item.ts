import { ItemKey, StatType } from './enum'

export type Item = {
  b?: boolean // is buying
  level?: number
  name: ItemKey
  q?: number // quantity
  p?:
    | {
        // placeholder (during upgrade, exchange, or compound, right?)
        chance: number
        name: ItemKey
        level: number
        scroll: ItemKey
        nums: number[]
      }
    | 'shiny'
    | 'glitched'
    | 'superfast'
  rid?: string // anti-theft sale id
  stat_type?: StatType
}
