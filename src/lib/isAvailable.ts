import { SkillKey } from '../types/adventureland'
import { arrayOf, isOnCooldown } from '.'

export function isAvailable(skillKey: SkillKey): boolean {
  const skill = G.skills[skillKey]
  if (!skill) throw `skillKey '${skillKey}" not found in G.skills`

  const { ctype, level, mp, mp_cost, slots, stoned, rip } = character
  const mainhandWtype = G.items[slots.mainhand.name].wtype
  const mpNeeded = skill.mp ?? ['attack', 'heal'].includes(skillKey) ? mp_cost : null

  if (stoned || rip) return false
  if (skill.level && skill.level > level) return false
  if (skill.wtype && !arrayOf(skill.wtype).includes(mainhandWtype)) return false
  if (skill.slot?.some(([slot, name]) => slots[slot]?.name !== name)) return false
  if (skill.class && !skill.class.includes(ctype)) return false
  if (mpNeeded !== null && mp < mpNeeded) return false
  if (isOnCooldown(skillKey)) return false
  return true
}
