import { IPosition, PositionMovable, PositionReal, PositionSmart } from 'alclient'
import { Character, CharacterKey } from './Character'
import { Chest } from './Chest'
import { DoorInfo } from './DoorInfo'
import { Entity } from './Entity'
import {
  BankPackKey,
  CharacterType,
  ConditionType,
  DamageType,
  EquipSlot,
  ItemKey,
  MapName,
  MonsterType,
  NPCRole,
  NPCType,
  ServerIdentifier,
  ServerRegion,
  SkillKey,
  StatType,
  TradeSlot,
  WeaponType,
} from './enum'
import { GItem, GMapsNPC, GMonster } from './game'
import { ItemInfo } from './ItemInfo'
import { StatSet } from './StatSet'

declare global {
  interface Window {
    close_merchant()
    distance(from: IPosition | PositionReal, to: IPosition | PositionReal): number
    exchange(slot: number)
    open_merchant(slot: number)

    character: Character
    chests: { [id: string]: Chest }
    classes: {
      [T in CharacterType]: {
        armor: number
        attack: number
        base_slots: unknown // starting kit. don't care.
        brave: boolean
        courage: number
        damage_type: DamageType
        description: string
        doublehand: {
          [T in WeaponType]: StatSet
        }
        frequency: number
        hp: number
        looks: unknown // appearance
        lstats: StatSet
        main_stat: StatType
        mainhand: {
          [T in WeaponType]: StatSet
        }
        mcourage: number
        mp: number
        mp_cost: number
        offhand: {
          [T in WeaponType]: StatSet
        }
        pcourage: number
        projectile: 'momentum' | string
        range: number
        resistance: number
        side_stat?: StatType
        speed: number
        stats: StatSet
        xcx: unknown // appearance
      }
    }
    entities: {
      [id: string]: Entity
    }
    next_skill: {
      [T in SkillKey]?: Date
    }
    npcs: GMapsNPC[]
    party: {
      [T in CharacterKey]?: IPosition & {
        level: number
        share: number // of party loot
        type: CharacterType
      }
    }
    party_list: CharacterKey[]
    pings: number[] // last 40 response times
    server_identifier: ServerIdentifier
    server_region: ServerRegion
    socket: SocketIOClient.Socket
    S: {
      [T in MonsterType]?: IPosition & {
        map: string
        live: boolean
        hp: number
        max_hp: number
        target?: CharacterKey
      }
    } & {
      valentines?: boolean
    }
  }

  /**
   * [0]: The map where you can access this bank pack
   * [1]: The cost to unlock this bank pack if you buy with gold
   * [2]: The cost to unlock this bank pack if you buy with shells
   */
  const bank_packs: {
    [T in BankPackKey]: [MapName, number, number]
  }

  const character: {
    /**
     * @see http://adventure.land/docs/code/character/events
     */
    on(event: string, callback?: (data: any) => void): void
  }

  const game: {
    /**
     * @see http://adventure.land/docs/code/game/events
     */
    on(event: string, callback?: (data: any) => void): void
  }

  function accept_magiport(from: CharacterKey): void
  function accept_party_invite(from: CharacterKey): void // you join them
  function accept_party_request(from: CharacterKey): void // they join you
  function activate(slot: number): void // e.g. elixirs
  function attack(mob: Entity): Promise<unknown>
  /**
   * Crafts the given item if you can craft that item, you have the required items, and you have enough gold.
   * @param key of G.craft
   * @return A string containing the basic reason it failed, or nothing upon success
   */
  function auto_craft(key: ItemKey): string | void
  function bank_deposit(amount: number): void // must be in bank
  /**
   * @param slot source index in your inventory
   * @param pack destination bank pack
   * @param packSlot index in destination bank pack, defaults to first available
   */
  function bank_store(slot: number, pack?: BankPackKey, packSlot?: number): void
  function bank_withdraw(amount: number): void // from character.bank.gold. must be in bank.
  /**
   * @param key of G.items
   * @param quantity default 1
   */
  function buy(key: ItemKey, quantity?: number): Promise<unknown>
  function buy_with_gold(key: ItemKey, quantity?: number): Promise<unknown>
  function buy_with_shells(key: ItemKey, quantity?: number): Promise<unknown>
  /**
   * If you can attack a target, considering status conditions such as `rip` and `stunned`.
   * NOTE: If you just want to check the cooldown, consider using `is_on_cooldown("attack")`
   * @param mob of parent.entities
   */
  function can_attack(mob: Entity): boolean
  function can_heal(mob: Entity): boolean
  /**
   * Checks if the you can move from `[position.x, position.y] to [position.going_x, position.going_y]
   * @param entity The position you want to check is movable
   * @returns TRUE if you can move there, FALSE otherwise
   */
  function can_move(position: PositionMovable & { base: any }): boolean
  /**
   * Checks if you can move your character to the given destination on your current map
   * @param destination A position object containing the destination coordinates
   * @returns TRUE if you can move there, FALSE otherwise
   */
  function can_move_to(destination: { real_x: number; real_y: number }): boolean
  /**
   * Checks if you can move your character to the given destination on your current map
   * @param x The x-coordinate that you want to move to
   * @param y The y-coordinate that you want to move to
   * @returns TRUE if you can move there, FALSE otherwise
   */
  function can_move_to(x: number, y: number): boolean
  /**
   * Checks if the given entity can transport. If given your own character, it will also check if you are already transporting
   * @param entity The entity to check
   * @returns TRUE if you are not currently transporting, and can transport, FALSE otherwise
   */
  function can_transport(entity: Entity): boolean
  /**
   * Checks if the skill is usable by the given character. Also checks if the given skill is on cooldown.
   * @param skill The skill to check
   * @param returns TRUE if not on cooldown, FALSE otherwise.
   */
  function can_use(skill: SkillKey): boolean
  /**
   * Checks if you can use the given door from the given position
   * @param map A given map (from `G.maps`)
   * @param door The given door (from `G.maps[map].doors`)
   * @param x The x position on the map
   * @param y The y position on the map
   * @returns TRUE if the door can be used from the given position, FALSE otherwise
   */
  function can_use_door(map: MapName, door: DoorInfo, x: number, y: number): boolean
  /**
   * Checks if the given entity can walk (i.e. move). If given your own character, it will also check if you are already transporting.
   * @param entity The entity to check
   * @returns TRUE if you are not currently transporting, and can walk, FALSE otherwise
   */
  function can_walk(entity: Entity): boolean
  /**
   * Changes servers. This will reload the page (the URL will change to match the server given), which means your code will also reload.
   * @param region The region to change to (e.g. ASIA)
   * @param identifier The server identifier to change to (e.g. PVP)
   */
  function change_server(region: ServerRegion, identifier: ServerIdentifier): void
  /**
   * Changes the target of the player. Use in association with `get_targeted_monster()`.
   * @param target A given target (from `parent.entities`)
   * @param public If true, it will send the new target to the server.
   */
  function change_target(target: Entity, public: boolean): void
  /**
   * Clears all drawings from the window. Use this function to clean up `draw_circle` and `draw_line`.
   */
  function clear_drawings(): void
  /**
   * @param snippet to execute
   */
  function command_character(characterKey: CharacterKey, snippet: string): void
  /**
   * Compounds the three items for a chance at obtaining 1 higher level item of the same kind.
   * @param item1 The inventory position of the first item
   * @param item2 The inventory position of the second item
   * @param item3 The inventory position of the third item
   * @param scroll The inventory position of the scroll to use to combine the three items
   * @param offering The inventory position of the offering (e.g. Primordial Essence) to use
   */
  function compound(
    item1: number,
    item2: number,
    item3: number,
    scroll: number,
    offering?: number
  ): Promise<unknown>
  /**
   * Consumes the given item (e.g. Candy Pop)
   * @param item The inventory position of the item
   */
  function consume(item: number): void
  /**
   * Crafts the given items. Note: Some recipes might require gold to craft, too.
   * @param item0 The inventory position of the item to be put in the top left crafting slot
   * @param item1 The inventory position of the item to be put in the top middle crafting slot
   * @param item2 The inventory position of the item to be put in the top right crafting slot
   * @param item3 The inventory position of the item to be put in the center left crafting slot
   * @param item4 The inventory position of the item to be put in the center middle crafting slot
   * @param item5 The inventory position of the item to be put in the center right crafting slot
   * @param item6 The inventory position of the item to be put in the bottom left crafting slot
   * @param item7 The inventory position of the item to be put in the bottom middle crafting slot
   * @param item8 The inventory position of the item to be put in the bottom right crafting slot
   */
  function craft(
    item0: number,
    item1?: number,
    item2?: number,
    item3?: number,
    item4?: number,
    item5?: number,
    item6?: number,
    item7?: number,
    item8?: number
  ): void
  /**
   * Overrides the character to walk at `Math.min(parent.character.speed, cruise_speed)` speed.
   * @param speed The speed at which to walk at
   */
  function cruise(speed: number): void
  /** Feed this function a value like (character.apiercing - target.armor) and it spits out a multiplier so you can adjust your expected damage */
  function damage_multiplier(difference: number): number
  function distance(from: IPosition | PositionReal, to: IPosition | PositionReal): number
  /** Draws a circle on the map */
  function draw_circle(x: number, y: number, radius: number, size: number, color: number)
  function equip(inventoryPostion: number, slot?: EquipSlot)
  function exchange(inventoryPosition: number)
  function game_log(message: string, color?: string)
  function get_targeted_monster(): Entity
  function heal(target: Entity)
  /** Checks whether or not we can attack other players */
  function is_pvp(): boolean
  function is_transporting(entity: Entity): boolean
  /** 0 = normal, 1 = high, 2 = rare */
  function item_grade(item: ItemInfo): -1 | 0 | 1 | 2
  /** Returns the inventory position of the item, or -1 if it's not found */
  function locate_item(item: ItemKey): number
  /**
   * If no ID is given, it will loot some chests.
   * @param id The ID of a chest (from `parent.chests`)
   */
  function loot(id?: string): void
  /**
   * The promise returned is not upon arrival at the destination, it's upon the server confirming it recieved your request.
   * @param x
   * @param y
   */
  function move(x: number, y: number): Promise<void>
  function reduce_cooldown(skill: SkillKey, ms: number): void
  function respawn()
  /** Quantity defaults to 1 if not set */
  function sell(inventoryPostion: number, quantity?: number)
  function send_cm(to: string, data: any)
  function send_gold(to: string, amount: number)
  function send_item(to: string, inventoryPostion: number, quantity?: number)
  function send_local_cm(to: string, data: any)
  /** If isRequest is set to true, it will send a party request */
  function send_party_invite(name: string, isRequest?: boolean)
  function send_party_request(name: string)
  function set_message(text: string, color?: string)
  function simple_distance(from: IPosition | PositionReal, to: IPosition | PositionReal): number
  function smart_move(destination: IPosition | MapName | MonsterType, callback?: () => void)
  function start_character(name: string, codeName?: string)
  function stop(action?: string)
  function stop_character(name: string)
  /** Swap the position of two items in the player's inventory */
  function swap(index1: number, index2: number)
  /** For buying things off players' merchants */
  function trade_buy(target: Entity, trade_slot: number)
  function transport(map: MapName, spawn?: number)
  function unequip(slot: EquipSlot | TradeSlot)
  function upgrade(
    itemInventoryPosition: number,
    scrollInventoryPosition: number,
    offeringInventoryPosition?: number
  ): Promise<any>
  function use_skill(name: '3shot' | '5shot', targets: Entity[]): Promise<any>[]
  /** For destination, it's an array of [x, y] */
  function use_skill(name: 'blink', destination: [number, number])
  /** The string is the ID of the target, the number is how much mana to spend on the attack */
  function use_skill(name: 'cburst', targets: [string, number][]): Promise<any>
  function use_skill(name: 'energize', target: Entity, mp: number): Promise<any>
  function use_skill(name: 'magiport', target: string): Promise<any>
  function use_skill(name: 'throw', target: Entity, inventoryPostion: number): Promise<any>
  function use_skill(name: 'town'): Promise<any>
  function use_skill(name: SkillKey, target?: Entity, extraArg?: any): Promise<any>
  function trade(
    inventoryPosition: number,
    tradeSlot: number | TradeSlot,
    price: number,
    quantity: number
  ): void
  /** This function uses move() if it can, otherwise it uses smart_move() */
  function xmove(x: number, y: number)

  /** Contains information about smart_move() */
  let smart: IPosition & {
    /** If searching and false, we are still searching. If  */
    found: boolean
    /** If .moving == true, we are moving or searching */
    moving: boolean
    plot: PositionSmart[]
    /** If ().moving == false && .searching == true), we are searching for a path. */
    searching: boolean
    start_x: number
    start_y: number
    /** A settable flag. If true, smart_move will use town teleports to move around */
    use_town: boolean
  }

  let G: {
    base_gold: {
      [T in MonsterType]?: {
        /** The base amount of gold this monster drops if you kill it in the given map */
        [T in MapName]?: number
      }
    }
    classes: {
      [T in CharacterType]: {
        damage_type: DamageType
        /** A list of items that the character can equip using both hands */
        doublehand: {
          [T in WeaponType]?: {
            /** Modifier on the given stat for equipping this type of item */
            [T in StatType]?: number
          }
        }
        /** A list of items that the character can equip in its mainhand */
        mainhand: {
          [T in WeaponType]?: {
            /** Modifier on the given stat for equipping this type of item */
            [T in StatType]?: number
          }
        }
        /** A list of items that the character can equip in its offhand */
        offhand: {
          [T in WeaponType]?: {
            /** Modifier on the given stat for equipping this type of item */
            [T in StatType]?: number
          }
        }
      }
    }
    conditions: {
      [T in ConditionType]: {
        /** Indicates whether the condition is a penalty or not */
        bad: boolean
        buff: boolean
        /** The length the condition lasts in ms */
        duration: number
      } & {
        [T in StatType]?: number
      }
    }
    dismantle: {
      [T in ItemKey]?: {
        /** The cost of dismantling the item */
        cost: number
        /** A list of items you will get if you dismantle. If the number is < 1, it indicates the probability of getting that item. */
        items: [number, ItemKey][]
      }
    }
    items: { [T in ItemKey]: GItem }
    geometry: {
      [T in MapName]: {
        max_x: number
        max_y: number
        min_x: number
        min_y: number
        /* The line is from ([0], [1]) to ([0], [2]) */
        x_lines: [number, number, number][]
        /* The line is from ([1], [0]) to ([2], [0]) */
        y_lines: [number, number, number][]
      }
    }
    maps: {
      [T in MapName]: {
        doors: DoorInfo[]
        /** The name of the map, if this changes, the map layout probably changed. */
        key: string
        ignore?: boolean
        instance?: boolean
        irregular?: boolean
        monsters: {
          count: number
          boundary?: [number, number, number, number]
          boundaries?: [MapName, number, number, number, number][]
          type: MonsterType
        }[]
        /** Not sure what this means. Might mean that only one character of the players can be here at a time. */
        mount: boolean
        no_bounds?: boolean
        npcs: GMapsNPC[]
        on_death: number
        ref: {
          [id: string]: IPosition & {
            map: MapName
            in: MapName
            id: string
          }
        }
        /**
         * [0]: x position where you spawn
         * [1]: y position where you spawn
         * [2]: Direction to face the character when you spawn
         */
        spawns: [number, number, number?][]
      }
    }
    monsters: { [T in MonsterType]: GMonster }
    npcs: {
      [T in NPCType]: {
        id: NPCType
        /** Full name of NPC */
        name: string
        /** A list of places you can transport to with this NPC. The number is the spawn */
        places?: {
          [T in MapName]?: number
        }
        role: NPCRole
      }
    }
    // TODO: Get list of quest names
    quests: {
      [T in string]: PositionReal & {
        id: NPCType
      }
    }
    skills: {
      [T in SkillKey]: {
        apiercing?: number
        class?: CharacterType[]
        cooldown: number
        cooldown_multiplier?: number
        damage_multiplier?: number
        level?: number
        /** Can we use this skill on monsters? */
        monster?: boolean
        /** MP Cost for skill */
        mp?: number
        /** The name of the skill */
        name: string
        range?: number
        range_multiplier?: number
        /** For MP use skills on the mage, 1 mp will equal this much damage */
        ratio?: number
        /** The cooldown this skill shares with another skill */
        share?: SkillKey
        /** The item(s) required to use this skill */
        slot?: [EquipSlot, ItemKey][]
        /** Does this skill require a single target? (Don't use an array) */
        target?: boolean
        /** Does this skill require multiple targets? (Use an array) */
        targets?: boolean
        /** The weapon type needed to use this skill */
        wtype?: WeaponType | WeaponType[]
      }
    }
  }
}
