  //
  // INIT
  //
  set('follower-config', { autoHostile, autoPriority, characterKeys, leaderKey, priorityMobTypes })
  
  //
  // FUNCTIONS
  //
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
