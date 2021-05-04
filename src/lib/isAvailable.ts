import { SkillKey } from '../types/adventureland'
import { arrayOf, isOnCooldown } from '.'

export function isAvailable(skillKey: SkillKey): boolean {
  const skill = G.skills[skillKey]
  if (!skill) throw `skillKey '${skillKey}" not found in G.skills`

  const { ctype, level, mp, mp_cost, slots, stoned, rip } = character
  const mainhandWtype = G.items[slots.mainhand.name].wtype
  const requiredMp = skill.mp ?? ['attack', 'heal'].includes(skillKey) ? mp_cost : null

  if (stoned || rip) return false
  if (skill.level && skill.level > level) return false
  if (skill.wtype && !arrayOf(skill.wtype).includes(mainhandWtype)) return false // todo other weapon? any slot?
  if (skill.slot?.some(([slot, name]) => slots[slot]?.name !== name)) return false
  if (skill.class && !skill.class.includes(ctype)) return false
  if (requiredMp !== null && mp < requiredMp) return false
  if (isOnCooldown(skillKey)) return false
  return true
}
