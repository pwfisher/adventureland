import {
  BankPackKey,
  CharacterKey,
  Entity,
  EntityKey,
  Item,
  MonsterType,
  NPCType,
  PositionRealm,
  ServerKey,
} from './adventureland'
import { Dictionary } from './utility'

export * from './adventureland'
export * from './utility'

export type Bag = Item[]
export type BagItem = Partial<Item> & { bag: BagKey; slot: number }
export type BagKey = 'inventory' | Exclude<BankPackKey, 'gold'>
export type KitePath = { x: number; y: number }[]
export type MobPriority = { key: EntityKey; priority: number }
export type MobSpawn = PositionRealm & { monsterType: MonsterType }
export type MonsterMap = Dictionary<
  ServerKey,
  Dictionary<MonsterType, PositionRealm & { key: EntityKey; lastSeen: Date }>
>
export type NPCMap = Dictionary<ServerKey, Dictionary<NPCType, PositionRealm & { lastSeen: Date }>>
export type PlayerMap = Dictionary<
  CharacterKey,
  PositionRealm & Partial<Entity> & { lastSeen: Date }
>
export type Radar = { mob: Entity; range: number }[]
