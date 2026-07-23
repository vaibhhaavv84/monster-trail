"use strict";

const Engine = window.RiftEngine;
if (!Engine) throw new Error("RiftEngine failed to load.");

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const overlayEyebrow = document.querySelector("#overlayEyebrow");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const overlayStats = document.querySelector("#overlayStats");
const primaryOverlayButton = document.querySelector("#primaryOverlayButton");
const secondaryOverlayButton = document.querySelector("#secondaryOverlayButton");
const autoButton = document.querySelector("#autoButton");
const newRunButton = document.querySelector("#newRunButton");
const sideRunButton = document.querySelector("#sideRunButton");
const soundButton = document.querySelector("#soundButton");
const helpButton = document.querySelector("#helpButton");
const helpDialog = document.querySelector("#helpDialog");
const closeHelpButton = document.querySelector("#closeHelpButton");
const fieldLog = document.querySelector("#fieldLog");

const ui = {
  healthFill: document.querySelector("#healthFill"),
  healthText: document.querySelector("#healthText"),
  floorValue: document.querySelector("#floorValue"),
  weaponValue: document.querySelector("#weaponValue"),
  damageValue: document.querySelector("#damageValue"),
  rangeValue: document.querySelector("#rangeValue"),
  ammoValue: document.querySelector("#ammoValue"),
  armorValue: document.querySelector("#armorValue"),
  pulseValue: document.querySelector("#pulseValue"),
  creditsValue: document.querySelector("#creditsValue"),
  levelValue: document.querySelector("#levelValue"),
  sectorName: document.querySelector("#sectorName"),
  modeLabel: document.querySelector("#modeLabel"),
  objectiveTitle: document.querySelector("#objectiveTitle"),
  objectiveText: document.querySelector("#objectiveText"),
  turnValue: document.querySelector("#turnValue"),
  killsValue: document.querySelector("#killsValue"),
  scoreValue: document.querySelector("#scoreValue"),
  enemyCount: document.querySelector("#enemyCount")
};

const ISO_W = 48;
const ISO_H = 24;
const WALL_H = 18;
const MAX_LOG_ENTRIES = 70;

const floorNames = [
  "Glassroot Gate",
  "Drowned Archive",
  "Ember Index",
  "Hollow Conservatory",
  "Crown of Static",
  "The Loom Core"
];

const floorThemes = [
  { floorA: "#15332f", floorB: "#183a35", line: "#25504a", wallA: "#416462", wallB: "#304e4d", glow: "#62d8d0" },
  { floorA: "#172f3b", floorB: "#193746", line: "#285064", wallA: "#496878", wallB: "#355261", glow: "#72c8ee" },
  { floorA: "#3a2d24", floorB: "#433329", line: "#664637", wallA: "#7a5a47", wallB: "#5b4135", glow: "#ef9a62" },
  { floorA: "#243525", floorB: "#2b3d2c", line: "#405842", wallA: "#60765d", wallB: "#465a45", glow: "#92dc82" },
  { floorA: "#34283d", floorB: "#3b2d46", line: "#5a4167", wallA: "#745e7e", wallB: "#55435e", glow: "#d879b5" },
  { floorA: "#293035", floorB: "#30383d", line: "#48545b", wallA: "#6d777d", wallB: "#505b61", glow: "#efc65b" }
];

const weapons = [
  { name: "Arc Needle", min: 4, max: 7, range: 5, magazine: 8, color: "#62d8d0" },
  { name: "Suncoil", min: 6, max: 10, range: 6, magazine: 7, color: "#efc65b" },
  { name: "Prism Lance", min: 8, max: 13, range: 7, magazine: 5, color: "#d879b5" },
  { name: "Bloom Cannon", min: 10, max: 16, range: 5, magazine: 9, color: "#ef765f" }
];

const enemyCatalog = {
  mote: {
    name: "Prism Mote",
    hp: 8,
    damage: 2,
    range: 1,
    reward: 12,
    color: "#ad66cb",
    accent: "#f0b3ff"
  },
  drone: {
    name: "Lantern Drone",
    hp: 11,
    damage: 3,
    range: 4,
    reward: 18,
    color: "#d8aa4c",
    accent: "#7ce2df"
  },
  brute: {
    name: "Mire Brute",
    hp: 18,
    damage: 5,
    range: 1,
    reward: 28,
    color: "#6f9a68",
    accent: "#efc65b"
  },
  weaver: {
    name: "Echo Weaver",
    hp: 14,
    damage: 4,
    range: 3,
    reward: 34,
    color: "#b85f91",
    accent: "#79d9f0"
  },
  boss: {
    name: "The Null Gardener",
    hp: 58,
    damage: 7,
    range: 3,
    reward: 180,
    color: "#7563a8",
    accent: "#ef765f"
  }
};

const pickupKinds = ["credits", "ammo", "patch", "armor", "pulse"];

const state = {
  phase: "briefing",
  overlayMode: "briefing",
  sideMission: false,
  maxFloor: 6,
  floor: 1,
  seed: 1,
  random: Engine.createRng(1),
  layout: null,
  player: null,
  enemies: [],
  pickups: [],
  discovered: new Set(),
  logs: [],
  effects: [],
  hover: null,
  exitUnlocked: false,
  auto: false,
  audio: true,
  stats: { turns: 0, kills: 0, score: 0 },
  camera: { x: canvas.width / 2, y: 120, ready: false },
  shakeUntil: 0,
  nextEntityId: 1
};

let audioContext = null;
let lastFrameTime = performance.now();

function copyWeapon(tier) {
  return { ...weapons[Math.max(0, Math.min(weapons.length - 1, tier))] };
}

function currentTheme() {
  return floorThemes[(state.floor - 1) % floorThemes.length];
}

function sectorName() {
  if (state.sideMission) return `Side Route: ${floorNames[(state.floor + 1) % floorNames.length]}`;
  return floorNames[(state.floor - 1) % floorNames.length];
}

