; (async function () {
  /**
   * Leader
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const TEMPORARILY_FALSE = false
  const TEMPORARILY_TRUE = true
  console.log({ TEMPORARILY_FALSE, TEMPORARILY_TRUE })
  console.clear()
  const isMeleeType = ['warrior', 'rogue', 'paladin'].includes(character.ctype) // && TEMPORARILY_FALSE

  //
  // CONFIG
  //
  const autoMap = 'arena'
  const autoMob = ''
  const manualMode = false // || TEMPORARILY_TRUE

  // ------

  const autoAttack = true // && TEMPORARILY_FALSE
  const autoAvoidWillAggro = !isMeleeType && !manualMode // && TEMPORARILY_FALSE
  const autoBank = !manualMode // && TEMPORARILY_FALSE
  const autoBankAtGold = 200 * 1000
  const autoDefend = true
  const autoElixir = true
  const autoEscape = true && TEMPORARILY_FALSE
  const autoHeal = true
  const autoHostile = false
  const autoKite = !isMeleeType // && TEMPORARILY_FALSE
  const autoKitePath = true
  const autoLoot = true
  const autoMelee = isMeleeType // || TEMPORARILY_TRUE
  const autoParty = true // && TEMPORARILY_FALSE
  const autoPotion = true
  const autoPriority = true
  const autoRealm = !manualMode && !autoMob // && TEMPORARILY_FALSE
  const autoRealmMinutes = 5 // * 60 * 24
  const autoRespawn = true
  const autoRest = true // && TEMPORARILY_FALSE
  const autoRestAt = 0.75
  const autoSquish = true
  const autoStalk = !manualMode
  const bagSize = 42
  const bankPackKeys = ['items0', 'items1', 'items2', 'items3']
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
  const emitDelay = Math.max(200, character.ping * 3)
  const partyKeys = ['Hunger', 'Zinger', 'Finger'].filter(x => x !== character.id).slice(0, 2)
  const preyAtkMax = 1600
  const preyXpMin = 300
  const priorityMobTypes = [
    'dracul',
    'franky',
    'froggie',
    'greenjr',
    'goldenbat',
    'phoenix',
    'skeletor',
    'wabbit',
  ]
  const rangeChunk = 50
  const rangeRadar = Infinity
  let rangeStalk = [character.range * 0.8, character.range]
  const tickDelay = 250
  const timeStartup = 4000
  const uiBlank = '--'

  // type KitePath = Point[]; type Point = { x: number, y: number }
  // const kitePaths: Record<MapKey, KitePath[]>
  // i.e. { cave: [ [{ x: 300, y: 475 }, ...] ... ] }
  load_code('kitePaths')

  // update config in local storage
  set('follower-config', {
    autoAvoidWillAggro,
    autoHostile,
  })

  smart.use_town = false

  //
  // STATE
  //
  let hasMoved
  let kitingMob = null
  let kitePath = null // [{ x, y}]
  let kitePathPoint = null // { x, y }
  let lastPotion = new Date()
  let mobs = {}
  let mobToAttack = null
  let moveDirection = null // null | 'in' | 'out'
  let radar = [] // [{ mob: Entity, range: Number }]
  let whichMob = null

  const resetState = () => {
    kitingMob = null
    kitePath = null
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
  if (autoParty) await startParty()
  if (autoRealm) {
    setTimeout(changeServer, autoRealmMinutes * 60 * 1000)
    setTimeout(() => game_log('Realm hop in 60 seconds'), (autoRealmMinutes - 1) * 60 * 1000)
  }

  ; ({ character: previousLeader } = get('leader-state') ?? {})
  if (previousLeader.id !== character.id) {
    game_log(`Leader was ${previousLeader.id}, now ${character.id}`)
    setLeaderState()
  }

  //
  // TICK
  //
  async function tickLoop() {
    try {
      await tick()
    } catch (e) {
      console.error(e)
    }
    setTimeout(tickLoop, tickDelay)
  }
  tickLoop()

  async function tick() {
    if (character.rip) {
      resetState()
      if (autoRespawn) respawn()
      return
    }
    if (smart.moving && moveDirection !== 'esc') resetState()

    // ----

    const { character: characterLast } = get('leader-state') ?? {}
    hasMoved =
      character.real_x !== characterLast?.real_x || character.real_y !== characterLast?.real_y
    const { ctype, hp, items, max_hp, range, slots } = character
    rangeStalk = [range * 0.8, range]

    if (characterLast.id !== character.id) return game_log(`Extra leader: ${character.id}`)

    // ----

    if (autoBank) {
      if (
        character.gold > autoBankAtGold ||
        character.items.slice(0, 28).filter(x => x === null).length === 0
      ) {
        await useBank()
      }
    }
    if (autoElixir) useElixir()
    if (autoLoot) loot()
    if (autoParty) partyUp()
    if (autoPotion) usePotion()

    //
    // HEAL
    //
    const partyPlayers = parent.party_list.map(k => parent.entities[k])
    const injuredList = partyPlayers.filter(isInjured)
    if (isInjured(character)) injuredList.push(character)

    if (autoHeal) {
      if ('paladin' === ctype && hp < max_hp && !isOnCooldown('selfheal')) useSkill('selfheal')
      else if ('priest' === ctype && injuredList.length) {
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
    const juicyMob = getNearestMonster({
      is_juicy: true,
      min_xp: preyXpMin,
      max_att: preyAtkMax,
      no_target: true,
    })
    const lockMob = get_targeted_monster()
    const partyMob = null // not implemented
    const preyMob = getNearestMonster({ min_xp: preyXpMin, max_att: preyAtkMax, no_target: true })
    const priorityMob = getPriorityMob()
    const squishyMob = getNearestMonster({
      min_xp: 1,
      max_hp: character.attack * 0.95,
      no_target: true,
    })
    const willAggroMob = getNearestMonster({ aggro: true, min_att: 1, no_target: true })
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
      kitingMob = kitePath = kitePathPoint = null
      stop()
    }
    const canSquish =
      autoSquish && squishyMob && is_in_range(squishyMob, 'attack') && !isOnCooldown('attack')

    //
    // ATTACK
    //
    if (hostileMob && autoHostile) whichMob = 'hostile'
    else if (priorityMob && autoPriority) whichMob = 'priority'
    else if (
      lockMob?.visible &&
      isTargetOf(lockMob) &&
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
      (!autoRest || character.hp > character.max_hp * autoRestAt) &&
      isSafePrey(juicyMob)
    )
      whichMob = 'juicy'
    else if (
      preyMob &&
      autoAttack &&
      (!autoRest || character.hp > character.max_hp * autoRestAt) &&
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
    const escapeMob = mobToAttack ?? willAggroMob ?? aggroMob

    if (autoMap && character.map !== autoMap) {
      console.debug('MOVE: autoMap, ' + autoMap)
      moveDirection = 'map'
      smartMove(autoMap)
    } else if (autoMob && !getNearestMonster({ mtype: autoMob })) {
      console.debug('MOVE: autoMob, ' + autoMob)
      moveDirection = 'mob'
      smartMove(autoMob)
    } else if (
      autoEscape &&
      moveDirection &&
      !hasMoved &&
      !smart.moving &&
      escapeMob &&
      !['esc', 'path'].includes(moveDirection)
    ) {
      console.debug('MOVE: escape, ' + escapeMob.mtype)
      moveDirection = 'esc'
      moveToward(
        escapeMob,
        distance(character, escapeMob) + safeRangeFor(escapeMob) + character.speed * 2
      )
    } else if (
      autoKite &&
      !autoMelee &&
      aggroMob &&
      canKite(aggroMob)
    ) {
      if (radarRange(aggroMob) <= safeRangeFor(aggroMob)) {
        console.debug('MOVE: kite, ' + aggroMob.mtype)
        kite(aggroMob)
      }
      // else moveDirection is sticky -- 'path' or 'kite'
    } else if (
      autoAvoidWillAggro &&
      !autoMelee &&
      willAggroMob &&
      moveDirection !== 'path' &&
      radarRange(willAggroMob) <= safeRangeFor(willAggroMob)
    ) {
      console.debug('MOVE: avoid, ' + willAggroMob.mtype)
      moveDirection = 'avoid'
      moveToward(willAggroMob, -rangeChunk)
    } else if (autoStalk && mobToAttack && whichMob !== 'squishy') {
      if (
        !autoMelee &&
        moveDirection === 'in' &&
        radarRange(mobToAttack) <= Math.max(rangeStalk[1], safeRangeFor(mobToAttack))
      ) {
        console.debug('MOVE: stalk in, stop, ' + mobToAttack.mtype)
        stop() // in goldilocks zone
        moveDirection = null
      } else if (
        moveDirection === 'out' &&
        radarRange(mobToAttack) >= Math.max(rangeStalk[0], safeRangeFor(mobToAttack))
      ) {
        console.debug('MOVE: stalk out, stop, ' + mobToAttack.mtype)
        stop() // in goldilocks zone
        moveDirection = null
      } else if (
        !autoMelee &&
        canKite(mobToAttack) &&
        radarRange(mobToAttack) <= safeRangeFor(mobToAttack)
      ) {
        console.debug('MOVE: stalk out, start, ' + mobToAttack.mtype)
        moveDirection = 'out'
        moveToward(mobToAttack, -rangeChunk)
      } else if (radarRange(mobToAttack) > character.range) {
        console.debug('MOVE: stalk in, start, ' + mobToAttack.mtype)
        moveDirection = 'in'
        moveToward(mobToAttack, rangeChunk)
      } else {
        // no autoMove (free manual control) within Goldilocks stalking range
        moveDirection = null
      }
    } else moveDirection = null

    //
    // UPDATE
    //
    const uiRange = radarRange(mobToAttack) ? Math.round(radarRange(mobToAttack)) : uiBlank
    const uiWhich = whichMob?.slice(0, 5) || uiBlank
    const uiDir = moveDirection || uiBlank
    set_message(`${uiRange} ${uiWhich} ${uiDir}`)

    if (character.xp < characterLast.xp) game_log(`Lost ${characterLast.xp - character.xp} xp`)

    setLeaderState()
    const updatedAt = new Date()
    setLSKey(character.id, { character, items, slots, smart, updatedAt })
  }

  //
  // FUNCTIONS
  //
  function isInjured(player) {
    if (!player || player.rip) return
    if (mobToAttack) return player.hp < player.max_hp - character.attack
    return player.hp < player.max_hp
  }

  const canKite = mob => character.speed > mob.speed && character.range > mob.range

  /**
   * State: kitingMob, kitePath, kitePathPoint
   */
  const kite = mob => {
    if (!mob) return console.log('[kite] error: missing mob')
    if (!kitePath) kitePath = closestPath(kitePaths[character.map])
    kitingMob = mob
    if (autoKitePath && kitePath) {
      if (!kitePathPoint) kitePathPoint = closestSafePoint(kitePath, mob)
      else if (distance(mob, kitePathPoint) < safeRangeFor(mob) * 1.5)
        // kitePathPoint = kitePath[nextPointIndex(kitePath, kitePathPoint)]
        kitePathPoint = closestSafePoint(kitePath, mob)
      if (!kitePathPoint) console.log('[kite] error: missing kitePathPoint')
      else {
        moveDirection = 'path'
        move(kitePathPoint.x, kitePathPoint.y)
      }
    } else {
      moveDirection = 'kite'
      moveToward(mob, -rangeChunk)
    }
  }

  const closestPoint = points =>
    points
      .map(o => ({ ...o, range: o && character ? distance(character, o) : Infinity }))
      .reduce(minRange, { range: Infinity })

  const closestPath = paths => {
    if (!paths?.length) return null
    // todo: closest point anywhere in any path?
    const closestTrailhead = closestPoint(paths.map(path => path[0]))
    return paths.find(o => o && o[0].x === closestTrailhead.x && o[0].y === closestTrailhead.y)
  }

  const closestSafePoint = (points, mob) =>
    closestPoint(points.filter(x => distance(mob, x) > safeRangeFor(mob)))

  const pointIndex = (points, point) => points.findIndex(o => o.x === point.x && o.y === point.y)

  const nextPointIndex = (points, point) => (pointIndex(points, point) + 1) % points.length

  // "radar" caches "radar pings" [{ mob, range }] for performance
  function updateRadar() {
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
  function getClosestRadarPing(pings) {
    return pings.reduce(minRange, { range: Infinity })?.mob
  }
  function getNearestMonster(props) {
    return getClosestRadarPing(getRadarPings({ ...props }))
  }
  const getNearestHostile = props => getClosestRadarPing(getRadarPings({ ...props, player: true }))

  const getRadarPings = (props = {}) =>
    radar.filter(({ mob }) => {
      if (mob.name === 'Target Automatron') return
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

  const getPriorityMob = () =>
    priorityMobTypes
      .map(mtype => getRadarPings({ mtype }).reduce(minRange, { range: Infinity }))
      .reduce(minRange, { range: Infinity }).mob

  const isTargetOf = mob => mob?.target === character.id

  const isHostilePlayer = mob =>
    !characterKeys.includes(mob.id) &&
    !characterKeys.includes(mob.party) &&
    (mob.map === 'arena' || parent.server_identifier === 'PVP')

  const isSafePrey = _mob => true
  //   character.range > mob.range &&
  //   mob.speed < character.speed &&
  //   !(G.classes[character.ctype].damage_type === 'physical' && mob.dreturn) &&
  //   !(G.classes[character.ctype].damage_type === 'magical' && mob.reflection))

  const moveToward = (mob, distance) => {
    if (mob.map !== undefined && mob.map !== character.map) return
    if (!can_move_to(mob.x, mob.y)) return smartMove(mob)
    const [x, y] = unitVector(character, mob)
    const safeDistance =
      radarRange(mob) && !autoMelee
        ? Math.min(distance, radarRange(mob) - safeRangeFor(mob) - character.speed)
        : distance
    move(character.x + x * safeDistance, character.y + y * safeDistance)
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
    return (
      character.q[cooldownKey] ||
      (parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey])
    )
  }

  function partyUp() {
    partyKeys.forEach(key => {
      if (!get_party()[key]) send_party_invite(key)
    })
  }

  const safeRangeFor = mob => {
    if (mob.attack === 0 || (mob.target && mob.target !== character.id)) return 0
    if (mob.attack < character.attack && mob.range > character.range) return 0
    return mob.range + mob.speed * 1.5
  }

  const smartMove = (destination, on_done) => {
    if (!smart.moving) smart_move(destination, on_done)
  }

  async function startParty() {
    for (let i = 0; i < partyKeys.length; i++) {
      if (!get_party()[partyKeys[i]] && !get_player(partyKeys[i])) {
        await startFollower(partyKeys[i])
      } else {
        comeToMe(partyKeys[i])
      }
    }
  }

  function startFollower(name) {
    return new Promise(resolve => {
      start_character(name, 'Follower')
      setTimeout(() => {
        comeToMe(name)
        resolve()
      }, timeStartup)
    })
  }

  function comeToMe(name) {
    const { map, real_x, real_y } = character
    if (!map) return game_log('[comeToMe] error: no map')
    const snippet = `smart_move({ map: '${map}', x: ${real_x}, y: ${real_y}})`
    try {
      parent.character_code_eval(name, snippet)
    } catch (e) {
      console.error(e)
    }
  }

  function changeServer() {
    const servers = ['US-I', 'US-II', 'US-III', 'US-PVP', 'EU-I', 'EU-II', 'EU-PVP', 'ASIA-I']
    const [region, identifier] = servers[Math.floor(Math.random() * servers.length)].split('-')
    change_server(region, identifier)
  }

  function useBank() {
    return new Promise((resolve, reject) => {
      parent.party_list.forEach(giveMeYourStuff)
      moveDirection = 'bank'
      smart_move('bank', () => setTimeout(() => {
        if (character.map !== 'bank') return reject()
        bank_deposit(123456789)
        console.log('bankStoreAll')
        bankStoreAll(resolve)
      }, 100))
    })
  }

  function giveMeYourStuff(name) {
    const { id } = character
    if (name === id) return
    const snippet = `
      parent.socket.emit('send', { name: '${id}', gold: 1234567890 })
      for (let i = 0; i < 28; i++) parent.socket.emit('send', { name: '${id}', num: i, q: 9999 })
    `
    parent.character_code_eval(name, snippet)
  }

  const bagSlot = (item, bag) => bagSlots(item, bag)[0]
  const bagSlots = (arg, bag) =>
    bag.map((o, slot) => (itemFilter(arg)(o) ? slot : null)).filter(isNotNull)
  const bankPack = x => (character.bank || {})[x] ?? []
  const getPackWithSpace = () => bankPackKeys.find(key => openSlotInBankPack(key) > -1)
  const isNotNull = x => x !== null
  const isNull = x => x === null
  const isStackableType = type => type && G.items[type]?.s
  const itemFilter = arg => o =>
    o?.name === (arg.name || arg.type) && (arg.level === undefined || o.level === arg.level)
  const openSlotInBankPack = key => bankPack(key).findIndex(isNull)
  const openSlots = bag => bag.map((o, slot) => (o ? null : slot)).filter(isNotNull)

  const bankStoreItem = async (item, slot) => {
    if (!item) return
    console.log('bankStoreItem', { item, slot })
    let stacked = false
    if (isStackableType(item.name)) {
      console.log('isStackableType', { item })
      let packKey
      for (let i = 0; i < bankPackKeys.length; i++) {
        packKey = bankPackKeys[i]
        if (stacked || !character.bank[packKey]) continue
        const packSlot = bagSlot(item, bankPack(packKey))
        console.log({ packKey, packSlot })
        if (packSlot > -1 && can_stack(item, bankPack(packKey)[packSlot])) {
          console.log(`stacking ${item.name}`)
          let openPackSlot = openSlotInBankPack(packKey)
          console.log(`openSlotInBankPack('${packKey}')`, openPackSlot)
          if (openPackSlot > -1) {
            await bankStore(slot, packKey, openPackSlot)
            parent.socket.emit('bank', {
              operation: 'move',
              pack: packKey,
              a: openPackSlot,
              b: packSlot,
            })
            stacked = true
          } // else
          const openSlot = openSlots(character.items)[0]
          if (openSlot > -1) {
            console.log(`can’t stack in full pack, but can swap to open slot`)
            const swapSlot = (packSlot + 1) % bagSize
            await bankRetrieve(packKey, swapSlot, openSlot)
            await bankStore(slot, packKey, swapSlot)
            await bankMove(packKey, swapSlot, packSlot)
            await bankStore(openSlot, packKey, swapSlot)
            stacked = true
          } else {
            game_log('stack failed: need open slot in bank or inventory')
          }
        }
      }
    }
    if (!stacked) {
      const packKey = getPackWithSpace()
      console.log('bankStoreItem !stacked', { packKey, slot })
      if (packKey) await bankStore(slot, packKey)
    }
  }

  async function bankStoreAll(resolve) {
    for (let i = 0; i < 28; i++) await bankStoreItem(character.items[i], i)
    if (resolve) resolve()
  }

  function bankStore(fromInventorySlot, toPackKey, toPackSlot) {
    return new Promise(resolve => {
      bank_store(fromInventorySlot, toPackKey, toPackSlot)
      setTimeout(resolve, emitDelay)
    })
  }

  function bankRetrieve(fromPackKey, fromPackSlot, toInventorySlot) {
    return new Promise(resolve => {
      bank_store(fromPackKey, fromPackSlot, toInventorySlot)
      setTimeout(resolve, emitDelay)
    })
  }

  function bankMove(fromPackKey, fromPackSlot, toPackSlot) {
    return new Promise(resolve => {
      parent.socket.emit('bank', {
        operation: 'move',
        pack: fromPackKey,
        a: fromPackSlot,
        b: toPackSlot,
      })
      setTimeout(resolve, emitDelay)
    })
  }

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }

  // Usage: `send_cm('Finger', 'useBank')`
  on_cm = (name, data) => {
    if (!characterKeys.includes(name)) return
    if (data === 'useBank') return useBank()
    if (data === 'changeServer') return changeServer()
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
