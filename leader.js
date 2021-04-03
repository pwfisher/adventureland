/*
 * Leader
 *
 * @author Patrick Fisher <patrick@pwfisher.com>
 * @see https://github.com/kaansoral/adventureland
 */
const meleeChar = ['warrior', 'rogue'].includes(character.ctype)
const uiBlank = '--'

//
// CONFIG
//
const autoAttack = true
const autoDefend = true
const autoKite = !meleeChar
const autoParty = true
const autoRespawn = true
const autoSquish = true
const autoStalk = true
const characterNames = ['Binger', 'Finger', 'Zinger']
const preyAtkMax = 1000
const preyXpMin = 1
const rangeChunk = character.speed
const rangeClose = Math.min(50, character.range * 0.9)
const rangeRadar = 2000
const rangeStalk = [character.range * 0.7, character.range * 0.9]
const squishyHp = character.attack * 0.95 // "squishy" = one-shot kill
const tickDelay = 250

//
// STATE
//
let kitingMob = null
let moveDirection = null // null | 'in' | 'out' | 'kite'
let whichMob = null
let mobToAttack = null

//
// TICK
//
setInterval(tick, tickDelay)
function tick() {
  if (autoParty) partyUp()
  if (autoRespawn && character.rip) respawn()
  if (character.rip) return
  use_hp_or_mp()
  loot()

  //
  // RADAR
  //
  const lockMob = get_targeted_monster()
  const aggroMob = getNearestMonster({ target: character.name })
  const preyMob = getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax, path_check: true })
  const squishyMob = getNearestMonster({ min_xp: 1, max_hp: squishyHp }) // exclude negative xp (puppies)
  // const xpMob = getXpestMonster() // TODO? factor in xp (e.g. prefer froggy over tortoise)

  //
  // ATTACK
  //
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
  } else if (mobToAttack && mobToAttack.dead) {
    whichMob = null
    mobToAttack = null
  }

  if (
    can_attack(mobToAttack) &&
    // ranged chars, don’t draw prey aggro in enemy range
    (meleeChar || whichMob !== 'prey' || distance(character, mobToAttack) > rangeClose)
  ) {
    attack(mobToAttack)
  }

  //
  // MOVEMENT
  //
  const rangeMobToAttack = mobToAttack && distance(character, mobToAttack)
  const rangeAggroMob = aggroMob ? distance(character, aggroMob) : null

  if (kitingMob && !aggroMob) stopKiting()

  if ((kitingMob || (autoKite && aggroMob)) && rangeAggroMob <= safeRangeFor(aggroMob)) kite(aggroMob)
  else if (autoStalk && mobToAttack) {
    if (is_moving(character)) {
      if (
        (moveDirection === 'in' && rangeMobToAttack <= rangeStalk[1]) ||
        (moveDirection === 'out' && rangeMobToAttack >= rangeStalk[0])
      ) {
        stop() // in goldilocks zone
        moveDirection = null
      }
    } else { // not moving
      if (rangeMobToAttack > character.range) moveToward(mobToAttack, rangeChunk)
      else if (!meleeChar && rangeMobToAttack <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
      else moveDirection = null
    }
  }

  //
  // UPDATE UI
  //
  const uiRange = rangeAggroMob ? Math.round(rangeAggroMob) : uiBlank
  const uiWhich = whichMob || uiBlank
  const uiDir = kitingMob ? 'kite' : moveDirection || uiBlank
  set_message(`${uiRange} · ${uiWhich} · ${uiDir}`)
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
  moveDirection = null
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

const isPrey = x => x?.attack <= preyAtkMax

const isSquishy = x => x?.hp <= squishyHp

const moveToward = (point, distance) => {
  const dx = point.x - character.x
  const dy = point.y - character.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
  moveDirection = distance > 0 ? 'in' : 'out'
}

function partyUp() {
  const partyNames = Object.keys(get_party())
  for (const name of characterNames) {
    if (!partyNames.includes(name)) send_party_invite(name)
  }
}

const safeRangeFor = mob => mob.range * 1. + 0.5 * mob.speed

//
// Hooks
//

on_party_invite = name => {
  if (characterNames.includes(name)) accept_party_invite(name)
}
