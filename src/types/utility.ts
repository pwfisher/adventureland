/**
 * Dictionary: Record replacement, handle undefined values.
 * @see https://fnune.com/typescript/2019/01/30/typescript-series-1-record-is-usually-not-the-best-choice/
 */
type DictionaryKey = string | number | symbol
export type Dictionary<K extends DictionaryKey, T> = { [P in K]?: T }
