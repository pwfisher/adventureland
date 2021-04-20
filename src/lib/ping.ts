import { CharacterEntity } from '../types/adventurelandl

export const getPing = (character: CharacterEntity) => character.ping

export const averagePing = (character: CharacterEntity) => character.pings.reduce(sum) / character.pings.length

const sum = (accumulator, current) => accumulator + current
const x = [5,6]
x.reduce(sum) / x.length
