/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const autoAttack = true
const autoKite = true
const autoRespawn = true
const autoStalk = true
const mobAtkMax = 50
const rangeKite = character.range * 0.8
const rangeMelee = character.range * 0.5
const rangeStalk = character.range
const tickDelay = 250

setInterval(function tick() {
  if (autoRespawn && character.rip) respawn()
  if (character.rip) return

  use_hp_or_mp()

  loot()

  const mob = getTargetMob()

  if ((autoAttack && isSafeTarget(mob)) || iHaveAggro()) attack(mob)

  if (autoStalk) {
    if (mob && !is_in_range(mob, 'attack')) moveToward(mob)
    if (is_moving(character) && distance(character, mob) < rangeStalk) stop()
  }

  if (autoKite && distance(character, mob) < rangeKite) moveUntoward(mob)
}, tickDelay)

function getTargetMob() {
  const current = get_targeted_monster()
  if (iHaveAggro()) return current

  const mob = get_nearest_monster({ min_xp: 1, max_att: mobAtkMax })
  if (isSafeTarget(mob)) {
    change_target(mob)
    return mob
  }
  return current
}

const iHaveAggro = () => get_targeted_monster()?.target === character.id

function isSafeTarget(mob) {
  return can_attack(mob) && mob.attack < mobAtkMax && distance(character, mob) > rangeMelee
}

function moveToward(target) {
  move(character.x + (target.x - character.x) / 2, character.y + (target.y - character.y) / 2)
}

function moveUntoward(target) {
  move(character.x - (target.x - character.x), character.y - (target.y - character.y))
}
