import { isMeleeType, TEMPORARILY_FALSE, TEMPORARILY_TRUE } from '../lib/pwfisher'

console.log({
  TEMPORARILY_FALSE,
  TEMPORARILY_TRUE,
  comment: 'A happy compiler is a good compiler.',
})

// master controls
export const autoMap = 'arena'
export const autoMelee = isMeleeType(character)
export const autoMob = ''
export const manualMode = false // || TEMPORARILY_TRUE

export * from './kitePaths'

export const autoAttack = true // && TEMPORARILY_FALSE
export const autoAvoidWillAggro = !autoMelee && !manualMode
export const autoDefend = true
export const autoFollow = true
export const autoHostile = false
export const autoKite = !autoMelee
export const autoKitePath = true
export const autoLoot = true
export const autoParty = true // && TEMPORARILY_FALSE
export const autoPotion = true
export const autoPriority = false
export const autoRealm = true // && TEMPORARILY_FALSE
export const autoRealmMinutes = 5
export const autoRespawn = true
export const autoRest = true
export const autoSquish = true
export const autoStalk = !manualMode
export const characterKeys = ['Banger', 'Binger', 'Dinger', 'Finger', 'Hunger', 'Longer', 'Zinger']
export const partyKeys = ['Hunger', 'Finger', 'Binger'].filter(x => x !== character.id).slice(0, 2)
export const preyAtkMax = 1000
export const preyXpMin = 300
export const priorityMobTypes = ['dracul', 'franky', 'froggie', 'greenjr', 'phoenix', 'wabbit']
export const rangeChunk = character.speed
export const rangeFollow = 10
export const rangeRadar = Infinity
export const rangeStalk = [character.range * 0.8, character.range]
export const tickDelay = 250
export const timeStartup = 4000
export const uiBlank = '--'

smart.use_town = false
