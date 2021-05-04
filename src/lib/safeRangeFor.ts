import { Entity } from '../types'

export const safeRangeFor = (mob: Entity) => {
  if (mob.attack === 0 || (mob.target && mob.target !== character.id)) return 0
  return mob.range + mob.speed
}
