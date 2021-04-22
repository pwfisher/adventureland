# Naming

Naming. One of the two hard things in computer science.

- "bag" -- An array of items, either 1) the current character inventory or 2) a shared bank pack.
- "inventory" -- The `character.items` bag. Not shared with other characters.
- "name" -- Deprecated. Usually some kind of key id, but sometimes a display name (e.g. for display name "Target Automatron" [try `show_json(Object.fromEntries(Object.entries(G.monsters).filter(([k]) => k.includes('target'))))`], there are multiple `MonsterType` values). Used imprecisely and interchangeably with id, key, CharacterKey, NPCType, ItemKey, etc. Source of confusion and challenge for the inexperienced?
- "num" -- Adventureland-speak for zero-based index within a bag of items. I call it a "slot".
- "pack" -- A named bag of items in the bank (e.g. `character.bank['items0']`). Shared by all your characters.
- "slot" -- A zero-based index within a bag. Trade slots and equipment slots have one-based, enumerated names.
