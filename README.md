# Riftward

Riftward is an original isometric, turn-based dungeon roguelike. It takes inspiration from the readable tactical rhythm of classic browser roguelikes while using its own setting, characters, enemies, artwork, story, map generator, and code.

You play Mara Venn, a cartographer descending through the living Echo Vault beneath Aster Vale. Clear procedurally generated sectors, collect supplies, upgrade your weapon, and seal the Hollow Engine on the final floor.

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
| Shoot nearest visible enemy | Space |
| Echo pulse | Q |
| Use field patch | H |
| Reload | R |
| Enter an unlocked gate | E |
| Wait one turn | X |
| Move or target | Click a visible tile or enemy |

Touch controls appear on smaller screens.

## Game Loop

- Procedurally generated isometric rooms and corridors
- Tile-by-tile movement where every action advances enemy turns
- Melee and ranged enemies with cover and line-of-sight rules
- Ammunition, armor, healing, pulse gadgets, credits, and weapon upgrades
- Fog-of-war exploration and a live field log
- Six-floor main expedition with a final boss
- Three-floor high-risk side route
- Optional automatic route mode
- Original canvas-drawn characters and effects

## Project Structure

```text
monster-trail/
|-- .github/workflows/pages.yml
|-- scripts/
|   |-- serve.mjs
|   `-- smoke-test.mjs
|-- src/
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

The test checks deterministic generation, path connectivity, combat systems, boss progression, responsive controls, launcher behavior, and deployment structure.

## License

MIT. All game code, names, story, and visuals in this repository are original to this project.
