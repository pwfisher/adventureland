smart_move(get_party()['Finger'])

console.log({ x: Math.round(character.real_x), y: Math.round(character.real_y) })

game.on('event', o => {
  if (o.name === 'wabbit') smart_move(o.map) // must then find on map
})
auto_craft('basketofeggs')

const getEntityArray = () => Object.keys(parent.entities).map(k => parent.entities[k])
const getPlayers = () => getEntityArray().filter(o => o.player)
const getPlayerNames = () => getPlayers().map(o => o.name)

const maxUpgradeLevel = 7
const scrolls = ['scroll0', 'scroll1', 'scroll2']
let itemsToUpgrade = ['shoes']
function upgradeItems() { // h/t johnnyawesome
  if (character.q.upgrade) return
  for (slot in character.items) {
    const item = character.items[slot]
    if (itemsToUpgrade.includes(item?.name) && G.items[item.name].upgrade && item.level <= maxUpgradeLevel) {
      // TODO use mass production skill
      upgrade(slot, locate_item(scrolls[item_grade(item)])).then(
        (_data) => game_log(`Upgraded ${item.name}`),
        (data) => game_log(`Upgrade failed: ${item.name} : ${data.reason}`),
      )
    }
  }
}