function randomInt(min, max) {
  return min + Math.floor(state.random() * (max - min + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sameCell(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function coverSet() {
  return new Set(state.layout.covers.map(cell => Engine.key(cell.x, cell.y)));
}

function occupiedSet(exceptEnemy) {
  const blocked = coverSet();
  for (const enemy of state.enemies) {
    if (enemy !== exceptEnemy) blocked.add(Engine.key(enemy.x, enemy.y));
  }
  return blocked;
}

function enemyAt(x, y) {
  return state.enemies.find(enemy => enemy.x === x && enemy.y === y);
}

function pickupAt(x, y) {
  return state.pickups.find(pickup => pickup.x === x && pickup.y === y);
}

function isFloor(x, y) {
  return state.layout.grid[y]?.[x] === 1;
}

function isCover(x, y) {
  return state.layout.covers.some(cell => cell.x === x && cell.y === y);
}

function logEvent(text, type) {
  state.logs.push({
    text,
    type: type || "system",
    id: `${Date.now()}-${state.logs.length}`
  });
  if (state.logs.length > MAX_LOG_ENTRIES) state.logs.splice(0, state.logs.length - MAX_LOG_ENTRIES);
  renderLog();
}

function renderLog() {
  const fragment = document.createDocumentFragment();
  for (const entry of state.logs.slice(-36)) {
    const item = document.createElement("li");
    item.className = entry.type;
    item.textContent = entry.text;
    fragment.appendChild(item);
  }
  fieldLog.replaceChildren(fragment);
  fieldLog.scrollTop = fieldLog.scrollHeight;
}

function playSound(kind) {
  if (!state.audio) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const settings = {
      move: [155, 0.035, "square"],
      shoot: [460, 0.09, "sawtooth"],
      hit: [95, 0.12, "square"],
      pickup: [660, 0.11, "sine"],
      pulse: [220, 0.2, "triangle"],
      gate: [330, 0.32, "sine"],
      danger: [72, 0.25, "sawtooth"]
    }[kind] || [200, 0.06, "sine"];
    oscillator.frequency.setValueAtTime(settings[0], now);
    oscillator.type = settings[2];
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + settings[1]);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + settings[1]);
  } catch {
    state.audio = false;
    soundButton.setAttribute("aria-pressed", "false");
    soundButton.textContent = "SOUND OFF";
  }
}

function revealAround(x, y) {
  const radius = 4;
  for (let offsetY = -radius; offsetY <= radius; offsetY++) {
    for (let offsetX = -radius; offsetX <= radius; offsetX++) {
      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (offsetX * offsetX + offsetY * offsetY <= radius * radius && isFloor(nextX, nextY)) {
        state.discovered.add(Engine.key(nextX, nextY));
      }
    }
  }

  const room = state.layout.rooms.find(candidate =>
    x >= candidate.x &&
    x < candidate.x + candidate.w &&
    y >= candidate.y &&
    y < candidate.y + candidate.h
  );
  if (room) {
    for (let roomY = room.y; roomY < room.y + room.h; roomY++) {
      for (let roomX = room.x; roomX < room.x + room.w; roomX++) {
        state.discovered.add(Engine.key(roomX, roomY));
      }
    }
  }
}

function createEnemy(type, point, elite) {
  const base = enemyCatalog[type];
  const floorScale = 1 + Math.max(0, state.floor - 1) * 0.13;
  const eliteScale = elite ? 1.35 : 1;
  const maxHp = Math.round(base.hp * floorScale * eliteScale);
  return {
    ...base,
    id: state.nextEntityId++,
    type,
    x: point.x,
    y: point.y,
    hp: maxHp,
    maxHp,
    damage: Math.max(1, Math.round(base.damage * (1 + (state.floor - 1) * 0.08))),
    elite: Boolean(elite),
    stunned: 0
  };
}

function spawnEnemies() {
  const enemies = [];
  const availableTypes = state.floor <= 1
    ? ["mote", "drone"]
    : state.floor <= 3
      ? ["mote", "drone", "brute"]
      : ["drone", "brute", "weaver", "mote"];

  for (let index = 0; index < state.layout.spawnPoints.length; index++) {
    const point = state.layout.spawnPoints[index];
    if (sameCell(point, state.layout.exit)) continue;
    const type = availableTypes[Math.floor(state.random() * availableTypes.length)];
    enemies.push(createEnemy(type, point, state.floor >= 4 && index % 5 === 0));
  }

  if (!state.sideMission && state.floor === state.maxFloor) {
    enemies.push(createEnemy("boss", state.layout.exit, true));
  }
  return enemies;
}

function spawnPickups() {
  const pickups = state.layout.pickupPoints.map((point, index) => ({
    id: state.nextEntityId++,
    x: point.x,
    y: point.y,
    kind: pickupKinds[Math.floor(state.random() * pickupKinds.length)]
  }));

  if (state.floor > 1 && state.floor <= weapons.length && pickups.length) {
    pickups[0].kind = "weapon";
  }
  if (state.floor === state.maxFloor && pickups.length) {
    pickups[pickups.length - 1].kind = "memory";
  }
  return pickups;
}

function buildFloor() {
  state.layout = Engine.generateFloor({
    seed: state.seed,
    floor: state.floor,
    sideMission: state.sideMission
  });
  state.random = Engine.createRng(state.layout.seed ^ (state.seed + state.stats.turns * 17));
  state.player.x = state.layout.start.x;
  state.player.y = state.layout.start.y;
  state.enemies = spawnEnemies();
  state.pickups = spawnPickups();
  state.discovered = new Set();
  state.effects = [];
  state.hover = null;
  state.exitUnlocked = state.enemies.length === 0;
  revealAround(state.player.x, state.player.y);
  setCameraImmediate();

  logEvent(`${sectorName()} opened beneath Mara.`, "story");
  logEvent(`Archive scan: ${state.enemies.length} hostile signatures.`, "system");
  if (state.floor > 1) {
    const recovered = Math.min(5, state.player.maxHp - state.player.hp);
    state.player.hp += recovered;
    state.player.reserve += 4;
    logEvent(`Vault cache restored ${recovered} vitals and 4 reserve rounds.`, "reward");
  }
}

function newRun(sideMission) {
  state.sideMission = Boolean(sideMission);
  state.maxFloor = state.sideMission ? 3 : 6;
  state.floor = 1;
  state.seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  state.stats = { turns: 0, kills: 0, score: 0 };
  state.logs = [];
  state.effects = [];
  state.auto = false;
  state.nextEntityId = 1;
  state.player = {
    x: 0,
    y: 0,
    hp: 32,
    maxHp: 32,
    armor: 0,
    level: 1,
    xp: 0,
    nextXp: 30,
    weaponTier: 0,
    weapon: copyWeapon(0),
    ammo: weapons[0].magazine,
    reserve: 28,
    pulses: 2,
    patches: 2,
    credits: 0
  };

  buildFloor();
  showBriefing();
  updateUi();
}

function showBriefing() {
  state.phase = "briefing";
  state.overlayMode = "briefing";
  overlay.hidden = false;
  overlayEyebrow.textContent = state.sideMission ? "SIDE ROUTE CONTRACT" : "EXPEDITION BRIEF";
  overlayTitle.textContent = state.sideMission ? "The storm route is unstable." : "The vault is awake.";
  overlayText.textContent = state.sideMission
    ? "Reach the third gate before the archive storm closes. Hostiles are stronger, supplies are richer, and retreat is not available."
    : "Cartographer Mara Venn must descend through the living archive beneath Aster Vale, recover its memory seeds, and stop the Hollow Engine before it rewrites the surface.";
  overlayStats.hidden = true;
  overlayStats.replaceChildren();
  primaryOverlayButton.textContent = "BEGIN DESCENT";
}

function beginRun() {
  state.phase = "playing";
  overlay.hidden = true;
  logEvent("Mara linked the lumen compass. Manual route active.", "story");
  canvas.focus();
  updateUi();
}

function showResult(won) {
  state.auto = false;
  state.phase = won ? "won" : "lost";
  state.overlayMode = won ? "won" : "lost";
  overlay.hidden = false;
  overlayEyebrow.textContent = won ? "EXPEDITION COMPLETE" : "SIGNAL LOST";
  overlayTitle.textContent = won ? "Aster Vale remembers." : "The vault reclaimed the route.";
  overlayText.textContent = won
    ? "Mara sealed the Hollow Engine and carried the recovered memory seeds back to the surface."
    : "The next cartographer can recover Mara's lumen trail. Begin a new descent with a different vault layout.";
  overlayStats.hidden = false;
  overlayStats.innerHTML = [
    ["SCORE", state.stats.score],
    ["FLOORS", `${state.floor}/${state.maxFloor}`],
    ["KILLS", state.stats.kills],
    ["TURNS", state.stats.turns]
  ].map(([label, value]) => `<span>${label}<strong>${value}</strong></span>`).join("");
  primaryOverlayButton.textContent = won ? "NEW EXPEDITION" : "TRY AGAIN";
  updateUi();
}

function openHelp() {
  if (!helpDialog.open) helpDialog.showModal();
}

function updateObjective() {
  const remaining = state.enemies.length;
  const atExit = sameCell(state.player, state.layout.exit);

  if (state.phase === "briefing") {
    ui.objectiveTitle.textContent = "Awaiting descent";
    ui.objectiveText.textContent = "Review the brief and enter the Echo Vault.";
  } else if (state.phase === "won") {
    ui.objectiveTitle.textContent = "Vault sealed";
    ui.objectiveText.textContent = "The recovered memory seeds are safe.";
  } else if (state.phase === "lost") {
    ui.objectiveTitle.textContent = "Signal lost";
    ui.objectiveText.textContent = "Start a new route to continue the expedition.";
  } else if (remaining > 0) {
    ui.objectiveTitle.textContent = remaining === 1 ? "One signature remains" : `Neutralize ${remaining} signatures`;
    ui.objectiveText.textContent = state.floor === state.maxFloor
      ? "Break the Null Gardener's hold on the Loom Core."
      : "Use cover, collect supplies, and clear a route to the descent gate.";
  } else if (atExit) {
    ui.objectiveTitle.textContent = "Gate synchronized";
    ui.objectiveText.textContent = "Press E to descend into the next archive sector.";
  } else {
    ui.objectiveTitle.textContent = "Reach the descent gate";
    ui.objectiveText.textContent = "The gate is now lit. Follow the gold signal through the vault.";
  }
}

function updateUi() {
  if (!state.player || !state.layout) return;
  const player = state.player;
  const healthRatio = player.hp / player.maxHp;
  ui.healthFill.style.width = `${Math.max(0, healthRatio * 100)}%`;
  ui.healthText.textContent = `${player.hp}/${player.maxHp}`;
  ui.floorValue.textContent = `${state.floor}/${state.maxFloor}`;
  ui.weaponValue.textContent = player.weapon.name;
  ui.damageValue.textContent = `${player.weapon.min}-${player.weapon.max}`;
  ui.rangeValue.textContent = String(player.weapon.range);
  ui.ammoValue.textContent = `${player.ammo}/${player.reserve}`;
  ui.armorValue.textContent = String(player.armor);
  ui.pulseValue.textContent = String(player.pulses);
  ui.creditsValue.textContent = String(player.credits);
  ui.levelValue.textContent = `${player.level} (${player.xp}/${player.nextXp})`;
  ui.sectorName.textContent = sectorName();
  ui.modeLabel.textContent = state.auto ? "AUTO ROUTE" : "MANUAL";
  ui.turnValue.textContent = String(state.stats.turns);
  ui.killsValue.textContent = String(state.stats.kills);
  ui.scoreValue.textContent = String(state.stats.score);
  ui.enemyCount.textContent = `${state.enemies.length} ${state.enemies.length === 1 ? "HOSTILE" : "HOSTILES"}`;
  autoButton.textContent = state.auto ? "AUTO ON" : "AUTO OFF";
  autoButton.setAttribute("aria-pressed", String(state.auto));
  soundButton.textContent = state.audio ? "SOUND ON" : "SOUND OFF";
  soundButton.setAttribute("aria-pressed", String(state.audio));
  updateObjective();
}

function addEffect(effect) {
  state.effects.push({
    id: state.nextEntityId++,
    startedAt: performance.now(),
    duration: 360,
    ...effect
  });
}

function gainExperience(amount) {
  state.player.xp += amount;
  while (state.player.xp >= state.player.nextXp) {
    state.player.xp -= state.player.nextXp;
    state.player.level += 1;
    state.player.nextXp = Math.round(state.player.nextXp * 1.35);
    state.player.maxHp += 5;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 8);
    state.player.weapon.min += 1;
    state.player.weapon.max += 1;
    logEvent(`Level ${state.player.level}. Mara's lumen link intensified.`, "reward");
    playSound("pickup");
  }
}

