import { MapKey, ServerKey } from './enum'
import { Point } from '../../lib'

export type PositionRealm = PositionMovable & {
  server?: ServerKey
}

export type PositionMovable = PositionReal & {
  from_x?: number
  from_y?: number
  going_x?: number
  going_y?: number
}

export type PositionReal = Position & {
  real_x?: number
  real_y?: number
}

export type Position = Point & {
  map?: MapKey
}
