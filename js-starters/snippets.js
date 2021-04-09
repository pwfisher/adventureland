show_json(get_party())

show_json(smart)

use_skill('town')

start_character('Zinger', 'Follower')

send_item('Dinger', slot, quantity)

smart_move(get_party()['Finger'])

smart_move('town', () => parent.socket.emit('interaction', { type: 'newyear_tree' }))

game.on('event', o => {
  if (o.name === 'wabbit') smart_move(o.map) // must then find on map
})
auto_craft('basketofeggs')

handle_command = (command, _arg) => {
  const { map, x, y } = character
  if (command === 'smart_follow') send_cm(followerNames, { 'task': 'move', map, x, y })
}

function rubyCleanup() { // h/t riverdusty, untested
  const shouldDestroy = x => ['hpbelt', 'hpamulet', 'ringsj', 'shoes', 'pants', 'coat', 'helmet', 'gloves', 'shoes1', 'pants1', 'coat1', 'helmet1', 'gloves1'].includes(x)
  const shouldDismantle = x => ['fireblade', 'firestaff'].includes(x)
  character.items.forEach((item, slot) => {
    if (shouldDestroy(item?.name) && (item.level < 3 || !item.level)) sell(slot, item.q || 1)
    else if (shouldDismantle(item?.name)) socket.emit('dismantle', { num: slot })
  })
}

for (let i = 0; i<9; i++) bankRetrieve({ type: 'egg' + i })

Object.keys(G.monsters).map(k => G.monsters[k].aggro)
