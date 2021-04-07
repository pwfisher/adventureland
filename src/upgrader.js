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
// Startup
//
if (autoParty) partyUp()

//
// Loop
//
setInterval(() => {
  doAutoUpgrade()
  doAutoExchange()
  doAutoStand()
}, 250)

//
// Functions
//
function doAutoUpgrade() {
  const [slot, scrollSlot] = [0, 1]
  if (!autoUpgrade || character.q.upgrade || !character.items[scrollSlot]?.name.includes('scroll')) return
  if (character.items[slot]?.level < 7) upgrade(slot, scrollSlot)
  else if (autoItem && !character.items[0]) buy(autoItem)
}

function doAutoExchange() {
  const slot = 0
  if (autoExchange && !character.q.exchange && G.items[character.items[slot]?.name]?.e) exchange(slot)
}

function doAutoStand() {
  if (!autoStand) return
  if (is_moving(character) && character.stand) close_stand()
  else if (!is_moving(character) && !character.stand) open_stand()
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
