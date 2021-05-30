;(function () {
  /**
   * Follower
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const isMeleeType = ['warrior', 'rogue', 'paladin'].includes(character.ctype)
  const isPaladin = character.ctype === 'paladin'
  const isPriest = character.ctype === 'priest'

  //
  // CONFIG
  //
  let autoHostile = false

  const autoAttack = true
  const autoDefend = true
  const autoElixir = true
  const autoHeal = true
  const autoLoot = true
  const autoMelee = isMeleeType
  const autoPotion = true
  const autoRespawn = true
  const autoSquish = true
  const characterKeys = [
    'Banger',
    'Binger',
    'Dinger',
    'Finger',
    'Hunger',
    'Linger',
    'Longer',
    'Ringer',
    'Winger',
    'Zinger',
  ]
  const rangeChunk = 50
  const rangeFollow = 50
  const rangeRadar = Infinity
  const tickDelay = 250
  const uiBlank = '--'

  smart.use_town = false

  //
  // STATE
  //
  let followerConfig = {}
  let kitingMob = null
  let lastPotion = new Date()
  let leader
  let leaderSmart
  let mobs = {}
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out' | 'smart'
  let radar = null // [{ mob: Entity, range: Number }]
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
    ;({ autoHostile } = followerConfig = get('follower-config') || followerConfig)
    const { hp, items, max_hp, rip, slots } = character

    if (rip) {
      resetState()
      if (autoRespawn) respawn()
      return
    }
    if (smart.moving && moveDirection !== 'map') resetState()

    if (autoElixir) useElixir()
    if (autoLoot) loot()
    if (autoPotion) usePotion()

    //
    // HEAL
    //
    const partyPlayers = parent.party_list.map(k => parent.entities[k])
    const injuredList = partyPlayers.filter(isInjured)
    if (isInjured(character)) injuredList.push(character)

    if (autoHeal) {
      if (isPaladin && hp < max_hp && !isOnCooldown('selfheal')) useSkill('selfheal')
      else if (isPriest && injuredList.length) {
        if (!isOnCooldown('partyheal')) useSkill('partyheal')
        else if (!isOnCooldown('heal')) {
          const healTarget = injuredList.sort((a, b) => a.max_hp - a.hp - (b.max_hp - b.hp))[0]
          game_log(`heal ${healTarget.id}`)
          heal(healTarget)
        }
      }
    }

    //
    // RADAR
    //
    updateRadar()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    const hostileMob = getNearestHostile()
    const lockMob = get_targeted_monster()
    const partyMob = getNearestMonster({ target: leader?.id }) // should include any party member targeted
    const squishyMob = getNearestMonster({
      min_xp: 1,
      max_hp: character.attack * 0.95,
      no_target: true,
    })
    const willAggroMob = getNearestMonster({ aggro: true, min_att: 1, no_target: true })
    mobs = {
      aggroMob,
      hostileMob,
      kitingMob,
      lockMob,
      partyMob,
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
    else if (lockMob?.visible && iAmTargetOf(lockMob) && radarRange(lockMob) < character.range)
      whichMob = 'lock'
    else if (aggroMob && autoDefend) whichMob = 'aggro'
    else if (partyMob && autoAttack) whichMob = 'party'
    else whichMob = canSquish ? 'squishy' : null
    mobToAttack = mobs[`${whichMob}Mob`]

    if (
      can_attack(mobToAttack) &&
      (autoMelee ||
        ['hostile', 'lock', 'aggro', 'squishy'].includes(whichMob) ||
        radarRange(mobToAttack) > safeRangeFor(mobToAttack))
    ) {
      attack(mobToAttack)
    }

    //
    // MOVEMENT
    //
    followOrStop()

    //
    // UPDATE
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = smart.moving ? 'smart' : kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)
    const updatedAt = new Date()
    set(character.id, { items, slots, updatedAt })
  }

  //
  // FUNCTIONS
  //
  const isInjured = player => {
    if (!player || player.rip) return
    // if (mobToAttack)
    return player.hp < player.max_hp - character.attack
    // return player.hp < player.max_hp
  }

  const followOrStop = () => {
    if (!leader?.map || !character?.map) return
    const map = leaderSmart.moving ? leaderSmart.map : leader.map
    if (map === 'bank') return

    const { going_x, going_y } = leader
    const leaderGoingTo = { map, x: going_x, y: going_y }
    const rangeLeaderGoingTo = distance(character, leaderGoingTo)

    if (map !== character.map) {
      const door = nearestDoor(map)
      if (door) {
        // console.log('[followOrStop] nearestDoor', { door })
        const [x, y] = G.maps[map].spawns[door[5]]
        smartMove({ map, x, y })
        moveDirection = 'map'
      } else {
        smartMove(leader)
        moveDirection = 'map'
      }
    } else if (!smart.moving && rangeLeaderGoingTo > rangeFollow) {
      moveToward(leaderGoingTo, Math.min(rangeChunk, rangeLeaderGoingTo))
    }
  }

  const nearestDoor = toMap =>
    G.maps[character.map].doors
      .filter(([_x, _y, _h, _w, map]) => map === toMap)
      .map(doorInfo => ({ doorInfo, range: distance(character, getDoorPoint(doorInfo)) }))
      .reduce(minRange, { range: Infinity }).doorInfo

  const getDoorPoint = ([x, y, _h, _w, map]) => ({ map, x, y })

  // "radar" caches "radar pings" [{ mob, range }] for performance
  const updateRadar = () => {
    radar = []
    for (id in parent.entities) {
      const mob = parent.entities[id]
      if (!mob.visible || mob.dead || mob.rip) continue
      const range = distance(character, mob)
      if (range > rangeRadar) continue
      radar.push({ mob, range })
    }
  }
  const radarRange = mob => radar.find(o => o.mob === mob)?.range
  const minRange = (a, b) => (a.range < b.range ? a : b)
  const getClosestRadarPing = pings => pings.reduce(minRange, { range: Infinity })?.mob
  const getNearestMonster = props => getClosestRadarPing(getRadarPings({ ...props, player: false }))
  const getNearestHostile = props => getClosestRadarPing(getRadarPings({ ...props, player: true }))

  const getRadarPings = (props = {}) =>
    radar.filter(({ mob }) => {
      // if (mob.name === 'Target Automatron') return
      if (mob.map !== character.map) return
      if (props.aggro && mob.aggro <= 0.1) return
      if (props.is_juicy && mob.xp < mob.hp * 2) return
      if (props.mtype && mob.mtype !== props.mtype) return
      if (props.min_xp && mob.xp < props.min_xp) return
      if (props.min_att && mob.attack < props.min_att) return
      if (props.max_att && mob.attack > props.max_att) return
      if (props.max_hp && mob.hp > props.max_hp) return
      if (props.player && !isHostilePlayer(mob)) return
      if (!props.player && mob.type !== 'monster') return
      if (props.target && mob.target !== props.target) return
      if (props.no_target && mob.target && mob.target !== character.id) return
      if (props.path_check && !can_move_to(mob)) return
      return true
    })

  const iAmTargetOf = mob => mob?.target === character.id

  const isHostilePlayer = mob =>
    !characterKeys.includes(mob.id) &&
    !characterKeys.includes(mob.party) &&
    (mob.map === 'arena' || parent.server_identifier === 'PVP')

  const isSquishy = mob => mob?.hp < character.attack * 0.95

  const moveToward = (mob, distance) => {
    if (mob.map !== undefined && mob.map !== character.map) return
    if (!can_move_to(mob.x, mob.y)) return smartMove(mob)
    const [x, y] = unitVector(character, mob)
    // const safeDistance =
    //   radarRange(mob) && !autoMelee
    //     ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed)
    //     : distance
    // move(character.x + x * safeDistance, character.y + y * safeDistance)
    move(character.x + x * distance, character.y + y * distance)
    moveDirection = distance > 0 ? 'in' : 'out'
  }

  const moveClockwise = (mob, distance) => {
    const [x, y] = unitVector(character, mob)
    moveToward({ map: mob.map, x: character.real_x - y, y: character.real_y + x }, distance)
  }

  const moveCounterclockwise = (mob, distance) => {
    const [x, y] = unitVector(character, mob)
    moveToward({ map: mob.map, x: character.real_x + y, y: character.real_y - x }, distance)
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

  function useElixir() {
    if (character.slots.elixir) return
    const slot = character.items.findIndex(o => o && G.items[o.name].type === 'elixir')
    if (slot > -1) equip(slot)
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

  function useSkill(name) {
    // game_log(name)
    use_skill(name)
  }

  function isOnCooldown(skill) {
    const cooldownKey = G.skills[skill]?.share ?? skill
    return parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey]
  }

  //
  // HOOKS
  //
  on_combined_damage = () =>
    parent.party_list.findIndex(x => x === character.id) % 2
      ? moveClockwise(mobToAttack, rangeChunk * 0.5)
      : moveCounterclockwise(mobToAttack, rangeChunk * 0.5)

  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end follower.js
