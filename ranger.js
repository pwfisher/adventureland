/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const autoAttack = false
const autoDefend = true
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
  if (!mob) return

  if (
    !is_on_cooldown('attack') &&
    ((autoDefend && iAmTargetOf(mob)) ||
      (autoAttack && isSafeTarget(mob) && distance(character, mob) > rangeMelee))
  )
    attack(mob)

  if (autoStalk) {
    if (!is_moving(character) && !is_in_range(mob, 'attack')) moveToward(mob)
    if (is_moving(character) && distance(character, mob) < rangeStalk) stop()
  }

  if (autoKite && distance(character, mob) < rangeKite) moveUntoward(mob)
}, tickDelay)

function getTargetMob() {
  const aggroMob = get_nearest_monster({ target: character })
  if (aggroMob) return aggroMob

  const mob = get_nearest_monster({ min_xp: 1, max_att: mobAtkMax })
  if (isSafeTarget(mob)) {
    change_target(mob)
    return mob
  }

  return get_targeted_monster()
}

const iAmTargetOf = x => x.target === character.id
const isSafeTarget = x => x.attack < mobAtkMax
const moveToward = p =>
  move(character.x + (p.x - character.x) / 2, character.y + (p.y - character.y) / 2)
const moveUntoward = p => move(character.x - (p.x - character.x), character.y - (p.y - character.y))
