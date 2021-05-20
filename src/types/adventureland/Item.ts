import { ItemKey, StatType } from './enum'

/**
 * Placeholder item holds slot (and animates) during upgrade, exchange, or compound.
 */
export type Item = {
  acc?: number // ?
  ach?: 'gooped' | string // ?
  b?: boolean // buying
  level?: number
  name: ItemKey
  q?: number // quantity
  p?:
    | {
        // placeholder
        chance: number
        name: ItemKey
        level: number
        scroll: ItemKey
        nums: number[]
      }
    | 'festive'
    | 'glitched'
    | 'shiny'
    | 'superfast'
  rid?: string // anti-theft
  stat_type?: StatType
}

/**
 * Unusual cases seen

pants: { acc: 151969, name: 'wbreeches', level: 7, ach: 'gooped', stat_type: 'int' }

Game_log has shown
- "AP[gooped]: 320,284/60,000,000" fighting cgoo
- "AP[firestarter] 1/20,000" after phoenix kill
AP = achievement points?

**/
