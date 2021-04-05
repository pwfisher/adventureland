[13,12,11,20,19,18].forEach(x => sell(x))

[37,38,39].forEach(x => bank_store(x))

//
// Rubies
//


//
// State
//
let exchangeInterval // number setInterval returns
const exchangeOnLoop = () => {
  if (interval) clearInterval(interval)
  intervalId = setInterval(() => exchange(0), 500)
}



// Bank inventory in packs "items0", "items1", etc. Wrapping some game functions for friendlier argument names.
const bankAll = () => character.items.forEach((o, i) => { if (o) bank_store(i) })
const bankDepositAll = () => bank_deposit(character.gold)
const bankRetrieve = (packId, packSlot, slot) => bank_retrieve(packId, packSlot, slot)
const bankStore = (slot, packId, packSlot) = bank_store(slot, packId, packSlot)
const bankWithdrawAll = () => bank_withdraw(character.bank.gold)
const closeStand = () => close_stand()
const sellAll = () => character.items.forEach((o, i) => { if (o) sell(i) })
