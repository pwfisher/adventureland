export function openStandInTown() {
  if (character.stand) close_stand()
  smart_move({
    map: 'main',
    x: -100 - Math.round(Math.random() * 50),
    y: -100 - Math.round(Math.random() * 50),
  }, () => {
    move(character.x, character.y + 1) // face front
    open_stand()
  })
}
