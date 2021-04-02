/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const meleeChar = ['warrior', 'rogue'].includes(character.ctype)

//
// CONFIG
//
const autoDefend = true
const autoKite = !meleeChar
const autoRespawn = true
const autoStalk = true
const rangeChunk = character.speed * 1.0
const rangeMelee = character.range * 0.5
const rangeStalk = character.range * 0.9
const squishyHp = character.attack * 0.95 // "squishy" = one-shot kill
const tickDelay = 250

//
// STATE
//
let moveDirection = 'stop' // 'stop' | 'in' | 'out'

//
// TICK
//
setInterval(tick, tickDelay)
function tick() {
  if (autoRespawn && character.rip) respawn()
  if (character.rip) return
  use_hp_or_mp()
  loot()

  //
  // ATTACK
  //
  const mobToAttack = get_targeted_monster() || get_nearest_monster()
  if (can_attack(mobToAttack)) attack(mobToAttack)

  //
  // MOVEMENT
  //
  if (autoStalk && mobToAttack) {
    if (!is_moving(character)) {
      if (!is_in_range(mobToAttack, 'attack')) moveToward(mobToAttack, rangeChunk)
      else if (distance(character, mobToAttack) <= rangeMelee && !meleeChar)
        moveToward(mobToAttack, -rangeChunk)
    } else if (
      distance(character, mobToAttack) > rangeMelee &&
      distance(character, mobToAttack) <= rangeStalk
    ) {
      stop() // in goldilocks zone
      moveDirection = 'stop'
    }
  }

  //
  // UPDATE UI
  //
  set_message(`lock · ${moveDirection}`)
}

//
// FUNCTIONS
//

const moveToward = (point, distance) => {
  const dx = point.x - character.x
  const dy = point.y - character.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
  moveDirection = distance > 0 ? 'in' : 'out'
}

//
// Hooks
//

on_party_invite = name => {
  if (characterNames.includes(name)) accept_party_invite(name)
}
