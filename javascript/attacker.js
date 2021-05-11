;(function () {
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
  const characterKeys = [
    'Banger',
    'Binger',
    'Dinger',
    'Finger',
    'Hunger',
    'Linger',
    'Longer',
    'Winger',
    'Zinger',
  ]
  const rangeChunk = character.speed
  const rangeRadar = Infinity
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const uiBlank = '--'

  //
  // STATE
  //
  let lastPotion = new Date()
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out'
  let radar = [] // [{ mob: Entity, range: Number }]
  let respawnCalled = false
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
    const { id, rip } = character

    if (rip && autoRespawn && !respawnCalled) {
      respawnCalled = true
      respawn()
      resetState()
    }
    if (rip) return
    else respawnCalled = false

    if (smart.moving) resetState()

    if (autoLoot) loot()
    if (autoPotion) usePotion()

    //
    // RADAR
    //
    updateRadar()
    const lockMob = get_targeted_monster()
    const aggroMob = getNearestMonster({ target: id, min_att: 1 })
    const nearMob = getNearestMonster()

    //
    // ATTACK
    //
    if (autoAttack && lockMob) {
      whichMob = 'lock'
      mobToAttack = nearMob
    } else if (autoDefend && aggroMob) {
      whichMob = 'aggro'
      mobToAttack = lockMob
    } else if (autoAttack && nearMob) {
      whichMob = 'near'
      mobToAttack = nearMob
    } else if (mobToAttack && mobToAttack.dead) {
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
      } else {
        // not moving
        if (radarRange(mobToAttack) > character.range) moveToward(mobToAttack, rangeChunk)
        else moveDirection = null
      }
    }

    //
    // UPDATE
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiDir = moveDirection || uiBlank
    set_message(`${uiRange} atkr ${uiDir}`)
    set(`${character.id}:items`, character.items)
  }

  //
  // FUNCTIONS
  //
  // "radar" caches "radar pings" [{ mob, range }] for performance
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
  const minRange = (a, b) => (a.range < b.range ? a : b)
  const getClosestRadarPing = pings => pings.reduce(minRange, { range: Infinity })?.mob
  const getNearestMonster = args => getClosestRadarPing(getRadarPings(args))

  const getRadarPings = (args = {}) =>
    radar.filter(({ mob }) => {
      // if (mob.name === 'Target Automatron') return
      if (mob.map !== character.map) return
      if (args.aggro && mob.aggro <= 0.1) return
      if (args.is_juicy && mob.xp < mob.hp * 2) return
      if (args.mtype && mob.mtype !== args.mtype) return
      if (args.min_xp && mob.xp < args.min_xp) return
      if (args.min_att && mob.attack < args.min_att) return
      if (args.max_att && mob.attack > args.max_att) return
      if (args.max_hp && mob.hp > args.max_hp) return
      if (args.target && mob.target !== args.target) return
      if (args.no_target && mob.target && mob.target !== character.id) return
      if (args.path_check && !can_move_to(mob)) return
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

  function usePotion() {
    if (safeties && mssince(lastPotion) < min(200, character.ping * 3)) return
    if (isOnCooldown('use_hp')) return // use_mp shares use_hp cooldown somehow
    const hpPotionAmount = 400
    const mpPotionAmount = 500
    const mpRatio = character.mp / character.max_mp
    const mpLost = character.max_mp - character.mp
    const hpLost = character.max_hp - character.hp
    let used = true
    if (mpRatio < 0.2) use_skill('use_mp')
    else if (hpLost > hpPotionAmount) use_skill('use_hp')
    else if (mpLost > mpPotionAmount) use_skill('use_mp')
    else if (hpLost) use_skill('regen_hp')
    else if (mpLost) use_skill('regen_mp')
    else used = false
    if (used) lastPotion = new Date()
  }

  function isOnCooldown(skill) {
    const cooldownKey = G.skills[skill]?.share ?? skill
    return (
      character.q[cooldownKey] ||
      (parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey])
    )
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end attacker.js
