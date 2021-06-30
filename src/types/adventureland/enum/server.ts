export type ServerRegion = 'ASIA' | 'EU' | 'US'
export type ServerIdentifier = 'I' | 'II' | 'III' | 'PVP'
export type ServerKeyFormat = `${ServerRegion}-${ServerIdentifier}`

// Not all possible server keys actually exist
export const serverKeys: ReadonlyArray<ServerKeyFormat> = [
  'US-I',
  'US-II',
  'US-III',
  'US-PVP',
  'EU-I',
  'EU-II',
  'EU-PVP',
  'ASIA-I',
]

export type ServerKey = typeof serverKeys[number]

export const serverSpecs = serverKeys.map(x => x.split('-')) as [ServerRegion, ServerIdentifier][]
