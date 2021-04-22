import { characterKeys } from '../config'
import { Bag } from '../types'

export abstract class BaseBot {

  let character: Character
  let inventories: Bag[]

  setLSKey(`${character.id}:items`, character.items)
  inventories = characterKeys.map(key => get(`${key}:items`))
}
