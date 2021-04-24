import { SkillKey } from '../../types/adventureland'
import { isOnCooldown } from '../pwfisher'

export function isAvailable(skillKey: SkillKey): boolean {
  const skill = G.skills[skillKey]
  if (!skill) throw `isAvailable: skillKey "${skillKey}" not found in G.skills`

  const { level, slots, stoned, rip } = character
  const mainhandWtype = G.items[slots.mainhand.name].wtype

  // Check if we have a status effect preventing us from using this skill
  if (stoned || rip) return false

  // Check if we have the required level to use this skill
  if (skill.level && skill.level > level) return false

  // Check if we have the required weapon to use this skill
  if (skill.wtypes && !skill.wtypes.includes(mainhandWtype)) return false

  // Check if we have the required items to use this skill
  if (skill.slot?.some(([slot, name]) => character.slots[slot]?.name !== name)) return false

  // Check if we have the required class to use this skill
  if (skill.class && !skill.class[character.ctye]) return false

  // Check we have enough MP to use this skill
  const requiredMp = skill.mp ?? ["attack", "heal"].includes(skillKey) ? character.mp_cost : null
  if (requiredMp !== null && character.mp < requiredMp) return false

  // Check if the skill is on cooldown
  if (isOnCooldown(skillKey)) return false

  return true
}
