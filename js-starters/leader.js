(function(){
  /**
   * Leader
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
  const autoHostile = false
  const autoKite = !isMeleeType(character)
  const autoLoot = true
  const autoMap = 'arena' // 'arena'
  const autoMelee = isMeleeType(character)
  const autoMob = '' // 'bat'
  const autoParty = true
  const autoPotion = true
  const autoPriority = true
  const autoRespawn = true
  const autoRest = false
  const autoSquish = true
  const autoStalk = true
  const characterKeys = ['Binger', 'Dinger', 'Finger', 'Zinger']
  const codeFollower = 'Follower'
  const preyAtkMax = 1000
  const preyXpMin = 300
  const priorityMobTypes = ['greenjr', 'wabbit']
  const rangeChunk = character.speed
  const rangeRadar = 2000
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const timeStartup = 7000
  const uiBlank = '--'
  
  set('follower-config', {
    autoMap,
    autoMob,
    autoHostile,
    autoPriority,
    priorityMobTypes,
  })

  // computed config
  const followerNames = characterKeys.filter(x => ![character.id, 'Dinger'].includes(x))
  
  //
  // STATE
  //
  let kitingMob = null
  let mobs = {}
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out'
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
  // INIT
  //
  if (autoParty) startFollowers()

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    const { character: characterLast } = get('leader-state') ?? {}
    const hasMoved = character.real_x !== characterLast.real_x || character.real_y !== characterLast.real_y

    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }
    if (smart.moving) resetState()

    if (autoLoot) loot()
    if (autoParty) partyUp()
    if (autoPotion) use_hp_or_mp()

    //
    // RADAR
    //
    updateRadar()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    const hostileMob = getNearestHostile()
    const juicyMob = getNearestMonster({ is_juicy: true })
    const lockMob = get_targeted_monster()
    const partyMob = null // not implemented
    const preyMob = getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax })
    const priorityMob = getPriorityMob()
    const squishyMob = getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.95 })
    const willAggroMob = getNearestMonster({ aggro: true, min_att: 1 })
    mobs = {
      aggroMob,
      hostileMob,
      juicyMob,
      kitingMob,
      lockMob,
      partyMob,
      preyMob,
      priorityMob,
      squishyMob,
      willAggroMob,
    }
    if (!aggroMob) kitingMob = null
    const canSquish = autoSquish && squishyMob && is_in_range(squishyMob, 'attack') && !character.q.attack

    //
    // ATTACK
    //
    if (priorityMob && autoPriority)
      whichMob = 'priority'
    else if (hostileMob && autoHostile)
      whichMob = 'hostile'
    else if (lockMob?.visible && iAmTargetOf(lockMob) && (autoAttack || autoDefend) && (autoStalk || autoKite || radarRange(lockMob) < character.range))
      whichMob = 'lock'
    else if (aggroMob && autoDefend)
      whichMob = 'aggro'
    else if (partyMob && autoAttack)
      whichMob = 'party'
    else if (smart.moving)
      whichMob = canSquish ? 'squishy' : null
    else if (juicyMob && autoAttack && radarRange(juicyMob) < (character.range + character.speed))
      whichMob = 'juicy'
    else if (preyMob && autoAttack && (!autoRest || character.hp > character.max_hp * 0.9) && isSafePrey(preyMob))
      whichMob = 'prey'
    else
      whichMob = canSquish ? 'squishy' : null
    mobToAttack = mobs[`${whichMob}Mob`]

    if (
      can_attack(mobToAttack) &&
      (
        autoMelee ||
        ['priority', 'hostile', 'lock', 'aggro', 'squishy'].includes(whichMob) ||
        radarRange(mobToAttack) > safeRangeFor(mobToAttack)
      )
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    if (autoMap && character.map !== autoMap)
      dropItAndGoTo(autoMap)
    else if (autoMob && !getNearestMonster({ type: autoMob }))
      dropItAndGoTo(autoMob)
    else if (!smart.moving && moveDirection && !hasMoved) {
      game_log('we look stuck. escape!')
      // todo magiport escape?
      const escapeMob = mobToAttack ?? willAggroMob ?? aggroMob
      if (escapeMob) smartMoveToward(escapeMob, distance(character, escapeMob) + safeRangeFor(escapeMob) + character.speed)
    }
    else if (aggroMob && (kitingMob || autoKite) && radarRange(aggroMob) <= safeRangeFor(aggroMob))
      kite(aggroMob)
    else if (willAggroMob && radarRange(willAggroMob) <= safeRangeFor(willAggroMob))
      moveToward(willAggroMob, -rangeChunk)
    else if (autoStalk && mobToAttack && whichMob !== 'squishy') {
      if (
        moveDirection === 'in' && radarRange(mobToAttack) <= Math.max(rangeStalk[1], safeRangeFor(mobToAttack)) ||
        moveDirection === 'out' && radarRange(mobToAttack) >= Math.max(rangeStalk[0], safeRangeFor(mobToAttack))
      ) {
        stop() // in goldilocks zone
        moveDirection = null
      }
      else if (autoKite && radarRange(mobToAttack) <= safeRangeFor(mobToAttack))
        moveToward(mobToAttack, -rangeChunk)
      else if (radarRange(mobToAttack) > character.range)
        moveToward(mobToAttack, rangeChunk)
      else
        moveDirection = null
    }
    else
      moveDirection = null

    //
    // UPDATE
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)
    // set_message(`smart: ${smart.moving}`)

    set('leader-state', { character, mobToAttack, smart, whichMob })
  }

  //
  // FUNCTIONS
  //
  const dropItAndGoTo = args => {
    resetState()
    if (!smart.moving) smart_move(args)
  }

  const kite = mob => {
    kitingMob = mob
    moveToward(mob, -rangeChunk)
  }

  // const kiteCircles = [ // known circling locations
  //   { map: 'main', x: -367, y: 420 }, // training automaton area
  // ]

  // // if kiteCircle within range, move toward circle center
  // // when circumference hit, turn 90° and begin circling
  // const kite = mob => {
  //   kitingMob = mob
  //   const circle = kiteCircles
  //     .filter(o => o.map === character.map)
  //     .map(o => ({ ...o, range: distance(character, o) }))
  //     .reduce(minRange, { range: Infinity })
  //   if (circle.range < mob.range + mob.speed) movePerpendicularTo(circle, rangeChunk)
  //   else if (circle.range < character.range + character.speed) moveToward(circle, rangeChunk)
  //   else moveToward(mob, -rangeChunk)
  // }

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
  const minRange = (x, o) => o.range < x.range ? o : x
  const getClosestRadarPing = pings => pings.reduce(minRange, { range: Infinity })?.mob

  const getRadarPings = (args = {}) => radar.filter(({ mob }) => {
    if (mob.name === 'Target Automatron') return
    if (mob.map !== character.map) return
    if (args.aggro && mob.aggro <= 0.1) return
    if (args.is_juicy && mob.xp > mob.hp * 1.5) return
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

  const getNearestMonster = args => getClosestRadarPing(getRadarPings(args))

  const getPriorityMob = () => priorityMobTypes
    .map(type => getRadarPings({ type }))
    .reduce(minRange, { range: Infinity })?.mob

  const getNearestHostile = args => null // todo

  // Case: froggie over tortoise
  // -- choose juiciest prey closer than (character.range + character.speed * 0.3)
  // -- i.e. I will wait 30% of a step for a juicier target
  // const getPreyMob = () => {
  //   const preferredMobs = getRadarPings({ is_juicy: true })
  //   if (autoJuicy && preferredMobs.length) {
  //     console.log('found juicy target', getClosestRadarPing(preferredMobs))
  //     return getClosestRadarPing(preferredMobs)
  //   }
  //   else return getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax })
  // }
  
  const iAmTargetOf = mob => mob?.target === character.id
  const isSafePrey = mob => !mob.dreturn && mob.speed < character.speed

  const moveToward = (mob, distance) => {
    if (mob.map !== character.map) return
    if (!can_move_to(mob.x, mob.y) && !smart.moving) return smart_move(mob)
    const [x, y] = unitVector(character, mob)
    const safeDistance = radarRange(mob)
      ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed)
      : distance
    // smart_move({ x: character.x + x * safeDistance, y: character.y + y * safeDistance })
    move(character.x + x * safeDistance, character.y + y * safeDistance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  const smartMoveToward = (mob, distance) => {
    if (mob.map !== character.map) return
    const [x, y] = unitVector(character, mob)
    smart_move({ x: character.x + x * distance, y: character.y + y * distance })
  }

  function unitVector(from, to) {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    return [dx / magnitude, dy / magnitude]
  }

  const movePerpendicularTo = (point, distance) => {
    const [x, y] = unitVector(character, point)
    moveToward({ x: character.real_x - y, y: character.real_y + x }, distance) // 90° left
  }

  function partyUp() {
    const partyNames = Object.keys(get_party())
    for (const name of followerNames) {
      if (!partyNames.includes(name)) send_party_invite(name)
    }
  }

  const safeRangeFor = mob => {
    if (mob.attack === 0 || mob.target && mob.target !== character.id) return 0
    return mob.range + mob.speed
  }

  function startFollowers() {
    followerNames.forEach((name, index) => {
      if (!get_player(name)) {
        setTimeout(() => start_character(name, codeFollower), index * timeStartup)
        setTimeout(() => comeToMe(name), index * timeStartup + timeStartup)
        setTimeout(() => comeToMe(name), index * timeStartup + timeStartup * 2)
      }
    })
  }

  function comeToMe(name) {
    const { map, real_x, real_y } = character
    const snippet = `smart_move({ map: '${map}', x: ${real_x}, y: ${real_y}})`
    parent.character_code_eval(name, snippet)
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }

  // replace game `set` to strip circular references
  window.set = (key, value) => {
    try {
      window.localStorage.setItem(
        `cstore_${key}`,
        JSON.stringify(value, (k, v) => {
          if (k[0] === '_') return null
          return ['children','parent','scope'].includes(k) ? null : v
        })
      )
      return true
    } catch (e) {
      game_log(`[setItemInLS] key: ${key}, error: ${e}`)
      return false
    }
  }
})()
// end leader.js
