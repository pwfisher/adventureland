import { SkillKey } from '../../types/adventureland'

export function isOnCooldown(skillKey: SkillKey) {
  const cooldownKey = G.skills[skillKey]?.share ?? skillKey
  return parent.next_skill[cooldownKey] && Date.now() < parent.next_skill[cooldownKey]
}
