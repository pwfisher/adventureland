import { MapKey } from './enum/MapKey'
import { IPosition } from 'alclient'

export type PositionSmart = IPosition & {
  map: MapKey
  transport?: boolean
  i?: number
  s?: number
}
