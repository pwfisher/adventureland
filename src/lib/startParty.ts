import { partyKeys, timeStartup } from '../config'
import { comeToMe } from './comeToMe'

export function startParty() {
  partyKeys.forEach((name, index) => {
    if (!parent.party_list.includes(name) && !get_player(name)) {
      setTimeout(() => start_character(name, 'Follower'), index * timeStartup)
      setTimeout(() => comeToMe(name), index * timeStartup + timeStartup)
    }
  })
}
