# Monster Trail

Monster Trail is an original top-down 2D monster-adventure browser game prototype. It is inspired by classic handheld RPG structure: tile maps, NPCs, tall grass encounters, and turn-based battles, but it does not reuse Pokemon characters, assets, names, or code.

## Play

Play the current version online:

**https://vaibhhaavv84.github.io/monster-trail/**

On Windows, double-click `START_GAME.cmd`. The launcher opens the game directly in your browser without using a localhost port.

For development, you can also run it from a terminal:

```bash
npm run start
```

Then open `http://127.0.0.1:4317`.

## Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys or WASD |
| Talk / inspect | Space or Enter |
| Battle actions | 1, 2, 3, 4 |

## Current Features

- Top-down tile-map exploration
- Village, path, tall grass, trees, and buildings
- NPC dialogue
- Random tall-grass encounters
- Turn-based battle scene
- Simple attack, special attack, befriend, and run actions
- Party status panel

## Project Structure

```text
monster-trail/
|-- .github/workflows/pages.yml  # GitHub Pages deployment
|-- scripts/serve.mjs            # Local development server
|-- scripts/smoke-test.mjs       # Lightweight project checks
|-- src/main.js                  # World, encounters, and battles
|-- src/styles.css               # Responsive game layout
|-- index.html                   # Browser entry point
|-- START_GAME.cmd               # Windows launcher
|-- package.json
`-- README.md
```

## Roadmap

- Larger connected maps
- Creature roster and capture collection
- Trainer battles
- Inventory, healing items, and shops
- Save/load
- Original sprite sheets and music
- Mobile touch controls
## License

MIT. See `LICENSE`.
