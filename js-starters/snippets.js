// Bits to copy/paste.

use_skill('town')

start_character('Zinger', 'Follower')

send_item('Dinger', slot, quantity)
character.items.filter(Boolean).forEach((_item, slot) => {
  send_item('Dinger', slot, 999)
})

// Unreliable, because get_party() data goes stale. But simple and often useful.
// -- Better to use local storage to pass data between party members.
smart_move(get_party()[leaderName])

smart_move('town', () => parent.socket.emit('interaction', { type: 'newyear_tree' }))

character_code_eval('Zinger', `
  smart_move(get_party()['Finger'])
`)

show_json(get_party())
show_json(smart)
show_json(colors)

console.log({ x: Math.round(character.real_x), y: Math.round(character.real_y) })

game.on('event', o => {
  if (o.name === 'wabbit') smart_move(o.map) // must then find on map
})
auto_craft('basketofeggs')

const getEntityArray = () => Object.keys(parent.entities).map(k => parent.entities[k])
const getPlayers = () => getEntityArray().filter(o => o.player)
const getPlayerNames = () => getPlayers().map(o => o.name)

handle_command = (command, _arg) => { // untested
  const { map, x, y } = character
  if (command === 'smart_follow') send_cm(followerNames, { 'task': 'move', map, x, y })
}

// rubyCleanup
function rubyCleanup() { // h/t riverdusty, untested
  const shouldDestroy = x => ['hpbelt', 'hpamulet', 'ringsj', 'shoes', 'pants', 'coat', 'helmet', 'gloves', 'shoes1', 'pants1', 'coat1', 'helmet1', 'gloves1'].includes(x)
  const shouldDismantle = x => ['fireblade', 'firestaff'].includes(x)
  character.items.forEach((item, index) => {
    if (shouldDestroy(item?.name) && (item.level < 3 || !item.level)) sell(index, item.q || 1)
    else if (shouldDismantle(item?.name)) socket.emit('dismantle', { num: index })
  })
}

const smartFollow = () => smart_move(get_party()[leaderName])

// upgradeItems
const maxUpgradeLevel = 7
const scrolls = ['scroll0', 'scroll1', 'scroll2']
let itemsToUpgrade = ['shoes']
function upgradeItems() { // h/t johnnyawesome. incomplete.
  if (character.q.upgrade) return
  for (slot in character.items) {
    const item = character.items[slot]
    if (itemsToUpgrade.includes(item?.name) && G.items[item.name].upgrade && item.level <= maxUpgradeLevel) {
      // TODO try to use mass production skill
      upgrade(slot, locate_item(scrolls[item_grade(item)])).then(
        (_data) => game_log(`Upgraded ${item.name}`),
        (data) => game_log(`Upgrade failed: ${item.name} : ${data.reason}`),
      )
    }
  }
}

[13,12,11,20,19,18].forEach(x => sell(x))
for (i = 7; i <= 31; i++) sell(i)
[37,38,39].forEach(x => bank_store(x))
setInterval(() => exchange(0), 500)