function defeatEnemy(enemy) {
  const index = state.enemies.indexOf(enemy);
  if (index !== -1) state.enemies.splice(index, 1);
  state.stats.kills += 1;
  state.stats.score += enemy.reward * 5;
  state.player.credits += enemy.reward;
  gainExperience(enemy.type === "boss" ? 60 : 8 + state.floor * 2);
  logEvent(`${enemy.name} dissolved. +${enemy.reward} credits.`, "reward");
  addEffect({ type: "burst", x: enemy.x, y: enemy.y, color: enemy.accent, duration: 500 });

  if (enemy.type !== "boss" && state.random() < 0.32 && !pickupAt(enemy.x, enemy.y)) {
    state.pickups.push({
      id: state.nextEntityId++,
      x: enemy.x,
      y: enemy.y,
      kind: state.random() < 0.55 ? "credits" : "ammo"
    });
  }

  if (state.enemies.length === 0) {
    state.exitUnlocked = true;
    state.stats.score += state.floor * 120;
    logEvent("Sector clear. The descent gate is synchronized.", "story");
    playSound("gate");
  }
}

function damageEnemy(enemy, amount, source) {
  const damage = Math.max(1, Math.round(amount));
  enemy.hp = Math.max(0, enemy.hp - damage);
  logEvent(`${source} struck ${enemy.name} for ${damage}.`, "enemy");
  addEffect({ type: "damage", x: enemy.x, y: enemy.y, text: `-${damage}`, color: "#f59b87" });
  if (enemy.hp <= 0) defeatEnemy(enemy);
}

