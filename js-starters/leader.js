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
  const autoKite = !isMeleeType(character)
  const autoLoot = true
  const autoMap = 'arena'
  const autoMelee = isMeleeType(character)
  const autoParty = true
  const autoPotion = true
  const autoRespawn = true
  const autoRest = false
  const autoSquish = true
  const autoStalk = true
  const characterKeys = ['Binger', 'Dinger', 'Finger', 'Zinger']
  const codeFollower = 'Follower'
  const preyAtkMax = 1000
  const preyXpMin = 300
  const rangeChunk = character.speed
  const rangeRadar = 2000
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const timeStartup = 7000
  const uiBlank = '--'
  
  // computed config
  const followerNames = characterKeys.filter(x => ![character.id, 'Dinger'].includes(x))
  
  //
  // STATE
  //
  let kitingMob = null
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'kite' | 'map'
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
  // INIT
  //
  if (autoParty) startFollowers()

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    const { character: characterLast } = get('leader-state') ?? {}

    if (character.rip) {
      if (autoRespawn) respawn()
      return resetState()
    }
    if (autoLoot) loot()
    if (autoParty) partyUp()
    if (autoPotion) use_hp_or_mp()

    //
    // RADAR
    //
    updateRadar()
    const lockMob = get_targeted_monster()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    // TODO partyMob, party member aggro
    const rageMob = getNearestMonster({ rage: true, min_att: 1 })
    const juicyMob = getNearestMonster({ is_juicy: true })
    const preyMob = getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax })
    const squishyMob = getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.95 }) // no negative xp (e.g. puppies)
  
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
    } else if (
      juicyMob &&
      autoAttack &&
      radarRange(juicyMob) < (character.range + character.speed)
    ) {
      whichMob = 'juicy'
      mobToAttack = juicyMob
    } else if (
      preyMob &&
      autoAttack &&
      (!autoRest || character.hp > character.max_hp * 0.9) &&
      !preyMob.dreturn && // damage return (porcupine)
      (autoMelee || preyMob.speed < character.speed) &&
      (autoMelee || preyMob.range < character.range)
    ) {
      whichMob = 'prey'
      mobToAttack = preyMob
    } else if (squishyMob && autoSquish && is_in_range(squishyMob, 'attack')) {
      whichMob = 'squishy'
      mobToAttack = squishyMob
    } else {
      whichMob = null
      mobToAttack = null
    }

    if (
      can_attack(mobToAttack) &&
      (autoMelee || ['lock', 'aggro', 'squishy'].includes(whichMob) || radarRange(mobToAttack) > safeRangeFor(mobToAttack))
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    if (kitingMob && !aggroMob) stopKiting()

    if (moveDirection && !smart.moving && character.real_x === characterLast.real_X && character.real_y === characterLast.real_Y)
      game_log('"dumb move" failure? we look stuck')

    if (autoMap && character.map !== autoMap && !is_moving(character)) smart_move(autoMap)
    else if ((kitingMob || autoKite) && aggroMob && radarRange(aggroMob) <= safeRangeFor(aggroMob)) kite(aggroMob)
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
  
    //
    // UPDATE
    //
    const uiRange = radarRange(aggroMob) ? Math.round(radarRange(aggroMob)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)

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
    kitingMob = null
    stop()
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
  const minRange = (x, o) => o.range < x.range ? o : x
  const getClosestRadarPing = pings => pings.reduce(minRange, { range: Infinity })?.mob
  const getNearestMonster = args => getClosestRadarPing(getRadarPings(args))

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

  const moveToward = (mob, distance) => {
    if (!can_move_to(mob.x, mob.y)) return smart_move(mob)
    const dx = mob.x - character.x
    const dy = mob.y - character.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    const safeDistance = radarRange(mob) ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed) : distance
    move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * safeDistance)
    moveDirection = distance > 0 ? 'in' : 'out'
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
