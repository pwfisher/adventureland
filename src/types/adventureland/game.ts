import { DamageType, ItemKey, ItemType, NPCType, WeaponType } from './enum'
import { StatSet } from './StatSet'

export type GItem = {
  buy?: boolean
  compound?: StatSet // bonus per compound level, undefined if not compoundable. TODO `isCompoundable({ compound: {} }) === false`?)
  damage?: DamageType
  e?: number // quantity required for exchange, undefined if not exchangeable
  g: number // vendor gold value
  grades?: [number, number, number, number] // levels at which item reaches grades high, rare, legendary, exalted
  id: ItemKey
  name: string // display name
  quest: string
  s?: number // stack limit, undefined if not stackable
  type: ItemType
  upgrade?: StatSet // bonus per upgrade level, undefined if not upgradeable
  wtype: WeaponType
} & StatSet

export type GMapsNPC = {
  id: NPCType
  name?: string // display name
  positions: [number, number]
}

export type GMonster = {
  attack: number
  damage_type: DamageType
  frequency: number
  hp: number
  range: number
  /**
   * Respawn time in seconds. Can be -1 (e.g. goldenbat), which means it's special.
   * For >200 second respawn monsters, the variance is from 0.6 to 2.2 of their base time.
   * @see https://discordapp.com/channels/238332476743745536/238332476743745536/729997473484898327
   */
  respawn: number
  speed: number
  xp: number
}
