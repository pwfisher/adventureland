; (function () {
  /**
   * Upgrader
   *
   * @author Patrick Fisher <patrick@pwfisher.com>
   * @see https://github.com/kaansoral/adventureland
   */
  const TEMPORARILY_FALSE = false
  const TEMPORARILY_TRUE = true
  console.log({ TEMPORARILY_FALSE, TEMPORARILY_TRUE })

  //
  // CONFIG
  //
  const autoBuyDelay = 30 * 1000
  const autoCompound = true
  const autoCompoundLevelMax = 3
  const autoChangeClothing = true
  const autoChangeClothingDelay = 2000
  const autoExchange = true
  const autoLoot = false
  const autoLuck = true
  const autoParty = false
  const autoPonty = true // && TEMPORARILY_FALSE
  const autoPotion = true
  const autoRain = true
  const autoRealm = true // && TEMPORARILY_FALSE
  const autoRealmMinutes = 5
  const autoRespawn = true
  const autoSell = true
  const autoSellLevelMax = 3
  const autoStand = true
  const autoTown = true
  const autoUpgrade = true
  const autoUpgradeBuyType = '' // item key, e.g. 'staff'
  const autoUpgradeMaxGrade = 1
  const autoUpgradeMaxLevel = 6 // 7
  const autoUpgradeLevels = {
    bataxe: 5,
    cape: 8,
    coat: 8,
    crossbow: 0,
    dagger: 8,
    ecape: 6,
    eslippers: 8,
    epyjamas: 8,
    fireblade: 7,
    firestaff: 6, // optimal: min scroll to lvl 6, then upsize + primling
    harbringer: 0,
    mittens: 8,
    pickaxe: 3,
    quiver: 8,
    rod: 3,
    shield: 7,
    staff: 0,
    sword: 8,
    t2bow: 8,
    warmscarf: 8,
    wattire: 8,
    wbreeches: 8,
    wcap: 8,
    wgloves: 8,
    wingedboots: 2, // then manual scroll1
    wshoes: 8,
    xarmor: 3,
    xboots: 3,
    xgloves: 3,
    xhelmet: 3,
    xmace: 8,
    xmashat: 8,
    xmaspants: 8,
    xmasshoes: 8,
    xmassweater: 8,
    xpants: 3,
  }
  const bankPackKeys = ['items0', 'items1']
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
  const partyKeys = []
  const rangeBuy = 400
  const rangeRadar = Infinity
  const rangeSendGold = 400
  const tickDelay = 250

  const autoBuyTypes = {
    angelwings: true,
    armorbox: true,
    ascale: true,
    bcape: true,
    bfur: true,
    broom: true,
    candy0: true,
    candy1: true,
    cape: true,
    cring: true,
    crossbow: true,
    dagger: true,
    dexamulet: true,
    dexbelt: true,
    dexearring: true,
    dexring: true,
    ecape: true,
    eears: true,
    epyjamas: true,
    elixirdex0: true,
    elixirdex1: true,
    elixirdex2: true,
    elixirint0: true,
    elixirint1: true,
    elixirint2: true,
    elixirstr0: true,
    elixirstr1: true,
    elixirstr2: true,
    elixirvit0: true,
    elixirvit1: true,
    elixirvit2: true,
    eslippers: true,
    gbow: true,
    gcape: true,
    harbringer: true,
    intamulet: true,
    intbelt: true,
    intearring: true,
    intring: true,
    mbelt: true,
    mistletoe: true,
    mittens: true,
    ornamentstaff: true,
    oozingterror: true,
    orbg: true,
    pickaxe: true,
    poison: true,
    pumpkinspice: true,
    // quiver: true,
    rod: true,
    santasbelt: true,
    shield: true,
    skullamulet: true,
    smoke: true,
    spidersilk: true,
    // spookyamulet: true,
    sshield: true,
    // stramulet: true,
    strbelt: true,
    strearring: true,
    // strring: true,
    sweaterhs: true,
    sword: true,
    tigercape: true,
    tigerhelmet: true,
    tigershield: true,
    // tshirt0: true,
    // tshirt1: true,
    // tshirt2: true,
    // tshirt3: true,
    tshirt4: true,
    t2bow: true,
    vitearring: true,
    // vitring: true,
    // warmscarf: true,
    wattire: true,
    wbook0: true,
    wbookhs: true, // book of cheer
    wbreeches: true,
    wcap: true,
    wgloves: true,
    whiteegg: true,
    wingedboots: true,
    wshoes: true,
    xmace: true,
    xmashat: true,
    xmaspants: true,
    xmasshoes: true,
    xmassweater: true,
  }

  const autoSellTypes = [
    'bandages',
    'basher',
    'bwing',
    'beewings',
    'bowofthedead',
    'candycanesword',
    'cclaw',
    'crabclaw',
    'cshell',
    'coat',
    'coat1',
    // 'dagger',
    'dstones',
    'frogt',
    'gloves',
    'gloves1',
    'gphelmet',
    'gslime',
    'harmor',
    'hbow',
    'hboots',
    'helmet',
    'helmet1',
    'hgloves',
    'hhelmet',
    'hpamulet',
    'hpants',
    'hpbelt',
    'ijx',
    'jacko',
    'lspores',
    'maceofthedead',
    'merry', // bow of the merry ranger
    'pants',
    'pants1',
    'pmace',
    'pmaceofthedead',
    'rapier',
    'rattail',
    'rednose',
    'ringsj',
    // 'shadowstone',
    'shoes',
    'shoes1',
    'slimestaff',
    'smush',
    'snowball',
    'spear',
    'spores',
    'sstinger',
    //sword',
    'throwingstars',
    // 'warmscarf',
    // 'whiteegg',
  ].filter(x => x !== autoUpgradeBuyType)

  const ownedSkins = [
    'marmor10g',
    'marmor11b',
    'marmor12a',
    'marmor12b',
    'marmor2g',
    'marmor3d',
    'marmor5g',
    'mbody1h',
    'sarmor1f',
    'sarmor1g',
  ]

  const ownedHats = ['hat212', 'hat224', 'hat404']

  //
  // STATE
  //
  const resetState = () => { }

  //
  // INIT
  //
  if (autoRealm) {
    setTimeout(changeServer, autoRealmMinutes * 60 * 1000)
    setTimeout(() => game_log('Realm hop in 60 seconds'), (autoRealmMinutes - 1) * 60 * 1000)
  }
  if (autoTown) openStandInTown()
  set_message(`Upgrader`)

  //
  // LOOP
  //
  setInterval(tick, tickDelay)
  function tick() {
    const { items, map, rip, slots } = character

    if (rip && autoRespawn) {
      respawn()
      resetState()
    }
    if (rip) return

    if (smart.moving) resetState()

    //
    // ACTIONS
    //
    if (autoChangeClothing) changeClothing()
    if (autoParty) partyUp()
    if (autoPotion) use_hp_or_mp()
    if (autoRain) makeItRain()
    if (autoStand) {
      if (is_moving(character) && character.stand) close_stand()
      else if (!is_moving(character) && !character.stand) open_stand()
    }

    if (map !== 'bank') {
      if (autoCompound) compoundAny()
      if (autoExchange) exchangeSlot0()
      if (autoLuck) useMluck()
      if (autoPonty) buyFromPonty()
      if (autoSell)
        character.items.forEach((item, slot) => {
          if (
            autoSellTypes.includes(item?.name) &&
            (item?.level === undefined || item.level <= autoSellLevelMax)
          )
            sell(slot, 9999)
        })
      if (autoLoot) loot()
      if (autoUpgrade && !character.q.upgrade && !isOnCooldown('upgrade')) {
        const upgradeSlot = autoUpgradeableSlot()
        if (upgradeSlot > -1) {
          const scrollSlot = bagSlot(
            { type: 'scroll' + item_grade(character.items[upgradeSlot]) },
            character.items
          )
          if (scrollSlot) {
            if (character.items[upgradeSlot].level > 1) use_skill('massproductionpp')
            upgrade(upgradeSlot, scrollSlot)
          }
        } else if (autoUpgradeBuyType && !character.items[0]) buy(autoUpgradeBuyType)
      }
    }
    // alphabetize bank to group compoundables?
    // autoRealmRotate, buy from Ponty ['ringsj', 'intring', 'dexring', 'strring', ...]

    //
    // UPDATE
    //
    const updatedAt = new Date()
    setLSKey(character.id, { character, items, slots, smart, updatedAt })
  }

  //
  // Functions
  //
  function useMluck() {
    if (isOnCooldown('mluck') || character.mp < 10) return
    if (character.s?.mluck?.f !== character.name) return use_skill('mluck', character)
    return Object.entries(parent.entities)
      .filter(([_, mob]) => mob.player && !mob.npc)
      .filter(([_, mob]) => !mob.s?.mluck?.strong)
      .filter(([_, mob]) => !mob.s?.mluck) // todo: or my peeps but not my mluck
      .filter(([_, mob]) => distance(character, mob) <= G.skills.mluck.range)
      .some(([_, mob]) => {
        use_skill('mluck', mob)
        game_log(`mluck mob: ${mob.id}`)
        sendItem(mob.id, 'whiteegg', 1)
        return true
      })
  }

  function sendItem(characterKey, itemKey, quantity) {
    const slot = character.items.findIndex(o => o?.name === itemKey)
    parent.socket.emit('send', { name: characterKey, num: slot, q: quantity })
  }

  function makeItRain() {
    if (character.gold < 10 * 1000 * 1000) return
    const targets = Object.entries(parent.entities)
      .filter(([_, mob]) => mob.player && !mob.npc)
      .filter(([_, mob]) => distance(character, mob) <= rangeSendGold)
      .map(([_, mob]) => mob.id)
    if (targets.length) parent.socket.emit('send', { name: shuffle(targets)[0], gold: 1 })
  }

  // @see https://stackoverflow.com/a/12646864/161182
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  function useMining() {
    smart_move({ map: 'tunnel', x: -275, y: -50 }, () => {
      setTimeout(() => use_skill('mining'), tickDelay)
    })
  }

  function useBank() {
    return new Promise((resolve, reject) => {
      parent.party_list.forEach(giveMeYourStuff)
      smart_move('bank', () => {
        if (character.map !== 'bank') return reject()
        bank_deposit(123456789)
        console.log('bankStoreAll')
        bankStoreAll()
        resolve()
      })
    })
  }

  function exchangeSlot0() {
    if (character.q.exchange || isOnCooldown('exchange')) return
    if (isExchangeableType(character.items[0]?.name)) exchange(0)
  }

  function openStandInTown() {
    smart_move({ map: 'main', x: 118, y: -135 }, () => move(118, -134))
  }

  function partyUp() {
    partyKeys.forEach(key => {
      if (!get_party()[key]) send_party_invite(key)
    })
  }

  const compoundAny = () =>
    character.items.some(item => {
      if (
        character.q.compound ||
        isOnCooldown('compound') ||
        !isCompoundableType(item?.name) ||
        bagCount(item, character.items) < 3 ||
        item.level >= autoCompoundLevelMax
      )
        return
      const slots = bagSlots(item, character.items)
      const scrollSlot = bagSlot({ type: 'cscroll' + compoundScrollGrade(item) }, character.items)
      if (scrollSlot > -1) {
        use_skill('massproductionpp')
        return compound(slots[0], slots[1], slots[2], scrollSlot)
      }
      else set_message('need cscroll' + item_grade(item))
    })

  // Upsize compound scroll for all items at level 1
  const compoundScrollGrade = item => item_grade(item) + (item.level === 1 ? 1 : 0)

  const isNotNull = x => x !== null

  const isCompoundableType = type => !!(type && G.items[type].compound)
  const isExchangeableType = type => !!(type && G.items[type]?.e)
  const isStackableType = type => !!(type && G.items[type]?.s)
  const isUpgradeableType = type => !!(type && G.items[type]?.upgrade)

  const isAutoUpgradeableItem = item => isUpgradeableType(item?.name) &&
    (
      autoUpgradeLevels[item.name] > -1
        ? item.level < autoUpgradeLevels[item.name]
        : item.level < autoUpgradeMaxLevel && item_grade(item) <= autoUpgradeMaxGrade
    )
  const autoUpgradeableSlot = () => character.items.findIndex(o => isAutoUpgradeableItem(o))

  // A "bag" is character.items or, e.g., character.bank['items0']
  // name or type is required (no filter just by level). Support name or type due to handle data structure inconsistency.
  const itemFilter = arg => o =>
    o?.name === (arg.name || arg.type) && (arg.level === undefined || o.level === arg.level)
  const bagCount = (item, bag) =>
    item && Array.isArray(bag)
      ? bag.filter(itemFilter(item)).reduce((x, o) => x + (o.q || 1), 0)
      : 0
  const bankCount = item =>
    bankPackKeys.map(x => bagCount(item, character.bank[x])).reduce((x, o) => x + o, 0)
  const bagSlot = (item, bag) => bagSlots(item, bag)?.[0]
  const bagSlots = (arg, bag) =>
    bag.map((o, slot) => (itemFilter(arg)(o) ? slot : null)).filter(isNotNull)
  const openSlots = bag => bag.map((o, slot) => (o ? null : slot)).filter(isNotNull)

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

  function isOnCooldown(skill) {
    const cooldownKey = G.skills[skill]?.share ?? skill
    return parent.next_skill[cooldownKey] && new Date() < parent.next_skill[cooldownKey]
  }

  function distanceToNPC(npcKey) {
    const npc = parent.npcs.find(x => x.id === npcKey)
    if (!npc) return Infinity
    const [x, y] = npc.position
    return distance(character, { x, y })
  }

  let usedPontyAt = 0

  function buyFromPonty() {
    if (distanceToNPC('secondhands') > rangeBuy) return
    const now = Date.now()
    if (now - usedPontyAt < autoBuyDelay) return
    usedPontyAt = now
    parent.socket.once('secondhands', items => {
      items.forEach(({ name, rid }) => {
        if (!autoBuyTypes[name]) return
        parent.socket.emit('sbuy', { rid })
      })
    })
    parent.socket.emit('secondhands')
  }

  function changeServer() {
    const servers = ['US-I', 'US-II', 'US-III', 'US-PVP', 'EU-I', 'EU-II', 'EU-PVP', 'ASIA-I']
    const [region, identifier] = servers[Math.floor(Math.random() * servers.length)].split('-')
    change_server(region, identifier)
  }

  //
  // Hooks
  //
  on_party_invite = key => {
    if (characterKeys.includes(key)) accept_party_invite(key)
  }

  // adventure.land/comm "Command" input:
  // send_cm('Dinger', 'changeServer')
  on_cm = (name, data) => {
    if (!characterKeys.includes(name)) return
    if (data === 'changeServer') return changeServer()
    if (data === 'openStandInTown') return openStandInTown()
    if (data === 'useMining') return useMining()
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

  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)]
  // const altRandomElement = (array) => shuffle([...array])[0] // less code but slow

  let changedClothingAt = 0

  function changeClothing () {
    const now = Date.now()
    if (now - changedClothingAt < autoChangeClothingDelay) return
    changedClothingAt = now
    parent.socket.emit("cx", { slot: "skin", name: getRandomElement(ownedSkins) })
    parent.socket.emit("cx", { slot: "hat", name: getRandomElement(ownedHats) })
  }
})()
// end upgrader.js
