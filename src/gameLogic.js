export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialState({ playerHealth = 100, pollution = 0, enemiesRemaining = 0 } = {}) {
  return {
    playerHealth: clamp(playerHealth, 0, 100),
    pollution: clamp(pollution, 0, 100),
    enemiesRemaining: Math.max(0, enemiesRemaining)
  };
}

export function applyPollution(state, amount) {
  state.pollution = clamp(state.pollution + amount, 0, 100);
  return state;
}

export function resolveHit(state, { damage = 0, pollutionReduction = 0, enemyKilled = false } = {}) {
  state.playerHealth = clamp(state.playerHealth - damage, 0, 100);
  state.pollution = clamp(state.pollution - pollutionReduction, 0, 100);
  if (enemyKilled) {
    state.enemiesRemaining = Math.max(0, state.enemiesRemaining - 1);
  }
  return state;
}

export function isLevelFailed(state) {
  return state.playerHealth <= 0 || state.pollution >= 100;
}

export function isLevelCleared(state) {
  return state.enemiesRemaining <= 0 && !isLevelFailed(state);
}

export function pollutionStatus(value) {
  if (value >= 90) return { label: "Kollapsnah", color: "#ff4d3d" };
  if (value >= 65) return { label: "Kritisch", color: "#ff8a4c" };
  if (value >= 30) return { label: "Belastet", color: "#ffd166" };
  return { label: "Stabil", color: "#41e5b4" };
}

export function resultRank({ pollution, playerHealth }) {
  if (pollution <= 15 && playerHealth >= 85) return "S";
  if (pollution <= 35 && playerHealth >= 65) return "A";
  if (pollution <= 60 && playerHealth >= 40) return "B";
  return "C";
}

export function pollutionTick({ pollutionRate, hazardCount, dt }) {
  const base = pollutionRate * 0.58 * dt;
  const hazardPressure = Math.min(hazardCount, 16) * 0.02 * dt;
  return Math.round(Math.min(1.2, base + hazardPressure) * 100) / 100;
}

export function resultFlow({ won, levelIndex, levelCount }) {
  const hasNextLevel = won && levelIndex < levelCount - 1;
  if (hasNextLevel) {
    return { action: "next", buttonText: "Naechster Einsatz", final: false };
  }
  if (won) {
    return { action: "restart", buttonText: "Neue Kampagne", final: true };
  }
  return { action: "restart", buttonText: "Neu starten", final: false };
}

export function bossPhase({ hp, maxHp }) {
  const ratio = maxHp <= 0 ? 0 : clamp(hp / maxHp, 0, 1);
  if (ratio <= 0.34) {
    return {
      phase: 3,
      leakMultiplier: 0.48,
      shootMultiplier: 0.64,
      label: "Oelkatastrophe kritisch"
    };
  }
  if (ratio <= 0.68) {
    return {
      phase: 2,
      leakMultiplier: 0.72,
      shootMultiplier: 0.82,
      label: "Rumpf leckgeschlagen"
    };
  }
  return {
    phase: 1,
    leakMultiplier: 1,
    shootMultiplier: 1,
    label: "Tanker im Anflug"
  };
}

