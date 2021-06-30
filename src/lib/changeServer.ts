import { serverSpecs } from '../types'

export function changeServer() {
  const [region, identifier] = serverSpecs[Math.floor(Math.random() * serverSpecs.length)]
  change_server(region, identifier)
}
