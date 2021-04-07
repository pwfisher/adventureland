(function(){
  /**
   * Follower
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
  const autoFollow = true
  const autoKite = !meleeChar
  const autoMap = get('follower-config')?.autoMap
  const autoRespawn = true
  const autoSquish = true
  const autoStalk = true
  const leaderName = get('follower-config')?.leaderName || 'Finger'
  const rangeChunk = character.speed
  const rangeFollow = 20
  const rangeRadar = 2000
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const uiBlank = '--'

  //
  // STATE
  //
  let kitingMob = null
  let leader
  let leaderSmart
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'map'
  let whichMob = null

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    ({ leader, leaderSmart } = get('leader-state') ?? {})

    if (character.rip) {
      kitingMob = null
      mobToAttack = null
      moveDirection = null
      whichMob = null
      if (autoRespawn && character.rip) respawn()
      return
    }
    use_hp_or_mp()
    loot()
    accept_magiport(leaderName)

    //
    // RADAR
    //
    updateRadar()
    const lockMob = get_targeted_monster()
    const aggroMob = getNearestMonster({ target: character.name, min_att: 1 })
    const meanMob = getNearestMonster({ mean: true, min_att: 1 })
    const partyMob = getNearestMonster({ target: leaderName }) // should include any party member targeted
    const squishyMob = getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.95 }) // exclude negative xp (puppies)
    const leadPlayer = get_player(leaderName)

    //
    // ATTACK
    //
    if (
      iAmTargetOf(lockMob) &&
      (autoAttack || autoDefend) &&
      (autoStalk || radarRange(lockMob) < character.range)
    ) {
      whichMob = 'lock'
      mobToAttack = lockMob
    } else if (aggroMob && autoDefend) {
      whichMob = 'aggro'
      mobToAttack = aggroMob
    } else if (partyMob && autoAttack) {
      whichMob = 'party'
      mobToAttack = partyMob
    } else if (squishyMob && autoSquish && is_in_range(squishyMob, 'attack')) {
      whichMob = 'squishy'
      mobToAttack = squishyMob
    } else {
      whichMob = null
      mobToAttack = null
    }

    if (can_attack(mobToAttack)) attack(mobToAttack)

    //
    // MOVEMENT
    //
    const leadGoingTo = { x: leadPlayer?.going_x, y: leadPlayer?.going_y }
    const rangeLeader = leadPlayer && distance(character, leadGoingTo)
    const targetMap = getTargetMap()
    console.log('a', { map: character.map, targetMap })

    if (kitingMob && !aggroMob) stopKiting()
    if (!is_moving(character)) moveDirection = null

    if (moveDirection = 'map') {}
    else if (autoMap && character.map && targetMap && character.map !== targetMap) {
      // moveDirection = 'map'
      console.log('b', { map: character.map, targetMap })
      smart_move(targetMap)
    }
    else if ((kitingMob || autoKite) && aggroMob && radarRange(aggroMob) <= safeRangeFor(aggroMob)) kite(aggroMob)
    else if (autoStalk && mobToAttack && whichMob !== 'squishy') {
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
        else if (meanMob && radarRange(meanMob) <= safeRangeFor(meanMob)) moveToward(meanMob, -rangeChunk)
        else if (!meleeChar && radarRange(mobToAttack) <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
        else moveDirection = null
      }
    }
    else if (autoFollow && !is_moving(character)) {
      if (rangeLeader > rangeFollow) {
        moveToward(leadGoingTo, Math.min(rangeChunk, rangeLeader))
        moveDirection = 'follow'
      }
      else moveDirection = null
    }

    //
    // UPDATE UI
    //
    const uiRange = radarRange(aggroMob) ? Math.round(radarRange(aggroMob)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = kitingMob ? 'kite' : moveDirection ? moveDirection : uiBlank
    set_message(`${uiRange} · ${uiWhich} · ${uiDir}`)

    //
    // UPDATE LOCAL STORAGE
    //
    set('leader-state', { character, mobToAttack, smart, whichMob })
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

  // "radar" caches "radar ping" (mob, distance) pairs for performance
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
    if (args.no_target && mob.target && mob.target !== character.name) return false
    if (args.path_check && !can_move_to(mob)) return false
    return true
  })

  const getTargetMap = () => {
    if (leaderSmart?.moving) return leaderSmart.map
    if (leader?.map && leader.map !== character.map) return leader.map
    return autoMap || character.map
  }

  const iAmTargetOf = x => x?.target === character.id

  const moveToward = (point, distance) => {
    if (!can_move_to(point.x, point.y)) return smart_move(point)
    const dx = point.x - character.x
    const dy = point.y - character.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  const safeRangeFor = mob => mob.attack === 0 ? 0 : mob.range * 1.3 + 0.5 * mob.speed

  //
  // Hooks
  //
  on_party_invite = name => {
    if (name === leaderName) accept_party_invite(name)
  }
})()
// end follower.js