export function difficultyProfile({ levelIndex, levelCount, enemiesRemaining, initialEnemies, boss = false, training = false }) {
  const levelFactor = levelCount <= 1 ? 0 : clamp(levelIndex / (levelCount - 1), 0, 1);
  const remainingRatio = initialEnemies <= 0 ? 0 : clamp(enemiesRemaining / initialEnemies, 0, 1);
  const invaderPressure = 1 - remainingRatio;

  if (training) {
    return {
      movementSpeed: 0,
      descent: 8,
      enemyBulletSpeed: 150,
      shootMin: 3.6,
      shootJitter: 2.2,
      leakPolluter: 3.2,
      leakDrone: 4.8,
      breachY: 520,
      breachDamage: 0
    };
  }

  if (boss) {
    return {
      movementSpeed: 108,
      descent: 0,
      enemyBulletSpeed: 270,
      shootMin: 0.78,
      shootJitter: 0.62,
      leakPolluter: 0.58,
      leakDrone: 1.08,
      breachY: 480,
      breachDamage: 16
    };
  }

  return {
    movementSpeed: Math.round(46 + levelFactor * 61 + invaderPressure * 20),
    descent: Math.round(12 + levelFactor * 10.8 + invaderPressure * 4),
    enemyBulletSpeed: Math.round(170 + levelFactor * 126 + invaderPressure * 20),
    shootMin: Math.round(clamp(1.4 - levelFactor * 0.99 - invaderPressure * 0.14, 0.5, 1.4) * 100) / 100,
    shootJitter: Math.round(clamp(1.4 - levelFactor * 0.9 - invaderPressure * 0.1, 0.45, 1.4) * 100) / 100,
    leakPolluter: Math.round(clamp(0.85 - levelFactor * 0.38 - invaderPressure * 0.04, 0.44, 0.85) * 100) / 100,
    leakDrone: Math.round(clamp(1.8 - levelFactor * 0.9 - invaderPressure * 0.04, 0.8, 1.8) * 100) / 100,
    breachY: Math.round(520 - levelFactor * 36),
    breachDamage: Math.round(5 + levelFactor * 11)
  };
}

export function enemyCountForLevel({ levelIndex, levelCount, training = false, boss = false }) {
  if (training) return 4;
  if (boss) return 9;
  const levelFactor = levelCount <= 1 ? 0 : clamp(levelIndex / (levelCount - 1), 0, 1);
  return Math.round(6 + levelFactor * 18);
}

function laneY(lane, row, levelIndex) {
  const offset = Math.min(levelIndex, 8) * 3;
  if (lane === "top") return 124 + row * 50 + offset;
  if (lane === "mid") return 160 + row * 54 + offset;
  return 136 + row * 58 + offset;
}

function layoutMotion(formation, index, enemyType) {
  if (formation === "line") return "march";
  if (formation === "swarm") return index % 3 === 0 ? "dive" : "weave";
  if (formation === "zigzag" || formation === "vee" || formation === "arc") return "weave";
  if (formation === "columns" || formation === "block" || formation === "wall" || formation === "mixedWall") return "guard";
  if (formation === "guarded" || formation === "bossGuard" || formation === "coreGuard" || formation === "finalCore") return enemyType === "polluter" ? "heavy" : "guard";
  if (enemyType === "polluter") return "heavy";
  if (enemyType === "shield") return "guard";
  return "march";
}

