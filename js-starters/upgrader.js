/**
 * Upgrader
 *
 * @author Patrick Fisher <patrick@pwfisher.com>
 * @see https://github.com/kaansoral/adventureland
 */
const autoExchange = true
const autoExchangeSlot = 0
const autoItem = null // e.g. 'staff'. For things you can buy at Gabriel and attempt to upgrade on the spot.
const autoParty = false
const autoStand = true
const autoUpgrade = true
const autoUpgradeSlot = 0
const autoUpgradeMaxScrollLevel = 0
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
  if (autoExchange && !is_on_cooldown('exchange') && isExchangeableType(character.items[autoExchangeSlot]?.name))
    exchange(autoExchangeSlot)
  if (autoParty) partyUp()
  if (autoStand) {
    if (is_moving(character) && character.stand) close_stand()
    else if (!is_moving(character) && !character.stand) open_stand()
  }
  if (autoUpgrade && !is_on_cooldown('upgrade') && isUpgradeableType(character.items[autoUpgradeSlot]?.name)) {
    if (character.items[autoUpgradeSlot]?.level < 7) {
      for (let i = 0; i < autoUpgradeMaxScrollLevel; i++) {
        const scrollSlot = itemSlot({ type: 'scroll' + i })
        if (scrollSlot) upgrade(autoUpgradeSlot, scrollSlot)
      }
    }
    else if (autoItem && !character.items[0]) buy(autoItem)
  }
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
  for (const name of characterNames) {
    if (!partyNames.includes(name)) send_party_invite(name)
  }
}

const compoundAny = () => character.items.forEach((item, slot) => {
  if (character.q.compound || !isCompoundableType(item?.name) || itemCount(item) < 3) return
  const slots = itemSlots({ type: item.name, level: item.level })
  for (let i = 0; i < 4; i++) {
    const scrollSlot = itemSlot({ type: 'cscroll' + i })
    if (scrollSlot) compound(slots[0], slots[1], slots[2], scrollSlot)
  }
})

const isCompoundableType = type => type && G.items[type].compound
const isExchangeableType = type => type && G.items[type]?.e
const isUpgradeableType = type => type && G.items[type]?.upgrade
const itemCount = ({ name, level }) => character.items
  .filter(o => o?.name === name && (level === undefined || o.level === level))
  .length
const itemSlot = o => itemSlots(o)?.[0]
const itemSlots = ({ type, level }) => character.items
  .map((o, slot) => o?.name === type && (level === undefined || o?.level === level) ? slot : null)
  .filter(x => x !== null)

//
// Hooks
//
on_party_invite = name => {
  if ([characterNames].includes(name)) accept_party_invite(name)
}
