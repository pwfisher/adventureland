import { ItemKey, StatType } from './enum'

/**
 * Placeholder item holds slot (and animates) during upgrade, exchange, or compound.
 */
export type Item = {
  b?: boolean // buying
  level?: number
  name: ItemKey
  q?: number // quantity
  p?: // placeholder
    | {
        chance: number
        name: ItemKey
        level: number
        scroll: ItemKey
        nums: number[]
      }
    | 'shiny'
    | 'glitched'
    | 'superfast'
  rid?: string // anti-theft
  stat_type?: StatType
}
