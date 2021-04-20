import { ItemInfo, MonsterName, PositionReal, Entity, NPCName, StatusInfo, BankPackType, ItemName, CharacterType, NPCType } from './adventurelandl

export type MovementTarget = {
  key?: MonsterName | NPCType | CharacterType
  position?: PositionReal
  range?: number
}

export type MonsterSpawnPosition = PositionReal & {
  monster: MonsterName
}

export type EmptyBankSlots = {
  pack: Exclude<BankPackType, 'gold'>
  index: number
}

export type PriorityEntity = {
  id: string
  priority: number
}

export type MonstersInfo = {
  [T in MonsterName]?: PositionReal & {
    id: string
    lastSeen: Date
  }
}

export type NPCInfo = {
    [T in NPCName]?: PositionReal & {
        lastSeen: Date;
    }
}

export type PartyInfo = {
    [T in string]?: PositionReal & {
        lastSeen: Date;
        shouldSwitchServer: boolean;
        monsterHuntTargets: MonsterName[];
        items: InventoryItem[];
        goldm: number;
        last_ms: Date;
        luckm: number;
        attack: number;
        frequency: number;
        s: StatusInfo;
    }
}

export type PlayersInfo = {
    [T in string]?: Partial<Entity> & PositionReal & {
        lastSeen: Date;
    }
}

export type ItemLevelMap = { [T in ItemName]?: number }

export type InventoryItem = ItemInfo & { index: number }

export type BankItemInfo = InventoryItem & { pack: BankPackType | 'items' }
