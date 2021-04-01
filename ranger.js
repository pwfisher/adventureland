/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const autoAttack = true
const autoApproach = false
const autoRespawn = false

const loopTime = 250
const maxMobAtk = 50

setInterval(function () {
  if (autoRespawn && character.rip) respawn
  if (character.rip) return

  use_hp_or_mp()
  loot()

  const target = getTarget()

  if (autoAttack && isSafeTarget(target)) attack(target)

  if (autoApproach) {
    if (target && !is_in_range(target)) moveToward(target)
    if (is_moving(character) && is_in_range(target)) stop()
  }
}, loopTime)

function getTarget() {
  let target = get_targeted_monster()
  if (!target) {
    target = get_nearest_monster({ min_xp: 1, max_att: maxMobAtk })
    if (target) change_target(target)
    else set_message('No Monsters')
  }
  return target
}

function isSafeTarget(target) {
  return can_attack(target) && target.attack < maxMobAtk
}

function moveToward(target) {
  move(character.x + (target.x - character.x) / 2, character.y + (target.y - character.y) / 2)
}
