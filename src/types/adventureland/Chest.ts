import { PositionReal } from 'alclient'

export type Chest = PositionReal & {
  alpha: number
  skin: 'chest3' | 'chest4' | string
}
