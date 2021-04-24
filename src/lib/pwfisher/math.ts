export interface Point {
  x: number
  y: number
}

export interface Ranged {
  range: number
}

export const arrayOf = (x: unknown) => (Array.isArray(x) ? x : [x])
export const average = (array: Array<number>) => array.reduce(sum) / array.length

export const closest = (from: Point, among: Point[]) =>
  among
    .map(o => ({ ...o, range: distance(from, o) }))
    .reduce(minRange, { range: Infinity }) as Point & Ranged

export const isNotNull = (x: unknown) => x !== null
export const isNull = (x: unknown) => x === null
export const minRange = (a: Ranged, b: Ranged) => (a.range < b.range ? a : b)
export const sum = (accumulator: number = 0, current: number) => accumulator + current

export function unitVector(from: Point, toward: Point): Point {
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  return { x: dx / magnitude, y: dy / magnitude }
}
