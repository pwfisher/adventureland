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

`smart_move` haiku time.

```js

  Read `smart_move` closely!
  Lovely method signature,
  it begs for TypeScript.

```

Then, after you run around a bit, see more delights such as

```js
show_json(colors)
show_json(get_party()) // goes stale. better: use local storage as communication channel from your other bots.
if (character.map === 'bank') show_json(character.bank)
```

- https://github.com/saevarb/adventureland-typescript-starter
