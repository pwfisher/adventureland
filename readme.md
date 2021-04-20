# Naming

Naming. One of the two hard things in computer science.

- "bag" -- An array of items, either 1) the current character inventory or 2) a shared bank pack.
- "inventory" -- `character.items`. not shared with other characters.
- "name" -- Deprecated. Usually some kind of key id, but sometimes a display name (e.g. for display name "Target Automatron" [try `show_json(Object.fromEntries(Object.entries(G.monsters).filter(([k]) => k.includes('target'))))`], there are multiple `MonsterType` values). Used imprecisely and interchangeably with id, key, CharacterKey, NPCType, ItemKey, etc. Source of confusion and challenge for the inexperienced?
- "num" -- Adventureland-speak for zero-based index within a bag of items. I call it a "slot".
- "pack" -- A named bag of items in the bank (e.g. `character.bank['items0']`).
- "slot" -- A zero-based index within a bag. Except trade slots, which are one-based.

# Getting Started

Per the [docs](https://github.com/kaansoral/adventureland), your very first step should be to execute this:

```js
show_json(character)
show_json(character.items)
show_json(character.slots)
show_json(get_target())
show_json(parent.G.monsters)
show_json(parent.G.items)
show_json(parent.G.skills)
show_json(parent.G.npcs)
show_json(parent.M))
```

Read `smart_move` closely.
Then, after you run around a bit, see more delights such as

```js
show_json(colors)
show_json(get_party()) // goes stale. better: use local storage as communication channel from your other bots.
if (character.map === 'bank') show_json(character.bank)
```

See snippets.js and snippets-merchant.js for code to execute interactively.

- https://github.com/saevarb/adventureland-typescript-starter
