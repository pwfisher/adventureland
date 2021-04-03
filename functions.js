const getEntityArray = () => Object.keys(parent.entities).map(k => parent.entities[k])
const getPlayers = () => getEntityArray().filter(o => o.player)
const getPlayerNames = () => getPlayers().map(o => o.name)
