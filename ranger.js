/*
 * Docs: https://github.com/kaansoral/adventureland
 */

//
// CONFIG
//
const autoAttack = true
const autoDefend = true
const autoKite = true
const autoRespawn = true
const autoSquish = true
const autoStalk = true
const preyAtkMax = 50
const preyXpMin = 400
const rangeChunk = character.speed * 1.0
const rangeKite = character.range * 0.7
const rangeMelee = character.speed * 0.5
const rangeRadar = character.speed * 20
const rangeStalk = character.range * 0.9
const squishyHp = character.attack * 0.95 // "squishy" = one-shot kill
const tickDelay = 250

//
// STATE
//
let kitingMob = null
let moveDirection = 'stop' // 'stop' | 'in' | 'out'
let whichMob = 'none'

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
  const squishyMob = getNearestMonster({ max_hp: squishyHp })

  //
  // ATTACK
  //
  let mobToAttack = null
  if (
    iAmTargetOf(lockMob) &&
    (autoAttack || autoDefend) &&
    (autoStalk || is_in_range(lockMob, 'attack'))
  ) {
    whichMob = 'lock'
    mobToAttack = lockMob
  } else if (aggroMob && autoDefend) {
    whichMob = 'aggro'
    mobToAttack = aggroMob
  } else if (
    preyMob &&
    autoAttack &&
    character.hp > character.max_hp * 0.9 &&
    !preyMob.dreturn && // damage return (porcupine)
    preyMob.speed < character.speed
  ) {
    whichMob = 'prey'
    mobToAttack = preyMob
  } else if (squishyMob && autoSquish && is_in_range(squishyMob, 'attack')) {
    whichMob = 'squishy'
    mobToAttack = squishyMob
  } else {
    whichMob = 'none'
  }
  if (
    can_attack(mobToAttack) &&
    (distance(character, mobToAttack) > rangeMelee ||
      mobToAttack === squishyMob ||
      mobToAttack === aggroMob)
  ) {
    attack(mobToAttack)
  }

  //
  // MOVEMENT
  //
  if (kitingMob && !aggroMob) stopKiting()
  else if (autoKite && aggroMob && distance(character, aggroMob) <= rangeKite) kite(aggroMob)
  else if (autoStalk && mobToAttack) {
    if (!is_moving(character)) {
      if (!is_in_range(mobToAttack, 'attack')) moveToward(mobToAttack, rangeChunk)
      else if (distance(character, mobToAttack) <= rangeMelee) moveToward(mobToAttack, -rangeChunk)
    } else if (
      distance(character, mobToAttack) >= rangeKite &&
      distance(character, mobToAttack) <= rangeStalk
    ) {
      stop()
      moveDirection = 'stop'
    }
  }

  set_message(`${whichMob} · ${moveDirection}`)
}

const kite = mob => {
  kitingMob = mob
  moveToward(mob, -rangeChunk)
}
const stopKiting = () => {
  stop()
  kitingMob = null
  moveDirection = 'stop'
}
const getNearestMonster = (args = {}) => {
  let min_d = rangeRadar,
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
// const isPrey = x => x?.attack <= preyAtkMax
const isSquishy = x => x?.hp <= squishyHp

const moveToward = (point, distance) => {
  const dx = point.x - character.x
  const dy = point.y - character.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
  moveDirection = distance > 0 ? 'in' : 'out'
}
