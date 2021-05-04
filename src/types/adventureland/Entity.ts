import { StatusInfo } from 'alclient'
import {
  CharacterType,
  DamageType,
  EquipSlot,
  MonsterType,
  NPCName,
  NPCType,
  TradeSlot,
} from './enum'
import { Item } from './Item'
import { CharacterKey } from './Character'
import { PositionRealm } from './PositionRealm'

export type EntityKey = string // in parent.entities
export type EntityType = 'character' | 'monster'

export type Entity = PositionRealm & {
  '1hp': number // if set, attacks only do 1 damage
  'aggro'?: number // monster will start shit
  'apiercing': number // armor piercing
  'armor': number
  'attack': number
  'base': { h: number; v: number; vn: number }
  'cooperative': boolean
  'ctype': CharacterType | NPCType
  'damage_type'?: DamageType
  'evasion': number // chance to avoid physical attacks
  'frequency': number // attacks per second?
  'hp': number
  'id': EntityKey // parent.entities[id]
  'immune': boolean
  'last_ms': Date // last update time
  'level': number
  'max_hp': number
  'max_mp': number
  'moving': boolean
  'mp': number
  'mp_cost': number // of an attack
  'mtype'?: MonsterType
  'name': string // display name
  'npc'?: NPCName
  'range': number
  'resistance': number
  'rip'?: boolean // player is dead
  'rpiercing': number
  's': StatusInfo
  'speed': number
  'standed'?: unknown // merchant open
  'stoned'?: boolean
  'target'?: CharacterKey | NPCName | EntityKey
  'type': EntityType
  'vx': number
  'vy': number
}
