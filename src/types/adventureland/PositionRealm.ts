import { PositionMovable } from 'alclient'
import { ServerKey } from '.'

export type PositionRealm = PositionMovable & { server?: ServerKey }
