(function(){
// [13,12,11,20,19,18].forEach(x => sell(x))
// for (i = 7; i <= 31; i++) sell(i)
// [37,38,39].forEach(x => bank_store(x))

//
// State
//
let exchangeInterval // number setInterval returns
const exchangeOnLoop = () => {
  if (interval) clearInterval(interval)
  intervalId = setInterval(() => exchange(0), 500)
}

// Bank inventory in packs "items0", "items1", etc. Wrapping some game functions for friendlier argument names.
const getPackWithSpace = () => ['items0', 'items1'].find(packId => character.bank[packId].filter(o => o === null).length)
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
const trashItemTypes = ['cclaw', 'coat', 'gloves', 'helmet', 'pants', 'shoes']
const isTrash = item => trashItemTypes.includes(item?.name) && (!item?.level || item.level < 7)
const retrieveTrash = () => bankRetrieveItems(trashItemTypes)
const sellTrash = () => character.items.forEach((o, i) => { if (isTrash(o)) sell(i, o.q || 1) })

const bankRetrieveItems = (types) => {
  (Array.isArray(types) ? types : [types]).forEach(type => {
    ['items0', 'items1'].forEach(packId => {
      character.bank[packId].forEach((o, slot) => {
        if (o?.name === type) bank_retrieve(packId, slot)
      })
    })
  })
}

const bankDump = () => {
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

const numOpenSlots = () => character.items.filter(o => o === null).length

const bankRetrieve = ({ type, level }) => {
  if (!character.bank) return
  ['items0', 'items1'].forEach(packId => {
    character.bank[packId].forEach((o, slot) => {
      if (o?.name !== type) return
      if (level !== undefined && o?.level !== level) return
      bank_retrieve(packId, slot)
    })
  })
}

const bankStore = ({ type, level }) => {
  if (!character.bank) return
  character.items.forEach((o, slot) => {
    if (o?.name !== type) return
    if (level !== undefined && o?.level !== level) return
    const packId = getPackWithSpace()
    if (packId) bank_store(slot, packId)
  })
}

const compoundItem = ({ type, level }) => {
  const doTheSkill = () => {
    const scrollSlot = itemSlot({ type: 'cscroll0' })
    const offset = itemSlot({ type, level })
    compound(offset, offset + 1, offset + 2, scrollSlot)
  }
  if (character.bank) {
    bankStore({ type, level })
    bankRetrieve({ type: 'cscroll0' })
    bankRetrieve({ type, level })
    goJustOutsideBank(doTheSkill)
  }
  else doTheSkill()
}

const goJustOutsideBank = cb => smart_move({ map: 'main', x: 168, y: -134 }, cb)

const itemSlot = ({ type, level }) => {
  return character.items.findIndex(o => (type === undefined || o?.name === type) && (level === undefined || o?.level === level))
}

// ------

// compoundItem({ type: 'hpamulet', level: 1 })

// ------
})()
