import { MapName } from './enum'

/**
 * [0]: The x-position of the door
 * [1]: The y-position of the door
 * [2]: The width of the door
 * [3]: The height of the door
 * [4]: The map that this door leads to (use in combination with [5] (spawn))
 * [5]: The spawn that this door leads to (use in combination with [4] (map))
 * [6]: The spawn that this door is close to on the current map
 * [7]: ??? Maybe "locked" or "ulocked"?
 * [8]: ??? There's reference to "complicated" in smart_move?
 */
export type DoorInfo = [number, number, number, number, MapName, number?, number?, string?, string?]