export function enemyLayout({ formation = "line", count, lane = "mixed", levelIndex = 0, width = 960 }) {
  const safeCount = Math.max(1, count);
  const points = [];
  const usableWidth = width - 180;
  const startX = 90;

  for (let index = 0; index < safeCount; index += 1) {
    const progress = safeCount === 1 ? 0.5 : index / (safeCount - 1);
    let x = startX + progress * usableWidth;
    let row = Math.floor(index / 6);
    let y = laneY(lane, row, levelIndex);
    let enemyType = index % 5 === 0 ? "polluter" : index % 3 === 0 ? "shield" : "drone";

    if (formation === "line") {
      y = laneY(lane, 0, levelIndex);
    } else if (formation === "stagger" || formation === "rows") {
      row = Math.floor(index / 5);
      x = 130 + (index % 5) * 170 + (row % 2) * 58;
      y = laneY(lane, row, levelIndex);
    } else if (formation === "columns" || formation === "block") {
      const col = index % 4;
      row = Math.floor(index / 4);
      x = 210 + col * 180;
      y = laneY(lane, row, levelIndex);
      enemyType = index % 2 === 0 ? "shield" : enemyType;
    } else if (formation === "vee") {
      const center = (safeCount - 1) / 2;
      x = width / 2 + (index - center) * 104;
      y = laneY(lane, 0, levelIndex) + Math.abs(index - center) * 28;
    } else if (formation === "arc") {
      const angle = Math.PI * (0.15 + progress * 0.7);
      x = width / 2 + Math.cos(angle) * 360;
      y = laneY(lane, 1, levelIndex) + Math.sin(angle) * 92;
    } else if (formation === "zigzag") {
      x = 112 + (index % 7) * 124;
      y = laneY(lane, 0, levelIndex) + ((index * 37) % 132) + Math.floor(index / 7) * 44;
    } else if (formation === "swarm" || formation === "paired") {
      x = 82 + (index % 9) * 98;
      y = laneY(lane, 0, levelIndex) + ((index * 37) % 128);
      enemyType = "drone";
    } else if (formation === "diamond") {
      const pattern = [
        [0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2], [2, 2], [-1, 3], [1, 3]
      ];
      const [px, py] = pattern[index % pattern.length];
      x = width / 2 + px * 104;
      y = laneY(lane, 0, levelIndex) + py * 48;
    } else if (formation === "wall" || formation === "mixedWall") {
      const col = index % 8;
      row = Math.floor(index / 8);
      x = 82 + col * 110;
      y = laneY(lane, row, levelIndex);
      enemyType = index % 4 === 0 ? "shield" : enemyType;
    } else if (formation === "guarded" || formation === "bossGuard" || formation === "coreGuard" || formation === "finalCore") {
      const col = index % 5;
      row = Math.floor(index / 5);
      x = width / 2 - 230 + col * 115;
      y = laneY(lane, row, levelIndex) + (index === 0 ? 22 : 0);
      enemyType = formation === "finalCore" ? "shield" : index === 0 ? "polluter" : "shield";
    }

    points.push({
      x: Math.round(clamp(x, 58, width - 82)),
      y: Math.round(y),
      type: enemyType,
      motion: layoutMotion(formation, index, enemyType)
    });
  }

  return points;
}

export function enemyMotionProfile({ enemyType = "drone", motion = "march", levelIndex = 0, levelCount = 10 }) {
  const levelFactor = levelCount <= 1 ? 0 : clamp(levelIndex / (levelCount - 1), 0, 1);
  if (motion === "weave") {
    return {
      speedMultiplier: Math.round((1.08 + levelFactor * 0.36) * 100) / 100,
      swayAmplitude: Math.round(18 + levelFactor * 24),
      swaySpeed: Math.round((1.4 + levelFactor * 1.8) * 100) / 100,
      verticalDrift: Math.round(4 + levelFactor * 6)
    };
  }
  if (motion === "dive") {
    return {
      speedMultiplier: Math.round((1.18 + levelFactor * 0.44) * 100) / 100,
      swayAmplitude: Math.round(20 + levelFactor * 20),
      swaySpeed: Math.round((1.8 + levelFactor * 1.6) * 100) / 100,
      verticalDrift: Math.round(12 + levelFactor * 12)
    };
  }
  if (motion === "heavy" || enemyType === "polluter") {
    return {
      speedMultiplier: Math.round((0.68 + levelFactor * 0.15) * 100) / 100,
      swayAmplitude: Math.round(4 + levelFactor * 6),
      swaySpeed: Math.round((0.55 + levelFactor * 0.52) * 100) / 100,
      verticalDrift: Math.round(2 + levelFactor * 3)
    };
  }
  if (motion === "guard" || enemyType === "shield") {
    return {
      speedMultiplier: Math.round((0.82 + levelFactor * 0.15) * 100) / 100,
      swayAmplitude: Math.round(8 + levelFactor * 9),
      swaySpeed: Math.round((0.7 + levelFactor * 0.6) * 100) / 100,
      verticalDrift: Math.round(1 + levelFactor * 2)
    };
  }
  return {
    speedMultiplier: Math.round((1 + levelFactor * 0.18) * 100) / 100,
    swayAmplitude: Math.round(5 + levelFactor * 7),
    swaySpeed: Math.round((0.8 + levelFactor * 0.5) * 100) / 100,
    verticalDrift: Math.round(levelFactor * 3)
  };
}

