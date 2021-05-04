import { SkillKey } from '../types/adventureland'

export function isOnCooldown(skillKey: SkillKey) {
  const cooldownKey = G.skills[skillKey]?.share ?? skillKey
  const nextAt = parent.next_skill[cooldownKey]
  return nextAt && new Date() < nextAt
}
