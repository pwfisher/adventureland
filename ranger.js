/*
 * Docs: https://github.com/kaansoral/adventureland
 */
const autoAttack = true
const autoMove = true
const autoRespawn = false

const loopTime = 250

setInterval(function() {
	if (autoRespawn && character.rip) {
		respawn
		return
	}

	use_hp_or_mp()
	loot()

	const target = getTarget()

	if (autoAttack && can_attack(target)) attack(target)

	if (autoMove) {
		if (target && !is_in_range(target)) moveHalfwayTo(target)
		if (is_moving(character) && is_in_range(target)) stop() // not halfway
	}

}, loopTime)

function getTarget () {
	let target = get_targeted_monster()
	if (!target) {
		target = get_nearest_monster({ min_xp: 100, max_att: 120 })
		if (target) change_target(target)
		else set_message('No Monsters')
	}
	return target
}

function moveHalfwayTo(target) {
	move (
		character.x + (target.x - character.x) / 2,
		character.y + (target.y - character.y) / 2
	)
}
