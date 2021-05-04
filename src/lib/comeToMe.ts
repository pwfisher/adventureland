import { CharacterKey } from '../types'

export function comeToMe(name: CharacterKey) {
  const { map, real_x, real_y } = character
  const snippet = `smart_move({ map: '${map}', x: ${real_x}, y: ${real_y}})`
  parent.character_code_eval(name, snippet)
}