function hurtPlayer(amount, enemy) {
  let damage = Math.max(1, Math.round(amount));
  const absorbed = Math.min(state.player.armor, Math.ceil(damage / 2));
  state.player.armor -= absorbed;
  damage -= absorbed;
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.shakeUntil = performance.now() + 180;
  addEffect({ type: "damage", x: state.player.x, y: state.player.y, text: `-${damage}`, color: "#ef765f" });
  logEvent(`${enemy.name} hit Mara for ${damage}${absorbed ? `; armor absorbed ${absorbed}` : ""}.`, "enemy");
  playSound("hit");

  if (state.player.hp <= 0) {
    logEvent("Mara's lumen signal faded beneath the archive.", "story");
    showResult(false);
  }
}

function collectPickup(pickup) {
  const index = state.pickups.indexOf(pickup);
  if (index !== -1) state.pickups.splice(index, 1);

  switch (pickup.kind) {
    case "credits": {
      const amount = randomInt(14, 30);
      state.player.credits += amount;
      state.stats.score += amount * 2;
      logEvent(`Recovered ${amount} vault credits.`, "reward");
      break;
    }
    case "ammo": {
      const amount = randomInt(5, 10);
      state.player.reserve += amount;
      logEvent(`Recovered ${amount} reserve rounds.`, "reward");
      break;
    }
    case "patch":
      state.player.patches += 1;
      logEvent("Recovered a living-fiber field patch.", "reward");
      break;
    case "armor": {
      const amount = randomInt(3, 6);
      state.player.armor += amount;
      logEvent(`Wove ${amount} points of glassroot armor.`, "reward");
      break;
    }
    case "pulse":
      state.player.pulses += 1;
      logEvent("Recovered an Echo pulse charge.", "reward");
      break;
    case "weapon": {
      const nextTier = Math.min(weapons.length - 1, state.player.weaponTier + 1);
      if (nextTier > state.player.weaponTier) {
        state.player.weaponTier = nextTier;
        state.player.weapon = copyWeapon(nextTier);
        state.player.ammo = state.player.weapon.magazine;
        logEvent(`Weapon attuned: ${state.player.weapon.name}.`, "reward");
      } else {
        state.player.weapon.min += 1;
        state.player.weapon.max += 2;
        logEvent(`${state.player.weapon.name} gained a calibrated damage core.`, "reward");
      }
      break;
    }
    case "memory":
      state.stats.score += 500;
      logEvent("Recovered a memory seed from the old surface.", "story");
      break;
  }

  addEffect({ type: "burst", x: pickup.x, y: pickup.y, color: "#efc65b", duration: 520 });
  playSound("pickup");
}

function checkPickup() {
  const pickup = pickupAt(state.player.x, state.player.y);
  if (pickup) collectPickup(pickup);
}

function afterPlayerTurn() {
  if (state.phase !== "playing") return;
  state.stats.turns += 1;
  takeEnemyTurn();
  updateUi();
}

function performMove(dx, dy) {
  if (state.phase !== "playing") return false;
  const target = { x: state.player.x + dx, y: state.player.y + dy };
  const enemy = enemyAt(target.x, target.y);

  if (enemy) {
    const damage = randomInt(3, 5) + state.player.level;
    damageEnemy(enemy, damage, "Lumen blade");
    playSound("shoot");
    afterPlayerTurn();
    return true;
  }

  if (!isFloor(target.x, target.y) || isCover(target.x, target.y)) {
    logEvent("The route is blocked.", "system");
    return false;
  }

  state.player.x = target.x;
  state.player.y = target.y;
  revealAround(target.x, target.y);
  checkPickup();
  playSound("move");

  if (state.exitUnlocked && sameCell(state.player, state.layout.exit)) {
    logEvent("The descent gate is ready. Press E to continue.", "story");
  }
  afterPlayerTurn();
  return true;
}

