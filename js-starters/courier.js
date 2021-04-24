;(function () {
  /**
   * Courier
   *
   * Merchant specializing in bank deposit and storage runs.
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */

  //
  // CONFIG
  //
  let autoAvoidWillAggro = true
  const autoElixir = false
  const autoFollow = false
  // const autoKeepAway = false // todo? maintain 600px+ range for tracktrix
  const autoKite = true
  const autoLoot = true
  const autoPotion = true
  const autoRespawn = true
  const characterKeys = [
    'Banger',
    'Binger',
    'Dinger',
    'Finger',
    'Hunger',
    'Linger',
    'Longer',
    'Winger',
    'Zinger',
  ]
  const rangeChunk = 50
  const rangeFollow = 10
  const rangeRadar = Infinity
  const tickDelay = 250
  const uiBlank = '--'

  smart.use_town = true

  //
  // STATE
  //
  let kitingMob = null
  let lastPotion = new Date()
  let leader
  let leaderSmart
  let mobs = {}
  let moveDirection = null // null | 'in' | 'out' | 'kite' | 'smart'
  let radar = [] // [{ mob: Entity, range: Number }]

  const resetState = () => {
    kitingMob = null
    mobs = {}
    moveDirection = null
    radar = []
  }

  //
  // TICK
  //
  setInterval(tick, tickDelay)
  function tick() {
    ;({ character: leader, smart: leaderSmart } = get('leader-state') ?? {})
    ;({ autoAvoidWillAggro } = get('follower-config') || {})
    const { rip } = character

    if (rip && autoRespawn && radar.length) respawn()
    if (rip || smart.moving) resetState()
    if (rip) return

    if (autoElixir) useElixir()
    if (autoLoot) loot()
    if (autoPotion) usePotion()

    //
    // RADAR
    //
    updateRadar()
    const aggroMob = getNearestMonster({ target: character.id, min_att: 1 })
    const hostileMob = getNearestHostile()
    const willAggroMob = getNearestMonster({ aggro: true, min_att: 1 })
    mobs = { aggroMob, hostileMob, kitingMob, willAggroMob }
    if (!aggroMob) kitingMob = null

    //
    // MOVEMENT
    //
    if (aggroMob && (kitingMob || autoKite) && radarRange(aggroMob) <= safeRangeFor(aggroMob))
      kite(aggroMob)
    else if (
      autoAvoidWillAggro &&
      willAggroMob &&
      radarRange(willAggroMob) <= safeRangeFor(willAggroMob)
    )
      moveToward(willAggroMob, -rangeChunk)
    else followOrStop()

    //
    // UPDATE
    //
    const uiRange = radarRange(leader) ? Math.round(radarRange(leader)) : uiBlank
    const uiDir = smart.moving ? 'smart' : kitingMob ? 'kite' : moveDirection || uiBlank
    set_message(`${uiRange} cour ${uiDir}`)
    set(`${character.id}:items`, character.items)
  }

  //
  // FUNCTIONS
  //
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

  const isHostilePlayer = mob =>
    !characterKeys.includes(mob.id) &&
    !characterKeys.includes(mob.party) &&
    (mob.map === 'arena' || parent.server_identifier === 'PVP')

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

  const safeRangeFor = mob => {
    if (mob.attack === 0 || (mob.target && mob.target !== character.id)) return 0
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

  function useElixir() {
    if (character.slots.elixir) return
    const slot = character.items.findIndex(o => o && G.items[o.name].type === 'elixir')
    if (slot > -1) equip(slot)
  }

  function isOnCooldown(skill) {
    const cooldownKey = G.skills[skill]?.share ?? skill
    return parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey]
  }

  //
  // Banking
  //
  const bagSlot = (item, bag) => bagSlots(item, bag)?.[0]
  const bagSlots = (props, bag) =>
    bag.map((o, slot) => (itemFilter(props)(o) ? slot : null)).filter(isNotNull)
  const bankPack = x => (character.bank || {})[x] ?? []
  const bankPackKeys = Object.keys(bank_packs).filter(x => bank_packs[x][0] === 'bank')

  const bankStore = ({ name, type, level }) => {
    if (!character.bank) return
    Object.entries(character.items)
      .filter(([o]) => o?.name === (name ?? type))
      .filter(([o]) => level === undefined || o.level === level)
      .forEach(([o, slot]) => bankStoreItem(o, slot))
  }

  const bankStoreAll = () => character.items.forEach(bankStoreItem)

  const bankStoreItem = (item, slot) => {
    if (!item) return
    let stacked = false
    if (isStackableType(item.name)) {
      stacked = bankPackKeys.some(packKey => {
        const bag = bankPack(packKey)
        if (!bag.length) return
        const packSlot = bagSlot(item, bag)
        if (!packSlot || !can_stack(item, bag[packSlot])) return
        console.debug(`stacking ${item.name} in ${packKey}, slot ${packSlot}`)
        // stacking requires open slot + move
        let openPackSlot = bag.find(isNull)
        console.debug('openPackSlot', openPackSlot)
        if (openPackSlot) {
          bank_store(slot, packKey, openPackSlot)
          parent.socket.emit('bank', {
            operation: 'move',
            pack: packKey,
            a: openPackSlot,
            b: packSlot,
          })
          return true
        } // else
        const openSlot = character.items.findIndex(isNull)
        if (openSlot > -1) {
          console.debug('can’t stack in full bank pack, but can swap to open slot')
          const swapSlot = (packSlot + 1) % packSize
          bank_retrieve(packKey, swapSlot, openSlot)
          bank_store(slot, packKey, swapSlot)
          parent.socket.emit('bank', {
            operation: 'move',
            pack: packKey,
            a: swapSlot,
            b: packSlot,
          })
          bank_store(openSlot, packKey, swapSlot)
          return true
        } else {
          game_log('stack failed: need open slot in bank or inventory')
        }
      })
    }
    if (!stacked) {
      const packKey = bankPackKeys.find(k => bankPack(k).some(isNull))
      if (packKey) bank_store(slot, packKey)
    }
  }

  const isNotNull = x => x !== null
  const isNull = x => x === null
  const isStackableType = type => type && G.items[type]?.s
  const itemFilter = props => o =>
    o?.name === (props.name || props.type) && (props.level === undefined || o.level === props.level)

  //
  // HOOKS
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }
})()
// end courier.js
