/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const autoAttack = true
const autoDefend = true
const autoKite = true
const autoRespawn = true
const autoSquish = true
const autoStalk = true
const preyAtkMax = 50
const preyXpMin = 101
const rangeKite = character.range * 0.8
const rangeMelee = character.range * 0.5
const rangeStalk = character.range * 0.9
const tickDelay = 250

let kitingMob = null

setInterval(tick, tickDelay)

function tick() {
  if (autoRespawn && character.rip) respawn()
  if (character.rip) return

  use_hp_or_mp()

  loot()

  //
  // RADAR
  //
  const thisMob = get_targeted_monster()
  const aggroMob = get_nearest_monster({ target: character })
  const preyMob = get_nearest_monster({ min_xp: preyXpMin, max_att: preyAtkMax })
  const squishMob = getNearestMonster({ max_hp: character.attack * 0.9 })

  //
  // ATTACK
  //
  let mobToAttack = null
  if (
    iAmTargetOf(thisMob) &&
    (autoAttack || autoDefend) &&
    (autoStalk || is_in_range(thisMob, 'attack'))
  )
    mobToAttack = thisMob
  else if (aggroMob && autoDefend) mobToAttack = aggroMob
  else if (preyMob && autoAttack && character.hp === character.max_hp) mobToAttack = preyMob
  else if (squishMob && autoSquish && is_in_range(squishMob, 'attack')) mobToAttack = squishMob
  if (
    !is_on_cooldown('attack') &&
    is_in_range(mobToAttack) &&
    (distance(character, mobToAttack) > rangeMelee ||
      mobToAttack === squishMob ||
      mobToAttack === aggroMob)
  )
    attack(mobToAttack)

  //
  // MOVEMENT
  //
  if (kitingMob && !aggroMob) {
    stop()
    kitingMob = null
  }
  if (autoKite && aggroMob) {
    if (distance(character, aggroMob) < rangeKite) {
      kitingMob = aggroMob
      moveUntoward(aggroMob)
    }
  } else if (autoStalk && mobToAttack) {
    if (!is_moving(character)) {
      if (!is_in_range(mobToAttack, 'attack')) moveToward(mobToAttack)
      else if (distance(character, mobToAttack) < rangeMelee) moveUntoward(mobToAttack)
    }
    if (
      is_moving(character) &&
      distance(character, mobToAttack) > rangeKite &&
      distance(character, mobToAttack) < rangeStalk
    )
      stop()
  }
}

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
    if (args.no_melee && distance < rangeMelee) continue
    if (distance < min_d) (min_d = distance), (result = mob)
  }
  return result
}
const iAmTargetOf = x => x?.target === character.id
// const isPrey = x => x?.attack < preyAtkMax
const isSquishy = x => x?.hp < character.attack * 0.9
const moveToward = p =>
  move(character.x + (p.x - character.x) / 2, character.y + (p.y - character.y) / 2)
const moveUntoward = p =>
  move(character.x - (p.x - character.x) / 2, character.y - (p.y - character.y) / 2)
