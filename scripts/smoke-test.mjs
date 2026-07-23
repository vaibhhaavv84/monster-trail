import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const js = readFileSync("src/main.js", "utf8");
const css = readFileSync("src/styles.css", "utf8");
const launcher = readFileSync("START_GAME.cmd", "utf8");

const checks = [
  ["canvas exists", html.includes('id="game"')],
  ["game script is loaded without module restrictions", html.includes('<script src="src/main.js"></script>')],
  ["Windows launcher opens the local game file", launcher.includes('%~dp0index.html') && !launcher.includes("4173")],
  ["world mode exists", js.includes('mode: "world"')],
  ["battle mode exists", js.includes('state.mode = "battle"')],
  ["encounter grass exists", js.includes('tileAt(nx, ny) === ","')],
  ["responsive CSS exists", css.includes("@media")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  for (const [name] of failed) console.error(`Missing: ${name}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length} checks`);
