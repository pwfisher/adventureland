[13,12,11,20,19,18].forEach(x => sell(x))

[37,38,39].forEach(x => bank_store(x))


//
// Rubies
//
// Refactor of https://github.com/riverdusty/AdventureLand/blob/master/TinyRubies/exchangeRubies.js
function rubyCleanup() {
  const shouldDestroy = x => ['hpbelt', 'hpamulet', 'ringsj', 'shoes', 'pants', 'coat', 'helmet', 'gloves', 'shoes1', 'pants1', 'coat1', 'helmet1', 'gloves1'].includes(x)
  const shouldDismantle = x => ['fireblade', 'firestaff'].includes(x)
  character.items.forEach((item, index) => {
    if (shouldDestroy(item?.name) && (item.level < 3 || !item.level)) sell(index, item.q || 1)
    else if (shouldDismantle(item?.name)) socket.emit('dismantle', { num: index })
  })
}
const rubySlot = 0
//setInterval(() => exchange(rubySlot) && setTimeout(rubyCleanup, 1), 350)

function openMerchantStand() { // by johnnyawesome
	if (is_moving(character)) return
	smart_move({
		map: 'main',
		x: -20 - Math.round(Math.random() * 180),
		y: -70
	}, () => {
		move(character.x, character.y + 1) // face front
		open_stand()
	})
}

close_stand()

// Bank inventory in packs "items0", "items1", etc. Wrapping some game functions for friendlier argument names.
const bankAll = () => character.items.forEach((o, i) => { if (o) bank_store(i) })
const bankRetrieve = (packId, packSlot, slot) => bank_retrieve(packId, packSlot, slot)
const bankStore = (slot, packId, packSlot) = bank_store(slot, packId, packSlot)
