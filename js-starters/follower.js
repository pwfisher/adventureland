(function(){
  /**
   * Follower
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const isMeleeType = character => ['warrior', 'rogue'].includes(character.ctype)

  //
  // CONFIG
  //
  const autoAttack = true
  const autoDefend = true
  const autoFollow = true
  const autoKite = !isMeleeType(character)
  const autoLoot = true
  const autoPotion = true
  const autoRespawn = true
  const autoSquish = true
  const autoStalk = true
  const characterKeys = ['Binger', 'Dinger', 'Finger', 'Zinger']
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
  let leaderKey
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'map'
  let radar = [] // [{ mob: Entity, range: Number }]
  let whichMob = null

  const resetState = () => {
    kitingMob = null
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
    ({ character: leader, smart: leaderSmart } = get('leader-state') ?? {})
    leaderKey = leader?.id

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
    const rageMob = getNearestMonster({ rage: true, min_att: 1 })
    const partyMob = getNearestMonster({ target: leaderKey }) // should include any party member targeted
    const squishyMob = getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.95 }) // exclude negative xp (puppies)
    const leadPlayer = get_player(leaderKey)

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

    if (kitingMob && !aggroMob) stopKiting()

    if ((kitingMob || autoKite) && aggroMob && radarRange(aggroMob) <= safeRangeFor(aggroMob)) kite(aggroMob)
    else if (rageMob && radarRange(rageMob) <= safeRangeFor(rageMob)) moveToward(rageMob, -rangeChunk)
    else if (autoStalk && mobToAttack && whichMob !== 'squishy') {
      if (is_moving(character)) {
        if (
          (moveDirection === 'in' && radarRange(mobToAttack) <= Math.max(rangeStalk[1], safeRangeFor(mobToAttack))) ||
          (moveDirection === 'out' && radarRange(mobToAttack) >= Math.max(rangeStalk[0], safeRangeFor(mobToAttack)))
        ) {
          stop() // in goldilocks zone
          moveDirection = null
        }
      } else { // not moving
        if (radarRange(mobToAttack) > character.range) moveToward(mobToAttack, rangeChunk)
        else if (autoKite && radarRange(mobToAttack) <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
        else moveDirection = null
      }
    }
    else if (autoFollow && !is_moving(character)) {
      if (!leadPlayer) travelTo(leaderKey)
      else if (rangeLeader > rangeFollow) moveToward(leadGoingTo, Math.min(rangeChunk, rangeLeader))
      else moveDirection = null
    }

    //
    // UPDATE UI
    //
    const uiRange = radarRange(aggroMob) ? Math.round(radarRange(aggroMob)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)
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

  const iAmTargetOf = mob => mob?.target === character.id
  const isSquishy = mob => mob?.hp < character.attack * 0.95

  const moveToward = (mob, distance) => {
    if (!can_move_to(mob.x, mob.y)) return smart_move(mob)
    const dx = mob.x - character.x
    const dy = mob.y - character.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    const safeDistance = radarRange(mob) ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed) : distance
    console.log({ radarRange: radarRange(mob), safeDistance, mobSpeed: mob.speed, mySpeed: character.speed, myRange: character.range, mobRange: mob.range })
    move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * safeDistance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  const safeRangeFor = mob => {
    if (mob.attack === 0 || mob.target && mob.target !== character.id || isSquishy(mob)) return 0
    return mob.range + mob.speed
  }

  const travelTo = name => {
    const o = get_party()[name]
    if (o && (o.in === o.map || o.in === character.in)) smart_move(o)
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end follower.js