function fireAt(enemy) {
  if (state.phase !== "playing" || !enemy || !state.enemies.includes(enemy)) return false;
  const distance = Engine.manhattan(state.player, enemy);
  if (distance > state.player.weapon.range) {
    logEvent(`${enemy.name} is outside ${state.player.weapon.name} range.`, "system");
    return false;
  }
  if (!Engine.lineOfSight(state.layout.grid, state.player, enemy, coverSet())) {
    logEvent("Cover breaks the firing line.", "system");
    return false;
  }
  if (state.player.ammo <= 0) {
    logEvent("Magazine empty. Press R to reload.", "system");
    playSound("danger");
    return false;
  }

  state.player.ammo -= 1;
  let damage = randomInt(state.player.weapon.min, state.player.weapon.max);
  const critical = state.random() < 0.13;
  if (critical) damage = Math.round(damage * 1.65);
  addEffect({
    type: "beam",
    from: { x: state.player.x, y: state.player.y },
    to: { x: enemy.x, y: enemy.y },
    color: state.player.weapon.color,
    duration: 190
  });
  damageEnemy(enemy, damage, critical ? "Critical shot" : state.player.weapon.name);
  playSound("shoot");
  afterPlayerTurn();
  return true;
}

function shootNearest() {
  const target = state.enemies
    .filter(enemy =>
      Engine.manhattan(state.player, enemy) <= state.player.weapon.range &&
      Engine.lineOfSight(state.layout.grid, state.player, enemy, coverSet())
    )
    .sort((a, b) => Engine.manhattan(state.player, a) - Engine.manhattan(state.player, b))[0];

  if (!target) {
    logEvent("No visible target in weapon range.", "system");
    return false;
  }
  return fireAt(target);
}

function reloadWeapon() {
  if (state.phase !== "playing") return false;
  const needed = state.player.weapon.magazine - state.player.ammo;
  if (needed <= 0) {
    logEvent("Magazine already full.", "system");
    return false;
  }
  if (state.player.reserve <= 0) {
    logEvent("No reserve ammunition remains.", "system");
    return false;
  }
  const loaded = Math.min(needed, state.player.reserve);
  state.player.ammo += loaded;
  state.player.reserve -= loaded;
  logEvent(`Reloaded ${loaded} rounds.`, "system");
  afterPlayerTurn();
  return true;
}

function usePatch() {
  if (state.phase !== "playing") return false;
  if (state.player.patches <= 0) {
    logEvent("No field patches remain.", "system");
    return false;
  }
  if (state.player.hp >= state.player.maxHp) {
    logEvent("Vitals already stable.", "system");
    return false;
  }
  const healed = Math.min(state.player.maxHp - state.player.hp, 12 + state.player.level * 2);
  state.player.patches -= 1;
  state.player.hp += healed;
  logEvent(`Living fiber restored ${healed} vitals.`, "reward");
  addEffect({ type: "burst", x: state.player.x, y: state.player.y, color: "#75c98a", duration: 500 });
  playSound("pickup");
  afterPlayerTurn();
  return true;
}

function usePulse() {
  if (state.phase !== "playing") return false;
  if (state.player.pulses <= 0) {
    logEvent("No Echo pulse charges remain.", "system");
    return false;
  }
  const targets = state.enemies.filter(enemy => Engine.manhattan(state.player, enemy) <= 3);
  if (!targets.length) {
    logEvent("No signatures are close enough for an Echo pulse.", "system");
    return false;
  }
  state.player.pulses -= 1;
  addEffect({ type: "pulse", x: state.player.x, y: state.player.y, color: "#62d8d0", duration: 580 });
  for (const enemy of [...targets]) {
    enemy.stunned = 1;
    damageEnemy(enemy, 5 + state.player.level * 2, "Echo pulse");
  }
  logEvent("Nearby wardens lost their next turn.", "reward");
  playSound("pulse");
  afterPlayerTurn();
  return true;
}

function waitTurn() {
  if (state.phase !== "playing") return false;
  logEvent("Mara held position and listened to the archive.", "system");
  afterPlayerTurn();
  return true;
}

function interactWithGate() {
  if (state.phase !== "playing") return false;
  if (!sameCell(state.player, state.layout.exit)) {
    logEvent("Stand on the gold descent gate to use it.", "system");
    return false;
  }
  if (!state.exitUnlocked) {
    logEvent("The gate is sealed while hostile signatures remain.", "enemy");
    return false;
  }

  if (state.floor >= state.maxFloor) {
    state.stats.score += state.player.hp * 20 + state.player.credits * 3;
    logEvent("The Hollow Engine fell silent.", "story");
    playSound("gate");
    showResult(true);
    return true;
  }

  state.floor += 1;
  state.stats.score += 300 + state.floor * 80;
  playSound("gate");
  buildFloor();
  updateUi();
  return true;
}

function takeEnemyTurn() {
  if (state.phase !== "playing") return;
  const actingEnemies = [...state.enemies];

  for (const enemy of actingEnemies) {
    if (state.phase !== "playing" || !state.enemies.includes(enemy)) continue;
    if (enemy.stunned > 0) {
      enemy.stunned -= 1;
      logEvent(`${enemy.name} flickered and lost its turn.`, "reward");
      continue;
    }

    const distance = Engine.manhattan(enemy, state.player);
    const hasLine = Engine.lineOfSight(state.layout.grid, enemy, state.player, coverSet());
    if (distance <= enemy.range && hasLine) {
      hurtPlayer(enemy.damage + randomInt(0, 2), enemy);
      continue;
    }

    const path = Engine.findPath(
      state.layout.grid,
      enemy,
      state.player,
      occupiedSet(enemy)
    );
    if (path.length > 1) {
      enemy.x = path[1].x;
      enemy.y = path[1].y;
      if (Engine.manhattan(enemy, state.player) <= 3) {
        state.discovered.add(Engine.key(enemy.x, enemy.y));
      }
    }
  }
}

function moveToward(goal) {
  const path = Engine.findPath(
    state.layout.grid,
    state.player,
    goal,
    occupiedSet(enemyAt(goal.x, goal.y))
  );
  if (path.length < 2) return false;
  return performMove(path[1].x - state.player.x, path[1].y - state.player.y);
}

