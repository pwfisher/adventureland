/**
 * Hey there!
 * This is CODE, lets you control your character with code.
 * If you don't know how to code, don't worry, It's easy.
 * Just set attack_mode to true and ENGAGE!
 *
 * @author Kaan Soral <hello@adventure.land>
 * @see https://github.com/kaansoral/adventureland
 */
const attack_mode = true

const loopTime = 250

setInterval(function () {
  use_hp_or_mp()

  loot()

  if (!attack_mode || character.rip || is_moving(character)) return

  const target = getTarget()

  if (!is_in_range(target)) moveHalfwayTo(target)
  else if (can_attack(target)) {
    set_message('Attacking')
    attack(target)
  }
}, loopTime)

function getTarget() {
  let target = get_targeted_monster()
  if (!target) {
    target = get_nearest_monster({ min_xp: 100, max_att: 120 })
    if (target) change_target(target)
    else set_message('No Monsters')
  }
  return target
}

function moveHalfwayTo(target) {
  move(character.x + (target.x - character.x) / 2, character.y + (target.y - character.y) / 2)
}
