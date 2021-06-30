// replace game’s `set` to strip circular references
// prefix "cstore_" matches game get()
export function setLSKey(key: string, value: unknown) {
  try {
    window.localStorage.setItem(
      `cstore_${key}`,
      JSON.stringify(value, (k, v) => {
        // data-specific. nullify _foo, _bar, children, parent, scope.
        if (k[0] === '_') return null
        return ['children', 'parent', 'scope'].includes(k) ? null : v
      })
    )
    return true
  } catch (e) {
    game_log(`[setItemInLS] key: ${key}, error: ${e}`)
    return false
  }
}
