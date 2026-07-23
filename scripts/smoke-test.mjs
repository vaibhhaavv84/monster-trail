import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("index.html", "utf8");
const catalogSource = readFileSync("src/catalog.js", "utf8");
const engineSource = readFileSync("src/engine.js", "utf8");
const gameSource = readFileSync("src/main.js", "utf8");
const css = readFileSync("src/styles.css", "utf8");
const launcher = readFileSync("START_GAME.cmd", "utf8");

const context = {};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(engineSource, context);
vm.runInContext(catalogSource, context);

const Engine = context.RiftEngine;
const Catalog = context.RiftCatalog;
const generated = Engine.generateFloor({ seed: 20260723, floor: 4 });
const generatedAgain = Engine.generateFloor({ seed: 20260723, floor: 4 });
const blocked = new Set(generated.covers.map(cell => Engine.key(cell.x, cell.y)));
const route = Engine.findPath(generated.grid, generated.start, generated.exit, blocked);

let routeMatrixPasses = true;
for (let seed = 1; seed <= 12; seed++) {
  for (let floor = 1; floor <= 6; floor++) {
    const layout = Engine.generateFloor({ seed: seed * 1709, floor, sideMission: seed % 2 === 0 });
    const cover = new Set(layout.covers.map(cell => Engine.key(cell.x, cell.y)));
    const floorRoute = Engine.findPath(layout.grid, layout.start, layout.exit, cover);
    if (
      floorRoute.length < 2 ||
      floorRoute.some(cell => cover.has(Engine.key(cell.x, cell.y)))
    ) {
      routeMatrixPasses = false;
    }
  }
}

const characterIds = Catalog.CHARACTERS.map(character => character.id);
const weaponIds = Catalog.WEAPONS.map(weapon => weapon.id);
const starterWeaponsExist = Catalog.CHARACTERS.every(character =>
  weaponIds.includes(character.weaponId)
);
const weaponEconomyIsValid = Catalog.WEAPONS.every(weapon =>
  weapon.min > 0 &&
  weapon.max >= weapon.min &&
  weapon.range >= 4 &&
  weapon.magazine >= 4 &&
  weapon.cost >= 0 &&
  weapon.unlockFloor >= 1
);
const PROFILE_MARKER = "riftward-profile-v2";

const checks = [
  ["isometric canvas exists", html.includes('id="game"') && html.includes("Isometric dungeon map")],
  [
    "classic scripts support direct file launch",
    html.includes('<script src="src/engine.js"></script>') &&
      html.includes('<script src="src/catalog.js"></script>') &&
      html.includes('<script src="src/main.js"></script>')
  ],
  ["Windows launcher opens this project directly", launcher.includes("%~dp0index.html") && !launcher.includes("4173")],
  ["procedural engine is exported", Boolean(Engine?.generateFloor && Engine?.findPath && Engine?.lineOfSight)],
  ["floor generation is deterministic", JSON.stringify(generated) === JSON.stringify(generatedAgain)],
  ["generated dungeon has multiple rooms", generated.rooms.length >= 5],
  ["generated start and exit are connected", route.length > 1],
  ["cover never blocks the critical route", route.every(cell => !blocked.has(Engine.key(cell.x, cell.y)))],
  ["route matrix stays connected", routeMatrixPasses],
  ["exactly five unique characters exist", Catalog.CHARACTERS.length === 5 && new Set(characterIds).size === 5],
  ["all character starter weapons exist", starterWeaponsExist],
  ["expanded weapon roster exists", Catalog.WEAPONS.length >= 9 && new Set(weaponIds).size === Catalog.WEAPONS.length],
  ["weapon economy data is valid", weaponEconomyIsValid],
  ["shop supplies exist", Catalog.SUPPLIES.length >= 5],
  ["character selection UI exists", html.includes('id="characterRoster"') && gameSource.includes("function selectCharacter(")],
  ["improved character renderer exists", gameSource.includes("function drawCharacterFigure(") && gameSource.includes("function drawRosterPortrait(")],
  ["persistent token profile exists", gameSource.includes(PROFILE_MARKER) && gameSource.includes("function saveProfile()")],
  ["field shop exists", html.includes('id="shopDialog"') && gameSource.includes("function buyWeapon(") && gameSource.includes("function buySupply(")],
  ["score board and combo scoring exist", html.includes('id="scoreDialog"') && gameSource.includes("function scoreRank(") && gameSource.includes("stats.combo")],
  ["kills award score and tokens", gameSource.includes("state.stats.tokensEarned += tokens") && gameSource.includes("state.stats.score += points")],
  ["cleared floor advances from anywhere", gameSource.includes("function interactWithGate()") && gameSource.includes("interactWithGate();")],
  ["global next-floor controls exist", html.includes('id="nextFloorButton"') && gameSource.includes('g: "interact"') && gameSource.includes('e: "interact"')],
  ["blocked log is throttled and instructive", gameSource.includes("lastBlockedMessageAt") && gameSource.includes("Press G or NEXT FLOOR")],
  ["turn-based enemy phase exists", gameSource.includes("function takeEnemyTurn()")],
  ["ranged combat, weapon traits, and reload exist", gameSource.includes("shotCount") && gameSource.includes("closeBonus") && gameSource.includes("function reloadWeapon()")],
  ["procedural floors and boss exist", gameSource.includes('"The Null Gardener"') && gameSource.includes("function buildFloor()")],
  ["auto route mode advances cleared floors", gameSource.includes("function autoStep()") && gameSource.includes("interactWithGate();")],
  ["original Riftward story exists", gameSource.includes("Hollow Engine") && catalogSource.includes("Mara Venn")],
  ["expanded keyboard controls exist", html.includes("<kbd>G</kbd>") && html.includes("<kbd>TAB</kbd>") && gameSource.includes('f: "shoot"')],
  ["desktop and touch controls exist", html.includes('class="touch-controls"') && css.includes("@media (max-width: 900px)")],
  ["refined font stack exists", css.includes('"Bahnschrift"') && css.includes('"Cascadia Mono"')],
  ["responsive roster and shop exist", css.includes(".character-roster") && css.includes(".shop-grid")],
  ["game remains independent from the ERP portal", !html.includes("Greenfield") && !gameSource.includes("Greenfield")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  for (const [name] of failed) console.error(`Missing or invalid: ${name}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length} checks`);
