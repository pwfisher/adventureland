import { partyKeys } from '../config'

export function partyUp() {
  partyKeys.forEach(key => {
    if (!parent.party_list.includes(key)) send_party_invite(key)
  })
}
