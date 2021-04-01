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
const preyXpMin = 400
const rangeKite = character.range * 0.8
const rangeMelee = character.range * 0.5
const rangeStalk = character.range * 0.9
const tickDelay = 250
const pathChunk = character.range * 0.4

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
  const lockMob = get_targeted_monster()
  const aggroMob = getNearestMonster({ target: character })
  const preyMob = getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax, path_check: true })
  const squishMob = getNearestMonster({ max_hp: character.attack * 0.9 })

  //
  // ATTACK
  //
  let mobToAttack = null
  if (
    iAmTargetOf(lockMob) &&
    (autoAttack || autoDefend) &&
    (autoStalk || is_in_range(lockMob, 'attack'))
  ) {
    set_message('lock')
    mobToAttack = lockMob
  } else if (aggroMob && autoDefend) {
    set_message('aggro')
    mobToAttack = aggroMob
  } else if (preyMob && autoAttack && character.hp > character.max_hp * 0.9) {
    set_message('prey')
    mobToAttack = preyMob
  } else if (squishMob && autoSquish && is_in_range(squishMob, 'attack')) {
    set_message('squish')
    mobToAttack = squishMob
  } else {
    set_message('none')
  }
  if (
    can_attack(mobToAttack) &&
    (distance(character, mobToAttack) > rangeMelee ||
      mobToAttack === squishMob ||
      mobToAttack === aggroMob)
  ) {
    attack(mobToAttack)
  }

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
      moveToward(aggroMob, pathChunk)
    }
  } else if (autoStalk && mobToAttack) {
    if (!is_moving(character)) {
      if (!is_in_range(mobToAttack, 'attack')) moveToward(mobToAttack, pathChunk)
      else if (distance(character, mobToAttack) < rangeMelee) moveToward(mobToAttack, -pathChunk)
    } else if (
      distance(character, mobToAttack) > rangeKite &&
      distance(character, mobToAttack) < rangeStalk
    )
      stop()
  }
}

const getNearestMonster = (args = {}) => {
  let min_d = 999999,
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

const moveToward = (point, distance) => {
  const dx = point.x - character.x
  const dy = point.y - character.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
}
