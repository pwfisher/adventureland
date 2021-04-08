(function(){
  /**
   * Attacker
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */

  //
  // CONFIG
  //
  const autoAttack = true
  const autoDefend = true
  const autoLoot = true
  const autoPotion = true
  const autoRespawn = true
  const autoStalk = true
  const characterKeys = ['Binger', 'Dinger', 'Finger', 'Zinger']
  const rangeChunk = character.speed
  const rangeRadar = 2000
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const uiBlank = '--'

  //
  // STATE
  //
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out'
  let radar = [] // [{ mob: Entity, range: Number }]
  let whichMob = null

  const resetState = () => {
    mobToAttack = null
    moveDirection = null
    radar = []
    whichMob = null
  }

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }
    if (autoLoot) loot()
    if (autoPotion) use_hp_or_mp()

    //
    // RADAR
    //
    updateRadar()
    const lockMob = get_targeted_monster()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    const nearMob = getNearestMonster()

    //
    // ATTACK
    //
    if (autoAttack && lockMob) {
      whichMob = 'lock'
      mobToAttack = nearMob
    }
    else if (autoDefend && aggroMob) {
      whichMob = 'aggro'
      mobToAttack = lockMob
    }
    else if (autoAttack && nearMob) {
      whichMob = 'near'
      mobToAttack = nearMob
    }
    else if (mobToAttack && mobToAttack.dead) {
      whichMob = null
      mobToAttack = null
    }

    if (can_attack(mobToAttack)) attack(mobToAttack)

    //
    // MOVEMENT
    //
    if (autoStalk && mobToAttack) {
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
        else moveDirection = null
      }
    }

    //
    // UPDATE UI
    //
    const uiRange = radarRange(aggroMob) ? Math.round(radarRange(aggroMob)) : uiBlank
    const uiWhich = 'lock'
    const uiDir = moveDirection || uiBlank
    setMessage(`${uiRange} ${uiWhich} ${uiDir}`)
  }

  //
  // FUNCTIONS
  //
  // "radar" caches "radar ping" (mob, distance) pairs for performance
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

  const getNearestMonster = args => getClosestRadarPing(getRadarPings(args))

  const getClosestRadarPing = pings => pings.reduce(
    (x, o) => o.range < x.range ? o : x,
    { range: Infinity }
  )?.mob

  const getRadarPings = (args = {}) => radar.filter(({ mob }) => {
    if (mob.name === 'Target Automatron') return false
    if (mob.map !== character.map) return
    if (args.is_juicy && mob.xp > mob.hp * 1.5) return false
    if (args.mtype && mob.mtype !== args.mtype) return false
    if (args.min_xp && mob.xp < args.min_xp) return false
    if (args.min_att && mob.attack < args.min_att) return false
    if (args.max_att && mob.attack > args.max_att) return false
    if (args.max_hp && mob.hp > args.max_hp) return false
    if (args.target && mob.target !== args.target) return false
    if (args.no_target && mob.target && mob.target !== character.id) return false
    if (args.path_check && !can_move_to(mob)) return false
    return true
  })

  const moveToward = (point, distance) => {
    if (!can_move_to(point.x, point.y)) return smart_move(point)
    const dx = point.x - character.x
    const dy = point.y - character.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end attacker.js
