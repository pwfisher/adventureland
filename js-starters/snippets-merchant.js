(function(){
  /**
   * Copy and paste this into interactive code execution window in the game's browser UI.
   * Add temp code to do things at the bottom.
   */

  //
  // CONFIG
  //
  const bankPackIds = ['items0', 'items1']
  const trashItemTypes = ['cclaw', 'coat', 'gloves', 'helmet', 'pants', 'shoes']

  // Bank inventory in packs "items0", "items1", etc. Wrapping some game functions for friendlier argument names.
  const getPackWithSpace = () => bankPackIds.find(packId => character.bank[packId].filter(o => o === null).length)
  const bankStoreAll = () => character.items.forEach((o, i) => {
    const packId = getPackWithSpace()
    if (o && packId) bank_store(i, packId)
  })
  const bankWithdrawAll = () => bank_withdraw(character.bank.gold)
  const closeStand = close_stand
  const sellAll = () => character.items.forEach((o, i) => { if (o) sell(i, o.q || 1) })

  //
  // TRASH
  //
  const isTrash = item => trashItemTypes.includes(item?.name) && (!item?.level || item.level < 7)
  const retrieveTrash = () => bankRetrieveItems(trashItemTypes)
  const sellTrash = () => character.items.forEach((o, i) => { if (isTrash(o)) sell(i, o.q || 1) })

  const bankRetrieveItems = (types) => {
    (Array.isArray(types) ? types : [types]).forEach(type => {
      bankPackIds.forEach(packId => {
        character.bank[packId].forEach((o, slot) => {
          if (o?.name === type) bank_retrieve(packId, slot)
        })
      })
    })
  }

  const bankDump = () => { // untested
    const { map, real_x, real_y } = { character }
    smart_move('town', () => {
      sellTrash()
      smart_move('bank', () => {
        bank_deposit(character.gold)
        bankStoreAll()
        smart_move({ map, x: real_x, y: real_y })
      })
    })
  }

  const bankRetrieve = ({ type, level }) => {
    if (!character.bank) return
    bankPackIds.forEach(packId => {
      character.bank[packId].forEach((o, slot) => {
        if (o?.name !== type) return
        if (level !== undefined && o?.level !== level) return
        bank_retrieve(packId, slot)
      })
    })
  }

  // TODO stack in pack 2 when space in pack 1
  const bankStore = ({ type, level }) => {
    if (!character.bank) return
    character.items.forEach((o, slot) => {
      if (o?.name !== type) return
      if (level !== undefined && o?.level !== level) return
      const packId = getPackWithSpace()
      if (packId) bank_store(slot, packId)
    })
  }

  // const compoundBank = ({ type, level }) => {
  //   if (!character.bank) return
  //   bankStore({ type, level })
  //   bankRetrieve({ type: 'cscroll0' })
  //   bankRetrieve({ type, level })
  //   goJustOutsideBank(compoundAny)
  // }

  const goJustOutsideBank = cb => smart_move({ map: 'main', x: 168, y: -134 }, cb)

  const compoundAny = () => character.items.forEach((item, slot) => {
    if (character.q.compound || !isCompoundableType(item?.name) || itemCount(item) < 3) return
    const slots = itemSlots({ type: item.name, level: item.level })
    for (let i = 0; i < 4; i++) {
      const scrollSlot = itemSlot({ type: 'cscroll' + i })
      if (scrollSlot) compound(slots[0], slots[1], slots[2], scrollSlot)
    }
  })
  setInterval(compoundAny, 250)

  const isCompoundableType = type => type && G.items[type].compound
  const isExchangeableType = type => type && G.items[type]?.e
  const isUpgradeableType = type => type && G.items[type]?.upgrade

  // const compoundScrollLevelRequiredFor = item => 0 // todo

  const itemCount = ({ name, level }) => character.items
    .filter(o => o?.name === name && (level === undefined || o.level === level))
    .length
  const itemSlot = o => itemSlots(o)?.[0]
  const itemSlots = ({ type, level }) => character.items
    .map((o, slot) => o?.name === type && (level === undefined || o?.level === level) ? slot : null)
    .filter(x => x !== null)

  // const openSlotCount = () => character.items.filter(o => o === null).length

  console.log('Executing snippets-merch.js')
  //
  // ...your code here
  bankStoreAll()
  //
})()