const WEAPONS = [
  {
    id: "scrapShot",
    name: "Schrottflinte",
    cooldown: 0.34,
    pattern: "single",
    projectiles: 1,
    power: 1,
    radius: 11,
    range: 560,
    speed: 560,
    pierce: 0,
    blastRadius: 0,
    maxTargets: 1
  },
  {
    id: "doublePulse",
    name: "Doppelpuls",
    cooldown: 0.23,
    pattern: "double",
    projectiles: 2,
    power: 1.15,
    radius: 8,
    range: 620,
    speed: 640,
    pierce: 0,
    blastRadius: 0,
    maxTargets: 1
  },
  {
    id: "ecoBurst",
    name: "Eco-Burst",
    cooldown: 0.18,
    pattern: "triple",
    projectiles: 3,
    power: 1.25,
    radius: 7,
    range: 640,
    speed: 620,
    pierce: 0,
    blastRadius: 0,
    maxTargets: 1
  },
  {
    id: "netLauncher",
    name: "Netzwerfer",
    cooldown: 0.28,
    pattern: "wide",
    projectiles: 2,
    power: 1.2,
    radius: 10,
    range: 520,
    speed: 500,
    pierce: 0,
    blastRadius: 22,
    maxTargets: 2
  },
  {
    id: "splitter",
    name: "Recycling-Splitter",
    cooldown: 0.2,
    pattern: "triple",
    projectiles: 3,
    power: 1.4,
    radius: 8,
    range: 620,
    speed: 650,
    pierce: 0,
    blastRadius: 34,
    maxTargets: 2
  },
  {
    id: "cleanseBeam",
    name: "Loeschstrahl",
    cooldown: 0.16,
    pattern: "beam",
    projectiles: 1,
    power: 1.55,
    radius: 13,
    range: 390,
    speed: 760,
    pierce: 1,
    blastRadius: 0,
    maxTargets: 2,
    pollutionReduction: 1.2
  },
  {
    id: "railPulse",
    name: "Rail-Puls",
    cooldown: 0.3,
    pattern: "rail",
    projectiles: 1,
    power: 1.8,
    radius: 7,
    range: 700,
    speed: 900,
    pierce: 2,
    blastRadius: 0,
    maxTargets: 3
  },
  {
    id: "bazooka",
    name: "Eco-Bazooka",
    cooldown: 0.72,
    pattern: "rocket",
    projectiles: 1,
    power: 2.4,
    radius: 14,
    range: 660,
    speed: 420,
    pierce: 0,
    blastRadius: 72,
    maxTargets: 3
  },
  {
    id: "chainReactor",
    name: "Kettenreaktor",
    cooldown: 0.24,
    pattern: "chain",
    projectiles: 2,
    power: 1.95,
    radius: 9,
    range: 650,
    speed: 680,
    pierce: 0,
    blastRadius: 42,
    maxTargets: 3,
    chain: true
  },
  {
    id: "hybridCore",
    name: "Hybrid-Kern",
    cooldown: 0.26,
    pattern: "hybrid",
    projectiles: 3,
    power: 2.15,
    radius: 9,
    range: 680,
    speed: 700,
    pierce: 1,
    blastRadius: 48,
    maxTargets: 3,
    chain: true,
    pollutionReduction: 0.8
  }
];

export function weaponForLevel(levelIndex) {
  return WEAPONS[clamp(levelIndex, 0, WEAPONS.length - 1)];
}

