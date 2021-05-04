import { CharacterKey, Dictionary, Item } from '../types'
import { setLSKey, useElixir } from '../lib'

import { autoElixir, autoLoot, autoPotion, characterKeys } from '../config'
// const rangeSendItem = 200 // wag

//
// STATE
//
let inventories: Dictionary<CharacterKey, Item[]>

//
// INIT
//
setLSKey(`${character.id}:items`, character.items) // must keep in sync

async function main(): Promise<void> {
  if (autoElixir) useElixir()
  if (autoLoot) loot()
  if (autoPotion) usePotion()

  //
  // RADAR
  //
  inventories = Object.fromEntries(characterKeys.map(key => [key, get(`${key}:items`) as Item[]]))

  //
  // UPDATE
  //
}
;(async function () {
  while (true) await main()
})()
