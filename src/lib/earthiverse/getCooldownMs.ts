import { SkillKey } from '../../types'

export function getCooldownMs(skill: SkillKey, ignorePing = false) {
  const nextAt = parent.next_skill?.[skill]
  const { ping } = character
  if (!nextAt) return ping
  const ms = nextAt.getTime() - Date.now()
  if (ignorePing) return ms + 1
  return ms < ping ? ping : ms + 1
}
