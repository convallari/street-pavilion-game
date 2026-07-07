const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = 576;
let H = 1024;
let CELL = 72;
let BOARD_X = 0;
let BOARD_Y = 150;
const BOARD_ROWS = 8;
let PANEL_Y = 758;
let CAMP_Y = 792;
const CAMP_SLOTS = 6;
let SLOT_X = 18;
let SLOT_W = 66;
let SLOT_H = 58;
let SLOT_GAP = 4;
let RECRUIT = { x: 18, y: 948, w: 256, h: 58 };
let SPEED = { x: 290, y: 948, w: 82, h: 58 };
let STRATEGY_Y = 870;
let STRATEGY_W = 126;
let STRATEGY_H = 56;
let EXIT_BUTTON = { x: 516, y: 20, w: 42, h: 42 };

const TROOPS = ["枪", "刀", "弓", "骑"];
const ROLE_BY_LABEL = {
  枪: "spear",
  刀: "blade",
  弓: "archer",
  骑: "rider",
  农: "farmer",
};
const ROLE_META = {
  spear: { title: "枪阵", code: "枪", color: "#b4342d" },
  blade: { title: "刀盾", code: "盾", color: "#8a5a35" },
  archer: { title: "弓手", code: "弓", color: "#31705a" },
  rider: { title: "轻骑", code: "骑", color: "#5d4b43" },
  farmer: { title: "粮官", code: "粮", color: "#669743" },
  char: { title: "将印", code: "印", color: "#9b7848" },
  hero: { title: "合将", code: "将", color: "#d7a82d" },
};
const HERO_PAIRS = [
  { chars: ["马", "谡"], name: "马谡", tone: "#9a6a1d", special: "strategy" },
  { chars: ["王", "平"], name: "王平", tone: "#316e67", special: "guard" },
  { chars: ["诸", "葛"], name: "诸葛", tone: "#3f70a8", special: "wisdom" },
];
const CHAR_POOL = HERO_PAIRS.flatMap((item) => item.chars);
const ALL_POOL = ["枪", "刀", "弓", "骑", "农", "农", "枪", "刀", "弓", "骑", "枪", "弓", ...CHAR_POOL];

const STRATEGIES = [
  { key: "ambush", name: "伏兵", cost: 0, cooldown: 16, color: "#42684f", hint: "山道减速伤害" },
  { key: "fire", name: "火攻", cost: 0, cooldown: 18, color: "#b94d2f", hint: "横向燃烧" },
  { key: "supplyCut", name: "断粮", cost: 0, cooldown: 26, color: "#6b5a45", hint: "削弱下波" },
  { key: "fortify", name: "铲子", cost: 0, cooldown: 20, color: "#9d7a2c", hint: "拖动开垦" },
];
let STRATEGY_RECTS = [];
const MAX_MORALE = 100;

let bottomPath = [];
let battlePaths = {};
const ROUTE_META = {
  main: { name: "主攻", color: "#b28d63", line: "#5a4030", glow: "rgba(255, 220, 160, .36)" },
  water: { name: "断水", color: "#4d9bbb", line: "#24566a", glow: "rgba(175, 232, 255, .36)" },
  encircle: { name: "合围", color: "#b05f52", line: "#63332e", glow: "rgba(255, 184, 160, .34)" },
};

const allLand = {
  bottom: [
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
    [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6],
    [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6],
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6],
  ],
};

const initialLand = {
  bottom: new Set([
    "1:3", "1:4", "2:2", "2:3", "2:4", "2:5", "3:2", "3:3", "3:4",
    "5:2", "5:3", "5:4", "6:1", "6:2", "6:3", "6:4", "7:2", "7:3", "7:4",
  ]),
};
const highGround = new Set(["1:3", "1:4", "2:2", "2:3", "2:4", "2:5", "3:2", "3:3", "3:4", "3:5"]);
const waterCells = new Set(["2:6", "3:6"]);
const wangPingCells = new Set(["5:2", "5:3", "6:2", "6:3"]);

const SVG_SPECS = {
  spear: { body: "#f7f0dd", stroke: "#15110d", accent: "#9b2f28", weapon: "spear" },
  blade: { body: "#f7f0dd", stroke: "#15110d", accent: "#7e4832", weapon: "blade" },
  archer: { body: "#f7f0dd", stroke: "#15110d", accent: "#3f6c50", weapon: "bow" },
  rider: { body: "#f7f0dd", stroke: "#15110d", accent: "#62504a", weapon: "horse" },
  farmer: { body: "#f7f0dd", stroke: "#15110d", accent: "#6f9a4e", weapon: "grain" },
  char: { body: "#f7f0dd", stroke: "#15110d", accent: "#947348", weapon: "scroll" },
  heroMasu: { body: "#fff7d7", stroke: "#15110d", accent: "#b47a24", weapon: "fan" },
  heroWangping: { body: "#ecfff5", stroke: "#15110d", accent: "#2f766c", weapon: "shield" },
  heroZhuge: { body: "#eef6ff", stroke: "#15110d", accent: "#426ea8", weapon: "fan" },
  weiSoldier: { body: "#e6e2da", stroke: "#1c1715", accent: "#6b2e2b", weapon: "spear" },
  weiRider: { body: "#e6e2da", stroke: "#1c1715", accent: "#563c35", weapon: "horse" },
  weiGeneral: { body: "#f4e0c7", stroke: "#1c1715", accent: "#8a2821", weapon: "blade" },
  zhangHe: { body: "#ffe2c0", stroke: "#120d0b", accent: "#b4211c", weapon: "halberd" },
  food: { body: "#fff2cf", stroke: "#4b3425", accent: "#d8a84b", weapon: "grain" },
  fortify: { body: "#f7ead2", stroke: "#453421", accent: "#a77a2e", weapon: "wall" },
  shovel: { body: "#f7ead2", stroke: "#453421", accent: "#a77a2e", weapon: "shovel" },
  ambushIcon: { body: "#eaf7e9", stroke: "#182016", accent: "#42684f", weapon: "ambush" },
  fireIcon: { body: "#ffe1c8", stroke: "#35140d", accent: "#d9532f", weapon: "fire" },
  supplyIcon: { body: "#f0e5d3", stroke: "#2b2017", accent: "#6b5a45", weapon: "cut" },
};
const svgAssets = {};

let scene = "menu";
let lastTime = performance.now();
let pointer = null;
let drag = null;
let nextUnitId = 1;
let particles = [];
let projectiles = [];
let popups = [];
let game = createGame();
let audioCtx = null;
let lastSfxAt = {};

initSvgAssets();

function svgImage(markup) {
  if (typeof Image === "undefined") return { complete: false, src: "" };
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return image;
}

function initSvgAssets() {
  for (const [key, spec] of Object.entries(SVG_SPECS)) {
    svgAssets[key] = svgImage(makeStickSvg(spec));
  }
}

