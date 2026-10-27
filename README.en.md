# cardbattle — a zero-dependency command-card battle engine

A tiny turn-based battle engine for web games: draw 5 cards, play 3, with **Arts / Quick / Buster** card types, a rock-paper-scissors class triangle, crit stars and Noble-Phantasm-style ultimates. ~400 lines of plain ES modules, no runtime dependencies.

> Mechanics like these are generic turn-based card design (not copyrightable). All code, names and visuals here are original; no third-party assets are included.

## Why

If you want a card-battle core in a web game you usually either write it from scratch inside Phaser/Cocos, or you end up with a Unity project that is painful to embed. The pure logic part — card selection, class affinity, charge gauge — is only a couple hundred lines, but it gets rewritten every time.

So here it is: **the engine computes numbers, you own the UI.** The bundled demo is a sub-300-line DOM interface proving it can stay thin.

## Features

- Draw 5 / play 3, deck built from living party members, seeded Fisher-Yates shuffle (reproducible)
- Arts charges NP (+20), Quick generates crit stars (+4), Buster hits harder (×1.65)
- Class affinity: Saber→Lancer→Archer→Saber and Rider→Caster→Assassin→Rider; advantage 1.5×, disadvantage 0.75×; Berserker 1.5× both ways
- NP card appears at 100%: AoE damage, resets the gauge
- Crit chance = stars × 5% (cap 90%), crit damage ×2
- Multiple waves, victory when the last wave is cleared
- `seed` makes runs replayable

## Quick start

```bash
git clone <repo> && cd cardbattle
npm test        # node --test, 9 cases
npm run demo    # zero-dependency static server → http://127.0.0.1:5173/
```

The demo uses ES modules, so serve it over HTTP (`npm run demo`); opening `demo/index.html` via `file://` is blocked by browsers.

## API

```js
import { createBattle, drawHand, playHand, snapshot } from './src/engine.js'

const battle = createBattle({ party, waves, seed: 42 })
drawHand(battle)
playHand(battle, [{ index: 0 }, { index: 2 }, { unitId: 'p1', type: 'B' }])
snapshot(battle) // read-only view for your UI
```

Tune numbers in `CARD_TYPES` (damage multiplier / NP / stars) and classes in `CLASSES`.

## Layout

```
src/engine.js      engine: affinity, draw, resolve, enemy AI, snapshot
src/data.js        demo party and three waves
demo/              playable DOM demo
tests/             9 unit tests
scripts/serve.mjs  tiny static server
```

## License

MIT — use, modify, ship, no attribution required.
