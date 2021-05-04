export function useElixir() {
  if (character.slots.elixir) return
  const slot = character.items.findIndex(o => o && G.items[o.name].type === 'elixir')
  if (slot > -1) equip(slot)
}