function autoStep() {
  if (!state.auto || state.phase !== "playing") return;
  if (state.player.hp <= state.player.maxHp * 0.35 && state.player.patches > 0) {
    usePatch();
    return;
  }
  if (state.player.ammo === 0 && state.player.reserve > 0) {
    reloadWeapon();
    return;
  }

  const visibleTarget = state.enemies
    .filter(enemy =>
      Engine.manhattan(state.player, enemy) <= state.player.weapon.range &&
      Engine.lineOfSight(state.layout.grid, state.player, enemy, coverSet())
    )
    .sort((a, b) => Engine.manhattan(state.player, a) - Engine.manhattan(state.player, b))[0];
  if (visibleTarget) {
    fireAt(visibleTarget);
    return;
  }

  if (state.enemies.length) {
    const nearest = [...state.enemies].sort(
      (a, b) => Engine.manhattan(state.player, a) - Engine.manhattan(state.player, b)
    )[0];
    moveToward(nearest);
    return;
  }

  if (state.pickups.length) {
    const nearestPickup = [...state.pickups].sort(
      (a, b) => Engine.manhattan(state.player, a) - Engine.manhattan(state.player, b)
    )[0];
    if (sameCell(state.player, nearestPickup)) checkPickup();
    else moveToward(nearestPickup);
    return;
  }

  if (sameCell(state.player, state.layout.exit)) interactWithGate();
  else moveToward(state.layout.exit);
}

function toggleAuto() {
  if (state.phase !== "playing") return;
  state.auto = !state.auto;
  logEvent(state.auto ? "Lumen compass assumed route control." : "Manual route control restored.", "system");
  updateUi();
}

function performAction(action) {
  const actions = {
    shoot: shootNearest,
    pulse: usePulse,
    medkit: usePatch,
    reload: reloadWeapon,
    interact: interactWithGate,
    wait: waitTurn
  };
  actions[action]?.();
}

function setCameraImmediate() {
  const target = cameraTarget();
  state.camera.x = target.x;
  state.camera.y = target.y;
  state.camera.ready = true;
}

function cameraTarget() {
  return {
    x: canvas.width * 0.47 - (state.player.x - state.player.y) * ISO_W / 2,
    y: canvas.height * 0.36 - (state.player.x + state.player.y) * ISO_H / 2
  };
}

function isoPoint(x, y) {
  return {
    x: state.camera.x + (x - y) * ISO_W / 2,
    y: state.camera.y + (x + y) * ISO_H / 2
  };
}

function diamondPath(x, y, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width / 2, y + height / 2);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x - width / 2, y + height / 2);
  ctx.closePath();
}

