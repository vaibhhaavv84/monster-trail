const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const dialog = document.querySelector("#dialog");
const partyPanel = document.querySelector("#party");

const TILE = 32;
const VIEW_W = canvas.width / TILE;
const VIEW_H = canvas.height / TILE;

const keys = new Set();
const pressed = new Set();

const tileColors = {
  ".": "#75bb63",
  ",": "#4f9d52",
  "~": "#3b86c4",
  "#": "#5a5e54",
  "T": "#265c38",
  "F": "#d0b266",
  "R": "#be8551",
  "H": "#9d6642"
};

const map = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T............,,,,,,,,.....HT",
  "T..FFFFF.....,,,,,,,,......T",
  "T..F...F.....,,,,,,,,..R...T",
  "T..F...F...............R...T",
  "T..FFFFF..#####........R...T",
  "T.........#...#............T",
  "T..,,,,...#...#....,,,,,...T",
  "T..,,,,...#####....,,,,,...T",
  "T..,,,,............,,,,,...T",
  "T..........RRRRRRRRRR.....T",
  "T.....N....R........R.....T",
  "T..........R..,,,,..R.....T",
  "T..........R..,,,,..R.....T",
  "T......,,,,R..,,,,..R..N..T",
  "T......,,,,RRRRRRRRRR.....T",
  "T......,,,,...............TT",
  "T.........................TT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTT"
];

const state = {
  mode: "world",
  player: { x: 5, y: 11, facing: { x: 0, y: 1 }, hp: 32, maxHp: 32 },
  companion: { name: "Sprigbit", hp: 28, maxHp: 28, level: 5, xp: 0 },
  npcs: [
    { x: 5, y: 11, text: "Leafport is calm, but the grass is full of jumpy little sparklings." },
    { x: 25, y: 14, text: "Tip: wild companions appear more often in tall grass. Keep Sprigbit healthy." }
  ],
  message: "",
  battle: null,
  cooldown: 0,
  seed: 7
};

const monsters = [
  { name: "Mossnap", color: "#6aae4f", maxHp: 22, attack: 5 },
  { name: "Voltkit", color: "#f0cf52", maxHp: 18, attack: 7 },
  { name: "Pebblin", color: "#9a8b75", maxHp: 26, attack: 4 }
];

function rand() {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function tileAt(x, y) {
  return map[y]?.[x] ?? "T";
}

function blocked(x, y) {
  return ["T", "~", "#", "F", "H"].includes(tileAt(x, y)) || state.npcs.some(n => n.x === x && n.y === y);
}

function setDialog(text) {
  state.message = text;
  dialog.textContent = text;
  dialog.classList.toggle("hidden", !text);
}

function startBattle() {
  const base = monsters[Math.floor(rand() * monsters.length)];
  state.mode = "battle";
  state.battle = {
    enemy: { ...base, hp: base.maxHp },
    turn: "player",
    text: `A wild ${base.name} appeared! Press 1 Tackle, 2 Leaf Burst, 3 Befriend, 4 Run.`
  };
  setDialog(state.battle.text);
}

function tryMove(dx, dy) {
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  state.player.facing = { x: dx, y: dy };
  if (blocked(nx, ny)) return;
  state.player.x = nx;
  state.player.y = ny;
  if (tileAt(nx, ny) === "," && rand() < 0.16) startBattle();
}

function inspect() {
  const tx = state.player.x + state.player.facing.x;
  const ty = state.player.y + state.player.facing.y;
  const npc = state.npcs.find(n => n.x === tx && n.y === ty);
  if (npc) setDialog(npc.text);
  else if (tileAt(tx, ty) === "R") setDialog("The route marker points north to Leafport and south to Emberfen.");
  else setDialog("Nothing unusual here.");
}

function battleAction(choice) {
  const b = state.battle;
  if (!b) return;
  if (choice === "4") {
    if (rand() < 0.68) {
      state.mode = "world";
      state.battle = null;
      setDialog("You slipped away safely.");
      return;
    }
    b.text = "Could not escape!";
  } else if (choice === "3") {
    const chance = 0.28 + (1 - b.enemy.hp / b.enemy.maxHp) * 0.52;
    if (rand() < chance) {
      state.companion.xp += 6;
      state.mode = "world";
      setDialog(`${b.enemy.name} trusted you and wandered beside the trail for a while. Sprigbit gained XP.`);
      state.battle = null;
      return;
    }
    b.text = `${b.enemy.name} dodged your calming gesture.`;
  } else {
    const strong = choice === "2";
    const damage = strong ? 9 + Math.floor(rand() * 5) : 6 + Math.floor(rand() * 4);
    b.enemy.hp = Math.max(0, b.enemy.hp - damage);
    b.text = strong ? `Sprigbit used Leaf Burst for ${damage}!` : `Sprigbit tackled for ${damage}!`;
    if (b.enemy.hp <= 0) {
      state.companion.xp += 8;
      state.mode = "world";
      state.battle = null;
      setDialog(`${b.enemy.name} fainted. Sprigbit gained XP.`);
      return;
    }
  }
  const hit = b.enemy.attack + Math.floor(rand() * 4);
  state.companion.hp = Math.max(0, state.companion.hp - hit);
  b.text += ` ${b.enemy.name} hit back for ${hit}.`;
  if (state.companion.hp <= 0) {
    state.companion.hp = state.companion.maxHp;
    state.player.x = 5;
    state.player.y = 11;
    state.mode = "world";
    state.battle = null;
    setDialog("Sprigbit got tired. You hurried back to the village and rested.");
    return;
  }
  setDialog(`${b.text} Press 1, 2, 3, or 4.`);
}

function update() {
  if (state.cooldown > 0) state.cooldown--;
  if (state.mode === "world" && state.cooldown === 0) {
    let moved = false;
    if (keys.has("ArrowUp") || keys.has("w")) { tryMove(0, -1); moved = true; }
    else if (keys.has("ArrowDown") || keys.has("s")) { tryMove(0, 1); moved = true; }
    else if (keys.has("ArrowLeft") || keys.has("a")) { tryMove(-1, 0); moved = true; }
    else if (keys.has("ArrowRight") || keys.has("d")) { tryMove(1, 0); moved = true; }
    if (moved) {
      state.cooldown = 8;
      if (state.message && state.mode === "world") setDialog("");
    }
  }
  if (state.mode === "world" && (pressed.has(" ") || pressed.has("Enter"))) inspect();
  if (state.mode === "battle") {
    for (const key of ["1", "2", "3", "4"]) {
      if (pressed.has(key)) battleAction(key);
    }
  }
  pressed.clear();
}

function drawTile(x, y, tile) {
  ctx.fillStyle = tileColors[tile] || tileColors["."];
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  if (tile === ",") {
    ctx.fillStyle = "#86d36b";
    for (let i = 0; i < 4; i++) ctx.fillRect(x * TILE + 5 + i * 7, y * TILE + 20 - i % 2 * 5, 3, 9);
  }
  if (tile === "T") {
    ctx.fillStyle = "#173b28";
    ctx.beginPath();
    ctx.arc(x * TILE + 16, y * TILE + 15, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tile === "F") {
    ctx.fillStyle = "#7c4f32";
    ctx.fillRect(x * TILE + 8, y * TILE + 8, 16, 18);
  }
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const camX = Math.max(0, Math.min(map[0].length - VIEW_W, state.player.x - Math.floor(VIEW_W / 2)));
  const camY = Math.max(0, Math.min(map.length - VIEW_H, state.player.y - Math.floor(VIEW_H / 2)));
  ctx.save();
  ctx.translate(-camX * TILE, -camY * TILE);
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) drawTile(x, y, map[y][x]);
  }
  for (const npc of state.npcs) drawPerson(npc.x, npc.y, "#5fc1d8", "#703f8f");
  drawPerson(state.player.x, state.player.y, "#ef6262", "#263f8f");
  ctx.restore();
  drawHud();
}

