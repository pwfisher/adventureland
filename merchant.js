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
const bankDepositAll = () => bank_deposit(character.gold)
const bankRetrieve = bank_retrieve // (packId, packSlot, slot) => bank_retrieve(packId, packSlot, slot)
const bankStore = bank_store // (slot, packId, packSlot) = bank_store(slot, packId, packSlot)
const bankStoreAll = () => character.items.forEach((o, i) => { if (o) bank_store(i) })
const bankWithdrawAll = () => bank_withdraw(character.bank.gold)
const closeStand = close_stand
const sellAll = () => character.items.forEach((o, i) => { if (o) sell(i, o.q || 1) })

// TODO go to bank, retrieve trash, go to town, sell trash
const trashMap = {
  coat: true,
  gloves: true,
  helmet: true,
  pants: true,
  shoes: true,
}
const isTrash = item => trashMap[item?.name]
const sellTrash = () => character.items.forEach((o, i) => { if (isTrash(o)) sell(i, o.q || 1) })

// Bank object "name" property matches item "id", so I just call it a "type" here. Insanity reigns.
function bankRetrieveTypes(types) {
  types.forEach(type => {
    ['items0', 'items1'].forEach(packId => {
      character.bank[packId].forEach((o, slot) => {
        if (o?.name === type) bank_retrieve(packId, slot)
      })
    })
  })
}
bankRetrieveTypes(['hpamulet','hpbelt','ringsj'])

// compound(15,16,17,36)

const bankDump = () => {
  const { map, real_x, real_y } = { character }
  smart_move('town', () => {
    sellTrash()
    smart_move('bank', () => {
      bank_deposit(character.gold)
      character.items.forEach((o, i) => { if (o) bank_store(i) })
      smart_move({ map, x: real_x, y: real_y })
    })
  })
}
bankDump()

command_character('Zinger', `
const trashMap = {
  coat: true,
  gloves: true,
  helmet: true,
  pants: true,
  shoes: true,
}
const isTrash = item => trashMap[item?.name]
const sellTrash = () => character.items.forEach((o, i) => { if (isTrash(o)) sell(i, o.q || 1) })


const bankDump = () => {
  const { map, real_x, real_y } = { character }
  smart_move('town', () => {
    sellTrash()
    smart_move('bank', () => {
      bank_deposit(character.gold)
      character.items.forEach((o, i) => { if (o) bank_store(i) })
      smart_move({ map, x: real_x, y: real_y })
    })
  })
}
bankDump()
`)
