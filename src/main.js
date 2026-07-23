"use strict";

const Engine = window.RiftEngine;
if (!Engine) throw new Error("RiftEngine failed to load.");
const Catalog = window.RiftCatalog;
if (!Catalog) throw new Error("RiftCatalog failed to load.");

const { CHARACTERS, SUPPLIES, WEAPONS } = Catalog;
const PROFILE_KEY = "riftward-profile-v2";
const DEFAULT_PROFILE = {
  tokens: 180,
  ownedWeapons: ["arc-needle"],
  highScores: []
};

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
const shopButton = document.querySelector("#shopButton");
const scoresButton = document.querySelector("#scoresButton");
const nextFloorButton = document.querySelector("#nextFloorButton");
const gateActionButton = document.querySelector("#gateActionButton");
const gatePrompt = document.querySelector("#gatePrompt");
const gatePromptText = document.querySelector("#gatePromptText");
const characterRoster = document.querySelector("#characterRoster");
const selectionSummary = document.querySelector("#selectionSummary");
const operatorChip = document.querySelector("#operatorChip");
const operatorPortrait = document.querySelector("#operatorPortrait");
const operatorName = document.querySelector("#operatorName");
const helpDialog = document.querySelector("#helpDialog");
const closeHelpButton = document.querySelector("#closeHelpButton");
const shopDialog = document.querySelector("#shopDialog");
const closeShopButton = document.querySelector("#closeShopButton");
const shopGrid = document.querySelector("#shopGrid");
const shopTokensValue = document.querySelector("#shopTokensValue");
const shopMessage = document.querySelector("#shopMessage");
const weaponsTabButton = document.querySelector("#weaponsTabButton");
const suppliesTabButton = document.querySelector("#suppliesTabButton");
const scoreDialog = document.querySelector("#scoreDialog");
const closeScoreButton = document.querySelector("#closeScoreButton");
const resetScoresButton = document.querySelector("#resetScoresButton");
const currentRunScore = document.querySelector("#currentRunScore");
const highScoreList = document.querySelector("#highScoreList");
const fieldLog = document.querySelector("#fieldLog");

const ui = {
  healthFill: document.querySelector("#healthFill"),
  healthText: document.querySelector("#healthText"),
  floorValue: document.querySelector("#floorValue"),
  characterValue: document.querySelector("#characterValue"),
  weaponValue: document.querySelector("#weaponValue"),
  damageValue: document.querySelector("#damageValue"),
  rangeValue: document.querySelector("#rangeValue"),
  ammoValue: document.querySelector("#ammoValue"),
  armorValue: document.querySelector("#armorValue"),
  pulseValue: document.querySelector("#pulseValue"),
  tokensValue: document.querySelector("#tokensValue"),
  levelValue: document.querySelector("#levelValue"),
  sectorName: document.querySelector("#sectorName"),
  modeLabel: document.querySelector("#modeLabel"),
  objectiveTitle: document.querySelector("#objectiveTitle"),
  objectiveText: document.querySelector("#objectiveText"),
  turnValue: document.querySelector("#turnValue"),
  killsValue: document.querySelector("#killsValue"),
  floorScoreValue: document.querySelector("#floorScoreValue"),
  rankValue: document.querySelector("#rankValue"),
  scoreValue: document.querySelector("#scoreValue"),
  comboValue: document.querySelector("#comboValue"),
  bestScoreValue: document.querySelector("#bestScoreValue"),
  tokensEarnedValue: document.querySelector("#tokensEarnedValue"),
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

const pickupKinds = ["tokens", "ammo", "patch", "armor", "pulse"];

const state = {
  phase: "selection",
  overlayMode: "selection",
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
  selectedCharacterId: "mara",
  runWeapons: new Set(),
  shopTab: "weapons",
  profile: loadProfile(),
  stats: createRunStats(),
  camera: { x: canvas.width / 2, y: 120, ready: false },
  shakeUntil: 0,
  nextEntityId: 1,
  lastBlockedMessageAt: 0,
  scoreCommitted: false
};

let audioContext = null;
let lastFrameTime = performance.now();

function createRunStats() {
  return {
    turns: 0,
    kills: 0,
    score: 0,
    floorScore: 0,
    combo: 0,
    bestCombo: 0,
    tokensEarned: 0,
    lastKillTurn: -99
  };
}

function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!stored || typeof stored !== "object") return structuredClone(DEFAULT_PROFILE);
    const ownedWeapons = Array.isArray(stored.ownedWeapons)
      ? stored.ownedWeapons.filter(id => WEAPONS.some(weapon => weapon.id === id))
      : [];
    if (!ownedWeapons.includes("arc-needle")) ownedWeapons.unshift("arc-needle");
    return {
      tokens: Math.max(0, Math.floor(Number(stored.tokens) || 0)),
      ownedWeapons,
      highScores: Array.isArray(stored.highScores)
        ? stored.highScores
          .filter(entry => entry && Number.isFinite(Number(entry.score)))
          .slice(0, 5)
        : []
    };
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

function saveProfile() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
  } catch {
    // The game remains fully playable when storage is unavailable.
  }
}

function copyWeapon(id) {
  return { ...Catalog.findWeapon(id) };
}

function currentCharacter() {
  return Catalog.findCharacter(state.selectedCharacterId);
}

function bestScore() {
  return Number(state.profile.highScores[0]?.score) || 0;
}

