/*
 * Leader
 *
 * @author Patrick Fisher <patrick@pwfisher.com>
 * @see https://github.com/kaansoral/adventureland
 */
const meleeChar = ['warrior', 'rogue'].includes(character.ctype)

//
// CONFIG
//
const autoAttack = true
const autoDefend = true
const autoKite = !meleeChar && false
const autoParty = true
const autoRespawn = true
const autoSquish = true
const autoStalk = true
const characterNames = ['Binger', 'Finger', 'Zinger']
const preyAtkMax = 500
const preyXpMin = 1
const rangeChunk = character.speed
const rangeClose = Math.min(50, character.range * 0.9)
const rangeRadar = 2000
const rangeStalk = [character.range * 0.7, character.range * 0.9]
const squishyHp = character.attack * 0.95 // "squishy" = one-shot kill
const tickDelay = 250
const uiBlank = '--'

// computed config
const followerNames = characterNames.filter(x => x !== character.name)

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
  updateRadar()
  const lockMob = get_targeted_monster()
  const aggroMob = getNearestMonster({ target: character.name })
  const meanMob = getNearestMonster({ mean: true })
  const preyMob = getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax })
  const squishyMob = getNearestMonster({ min_xp: 1, max_hp: squishyHp }) // exclude negative xp (puppies)

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
  if (kitingMob && !aggroMob) stopKiting()

  if ((kitingMob || (autoKite && aggroMob)) && radarRange(aggroMob) <= safeRangeFor(aggroMob)) kite(aggroMob)
  else if (autoStalk && mobToAttack) {
    if (is_moving(character)) {
      if (
        (moveDirection === 'in' && radarRange(mobToAttack) <= rangeStalk[1]) ||
        (moveDirection === 'out' && radarRange(mobToAttack) >= rangeStalk[0])
      ) {
        stop() // in goldilocks zone
        moveDirection = null
      }
    } else { // not moving
      if (radarRange(mobToAttack) > character.range) moveToward(mobToAttack, rangeChunk)
      else if (radarRange(meanMob) <= safeRangeFor(meanMob)) moveToward(meanMob, -rangeChunk)
      else if (autoKite && radarRange(mobToAttack) <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
      else moveDirection = null
    }
  }

  //
  // UPDATE UI
  //
  const uiRange = radarRange(aggroMob) ? Math.round(radarRange(aggroMob)) : uiBlank
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

// "radar" caches distances for performance
let radar = []
const updateRadar = () => {
  radar = []
  for (id in parent.entities) {
    const mob = parent.entities[id]
    if (mob.type !== 'monster' || !mob.visible || mob.dead) continue
    const range = distance(character, mob)
    if (range > rangeRadar) continue
    radar.push({ mob, range })
  }
}
const radarRange = mob => radar.find(o => o.mob === mob)?.range

const getNearestMonster = (args = {}) => {
  let min_d = rangeRadar,
    result = null
  radar.forEach(({ mob, range }) => {
    if (args.mtype && mob.mtype !== args.mtype) return
    if (args.min_xp && mob.xp < args.min_xp) return
    if (args.max_att && mob.attack > args.max_att) return
    if (args.max_hp && mob.hp > args.max_hp) return
    if (args.target && mob.target !== args.target) return
    if (args.no_target && mob.target && mob.target !== character.name) return
    if (args.path_check && !can_move_to(mob)) return
    if (range < min_d) (min_d = range), (result = mob)
  })
  return result
}

const iAmTargetOf = x => x?.target === character.id

const isPrey = x => x?.attack <= preyAtkMax

const isSquishy = x => x?.hp <= squishyHp

const moveToward = (point, distance) => {
  if (!can_move_to(point.x, point.y)) smart_move(point)
  const dx = point.x - character.x
  const dy = point.y - character.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
  moveDirection = distance > 0 ? 'in' : 'out'
}

function partyUp() {
  const partyNames = Object.keys(get_party())
  for (const name of followerNames) {
    if (!partyNames.includes(name)) send_party_invite(name)
  }
}

const safeRangeFor = mob => mob.range * 1.3 + 0.5 * mob.speed

//
// Hooks
//

// handle_command = (command, _arg) => {
//   const { map, x, y } = character
//   if (command === 'smart_follow') send_cm(followerNames, { 'task': 'move', map, x, y })
// }

on_party_invite = name => {
  if (characterNames.includes(name)) accept_party_invite(name)
}
