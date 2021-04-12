(function(){
  /**
   * Copy and paste this into interactive code execution window in the game's browser UI.
   * Add temp code to do things at the bottom.
   */

  //
  // CONFIG
  //
  const autoCompoundLevelMax = 3
  const bankPackKeys = Object.keys(bank_packs).filter(x => bank_packs[x][0] === 'bank')
  const packSize = 42
  const trashItemTypes = ['cclaw', 'coat', 'gloves', 'helmet', 'pants', 'shoes']

  const arrayOf = x => Array.isArray(x) ? x : [x]
  const bankPack = x => (character.bank || {})[x] ?? []
  const isNull = x => x === null
  const isNotNull = x => x !== null

  // Bank inventory in packs "items0", "items1", etc. Wrapping some game functions for friendlier argument names.
  const openSlotInBankPack = key => bankPack(key).find(isNull)
  const getPackWithSpace = () => bankPackKeys.find(openSlotInBankPack)
  const bankWithdrawAll = () => bank_withdraw(character.bank.gold)
  const sellAll = () => character.items.forEach((o, slot) => { if (o) sell(slot, o.q || 1) })

  //
  // TRASH
  //
  const isTrash = item => item && trashItemTypes.includes(item.name || item.type) && item.level < 7
  const retrieveTrash = () => bankRetrieveTypes(trashItemTypes)
  const sellTrash = () => character.items.forEach((o, i) => { if (isTrash(o)) sell(i, o.q || 1) })


  const bankRetrieveTypes = types => arrayOf(types).forEach(type => {
    bankPackKeys.forEach(x => bankPack(x).forEach((o, slot) => { if (o?.name === type) bank_retrieve(packKey, slot) }))
  })

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

  const bankRetrieveCount = (item, count) => {
    for (let i = 0; i < count; i++) bankRetrieve(item)
  }

  const bankRetrieve = ({ name, type, level }) => bankPackKeys.forEach(packKey => {
    bankPack(packKey).forEach((o, slot) => {
      if (o?.name !== (name || type)) return
      if (level !== undefined && o?.level !== level) return
      bank_retrieve(packKey, slot)
      if (!(name || type) && o?.name !== (name || type)) return
      if (level !== undefined && o?.level !== level) return
      bank_retrieve(packKey, slot)
    })
  })

  const bankRetrieveCompoundables = () => bankPackKeys.some(x => bankPack(x).some(o => {
    if (isCompoundableType(o?.name) && bankCount(o) >= 3) {
      bankRetrieveCount(o, 3)
      return true
    }
  }))

  const bankStoreItem = (item, slot) => {
    if (!item) return
    let stacked = false
    if (isStackableType(item.name)) {
      bankPackKeys.some(packKey => {
        if (!character.bank[packKey]) return
        const packSlot = itemSlot(item, bankPack(packKey))
        if (packSlot && can_stack(item, bankPack(packKey)[packSlot])) {
          console.log(`stacking ${item.name}`)
          let openPackSlot = openSlotInBankPack(packKey)
          console.log(`openSlotInBankPack('${packKey}')`, openPackSlot)
          if (openPackSlot) {
            bank_store(slot, packKey, openPackSlot)
            parent.socket.emit('bank', { operation: 'move', pack: packKey, a: openPackSlot, b: packSlot })
            stacked = true
            return true
          } // else
          const openSlot = openSlots()[0]
          if (openSlot > -1) {
            console.log(`can’t stack in full pack, but can swap to open slot`)
            const swapSlot = (packSlot + 1) % packSize
            bank_retrieve(packKey, swapSlot, openSlot)
            bank_store(slot, packKey, swapSlot)
            parent.socket.emit('bank', { operation: 'move', pack: packKey, a: swapSlot, b: packSlot })
            bank_store(openSlot, packKey, swapSlot)
            stacked = true
            return true
          } else {
            game_log('stack failed: need open slot in bank or inventory')
          }
        }
      })
    }
    if (!stacked) {
      const packKey = getPackWithSpace()
      if (packKey) bank_store(slot, packKey)
    }
  }
  const bankStore = ({ name, type, level }) => {
    if (!character.bank) return
    character.items.forEach((o, slot) => {
      if (o?.name !== (name || type)) return
      if (level !== undefined && o?.level !== level) return
      bankStoreItem(o, slot)
    })
  }
  const bankStoreAll = () => character.items.forEach(bankStoreItem)

  const goJustOutsideBank = cb => smart_move({ map: 'main', x: 168, y: -134 }, cb)

  const compoundAny = () => character.items.some(item => {
    if (character.q.compound || !isCompoundableType(item?.name) || itemCount(item) < 3 || item.level >= autoCompoundLevelMax) return
    const slots = itemSlots(item)
    const scrollSlot = itemSlot({ type: 'cscroll' + item_grade(item) })
    if (scrollSlot) return compound(slots[0], slots[1], slots[2], scrollSlot)
  })

  const isCompoundableType = type => type && G.items[type].compound
  const isExchangeableType = type => type && G.items[type]?.e
  const isStackableType = type => type && G.items[type]?.s
  const isUpgradeableType = type => type && G.items[type]?.upgrade

  // name or type is required (no filter just by level). Support name or type due to handle data structure inconsistency.
  const itemFilter = arg => o => o?.name === (arg.name || arg.type) && (arg.level === undefined || o.level === arg.level)
  const bagCount = (item, bag) => Array.isArray(bag) ? bag.filter(itemFilter(item)).length : 0 // todo reduce quantity
  const bankCount = item => bankPackKeys.map(x => itemCount(item, character.bank[x])).reduce((x, o) => x + o, 0)
  const itemCount = item => bagCount(item, character.items)
  const itemSlot = (o, bag) => itemSlots(o, bag)?.[0]
  const itemSlots = (arg, bag = character.items) => bag.map((o, slot) => itemFilter(arg)(o) ? slot : null).filter(isNotNull)
  const openSlots = () => character.items.map((o, slot) => o ? null : slot).filter(isNotNull)

  console.log('Executing snippets-merchant.js')
  //
  // ...your code here
  //
  // if (!character.map === 'bank') smart_move('bank')
  bankStoreAll()
  bankRetrieveCompoundables()
  goJustOutsideBank(compoundAny)
  //
  // bank_deposit(character.gold)
  // bankStore({ name: 'whiteegg', q: 1 })
  // bankWithdrawAll()
  // for (let i = 0; i < 9; i++) bankRetrieve({ type: 'egg' + i })
  //
})()
// end snippets-merchant.js
