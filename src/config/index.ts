import { Character } from '../types/adventureland'

export const isMeleeType = (player: Character) => window.classes[player.ctype]?.damage_type === 'physical'

//
// CONFIG
//
export const autoAttack = true
export let autoAvoidWillAggro = true
export const autoDefend = true
export const autoFollow = true
export let autoHostile = false
export const autoKite = !isMeleeType(character)
export const autoLoot = true
export const autoMelee = isMeleeType(character)
export let autoMob = ''
export const autoPotion = true
export let autoPriority = false
export const autoRespawn = true
export const autoSquish = true
export const autoStalk = true
export const characterKeys = ['Banger', 'Binger', 'Dinger', 'Finger', 'Hunger', 'Longer', 'Zinger']
export let priorityMobTypes = []
export const rangeChunk = character.speed
export const rangeFollow = 10
export const rangeRadar = Infinity
export const rangeStalk = [character.range * 0.8, character.range]
export const tickDelay = 250
export const uiBlank = '--'

smart.use_town = false
