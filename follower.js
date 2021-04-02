/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const meleeChar = ['warrior', 'rogue'].includes(character.ctype)

//
// CONFIG
//
const autoAttack = true
const autoDefend = true
const autoFollow = true
const autoKite = !meleeChar
const autoRespawn = true
const autoSquish = true
const autoStalk = true
const characterNames = ['Binger', 'Finger', 'Zinger']
const nameLeader = 'Finger'
const rangeChunk = character.speed * 1.0
const rangeFollow = 10
const rangeKite = character.range * 0.7
const rangeRadar = character.speed * 10
const rangeStalk = character.range * 0.9
const squishyHp = character.attack * 0.95 // "squishy" = one-shot kill
const tickDelay = 250

//
// STATE
//
let isFollowing = false
let kitingMob = null
let moveDirection = 'stop' // 'stop' | 'in' | 'out'
let whichMob = 'none'

//
// TICK
//
setInterval(tick, tickDelay)
function tick() {
  partyUp()
  if (autoRespawn && character.rip) respawn()
  if (character.rip) return
  use_hp_or_mp()
  loot()

  //
  // RADAR
  //
  const lockMob = get_targeted_monster()
  const aggroMob = getNearestMonster({ target: character })
  const partyMob = getNearestMonster({ target: nameLeader })
  const squishyMob = getNearestMonster({ max_hp: squishyHp })
  const leadPlayer = get_player(nameLeader)

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
    partyMob &&
    autoAttack &&
    !partyMob.dreturn // damage return (porcupine)
  ) {
    whichMob = 'party'
    mobToAttack = partyMob
  } else if (squishyMob && autoSquish && is_in_range(squishyMob, 'attack')) {
    whichMob = 'squishy'
    mobToAttack = squishyMob
  } else {
    whichMob = 'none'
  }

  if (can_attack(mobToAttack)) attack(mobToAttack)

  //
  // MOVEMENT
  //
  if (distance(character, leadPlayer) < rangeChunk * 2) isFollowing = true
  if (distance(character, leadPlayer) > rangeChunk * 6) isFollowing = false

  if (isFollowing && !is_moving(character) && distance(character, leadPlayer) > rangeFollow)
    move(leadPlayer.x, leadPlayer.y)
  else if (kitingMob && !aggroMob) stopKiting()
  else if (autoKite && aggroMob && distance(character, aggroMob) <= rangeKite) kite(aggroMob)
  else if (autoStalk && mobToAttack) {
    if (!is_moving(character)) {
      if (!is_in_range(mobToAttack, 'attack')) moveToward(mobToAttack, rangeChunk)
      else if (distance(character, mobToAttack) <= character.range * 0.5 && !meleeChar)
        moveToward(mobToAttack, -rangeChunk)
    } else if (
      distance(character, mobToAttack) > mobToAttack.range * 1.4 &&
      distance(character, mobToAttack) <= rangeStalk
    ) {
      stop() // in goldilocks zone
      moveDirection = 'stop'
    }
  }

  //
  // UPDATE UI
  //
  set_message(`${whichMob} · ${isFollowing ? 'lock' : 'lost'}`)
}

//
// FUNCTIONS
//

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
    if (args.no_melee && distance < character.range * 0.5) continue
    if (distance < min_d) (min_d = distance), (result = mob)
  }
  return result
}

const iAmTargetOf = x => x?.target === character.id

const isSquishy = x => x?.hp <= squishyHp

const moveToward = (point, distance) => {
  const dx = point.x - character.x
  const dy = point.y - character.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
  moveDirection = distance > 0 ? 'in' : 'out'
}

const partyUp = () => {
  const partyNames = Object.keys(get_party())
  for (const name of characterNames) {
    if (!partyNames.includes(name)) send_party_invite(name)
  }
}

//
// Hooks
//

on_party_invite = name => {
  if (characterNames.includes(name)) accept_party_invite(name)
}
