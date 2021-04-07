(function(){
  /**
   * Leader
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
  const autoKite = !meleeChar
  const autoMap = 'arena'
  const autoParty = true
  const autoRespawn = true
  const autoRest = false
  const autoSquish = true
  const autoStalk = true
  const characterNames = ['Binger', 'Finger', 'Zinger']
  const codeFollower = 'Follower'
  const leaderName = character.name
  const preyAtkMax = 1000
  const preyXpMin = 300
  const rangeChunk = character.speed
  const rangeClose = Math.min(50, character.range * 0.9)
  const rangeRadar = 2000
  const rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const timeStartup = 7000
  const uiBlank = '--'
  
  // computed config
  const followerNames = characterNames.filter(x => x !== character.name)
  
  //
  // STATE
  //
  let kitingMob = null
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'kite' | 'map'
  let whichMob = null

  //
  // INIT
  //
  set('follower-config', { leaderName })
  if (autoParty) startFollowers()

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
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
    if (autoParty) partyUp()

    //
    // RADAR
    //
    updateRadar()
    const lockMob = get_targeted_monster()
    const aggroMob = getNearestMonster({ target: character.name, min_att: 1 })
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
      preyMob.speed < character.speed
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
    // If no prey and autoFarm, smart_move to random new monster location on map

    if (
      can_attack(mobToAttack) &&
      // ranged chars, don’t draw prey aggro in enemy range
      (meleeChar || whichMob !== 'prey' || distance(character, mobToAttack) > rangeClose)
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    if (kitingMob && !aggroMob) stopKiting()

    if (autoMap && character.map !== autoMap && !is_moving(character)) smart_move(autoMap)
    else if ((kitingMob || autoKite) && aggroMob && radarRange(aggroMob) <= safeRangeFor(aggroMob)) kite(aggroMob)
    else if (rageMob && radarRange(rageMob) <= safeRangeFor(rageMob)) moveToward(rageMob, -rangeChunk)
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
        else if (autoKite && radarRange(mobToAttack) <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
        else moveDirection = null
      }
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
  
  const iAmTargetOf = x => x?.target === character.id
  
  const moveToward = (point, distance) => {
    if (!can_move_to(point.x, point.y)) return smart_move({ x: point.x, y: point.y }) // don‘t want point.map
    const dx = point.x - character.x
    const dy = point.y - character.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    move(character.x + (dx / magnitude) * distance, character.y + (dy / magnitude) * distance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }
  
  function partyUp() {
    const partyNames = Object.keys(get_party())
    for (const name of followerNames) {
      if (!partyNames.includes(name)) send_party_invite(name)
    }
  }
  
  const safeRangeFor = mob => mob.attack === 0 ? 0 : mob.range * 1.1 + mob.speed

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
  // Hooks
  //
  on_party_invite = name => {
    if (characterNames.includes(name)) accept_party_invite(name)
  }

  // override game `set` to strip circular references
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
      game_log(`set() call failed for: ${key}, reason: ${e}`)
      return false
    }
  }
})()
// end leader.js
