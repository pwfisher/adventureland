;(function () {
  /**
   * Leader
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const isMeleeType = player => ['warrior', 'rogue'].includes(player.ctype)
  const TEMPORARILY_FALSE = false
  const TEMPORARILY_TRUE = true

  const manualMode = false // || TEMPORARILY_TRUE

  //
  // CONFIG
  //
  const autoAttack = true
  const autoAvoidWillAggro = !manualMode && TEMPORARILY_FALSE
  const autoDefend = true
  // const autoElixir = true
  const autoHostile = false
  const autoKite = !isMeleeType(character)
  const autoKitePath = true
  const autoLoot = true
  const autoMap = ''
  const autoMelee = isMeleeType(character)
  const autoMob = ''
  const autoParty = true // && TEMPORARILY_FALSE
  const autoPotion = true
  const autoPriority = true
  const autoRealm = true // && TEMPORARILY_FALSE
  const autoRealmMinutes = 5
  const autoRespawn = true
  const autoRest = false
  const autoSquish = true
  const autoStalk = !manualMode
  const characterKeys = ['Banger', 'Binger', 'Dinger', 'Finger', 'Hunger', 'Longer', 'Zinger']
  const followerKeys = ['Finger', 'Zinger']
  const healerKeys = ['Hunger']
  const preyAtkMax = 1000
  const preyXpMin = 300
  const priorityMobTypes = ['dracul', 'greenjr', 'phoenix', 'wabbit']
  const rangeChunk = character.speed
  const rangeRadar = Infinity
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const timeStartup = 4000
  const uiBlank = '--'

  // type KitePath = Point[]; type Point = { x: number, y: number }
  // const kitePaths: Record<MapKey, KitePath[]>
  // i.e. { cave: [ { x: 300, y: 475 }, ... ] }
  load_code('kitePaths')

  // computed config
  const partyKeys = [...followerKeys, ...healerKeys]

  // update config in local storage
  set('follower-config', {
    autoAvoidWillAggro,
    autoHostile,
    autoMap,
    autoMob,
    autoPriority,
    priorityMobTypes,
  })

  smart.use_town = false

  //
  // STATE
  //
  let hasMoved
  let kitingMob = null
  let kitePathPoint = null // { x, y }
  let lastPotion = new Date()
  let mobs = {}
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out'
  let radar = [] // [{ mob: Entity, range: Number }]
  let whichMob = null

  const resetState = () => {
    kitingMob = null
    kitePathPoint = null
    mobs = {}
    mobToAttack = null
    moveDirection = null
    radar = []
    whichMob = null
  }

  const setLeaderState = () => setLSKey('leader-state', { character, mobToAttack, smart, whichMob })

  //
  // INIT
  //
  if (autoParty) startParty()
  if (autoRealm) {
    setInterval(randomServer, autoRealmMinutes * 60 * 1000)
    setInterval(() => game_log('Realm hop in 60 seconds'), (autoRealmMinutes - 1) * 60 * 1000)
  }

  ;({ character: previousLeader } = get('leader-state') ?? {})
  if (previousLeader.id !== character.id) {
    game_log(`Leader was ${previousLeader.id}, now ${character.id}`)
    setLeaderState()
  }

  console.clear()

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    const { character: characterLast } = get('leader-state') ?? {}
    hasMoved =
      character.real_x !== characterLast?.real_x || character.real_y !== characterLast?.real_y

    if (characterLast.id !== character.id) return game_log(`Extra leader: ${character.id}`)

    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }
    if (smart.moving && moveDirection !== 'escape') resetState()

    if (autoLoot) loot()
    if (autoParty) partyUp()
    if (autoPotion) usePotion()

    //
    // RADAR
    //
    updateRadar()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    const hostileMob = getNearestHostile()
    const juicyMob = getNearestMonster({ is_juicy: true, min_xp: preyXpMin, max_att: preyAtkMax })
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
    if (kitingMob && !aggroMob) {
      kitingMob = kitePathPoint = null
      stop()
    }
    const canSquish =
      autoSquish &&
      squishyMob &&
      is_in_range(squishyMob, 'attack') &&
      !character.q.attack &&
      !isOnCooldown('attack')

    //
    // ATTACK
    //
    if (priorityMob && autoPriority) whichMob = 'priority'
    else if (hostileMob && autoHostile) whichMob = 'hostile'
    else if (
      lockMob?.visible &&
      iAmTargetOf(lockMob) &&
      (autoAttack || autoDefend) &&
      (autoStalk || autoKite || radarRange(lockMob) < character.range)
    )
      whichMob = 'lock'
    else if (aggroMob && autoDefend) whichMob = 'aggro'
    else if (partyMob && autoAttack) whichMob = 'party'
    else if (smart.moving) whichMob = canSquish ? 'squishy' : null
    else if (
      juicyMob &&
      autoAttack &&
      radarRange(juicyMob) < character.range + character.speed &&
      (!autoRest || character.hp > character.max_hp * 0.9) &&
      isSafePrey(juicyMob)
    )
      whichMob = 'juicy'
    else if (
      preyMob &&
      autoAttack &&
      (!autoRest || character.hp > character.max_hp * 0.9) &&
      isSafePrey(preyMob)
    )
      whichMob = 'prey'
    else whichMob = canSquish ? 'squishy' : null
    mobToAttack = mobs[`${whichMob}Mob`]

    if (
      can_attack(mobToAttack) &&
      (autoMelee ||
        ['priority', 'hostile', 'lock', 'aggro', 'squishy'].includes(whichMob) ||
        radarRange(mobToAttack) > safeRangeFor(mobToAttack))
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    if (autoMap && character.map !== autoMap) smartMove(autoMap)
    else if (autoMob && !getNearestMonster({ type: autoMob })) smartMove(autoMob)
    else if (!smart.moving && moveDirection && !hasMoved && moveDirection !== 'escape') {
      game_log('we look stuck. escape!')
      const escapeMob = mobToAttack ?? willAggroMob ?? aggroMob
      if (escapeMob) {
        moveDirection = 'escape'
        smartMoveToward(
          escapeMob,
          distance(character, escapeMob) + safeRangeFor(escapeMob) + character.speed * 2
        )
      }
    } else if (
      aggroMob &&
      (kitingMob || autoKite) &&
      canKite(aggroMob) &&
      radarRange(aggroMob) <= safeRangeFor(aggroMob)
    )
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
      ) {
        stop() // in goldilocks zone
        moveDirection = null
      } else if (
        autoKite &&
        canKite(mobToAttack) &&
        radarRange(mobToAttack) <= safeRangeFor(mobToAttack)
      )
        moveToward(mobToAttack, -rangeChunk)
      else if (radarRange(mobToAttack) > character.range) moveToward(mobToAttack, rangeChunk)
      else moveDirection = null
    } else moveDirection = null

    //
    // UPDATE
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = smart.moving ? 'smart' : kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)
    // set_message(`smart: ${smart.moving}`)

    if (character.xp < characterLast.xp) game_log(`Lost ${characterLast.xp - character.xp} xp`)

    setLeaderState()
  }

  //
  // FUNCTIONS
  //
  const canKite = mob => character.speed > mob.speed && character.range > mob.range

  const kite = mob => {
    const kitePath = closestPath(kitePaths[character.map])
    kitingMob = mob
    if (autoKitePath && mob.hp > character.attack * 10 && kitePath) {
      // nb: no path if mob.hp low
      if (!kitePathPoint) kitePathPoint = closestSafePoint(kitePath, mob)
      else if (distance(mob, kitePathPoint) < safeRangeFor(mob) * 1.5)
        // mob cuts corner
        kitePathPoint = kitePath[nextPointIndex(kitePath, kitePathPoint)]
      move(kitePathPoint.x, kitePathPoint.y)
    } else return moveToward(mob, -rangeChunk)
  }

  const closestPoint = points =>
    points.map(o => ({ ...o, range: distance(character, o) })).reduce(minRange, { range: Infinity })

  const closestPath = paths => {
    // todo: closest point anywhere in any path?
    if (!paths) return null
    const closestTrailhead = closestPoint(paths.map(path => path[0]))
    return paths.find(path => path[0].x === closestTrailhead.x && path[0].y === closestTrailhead.y)
  }

  const closestSafePoint = (points, mob) =>
    closestPoint(points.filter(x => distance(mob, x) > safeRangeFor(mob)))

  const pointIndex = (points, point) => points.findIndex(o => o.x === point.x && o.y === point.y)

  const nextPointIndex = (points, point) => (pointIndex(points, point) + 1) % points.length

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
  const minRange = (x, o) => (o.range < x.range ? o : x)
  const getClosestRadarPing = pings => pings.reduce(minRange, { range: Infinity })?.mob

  const getRadarPings = (args = {}) =>
    radar.filter(({ mob }) => {
      if (mob.name === 'Target Automatron') return
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

  const getNearestMonster = args => getClosestRadarPing(getRadarPings(args))

  const getPriorityMob = () =>
    priorityMobTypes.map(type => getRadarPings({ type })).reduce(minRange, { range: Infinity })?.mob

  const getNearestHostile = args => null // todo

  const iAmTargetOf = mob => mob?.target === character.id
  const isSafePrey = mob => mob.speed < character.speed - 1 && !mob.dreturn

  const moveToward = (mob, distance) => {
    if (mob.map !== undefined && mob.map !== character.map) return
    if (!can_move_to(mob.x, mob.y)) return smartMove(mob)
    const [x, y] = unitVector(character, mob)
    const safeDistance = radarRange(mob)
      ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed)
      : distance
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

  const partyUp = () =>
    partyKeys.forEach(key => {
      if (!get_party()[key]) send_party_invite(key)
    })

  const safeRangeFor = mob => {
    if (mob.attack === 0 || (mob.target && mob.target !== character.id)) return 0
    return mob.range + mob.speed
  }

  const smartMove = (destination, on_done) => {
    moveDirection = 'smart'
    if (!smart.moving) smart_move(destination, on_done)
  }

  function startParty() {
    partyKeys.forEach((name, index) => {
      if (!get_party()[name] && !get_player(name)) {
        setTimeout(
          () => start_character(name, followerKeys.includes(name) ? 'Follower' : 'Healer'),
          index * timeStartup
        )
        setTimeout(() => comeToMe(name), index * timeStartup + timeStartup)
      }
    })
  }

  function comeToMe(name) {
    const { map, real_x, real_y } = character
    const snippet = `smart_move({ map: '${map}', x: ${real_x}, y: ${real_y}})`
    parent.character_code_eval(name, snippet)
  }

  function randomServer() {
    const servers = ['US-I', 'US-II', 'US-III', 'US-PVP', 'EU-I', 'EU-II', 'EU-PVP', 'ASIA-I']
    const server = servers[Math.floor(Math.random() * servers.length)].split('-')
    change_server(server[0], server[1])
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }

  // replace game’s `set` to strip circular references
  function setLSKey(key, value) {
    try {
      window.localStorage.setItem(
        `cstore_${key}`,
        JSON.stringify(value, (k, v) => {
          // data-specific. nullify _foo, _bar, children, parent, scope.
          if (k[0] === '_') return null
          return ['children', 'parent', 'scope'].includes(k) ? null : v
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