function scoreRank(score) {
  if (score >= 7000) return "S";
  if (score >= 4500) return "A";
  if (score >= 2600) return "B";
  if (score >= 1200) return "C";
  return "D";
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

  if (state.floor > 1 && pickups.length) {
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

  const character = currentCharacter();
  logEvent(`${sectorName()} opened beneath ${character.name}.`, "story");
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
  state.seed = 1;
  state.stats = createRunStats();
  state.logs = [];
  state.effects = [];
  state.auto = false;
  state.nextEntityId = 1;
  state.lastBlockedMessageAt = 0;
  state.scoreCommitted = false;
  state.phase = "selection";
  state.overlayMode = "selection";
  state.player = null;
  state.layout = null;
  state.enemies = [];
  state.pickups = [];
  state.discovered = new Set();
  state.runWeapons = new Set();
  state.hover = null;
  state.exitUnlocked = false;
  renderLog();
  gatePrompt.hidden = true;
  operatorChip.hidden = true;
  showCharacterSelection();
  updateUi();
}

function renderCharacterRoster() {
  const fragment = document.createDocumentFragment();
  for (const character of CHARACTERS) {
    const weapon = Catalog.findWeapon(character.weaponId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-card";
    button.dataset.characterId = character.id;
    button.setAttribute("aria-pressed", String(character.id === state.selectedCharacterId));
    button.style.setProperty("--character-accent", character.palette.accent);
    button.innerHTML = `
      <canvas width="180" height="96" aria-hidden="true"></canvas>
      <span class="character-card-copy">
        <small>${character.callsign} / ${character.role}</small>
        <strong>${character.name}</strong>
        <em>${weapon.name}</em>
        <span class="character-mini-stats">
          <span>HP<b>${character.hp}</b></span>
          <span>ARMOR<b>${character.armor}</b></span>
          <span>RANGE<b>${weapon.range + character.rangeBonus}</b></span>
        </span>
      </span>
    `;
    button.addEventListener("click", () => selectCharacter(character.id));
    fragment.appendChild(button);
  }
  characterRoster.replaceChildren(fragment);
  for (const button of characterRoster.querySelectorAll(".character-card")) {
    drawRosterPortrait(button.querySelector("canvas"), Catalog.findCharacter(button.dataset.characterId));
  }
}

function selectCharacter(characterId, quiet) {
  state.selectedCharacterId = Catalog.findCharacter(characterId).id;
  for (const button of characterRoster.querySelectorAll(".character-card")) {
    button.setAttribute("aria-pressed", String(button.dataset.characterId === state.selectedCharacterId));
  }
  const character = currentCharacter();
  const weapon = Catalog.findWeapon(character.weaponId);
  selectionSummary.innerHTML = `
    <strong>${character.name} / ${character.role} / ${weapon.name}</strong>
    <span>${character.description} Starter trait: ${weapon.trait}.</span>
  `;
  ui.characterValue.textContent = character.callsign;
  if (!quiet) playSound("pickup");
}

function showCharacterSelection() {
  overlay.hidden = false;
  characterRoster.hidden = false;
  selectionSummary.hidden = false;
  overlayEyebrow.textContent = state.sideMission ? "SIDE ROUTE ROSTER" : "RIFTWALKER ROSTER";
  overlayTitle.textContent = "Choose your operator.";
  overlayText.textContent = state.sideMission
    ? "Choose one of five specialists for a three-floor high-risk contract. Enemies hit harder, but token rewards are increased."
    : "Five specialists are linked to the Echo Vault. Select a class, review its starting gear, and stop the Hollow Engine.";
  overlayStats.hidden = true;
  overlayStats.replaceChildren();
  primaryOverlayButton.textContent = state.sideMission ? "START SIDE ROUTE" : "START EXPEDITION";
  secondaryOverlayButton.textContent = "CONTROLS";
  renderCharacterRoster();
  selectCharacter(state.selectedCharacterId, true);
}

function startSelectedRun() {
  const character = currentCharacter();
  const weapon = copyWeapon(character.weaponId);
  state.floor = 1;
  state.seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  state.stats = createRunStats();
  state.logs = [];
  state.effects = [];
  state.auto = false;
  state.nextEntityId = 1;
  state.lastBlockedMessageAt = 0;
  state.scoreCommitted = false;
  state.runWeapons = new Set([...state.profile.ownedWeapons, character.weaponId]);
  state.player = {
    x: 0,
    y: 0,
    hp: character.hp,
    maxHp: character.hp,
    armor: character.armor,
    level: 1,
    xp: 0,
    nextXp: 30,
    weapon,
    ammo: weapon.magazine,
    reserve: character.reserve,
    pulses: character.pulses,
    patches: character.patches,
    damageBonus: character.damageBonus,
    meleeBonus: character.meleeBonus,
    critBonus: character.critBonus,
    rangeBonus: character.rangeBonus,
    healBonus: character.healBonus,
    tokenBonus: character.tokenBonus,
    damageReduction: character.damageReduction,
    characterId: character.id
  };
  buildFloor();
  beginRun();
}

function beginRun() {
  state.phase = "playing";
  overlay.hidden = true;
  characterRoster.hidden = true;
  selectionSummary.hidden = true;
  operatorChip.hidden = false;
  operatorName.textContent = `${currentCharacter().name} / ${currentCharacter().role}`;
  drawRosterPortrait(operatorPortrait, currentCharacter());
  logEvent(`${currentCharacter().name} linked the lumen compass. Manual route active.`, "story");
  canvas.focus();
  updateUi();
}

function commitRunScore(won) {
  if (state.scoreCommitted || !state.player) return;
  state.scoreCommitted = true;
  const entry = {
    score: Math.max(0, Math.round(state.stats.score)),
    character: currentCharacter().name,
    callsign: currentCharacter().callsign,
    kills: state.stats.kills,
    floor: state.floor,
    route: state.sideMission ? "SIDE" : "MAIN",
    won: Boolean(won),
    date: new Date().toISOString()
  };
  state.profile.highScores.push(entry);
  state.profile.highScores.sort((a, b) => Number(b.score) - Number(a.score));
  state.profile.highScores = state.profile.highScores.slice(0, 5);
  saveProfile();
}

function showResult(won) {
  state.auto = false;
  state.phase = won ? "won" : "lost";
  state.overlayMode = won ? "won" : "lost";
  overlay.hidden = false;
  gatePrompt.hidden = true;
  characterRoster.hidden = true;
  selectionSummary.hidden = true;
  overlayEyebrow.textContent = won ? "EXPEDITION COMPLETE" : "SIGNAL LOST";
  overlayTitle.textContent = won ? "Aster Vale remembers." : "The vault reclaimed the route.";
  overlayText.textContent = won
    ? `${currentCharacter().name} sealed the Hollow Engine and carried the recovered memory seeds back to the surface.`
    : `${currentCharacter().name}'s lumen trail remains in the archive. Choose a specialist and try a new route.`;
  commitRunScore(won);
  overlayStats.hidden = false;
  overlayStats.innerHTML = [
    ["SCORE", state.stats.score],
    ["RANK", scoreRank(state.stats.score)],
    ["KILLS", state.stats.kills],
    ["TOKENS", state.stats.tokensEarned],
    ["FLOORS", `${state.floor}/${state.maxFloor}`],
    ["BEST COMBO", `x${(1 + Math.min(4, Math.max(0, state.stats.bestCombo - 1)) * 0.25).toFixed(2)}`]
  ].map(([label, value]) => `<span>${label}<strong>${value}</strong></span>`).join("");
  primaryOverlayButton.textContent = "CHOOSE NEXT RIFTWALKER";
  secondaryOverlayButton.textContent = "SCORE BOARD";
  updateUi();
}

function openHelp() {
  if (!helpDialog.open) helpDialog.showModal();
}

function setShopTab(tab) {
  state.shopTab = tab === "supplies" ? "supplies" : "weapons";
  weaponsTabButton.setAttribute("aria-selected", String(state.shopTab === "weapons"));
  suppliesTabButton.setAttribute("aria-selected", String(state.shopTab === "supplies"));
  renderShop();
}

function equipWeapon(weaponId) {
  if (!state.player) {
    shopMessage.textContent = "Start an expedition before equipping a weapon.";
    return;
  }
  if (!state.runWeapons.has(weaponId) && !state.profile.ownedWeapons.includes(weaponId)) return;
  state.runWeapons.add(weaponId);
  state.player.weapon = copyWeapon(weaponId);
  state.player.ammo = state.player.weapon.magazine;
  shopMessage.textContent = `${state.player.weapon.name} equipped with a full magazine.`;
  logEvent(`Quartermaster equipped ${state.player.weapon.name}.`, "reward");
  playSound("pickup");
  renderShop();
  updateUi();
}

function buyWeapon(weaponId) {
  const weapon = Catalog.findWeapon(weaponId);
  if (state.profile.ownedWeapons.includes(weapon.id)) {
    equipWeapon(weapon.id);
    return;
  }
  const progressFloor = state.player ? state.floor : 1;
  if (progressFloor < weapon.unlockFloor) {
    shopMessage.textContent = `${weapon.name} unlocks after reaching floor ${weapon.unlockFloor}.`;
    return;
  }
  if (state.profile.tokens < weapon.cost) {
    shopMessage.textContent = `Need ${weapon.cost - state.profile.tokens} more Vault Tokens.`;
    playSound("danger");
    return;
  }
  state.profile.tokens -= weapon.cost;
  state.profile.ownedWeapons.push(weapon.id);
  state.runWeapons.add(weapon.id);
  saveProfile();
  shopMessage.textContent = `${weapon.name} permanently unlocked.`;
  if (state.player) equipWeapon(weapon.id);
  else {
    playSound("pickup");
    renderShop();
    updateUi();
  }
}

function buySupply(itemId) {
  const item = SUPPLIES.find(candidate => candidate.id === itemId);
  if (!item || !state.player || state.phase !== "playing") {
    shopMessage.textContent = "Supplies can only be delivered during an active expedition.";
    return;
  }
  if (state.profile.tokens < item.cost) {
    shopMessage.textContent = `Need ${item.cost - state.profile.tokens} more Vault Tokens.`;
    playSound("danger");
    return;
  }

  state.profile.tokens -= item.cost;
  if (item.kind === "ammo") state.player.reserve += item.amount;
  else if (item.kind === "patch") state.player.patches += item.amount;
  else if (item.kind === "armor") state.player.armor += item.amount;
  else if (item.kind === "pulse") state.player.pulses += item.amount;
  else if (item.kind === "repair") state.player.hp = state.player.maxHp;
  saveProfile();
  shopMessage.textContent = `${item.name} delivered to ${currentCharacter().name}.`;
  logEvent(`Purchased ${item.name} for ${item.cost} tokens.`, "reward");
  playSound("pickup");
  renderShop();
  updateUi();
}

function renderShop() {
  shopTokensValue.textContent = String(state.profile.tokens);
  shopMessage.textContent ||= state.player
    ? `${currentCharacter().name} is carrying ${state.player.weapon.name}.`
    : "Permanent weapon unlocks are available before a run.";

  const fragment = document.createDocumentFragment();
  if (state.shopTab === "weapons") {
    const progressFloor = state.player ? state.floor : 1;
    for (const weapon of WEAPONS) {
      const permanentlyOwned = state.profile.ownedWeapons.includes(weapon.id);
      const runOwned = state.runWeapons.has(weapon.id);
      const equipped = state.player?.weapon.id === weapon.id;
      const locked = !permanentlyOwned && !runOwned && progressFloor < weapon.unlockFloor;
      const item = document.createElement("article");
      item.className = `shop-item${equipped ? " current" : ""}${locked ? " locked" : ""}`;
      item.innerHTML = `
        <div class="shop-item-head">
          <span>${weapon.className} / ${weapon.trait}</span>
          <strong>${permanentlyOwned || runOwned ? "OWNED" : `${weapon.cost} T`}</strong>
        </div>
        <h3>${weapon.name}</h3>
        <p>${weapon.description}</p>
        <div class="weapon-stat-row">
          <span>POWER<b>${weapon.min}-${weapon.max}</b></span>
          <span>RANGE<b>${weapon.range}</b></span>
          <span>MAG<b>${weapon.magazine}</b></span>
        </div>
      `;
      const action = document.createElement("button");
      action.type = "button";
      if (equipped) {
        action.textContent = "EQUIPPED";
        action.disabled = true;
        action.className = "owned";
      } else if (permanentlyOwned || runOwned) {
        action.textContent = state.player ? "EQUIP" : "OWNED";
        action.className = "owned";
        action.disabled = !state.player;
        action.addEventListener("click", () => equipWeapon(weapon.id));
      } else if (locked) {
        action.textContent = `REACH FLOOR ${weapon.unlockFloor}`;
        action.disabled = true;
      } else {
        action.textContent = `BUY FOR ${weapon.cost} TOKENS`;
        action.disabled = state.profile.tokens < weapon.cost;
        action.addEventListener("click", () => buyWeapon(weapon.id));
      }
      item.appendChild(action);
      fragment.appendChild(item);
    }
  } else {
    for (const supply of SUPPLIES) {
      const item = document.createElement("article");
      item.className = "shop-item";
      item.innerHTML = `
        <div class="shop-item-head">
          <span>EXPEDITION SUPPLY</span>
          <strong>${supply.cost} T</strong>
        </div>
        <h3>${supply.name}</h3>
        <p>${supply.description}</p>
      `;
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = state.player ? `BUY FOR ${supply.cost} TOKENS` : "ACTIVE RUN REQUIRED";
      action.disabled = !state.player || state.phase !== "playing" || state.profile.tokens < supply.cost;
      action.addEventListener("click", () => buySupply(supply.id));
      item.appendChild(action);
      fragment.appendChild(item);
    }
  }
  shopGrid.replaceChildren(fragment);
}

function openShop() {
  if (state.auto) {
    state.auto = false;
    logEvent("Manual route restored while the quartermaster link is open.", "system");
  }
  shopMessage.textContent = "";
  renderShop();
  updateUi();
  if (!shopDialog.open) shopDialog.showModal();
}

function renderScoreBoard() {
  currentRunScore.innerHTML = [
    ["RUN SCORE", state.stats.score],
    ["RANK", scoreRank(state.stats.score)],
    ["KILLS", state.stats.kills],
    ["TOKENS", state.stats.tokensEarned]
  ].map(([label, value]) => `<span>${label}<strong>${value}</strong></span>`).join("");

  if (!state.profile.highScores.length) {
    const empty = document.createElement("li");
    empty.className = "empty-score";
    empty.textContent = "Complete or lose a run to record the first score.";
    highScoreList.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.profile.highScores.forEach((entry, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <b>${index + 1}</b>
      <span>${entry.character || entry.callsign || "Unknown Riftwalker"}</span>
      <strong>${Number(entry.score) || 0}</strong>
      <small>${entry.route || "MAIN"} / F${entry.floor || 1}</small>
    `;
    fragment.appendChild(item);
  });
  highScoreList.replaceChildren(fragment);
}

function openScoreBoard() {
  renderScoreBoard();
  if (!scoreDialog.open) scoreDialog.showModal();
}

function updateObjective() {
  const remaining = state.enemies.length;

  if (state.phase === "selection") {
    ui.objectiveTitle.textContent = "Choose a Riftwalker";
    ui.objectiveText.textContent = "Select one of five operators to begin.";
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
  } else {
    ui.objectiveTitle.textContent = state.floor >= state.maxFloor ? "Seal the Hollow Engine" : "Sector clear: choose your next move";
    ui.objectiveText.textContent = state.floor >= state.maxFloor
      ? "Press G or NEXT FLOOR from anywhere to complete the expedition."
      : "Press B to shop, or G to load the next floor immediately.";
  }
}

function updateUi() {
  ui.tokensValue.textContent = String(state.profile.tokens);
  ui.turnValue.textContent = String(state.stats.turns);
  ui.killsValue.textContent = String(state.stats.kills);
  ui.floorScoreValue.textContent = String(state.stats.floorScore);
  ui.scoreValue.textContent = String(state.stats.score);
  ui.comboValue.textContent = `x${(1 + Math.min(4, Math.max(0, state.stats.combo - 1)) * 0.25).toFixed(2)}`;
  ui.bestScoreValue.textContent = String(bestScore());
  ui.tokensEarnedValue.textContent = String(state.stats.tokensEarned);
  ui.rankValue.textContent = scoreRank(state.stats.score);
  ui.enemyCount.textContent = `${state.enemies.length} ${state.enemies.length === 1 ? "HOSTILE" : "HOSTILES"}`;
  autoButton.textContent = state.auto ? "AUTO ON" : "AUTO OFF";
  autoButton.setAttribute("aria-pressed", String(state.auto));
  soundButton.textContent = state.audio ? "SOUND ON" : "SOUND OFF";
  soundButton.setAttribute("aria-pressed", String(state.audio));

  if (!state.player || !state.layout) {
    ui.healthFill.style.width = "0%";
    ui.healthText.textContent = "--/--";
    ui.floorValue.textContent = "--";
    ui.characterValue.textContent = currentCharacter().callsign;
    ui.weaponValue.textContent = "--";
    ui.damageValue.textContent = "--";
    ui.rangeValue.textContent = "--";
    ui.ammoValue.textContent = "--";
    ui.armorValue.textContent = "--";
    ui.pulseValue.textContent = "--";
    ui.levelValue.textContent = "--";
    ui.sectorName.textContent = "Awaiting assignment";
    ui.modeLabel.textContent = "ROSTER";
    gatePrompt.hidden = true;
    gateActionButton.classList.remove("ready");
    updateObjective();
    return;
  }

  const player = state.player;
  const healthRatio = player.hp / player.maxHp;
  ui.healthFill.style.width = `${Math.max(0, healthRatio * 100)}%`;
  ui.healthText.textContent = `${player.hp}/${player.maxHp}`;
  ui.floorValue.textContent = `${state.floor}/${state.maxFloor}`;
  ui.characterValue.textContent = currentCharacter().callsign;
  ui.weaponValue.textContent = player.weapon.name;
  ui.damageValue.textContent = `${player.weapon.min + player.damageBonus}-${player.weapon.max + player.damageBonus}`;
  ui.rangeValue.textContent = String(player.weapon.range + player.rangeBonus);
  ui.ammoValue.textContent = `${player.ammo}/${player.reserve}`;
  ui.armorValue.textContent = String(player.armor);
  ui.pulseValue.textContent = String(player.pulses);
  ui.levelValue.textContent = `${player.level} (${player.xp}/${player.nextXp})`;
  ui.sectorName.textContent = sectorName();
  ui.modeLabel.textContent = state.auto ? "AUTO ROUTE" : "MANUAL";
  const canAdvance = state.phase === "playing" && state.exitUnlocked;
  gatePrompt.hidden = !canAdvance;
  gateActionButton.classList.toggle("ready", canAdvance);
  gatePromptText.textContent = state.floor >= state.maxFloor
    ? "Press G to seal the Hollow Engine"
    : `Press G to load floor ${state.floor + 1}`;
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
    logEvent(`Level ${state.player.level}. ${currentCharacter().name}'s lumen link intensified.`, "reward");
    playSound("pickup");
  }
}

function defeatEnemy(enemy) {
  const index = state.enemies.indexOf(enemy);
  if (index !== -1) state.enemies.splice(index, 1);
  if (state.stats.turns - state.stats.lastKillTurn > 5) state.stats.combo = 0;
  state.stats.combo += 1;
  state.stats.bestCombo = Math.max(state.stats.bestCombo, state.stats.combo);
  state.stats.lastKillTurn = state.stats.turns;
  state.stats.kills += 1;
  const multiplier = 1 + Math.min(4, Math.max(0, state.stats.combo - 1)) * 0.25;
  const basePoints = enemy.type === "boss" ? 1200 : 80 + enemy.reward * 8 + state.floor * 20;
  const points = Math.round(basePoints * multiplier);
  const tokenMultiplier = (state.sideMission ? 1.2 : 1) * (1 + state.player.tokenBonus);
  const tokens = Math.max(1, Math.round(enemy.reward * tokenMultiplier));
  state.stats.score += points;
  state.stats.floorScore += points;
  state.stats.tokensEarned += tokens;
  state.profile.tokens += tokens;
  saveProfile();
  gainExperience(enemy.type === "boss" ? 60 : 8 + state.floor * 2);
  logEvent(`${enemy.name} defeated. +${points} score, +${tokens} tokens, combo x${multiplier.toFixed(2)}.`, "reward");
  addEffect({ type: "burst", x: enemy.x, y: enemy.y, color: enemy.accent, duration: 500 });
  addEffect({ type: "score", x: enemy.x, y: enemy.y, text: `+${points}`, color: "#f0c65a", duration: 700 });

  if (enemy.type !== "boss" && state.random() < 0.32 && !pickupAt(enemy.x, enemy.y)) {
    state.pickups.push({
      id: state.nextEntityId++,
      x: enemy.x,
      y: enemy.y,
      kind: state.random() < 0.55 ? "tokens" : "ammo"
    });
  }

  if (state.enemies.length === 0) {
    state.exitUnlocked = true;
    const gateRoute = Engine.findPath(state.layout.grid, state.player, state.layout.exit, coverSet());
    for (const cell of gateRoute) state.discovered.add(Engine.key(cell.x, cell.y));
    const clearBonus = state.floor * 160 + (state.sideMission ? 100 : 0);
    state.stats.score += clearBonus;
    state.stats.floorScore += clearBonus;
    logEvent(`Sector clear. +${clearBonus} score. Press B to shop or G to load the next floor.`, "story");
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
  damage = Math.max(0, damage - absorbed - state.player.damageReduction);
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.stats.combo = 0;
  state.shakeUntil = performance.now() + 180;
  addEffect({ type: "damage", x: state.player.x, y: state.player.y, text: `-${damage}`, color: "#ef765f" });
  logEvent(`${enemy.name} hit ${currentCharacter().name} for ${damage}${absorbed ? `; armor absorbed ${absorbed}` : ""}.`, "enemy");
  playSound("hit");

  if (state.player.hp <= 0) {
    logEvent(`${currentCharacter().name}'s lumen signal faded beneath the archive.`, "story");
    showResult(false);
  }
}

function collectPickup(pickup) {
  const index = state.pickups.indexOf(pickup);
  if (index !== -1) state.pickups.splice(index, 1);

  switch (pickup.kind) {
    case "tokens": {
      const amount = randomInt(14, 30);
      state.profile.tokens += amount;
      state.stats.tokensEarned += amount;
      state.stats.score += amount * 2;
      state.stats.floorScore += amount * 2;
      saveProfile();
      logEvent(`Recovered ${amount} persistent Vault Tokens.`, "reward");
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
      const choices = WEAPONS.filter(weapon =>
        weapon.unlockFloor <= Math.min(state.maxFloor, state.floor + 1) &&
        !state.runWeapons.has(weapon.id)
      );
      const rewardWeapon = choices[Math.floor(state.random() * choices.length)];
      if (rewardWeapon) {
        state.runWeapons.add(rewardWeapon.id);
        state.player.weapon = copyWeapon(rewardWeapon.id);
        state.player.ammo = state.player.weapon.magazine;
        logEvent(`Run weapon recovered and equipped: ${state.player.weapon.name}.`, "reward");
      } else {
        state.profile.tokens += 70;
        state.stats.tokensEarned += 70;
        saveProfile();
        logEvent("Duplicate weapon core converted into 70 Vault Tokens.", "reward");
      }
      break;
    }
    case "memory":
      state.stats.score += 500;
      state.stats.floorScore += 500;
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
  if (state.stats.turns - state.stats.lastKillTurn > 5) state.stats.combo = 0;
  takeEnemyTurn();
  updateUi();
}

function performMove(dx, dy) {
  if (state.phase !== "playing") return false;
  const target = { x: state.player.x + dx, y: state.player.y + dy };
  const enemy = enemyAt(target.x, target.y);

  if (enemy) {
    const damage = randomInt(3, 5) + state.player.level + state.player.meleeBonus;
    damageEnemy(enemy, damage, "Lumen blade");
    playSound("shoot");
    afterPlayerTurn();
    return true;
  }

  if (!isFloor(target.x, target.y) || isCover(target.x, target.y)) {
    const now = performance.now();
    if (now - state.lastBlockedMessageAt > 850) {
      logEvent(
        state.exitUnlocked
          ? "Sector boundary reached. Press G or NEXT FLOOR to continue."
          : "Blocked tile. Choose another direction or click a visible floor tile.",
        "system"
      );
      state.lastBlockedMessageAt = now;
    }
    return false;
  }

  state.player.x = target.x;
  state.player.y = target.y;
  revealAround(target.x, target.y);
  checkPickup();
  playSound("move");

  if (state.exitUnlocked && sameCell(state.player, state.layout.exit)) {
    logEvent("The descent gate is ready. Press G or E to continue.", "story");
  }
  afterPlayerTurn();
  return true;
}

function fireAt(enemy) {
  if (state.phase !== "playing" || !enemy || !state.enemies.includes(enemy)) return false;
  const distance = Engine.manhattan(state.player, enemy);
  const effectiveRange = state.player.weapon.range + state.player.rangeBonus;
  if (distance > effectiveRange) {
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

  const shotCount = Math.min(state.player.weapon.shots || 1, state.player.ammo);
  state.player.ammo -= shotCount;
  let damage = 0;
  let criticals = 0;
  for (let shot = 0; shot < shotCount; shot++) {
    let shotDamage = randomInt(state.player.weapon.min, state.player.weapon.max) + state.player.damageBonus;
    if (distance <= 2) shotDamage += state.player.weapon.closeBonus || 0;
    const criticalChance = 0.13 + state.player.critBonus + (state.player.weapon.critBonus || 0);
    if (state.random() < criticalChance) {
      shotDamage = Math.round(shotDamage * 1.65);
      criticals += 1;
    }
    damage += shotDamage;
  }
  addEffect({
    type: "beam",
    from: { x: state.player.x, y: state.player.y },
    to: { x: enemy.x, y: enemy.y },
    color: state.player.weapon.color,
    duration: 190
  });
  const impactPoint = { x: enemy.x, y: enemy.y };
  damageEnemy(
    enemy,
    damage,
    criticals ? `${state.player.weapon.name} critical${criticals > 1 ? " burst" : ""}` : state.player.weapon.name
  );
  if (state.player.weapon.splash > 0) {
    const nearby = state.enemies.filter(candidate =>
      candidate !== enemy && Engine.manhattan(candidate, impactPoint) <= 1
    );
    for (const candidate of nearby) {
      damageEnemy(candidate, state.player.weapon.splash, `${state.player.weapon.name} splash`);
    }
  }
  playSound("shoot");
  afterPlayerTurn();
  return true;
}

function shootNearest() {
  const target = state.enemies
    .filter(enemy =>
      Engine.manhattan(state.player, enemy) <= state.player.weapon.range + state.player.rangeBonus &&
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
  const healed = Math.min(
    state.player.maxHp - state.player.hp,
    12 + state.player.level * 2 + state.player.healBonus
  );
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
  logEvent(`${currentCharacter().name} held position and listened to the archive.`, "system");
  afterPlayerTurn();
  return true;
}

function interactWithGate() {
  if (state.phase !== "playing") return false;
  if (!state.exitUnlocked) {
    logEvent(`${state.enemies.length} hostile signature${state.enemies.length === 1 ? "" : "s"} still seal the next floor.`, "enemy");
    return false;
  }

  if (state.floor >= state.maxFloor) {
    state.stats.score += state.player.hp * 20 + state.stats.bestCombo * 60;
    logEvent("The Hollow Engine fell silent.", "story");
    playSound("gate");
    showResult(true);
    return true;
  }

  state.floor += 1;
  const descentBonus = 300 + state.floor * 80;
  state.stats.score += descentBonus;
  state.stats.floorScore = 0;
  state.stats.combo = 0;
  gatePrompt.hidden = true;
  logEvent(`Gate recall engaged from the cleared sector. +${descentBonus} score.`, "story");
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
      Engine.manhattan(state.player, enemy) <= state.player.weapon.range + state.player.rangeBonus &&
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

  interactWithGate();
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
    shop: openShop,
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
  if (!state.player) {
    return { x: canvas.width / 2, y: canvas.height * 0.34 };
  }
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

function drawGateRoute() {
  if (!state.exitUnlocked) return;
  const path = Engine.findPath(state.layout.grid, state.player, state.layout.exit, coverSet());
  if (path.length < 2) return;
  const pulse = 0.45 + Math.sin(performance.now() / 180) * 0.16;
  ctx.save();
  ctx.strokeStyle = "#f0c65a";
  ctx.fillStyle = "#f0c65a";
  ctx.lineWidth = 2;
  ctx.globalAlpha = pulse;
  for (let index = 1; index < path.length; index += 2) {
    const point = isoPoint(path[index].x, path[index].y);
    diamondPath(point.x, point.y + 2, ISO_W - 13, ISO_H - 7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickup(pickup) {
  const point = isoPoint(pickup.x, pickup.y);
  const x = point.x;
  const y = point.y + ISO_H / 2 - 6 + Math.sin((performance.now() + pickup.id * 80) / 220) * 2;
  const colors = {
    tokens: "#efc65b",
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

function drawCharacterFigure(targetContext, character, scale) {
  const palette = character.palette;
  const drawScale = scale || 1;
  targetContext.save();
  targetContext.scale(drawScale, drawScale);

  targetContext.fillStyle = "rgba(0, 0, 0, 0.46)";
  targetContext.beginPath();
  targetContext.ellipse(0, 1, 10, 4, 0, 0, Math.PI * 2);
  targetContext.fill();

  targetContext.fillStyle = "#10161a";
  targetContext.fillRect(-7, -8, 5, 9);
  targetContext.fillRect(2, -8, 5, 9);
  targetContext.fillStyle = "#3c4950";
  targetContext.fillRect(-8, -2, 6, 3);
  targetContext.fillRect(2, -2, 6, 3);

  targetContext.fillStyle = palette.primary;
  targetContext.beginPath();
  targetContext.moveTo(-10, -25);
  targetContext.lineTo(9, -25);
  targetContext.lineTo(11, -7);
  targetContext.lineTo(6, -4);
  targetContext.lineTo(0, -8);
  targetContext.lineTo(-6, -4);
  targetContext.lineTo(-11, -7);
  targetContext.closePath();
  targetContext.fill();

  targetContext.fillStyle = palette.secondary;
  targetContext.fillRect(-10, -23, 4, 14);
  targetContext.fillRect(6, -23, 4, 14);
  targetContext.fillStyle = "#0c1215";
  targetContext.fillRect(-2, -24, 4, 15);
  targetContext.fillStyle = palette.accent;
  targetContext.fillRect(-3, -21, 6, 4);
  targetContext.fillRect(-1, -15, 2, 5);

  targetContext.fillStyle = palette.primary;
  targetContext.fillRect(-14, -23, 5, 12);
  targetContext.fillRect(9, -23, 5, 12);
  targetContext.fillStyle = palette.light;
  targetContext.fillRect(-14, -12, 5, 3);

  targetContext.fillStyle = palette.skin;
  targetContext.fillRect(-6, -36, 12, 12);
  targetContext.fillStyle = palette.hair;

  if (character.id === "mara") {
    targetContext.fillRect(-7, -39, 14, 5);
    targetContext.fillRect(-7, -35, 4, 8);
    targetContext.fillRect(5, -35, 3, 6);
  } else if (character.id === "kael") {
    targetContext.fillRect(-7, -40, 14, 5);
    targetContext.fillRect(-7, -36, 5, 5);
    targetContext.fillStyle = palette.secondary;
    targetContext.fillRect(4, -39, 5, 3);
  } else if (character.id === "imani") {
    targetContext.fillRect(-7, -39, 14, 6);
    targetContext.fillRect(-9, -38, 4, 7);
    targetContext.fillRect(5, -38, 4, 7);
    targetContext.beginPath();
    targetContext.arc(-7, -40, 3, 0, Math.PI * 2);
    targetContext.arc(7, -40, 3, 0, Math.PI * 2);
    targetContext.fill();
  } else if (character.id === "tor") {
    targetContext.fillRect(-7, -39, 14, 5);
    targetContext.fillRect(-7, -35, 3, 6);
    targetContext.fillStyle = "#5b352b";
    targetContext.fillRect(-5, -29, 10, 6);
  } else {
    targetContext.beginPath();
    targetContext.moveTo(-9, -34);
    targetContext.lineTo(-5, -42);
    targetContext.lineTo(6, -42);
    targetContext.lineTo(10, -33);
    targetContext.lineTo(6, -26);
    targetContext.lineTo(-7, -26);
    targetContext.closePath();
    targetContext.fill();
  }

  targetContext.fillStyle = palette.light;
  targetContext.fillRect(-3, -32, 2, 2);
  targetContext.fillRect(2, -32, 2, 2);
  targetContext.fillStyle = palette.accent;
  targetContext.fillRect(5, -31, 2, 2);

  targetContext.strokeStyle = "#aeb8bc";
  targetContext.lineWidth = 2;
  targetContext.beginPath();
  targetContext.moveTo(10, -22);
  targetContext.lineTo(15, -10);
  targetContext.stroke();
  targetContext.fillStyle = palette.accent;
  targetContext.shadowColor = palette.accent;
  targetContext.shadowBlur = 7;
  targetContext.fillRect(11, -25, 7, 5);
  targetContext.fillStyle = "#d9e2e2";
  targetContext.fillRect(16, -24, 5, 2);
  targetContext.shadowBlur = 0;
  targetContext.restore();
}

function drawRosterPortrait(portraitCanvas, character) {
  if (!portraitCanvas) return;
  const portraitContext = portraitCanvas.getContext("2d");
  const width = portraitCanvas.width;
  const height = portraitCanvas.height;
  portraitContext.clearRect(0, 0, width, height);
  portraitContext.fillStyle = "#080c0f";
  portraitContext.fillRect(0, 0, width, height);
  portraitContext.fillStyle = `${character.palette.accent}20`;
  portraitContext.beginPath();
  portraitContext.moveTo(width * 0.52, 0);
  portraitContext.lineTo(width, 0);
  portraitContext.lineTo(width, height);
  portraitContext.lineTo(width * 0.18, height);
  portraitContext.closePath();
  portraitContext.fill();
  portraitContext.strokeStyle = `${character.palette.accent}28`;
  portraitContext.lineWidth = 1;
  for (let x = 10; x < width; x += 18) {
    portraitContext.beginPath();
    portraitContext.moveTo(x, 0);
    portraitContext.lineTo(x, height);
    portraitContext.stroke();
  }
  const scale = Math.min(width / 74, height / 52);
  portraitContext.save();
  portraitContext.translate(width / 2, height - 6);
  drawCharacterFigure(portraitContext, character, scale);
  portraitContext.restore();
}

function drawPlayer() {
  const point = isoPoint(state.player.x, state.player.y);
  const baseY = point.y + ISO_H / 2;
  const bob = Math.sin(performance.now() / 210) * 0.7;
  const playerScale = window.matchMedia("(max-width: 620px)").matches ? 1.45 : 1.12;
  ctx.save();
  ctx.translate(point.x, baseY + bob);
  ctx.strokeStyle = `${currentCharacter().palette.accent}8f`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawCharacterFigure(ctx, currentCharacter(), playerScale);
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
    } else if (effect.type === "damage" || effect.type === "score") {
      const point = isoPoint(effect.x, effect.y);
      ctx.fillStyle = effect.color;
      ctx.font = effect.type === "score"
        ? "700 17px Bahnschrift, Segoe UI, sans-serif"
        : "700 15px Cascadia Mono, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(effect.text, point.x, point.y - (effect.type === "score" ? 34 : 23) - progress * 18);
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
    drawGateRoute();
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
  if (state.exitUnlocked && sameCell(target, state.layout.exit)) {
    interactWithGate();
    return;
  }
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
  const openDialog = [helpDialog, shopDialog, scoreDialog].find(dialog => dialog.open);
  if (openDialog) {
    if (event.key === "Escape") openDialog.close();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    openScoreBoard();
    return;
  }
  if (key === "b") {
    event.preventDefault();
    openShop();
    return;
  }
  if (!overlay.hidden && event.key === "Enter") {
    event.preventDefault();
    primaryOverlayButton.click();
    return;
  }
  if (state.phase !== "playing") return;
  if (key === "m") {
    event.preventDefault();
    toggleAuto();
    return;
  }

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
    f: "shoot",
    "1": "shoot",
    q: "pulse",
    "2": "pulse",
    h: "medkit",
    "3": "medkit",
    r: "reload",
    "4": "reload",
    e: "interact",
    g: "interact",
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
shopButton.addEventListener("click", openShop);
scoresButton.addEventListener("click", openScoreBoard);
nextFloorButton.addEventListener("click", interactWithGate);
newRunButton.addEventListener("click", () => newRun(false));
sideRunButton.addEventListener("click", () => newRun(true));
soundButton.addEventListener("click", () => {
  state.audio = !state.audio;
  updateUi();
  if (state.audio) playSound("pickup");
});
helpButton.addEventListener("click", openHelp);
closeHelpButton.addEventListener("click", () => helpDialog.close());
closeShopButton.addEventListener("click", () => shopDialog.close());
closeScoreButton.addEventListener("click", () => scoreDialog.close());
weaponsTabButton.addEventListener("click", () => setShopTab("weapons"));
suppliesTabButton.addEventListener("click", () => setShopTab("supplies"));
resetScoresButton.addEventListener("click", () => {
  state.profile.highScores = [];
  saveProfile();
  renderScoreBoard();
  updateUi();
});
secondaryOverlayButton.addEventListener("click", () => {
  if (state.overlayMode === "selection") openHelp();
  else openScoreBoard();
});

primaryOverlayButton.addEventListener("click", () => {
  if (state.overlayMode === "selection") startSelectedRun();
  else newRun(state.sideMission);
});

setInterval(autoStep, 310);

window.__RIFTWARD_DEBUG__ = {
  state,
  newRun,
  startSelectedRun,
  selectCharacter,
  performMove,
  performAction,
  interactWithGate,
  openShop,
  screenToGrid
};

ctx.imageSmoothingEnabled = false;
newRun(false);
requestAnimationFrame(render);
