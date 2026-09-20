# Bows & Banners — Medieval Bow FPS

A fully offline medieval CTF bow-shooter built with three.js (r149, bundled
locally in `lib/`). No server, no internet, no external assets.

## Play

Open `index.html` in any modern browser (double-click is fine).

## Project structure

```
index.html      page, HUD markup, styles, script load order
lib/
  three.min.js  three.js r149 (non-module build, bundled for offline use)
js/             classic scripts, no build step — loaded in this order:
  utils.js      math helpers + synthesized audio (no audio files)
  textures.js   procedural canvas textures (grass, stone, timber, heraldry, sky)
  setup.js      renderer, scene, camera, sky dome, lights, clouds, resize
  config.js     equipment (5 sets) and weapon (3 bows + sword) data
  world.js      map geometry, the three flags, line-of-sight checks
  characters.js Character class, collision, bot/player models, damage
  arrows.js     arrow pool, arrow flight and hits
  bots.js       bot AI (raider / guard / flank / skirmisher roles)
  player.js     player state, weapons, first-person view model
  flags.js      flag pickup/capture rules, score, win/lose
  ui.js         HUD, kill feed, overlay, input handling
  main.js       bot spawning, main loop, initialization
```

The scripts share one global scope and must be loaded in the order listed in
`index.html` (they are plain scripts, not ES modules, so the game keeps
working when opened from disk offline).

You fight for the **RED** team against **BLUE** bots. Steal the enemy flag
or seize the **gold banner** from the central keep and carry it back to
your banner — **3 captures wins**. Everyone (you and bots) has **100 HP**.
No friendly fire: arrows and swords only hit the enemy team, and you can
only pick up flags that aren't your own.

## Map

A 250m battlefield, mirrored so both sides get identical terrain:

- **Bases** at each end — walled compounds with a gate and healing zone.
- **Central keep** — a walled courtyard guarding the **gold banner**; gates
  on the north and south, cover boulders flanking each gate.
- **Two crossing roads** (N–S and E–W) with side watchtowers at mid-flank.
- **Cover everywhere** — ruined walls, houses, trees and boulders on the
  flanks and in the mid, so you can outflank the center or push straight in.

## Controls

| Key                  | Action                                     |
| -------------------- | ------------------------------------------ |
| WASD / Shift / Space | Move / sprint (drains stamina) / jump      |
| Mouse                | Aim                                        |
| Left click           | Fire arrow / swing sword                   |
| Hold right click     | Draw bow (charge, zoom) / guard with sword |
| 1 / 2 / 3            | Shortbow · Greatbow · Crossbow             |
| 4                    | Sword (melee)                              |
| R                    | Reload quiver                              |
| E or Tab             | Cycle equipment (5 armor sets)             |
| M                    | Sound on/off                               |
| Wheel                | Cycle weapons                              |
| Esc                  | Pause                                      |

## Weapons

- **Shortbow** — rapid fire, 10 arrows per quiver, ~30 damage.
- **Greatbow** — long range, fires 3-arrow volleys, up to 50 per arrow.
- **Crossbow** — slow heavy bolt, up to 90 damage at full draw.
- **Sword** — close-range melee, 35 damage (45 in Champion gear). Hold right
  click to **guard**: movement slows and incoming damage is cut by 75%.

## Gameplay extras

- **Stamina** — sprinting drains the yellow bar under your HP; it regenerates
  when you stop sprinting. Empty stamina means no sprint until it refills.
- **Pickups** — glowing **elixirs** (heal 40) and **arrow pouches** (refill
  every bow's quiver) are scattered along the roads, mid-field and inside the
  keep gates. They respawn 20 s after being taken.
- **Killstreak titles** — chain kills for titles: _On a Roll!_ (3),
  _Slaughterer!_ (5), _Wrath of the Gods!_ (7), _Legend of the Realm!_ (10).
- **Sound** — a synthesized medieval music loop and wind ambience play during
  battle (all generated in code, no audio files). Toggle with **M**.

## Equipment (5 sets, change with E/Tab)

Traveler (fast, fragile) → Leather → Chainmail → Plate (slow, armored) →
Champion (fast + stronger sword). Each changes movement speed and damage
taken; you heal while standing in your own base.

Your **skin changes with your equipment** — brown cloth (Traveler), dark
leather, silver chainmail, steel plate, and gold-belted steel (Champion).
The first-person hands wear leather gauntlets, and the sword comes with a
red shield when you guard.
