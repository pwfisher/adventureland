  //
  // CONFIG
  //
  const priorityMobTypes = ['greenjr', 'wabbit']

  //
  // STATE
  //
  let mobs = {}

  //
  // INIT
  //
  set('follower-config', { autoHostile, autoPriority, characterKeys, leaderKey, priorityMobTypes })

    //
    // RADAR
    //
    updateRadar()
    mobs = {
      aggro: getNearestMonster({ target: character.id, min_att: 1 }),
      hostile: getNearestHostile(),
      juicy: getNearestMonster({ is_juicy: true }),
      lock: get_targeted_monster(),
      party: null, // not implemented
      prey: getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax }),
      priority: getPriorityMob(),
      rage: getNearestMonster({ rage: true, min_att: 1 }),
      squishy: getNearestMonster({ min_xp: 1, max_hp: character.attack * 0.9 }),
    }
    const canSquish = mobs.squishy && autoSquish && is_in_range(mobs.squishy, 'attack') && !character.q.attack

    //
    // ATTACK
    //
    if (mobs.priority && autoPriority)
      whichMob = 'priority'
    else if (mobs.hostile && autoHostile)
      whichMob = 'hostile'
    else if (mobs.lock.visible && iAmTargetOf(mobs.lock) && (autoAttack || autoDefend) && (autoStalk || autoKite || radarRange(mobs.lock) < character.range))
      whichMob = 'lock'
    else if (mobs.aggro && autoDefend)
      whichMob = 'aggro'
    else if (smart.moving)
      whichMob = canSquish ? 'squishy' : null
    else if (mobs.party && autoAttack)
      whichMob = 'party'
    else if (mobs.juicy && autoAttack && radarRange(mobs.juicy) < (character.range + character.speed))
      whichMob = 'juicy'
    else if (mobs.prey && autoAttack && (!autoRest || character.hp > character.max_hp * 0.9) && isSafePrey(mobs.prey))
      whichMob = 'prey'
    else
      whichMob = canSquish ? 'squishy' : null
    mobToAttack = mobs[whichMob]
    if (can_attack(mobToAttack) && (meleeChar || whichMob !== 'prey' || radarRange(mobToAttack) > rangeClose)) {
      attack(mobToAttack)
    }
    if (
      can_attack(mobToAttack) &&
      (
        (mobToAttack.target && mobToAttack.target !== character.id) ||
        (meleeChar || whichMob !== 'prey' || radarRange(mobToAttack) > safeRangeFor(mobToAttack))
      )
    ) {
      attack(mobToAttack)
    }
  
    //
    // MOVEMENT
    //
    if (kitingMob && !mobs.aggro) stopKiting()

    if (autoMap && character.map !== autoMap && !is_moving(character)) smart_move(autoMap)
    else if ((kitingMob || autoKite) && mobs.aggro && radarRange(mobs.aggro) <= safeRangeFor(mobs.aggro)) kite(mobs.aggro)
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
        else if (meanMob && radarRange(meanMob) <= safeRangeFor(meanMob)) moveToward(meanMob, -rangeChunk)
        else if (autoKite && radarRange(mobToAttack) <= safeRangeFor(mobToAttack)) moveToward(mobToAttack, -rangeChunk)
        else moveDirection = null
      }
    }
  }
  
  //
  // FUNCTIONS
  //  
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

  const getPriorityMob = () => priorityMobTypes
    .map(type => getRadarPings({ type }))
    .reduce(closest, { range: Infinity })?.mob

  // Case: froggie over tortoise
  // -- choose juiciest prey closer than (character.range + character.speed * 0.3)
  // -- i.e. I will wait 30% of a step for a juicier target
  // + don't shoot the fairy
  // const getPreyMob = () => {
  //   const preferredMobs = getRadarPings({ is_juicy: true })
  //   if (autoJuicy && preferredMobs.length) {
  //     console.log('found juicy target', getClosestRadarPing(preferredMobs))
  //     return getClosestRadarPing(preferredMobs)
  //   }
  //   else return getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax })
  // }
  
  const iAmTargetOf = mob => mob?.target === character.id
  const isMeleeType = character => ['warrior', 'rogue'].includes(character.ctype)

  const isSafePrey = mob => !mob.dreturn && mob.speed < character.speed

  const safeRangeFor = mob => {
    if (mob.attack === 0 || mob.target && mob.target !== character.id) return 0
    return mob.range + mob.speed + 1
  }

  const moveToward = (point, distance) => {
    if (point.map !== character.map) return
    if (!can_move_to(point)) return smart_move(point)
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
    const snippet = `
      smart_move({ map: ${map}, x: ${real_x}, y: ${real_y} }, () => {
        game_log('[' + character.id + '] smart_move({ map: ${map}, x: ${real_x}, y: ${real_y} })')
      })
    `
    parent.character_code_eval(name, snippet)
  }
  // ['Zinger', 'Binger'].forEach(x => comeToMe(x))

  //
  // Hooks
  //
  
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
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