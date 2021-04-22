;(function () {
  /**
   * Healer
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const isMeleeType = player => ['warrior', 'rogue', 'paladin'].includes(player.ctype)

  //
  // CONFIG
  //
  const autoAttack = true
  let autoAvoidWillAggro = true
  const autoDefend = true
  const autoFollow = true
  const autoHeal = true
  let autoHostile = false
  const autoKite = !isMeleeType(character)
  const autoLoot = true
  const autoMelee = isMeleeType(character)
  let autoMob = ''
  const autoPotion = true
  let autoPriority = false
  const autoRespawn = true
  const autoSquish = true
  const autoStalk = true
  const characterKeys = [
    'Banger',
    'Binger',
    'Dinger',
    'Finger',
    'Hunger',
    'Linger',
    'Longer',
    'Zinger',
  ]
  const injuredAt = 0.8
  let priorityMobTypes = []
  const rangeChunk = character.speed
  const rangeFollow = 10
  const rangeRadar = Infinity
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const uiBlank = '--'

  smart.use_town = false

  //
  // STATE
  //
  let kitingMob = null
  let lastPotion = new Date()
  let leader
  let leaderSmart
  let mobs = {}
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'map'
  let radar = [] // [{ mob: Entity, range: Number }]
  let whichMob = null

  const resetState = () => {
    kitingMob = null
    mobs = {}
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
    ;({ character: leader, smart: leaderSmart } = get('leader-state') ?? {})
    ;({ autoAvoidWillAggro, autoHostile, autoMap, autoMob, autoPriority, priorityMobTypes } =
      get('follower-config') || {})

    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }
    if (smart.moving) resetState()

    if (autoLoot) loot()
    if (autoPotion) usePotion()

    //
    // HEAL
    //
    const injuredList = parent.party_list.map(key => parent.entities[key]).filter(isInjured)
    if (isInjured(character)) injuredList.push(character)

    if (autoHeal && injuredList.length && !isOnCooldown('partyheal')) use_skill('partyheal')

    //
    // RADAR
    //
    updateRadar()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    const hostileMob = getNearestHostile()
    const lockMob = get_targeted_monster()
    const partyMob = getNearestMonster({ target: leader?.id }) // should include any party member targeted
    const priorityMob = getPriorityMob()
    const squishyMob = getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.95 })
    const willAggroMob = getNearestMonster({ aggro: true, min_att: 1 })
    mobs = {
      aggroMob,
      hostileMob,
      kitingMob,
      lockMob,
      partyMob,
      priorityMob,
      squishyMob,
      willAggroMob,
    }
    if (!aggroMob) kitingMob = null
    const canSquish =
      autoSquish && squishyMob && is_in_range(squishyMob, 'attack') && !isOnCooldown('attack')

    //
    // ATTACK
    //
    if (hostileMob && autoHostile) whichMob = 'hostile'
    else if (priorityMob && autoPriority) whichMob = 'priority'
    else if (
      lockMob?.visible &&
      iAmTargetOf(lockMob) &&
      (autoAttack || autoDefend) &&
      (autoStalk || autoKite || radarRange(lockMob) < character.range)
    )
      whichMob = 'lock'
    else if (aggroMob && autoDefend) whichMob = 'aggro'
    else if (partyMob && autoAttack) whichMob = 'party'
    else whichMob = canSquish ? 'squishy' : null
    mobToAttack = mobs[`${whichMob}Mob`]

    if (
      can_attack(mobToAttack) &&
      (autoMelee ||
        ['priority', 'hostile', 'leader', 'lock', 'aggro', 'squishy'].includes(whichMob) ||
        radarRange(mobToAttack) > safeRangeFor(mobToAttack))
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    if (autoMap && character.map !== autoMap) smartMove(autoMap)
    else if (autoMob && !getNearestMonster({ type: autoMob })) smartMove(autoMob)
    else if (aggroMob && (kitingMob || autoKite) && radarRange(aggroMob) <= safeRangeFor(aggroMob))
      kite(aggroMob)
    else if (
      autoAvoidWillAggro &&
      willAggroMob &&
      radarRange(willAggroMob) <= safeRangeFor(willAggroMob) &&
      (!autoMelee || willAggroMob !== mobToAttack)
    )
      moveToward(willAggroMob, -rangeChunk)
    else if (autoStalk && mobToAttack && whichMob !== 'squishy') {
      if (
        (moveDirection === 'in' &&
          radarRange(mobToAttack) <= Math.max(rangeStalk[1], safeRangeFor(mobToAttack))) ||
        (moveDirection === 'out' &&
          radarRange(mobToAttack) >= Math.max(rangeStalk[0], safeRangeFor(mobToAttack)))
      )
        followOrStop()
      // in goldilocks zone
      else if (!autoMelee && radarRange(mobToAttack) <= safeRangeFor(mobToAttack))
        moveToward(mobToAttack, -rangeChunk)
      else if (radarRange(mobToAttack) > character.range) moveToward(mobToAttack, rangeChunk)
      else followOrStop()
    } else followOrStop()

    //
    // UPDATE UI
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = smart.moving ? 'smart' : kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)
  }

  //
  // FUNCTIONS
  //
  const isInjured = mob => mob && mob.hp < injuredAt * mob.max_hp && !mob.rip

  const followOrStop = () => {
    const map = leaderSmart.moving ? leaderSmart.map : leader?.map
    if (map === 'bank') return
    const leaderGoingTo = { map, x: leader?.going_x, y: leader?.going_y }
    const rangeLeaderGoingTo = leader && distance(character, leaderGoingTo)
    if (autoFollow && leader.map !== character.map) smartMove(leader.map)
    else if (autoFollow && rangeLeaderGoingTo > rangeFollow)
      moveToward(leaderGoingTo, Math.min(rangeChunk, rangeLeaderGoingTo))
    else stopMoving()
  }

  const stopMoving = () => {
    stop()
    moveDirection = null
  }

  const kite = mob => {
    kitingMob = mob
    moveToward(mob, -rangeChunk)
  }

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

  const getPriorityMob = () =>
    priorityMobTypes.map(type => getRadarPings({ type })).reduce(minRange, { range: Infinity })?.mob

  const getNearestHostile = args => null // todo

  const iAmTargetOf = mob => mob?.target === character.id
  const isSquishy = mob => mob?.hp < character.attack * 0.95

  const moveToward = (mob, distance) => {
    if (mob.map !== undefined && mob.map !== character.map) return
    if (!can_move_to(mob.x, mob.y)) return smartMove(mob)
    const [x, y] = unitVector(character, mob)
    const safeDistance =
      radarRange(mob) && !autoMelee
        ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed)
        : distance
    move(character.x + x * safeDistance, character.y + y * safeDistance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  const safeRangeFor = mob => {
    if (autoMelee && mob === mobToAttack) return 0
    if (mob.attack === 0 || (mob.target && mob.target !== character.id) || isSquishy(mob)) return 0
    return mob.range + mob.speed
  }

  const smartMove = (destination, on_done) => {
    moveDirection = 'smart'
    if (!smart.moving) smart_move(destination, on_done)
  }

  function unitVector(from, to) {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    return [dx / magnitude, dy / magnitude]
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
    return parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey]
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end healer.js
