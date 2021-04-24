import { characterKeys } from '../config'
import { Bag, Character, CharacterKey, Dictionary } from '../types'

export abstract class BaseBot {

  private character: Character
  private inventories: Dictionary<CharacterKey, Bag>

  setLSKey(`${character.id}:items`, character.items)
  inventories = Object.fromEntries(characterKeys.map(key => [key, get(`${key}:items`)]))
}
