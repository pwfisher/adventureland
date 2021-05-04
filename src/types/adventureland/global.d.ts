import { IPosition, PositionMovable, PositionReal, PositionSmart } from 'alclient'
import * as PIXI from 'pixi.js'
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
  MapKey,
  MonsterType,
  NPCRole,
  NPCType,
  ServerIdentifier,
  ServerRegion,
  SkillKey,
  SkillType,
  SkinKey,
  StatType,
  TradeSlot,
  WeaponType,
} from './enum'
import { GItem, GMapsNPC, GMonster } from './game'
import { Item } from './Item'
import { StatSet } from './StatSet'

declare global {
  interface Window {
    character_code_eval(name: CharacterKey, snippet: string): void
    close_merchant(): void
    distance(from: IPosition | PositionReal, to: IPosition | PositionReal): number
    exchange(slot: number): void
    open_merchant(slot: number): void

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
    [T in BankPackKey]: [MapKey, number, number]
  }

  const character: Character & {
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
   * @returns true if you can move there, false otherwise
   */
  function can_move(position: PositionMovable & { base: any }): boolean
  /**
   * Checks if you can move your character to the given destination on your current map
   * @param destination A position object containing the destination coordinates
   * @returns true if you can move there, false otherwise
   */
  function can_move_to(destination: { real_x: number; real_y: number }): boolean
  /**
   * Checks if you can move your character to the given destination on your current map
   * @param x The x-coordinate that you want to move to
   * @param y The y-coordinate that you want to move to
   * @returns true if you can move there, false otherwise
   */
  function can_move_to(x: number, y: number): boolean
  /**
   * Checks if the given entity can transport. If given your own character, it will also check if you are already transporting
   * @param entity The entity to check
   * @returns true if you are not currently transporting, and can transport, false otherwise
   */
  function can_transport(entity: Entity): boolean
  /**
   * Checks if the skill is usable by the given character. Also checks if the given skill is on cooldown.
   * @param skill The skill to check
   * @param returns true if not on cooldown, false otherwise.
   */
  function can_use(skill: SkillKey): boolean
  /**
   * Checks if you can use the given door from the given position
   * @param mapKey of G.maps
   * @param doorInfo of given map, G.maps[map].doors
   * @param x The x position on the map
   * @param y The y position on the map
   * @returns true if the door can be used from the given position, false otherwise
   */
  function can_use_door(mapKey: MapKey, doorInfo: DoorInfo, x: number, y: number): boolean
  /**
   * Checks if the given entity can walk (i.e. move). If given your own character, it will also check if you are already transporting.
   * @param entity The entity to check
   * @returns true if you are not currently transporting, and can walk, false otherwise
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
  function draw_circle(
    x: number,
    y: number,
    radius: number,
    size: number,
    color: number
  ): PIXI.Graphics | void
  function equip(inventoryPostion: number, slot?: EquipSlot): unknown
  function exchange(inventoryPosition: number): unknown
  function game_log(message: string, color?: string): unknown
  function get(key: string): Object | string | null
  function get_player(name: CharacterKey): Character
  function get_targeted_monster(): Entity
  function heal(target: Entity): unknown
  /** Checks whether or not we can attack other players */
  function is_pvp(): boolean
  function is_transporting(entity: Entity): boolean
  /** 0 = normal, 1 = high, 2 = rare */
  function item_grade(item: Item): -1 | 0 | 1 | 2
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
  function on_party_invite(name: CharacterKey): unknown
  function reduce_cooldown(skill: SkillKey, ms: number): void
  function respawn(): unknown
  /** Quantity defaults to 1 if not set */
  function sell(inventoryPostion: number, quantity?: number): unknown
  function send_cm(to: CharacterKey, data: any): unknown
  function send_gold(to: CharacterKey, amount: number): unknown
  function send_item(to: CharacterKey, inventoryPostion: number, quantity?: number): unknown
  function send_local_cm(to: CharacterKey, data: any): unknown
  /** If isRequest is set to true, it will send a party request */
  function send_party_invite(name: CharacterKey, isRequest?: boolean): unknown
  function send_party_request(name: CharacterKey): unknown
  function set_message(text: string, color?: string): unknown
  function simple_distance(from: IPosition | PositionReal, to: IPosition | PositionReal): number
  function smart_move(destination: IPosition | MapKey | MonsterType, callback?: () => void): unknown
  function start_character(name: CharacterKey, codeName?: string): unknown
  function stop(action?: string): unknown
  function stop_character(name: CharacterKey): unknown
  function swap(slotA: number, slotB: number): unknown // inventory
  function trade_buy(target: Entity, trade_slot: number): unknown // player merchant
  function transport(map: MapKey, spawn?: number): unknown
  function unequip(slot: EquipSlot | TradeSlot): unknown
  function upgrade(
    itemInventoryPosition: number,
    scrollInventoryPosition: number,
    offeringInventoryPosition?: number
  ): Promise<unknown>
  function use_skill(name: '3shot' | '5shot', targets: Entity[]): Promise<unknown>[]
  function use_skill(name: 'blink', destination: [number, number]): unknown // destination: [x, y]
  /** The string is the ID of the target, the number is how much mana to spend on the attack */
  function use_skill(name: 'cburst', targets: [string, number][]): Promise<unknown>
  function use_skill(name: 'energize', target: Entity, mp: number): Promise<unknown>
  function use_skill(name: 'magiport', target: string): Promise<unknown>
  function use_skill(name: 'throw', target: Entity, inventoryPostion: number): Promise<unknown>
  function use_skill(name: 'town'): Promise<unknown>
  function use_skill(name: SkillKey, target?: Entity, extraArg?: any): Promise<unknown>
  function trade(
    inventoryPosition: number,
    tradeSlot: number | TradeSlot,
    price: number,
    quantity: number
  ): void
  /** This function uses move() if it can, otherwise it uses smart_move() */
  function xmove(x: number, y: number): unknown

  /** Contains information about smart_move() */
  let smart: IPosition & {
    /** If searching and false, we are still searching. */
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
    /** The base amount of gold this monster drops if you kill it in the given map */
    base_gold: { [T in MonsterType]?: { [T in MapKey]?: number } }
    classes: {
      [T in CharacterType]: {
        damage_type: DamageType
        /** Modifier on the given stat for equipping this type of item */
        doublehand: { [T in WeaponType]?: StatSet }
        mainhand: { [T in WeaponType]?: StatSet }
        offhand: { [T in WeaponType]?: StatSet }
      }
    }
    conditions: {
      [T in ConditionType]: StatSet & {
        bad: boolean // is a penalty
        buff: boolean
        duration: number // in ms
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
      [T in MapKey]: {
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
      [T in MapKey]: {
        doors: DoorInfo[]
        key: string // The name of the map, if this changes, the map layout probably changed.
        ignore?: boolean
        instance?: boolean
        irregular?: boolean
        monsters: {
          count: number
          boundary?: [number, number, number, number]
          boundaries?: [MapKey, number, number, number, number][]
          type: MonsterType
        }[]
        mount: boolean // ?
        no_bounds?: boolean
        npcs: GMapsNPC[]
        on_death: number
        ref: {
          [id: string]: IPosition & {
            map: MapKey
            in: MapKey
            id: string
          }
        }
        spawns: [number, number, number?][] // [x, y, dir], dir is direction entity faces
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
          [T in MapKey]?: number
        }
        role: NPCRole
      }
    }
    quests: {
      [T in string]: PositionReal & {
        id: NPCType
      }
    }
    skills: {
      [T in SkillKey]: {
        apiercing?: number
        class?: CharacterType[]
        consume: ItemKey
        cooldown: number
        cooldown_multiplier?: number
        damage_multiplier?: number
        explanation: string
        hostile: boolean // ?
        level?: number // character level required
        monster?: boolean // usable on monster
        mp?: number // mana cost
        name: string
        range?: number
        range_multiplier?: number
        ratio?: number // e.g. damage per mp
        share?: SkillKey // cooldown key
        skin: SkinKey
        slot?: [EquipSlot, ItemKey][] // equipment required
        target?: boolean // takes single target
        targets?: boolean // takes array of targets
        type: SkillType
        wtype?: WeaponType | WeaponType[] // weapon required
      }
    }
  }
}
