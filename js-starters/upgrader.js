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
  const autoLoot = false
  const autoParty = false
  const autoPotion = true
  const autoSell = true
  const autoStand = true
  const autoTown = false
  const autoUpgrade = true
  const autoUpgradeBuyType = '' // item key, e.g. 'staff'
  const autoUpgradeMaxGrade = 1
  const autoUpgradeMaxLevel = 8
  const bankPackKeys = ['items0', 'items1']
  const characterKeys = ['Binger', 'Dinger', 'Finger', 'Zinger']
  const tickDelay = 250

  const autoSellTypes = [
    'bwing', 'beewings',
    'cape', 'coat', 'coat1',
    'gloves', 'gloves1',
    'helmet', 'helmet1',
    'ijx',
    'pants', 'pants1',
    'seashell', 'shadowstone', 'shoes', 'shoes1',
    'whiteegg',
  ]

  //
  // STATE
  //
  // Stateless.
  const resetState = () => {}

  //
  // INIT
  //
  if (autoTown) openStandInTown()
  set_message(`Upgrader`)

  //
  // LOOP
  //
  setInterval(() => {
    const item0 = character.items[0]
    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }

    if (autoCompound && !character.q.compound) compoundAny()
    if (autoExchange && !character.q.exchange && isExchangeableType(item0?.name)) exchange(0)
    if (autoLoot) loot()
    if (autoParty) partyUp()
    if (autoPotion) use_hp_or_mp()
    if (autoSell) character.items.forEach((item, slot) => {
      if (autoSellTypes.includes(item?.name) && (item?.level === undefined || item.level < 6)) sell(slot, 9999)
    })
    if (autoStand) {
      if (is_moving(character) && character.stand) close_stand()
      else if (!is_moving(character) && !character.stand) open_stand()
    }
    if (autoUpgrade && !character.q.upgrade) {
      const upgradeSlot = autoUpgradeableSlot()
      if (upgradeSlot > -1) {
        const scrollSlot = bagSlot({ type: 'scroll' + item_grade(character.items[upgradeSlot]) }, character.items)
        if (scrollSlot) upgrade(upgradeSlot, scrollSlot)
      }
      else if (autoUpgradeBuyType && !character.items[0]) buy(autoUpgradeBuyType)
    }
    // todo merchant's luck (if merchant)
    // alphabetize bank to group compoundables?
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

  const compoundAny = () => character.items.some(item => {
    if (character.q.compound || !isCompoundableType(item?.name) || bagCount(item, character.items) < 3 || item.level >= autoCompoundLevelMax) return
    const slots = bagSlots(item, character.items)
    const scrollSlot = bagSlot({ type: 'cscroll' + item_grade(item) }, character.items)
    if (scrollSlot > -1) return compound(slots[0], slots[1], slots[2], scrollSlot)
    else set_message('need cscroll' + item_grade(item))
  })

  const isNotNull = x => x !== null

  const isCompoundableType = type => !!(type && G.items[type].compound)
  const isExchangeableType = type => !!(type && G.items[type]?.e)
  const isStackableType = type => type && G.items[type]?.s
  const isUpgradeableType = type => !!(type && G.items[type]?.upgrade)

  const isAutoUpgradeableItem = item => isUpgradeableType(item?.name) && item_grade(item) <= autoUpgradeMaxGrade && item.level < autoUpgradeMaxLevel
  const autoUpgradeableSlot = () => character.items.findIndex(o => isAutoUpgradeableItem(o))

  // A "bag" is character.items or, e.g., character.bank['items0']
  // name or type is required (no filter just by level). Support name or type due to handle data structure inconsistency.
  const itemFilter = arg => o => o?.name === (arg.name || arg.type) && (arg.level === undefined || o.level === arg.level)
  const bagCount = (item, bag) => item && Array.isArray(bag) ? bag.filter(itemFilter(item)).reduce((x, o) => x + (o.q || 1), 0) : 0
  const bankCount = item => bankPackKeys.map(x => bagCount(item, character.bank[x])).reduce((x, o) => x + o, 0)
  const bagSlot = (item, bag) => bagSlots(item, bag)?.[0]
  const bagSlots = (arg, bag) => bag.map((o, slot) => itemFilter(arg)(o) ? slot : null).filter(isNotNull)
  const openSlots = bag => bag.map((o, slot) => o ? null : slot).filter(isNotNull)

  //
  // Hooks
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end upgrader.js
