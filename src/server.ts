import { Game, Pathfinder } from 'alclient'
import {
  HiveMind,
  Logger,
  // MerchantBot,
  Data,
  PriestBot,
  RangerBot,
  WarriorBot,
} from './lib/sichii'
import { isAvailable } from './lib/earthiverse'

async function run() {
  await Promise.all([Game.loginJSONFile('../.alclient/credentials.json'), Pathfinder.prepare()])
  Data.populate()

  const hiveMind = new HiveMind()

  // const merchant = await MerchantBot.startAsync('Dinger', 'US-II', hiveMind)
  // merchant.visitParty = true
  const warrior = await WarriorBot.startAsync('Banger', 'US-II', hiveMind)
  const priest = await PriestBot.startAsync('Hunger', 'US-II', hiveMind)
  const ranger = await RangerBot.startAsync('Longer', 'US-II', hiveMind)

  console.log({ priest, ranger, warrior })

  const merchant = await Game.startMerchant('Dinger', 'US', 'PVP')
  console.log("isAvailable('upgrade')", isAvailable('upgrade'))

  console.log('Moving to main')
  await merchant.smartMove('main')
  console.log('Moving to cyberland')
  await merchant.smartMove('cyberland')
  console.log('Moving to halloween')
  await merchant.smartMove('halloween')

  Game.disconnect()
}

async function main() {
  try {
    run()
  } catch (e) {
    Logger.Error(e)
  }
}

main()
