import { ConditionType, MonsterType, ServerKey } from './enum'
import { CharacterKey } from './Character'

/**
 * f: CharacterKey -- ("from") character who caused the status
 */
export type StatusInfo = {
  [T in ConditionType]?: { ms: number } // until expiry
} & {
  burned?: { f: CharacterKey; intensity: number } // dps?
  coop?: { id: string; p: number }
  mluck?: { f: CharacterKey; strong: boolean } // our own mluck is "strong" and takes priority
  monsterhunt?: { sn: ServerKey; id: MonsterType; c: number } // count
  citizen0aura?: { luck: number }
  citizen4aura?: { gold: number }
}
