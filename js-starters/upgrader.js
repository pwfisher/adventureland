(function(){
  /**
   * Upgrader
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */

  //
  // CONFIG
  //
  const autoCompound = true
  const autoCompoundLevelMax = 3
  const autoExchange = true
  const autoExchangeSlot = 0
  const autoLoot = true
  const autoParty = false
  const autoPotion = true
  const autoStand = true
  const autoTown = false
  const autoUpgrade = true
  const autoUpgradeBuyKey = '' // item key, e.g. 'staff'
  const autoUpgradeMaxScrollLevel = 0
  const autoUpgradeSlot = 0
  const bankPackKeys = ['items0', 'items1']
  const characterKeys = ['Binger', 'Dinger', 'Finger', 'Zinger']
  const tickDelay = 250

  //
  // STATE
  //
  // Stateless.
  const resetState = () => {}

  //
  // INIT
  //
  if (autoTown) openStandInTown()

  //
  // LOOP
  //
  setInterval(() => {
    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }
    if (autoCompound) compoundAny()
    if (autoExchange && !is_on_cooldown('exchange') && isExchangeableType(character.items[autoExchangeSlot]?.name)) exchange(autoExchangeSlot)
    if (autoLoot) loot()
    if (autoParty) partyUp()
    if (autoPotion) use_hp_or_mp()
    if (autoStand) {
      if (is_moving(character) && character.stand) close_stand()
      else if (!is_moving(character) && !character.stand) open_stand()
    }
    if (autoUpgrade && !is_on_cooldown('upgrade') && isUpgradeableType(character.items[autoUpgradeSlot]?.name)) {
      if (character.items[autoUpgradeSlot]?.level < 7) {
        for (let i = 0; i < autoUpgradeMaxScrollLevel; i++) {
          const scrollSlot = itemSlot({ type: 'scroll' + i })
          if (scrollSlot) upgrade(autoUpgradeSlot, scrollSlot)
        }
      }
      else if (autoUpgradeBuyKey && !character.items[0]) buy(autoUpgradeBuyKey)
    }

    //
    // UPDATE UI
    //
    set_message(`Upgrader`)
}, tickDelay)

  //
  // Functions
  //
  function openStandInTown() {
    const x = -100 - Math.round(Math.random() * 50)
    const y = -100 - Math.round(Math.random() * 50)
    smart_move({ map: 'main', x, y }, () => move(x, y + 1)) // face forward
  }

  function partyUp() {
    const partyNames = Object.keys(get_party())
    for (const name of characterKeys) {
      if (!partyNames.includes(name)) send_party_invite(name)
    }
  }

  const compoundAny = () => character.items.forEach(item => {
    if (is_on_cooldown('compound') || !isCompoundableType(item?.name) || itemCount(item) < 3 || item.level >= autoCompoundLevelMax) return
    const slots = itemSlots(item)
    const scrollSlot = itemSlot({ type: 'cscroll' + item_grade(item) })
    if (scrollSlot) compound(slots[0], slots[1], slots[2], scrollSlot)
  })

  const isCompoundableType = type => type && G.items[type].compound
  const isExchangeableType = type => type && G.items[type]?.e
  const isUpgradeableType = type => type && G.items[type]?.upgrade

  // name or type is required (no filter just by level). Support name or type due to handle data structure inconsistency.
  const itemFilter = arg => o => o?.name === (arg.name || arg.type) && (arg.level === undefined || o.level === arg.level)
  const bagCount = (item, bag) => Array.isArray(bag) ? bag.filter(itemFilter(item)).length : 0 // todo reduce quantity
  const bankCount = item => bankPackKeys.map(x => itemCount(item, character.bank[x])).reduce((x, o) => x + o, 0)
  const itemCount = item => bagCount(item, character.items)
  const itemSlot = o => itemSlots(o)?.[0]
  const itemSlots = arg => character.items.map((o, slot) => itemFilter(arg)(o) ? slot : null).filter(x => x !== null)

  //
  // Hooks
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end upgrader.js
