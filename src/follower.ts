(function(){
  /**
   * Follower
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const meleeChar = ['warrior', 'rogue'].includes(character.ctype)
  const closest = (x, o) => o.range < x.range ? o : x // deprecated, renamed minRange

  //
  // CONFIG
  //
  const autoAttack = true
  const autoDefend = true
  const autoFollow = true
  const autoHostile = get('follower-config')?.autoHostile
  const autoKite = !meleeChar
  const autoPriority = get('follower-config')?.autoPriority
  const autoRespawn = true
  const autoSquish = true
  const autoStalk = true
  const characterKeys = get('follower-config')?.characterKeys || []
  const leaderKey = get('follower-config')?.leaderKey
  const rangeChunk = character.speed
  const rangeFollow = 20
  const rangeRadar = 2000
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const uiBlank = '--'

  // computed config (oxymoron?)
  const friendNames = characterKeys.filter(x => x !== character.id)

  //
  // STATE
  //
  let kitingMob = null
  let leader
  let leaderMob
  let leaderSmart
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'map'
  let whichMob = null

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    ({ character: leader, mobToAttack: leaderMob, smart: leaderSmart } = get('leader-state') || {})

    if (character.rip) {
      kitingMob = null
      mobToAttack = null
      moveDirection = null
      whichMob = null
      if (autoRespawn) respawn()
      return
    }
    use_hp_or_mp()
    loot()
    accept_magiport(leaderKey)

    //
    // RADAR
    //
    updateRadar()
    const radarMobs = {
      aggro: getNearestMonster({ target: character.id, min_att: 1 }),
      hostile: getNearestHostile(),
      juicy: getNearestMonster({ is_juicy: true }),
      leader: leaderMob,
      lock: get_targeted_monster(),
      friend: friendNames.map(x => getRadarPings({ target: x })).reduce(closest, { range: Infinity })?.mob,
      prey: getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax }),
      priority: getPriorityMob(),
      rage: getNearestMonster({ rage: true, min_att: 1 }),
      squishy: getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.9 }),
    }
    const canSquish = radarMobs.squishy && autoSquish && is_in_range(radarMobs.squishy, 'attack') && !character.q.attack

    //
    // ATTACK
    //
    // TODO leaderMob
    if (radarMobs.priority && autoPriority)
      whichMob = 'priority'
    else if (radarMobs.hostile && autoHostile)
      whichMob = 'hostile'
    else if (radarMobs.lock.visible && iAmTargetOf(radarMobs.lock) && (autoAttack || autoDefend) && (autoStalk || autoKite || radarRange(radarMobs.lock) < character.range))
      whichMob = 'lock'
    else if (radarMobs.aggro && autoDefend)
      whichMob = 'aggro'
    else if (leaderMob)
      whichMob = 'leader'
    else if (smart.moving)
      whichMob = canSquish ? 'squishy' : null
    else if (radarMobs.friend && autoAttack)
      whichMob = 'friend'
    else if (radarMobs.juicy && autoAttack && radarRange(radarMobs.juicy) < (character.range + character.speed))
      whichMob = 'juicy'
    else if (radarMobs.prey && autoAttack && (!autoRest || character.hp > character.max_hp * 0.9) && isSafePrey(radarMobs.prey))
      whichMob = 'prey'
    else
      whichMob = canSquish ? 'squishy' : null
    mobToAttack = radarMobs[whichMob]
    if (
      can_attack(mobToAttack) &&
      (radarRange(mobToAttack) > safeRangeFor(mobToAttack) || meleeChar || iAmTargetOf(mobToAttack))
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    const leadGoingTo = { x: leader?.going_x, y: leader?.going_y }
    const rangeLeader = leader && distance(character, leadGoingTo) // not radarRange(leader)
    const leaderMap = leaderSmart?.moving ? leaderSmart.map : leader?.map

    if (kitingMob && !radarMobs.aggro) stopKiting()

    if (autoFollow && leadercharacter.map !== targetMap)
      if (!smart.moving) smart_move(targetMap)
    else if ((kitingMob || autoKite) && radarMobs.aggro && radarRange(radarMobs.aggro) <= safeRangeFor(radarMobs.aggro)) kite(radarMobs.aggro)
    else if (autoStalk && mobToAttack && mobToAttack.map === character.map) {
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
        else if (radarMobs && radarRange(radarMobs) <= safeRangeFor(radarMobs)) moveToward(radarMobs, -rangeChunk)
        else if (!meleeChar && radarRange(mobToAttack) <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
        else moveDirection = null
      }
    }
    else if (autoFollow && !is_moving(character)) {
      if (leader.map !== character.map) {
        smart_move({ map: leader.map, x: leader.real_x, y: leader.real_y })
        moveDirection = 'map'
      }
      else if (rangeLeader > rangeFollow) {
        moveToward(leadGoingTo, Math.min(rangeChunk, rangeLeader))
        moveDirection = 'follow'
      }
      else moveDirection = null
    }

    //
    // UPDATE UI
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = kitingMob ? 'kite' : (moveDirection ? moveDirection : uiBlank)    set_message(`${uiRange} · ${uiWhich} · ${uiDir}`)
  }

  //
  // FUNCTIONS
  //

  // see leader for fancy implementation
  const kite = mob => {
    kitingMob = mob
    moveToward(mob, -rangeChunk)
  }

  const stopKiting = () => {
    stop()
    kitingMob = null
    moveDirection = null
  }

  // "radar" caches "radar ping" (mob, range) pairs for performance
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
    if (args.no_target && mob.target && mob.target !== character.id) return false
    if (args.path_check && !can_move_to(mob)) return false
    return true
  })

  const iAmTargetOf = x => x?.target === character.id

  const moveToward = (point, distance) => {
    if (point.map !== character.map) return
    if (!can_move_to(point)) return smart_move(point)
    const [x, y] = unitVector(character, point)
    move(character.x + x * distance, character.y + y * distance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  const movePerpendicularTo = (point, distance) => {
    const [x, y] = unitVector(character, point)
    moveToward({ map: point.map, x: character.real_x - y, y: character.real_y + x }, distance)
  }

  const safeRangeFor = mob => {
    if (mob.attack === 0 || mob.target && mob.target !== character.id) return 0
    return mob.range * 1.3 + 0.5 * mob.speed
  }

  const unitVector = (from, to) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    return [dx / magnitude, dy / magnitude]
  }

  //
  // Hooks
  //

  on_party_invite = key => {
    if (name === leaderKey) accept_party_invite(name)
  }

})()
