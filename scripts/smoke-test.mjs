import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("index.html", "utf8");
const engineSource = readFileSync("src/engine.js", "utf8");
const gameSource = readFileSync("src/main.js", "utf8");
const css = readFileSync("src/styles.css", "utf8");
const launcher = readFileSync("START_GAME.cmd", "utf8");

const context = {};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(engineSource, context);

const Engine = context.RiftEngine;
const generated = Engine.generateFloor({ seed: 20260723, floor: 4 });
const generatedAgain = Engine.generateFloor({ seed: 20260723, floor: 4 });
const blocked = new Set(generated.covers.map(cell => Engine.key(cell.x, cell.y)));
const route = Engine.findPath(generated.grid, generated.start, generated.exit, blocked);

const checks = [
  ["isometric canvas exists", html.includes('id="game"') && html.includes("Isometric dungeon map")],
  ["classic scripts support direct file launch", html.includes('<script src="src/engine.js"></script>') && html.includes('<script src="src/main.js"></script>')],
  ["Windows launcher opens this project directly", launcher.includes("%~dp0index.html") && !launcher.includes("4173")],
  ["procedural engine is exported", Boolean(Engine?.generateFloor && Engine?.findPath && Engine?.lineOfSight)],
  ["floor generation is deterministic", JSON.stringify(generated) === JSON.stringify(generatedAgain)],
  ["generated dungeon has multiple rooms", generated.rooms.length >= 5],
  ["generated start and exit are connected", route.length > 1],
  ["cover never blocks the critical route", route.every(cell => !blocked.has(Engine.key(cell.x, cell.y)))],
  ["turn-based enemy phase exists", gameSource.includes("function takeEnemyTurn()")],
  ["ranged combat and reload exist", gameSource.includes("function fireAt(enemy)") && gameSource.includes("function reloadWeapon()")],
  ["procedural floors and boss exist", gameSource.includes('"The Null Gardener"') && gameSource.includes("function buildFloor()")],
  ["auto route mode exists", gameSource.includes("function autoStep()") && html.includes('id="autoButton"')],
  ["original Riftward story exists", html.includes("Mara Venn") && html.includes("Hollow Engine")],
  ["desktop and touch controls exist", html.includes('class="touch-controls"') && css.includes("@media (max-width: 860px)")],
  ["responsive layout avoids the ERP port", !html.includes("Greenfield") && !gameSource.includes("Greenfield")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  for (const [name] of failed) console.error(`Missing or invalid: ${name}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length} checks`);
