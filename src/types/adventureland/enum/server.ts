export type ServerKey =
  | 'US-I'
  | 'US-II'
  | 'US-III'
  | 'US-PVP'
  | 'EU-I'
  | 'EU-II'
  | 'EU-PVP'
  | 'ASIA-I'

export const serverKeys: ServerKey[] = [
  'US-I',
  'US-II',
  'US-III',
  'US-PVP',
  'EU-I',
  'EU-II',
  'EU-PVP',
  'ASIA-I',
]

export type ServerIdentifier = 'I' | 'II' | 'III' | 'PVP'
export type ServerRegion = 'ASIA' | 'EU' | 'US' // key of window.server_names
