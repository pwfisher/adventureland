import { CharacterKey } from '../../../types'

function giveMeYourStuff(name: CharacterKey) {
  // keeping bottom row for yourself. hence 35
  const { id } = character
  if (name === id) return
  const snippet = `
    parent.socket.emit('send', { name: '${id}', gold: 1234567890 })
    for (let i = 0; i < 35; i++) parent.socket.emit('send', { name: '${id}', num: i, q: 9999 })
  `
  parent.character_code_eval(name, snippet)
  setTimeout(() => parent.socket.emit('send', { name, gold: 100000 }), character.ping * 3)
}

parent.party_list.forEach(giveMeYourStuff)

// stop my code (as leader)
// pick a follower, X
// stop follower X
// wait
// restart X as new leader
// accept party invite
// travel to bank
// deposit all gold
// store items, keeping last row
// travel to X
// stop X
// wait a tick
// start my code (as leader)
// wait
// restart X as follower again
