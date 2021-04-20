import {
  BankPackKey,
  CharacterKey,
  CharacterType,
  Entity,
  EntityKey,
  ItemInfo,
  ItemKey,
  MonsterType,
  NPCType,
  PositionRealm,
  ServerKey,
  StatusInfo,
} from './adventureland'

export type BagItem = ItemInfo & { bag: BankPackKey | 'inventory'; slot: number }
export type BagSlot = { bag: Exclude<BankPackKey, 'gold'> | 'inventory'; slot: number }
export type ItemLevelMap = { [T in ItemKey]?: number }
export type MobPriority = { key: EntityKey; priority: number }
export type MobSpawn = PositionReal & { monsterType: MonsterType }
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
