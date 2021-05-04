import { ServerIdentifier, serverKeys, ServerRegion } from '../types'

export function changeServer() {
  const [region, identifier] = serverKeys[Math.floor(Math.random() * serverKeys.length)].split('-')
  change_server(region as ServerRegion, identifier as ServerIdentifier)
}
