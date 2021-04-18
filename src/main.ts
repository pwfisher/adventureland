import AL from 'alclient'

async function run() {
  await Promise.all([
    AL.Game.loginJSONFile('../.alclient/credentials.json'),
    AL.Pathfinder.prepare(),
  ])

  const merchant = await AL.Game.startMerchant('Dinger', 'US', 'PVP')
  console.log('Moving to main')
  await merchant.smartMove('main')
  console.log('Moving to cyberland')
  await merchant.smartMove('cyberland')
  console.log('Moving to halloween')
  await merchant.smartMove('halloween')

  AL.Game.disconnect()
}
run()
