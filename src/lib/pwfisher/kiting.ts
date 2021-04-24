import { Entity, KitePath } from '../../types'
import { kitePaths } from '../../config'
import { closest } from './math'

export const canKite = (mob: Entity) => character.speed > mob.speed && character.range > mob.range

export const closestPath = (paths?: KitePath[]) => {
  // todo: closest point anywhere in any path?
  if (!paths) return null
  const point = closest(
    character,
    paths.map(path => path[0])
  )
  return paths.find(path => path[0].x === point.x && path[0].y === point.y)
}

export const kite = (mob: Entity) => {
  if (!character.map) return
  const kitePath = closestPath(kitePaths[character.map])
  kitingMob = mob
  if (autoKitePath && mob.hp > character.attack * 10 && kitePath) {
    // nb: no path if mob.hp low
    if (!kitePathPoint) kitePathPoint = closestSafePoint(kitePath, mob)
    else if (distance(mob, kitePathPoint) < safeRangeFor(mob) * 1.5)
      // mob cuts corner
      kitePathPoint = kitePath[nextPointIndex(kitePath, kitePathPoint)]
    move(kitePathPoint.x, kitePathPoint.y)
  } else return moveToward(mob, -rangeChunk)
}
