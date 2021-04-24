import { Dictionary, KitePath, MapKey } from '../types'
import { arrayOf } from '../lib/pwfisher'

const caveLoop: KitePath = [
  { x: 375, y: -200 }, // lower left
  { x: 575, y: -200 },
  { x: 650, y: -350 },
  { x: 575, y: -475 },
  { x: 400, y: -500 },
  { x: 300, y: -350 },
]

const tunnelLoop: KitePath = [
  // todo fix: hug walls
  { x: 0, y: -75 }, // bottom
  { x: 125, y: -125 },
  { x: 200, y: -350 },
  { x: 150, y: -550 },
  { x: 0, y: -600 },
  { x: -150, y: -575 },
  { x: -175, y: -350 },
  { x: -125, y: -125 },
]

/**
 * NB: when a point is repeated in the sequence, nextPoint(x) !== 0
 */
export const kitePaths: Dictionary<MapKey, KitePath[]> = {
  cave: [
    [
      // from west
      { x: -50, y: -350 },
      { x: 0, y: -200 },
      caveLoop[0],
      caveLoop[1],
      caveLoop[2],
      caveLoop[3],
      caveLoop[4],
      caveLoop[5],
      caveLoop[0],
    ],
    [
      // from north
      { x: 400, y: -800 },
      caveLoop[4],
      caveLoop[5],
      caveLoop[0],
      caveLoop[1],
      caveLoop[2],
      caveLoop[3],
      caveLoop[4],
    ],
    [
      // from south
      { x: 1000, y: 75 },
      { x: 600, y: 50 },
      caveLoop[1],
      caveLoop[2],
      caveLoop[3],
      caveLoop[4],
      caveLoop[5],
      caveLoop[0],
      caveLoop[1],
    ],
  ],
  tunnel: tunnelLoop.map(
    (_, i): KitePath => [...arrayOf(tunnelLoop.slice(i)), tunnelLoop.slice(0, i + 1)] // hack until we support closest point anywhere in path, not just trailhead
  ),
}
