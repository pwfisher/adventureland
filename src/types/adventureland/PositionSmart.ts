import { MapName } from './enum/MapName'
import { IPosition } from 'alclient'

export type PositionSmart = IPosition & {
  map: MapName
  transport?: boolean
  i?: number
  s?: number
}
