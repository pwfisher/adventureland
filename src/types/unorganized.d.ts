import {
  BankPackKey,
  CharacterKey,
  Entity,
  EntityKey,
  Item,
  ItemKey,
  MonsterType,
  NPCType,
  PositionRealm,
  ServerKey,
} from './adventureland'
import { Point } from '../lib/math'

export type BagItem = { item: Item } & BagSlot
export type BagKey = 'inventory' | Exclude<BankPackKey, 'gold'>
export type BagSlot = { bag: BagKey; slot: number }
export type ItemLevelMap = { [T in ItemKey]?: number }
export type KitePath = Point[]
export type MobPriority = { key: EntityKey; priority: number }
export type MobSpawn = PositionRealm & { monsterType: MonsterType }
export type MonsterMap = {
  [T in ServerKey]?: {
    [T in MonsterType]?: PositionRealm & { key: EntityKey; lastSeen: Date }
  }
}
export type NPCMap = {
  [T in ServerKey]?: {
    [T in NPCType]?: PositionRealm & { lastSeen: Date }
  }
}
export type PlayerMap = {
  [T in CharacterKey]?: PositionRealm & Partial<Entity> & { lastSeen: Date }
}
export type Radar = { mob: Entity; range: number }[]
