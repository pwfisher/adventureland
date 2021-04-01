/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const autoAttack = false
const autoDefend = true
const autoKite = true
const autoRespawn = true
const autoSquish = true
const autoStalk = false
const mobAtkMax = 50
const rangeKite = character.range * 0.8
const rangeMelee = character.range * 0.5
const rangeStalk = character.range * 0.9
const tickDelay = 250

setInterval(function tick() {
  if (autoRespawn && character.rip) respawn()
  if (character.rip) return

  use_hp_or_mp()

  loot()

  const thisMob = get_targeted_monster()
  const aggroMob = get_nearest_monster({ target: character })
  const nearMob = get_nearest_monster({ min_xp: 1, max_att: mobAtkMax })
  const squishyMob = getNearestMonster({ max_hp: character.attack * 0.9 })

  let mobToAttack = null
  if (!is_on_cooldown('attack')) {
    if (iAmTargetOf(thisMob) && (autoAttack || (autoDefend && is_in_range(thisMob, 'attack'))))
      mobToAttack = thisMob
    else if (aggroMob && autoDefend && is_in_range(aggroMob, 'attack')) mobToAttack = aggroMob
    else if (isSafeTarget(nearMob) && autoAttack && is_in_range(nearMob, 'attack'))
      mobToAttack = nearMob
    else if (squishyMob && autoSquish && is_in_range(squishyMob, 'attack')) mobToAttack = squishyMob
  }

  if (is_in_range(mobToAttack)) attackAndTarget(mobToAttack)

  const inCombat = aggroMob || mobToAttack

  if (autoStalk && thisMob) {
    if (!is_moving(character) && !is_in_range(thisMob, 'attack')) moveToward(thisMob)
    if (is_moving(character) && distance(character, thisMob) < rangeStalk) stop()
  }

  if (autoKite && inCombat && distance(character, mobToAttack) < rangeKite)
    moveUntoward(mobToAttack)
}, tickDelay)

const attackAndTarget = x => attack(x) && change_target(x)
const getNearestMonster = (args = {}) => {
  let min_d = Infinity,
    result = null
  for (id in parent.entities) {
    const mob = parent.entities[id]
    if (mob.type !== 'monster' || !mob.visible || mob.dead) continue
    if (args.mtype && mob.mtype !== args.mtype) continue
    if (args.min_xp && mob.xp < args.min_xp) continue
    if (args.max_att && mob.attack > args.max_att) continue
    if (args.max_hp && mob.hp > args.max_hp) continue
    if (args.target && mob.target !== args.target) continue
    if (args.no_target && mob.target && mob.target !== character.name) continue
    if (args.path_check && !can_move_to(mob)) continue
    const distance = parent.distance(character, mob)
    if (distance < min_d) (min_d = distance), (result = mob)
  }
  return result
}
const iAmTargetOf = x => x?.target === character.id
const isSafeTarget = x => x?.attack < mobAtkMax && distance(character, x) > rangeMelee
const isSquishy = x => x?.hp < character.attack * 0.9
const moveToward = p =>
  move(character.x + (p.x - character.x) / 2, character.y + (p.y - character.y) / 2)
const moveUntoward = p => move(character.x - (p.x - character.x), character.y - (p.y - character.y))
