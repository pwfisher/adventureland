smart_move(get_party()['Finger'])

console.log({ x: Math.round(character.real_x), y: Math.round(character.real_y) })

game.on('event', o => {
  if (o.name === 'wabbit') smart_move(o.map) // must then find on map
})
auto_craft('basketofeggs')

const getEntityArray = () => Object.keys(parent.entities).map(k => parent.entities[k])
const getPlayers = () => getEntityArray().filter(o => o.player)
const getPlayerNames = () => getPlayers().map(o => o.name)

//Upgrade Items
let itemsToUpgrade = ['shoes']
// https://github.com/johnnyawesome/Adventure.Land/blob/master/SRC/merchantSkills.5.js
function upgradeItems() {
  if (merchantDebugMode) log('Upgrading Items', 'green');
  const scrolls = ['scroll0', 'scroll1', 'scroll2'];
  for (slot in character.items) {
    if (!character.q.upgrade
      && character.items[slot]?.name
        && itemsToUpgrade.includes(character.items[slot].name)
        && G.items[character.items[slot].name].upgrade)
      && character.items[slot].level <= maxUpgradeLevel) {
      //Use massproduction skill
      // massProduction();
      //Upgrade item
      upgrade(slot, locate_item(scrolls[item_grade(character.items[slot])])).then(
        (data) => {
          game_log(`Upgraded ${character.items[slot].name}`);
        },
        (data) => {
          game_log(`Upgrade failed: ${character.items[slot].name} : ${data.reason}`);
        },
      );
      return;
    }
  }
}
