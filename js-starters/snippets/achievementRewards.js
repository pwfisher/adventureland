/**
 * @see https://github.com/egehanhk/al-code-snippets/blob/main/other/list_achievements.js
 */
function achievementRewards() {
  if (!parent.tracker.max)
    return game_log('Please activate tracktrix item to populate achievement data.')
  const result = {}
  for (const mtype in parent.tracker.monsters) {
    if (!G.monsters[mtype]?.achievements) continue
    const score = parent.tracker.monsters[mtype] + parent.tracker.monsters_diff[mtype]
    for (const achievement of G.monsters[mtype].achievements) {
      const [scoreThreshold, achievementType, statType, rewardAmount] = achievement
      if (score < scoreThreshold || achievementType !== 'stat') continue
      result[statType] = (result[statType] ?? 0) + rewardAmount
    }
  }
  return result
}
show_json(achievementRewards())