function makeStickSvg(spec) {
  const weapon = spec.weapon;
  const extra = {
    spear: `<line x1="46" y1="12" x2="78" y2="76"/><path d="M43 10 L54 16 L45 22 Z" fill="${spec.accent}"/>`,
    blade: `<path d="M48 20 L74 44 L66 52 L42 25 Z" fill="#dce6ec"/><line x1="42" y1="25" x2="34" y2="33"/>`,
    bow: `<path d="M58 18 Q76 40 58 68" fill="none"/><line x1="58" y1="18" x2="58" y2="68"/><line x1="40" y1="42" x2="72" y2="42"/>`,
    horse: `<path d="M16 67 Q31 48 52 63 Q64 70 82 64" fill="none"/><line x1="28" y1="70" x2="20" y2="88"/><line x1="63" y1="70" x2="74" y2="88"/>`,
    grain: `<path d="M23 24 Q37 40 22 58 M29 20 Q44 43 29 66 M35 26 Q49 47 36 72" fill="none"/>`,
    scroll: `<path d="M53 26 h22 v28 h-22 z" fill="${spec.body}"/><line x1="57" y1="36" x2="70" y2="36"/><line x1="57" y1="44" x2="68" y2="44"/>`,
    fan: `<path d="M54 22 Q78 20 82 44 Q68 38 50 50 Z" fill="${spec.accent}" opacity=".8"/><line x1="54" y1="24" x2="50" y2="50"/><line x1="66" y1="24" x2="50" y2="50"/><line x1="78" y1="36" x2="50" y2="50"/>`,
    shield: `<path d="M55 24 Q78 28 74 53 Q68 70 55 76 Q42 70 36 53 Q34 28 55 24 Z" fill="${spec.accent}" opacity=".72"/>`,
    halberd: `<line x1="48" y1="10" x2="76" y2="82"/><path d="M42 12 Q66 15 54 35 L43 27 Z" fill="${spec.accent}"/>`,
    wall: `<path d="M16 62 h68 v22 h-68 z M20 48 h18 v14 h-18z M42 48 h18 v14 h-18z M64 48 h18 v14 h-18z" fill="${spec.accent}"/>`,
    shovel: `<line x1="30" y1="74" x2="70" y2="24"/><path d="M64 16 Q82 24 78 42 Q67 48 58 35 Z" fill="${spec.accent}"/><path d="M23 78 h18" fill="none"/>`,
    ambush: `<path d="M18 76 Q42 36 80 76"/><path d="M32 74 l8 -20 l8 20 M52 74 l8 -26 l8 26" fill="none"/>`,
    fire: `<path d="M50 78 Q25 60 43 39 Q48 28 46 17 Q70 38 61 52 Q76 48 78 68 Q70 86 50 78 Z" fill="${spec.accent}"/>`,
    cut: `<path d="M20 66 Q42 30 70 34"/><line x1="26" y1="28" x2="76" y2="78"/>`,
  }[weapon] || "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="12" fill="none"/>
    <path d="M15 84 Q48 95 82 83" fill="${spec.accent}" opacity=".18"/>
    <path d="M26 35 Q38 24 53 33 Q66 44 61 72 Q48 84 31 73 Q22 55 26 35 Z" fill="${spec.accent}" opacity=".22" stroke="${spec.stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M28 36 Q39 48 57 36 L62 69 Q48 78 30 68 Z" fill="${spec.body}" opacity=".88" stroke="${spec.stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 24 Q37 8 53 22 Q43 18 35 25 Z" fill="${spec.accent}" stroke="${spec.stroke}" stroke-width="3" stroke-linejoin="round"/>
    <g stroke="${spec.stroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
      ${extra}
      <circle cx="39" cy="25" r="10" fill="${spec.body}"/>
      <path d="M39 36 L39 58"/>
      <path d="M24 47 L55 45"/>
      <path d="M39 58 L25 82"/>
      <path d="M39 58 L56 82"/>
    </g>
    <path d="M17 86 Q46 91 80 84" stroke="${spec.accent}" stroke-width="6" stroke-linecap="round" opacity=".85" fill="none"/>
  </svg>`;
}

function createPlayer(id) {
  return {
    id,
    hearts: 4,
    food: 22,
    recruits: 0,
    camp: Array(CAMP_SLOTS).fill(null),
    units: [],
    enemies: [],
    land: new Set(initialLand[id]),
    recruitCooldown: 0,
  };
}

function createGame() {
  return {
    bottom: createPlayer("bottom"),
    wave: 1,
    waveTimer: 0,
    waveBanner: 2.6,
    spawn: { bottom: 0.9 },
    spawnBudget: { bottom: 5 },
    paused: false,
    speed: 1,
    time: 0,
    result: null,
    hintTimer: 14,
    hasRecruited: false,
    hasPlaced: false,
    morale: 20,
    selectedStrategy: null,
    strategyCooldowns: { ambush: 0, fire: 0, supplyCut: 0, fortify: 0 },
    effects: [],
    nextWaveDebuff: 0,
    bossSpawned: false,
    water: 3,
    maxWater: 3,
    encircleWarning: 0,
  };
}

function resetGame() {
  playSfx("start");
  nextUnitId = 1;
  particles = [];
  projectiles = [];
  popups = [];
  game = createGame();
  scene = "battle";
}

function computeLayout() {
  const headerH = Math.max(148, Math.min(164, H * 0.16));
  const panelH = Math.max(220, Math.min(288, H * 0.27));
  const availableBoardH = H - headerH - panelH - 10;
  CELL = Math.max(42, Math.min(W / 8, availableBoardH / 8));
  BOARD_X = (W - CELL * 8) / 2;
  BOARD_Y = headerH;
  PANEL_Y = BOARD_Y + CELL * 8 + 8;
  if (PANEL_Y + panelH > H) PANEL_Y = H - panelH;

  SLOT_GAP = Math.max(4, Math.min(10, W * 0.012));
  SLOT_X = Math.max(14, W * 0.035);
  SLOT_W = Math.min(76, (W - SLOT_X * 2 - SLOT_GAP * (CAMP_SLOTS - 1)) / CAMP_SLOTS);
  SLOT_H = Math.max(52, Math.min(64, (H - PANEL_Y) * 0.24));
  CAMP_Y = PANEL_Y + Math.max(30, (H - PANEL_Y) * 0.12);

  STRATEGY_Y = CAMP_Y + SLOT_H + Math.max(16, (H - PANEL_Y) * 0.06);
  STRATEGY_W = (W - SLOT_X * 2 - SLOT_GAP * 3) / 4;
  STRATEGY_H = Math.max(50, Math.min(62, (H - PANEL_Y) * 0.23));
  STRATEGY_RECTS = STRATEGIES.map((item, i) => ({
    key: item.key,
    x: SLOT_X + i * (STRATEGY_W + SLOT_GAP),
    y: STRATEGY_Y,
    w: STRATEGY_W,
    h: STRATEGY_H,
  }));

  const bottomY = H - Math.max(62, (H - PANEL_Y) * 0.24);
  RECRUIT = { x: SLOT_X, y: bottomY, w: Math.min(310, W * 0.48), h: H - bottomY - 14 };
  SPEED = { x: RECRUIT.x + RECRUIT.w + 14, y: bottomY, w: Math.min(92, W * 0.16), h: RECRUIT.h };
  EXIT_BUTTON = { x: W - 58, y: 18, w: 42, h: 42 };
  battlePaths = {
    main: [
    { x: BOARD_X - CELL * 0.85, y: BOARD_Y + CELL * 4.5 },
    { x: BOARD_X + CELL * 0.5, y: BOARD_Y + CELL * 4.5 },
    { x: BOARD_X + CELL * 7.5, y: BOARD_Y + CELL * 4.5 },
    { x: BOARD_X + CELL * 7.5, y: BOARD_Y + CELL * 7.5 },
    ],
    water: [
      { x: BOARD_X + CELL * 8.85, y: BOARD_Y + CELL * 1.4 },
      { x: BOARD_X + CELL * 6.4, y: BOARD_Y + CELL * 1.4 },
      { x: BOARD_X + CELL * 6.2, y: BOARD_Y + CELL * 2.7 },
      { x: BOARD_X + CELL * 4.4, y: BOARD_Y + CELL * 2.7 },
      { x: BOARD_X + CELL * 3.4, y: BOARD_Y + CELL * 3.7 },
    ],
    encircle: [
      { x: BOARD_X + CELL * 2.4, y: BOARD_Y - CELL * 0.85 },
      { x: BOARD_X + CELL * 2.4, y: BOARD_Y + CELL * 1.1 },
      { x: BOARD_X + CELL * 4.8, y: BOARD_Y + CELL * 1.6 },
      { x: BOARD_X + CELL * 6.6, y: BOARD_Y + CELL * 3.4 },
      { x: BOARD_X + CELL * 7.5, y: BOARD_Y + CELL * 7.5 },
    ],
  };
  bottomPath = battlePaths.main;
}

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  W = Math.max(360, rect.width || window.innerWidth || 576);
  H = Math.max(640, rect.height || window.innerHeight || 1024);
  computeLayout();
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(loop);

function loop(now) {
  const dtRaw = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;
  const dt = game.paused || scene !== "battle" ? 0 : dtRaw * game.speed;
  if (scene === "battle") updateBattle(dt);
  draw();
  requestAnimationFrame(loop);
}

function updateBattle(dt) {
  if (!dt) return;
  game.time += dt;
  game.waveTimer += dt;
  game.hintTimer = Math.max(0, game.hintTimer - dt);
  game.waveBanner = Math.max(0, game.waveBanner - dt);
  if (game.water <= 0) game.morale = Math.max(0, game.morale - dt * 3.2);
  game.bottom.recruitCooldown = Math.max(0, game.bottom.recruitCooldown - dt);
  for (const key of Object.keys(game.strategyCooldowns)) {
    game.strategyCooldowns[key] = Math.max(0, game.strategyCooldowns[key] - dt);
  }

  if (game.waveTimer >= 26 && game.wave < 7) {
    game.waveTimer = 0;
    game.wave += 1;
    game.spawnBudget.bottom += 3 + Math.floor(game.wave * 0.95);
    if (game.wave === 7) game.spawnBudget.bottom += 2;
    game.waveBanner = 2.2;
    popText(W / 2, BOARD_Y - 8, `魏军第${game.wave}阵`, "#fff5cf", 1.25);
  }

  updateStrategyEffects(game.bottom, dt);
  spawnEnemies(game.bottom, dt);
  updateEnemies(game.bottom, dt);
  updateUnits(game.bottom, dt);
  updateProjectiles(dt);
  updateVisualEffects(dt);
  checkResult();
}

function spawnEnemies(player, dt) {
  game.spawn[player.id] -= dt;
  if (game.spawn[player.id] > 0 || game.spawnBudget[player.id] <= 0) return;
  const gap = Math.max(1.25, 2.85 - game.wave * 0.2) + Math.random() * 0.65;
  game.spawn[player.id] = gap;
  game.spawnBudget[player.id] -= 1;
  player.enemies.push(createEnemy(player.id));
}

function createEnemy(targetId) {
  const route = chooseEnemyRoute();
  const path = battlePaths[route] || battlePaths.main;
  const tough = Math.max(0, game.wave - 1);
  let type = "weiSoldier";
  if (game.wave >= 7 && !game.bossSpawned) {
    type = "zhangHe";
    game.bossSpawned = true;
  } else {
    const roll = Math.random();
    const generalChance = game.wave >= 3 ? 0.06 + game.wave * 0.012 : 0.02;
    const riderChance = 0.14 + game.wave * 0.012;
    if (roll < generalChance) type = "weiGeneral";
    else if (roll < generalChance + riderChance) type = "weiRider";
  }
  const data = enemyData(type, tough);
  const debuffed = game.nextWaveDebuff > 0;
  const debuff = debuffed ? 0.82 : 1;
  if (debuffed) game.nextWaveDebuff -= 1;
  return {
    id: Math.random().toString(36).slice(2),
    targetId,
    route,
    objective: route === "water" ? "water" : "street",
    type,
    glyph: data.glyph,
    hp: Math.round(data.hp * debuff),
    maxHp: Math.round(data.hp * debuff),
    speed: data.speed * debuff,
    baseSpeed: data.speed * debuff,
    bounty: data.bounty,
    resist: data.resist,
    leakDamage: data.leakDamage,
    x: path[0].x,
    y: path[0].y,
    seg: 0,
    bleed: 0,
    slow: 0,
    guard: true,
  };
}

function chooseEnemyRoute() {
  if (game.wave >= 7 && !game.bossSpawned) return "encircle";
  const roll = Math.random();
  const waterChance = game.wave >= 2 ? Math.min(0.34, 0.12 + game.wave * 0.035) : 0;
  const encircleChance = game.wave >= 3 ? Math.min(0.28, 0.08 + game.wave * 0.028) : 0;
  if (roll < waterChance) return "water";
  if (roll < waterChance + encircleChance) return "encircle";
  return "main";
}

function enemyData(type, tough) {
  const table = {
    weiSoldier: { glyph: "卒", hp: 68 + tough * 18, speed: 25 + Math.min(13, game.wave * 1.45), bounty: 1, leakDamage: 1, resist: { fire: 0.9, ambush: 1, normal: 1 } },
    weiRider: { glyph: "骑", hp: 58 + tough * 16, speed: 36 + Math.min(18, game.wave * 1.9), bounty: 1, leakDamage: 1, resist: { fire: 1, ambush: 0.85, normal: 1 } },
    weiGeneral: { glyph: "将", hp: 132 + tough * 34, speed: 20 + Math.min(11, game.wave * 1.25), bounty: 2, leakDamage: 2, resist: { fire: 0.55, ambush: 0.7, normal: 0.95 } },
    zhangHe: { glyph: "郃", hp: 420, speed: 22, bounty: 5, leakDamage: 3, resist: { fire: 0.45, ambush: 0.55, normal: 0.9 } },
  };
  return table[type];
}

function updateEnemies(player, dt) {
  for (let i = player.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = player.enemies[i];
    const path = battlePaths[enemy.route] || battlePaths.main;
    enemy.bleed = Math.max(0, enemy.bleed - dt);
    enemy.slow = Math.max(0, enemy.slow - dt);
    const next = path[enemy.seg + 1];
    if (!next) {
      player.enemies.splice(i, 1);
      resolveEnemyBreakthrough(player, enemy);
      continue;
    }

    const dx = next.x - enemy.x;
    const dy = next.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    const slowFactor = enemy.slow > 0 ? 0.45 : 1;
    const step = enemy.speed * slowFactor * dt;
    if (dist <= step) {
      enemy.x = next.x;
      enemy.y = next.y;
      enemy.seg += 1;
      if (enemy.seg >= 1) enemy.guard = false;
    } else {
      enemy.x += (dx / dist) * step;
      enemy.y += (dy / dist) * step;
    }
  }
}

function resolveEnemyBreakthrough(player, enemy) {
  if (enemy.objective === "water") {
    game.water = Math.max(0, game.water - 1);
    game.morale = Math.max(0, game.morale - 24);
    const p = waterPoint();
    popText(p.x, p.y - 20, "水源被截", "#9fd8ff", 0.88);
    if (game.water <= 0) {
      player.hearts -= 1;
      popText(p.x, p.y + 16, "山上断水", "#ffb7a5", 0.95);
    }
  } else {
    player.hearts -= enemy.leakDamage;
    game.morale = Math.max(0, game.morale - 18);
    popText(W - 46, BOARD_Y + 7 * CELL, `-${enemy.leakDamage}`, "#ef4545", 1.35);
  }
  playSfx("leak");
}

function updateUnits(player, dt) {
  for (const unit of player.units) {
    if (drag?.unit?.id === unit.id) continue;
    unit.cooldown = Math.max(0, (unit.cooldown || 0) - dt);
    unit.produce = Math.max(0, (unit.produce || 0) - dt);

    if (unit.role === "farmer") {
      if (unit.produce <= 0) {
        unit.produce = Math.max(3, 5.6 - unit.level * 0.65);
        player.food += 1 + Math.floor((unit.level - 1) / 2);
        if (waterCells.has(`${unit.row}:${unit.col}`) || wangPingCells.has(`${unit.row}:${unit.col}`)) {
          game.water = Math.min(game.maxWater, game.water + 1);
          addMorale(4);
          const p = unitCenter(unit);
          popText(p.x + 20, p.y - 6, "汲水", "#c7eeff", 0.72);
        }
        addMorale(2);
        const p = unitCenter(unit);
        popText(p.x - 16, p.y - 24, "+粮", "#fff3d0", 0.82);
      }
      continue;
    }
    if (unit.kind === "char") continue;

    if (unit.cooldown <= 0) {
      const target = findTarget(player, unit);
      if (target) attackEnemy(player, unit, target);
    }
  }
}

function findTarget(player, unit) {
  const stats = unitStats(unit);
  const origin = unitCenter(unit);
  let best = null;
  let bestScore = Infinity;
  for (const enemy of player.enemies) {
    const dist = Math.hypot(enemy.x - origin.x, enemy.y - origin.y);
    if (dist > stats.range) continue;
    const laneBias = Math.abs(enemy.y - origin.y) * (unit.role === "archer" || unit.kind === "hero" ? 0.28 : 1);
    const bossBias = enemy.type === "zhangHe" ? -60 : 0;
    const score = dist + laneBias + bossBias;
    if (score < bestScore) {
      best = enemy;
      bestScore = score;
    }
  }
  return best;
}

function attackEnemy(player, unit, enemy) {
  const stats = unitStats(unit);
  unit.cooldown = stats.rate;
  const zone = zoneCombatBonus(unit, enemy);
  const damage = Math.round(stats.damage * zone.damage * (enemy.resist.normal || 1));
  if (zone.slow) enemy.slow = Math.max(enemy.slow, zone.slow);
  damageEnemy(player, enemy, damage, "normal");
  const from = unitCenter(unit);
  projectiles.push({
    x1: from.x,
    y1: from.y,
    x2: enemy.x,
    y2: enemy.y,
    life: unit.kind === "hero" ? 0.35 : 0.24,
    max: unit.kind === "hero" ? 0.35 : 0.24,
    kind: unit.role,
    color: unit.kind === "hero" ? unit.tone : "#1f1814",
    width: unit.kind === "hero" ? 9 : 4,
  });
  if (unit.kind === "hero") addRing(enemy.x, enemy.y, unit.tone, 0.45);
  playSfx(unit.kind === "hero" ? "heroHit" : "hit");
}

function zoneCombatBonus(unit, enemy) {
  const key = `${unit.row}:${unit.col}`;
  if (waterCells.has(key) && enemy.route === "water") {
    return { damage: 1.45, slow: 0.75 };
  }
  if (wangPingCells.has(key) && (enemy.route === "main" || enemy.route === "encircle")) {
    return { damage: 1.25, slow: 0.55 };
  }
  if (highGround.has(key) && enemy.route === "encircle" && (unit.role === "archer" || unit.kind === "hero")) {
    return { damage: 1.2, slow: 0 };
  }
  return { damage: 1, slow: 0 };
}

function damageEnemy(player, enemy, amount, source) {
  if (enemy.guard) amount = Math.max(1, Math.round(amount * 0.45));
  enemy.hp -= amount;
  enemy.bleed = 0.22;
  if (source !== "normal") {
    const label = source === "fire" ? "火" : "伏";
    popText(enemy.x, enemy.y - 28, `${label}-${amount}`, source === "fire" ? "#ffcf8a" : "#c6ffc9", 0.72);
  }
  if (enemy.hp <= 0) {
    const index = player.enemies.indexOf(enemy);
    if (index !== -1) player.enemies.splice(index, 1);
    player.food += enemy.bounty || 1;
    addMorale(enemy.type === "zhangHe" ? 28 : 7 + (enemy.bounty || 1) * 2);
    burst(enemy.x, enemy.y, enemy.type === "zhangHe" ? "#ffdf7b" : "#f7e2b5", enemy.type === "zhangHe" ? 18 : 9);
    popText(enemy.x, enemy.y - 22, `+${enemy.bounty || 1}`, "#fff8d6", 0.85);
    playSfx(enemy.type === "zhangHe" ? "bossDown" : "kill");
  }
}

function unitStats(unit) {
  const level = unit.level;
  if (unit.kind === "hero") {
    const heroStats = {
      strategy: { range: 270, damage: 38, rate: 0.92 },
      guard: { range: 230, damage: 44, rate: 0.96 },
      wisdom: { range: 310, damage: 34, rate: 0.78 },
    }[unit.special] || { range: 260, damage: 36, rate: 0.9 };
    return {
      range: heroStats.range + level * 20,
      damage: heroStats.damage + level * 16,
      rate: Math.max(0.48, heroStats.rate - level * 0.05),
    };
  }
  const table = {
    blade: { range: 98, damage: 28, rate: 0.92 },
    spear: { range: 184, damage: 19, rate: 0.82 },
    archer: { range: 344, damage: 14, rate: 1.02 },
    rider: { range: 150, damage: 23, rate: 0.62 },
    char: { range: 160, damage: 14, rate: 0.95 },
  };
  const base = table[unit.role] || table.blade;
  const terrainBonus = unit.row !== null && highGround.has(`${unit.row}:${unit.col}`) && (unit.role === "archer" || unit.kind === "hero") ? 1 : 0;
  return {
    range: base.range + level * 14 + terrainBonus * 42,
    damage: Math.round(base.damage * (1 + (level - 1) * 0.75 + terrainBonus * 0.18)),
    rate: Math.max(0.42, base.rate - (level - 1) * 0.06),
  };
}

function updateStrategyEffects(player, dt) {
  for (let i = game.effects.length - 1; i >= 0; i -= 1) {
    const effect = game.effects[i];
    effect.life -= dt;
    effect.tick -= dt;
    if (effect.tick <= 0) {
      effect.tick = effect.tickRate;
      if (effect.type === "fire") applyFireTick(player, effect);
      if (effect.type === "ambush") applyAmbushTick(player, effect);
    }
    if (effect.life <= 0) game.effects.splice(i, 1);
  }
}

function applyFireTick(player, effect) {
  for (const enemy of [...player.enemies]) {
    if (Math.abs(enemy.y - effect.y) <= 40 && enemy.x >= 12 && enemy.x <= W - 12) {
      const damage = Math.round(effect.damage * (enemy.resist.fire || 1));
      damageEnemy(player, enemy, damage, "fire");
      enemy.bleed = 0.34;
    }
  }
}

function applyAmbushTick(player, effect) {
  for (const enemy of [...player.enemies]) {
    const dist = Math.hypot(enemy.x - effect.x, enemy.y - effect.y);
    if (dist <= effect.radius) {
      enemy.slow = Math.max(enemy.slow, 1.4);
      const damage = Math.round(effect.damage * (enemy.resist.ambush || 1));
      damageEnemy(player, enemy, damage, "ambush");
    }
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    projectiles[i].life -= dt;
    if (projectiles[i].life <= 0) projectiles.splice(i, 1);
  }
}

function updateVisualEffects(dt) {
  for (let i = popups.length - 1; i >= 0; i -= 1) {
    const p = popups[i];
    p.life -= dt;
    p.y -= dt * 34;
    if (p.life <= 0) popups.splice(i, 1);
  }
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.age = (p.age || 0) + dt;
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function checkResult() {
  if (game.result) return;
  if (game.bottom.hearts <= 0) {
    game.result = "lost";
    scene = "over";
    playSfx("lose");
  } else if (game.wave >= 7 && game.spawnBudget.bottom <= 0 && game.bottom.enemies.length === 0 && !game.effects.some((e) => e.type === "pendingBoss")) {
    game.result = "won";
    scene = "over";
    playSfx("win");
  }
}

function recruitCost(player) {
  return Math.min(22, 8 + player.recruits * 2);
}

function recruitUnit(player) {
  if (player.recruitCooldown > 0) return false;
  const cost = recruitCost(player);
  if (player.food < cost) return false;
  player.food -= cost;
  player.recruits += 1;
  game.hasRecruited = true;
  game.hintTimer = 8;
  player.recruitCooldown = 1.8;
  player.camp = Array.from({ length: CAMP_SLOTS }, () => createUnit(weightedRandom(ALL_POOL), player.id));
  addMorale(3);
  popText(W / 2, RECRUIT.y - 8, "调兵x6", "#f8e7b0", 0.65);
  playSfx("recruit");
  return true;
}

function createUnit(label, owner) {
  const role = ROLE_BY_LABEL[label] || "char";
  return {
    id: nextUnitId++,
    owner,
    label,
    name: label,
    kind: role === "farmer" ? "farmer" : (TROOPS.includes(label) ? "troop" : "char"),
    role,
    svgKey: role,
    special: null,
    level: 1,
    row: null,
    col: null,
    width: 1,
    cooldown: Math.random() * 0.4,
    produce: 3 + Math.random() * 2,
    tone: "#2a211b",
  };
}

function weightedRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function tryUnlockLandAt(player, r, c) {
  const key = `${r}:${c}`;
  const exists = allLand[player.id].some(([rr, cc]) => rr === r && cc === c);
  if (!exists || player.land.has(key)) return false;
  player.land.add(key);
  const rect = cellRect(r, c);
  popText(rect.x + CELL / 2, rect.y + CELL / 2, "开垦", "#ffe19b", 0.9);
  addMorale(5);
  return true;
}

function tryUseShovelAt(cell) {
  if (!cell || game.strategyCooldowns.fortify > 0) return false;
  const rect = cellRect(cell.r, cell.c);
  const ok = tryUnlockLandAt(game.bottom, cell.r, cell.c);
  if (!ok) {
    popText(rect.x + CELL / 2, rect.y + CELL / 2, "不可开垦", "#ffb5a3", 0.72);
    return false;
  }
  game.strategyCooldowns.fortify = strategyByKey("fortify").cooldown;
  addRing(rect.x + CELL / 2, rect.y + CELL / 2, "#d8ad52", 0.82);
  burst(rect.x + CELL / 2, rect.y + CELL / 2, "#d8ad52", 10);
  playSfx("fortify");
  return true;
}

function placeUnit(player, unit, r, c) {
  unit.row = r;
  unit.col = c;
  unit.owner = player.id;
  player.units.push(unit);
}

function removeUnit(player, unit) {
  const index = player.units.findIndex((item) => item.id === unit.id);
  if (index !== -1) player.units.splice(index, 1);
}

function setCampUnit(player, index, unit) {
  player.camp[index] = unit || null;
  if (unit) {
    unit.row = null;
    unit.col = null;
    unit.owner = player.id;
  }
}

function mergeIntoUnit(target, source, x, y) {
  target.level += 1;
  target.cooldown = 0.1;
  game.hasPlaced = true;
  game.hintTimer = 6;
  addMorale(8);
  popText(x, y, `Lv.${target.level}`, "#fff7bb", 0.8);
  addRing(x, y + 18, "#ffe48d", 0.65);
  playSfx("merge");
  return true;
}

function tryDropUnitToCamp(player, unit, targetIndex, source) {
  if (!unit || targetIndex < 0 || targetIndex >= CAMP_SLOTS) return false;
  if (source?.type === "camp" && source.index === targetIndex) return false;
  const target = player.camp[targetIndex];
  const slotCenter = campSlotCenter(targetIndex);

  if (target && canMerge(unit, target)) {
    if (source?.type === "camp") setCampUnit(player, source.index, null);
    if (source?.type === "board") removeUnit(player, source.unit);
    mergeIntoUnit(target, unit, slotCenter.x, slotCenter.y - 12);
    return true;
  }

  if (source?.type === "camp") {
    setCampUnit(player, source.index, target || null);
    setCampUnit(player, targetIndex, unit);
    popText(slotCenter.x, slotCenter.y - 12, target ? "交换" : "入营", "#fff0b8", 0.72);
    playSfx("select");
    return true;
  }

  if (source?.type === "board") {
    const row = source.unit.row;
    const col = source.unit.col;
    removeUnit(player, source.unit);
    setCampUnit(player, targetIndex, unit);
    if (target) {
      const canPlaceTarget = canFitUnit(player, target, row, col);
      if (!canPlaceTarget) {
        setCampUnit(player, targetIndex, target);
        placeUnit(player, source.unit, row, col);
        return false;
      }
      placeUnit(player, target, row, col);
      game.hasPlaced = true;
      popText(slotCenter.x, slotCenter.y - 12, "互换", "#fff0b8", 0.72);
    } else {
      popText(slotCenter.x, slotCenter.y - 12, "收回", "#fff0b8", 0.72);
    }
    playSfx("select");
    scanHeroCombos(player);
    return true;
  }

  return false;
}

function tryDropUnit(player, unit, r, c, source) {
  if (!unit || !Number.isFinite(r) || !Number.isFinite(c)) return false;
  const occupant = unitAt(player, r, c, source?.unit?.id);
  if (occupant && canMerge(unit, occupant)) {
    if (source?.type === "camp") setCampUnit(player, source.index, null);
    if (source?.type === "board") removeUnit(player, source.unit);
    const rect = cellRect(occupant.row, occupant.col);
    mergeIntoUnit(occupant, unit, rect.x + CELL / 2, rect.y + 20);
    scanHeroCombos(player);
    return true;
  }
  if (occupant && source?.type === "camp" && canFitUnit(player, unit, r, c, occupant.id)) {
    setCampUnit(player, source.index, occupant);
    removeUnit(player, occupant);
    placeUnit(player, unit, r, c);
    game.hasPlaced = true;
    game.hintTimer = 6;
    popText(cellRect(r, c).x + CELL / 2, cellRect(r, c).y + 22, "互换", "#fff0b8", 0.72);
    playSfx("select");
    scanHeroCombos(player);
    return true;
  }
  if (!canFitUnit(player, unit, r, c, source?.unit?.id)) return false;
  if (source?.type === "camp") setCampUnit(player, source.index, null);
  if (source?.type === "board") removeUnit(player, source.unit);
  placeUnit(player, unit, r, c);
  game.hasPlaced = true;
  game.hintTimer = 6;
  scanHeroCombos(player);
  return true;
}

function canMerge(a, b) {
  if (!a || !b || a.id === b.id || a.level !== b.level) return false;
  if (a.kind === "hero" && b.kind === "hero") return a.name === b.name;
  if (a.kind !== b.kind) return false;
  return a.label === b.label;
}

function canFitUnit(player, unit, r, c, ignoreId = null) {
  for (let offset = 0; offset < (unit.width || 1); offset += 1) {
    const cc = c + offset;
    if (!isOpenLand(player, r, cc)) return false;
    if (unitAt(player, r, cc, ignoreId)) return false;
  }
  return true;
}

function isOpenLand(player, r, c) {
  return c >= 0 && c < 8 && r >= 0 && r < BOARD_ROWS && player.land.has(`${r}:${c}`);
}

function unitAt(player, r, c, ignoreId = null) {
  return player.units.find((unit) => {
    if (unit.id === ignoreId) return false;
    if (unit.row !== r) return false;
    return c >= unit.col && c < unit.col + (unit.width || 1);
  }) || null;
}

function scanHeroCombos(player) {
  for (const pair of HERO_PAIRS) {
    const [a, b] = pair.chars;
    for (const unit of [...player.units]) {
      if (unit.kind !== "char" || ![a, b].includes(unit.label)) continue;
      const right = unitAt(player, unit.row, unit.col + 1);
      if (
        right &&
        right.kind === "char" &&
        right.level === unit.level &&
        ((unit.label === a && right.label === b) || (unit.label === b && right.label === a))
      ) {
        const row = unit.row;
        const col = Math.min(unit.col, right.col);
        const level = unit.level;
        removeUnit(player, unit);
        removeUnit(player, right);
        const hero = createUnit(pair.name, player.id);
        hero.kind = "hero";
        hero.role = "hero";
        hero.label = pair.name;
        hero.name = pair.name;
        hero.level = level;
        hero.width = 2;
        hero.special = pair.special;
        hero.tone = pair.tone;
        hero.svgKey = pair.name === "马谡" ? "heroMasu" : (pair.name === "王平" ? "heroWangping" : "heroZhuge");
        placeUnit(player, hero, row, col);
        const rect = cellRect(row, col);
        addMorale(20);
        addRing(rect.x + CELL, rect.y + CELL / 2, pair.tone, 1.1);
        burst(rect.x + CELL, rect.y + CELL / 2, pair.tone, 18);
        popText(rect.x + CELL, rect.y + 24, `${pair.name}出阵`, "#ffe4a3", 1);
        playSfx("hero");
        return true;
      }
    }
  }
  return false;
}

function selectStrategy(key) {
  if (game.strategyCooldowns[key] > 0) return false;
  game.selectedStrategy = game.selectedStrategy === key ? null : key;
  popText(W / 2, STRATEGY_Y - 8, game.selectedStrategy ? `选择${strategyByKey(key).name}` : "取消计谋", "#fff3bf", 0.68);
  playSfx("select");
  return true;
}

function applySelectedStrategyAt(cell) {
  if (!game.selectedStrategy || !cell) return false;
  const key = game.selectedStrategy;
  const rect = cellRect(cell.r, cell.c);
  const center = { x: rect.x + CELL / 2, y: rect.y + CELL / 2 };
  const boosted = game.morale >= MAX_MORALE;
  let ok = false;

  if (key === "fortify") {
    ok = tryUnlockLandAt(game.bottom, cell.r, cell.c);
  } else if (key === "fire") {
    ok = pointNearPath(center.x, center.y, 70);
    if (ok) {
      game.effects.push({ type: "fire", x: center.x, y: center.y, life: boosted ? 5.4 : 3.8, tick: 0, tickRate: 0.7, damage: boosted ? 26 : 18, boosted });
      addRing(center.x, center.y, "#f36b2d", boosted ? 1 : 0.72);
      popText(center.x, center.y - 16, boosted ? "士气火攻" : "火攻", "#ffd19a", 0.86);
    }
  } else if (key === "ambush") {
    ok = pointNearPath(center.x, center.y, 62);
    if (ok) {
      game.effects.push({ type: "ambush", x: center.x, y: center.y, radius: boosted ? 116 : 88, life: boosted ? 5.2 : 3.8, tick: 0, tickRate: 0.8, damage: boosted ? 20 : 13, boosted });
      addRing(center.x, center.y, "#6ab66a", boosted ? 1 : 0.72);
      popText(center.x, center.y - 16, boosted ? "士气伏兵" : "伏兵", "#d7ffd4", 0.86);
    }
  } else if (key === "supplyCut") {
    ok = true;
    game.nextWaveDebuff = boosted ? 6 : 4;
    game.bottom.enemies.forEach((enemy) => {
      enemy.speed *= boosted ? 0.78 : 0.86;
      enemy.hp = Math.max(1, Math.round(enemy.hp * (boosted ? 0.88 : 0.93)));
    });
    popText(W / 2, BOARD_Y + 92, boosted ? "士气断粮:魏军大乱" : "断粮:魏军迟滞", "#f3e0b8", 0.9);
    addRing(W / 2, BOARD_Y + 92, "#c2ad7d", 1);
  }

  if (!ok) {
    popText(center.x, center.y - 14, "位置无效", "#ffb5a3", 0.72);
    return false;
  }
  game.strategyCooldowns[key] = strategyByKey(key).cooldown;
  if (boosted) game.morale = 0;
  game.selectedStrategy = null;
  playSfx(key);
  return true;
}

function strategyByKey(key) {
  return STRATEGIES.find((item) => item.key === key);
}

function addMorale(amount) {
  game.morale = Math.max(0, Math.min(MAX_MORALE, game.morale + amount));
}

function unitCenter(unit) {
  const rect = cellRect(unit.row, unit.col);
  return { x: rect.x + CELL * (unit.width || 1) / 2, y: rect.y + CELL / 2 };
}

function cellRect(r, c) {
  return { x: BOARD_X + c * CELL, y: BOARD_Y + r * CELL, w: CELL, h: CELL };
}

function pointToCell(x, y) {
  if (y < BOARD_Y || y > BOARD_Y + BOARD_ROWS * CELL || x < BOARD_X || x > BOARD_X + CELL * 8) return null;
  return { c: Math.floor((x - BOARD_X) / CELL), r: Math.floor((y - BOARD_Y) / CELL) };
}

function pointNearPath(x, y, threshold) {
  for (const path of Object.values(battlePaths)) {
    for (let i = 0; i < path.length - 1; i += 1) {
      if (distanceToSegment(x, y, path[i], path[i + 1]) <= threshold) return true;
    }
  }
  return false;
}

function distanceToSegment(x, y, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  return Math.hypot(x - px, y - py);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  if (scene === "menu") drawMenu();
  if (scene === "battle") drawBattle();
  if (scene === "over") {
    drawBattle();
    drawResult();
  }
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#251711");
  bg.addColorStop(0.38, "#d8c7af");
  bg.addColorStop(1, "#1a120e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#19110d";
  ctx.lineWidth = Math.max(2, W * 0.003);
  for (let i = 0; i < 8; i += 1) {
    const y = 52 + i * Math.max(76, H * 0.09);
    ctx.beginPath();
    ctx.moveTo(-60, y);
    for (let x = -50; x <= W + 80; x += Math.max(78, W * 0.12)) {
      ctx.quadraticCurveTo(x + 38, y - 30 + Math.sin(i + x) * 12, x + 86, y + Math.cos(i) * 14);
    }
    ctx.stroke();
  }
  drawBackdropMountains();
  ctx.restore();
}

function drawBackdropMountains() {
  const top = BOARD_Y - 12;
  const bottom = PANEL_Y + 10;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#16251f";
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  ctx.lineTo(0, top + CELL * 1.2);
  ctx.lineTo(Math.max(40, BOARD_X - CELL * 0.8), top + CELL * 3.1);
  ctx.lineTo(Math.max(70, BOARD_X - CELL * 0.2), bottom);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, bottom);
  ctx.lineTo(W, top + CELL * 1.6);
  ctx.lineTo(Math.min(W - 40, BOARD_X + CELL * 8.8), top + CELL * 3.4);
  ctx.lineTo(Math.min(W - 70, BOARD_X + CELL * 8.15), bottom);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMenu() {
  drawMenuScene();
  const titleY = H * 0.24;
  const startRect = menuStartRect();
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `${Math.max(46, Math.min(72, W * 0.11))}px KaiTi, STKaiti, serif`;
  strokeText("街亭之战", W / 2, titleY, "#c0362b", "rgba(255,247,219,.9)", 8);
  ctx.font = `${Math.max(20, Math.min(28, W * 0.04))}px Microsoft YaHei, sans-serif`;
  strokeText("火柴人计谋塔防", W / 2, titleY + 56, "#f1d67a", "#17130f", 5);
  drawMenuRules(titleY + 88);
  drawButton(startRect.x, startRect.y, startRect.w, startRect.h, "#b9483e", "#642b25");
  ctx.font = `${Math.max(28, Math.min(38, W * 0.055))}px Microsoft YaHei, sans-serif`;
  strokeText("守卫街亭", W / 2, startRect.y + startRect.h * 0.65, "#ffffff", "#15110f", 5);
  ctx.font = "21px Microsoft YaHei, sans-serif";
  strokeText("调兵布阵  合将出计  山道伏魏", W / 2, startRect.y + startRect.h + 34, "#f4dfb7", "#22120d", 3);
  ctx.restore();
}

function drawMenuRules(y) {
  const w = Math.min(520, W * 0.86);
  const h = 116;
  const x = W / 2 - w / 2;
  ctx.save();
  ctx.fillStyle = "rgba(35, 20, 13, .78)";
  ctx.strokeStyle = "rgba(255, 226, 154, .75)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "18px Microsoft YaHei, sans-serif";
  const lines = [
    "玩法说明",
    "1 兵营里的两个同级同兵可拖拽合成",
    "2 地图单位可拖回兵营，兵营格之间可交换",
    "3 兵营单位拖到地图已有单位，可替换回兵营",
    "4 铲子闪烁时拖到地图，可开垦新阵地",
  ];
  strokeText(lines[0], x + 18, y + 28, "#ffe39a", "#120806", 3);
  ctx.font = "15px Microsoft YaHei, sans-serif";
  for (let i = 1; i < lines.length; i += 1) {
    strokeText(lines[i], x + 18, y + 30 + i * 20, "#fff5d8", "#120806", 3);
  }
  ctx.restore();
}

function menuStartRect() {
  const btnW = Math.min(380, W * 0.68);
  const btnH = Math.max(70, Math.min(90, H * 0.09));
  return { x: W / 2 - btnW / 2, y: H * 0.68, w: btnW, h: btnH };
}

function drawMenuScene() {
  ctx.save();
  drawBanner(W * 0.16, H * 0.42, "#a2322a", "蜀");
  drawBanner(W * 0.84, H * 0.41, "#553531", "魏");
  drawPathStroke(bottomPath, "rgba(118, 99, 82, .36)", 54);
  drawSvgAsset("heroWangping", W * 0.33 - 38, H * 0.52, 76, 76);
  drawSvgAsset("spear", W * 0.43 - 32, H * 0.55, 64, 64);
  drawSvgAsset("weiRider", W * 0.64 - 36, H * 0.50, 72, 72);
  drawSvgAsset("weiSoldier", W * 0.75 - 32, H * 0.54, 64, 64);
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#2f3b32";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.64);
  ctx.lineTo(W * 0.24, H * 0.49);
  ctx.lineTo(W * 0.47, H * 0.64);
  ctx.lineTo(W * 0.7, H * 0.46);
  ctx.lineTo(W, H * 0.64);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBattle() {
  drawBattleHeader();
  drawBoard();
  drawStrategyEffects();
  drawTargets();
  drawEnemies(game.bottom);
  drawUnits(game.bottom);
  drawProjectiles();
  drawParticles();
  drawBottomPanel();
  drawDrag();
  drawPopups();
  if (game.waveBanner > 0) drawWaveBanner();
  if (game.hintTimer > 0) drawHint();
  if (game.paused) drawPauseOverlay();
}

function drawBattleHeader() {
  ctx.save();
  ctx.fillStyle = "rgba(36, 22, 15, .92)";
  ctx.fillRect(0, 0, W, BOARD_Y - 4);
  ctx.strokeStyle = "rgba(238, 203, 134, .45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, BOARD_Y - 5);
  ctx.lineTo(W, BOARD_Y - 5);
  ctx.stroke();
  drawPauseButton(34, 38);
  ctx.textAlign = "center";
  ctx.font = `${Math.max(26, Math.min(34, W * 0.055))}px KaiTi, STKaiti, serif`;
  strokeText("街亭", W / 2, 38, "#ffe3a3", "#120806", 4);
  ctx.font = "18px Microsoft YaHei, sans-serif";
  strokeText(`魏军第${game.wave}阵`, W / 2, 64, "#fff7d4", "#120806", 3);
  const chipY = 78;
  const margin = Math.max(12, W * 0.025);
  const gap = 8;
  const compact = W < 560;
  const chipW = compact ? (W - margin * 2 - gap * 2) / 3 : Math.min(112, (W - margin * 2 - gap * 2) / 3);
  drawResourceChip(margin, chipY, chipW, "粮", Math.floor(game.bottom.food), "#d9a949");
  drawResourceChip(margin + chipW + gap, chipY, chipW, "水", `${game.water}/${game.maxWater}`, game.water <= 0 ? "#d35d4d" : "#4d9bbb");
  drawResourceChip(margin + (chipW + gap) * 2, chipY, chipW, "命", game.bottom.hearts, "#c94b45");
  if (compact) {
    drawMoraleBar(margin, 116, W - margin * 2 - 58, 20);
  } else {
    drawMoraleBar(margin + (chipW + gap) * 3 + gap, 82, W - (margin + (chipW + gap) * 3 + gap) - 70, 24);
  }
  drawExitButton();
  ctx.restore();
}

function drawResourceChip(x, y, w, label, value, color) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 239, 199, .12)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, 34, 10);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "14px Microsoft YaHei, sans-serif";
  strokeText(label, x + 18, y + 22, "#fff0c8", "#100704", 2);
  ctx.font = "18px Microsoft YaHei, sans-serif";
  strokeText(String(value), x + w * 0.62, y + 23, "#fff8dc", "#100704", 3);
  ctx.restore();
}

function drawMoraleBar(x, y, w, h) {
  ctx.save();
  drawInkPanel(x, y, w, h);
  const pct = game.morale / MAX_MORALE;
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, "#3ca56d");
  g.addColorStop(1, game.morale >= MAX_MORALE ? "#ffd84d" : "#79c5da");
  ctx.fillStyle = g;
  roundRect(ctx, x + 4, y + 4, (w - 8) * pct, h - 8, 10);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.font = "16px Microsoft YaHei, sans-serif";
  strokeText(game.morale >= MAX_MORALE ? "士气满" : "士气", x + w / 2, y + 19, "#fffbe5", "#1b130e", 3);
  ctx.restore();
}

function drawBoard() {
  ctx.save();
  ctx.fillStyle = "#cabbab";
  ctx.fillRect(0, BOARD_Y, W, PANEL_Y - BOARD_Y);
  drawMapInnovation();
  drawLand(game.bottom);
  drawRoad();
  ctx.strokeStyle = "rgba(56, 45, 39, .54)";
  ctx.lineWidth = 2;
  for (let c = 0; c <= 8; c += 1) {
    const x = BOARD_X + c * CELL;
    ctx.beginPath();
    ctx.moveTo(x, BOARD_Y);
    ctx.lineTo(x, BOARD_Y + BOARD_ROWS * CELL);
    ctx.stroke();
  }
  for (let r = 0; r <= BOARD_ROWS; r += 1) {
    const y = BOARD_Y + r * CELL;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#211a18";
  ctx.lineWidth = 4;
  ctx.strokeRect(BOARD_X, BOARD_Y, CELL * 8, BOARD_ROWS * CELL);
  drawStrategicOverlays();
  ctx.restore();
}

function drawMapInnovation() {
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#315647";
  for (const key of highGround) {
    const [r, c] = key.split(":").map(Number);
    const rect = cellRect(r, c);
    ctx.beginPath();
    ctx.moveTo(rect.x + CELL * 0.1, rect.y + CELL * 0.82);
    ctx.lineTo(rect.x + CELL * 0.42, rect.y + CELL * 0.26);
    ctx.lineTo(rect.x + CELL * 0.74, rect.y + CELL * 0.82);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.55;
  drawBanner(Math.max(34, BOARD_X - CELL * 0.55), BOARD_Y + CELL * 1.1, "#9d2c25", "蜀");
  drawBanner(Math.min(W - 78, BOARD_X + CELL * 8.35), BOARD_Y + CELL * 1.3, "#553531", "魏");
  ctx.restore();
}

function drawStrategicOverlays() {
  ctx.save();
  drawStrategicPoint(BOARD_X + CELL * 3.5, BOARD_Y + CELL * 2.15, "马谡山寨", "#b9892b");
  const wp = wangCampPoint();
  drawStrategicPoint(wp.x, wp.y, "王平营", "#2f766c");
  const water = waterPoint();
  drawStrategicPoint(water.x, water.y, `汲水 ${game.water}/${game.maxWater}`, "#3d91b3");
  ctx.restore();
}

function drawRoad() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawRoute("main", battlePaths.main, 52);
  drawRoute("water", battlePaths.water, 42);
  drawRoute("encircle", battlePaths.encircle, 42);
  ctx.restore();
}

function drawRoute(key, path, width) {
  const meta = ROUTE_META[key];
  drawPathStroke(path, meta.glow, width + 16);
  drawPathStroke(path, meta.color, width);
  drawPathStroke(path, meta.line, 5);
  ctx.save();
  ctx.setLineDash([12, 10]);
  drawPathStroke(path, "rgba(255, 248, 220, .46)", 3);
  ctx.setLineDash([]);
  ctx.restore();
  drawRouteArrows(path, meta.color);
  drawRouteLabel(key, path);
}

function drawRouteArrows(path, color) {
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i];
    const b = path[i + 1];
    const x = lerp(a.x, b.x, 0.58);
    const y = lerp(a.y, b.y, 0.58);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#24140e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawRouteLabel(key, path) {
  const meta = ROUTE_META[key];
  const p = path[0];
  const x = Math.max(14, Math.min(W - 72, p.x + (key === "water" ? -76 : 18)));
  const y = Math.max(BOARD_Y + 10, Math.min(PANEL_Y - 36, p.y - 18));
  ctx.save();
  ctx.fillStyle = meta.line;
  ctx.strokeStyle = "#f5e6c4";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 58, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "16px Microsoft YaHei, sans-serif";
  strokeText(meta.name, x + 29, y + 20, "#fff4d0", "#1d100b", 3);
  ctx.restore();
}

function drawStrategicPoint(x, y, text, color) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255, 247, 222, .88)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(10, CELL * 0.15), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(5, CELL * 0.075), 0, Math.PI * 2);
  ctx.fill();
  const labelW = Math.max(74, Math.min(116, text.length * 14));
  const labelX = Math.max(8, Math.min(W - labelW - 8, x - labelW / 2));
  const labelY = y < BOARD_Y + CELL * 3 ? y - 34 : y + 18;
  ctx.fillStyle = "rgba(36, 22, 15, .82)";
  ctx.strokeStyle = "rgba(255, 237, 190, .74)";
  ctx.lineWidth = 2;
  roundRect(ctx, labelX, labelY, labelW, 24, 7);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = `${Math.max(12, Math.min(15, CELL * 0.18))}px Microsoft YaHei, sans-serif`;
  strokeText(text, labelX + labelW / 2, labelY + 17, "#fff8dc", "#21140e", 3);
  ctx.restore();
}

function waterPoint() {
  return { x: BOARD_X + CELL * 6.45, y: BOARD_Y + CELL * 2.45 };
}

function wangCampPoint() {
  return { x: BOARD_X + CELL * 2.55, y: BOARD_Y + CELL * 5.65 };
}

function drawPathStroke(path, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
}

function drawLand(player) {
  for (const [r, c] of allLand[player.id]) {
    const rect = cellRect(r, c);
    const open = player.land.has(`${r}:${c}`);
    const key = `${r}:${c}`;
    if (waterCells.has(key)) ctx.fillStyle = open ? "#d9f4ff" : "#6ca6b6";
    else if (wangPingCells.has(key)) ctx.fillStyle = open ? "#e2f4e9" : "#6da083";
    else if (highGround.has(key)) ctx.fillStyle = open ? "#f4ead2" : "#8fa878";
    else ctx.fillStyle = open ? "#f6f2e9" : "#7ba89d";
    ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
    ctx.strokeStyle = waterCells.has(key)
      ? "rgba(43, 113, 139, .58)"
      : (wangPingCells.has(key) ? "rgba(31, 112, 88, .56)" : (open ? "rgba(112, 94, 75, .46)" : "rgba(22, 84, 78, .52)"));
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
    if (open) drawLandRoleMark(rect, key);
    if (!open) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#174941";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(rect.x + 18, rect.y + 48);
      ctx.lineTo(rect.x + 34, rect.y + 30);
      ctx.lineTo(rect.x + 52, rect.y + 48);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawLandRoleMark(rect, key) {
  let mark = "";
  let color = "";
  if (waterCells.has(key)) {
    mark = "水";
    color = "#2f83a2";
  } else if (wangPingCells.has(key)) {
    mark = "援";
    color = "#2f766c";
  } else if (highGround.has(key)) {
    mark = "山";
    color = "#7f6229";
  }
  if (!mark) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  roundRect(ctx, rect.x + rect.w - 25, rect.y + 7, 18, 18, 5);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.font = "13px Microsoft YaHei, sans-serif";
  strokeText(mark, rect.x + rect.w - 16, rect.y + 21, "#fff8df", "#1b0d08", 2);
  ctx.restore();
}

function drawTargets() {
  const x = BOARD_X + CELL * 7.5;
  const y = BOARD_Y + CELL * 7.5 - 18;
  ctx.save();
  drawFort(x, y + 38, 0.82);
  ctx.font = "50px KaiTi, STKaiti, serif";
  ctx.textAlign = "center";
  strokeText("亭", x, y + 22, "#11100f", "#f3d091", 3);
  ctx.restore();
}

function drawEnemies(player) {
  for (const enemy of player.enemies) {
    const size = enemy.type === "zhangHe" ? 74 : (enemy.type === "weiGeneral" ? 66 : 56);
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const hp = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = "#2f2d2b";
    roundRect(ctx, -22, -46, 44, 8, 3);
    ctx.fill();
    ctx.fillStyle = enemy.bleed > 0 ? "#ff6666" : "#c83936";
    roundRect(ctx, -21, -45, 42 * hp, 6, 3);
    ctx.fill();
    drawEnemyRouteMarker(enemy, size);
    drawSvgAsset(enemy.type, -size / 2, -size / 2 + 4, size, size);
    if (enemy.slow > 0) {
      ctx.strokeStyle = "rgba(105, 190, 120, .8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 4, size * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (enemy.guard) {
      ctx.strokeStyle = "rgba(255, 232, 141, .92)";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 5, size * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "13px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      strokeText("阵", 0, -31, "#fff2a6", "#3c2712", 3);
    }
    if (enemy.type === "zhangHe") {
      ctx.font = "16px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      strokeText("张郃", 0, -50, "#ffe6c0", "#37120d", 3);
    }
    ctx.restore();
  }
}

function drawEnemyRouteMarker(enemy, size) {
  const meta = ROUTE_META[enemy.route] || ROUTE_META.main;
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = meta.color;
  ctx.strokeStyle = meta.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.32, size * 0.34, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawUnits(player) {
  for (const unit of player.units) {
    if (drag?.unit?.id === unit.id) continue;
    drawUnitCard(unit, cellRect(unit.row, unit.col), false);
  }
}

function drawUnitCard(unit, rect, isDrag) {
  const width = rect.w && rect.w !== CELL ? rect.w : CELL * (unit.width || 1);
  const height = rect.h && rect.h !== CELL ? rect.h : CELL;
  ctx.save();
  ctx.translate(rect.x, rect.y);
  const hero = unit.kind === "hero";
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, hero ? "#f7d98a" : "#e5c99c");
  g.addColorStop(1, hero ? "#8d5524" : "#9b7650");
  ctx.fillStyle = g;
  ctx.strokeStyle = hero ? "#2b130b" : "#3a2115";
  ctx.lineWidth = hero ? 4 : 3;
  roundRect(ctx, 6, 6, width - 12, height - 12, 8);
  ctx.fill();
  ctx.stroke();
  if (hero) {
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = unit.tone;
    roundRect(ctx, 12, 12, width - 24, height - 24, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const meta = unit.kind === "hero" ? ROLE_META.hero : (ROLE_META[unit.role] || ROLE_META.char);
  ctx.fillStyle = meta.color;
  ctx.globalAlpha = 0.92;
  roundRect(ctx, 12, 12, Math.min(42, width * 0.32), 24, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = "16px Microsoft YaHei, sans-serif";
  strokeText(unit.kind === "char" ? unit.label : meta.code, 33, 30, "#fff8df", "#1b0d08", 3);
  const artSize = Math.min(58, height - 18);
  drawSvgAsset(unit.svgKey, width / 2 - artSize / 2 + 5, 8, artSize, artSize);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(35, 17, 10, .82)";
  roundRect(ctx, 12, height - 25, width - 24, 18, 6);
  ctx.fill();
  ctx.font = hero ? "17px Microsoft YaHei, sans-serif" : "13px Microsoft YaHei, sans-serif";
  strokeText(unitShortName(unit), width / 2, height - 11, "#fff5d8", "#160904", 2);
  ctx.fillStyle = "#2a140c";
  ctx.beginPath();
  ctx.arc(width - 18, 20, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "14px Microsoft YaHei, sans-serif";
  strokeText(String(unit.level), width - 18, 25, "#ffe9a6", "#160904", 2);
  if (isDrag) {
    ctx.strokeStyle = "#f5c24a";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, width - 12, height - 12);
  }
  ctx.restore();
}

function unitShortName(unit) {
  if (unit.kind === "hero") return unit.name;
  if (unit.kind === "char") return `印 ${unit.label}`;
  return ROLE_META[unit.role]?.title || unit.name;
}

function drawStrategyEffects() {
  for (const effect of game.effects) {
    ctx.save();
    const alpha = Math.min(1, effect.life / 1.4);
    if (effect.type === "fire") {
      ctx.globalAlpha = 0.42 * alpha;
      const g = ctx.createLinearGradient(0, effect.y - 40, 0, effect.y + 40);
      g.addColorStop(0, "rgba(255, 194, 86, 0)");
      g.addColorStop(0.5, effect.boosted ? "rgba(255, 74, 31, .9)" : "rgba(222, 93, 42, .76)");
      g.addColorStop(1, "rgba(255, 194, 86, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, effect.y - 42, W, 84);
    }
    if (effect.type === "ambush") {
      ctx.globalAlpha = 0.32 * alpha;
      ctx.fillStyle = effect.boosted ? "#9dff96" : "#4d8e52";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      drawSvgAsset("ambushIcon", effect.x - 30, effect.y - 30, 60, 60);
    }
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    const t = 1 - p.life / p.max;
    const mx = lerp(p.x1, p.x2, t);
    const my = lerp(p.y1, p.y2, t);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * 0.35);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.width || 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(mx, my);
    ctx.stroke();
    if (p.kind === "archer") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 12, my - 5);
      ctx.lineTo(mx - 8, my + 7);
      ctx.closePath();
      ctx.fill();
    }
    if (p.kind === "rider" || p.kind === "spear") {
      ctx.globalAlpha *= 0.35;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(p.x1 - 8, p.y1 + 8);
      ctx.lineTo(mx, my);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    const alpha = Math.max(0, Math.min(1, p.life));
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.color;
    ctx.fillStyle = p.color;
    if (p.kind === "ring") {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.age || 0) * 95 * p.scale, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBottomPanel() {
  ctx.save();
  ctx.fillStyle = "#eee3d1";
  ctx.fillRect(0, PANEL_Y, W, H - PANEL_Y);
  ctx.strokeStyle = "rgba(71, 50, 35, .32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, PANEL_Y);
  ctx.lineTo(W, PANEL_Y);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "18px Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#4a3426";
  ctx.fillText("兵营", SLOT_X, CAMP_Y - 10);
  for (let i = 0; i < CAMP_SLOTS; i += 1) {
    const x = SLOT_X + i * (SLOT_W + SLOT_GAP);
    drawSlot(x, CAMP_Y, SLOT_W, SLOT_H, game.bottom.camp[i]);
  }
  drawStrategyButtons();
  drawRecruitButton();
  drawSpeedButton();
  ctx.restore();
}

function drawSlot(x, y, w, h, unit) {
  ctx.save();
  ctx.fillStyle = "#f8f4e9";
  ctx.strokeStyle = "#8c8272";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();
  if (unit) drawUnitCard(unit, { x: x - 2, y: y - 8, w, h }, false);
  ctx.restore();
}

function drawStrategyButtons() {
  for (const rect of STRATEGY_RECTS) {
    const item = strategyByKey(rect.key);
    const cd = game.strategyCooldowns[rect.key];
    const ready = cd <= 0;
    const selected = game.selectedStrategy === rect.key;
    drawCommandTile(rect, item, ready, selected, cd);
  }
}

function drawCommandTile(rect, item, ready, selected, cd) {
  const isShovel = rect.key === "fortify";
  const icon = rect.key === "ambush" ? "ambushIcon" : (rect.key === "fire" ? "fireIcon" : (rect.key === "supplyCut" ? "supplyIcon" : "shovel"));
  const pulse = isShovel && ready ? 0.5 + Math.sin(performance.now() / 190) * 0.5 : 0;
  ctx.save();
  ctx.fillStyle = selected ? "#f2c94c" : (ready ? "#352016" : "#7c7163");
  ctx.strokeStyle = selected ? "#6b3d12" : item.color;
  ctx.lineWidth = selected ? 4 : 3;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.stroke();
  if (isShovel && ready) {
    ctx.strokeStyle = `rgba(255, 226, 132, ${0.38 + pulse * 0.45})`;
    ctx.lineWidth = 3 + pulse * 3;
    roundRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 14);
    ctx.stroke();
  }
  ctx.globalAlpha = ready ? 1 : 0.45;
  const compact = rect.w < 96;
  const iconSize = compact ? Math.min(24, rect.h - 20) : Math.min(34, rect.h - 16);
  drawSvgAsset(icon, compact ? rect.x + rect.w - iconSize - 6 : rect.x + 8, rect.y + (rect.h - iconSize) / 2, iconSize, iconSize);
  ctx.globalAlpha = 1;
  ctx.textAlign = compact ? "center" : "left";
  ctx.font = `${compact ? 18 : Math.max(18, Math.min(23, rect.w * 0.22))}px Microsoft YaHei, sans-serif`;
  strokeText(item.name, compact ? rect.x + rect.w / 2 - 4 : rect.x + iconSize + 16, rect.y + rect.h / 2 + 8, selected ? "#2a160c" : "#fff3cf", selected ? "#ffe8a3" : "#130906", 3);
  if (isShovel && ready && !compact) {
    ctx.font = "12px Microsoft YaHei, sans-serif";
    strokeText(item.hint, rect.x + iconSize + 17, rect.y + rect.h - 8, "#f5d78b", "#130906", 2);
  }
  if (!ready) {
    ctx.fillStyle = "rgba(20, 11, 7, .72)";
    roundRect(ctx, rect.x + rect.w - 39, rect.y + 9, 31, rect.h - 18, 9);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = "15px Microsoft YaHei, sans-serif";
    strokeText(`${Math.ceil(cd)}`, rect.x + rect.w - 23, rect.y + rect.h / 2 + 5, "#fff2bd", "#170b07", 2);
  }
  ctx.restore();
}

function drawRecruitButton() {
  const cost = recruitCost(game.bottom);
  const ready = game.bottom.food >= cost && game.bottom.recruitCooldown <= 0;
  drawButton(RECRUIT.x, RECRUIT.y, RECRUIT.w, RECRUIT.h, ready ? "#b9483e" : "#8b6b5c", "#4d2d24");
  const cd = game.bottom.recruitCooldown > 0 ? game.bottom.recruitCooldown / 1.8 : 0;
  if (cd > 0) {
    ctx.fillStyle = "rgba(32,32,32,.5)";
    ctx.fillRect(RECRUIT.x + RECRUIT.w * (1 - cd), RECRUIT.y + 4, RECRUIT.w * cd - 4, RECRUIT.h - 8);
  }
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "30px Microsoft YaHei, sans-serif";
  strokeText("调兵", RECRUIT.x + 74, RECRUIT.y + 38, "#fff", "#17120f", 5);
  drawSvgAsset("food", RECRUIT.x + 136, RECRUIT.y + 15, 28, 28);
  ctx.font = "22px Microsoft YaHei, sans-serif";
  strokeText(`${cost}`, RECRUIT.x + 180, RECRUIT.y + 39, "#fff8da", "#17120f", 4);
  ctx.restore();
}

function drawSpeedButton() {
  drawButton(SPEED.x, SPEED.y, SPEED.w, SPEED.h, game.speed > 1 ? "#f0bf32" : "#efe2bd", "#9c7220");
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "24px Microsoft YaHei, sans-serif";
  strokeText(`x${game.speed}`, SPEED.x + SPEED.w / 2, SPEED.y + 38, "#fff8d6", "#704212", 4);
  ctx.restore();
}

function drawDrag() {
  if (!drag) return;
  if (drag.type === "shovel") {
    drawSvgAsset("shovel", drag.x - 30, drag.y - 30, 60, 60);
    const cell = pointToCell(drag.x, drag.y);
    if (cell) {
      const key = `${cell.r}:${cell.c}`;
      const exists = allLand.bottom.some(([rr, cc]) => rr === cell.r && cc === cell.c);
      const ok = exists && !game.bottom.land.has(key);
      const rect = cellRect(cell.r, cell.c);
      ctx.save();
      ctx.strokeStyle = ok ? "#f3b331" : "#b24036";
      ctx.lineWidth = 4;
      ctx.setLineDash(ok ? [8, 5] : []);
      ctx.strokeRect(rect.x + 4, rect.y + 4, CELL - 8, CELL - 8);
      ctx.restore();
    }
    return;
  }
  drawUnitCard(drag.unit, { x: drag.x - CELL / 2, y: drag.y - CELL / 2, w: CELL, h: CELL }, true);
  const campIndex = hitCampSlot({ x: drag.x, y: drag.y });
  if (campIndex !== -1) {
    const x = SLOT_X + campIndex * (SLOT_W + SLOT_GAP);
    const target = game.bottom.camp[campIndex];
    const ok = !target || canMerge(drag.unit, target) || drag.source?.type === "board" || drag.source?.type === "camp";
    ctx.save();
    ctx.strokeStyle = ok ? "#f3b331" : "#b24036";
    ctx.lineWidth = 4;
    roundRect(ctx, x - 3, CAMP_Y - 3, SLOT_W + 6, SLOT_H + 6, 8);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const cell = pointToCell(drag.x, drag.y);
  if (cell) {
    const occupant = unitAt(game.bottom, cell.r, cell.c, drag.source.unit?.id);
    const ok = canFitUnit(game.bottom, drag.unit, cell.r, cell.c, drag.source.unit?.id) ||
      canMerge(drag.unit, occupant) ||
      (drag.source?.type === "camp" && occupant);
    const rect = cellRect(cell.r, cell.c);
    ctx.save();
    ctx.strokeStyle = ok ? "#f3b331" : "#b24036";
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x + 3, rect.y + 3, CELL * (drag.unit.width || 1) - 6, CELL - 6);
    ctx.restore();
  }
}

function drawPopups() {
  for (const p of popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.textAlign = "center";
    ctx.font = `${Math.round(24 * p.scale)}px Microsoft YaHei, sans-serif`;
    strokeText(p.text, p.x, p.y, p.color, "#18110e", 4);
    ctx.restore();
  }
}

function drawWaveBanner() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.globalAlpha = Math.min(1, game.waveBanner);
  drawInkPanel(138, BOARD_Y + 154, 300, 58);
  ctx.font = "34px KaiTi, STKaiti, serif";
  strokeText(`魏军第${game.wave}阵`, W / 2, BOARD_Y + 195, "#ffe67b", "#6d3c13", 5);
  ctx.restore();
}

function drawHint() {
  ctx.save();
  const alpha = Math.min(1, game.hintTimer / 1.5);
  ctx.globalAlpha = alpha;
  if (!game.hasRecruited) {
    drawPulseRect(RECRUIT, "#ffd45d");
    drawGuideCallout(RECRUIT.x + RECRUIT.w / 2, RECRUIT.y - 18, "1 先调兵");
  } else if (!game.hasPlaced) {
    drawOpenLandGuide();
    const filled = game.bottom.camp.findIndex(Boolean);
    const x = SLOT_X + Math.max(0, filled) * (SLOT_W + SLOT_GAP);
    drawPulseRect({ x, y: CAMP_Y, w: SLOT_W, h: SLOT_H }, "#ffd45d");
    drawGuideCallout(x + SLOT_W / 2, CAMP_Y - 18, "2 拖到亮格");
  } else {
    const water = waterPoint();
    drawRouteFocus();
    drawGuideCallout(water.x, water.y - CELL * 0.42, "3 守水源");
  }
  ctx.restore();
}

function drawPulseRect(rect, color) {
  const pulse = 0.55 + Math.sin(game.time * 5) * 0.18;
  ctx.save();
  ctx.globalAlpha *= pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  roundRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 10);
  ctx.stroke();
  ctx.restore();
}

function drawGuideCallout(x, y, text) {
  const w = Math.max(96, text.length * 22);
  const h = 34;
  const px = Math.max(10, Math.min(W - w - 10, x - w / 2));
  const py = Math.max(BOARD_Y + 8, Math.min(H - h - 10, y - h));
  ctx.save();
  ctx.fillStyle = "rgba(35, 19, 12, .88)";
  ctx.strokeStyle = "#ffe29a";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "20px Microsoft YaHei, sans-serif";
  strokeText(text, px + w / 2, py + 24, "#fff4cf", "#120806", 3);
  ctx.restore();
}

function drawOpenLandGuide() {
  ctx.save();
  ctx.globalAlpha *= 0.55;
  ctx.fillStyle = "#ffe28a";
  for (const key of game.bottom.land) {
    const [r, c] = key.split(":").map(Number);
    if (unitAt(game.bottom, r, c)) continue;
    const rect = cellRect(r, c);
    ctx.fillRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
  }
  ctx.restore();
}

function drawRouteFocus() {
  ctx.save();
  ctx.globalAlpha *= 0.42;
  drawPathStroke(battlePaths.water, "#d8f5ff", 10);
  drawPathStroke(battlePaths.encircle, "#ffd5c8", 10);
  ctx.restore();
}

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(34,24,17,.45)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.font = "52px Microsoft YaHei, sans-serif";
  strokeText("暂停", W / 2, H / 2, "#fff7d5", "#211610", 7);
  ctx.restore();
}

function drawResult() {
  ctx.save();
  ctx.fillStyle = "rgba(33,23,16,.68)";
  ctx.fillRect(0, 0, W, H);
  const won = game.result === "won";
  ctx.textAlign = "center";
  ctx.font = "58px KaiTi, STKaiti, serif";
  strokeText(won ? "街亭得守" : "街亭失守", W / 2, 410, won ? "#ffe48d" : "#ffb0a0", "#1c110d", 8);
  ctx.font = "26px Microsoft YaHei, sans-serif";
  strokeText(won ? "计谋破魏，蜀军稳住山道" : "魏军越过山道，重整旗鼓再战", W / 2, 462, "#fff8d9", "#1c110d", 5);
  const btnW = Math.min(286, W * 0.72);
  const btnH = 78;
  const btnX = W / 2 - btnW / 2;
  const btnY = H * 0.52;
  drawButton(btnX, btnY, btnW, btnH, "#b9483e", "#642b25");
  ctx.font = "34px Microsoft YaHei, sans-serif";
  strokeText("再来一局", W / 2, btnY + 51, "#ffffff", "#15110f", 5);
  ctx.restore();
}

function drawSvgAsset(key, x, y, w, h) {
  const img = svgAssets[key];
  if (img && img.complete && img.naturalWidth !== 0) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }
  drawStickFallback(x, y, w, h, SVG_SPECS[key]?.accent || "#222");
}

function drawStickFallback(x, y, w, h, color) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(w / 96, h / 96);
  ctx.strokeStyle = "#15110d";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -22, 10, 0, Math.PI * 2);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 18);
  ctx.moveTo(-22, 2);
  ctx.lineTo(22, 0);
  ctx.moveTo(0, 18);
  ctx.lineTo(-18, 44);
  ctx.moveTo(0, 18);
  ctx.lineTo(18, 44);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-30, 48);
  ctx.quadraticCurveTo(0, 58, 30, 48);
  ctx.stroke();
  ctx.restore();
}

function drawButton(x, y, w, h, fill, stroke) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff7df";
  ctx.fillRect(x + 8, y + 8, w - 16, 10);
  ctx.restore();
}

function drawPauseButton(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(119,113,103,.22)";
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4d4036";
  roundRect(ctx, -13, -19, 9, 38, 4);
  roundRect(ctx, 5, -19, 9, 38, 4);
  ctx.fill();
  ctx.restore();
}

function drawExitButton() {
  drawButton(EXIT_BUTTON.x, EXIT_BUTTON.y, EXIT_BUTTON.w, EXIT_BUTTON.h, "#ded3c4", "#7a6655");
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "22px Microsoft YaHei, sans-serif";
  strokeText("退", EXIT_BUTTON.x + EXIT_BUTTON.w / 2, EXIT_BUTTON.y + 29, "#3a2b20", "#fff7e9", 3);
  ctx.restore();
}

function drawInkPanel(x, y, w, h) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, "#332018");
  g.addColorStop(1, "rgba(88,58,43,.74)");
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.restore();
}

function drawBanner(x, y, color, text) {
  ctx.save();
  ctx.strokeStyle = "#2a1a12";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 92);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x + 62, y - 8);
  ctx.lineTo(x, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "center";
  ctx.font = "26px KaiTi, STKaiti, serif";
  strokeText(text, x + 26, y + 3, "#fff3d0", "#33160f", 3);
  ctx.restore();
}

function drawFort(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#303235";
  ctx.strokeStyle = "#151719";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-30, 28);
  ctx.lineTo(-22, -10);
  ctx.lineTo(-8, 8);
  ctx.lineTo(0, -22);
  ctx.lineTo(10, 8);
  ctx.lineTo(24, -9);
  ctx.lineTo(30, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHeart(x, y, on) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = on ? "#e23c3b" : "rgba(111,82,74,.35)";
  ctx.strokeStyle = "#5b231f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-18, -6, -8, -20, 0, -9);
  ctx.bezierCurveTo(8, -20, 18, -6, 0, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function roundRect(target, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  target.beginPath();
  target.moveTo(x + rr, y);
  target.lineTo(x + w - rr, y);
  target.quadraticCurveTo(x + w, y, x + w, y + rr);
  target.lineTo(x + w, y + h - rr);
  target.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  target.lineTo(x + rr, y + h);
  target.quadraticCurveTo(x, y + h, x, y + h - rr);
  target.lineTo(x, y + rr);
  target.quadraticCurveTo(x, y, x + rr, y);
  target.closePath();
}

function strokeText(text, x, y, fill, stroke, width) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function popText(x, y, text, color, scale = 1) {
  popups.push({ x, y, text, color, scale, life: 1.1 });
}

function unlockAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playSfx(name) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const throttle = name === "hit" || name === "heroHit" ? 0.08 : 0.02;
  if ((lastSfxAt[name] || 0) + throttle > now) return;
  lastSfxAt[name] = now;
  const patterns = {
    start: [[196, 0, 0.08], [294, 0.07, 0.12], [392, 0.16, 0.16]],
    recruit: [[220, 0, 0.07], [330, 0.05, 0.09]],
    select: [[520, 0, 0.045]],
    merge: [[330, 0, 0.08], [440, 0.06, 0.12], [660, 0.12, 0.12]],
    hero: [[196, 0, 0.1], [392, 0.07, 0.16], [784, 0.18, 0.26]],
    hit: [[118, 0, 0.035]],
    heroHit: [[180, 0, 0.05], [360, 0.02, 0.06]],
    kill: [[620, 0, 0.05], [430, 0.05, 0.08]],
    bossDown: [[180, 0, 0.12], [270, 0.08, 0.16], [540, 0.2, 0.26]],
    leak: [[150, 0, 0.1], [92, 0.08, 0.16]],
    win: [[262, 0, 0.1], [330, 0.1, 0.1], [392, 0.2, 0.18], [523, 0.34, 0.24]],
    lose: [[196, 0, 0.16], [146, 0.16, 0.18], [98, 0.34, 0.28]],
    ambush: [[160, 0, 0.08], [220, 0.06, 0.12]],
    fire: [[90, 0, 0.06], [180, 0.03, 0.12], [360, 0.08, 0.1]],
    supplyCut: [[240, 0, 0.08], [120, 0.08, 0.14]],
    fortify: [[150, 0, 0.08], [260, 0.06, 0.12]],
  };
  const pattern = patterns[name] || patterns.select;
  for (const [freq, offset, dur] of pattern) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = name === "fire" || name === "leak" ? "sawtooth" : (name === "hit" ? "triangle" : "sine");
    osc.frequency.setValueAtTime(freq, now + offset);
    if (name === "fire") osc.frequency.exponentialRampToValueAtTime(freq * 1.7, now + offset + dur);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(name === "hit" ? 0.04 : 0.075, now + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + dur + 0.02);
  }
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 36 + Math.random() * 76;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 4,
      life: 0.5 + Math.random() * 0.45,
    });
  }
}

function addRing(x, y, color, scale = 1) {
  particles.push({ kind: "ring", x, y, color, scale, life: 0.7, age: 0 });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function inRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  unlockAudio();
  canvas.setPointerCapture(event.pointerId);
  const p = canvasPoint(event);
  pointer = p;

  if (scene === "menu") {
    if (inRect(p, menuStartRect())) resetGame();
    return;
  }

  if (scene === "over") {
    const btnW = Math.min(286, W * 0.72);
    if (inRect(p, { x: W / 2 - btnW / 2, y: H * 0.52, w: btnW, h: 78 })) resetGame();
    return;
  }

  if (inRect(p, EXIT_BUTTON)) {
    scene = "menu";
    game = createGame();
    drag = null;
    return;
  }
  if (p.x <= 78 && p.y <= 82) {
    game.paused = !game.paused;
    return;
  }
  if (game.paused) return;

  if (inRect(p, SPEED)) {
    game.speed = game.speed === 1 ? 2 : 1;
    return;
  }
  if (inRect(p, RECRUIT)) {
    recruitUnit(game.bottom);
    return;
  }
  const strategyRect = STRATEGY_RECTS.find((rect) => inRect(p, rect));
  if (strategyRect) {
    if (strategyRect.key === "fortify") {
      if (game.strategyCooldowns.fortify <= 0) {
        drag = { type: "shovel", x: p.x, y: p.y, source: { type: "shovel" } };
        game.selectedStrategy = null;
        playSfx("select");
      }
      return;
    }
    selectStrategy(strategyRect.key);
    return;
  }

  const cell = pointToCell(p.x, p.y);
  if (game.selectedStrategy && cell) {
    applySelectedStrategyAt(cell);
    return;
  }

  const campIndex = hitCampSlot(p);
  if (campIndex !== -1 && game.bottom.camp[campIndex]) {
    drag = {
      unit: game.bottom.camp[campIndex],
      x: p.x,
      y: p.y,
      source: { type: "camp", index: campIndex },
    };
    return;
  }

  if (cell) {
    const unit = unitAt(game.bottom, cell.r, cell.c);
    if (unit) {
      drag = { unit, x: p.x, y: p.y, source: { type: "board", unit } };
    }
  }
});

canvas.addEventListener("pointermove", (event) => {
  const p = canvasPoint(event);
  pointer = p;
  if (drag) {
    drag.x = p.x;
    drag.y = p.y;
  }
});

canvas.addEventListener("pointerup", (event) => {
  const p = canvasPoint(event);
  pointer = p;
  if (!drag) return;
  if (drag.type === "shovel") {
    const cell = pointToCell(p.x, p.y);
    if (cell) tryUseShovelAt(cell);
    drag = null;
    return;
  }
  const campIndex = hitCampSlot(p);
  if (campIndex !== -1) {
    tryDropUnitToCamp(game.bottom, drag.unit, campIndex, drag.source);
    drag = null;
    return;
  }
  const cell = pointToCell(p.x, p.y);
  if (cell) tryDropUnit(game.bottom, drag.unit, cell.r, cell.c, drag.source);
  drag = null;
});

canvas.addEventListener("pointercancel", () => {
  drag = null;
});

function hitCampSlot(p) {
  if (p.y < CAMP_Y || p.y > CAMP_Y + SLOT_H) return -1;
  for (let i = 0; i < CAMP_SLOTS; i += 1) {
    const x = SLOT_X + i * (SLOT_W + SLOT_GAP);
    if (p.x >= x && p.x <= x + SLOT_W) return i;
  }
  return -1;
}

function campSlotCenter(index) {
  const x = SLOT_X + index * (SLOT_W + SLOT_GAP);
  return { x: x + SLOT_W / 2, y: CAMP_Y + SLOT_H / 2 };
}