export function weaponDamage({ weaponId, enemyKind = "", enemyType = "" }) {
  if (weaponId === "scrapShot") {
    if (enemyType === "drone" || enemyKind.includes("Drone")) return 1.35;
    if (enemyType === "shield" || enemyKind === "stackBot") return 0.65;
  }
  if (weaponId === "bazooka") {
    if (enemyType === "polluter" || enemyKind.includes("Canister") || enemyKind.includes("Barrel")) return 2.4;
    if (enemyType === "drone") return 1.15;
  }
  if (weaponId === "railPulse") {
    if (enemyType === "shield" || enemyKind === "stackBot") return 2;
    if (enemyType === "boss") return 1.5;
  }
  if (weaponId === "cleanseBeam") {
    if (enemyKind === "ashPod" || enemyKind === "sprayDrone" || enemyKind === "foamPod") return 1.8;
  }
  if (weaponId === "splitter" || weaponId === "chainReactor") {
    if (enemyType === "drone" || enemyKind === "microbin") return 1.45;
    if (enemyType === "boss") return 0.7;
  }
  if (weaponId === "netLauncher") {
    if (enemyType === "drone") return 1.25;
    if (enemyType === "boss") return 0.55;
  }
  if (weaponId === "hybridCore") {
    return enemyType === "boss" ? 1.4 : 1.25;
  }
  return 1;
}

export function resolveWeaponHit({ hp, weapon, enemyKind = "", enemyType = "" }) {
  const damage = Math.round((weapon.power * weaponDamage({ weaponId: weapon.id, enemyKind, enemyType })) * 100) / 100;
  const nextHp = Math.round(clamp(hp - damage, 0, Number.MAX_SAFE_INTEGER) * 100) / 100;
  return {
    damage,
    hp: nextHp,
    destroyed: nextHp <= 0
  };
}

const UPGRADES = {
  damage: {
    id: "damage",
    name: "Verdichterlauf",
    description: "Mehr Schaden fuer die aktuelle Waffenfamilie."
  },
  cooldown: {
    id: "cooldown",
    name: "Schnellspule",
    description: "Kuerzere Nachladezeit."
  },
  cleanse: {
    id: "cleanse",
    name: "Filterkern",
    description: "Reinigungspuls und Eco-Waffen senken Verschmutzung staerker."
  },
  blast: {
    id: "blast",
    name: "Splitterladung",
    description: "Explosionen und Ketteneffekte treffen mehr Flaeche."
  },
  pierce: {
    id: "pierce",
    name: "Durchschlag",
    description: "Praezisionswaffen treffen mehr Ziele in Linie."
  },
  shield: {
    id: "shield",
    name: "Notfallschild",
    description: "Mehr Spielraum gegen Treffer und zu tiefe Formationen."
  }
};

export function createUpgradeState() {
  return { damage: 0, cooldown: 0, cleanse: 0, blast: 0, pierce: 0, shield: 0 };
}

export function upgradeOptions(levelIndex) {
  const pools = [
    ["damage", "cooldown", "cleanse"],
    ["damage", "cooldown", "shield"],
    ["damage", "pierce", "cleanse"],
    ["cooldown", "blast", "shield"],
    ["blast", "damage", "cleanse"],
    ["cleanse", "cooldown", "shield"],
    ["pierce", "damage", "cooldown"],
    ["blast", "pierce", "shield"],
    ["blast", "damage", "cleanse"],
    ["pierce", "blast", "shield"]
  ];
  return (pools[clamp(levelIndex, 0, pools.length - 1)] || pools[0]).map((id) => UPGRADES[id]);
}

export function applyUpgrade(upgrades, id) {
  return {
    ...upgrades,
    [id]: (upgrades[id] || 0) + 1
  };
}

export function upgradeWeapon(weapon, upgrades) {
  return {
    ...weapon,
    power: Math.round((weapon.power + (upgrades.damage || 0) * 0.3) * 100) / 100,
    cooldown: Math.round(Math.max(0.08, weapon.cooldown - (upgrades.cooldown || 0) * 0.09) * 100) / 100,
    blastRadius: Math.round(weapon.blastRadius + (upgrades.blast || 0) * 18),
    pierce: weapon.pierce + (upgrades.pierce || 0),
    pollutionReduction: Math.round(((weapon.pollutionReduction || 0) + (upgrades.cleanse || 0) * 0.5) * 100) / 100
  };
}
