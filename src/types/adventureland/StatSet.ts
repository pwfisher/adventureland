import { StatType } from './enum/StatType'

export type StatSet = { [T in StatType]?: number }
