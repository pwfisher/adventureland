;(function () {
  /**
   * Upgrader
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const TEMPORARILY_FALSE = false
  const TEMPORARILY_TRUE = true
  console.log({ TEMPORARILY_FALSE, TEMPORARILY_TRUE })

  //
  // CONFIG
  //
  const autoCompound = true
  const autoCompoundLevelMax = 3
  const autoExchange = true
  const autoLoot = false
  const autoLuck = true
  const autoParty = false
  const autoPotion = true
  const autoRespawn = true
  const autoSell = true
  const autoSellLevelMax = 3
  const autoStand = true
  const autoTown = true
  const autoUpgrade = true
  const autoUpgradeBuyType = '' // item key, e.g. 'staff'
  const autoUpgradeMaxGrade = 1
  const autoUpgradeMaxLevel = 6 // 7
  const autoUpgradeLevels = {
    bataxe: 5,
    cape: 0,
    coat: 8,
    crossbow: 5,
    ecape: 6,
    eslippers: 7,
    harbringer: 3,
    pickaxe: 3,
    rod: 3,
    wattire: 8,
    wbreeches: 8,
    wcap: 8,
    wgloves: 8,
    wshoes: 8,
  }
  const bankPackKeys = ['items0', 'items1']
  const characterKeys = [
    'Banger',
    'Binger',
    'Dinger',
    'Finger',
    'Hunger',
    'Linger',
    'Longer',
    'Winger',
    'Zinger',
  ]
  const partyKeys = []
  const rangeRadar = Infinity
  const tickDelay = 250

  const autoSellTypes = [
    'bandages',
    'basher',
    'bwing',
    'beewings',
    'cclaw',
    'crabclaw',
    'cshell',
    'coat',
    'coat1',
    'dagger',
    'dstones',
    'frogt',
    'gloves',
    'gloves1',
    'gslime',
    'harmor',
    'hboots',
    'helmet',
    'helmet1',
    'hgloves',
    'hhelmet',
    'hpants',
    'ijx',
    'lspores',
    'maceofthedead',
    'pants',
    'pants1',
    'pmace',
    'rattail',
    'shadowstone',
    'shoes',
    'shoes1',
    'slimestaff',
    'spear',
    'spores',
    'sstinger',
    'sword',
    'throwingstars',
    // 'whiteegg',
  ].filter(x => x !== autoUpgradeBuyType)

  //
  // STATE
  //
  const resetState = () => {}

  //
  // INIT
  //
  if (autoTown) openStandInTown()
  set_message(`Upgrader`)

  //
  // LOOP
  //
  setInterval(tick, tickDelay)
  function tick() {
    const { items, map, rip, slots } = character

    if (rip && autoRespawn) {
      respawn()
      resetState()
    }
    if (rip) return

    if (smart.moving) resetState()

    //
    // ACTIONS
    //
    if (autoParty) partyUp()
    if (autoPotion) use_hp_or_mp()
    if (autoStand) {
      if (is_moving(character) && character.stand) close_stand()
      else if (!is_moving(character) && !character.stand) open_stand()
    }

    if (map !== 'bank') {
      if (autoCompound) compoundAny()
      if (autoExchange) exchangeSlot0()
      if (autoLuck) useMluck()
      if (autoSell)
        character.items.forEach((item, slot) => {
          if (
            autoSellTypes.includes(item?.name) &&
            (item?.level === undefined || item.level <= autoSellLevelMax)
          )
            sell(slot, 9999)
        })
      if (autoLoot) loot()
      if (autoUpgrade && !character.q.upgrade && !isOnCooldown('upgrade')) {
        const upgradeSlot = autoUpgradeableSlot()
        if (upgradeSlot > -1) {
          const scrollSlot = bagSlot(
            { type: 'scroll' + item_grade(character.items[upgradeSlot]) },
            character.items
          )
          if (scrollSlot) upgrade(upgradeSlot, scrollSlot)
        } else if (autoUpgradeBuyType && !character.items[0]) buy(autoUpgradeBuyType)
      }
    }
    // alphabetize bank to group compoundables?
    // autoRealmRotate, buy from Ponty ['ringsj', 'intring', 'dexring', 'strring', ...]

    //
    // UPDATE
    //
    const updatedAt = new Date()
    set(character.id, { items, slots, updatedAt })
  }

  //
  // Functions
  //
  let usedMluckAt = Date.now()

  function useMluck() {
    if (isOnCooldown('mluck') || character.mp < 10) return
    const now = Date.now()
    if (now - usedMluckAt < 1000) return
    if (character.s?.mluck?.f !== character.name) return use_skill('mluck', character)
    return Object.entries(parent.entities)
      .filter(([_, mob]) => mob.player && !mob.npc)
      .filter(([_, mob]) => !mob.s?.mluck?.strong)
      .filter(([_, mob]) => !mob.s?.mluck) // todo: or my peeps but not my mluck
      .filter(([_, mob]) => distance(character, mob) <= G.skills.mluck.range)
      .some(([_, mob]) => {
        use_skill('mluck', mob)
        game_log(`mluck mob: ${mob.id}`)
        return true
      })
  }

  function useMining() {
    smart_move({ map: 'tunnel', x: -275, y: -50 }, () => {
      setTimeout(() => use_skill('mining'), tickDelay)
    })
  }

  function useBank() {
    return new Promise((resolve, reject) => {
      parent.party_list.forEach(giveMeYourStuff)
      smart_move('bank', () => {
        if (character.map !== 'bank') return reject()
        bank_deposit(123456789)
        console.log('bankStoreAll')
        bankStoreAll()
        resolve()
      })
    })
  }

  function exchangeSlot0() {
    if (character.q.exchange || isOnCooldown('exchange')) return
    if (isExchangeableType(character.items[0]?.name)) exchange(0)
  }

  function openStandInTown() {
    smart_move({ map: 'main', x: 101, y: -145 }, () => move(101, -144))
  }

  const partyUp = () =>
    partyKeys.forEach(key => {
      if (!get_party()[key]) send_party_invite(key)
    })

  const compoundAny = () =>
    character.items.some(item => {
      if (
        character.q.compound ||
        isOnCooldown('compound') ||
        !isCompoundableType(item?.name) ||
        bagCount(item, character.items) < 3 ||
        item.level >= autoCompoundLevelMax
      )
        return
      const slots = bagSlots(item, character.items)
      const scrollSlot = bagSlot({ type: 'cscroll' + item_grade(item) }, character.items)
      if (scrollSlot > -1) return compound(slots[0], slots[1], slots[2], scrollSlot)
      else set_message('need cscroll' + item_grade(item))
    })

  const isNotNull = x => x !== null

  const isCompoundableType = type => !!(type && G.items[type].compound)
  const isExchangeableType = type => !!(type && G.items[type]?.e)
  const isStackableType = type => !!(type && G.items[type]?.s)
  const isUpgradeableType = type => !!(type && G.items[type]?.upgrade)

  const isAutoUpgradeableItem = item =>
    isUpgradeableType(item?.name) &&
    item_grade(item) <= autoUpgradeMaxGrade &&
    item.level <
      (autoUpgradeLevels[item.name] > -1 ? autoUpgradeLevels[item.name] : autoUpgradeMaxLevel)
  const autoUpgradeableSlot = () => character.items.findIndex(o => isAutoUpgradeableItem(o))

  // A "bag" is character.items or, e.g., character.bank['items0']
  // name or type is required (no filter just by level). Support name or type due to handle data structure inconsistency.
  const itemFilter = arg => o =>
    o?.name === (arg.name || arg.type) && (arg.level === undefined || o.level === arg.level)
  const bagCount = (item, bag) =>
    item && Array.isArray(bag)
      ? bag.filter(itemFilter(item)).reduce((x, o) => x + (o.q || 1), 0)
      : 0
  const bankCount = item =>
    bankPackKeys.map(x => bagCount(item, character.bank[x])).reduce((x, o) => x + o, 0)
  const bagSlot = (item, bag) => bagSlots(item, bag)?.[0]
  const bagSlots = (arg, bag) =>
    bag.map((o, slot) => (itemFilter(arg)(o) ? slot : null)).filter(isNotNull)
  const openSlots = bag => bag.map((o, slot) => (o ? null : slot)).filter(isNotNull)

  // "radar" caches "radar pings" [{ mob, range }] for performance
  const updateRadar = () => {
    radar = []
    for (id in parent.entities) {
      const mob = parent.entities[id]
      if (!mob.visible || mob.dead || mob.rip) continue
      const range = distance(character, mob)
      if (range > rangeRadar) continue
      radar.push({ mob, range })
    }
  }

  function isOnCooldown(skill) {
    const cooldownKey = G.skills[skill]?.share ?? skill
    return parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey]
  }

  //
  // Hooks
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }

  // adventure.land/comm "Command" input:
  // send_cm('Dinger', 'openStandInTown')
  on_cm = (name, data) => {
    if (!characterKeys.includes(name)) return
    if (data === 'openStandInTown') return openStandInTown()
    if (data === 'useMining') return useMining()
  }
})()
// end upgrader.js
