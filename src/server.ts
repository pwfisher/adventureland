import { Game, Pathfinder } from 'alclient'

async function run() {
  await Promise.all([
    Game.loginJSONFile('../.alclient/credentials.json'),
    Pathfinder.prepare(),
  ])

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
run()

import { HiveMind, Logger, MerchantScript, Data, PriestScript, RangerScript, WarriorScript } from './lib/sichii'

async function main() {
  try {
    await Promise.all([
      Game.loginJSONFile('../.alclient/credentials.json'),
      Pathfinder.prepare(),
    ])
    Data.populate()

    const hiveMind = new HiveMind()
    const merchant = await MerchantScript.startAsync("sichi", "US", "II", hiveMind)
    const warrior = await WarriorScript.startAsync("makiz", "US", "II", hiveMind)
    const priest = await PriestScript.startAsync("ragnah", "US", "II", hiveMind)
    const ranger = await RangerScript.startAsync("dreamweaver", "US", "II", hiveMind)

    // merchant.visitParty = true
  } catch (e) {
    Logger.Error(e)
  }
}

main()
