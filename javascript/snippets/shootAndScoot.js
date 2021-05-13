;(async function () {
  let lastPotion = new Date()
  set_message('shootAndScoot')

  setInterval(shootAndScoot, 1000)
  setInterval(() => {
    usePotion()
    loot()
  }, 250)

  //
  // FUNCTIONS
  //
  function shootAndScoot() {
    // Hardcoded to a specific door
    if (character.map === 'level2n') {
      const mob = get_targeted_monster()
      if (mob) attack(mob)
      parent.socket.emit('transport', { to: 'level2w', s: 2 })
    } else parent.socket.emit('transport', { to: 'level2n', s: 1 })
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
})()
// end shootAndScoot.js