function drawPerson(x, y, shirt, pants) {
  ctx.fillStyle = pants;
  ctx.fillRect(x * TILE + 10, y * TILE + 18, 5, 9);
  ctx.fillRect(x * TILE + 17, y * TILE + 18, 5, 9);
  ctx.fillStyle = shirt;
  ctx.fillRect(x * TILE + 9, y * TILE + 10, 14, 12);
  ctx.fillStyle = "#f1c89a";
  ctx.fillRect(x * TILE + 11, y * TILE + 4, 10, 8);
  ctx.fillStyle = "#2f211c";
  ctx.fillRect(x * TILE + 10, y * TILE + 2, 12, 4);
}

function drawBattle() {
  ctx.fillStyle = "#d6eddb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#89c784";
  ctx.ellipse(705, 260, 150, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8bbfd8";
  ctx.ellipse(235, 460, 170, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  const enemy = state.battle.enemy;
  drawMonster(700, 205, enemy.color, enemy.name);
  drawMonster(240, 390, "#7acb60", state.companion.name);
  drawBattleBox(60, 52, enemy.name, enemy.hp, enemy.maxHp);
  drawBattleBox(560, 430, state.companion.name, state.companion.hp, state.companion.maxHp);
}

function drawMonster(x, y, color, name) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 18, y - 10, 12, 12);
  ctx.fillRect(x + 8, y - 10, 12, 12);
  ctx.fillStyle = "#172022";
  ctx.fillRect(x - 14, y - 6, 5, 5);
  ctx.fillRect(x + 12, y - 6, 5, 5);
  ctx.fillStyle = "#172022";
  ctx.font = "18px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y + 78);
}

function drawBattleBox(x, y, name, hp, maxHp) {
  ctx.fillStyle = "#f7f0da";
  ctx.fillRect(x, y, 330, 82);
  ctx.strokeStyle = "#172022";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, 330, 82);
  ctx.fillStyle = "#172022";
  ctx.font = "22px Segoe UI";
  ctx.fillText(name, x + 18, y + 30);
  ctx.fillStyle = "#423c33";
  ctx.fillRect(x + 18, y + 50, 280, 14);
  ctx.fillStyle = hp / maxHp > 0.45 ? "#4caf50" : "#d45d48";
  ctx.fillRect(x + 18, y + 50, 280 * (hp / maxHp), 14);
}

function drawHud() {
  ctx.fillStyle = "rgba(10, 14, 16, 0.72)";
  ctx.fillRect(12, 12, 270, 56);
  ctx.fillStyle = "#f3efe3";
  ctx.font = "18px Segoe UI";
  ctx.textAlign = "left";
  ctx.fillText(`${state.companion.name} HP ${state.companion.hp}/${state.companion.maxHp}`, 26, 45);
}

function renderParty() {
  partyPanel.innerHTML = `<p><strong>${state.companion.name}</strong><br>Level ${state.companion.level} | HP ${state.companion.hp}/${state.companion.maxHp} | XP ${state.companion.xp}</p>`;
}

function frame() {
  update();
  if (state.mode === "battle") drawBattle();
  else drawWorld();
  renderParty();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"].includes(event.key) || ["w", "a", "s", "d", "1", "2", "3", "4"].includes(key)) {
    event.preventDefault();
    keys.add(key);
    pressed.add(key);
  }
});

window.addEventListener("keyup", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

setDialog("Welcome to Leafport Route. Walk into tall grass to find wild companions.");
frame();
