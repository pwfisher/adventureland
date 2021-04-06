//
// Upgrader (merchant)
//
const autoExchange = true
const autoItem = null // e.g. 'staff'
const autoParty = false
const autoStand = true
const autoUpgrade = true
const characterNames = ['Binger', 'Finger', 'Zinger']

//
// Loop
//
setInterval(() => {
  if (autoUpgrade && !character.q.upgrade && character.items[1]?.name.includes('scroll')) {
    if (character.items[0]?.level < 7) upgrade(0, 1)
    else if (autoItem && !character.items[0]) buy(autoItem)
  }
  if (autoExchange && !character.q.exchange && G.items[character.items[0]?.name]?.e) exchange(0)
  if (smart.moving) close_stand()
}, 250)

//
// Functions
//
function openMerchantStand() { // h/t johnnyawesome
	if (is_moving(character)) return
  if (character.stand) close_stand()
	smart_move({
		map: 'main',
		x: -100 - Math.round(Math.random() * 50),
		y: -100 - Math.round(Math.random() * 50),
	}, () => {
		move(character.x, character.y + 1) // face front
		open_stand()
	})
}
if (autoStand) openMerchantStand()

function partyUp() {
  const partyNames = Object.keys(get_party())
  for (const name of characterNames) {
    if (!partyNames.includes(name)) send_party_invite(name)
  }
}
if (autoParty) partyUp()

//
// Hooks
//
on_party_invite = name => {
  if ([characterNames].includes(name)) accept_party_invite(name)
}