function drawFloorTile(x, y) {
  const point = isoPoint(x, y);
  const theme = currentTheme();
  const distance = Engine.manhattan(state.player, { x, y });
  const dim = clamp(1 - Math.max(0, distance - 7) * 0.035, 0.55, 1);
  ctx.save();
  ctx.globalAlpha = dim;
  ctx.fillStyle = (x + y) % 2 ? theme.floorA : theme.floorB;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 0.8;
  diamondPath(point.x, point.y, ISO_W, ISO_H);
  ctx.fill();
  ctx.stroke();

  if ((x * 7 + y * 11 + state.floor) % 17 === 0) {
    ctx.strokeStyle = `${theme.glow}66`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point.x - 8, point.y + ISO_H / 2);
    ctx.lineTo(point.x, point.y + ISO_H / 2 + 4);
    ctx.lineTo(point.x + 9, point.y + ISO_H / 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWallFace(a, b, color, capColor) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(b.x, b.y - WALL_H);
  ctx.lineTo(a.x, a.y - WALL_H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#82908f55";
  ctx.stroke();

  ctx.strokeStyle = capColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y - WALL_H);
  ctx.lineTo(b.x, b.y - WALL_H);
  ctx.stroke();
}

function drawBoundaryWalls(x, y) {
  const point = isoPoint(x, y);
  const top = { x: point.x, y: point.y };
  const right = { x: point.x + ISO_W / 2, y: point.y + ISO_H / 2 };
  const left = { x: point.x - ISO_W / 2, y: point.y + ISO_H / 2 };
  const theme = currentTheme();

  if (!isFloor(x, y - 1)) drawWallFace(top, right, theme.wallA, "#8b9895");
  if (!isFloor(x - 1, y)) drawWallFace(left, top, theme.wallB, "#70817e");
}

function drawCube(x, y, height, topColor, rightColor, leftColor) {
  const point = isoPoint(x, y);
  const topY = point.y - height;
  const top = { x: point.x, y: topY };
  const right = { x: point.x + ISO_W / 2, y: topY + ISO_H / 2 };
  const bottom = { x: point.x, y: topY + ISO_H };
  const left = { x: point.x - ISO_W / 2, y: topY + ISO_H / 2 };

  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(bottom.x, bottom.y + height);
  ctx.lineTo(left.x, left.y + height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(bottom.x, bottom.y + height);
  ctx.lineTo(right.x, right.y + height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#a8b2ad55";
  ctx.stroke();
}

function drawPortal() {
  const point = isoPoint(state.layout.exit.x, state.layout.exit.y);
  const centerY = point.y + ISO_H / 2;
  const unlocked = state.exitUnlocked;
  const color = unlocked ? "#efc65b" : "#72556d";
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = unlocked ? 0.8 + Math.sin(performance.now() / 180) * 0.18 : 0.55;
  ctx.beginPath();
  ctx.ellipse(point.x, centerY, 14, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(point.x, centerY, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `${color}55`;
  ctx.fillRect(point.x - 2, centerY - 12, 4, 10);
  ctx.restore();
}

function drawPickup(pickup) {
  const point = isoPoint(pickup.x, pickup.y);
  const x = point.x;
  const y = point.y + ISO_H / 2 - 6 + Math.sin((performance.now() + pickup.id * 80) / 220) * 2;
  const colors = {
    credits: "#efc65b",
    ammo: "#ef765f",
    patch: "#75c98a",
    armor: "#79b9d7",
    pulse: "#62d8d0",
    weapon: "#d879b5",
    memory: "#f3efe3"
  };
  const color = colors[pickup.kind] || "#ffffff";

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  if (pickup.kind === "ammo") {
    ctx.fillRect(x - 7, y - 4, 4, 10);
    ctx.fillRect(x - 1, y - 4, 4, 10);
    ctx.fillRect(x + 5, y - 4, 4, 10);
  } else if (pickup.kind === "patch") {
    ctx.fillRect(x - 8, y - 3, 16, 6);
    ctx.fillRect(x - 3, y - 8, 6, 16);
  } else if (pickup.kind === "weapon") {
    ctx.rotate(-0.45);
    ctx.fillRect(x - 10, y - 2, 20, 4);
    ctx.fillRect(x + 5, y + 1, 4, 7);
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawShadow(x, y, radius) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const point = isoPoint(state.player.x, state.player.y);
  const baseY = point.y + ISO_H / 2;
  const bob = Math.sin(performance.now() / 210) * 0.7;
  ctx.save();
  ctx.translate(point.x, baseY + bob);
  drawShadow(0, 2, 9);

  ctx.fillStyle = "#263642";
  ctx.beginPath();
  ctx.moveTo(-8, -16);
  ctx.lineTo(7, -16);
  ctx.lineTo(10, 0);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ef765f";
  ctx.fillRect(-7, -18, 13, 4);
  ctx.fillStyle = "#d8b18b";
  ctx.fillRect(-5, -27, 10, 10);
  ctx.fillStyle = "#1a2025";
  ctx.fillRect(-6, -30, 12, 5);
  ctx.fillStyle = "#ecf3ed";
  ctx.fillRect(-3, -24, 2, 2);
  ctx.fillRect(2, -24, 2, 2);

  ctx.strokeStyle = "#aab4af";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -18);
  ctx.lineTo(12, -5);
  ctx.stroke();
  ctx.fillStyle = "#62d8d0";
  ctx.shadowColor = "#62d8d0";
  ctx.shadowBlur = 9;
  ctx.fillRect(9, -21, 6, 6);
  ctx.restore();
}

function drawEnemy(enemy) {
  const point = isoPoint(enemy.x, enemy.y);
  const baseY = point.y + ISO_H / 2;
  const bob = Math.sin((performance.now() + enemy.id * 90) / 190) * 1.2;
  ctx.save();
  ctx.translate(point.x, baseY + bob);
  drawShadow(0, 2, enemy.type === "boss" ? 18 : 10);

  if (enemy.type === "mote") {
    ctx.fillStyle = enemy.color;
    ctx.shadowColor = enemy.accent;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();
    for (let index = 0; index < 5; index++) {
      const angle = index * Math.PI * 0.4;
      ctx.fillRect(Math.cos(angle) * 9 - 1, -12 + Math.sin(angle) * 9 - 1, 3, 3);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-3, -14, 2, 2);
    ctx.fillRect(2, -14, 2, 2);
  } else if (enemy.type === "drone") {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(11, -13);
    ctx.lineTo(0, -4);
    ctx.lineTo(-11, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = enemy.accent;
    ctx.fillRect(-4, -16, 8, 5);
    ctx.strokeStyle = "#d8ded8";
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(-7, -13);
    ctx.moveTo(14, -10);
    ctx.lineTo(7, -13);
    ctx.stroke();
  } else if (enemy.type === "brute") {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(-11, -22, 22, 20);
    ctx.fillStyle = "#4c6049";
    ctx.fillRect(-15, -18, 5, 13);
    ctx.fillRect(10, -18, 5, 13);
    ctx.fillStyle = enemy.accent;
    ctx.fillRect(-7, -16, 4, 4);
    ctx.fillRect(3, -16, 4, 4);
    ctx.beginPath();
    ctx.moveTo(-9, -22);
    ctx.lineTo(-3, -30);
    ctx.lineTo(0, -22);
    ctx.moveTo(9, -22);
    ctx.lineTo(3, -30);
    ctx.lineTo(0, -22);
    ctx.fill();
  } else if (enemy.type === "weaver") {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(12, -4);
    ctx.lineTo(-12, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#17151f";
    ctx.beginPath();
    ctx.arc(0, -20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = enemy.accent;
    ctx.fillRect(-3, -22, 6, 4);
    ctx.strokeStyle = enemy.accent;
    ctx.beginPath();
    ctx.arc(0, -13, 15, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-13, -34);
    ctx.lineTo(-5, -44);
    ctx.lineTo(0, -34);
    ctx.lineTo(7, -45);
    ctx.lineTo(15, -32);
    ctx.lineTo(19, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = enemy.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -23, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f6e8dc";
    ctx.fillRect(-5, -25, 10, 5);
  }

  const barWidth = enemy.type === "boss" ? 42 : 28;
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(-barWidth / 2, enemy.type === "boss" ? -55 : -37, barWidth, 4);
  ctx.fillStyle = enemy.hp / enemy.maxHp > 0.4 ? "#efc65b" : "#ef765f";
  ctx.fillRect(-barWidth / 2, enemy.type === "boss" ? -55 : -37, barWidth * (enemy.hp / enemy.maxHp), 4);

  if (enemy.stunned > 0) {
    ctx.strokeStyle = "#62d8d0";
    ctx.beginPath();
    ctx.ellipse(0, -32, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHover() {
  if (!state.hover || !isFloor(state.hover.x, state.hover.y)) return;
  const point = isoPoint(state.hover.x, state.hover.y);
  const enemy = enemyAt(state.hover.x, state.hover.y);
  ctx.save();
  ctx.strokeStyle = enemy ? "#ef765f" : "#62d8d0";
  ctx.lineWidth = 2;
  diamondPath(point.x, point.y, ISO_W - 5, ISO_H - 3);
  ctx.stroke();
  ctx.restore();
}

function drawEffects(now) {
  for (const effect of state.effects) {
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    if (effect.type === "beam") {
      const from = isoPoint(effect.from.x, effect.from.y);
      const to = isoPoint(effect.to.x, effect.to.y);
      ctx.strokeStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3 - progress * 1.5;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y + ISO_H / 2 - 15);
      ctx.lineTo(to.x, to.y + ISO_H / 2 - 14);
      ctx.stroke();
    } else if (effect.type === "damage") {
      const point = isoPoint(effect.x, effect.y);
      ctx.fillStyle = effect.color;
      ctx.font = "700 16px Consolas";
      ctx.textAlign = "center";
      ctx.fillText(effect.text, point.x, point.y - 23 - progress * 18);
    } else {
      const point = isoPoint(effect.x, effect.y);
      const radius = effect.type === "pulse" ? 18 + progress * 90 : 8 + progress * 28;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3 - progress * 2;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y + ISO_H / 2, radius, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  state.effects = state.effects.filter(effect => now - effect.startedAt < effect.duration);
}

function render(now) {
  const elapsed = Math.min(32, now - lastFrameTime);
  lastFrameTime = now;
  const target = cameraTarget();
  const smoothing = 1 - Math.pow(0.0005, elapsed / 1000);
  state.camera.x += (target.x - state.camera.x) * smoothing;
  state.camera.y += (target.y - state.camera.y) * smoothing;

  const shaking = now < state.shakeUntil;
  const shakeX = shaking ? (Math.random() - 0.5) * 6 : 0;
  const shakeY = shaking ? (Math.random() - 0.5) * 4 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.clearRect(-8, -8, canvas.width + 16, canvas.height + 16);
  ctx.fillStyle = "#030506";
  ctx.fillRect(-8, -8, canvas.width + 16, canvas.height + 16);

  if (state.layout) {
    const visibleTiles = [];
    for (let y = 0; y < state.layout.size; y++) {
      for (let x = 0; x < state.layout.size; x++) {
        if (isFloor(x, y) && state.discovered.has(Engine.key(x, y))) visibleTiles.push({ x, y });
      }
    }
    visibleTiles.sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const tile of visibleTiles) drawFloorTile(tile.x, tile.y);
    drawHover();
    for (const tile of visibleTiles) drawBoundaryWalls(tile.x, tile.y);

    if (state.discovered.has(Engine.key(state.layout.exit.x, state.layout.exit.y))) drawPortal();

    const depthItems = [];
    for (const cover of state.layout.covers) {
      if (state.discovered.has(Engine.key(cover.x, cover.y))) depthItems.push({ kind: "cover", value: cover });
    }
    for (const pickup of state.pickups) {
      if (state.discovered.has(Engine.key(pickup.x, pickup.y))) depthItems.push({ kind: "pickup", value: pickup });
    }
    for (const enemy of state.enemies) {
      if (state.discovered.has(Engine.key(enemy.x, enemy.y))) depthItems.push({ kind: "enemy", value: enemy });
    }
    depthItems.push({ kind: "player", value: state.player });
    depthItems.sort((a, b) => {
      const depthA = a.value.x + a.value.y;
      const depthB = b.value.x + b.value.y;
      if (depthA !== depthB) return depthA - depthB;
      const order = { pickup: 0, cover: 1, enemy: 2, player: 3 };
      return order[a.kind] - order[b.kind];
    });

    for (const item of depthItems) {
      if (item.kind === "cover") {
        const theme = currentTheme();
        drawCube(item.value.x, item.value.y, 22, "#82908d", theme.wallA, theme.wallB);
      } else if (item.kind === "pickup") drawPickup(item.value);
      else if (item.kind === "enemy") drawEnemy(item.value);
      else drawPlayer();
    }
    drawEffects(now);
  }
  ctx.restore();
  requestAnimationFrame(render);
}

function screenToGrid(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const screenX = (clientX - rect.left) * canvas.width / rect.width;
  const screenY = (clientY - rect.top) * canvas.height / rect.height;
  const horizontal = (screenX - state.camera.x) / ISO_W;
  const vertical = (screenY - state.camera.y - ISO_H / 2) / ISO_H;
  return {
    x: Math.round(vertical + horizontal),
    y: Math.round(vertical - horizontal)
  };
}

function handleCanvasClick(event) {
  if (state.phase !== "playing") return;
  const target = screenToGrid(event.clientX, event.clientY);
  if (!isFloor(target.x, target.y) || !state.discovered.has(Engine.key(target.x, target.y))) return;
  const enemy = enemyAt(target.x, target.y);
  if (enemy) {
    fireAt(enemy);
    return;
  }
  if (Engine.manhattan(state.player, target) === 1) {
    performMove(target.x - state.player.x, target.y - state.player.y);
    return;
  }
  moveToward(target);
}

function handleKey(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (helpDialog.open) {
    if (event.key === "Escape") helpDialog.close();
    return;
  }
  if (!overlay.hidden && event.key === "Enter") {
    event.preventDefault();
    primaryOverlayButton.click();
    return;
  }
  if (state.phase !== "playing") return;

  const movement = {
    ArrowUp: [0, -1],
    w: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0]
  }[key];

  if (movement) {
    event.preventDefault();
    performMove(movement[0], movement[1]);
    return;
  }

  const actions = {
    " ": "shoot",
    q: "pulse",
    h: "medkit",
    r: "reload",
    e: "interact",
    x: "wait"
  };
  if (actions[key]) {
    event.preventDefault();
    performAction(actions[key]);
  }
}

canvas.addEventListener("mousemove", event => {
  state.hover = screenToGrid(event.clientX, event.clientY);
});

canvas.addEventListener("mouseleave", () => {
  state.hover = null;
});

canvas.addEventListener("click", handleCanvasClick);
window.addEventListener("keydown", handleKey);

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    canvas.focus();
    performAction(button.dataset.action);
  });
});

document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("click", () => {
    const [dx, dy] = button.dataset.move.split(",").map(Number);
    canvas.focus();
    performMove(dx, dy);
  });
});

autoButton.addEventListener("click", toggleAuto);
newRunButton.addEventListener("click", () => newRun(false));
sideRunButton.addEventListener("click", () => newRun(true));
soundButton.addEventListener("click", () => {
  state.audio = !state.audio;
  updateUi();
  if (state.audio) playSound("pickup");
});
helpButton.addEventListener("click", openHelp);
closeHelpButton.addEventListener("click", () => helpDialog.close());
secondaryOverlayButton.addEventListener("click", openHelp);

primaryOverlayButton.addEventListener("click", () => {
  if (state.overlayMode === "briefing") beginRun();
  else newRun(state.sideMission);
});

setInterval(autoStep, 310);

window.__RIFTWARD_DEBUG__ = {
  state,
  newRun,
  performMove,
  performAction,
  screenToGrid
};

ctx.imageSmoothingEnabled = false;
newRun(false);
requestAnimationFrame(render);
