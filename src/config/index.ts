import { Character } from '../types/adventureland'

const isMeleeType = (player: Character) => window.classes[player.ctype]?.damage_type === 'physical'

//
// CONFIG
//
const autoAttack = true
let autoAvoidWillAggro = true
const autoDefend = true
const autoFollow = true
let autoHostile = false
const autoKite = !isMeleeType(character)
const autoLoot = true
const autoMelee = isMeleeType(character)
let autoMob = ''
const autoPotion = true
let autoPriority = false
const autoRespawn = true
const autoSquish = true
const autoStalk = true
const characterKeys = ['Banger', 'Binger', 'Dinger', 'Finger', 'Hunger', 'Longer', 'Zinger']
let priorityMobTypes = []
const rangeChunk = character.speed
const rangeFollow = 10
const rangeRadar = Infinity
const rangeStalk = [character.range * 0.8, character.range]
const tickDelay = 250
const uiBlank = '--'

smart.use_town = false
