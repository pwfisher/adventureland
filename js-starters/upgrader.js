/**
 * Upgrader
 *
 * @author Patrick Fisher <patrick@pwfisher.com>
 * @see https://github.com/kaansoral/adventureland
 */
const autoExchange = true
const autoItem = null // e.g. 'staff'
const autoParty = false
const autoStand = true
const autoUpgrade = true
const characterNames = ['Binger', 'Finger', 'Zinger']
const tickDelay = 250

//
// INIT
//
openStandInTown()

//
// Loop
//
setInterval(() => {
  if (autoExchange && !character.q.exchange && G.items[character.items[0]?.name]?.e) exchange(0)
  if (autoParty) partyUp()
  if (autoStand) {
    if (is_moving(character) && character.stand) close_stand()
    else if (!is_moving(character) && !character.stand) open_stand()
  }
  if (autoUpgrade && !character.q.upgrade && character.items[1]?.name.includes('scroll')) {
    if (character.items[0]?.level < 7) upgrade(0, 1)
    else if (autoItem && !character.items[0]) buy(autoItem)
  }
}, tickDelay)

//
// Functions
//
function openStandInTown() { // h/t johnnyawesome
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

function partyUp() {
  const partyNames = Object.keys(get_party())
  for (const name of characterNames) {
    if (!partyNames.includes(name)) send_party_invite(name)
  }
}

//
// Hooks
//
on_party_invite = name => {
  if ([characterNames].includes(name)) accept_party_invite(name)
}
