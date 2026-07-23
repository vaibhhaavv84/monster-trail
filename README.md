# Riftward

Riftward is an original isometric, turn-based dungeon roguelike. It uses its own setting, operators, enemies, artwork, story, map generator, and code.

Choose one of five Riftwalkers, descend through the living Echo Vault beneath Aster Vale, and seal the Hollow Engine. Each operator has different health, armor, gear, and combat bonuses. Defeated enemies award score and persistent Vault Tokens that can be spent on weapons and supplies.

## Play

**Online:** https://vaibhhaavv84.github.io/monster-trail/

On Windows, double-click `START_GAME.cmd`. The launcher opens `index.html` directly and does not use a localhost port.

For development:

```powershell
npm.cmd run start
```

Then open `http://127.0.0.1:4317`.

## Controls

| Action | Control |
| --- | --- |
| Move one tile | Arrow keys or WASD |
| Shoot nearest visible enemy | 1, Space, or F |
| Echo pulse | 2 or Q |
| Use field patch | 3 or H |
| Reload | 4 or R |
| Load the next cleared floor | G or E |
| Open the field shop | B |
| Open the score board | Tab |
| Toggle sound | M |
| Wait one turn | X |
| Move or target | Click a visible tile or enemy |

Touch controls appear on smaller screens.

## Game Loop

- Five selectable Riftwalkers with distinct stats, perks, silhouettes, and starter weapons
- Procedurally generated isometric rooms and corridors
- Tile-by-tile movement where every action advances enemy turns
- Melee and ranged enemies with cover and line-of-sight rules
- Nine weapons with burst, critical, close-range, splash, and boss-hunter traits
- Persistent Vault Tokens, permanent weapon unlocks, and an in-run supply shop
- Kill score, floor score, combo multipliers, ranks, and a persistent top-five score board
- Ammunition, armor, healing patches, pulse gadgets, and level upgrades
- Fog-of-war exploration and a live field log
- Six-floor main expedition with a final boss
- Three-floor high-risk side route
- Optional automatic route mode
- Floor recall from anywhere after a sector is cleared; no walk back to the gate is required
- Original canvas-drawn characters, enemies, maps, and effects

## Project Structure

```text
monster-trail/
|-- .github/workflows/pages.yml
|-- scripts/
|   |-- serve.mjs
|   `-- smoke-test.mjs
|-- src/
|   |-- catalog.js
|   |-- engine.js
|   |-- main.js
|   `-- styles.css
|-- index.html
|-- START_GAME.cmd
|-- package.json
`-- README.md
```

## Verification

```powershell
npm.cmd test
```

The test checks deterministic generation, path connectivity, all five operators, the weapon economy, scoring and token systems, floor progression, responsive controls, launcher behavior, and deployment structure.

## License

MIT. All game code, names, story, and visuals in this repository are original to this project.
