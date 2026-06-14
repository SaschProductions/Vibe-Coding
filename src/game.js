import {
  applyPollution,
  applyUpgrade,
  bossPhase,
  clamp,
  createUpgradeState,
  enemyCountForLevel,
  enemyLayout,
  enemyMotionProfile,
  createInitialState,
  difficultyProfile,
  isLevelCleared,
  isLevelFailed,
  pollutionTick,
  pollutionStatus,
  resultFlow,
  resultRank,
  resolveWeaponHit,
  weaponDamage,
  weaponForLevel,
  upgradeOptions,
  upgradeWeapon
} from "./gameLogic.js?v=publish-pass-15";
import { LEVELS as LEVEL_DATA } from "./content/levels.js?v=publish-pass-15";
import {
  biomeTheme,
  polluterVisual,
  pollutionVisual
} from "./visualConfig.js?v=publish-pass-15";
import { createAudioEngine } from "./audio.js?v=publish-pass-15";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const levelLabel = document.querySelector("#levelLabel");
const threatLabel = document.querySelector("#threatLabel");
const environmentLabel = document.querySelector("#environmentLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const skillLabel = document.querySelector("#skillLabel");
const soundLabel = document.querySelector("#soundLabel");
const soundToggle = document.querySelector("#soundToggle");

const W = canvas.width;
const H = canvas.height;

const LEVEL_BACKDROP_ASSETS = [
  "assets/levels/level-01-coast.png",
  "assets/levels/level-02-forest.png",
  "assets/levels/level-03-reef.png",
  "assets/levels/level-04-solar.png",
  "assets/levels/level-05-city.png",
  "assets/levels/level-06-arctic.png",
  "assets/levels/level-07-wetland.png",
  "assets/levels/level-08-mountain.png",
  "assets/levels/level-09-meadow.png",
  "assets/levels/level-10-tanker.png"
];

const levelBackdropImages = LEVEL_BACKDROP_ASSETS.map((src) => {
  const image = new Image();
  image.src = src;
  return image;
});

const LEVELS = LEVEL_DATA.map((level, index) => ({
  ...level,
  artAsset: LEVEL_BACKDROP_ASSETS[index],
  top: level.background.sky,
  bottom: level.background.ground,
  training: index === 0,
  boss: index === LEVEL_DATA.length - 1,
  count: enemyCountForLevel({
    levelIndex: index,
    levelCount: LEVEL_DATA.length,
    training: index === 0,
    boss: index === LEVEL_DATA.length - 1
  }),
  pollutionRate: index === 0 ? 0.12 : index === LEVEL_DATA.length - 1 ? 0.98 : 0.22 + level.targetPollution / 90
}));

const keys = new Set();
const audio = createAudioEngine();
let pointerX = W / 2;
let mouseActive = false;
let lastTime = 0;
let running = false;
let levelIndex = 0;
let score = 0;
let state;
let player;
let enemies;
let bullets;
let enemyBullets;
let hazards;
let particles;
let cooldown = 0;
let skillCooldown = 0;
let message = "";
let messageTimer = 0;
let mouseDown = false;
let levelElapsed = 0;
let initialEnemies = 0;
let currentWeapon;
let upgrades = createUpgradeState();

function resetLevel(nextIndex = levelIndex) {
  levelIndex = clamp(nextIndex, 0, LEVELS.length - 1);
  const level = LEVELS[levelIndex];
  player = { x: W / 2, y: H - 62, w: 54, h: 28, speed: 430 };
  bullets = [];
  enemyBullets = [];
  hazards = [];
  particles = [];
  cooldown = 0;
  skillCooldown = 0;
  levelElapsed = 0;
  currentWeapon = upgradeWeapon(weaponForLevel(levelIndex), upgrades);
  message = level.training ? `${currentWeapon.name}: Einzelschuss, nah ran und genau zielen` : `${currentWeapon.name} freigeschaltet`;
  messageTimer = 2.4;
  enemies = createEnemies(level);
  initialEnemies = enemies.length;
  state = createInitialState({ playerHealth: 100, pollution: 0, enemiesRemaining: enemies.length });
  updateLabels();
}

function createEnemies(level) {
  if (level.boss) {
    const boss = {
      type: "boss",
      kind: "megaEmitter",
      x: W / 2 - 170,
      y: 112,
      w: 340,
      h: 86,
      hp: 90,
      maxHp: 90,
      dir: 1,
      baseX: W / 2 - 170,
      baseY: 112,
      phase: 0,
      motion: "boss",
      phaseLevel: 1,
      speedMultiplier: 1,
      swayAmplitude: 28,
      swaySpeed: 0.8,
      verticalDrift: 0,
      leak: 0,
      shoot: 0.8
    };
    const escortPolluters = level.polluters.filter((polluter) => polluter.type !== "megaEmitter");
    const escortLayout = enemyLayout({
      formation: "finalCore",
      count: Math.max(0, level.count - 1),
      lane: "mixed",
      levelIndex,
      width: W
    });
    const escorts = escortLayout.map((point, index) => {
      const polluter = escortPolluters[index % escortPolluters.length] || { type: "stackBot" };
      const escortType = index % 3 === 0 ? "shield" : "drone";
      const motion = enemyMotionProfile({
        enemyType: escortType,
        motion: point.motion,
        levelIndex,
        levelCount: LEVELS.length
      });
      const hp = escortType === "shield" ? 5 : 3;
      return {
        type: escortType,
        kind: polluter.type,
        x: point.x,
        y: point.y + 128,
        w: escortType === "shield" ? 64 : 56,
        h: 38,
        hp,
        maxHp: hp,
        dir: index % 2 === 0 ? -1 : 1,
        baseX: point.x,
        baseY: point.y + 128,
        phase: index * 0.65,
        motion: point.motion,
        speedMultiplier: motion.speedMultiplier,
        swayAmplitude: motion.swayAmplitude,
        swaySpeed: motion.swaySpeed,
        verticalDrift: Math.max(0, motion.verticalDrift - 4),
        leak: 1.2 + index * 0.12,
        shoot: 0.8 + index * 0.1
      };
    });
    return [boss, ...escorts];
  }

  const result = [];
  if (level.training) {
    const trainingPositions = [314, 438, 562, 686];
    for (let i = 0; i < trainingPositions.length; i += 1) {
      result.push({
        type: i === 0 ? "polluter" : "drone",
        kind: i === 0 ? "leakCanister" : "smogDrone",
        x: trainingPositions[i] - 29,
        y: i < 2 ? 116 : 178,
        w: 58,
        h: 36,
        hp: 1,
        maxHp: 1,
        dir: i % 2 === 0 ? 1 : -1,
        baseX: trainingPositions[i] - 29,
        baseY: i < 2 ? 116 : 178,
        phase: i * 0.8,
        motion: "march",
        speedMultiplier: 0,
        swayAmplitude: 0,
        swaySpeed: 0,
        verticalDrift: 0,
        leak: 4 + Math.random() * 2,
        shoot: 5 + Math.random() * 2
      });
    }
    return result;
  }

  const polluters = level.polluters.length > 0 ? level.polluters : [{ type: "smogDrone" }];
  const primaryWave = level.waves[0] || { formation: "line", lane: "mixed" };
  const denseLine = primaryWave.formation === "line" && level.count > 8;
  const layout = enemyLayout({
    formation: denseLine ? "stagger" : primaryWave.formation,
    count: level.count,
    lane: denseLine ? "mixed" : primaryWave.lane || "mixed",
    levelIndex,
    width: W
  });
  for (let i = 0; i < level.count; i += 1) {
    const point = layout[i];
    const polluter = polluters[i % polluters.length];
    const enemyType = point.type;
    const openingGrace = 1.4 + Math.min(levelIndex, 8) * 0.06;
    const formationStagger = (i % 6) * 0.18;
    const motion = enemyMotionProfile({
      enemyType,
      motion: point.motion,
      levelIndex,
      levelCount: LEVELS.length
    });
    const hp = enemyType === "polluter" ? 4 + Math.floor(levelIndex / 4) : enemyType === "shield" ? 3 + Math.floor(levelIndex / 5) : 2 + Math.floor(levelIndex / 7);
    result.push({
      type: enemyType,
      kind: polluter.type,
      x: point.x,
      y: point.y,
      w: enemyType === "polluter" ? 66 : enemyType === "shield" ? 62 : 56,
      h: enemyType === "polluter" ? 42 : 36,
      hp,
      maxHp: hp,
      dir: i % 2 === 0 ? 1 : -1,
      baseX: point.x,
      baseY: point.y,
      phase: i * 0.73,
      motion: point.motion,
      speedMultiplier: motion.speedMultiplier,
      swayAmplitude: motion.swayAmplitude,
      swaySpeed: motion.swaySpeed,
      verticalDrift: motion.verticalDrift,
      leak: openingGrace + 0.7 + formationStagger + Math.random() * 1.4,
      shoot: openingGrace + formationStagger + Math.random() * 1.25
    });
  }
  return result;
}

function beginLevel(index, resetScore = false) {
  if (resetScore) score = 0;
  audio.unlock();
  running = true;
  overlay.hidden = true;
  canvas.focus();
  resetLevel(index);
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function startGame() {
  audio.unlock();
  upgrades = createUpgradeState();
  beginLevel(0, true);
}

function briefingMarkup(level, action, buttonText) {
  return `
    <div class="briefing">
      <p class="eyebrow">Level ${level.id} / ${LEVELS.length} - ${level.biome}</p>
      <h2>${level.name}</h2>
      <div class="briefing-grid">
        <div><span>Bedrohung</span><strong>${level.threat}</strong></div>
        <div><span>Umweltziel</span><strong>${level.metricLabel}</strong></div>
        <div><span>Auftrag</span><strong>${level.training ? "Training und erste Neutralisierung" : "Bedrohung stoppen"}</strong></div>
      </div>
      <p>${level.training ? "Level 1 startet bewusst mit Einzelschuss-Schrottflinte. Halte Leertaste oder Linksklick zum Schiessen. Nutze Q fuer den Reinigungspuls." : level.intro}</p>
      <button type="button" data-action="${action}">${buttonText}</button>
    </div>`;
}

function showLevelBriefing(nextIndex = levelIndex, action = "start", buttonText = "Starten") {
  const level = LEVELS[clamp(nextIndex, 0, LEVELS.length - 1)];
  overlay.innerHTML = briefingMarkup(level, action, buttonText);
  overlay.hidden = false;
}

function showResult(won, level, bonus = 0) {
  const status = pollutionStatus(state.pollution);
  const rank = won ? resultRank(state) : "-";
  const flow = resultFlow({ won, levelIndex, levelCount: LEVELS.length });
  const title = flow.final ? "Kampagne abgeschlossen" : won ? `${level.name} gesichert` : state.pollution >= 100 ? "Umweltkollaps" : "Einsatzfahrzeug kritisch";
  const body = flow.final
    ? `Alle ${LEVELS.length} Einsaetze abgeschlossen. ${level.metricLabel}: ${Math.round(100 - state.pollution)}% stabil. Finaler Rang ${rank}. Gesamt-Score ${score}.`
    : won
      ? `${level.metricLabel}: ${Math.round(100 - state.pollution)}% stabil. Rang ${rank}. Bonus ${bonus}.`
    : state.pollution >= 100
      ? `${level.threat} war zu lange aktiv. ${level.metricLabel} ist gekippt.`
      : "Dein Schild ist gefallen. Setze den Reinigungspuls frueher ein und bleib in Bewegung.";

  overlay.innerHTML = `
    <div class="briefing result">
      <p class="eyebrow">${flow.final ? "Game Over - Erde verteidigt" : won ? "Einsatz erfolgreich" : "Einsatz fehlgeschlagen"}</p>
      <h2>${title}</h2>
      <div class="briefing-grid">
        <div><span>Rang</span><strong>${rank}</strong></div>
        <div><span>Umweltstatus</span><strong style="color:${status.color}">${status.label}</strong></div>
        <div><span>Score</span><strong>${score}</strong></div>
      </div>
      <p>${body}</p>
      <button type="button" data-action="${won && !flow.final ? "upgrade" : flow.action}">${won && !flow.final ? "Upgrade waehlen" : flow.buttonText}</button>
    </div>`;
  overlay.hidden = false;
}

function showUpgradeChoice() {
  const options = upgradeOptions(levelIndex);
  overlay.innerHTML = `
    <div class="briefing result">
      <p class="eyebrow">Level-Up</p>
      <h2>System verbessern</h2>
      <p>Waehle ein Upgrade fuer den naechsten Einsatz. Waffen werden staerker, aber Gegner eskalieren weiter.</p>
      <div class="upgrade-grid">
        ${options.map((upgrade) => `
          <button class="upgrade-card" type="button" data-upgrade="${upgrade.id}">
            <strong>${upgrade.name}</strong>
            <span>${upgrade.description}</span>
          </button>
        `).join("")}
      </div>
    </div>`;
  overlay.hidden = false;
}

function chooseUpgrade(id) {
  upgrades = applyUpgrade(upgrades, id);
  audio.play("levelClear");
  beginLevel(levelIndex + 1, false);
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (running) {
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
}

function update(dt) {
  const level = LEVELS[levelIndex];
  levelElapsed += dt;
  cooldown = Math.max(0, cooldown - dt);
  skillCooldown = Math.max(0, skillCooldown - dt);
  messageTimer = Math.max(0, messageTimer - dt);

  let dx = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  player.x = clamp(player.x + dx * player.speed * dt, 32, W - 32);
  if (mouseActive) {
    player.x = clamp(player.x + (pointerX - player.x) * Math.min(1, dt * 10), 32, W - 32);
  }
  if (keys.has("Space") || mouseDown) fire();

  updateEnemies(level, dt);
  updateBullets(dt);
  updateHazards(dt);
  updateParticles(dt);

  const pollutionStep = pollutionTick({ pollutionRate: level.pollutionRate, hazardCount: hazards.length, dt });
  applyPollution(state, pollutionStep);
  if (state.pollution >= 72 || state.playerHealth <= 28) audio.playWarning();
  const failedByHealth = state.playerHealth <= 0;
  const failedByPollution = state.pollution >= 100 && levelElapsed > 18;
  if (failedByHealth || failedByPollution) endLevel(false);
  if (isLevelCleared(state)) endLevel(true);
  updateLabels();
}

function updateEnemies(level, dt) {
  const difficulty = difficultyProfile({
    levelIndex,
    levelCount: LEVELS.length,
    enemiesRemaining: state.enemiesRemaining,
    initialEnemies,
    boss: level.boss,
    training: level.training
  });
  for (const enemy of enemies) {
    const speed = difficulty.movementSpeed * (enemy.speedMultiplier ?? 1);
    enemy.baseX += enemy.dir * speed * dt;
    enemy.x = enemy.baseX + Math.sin(levelElapsed * (enemy.swaySpeed || 0) + (enemy.phase || 0)) * (enemy.swayAmplitude || 0);
    enemy.y = enemy.baseY + Math.max(0, levelElapsed - 2) * (enemy.verticalDrift || 0);
    const atEdge = enemy.x < 34 || enemy.x + enemy.w > W - 34;
    if (atEdge && !enemy.edgeLock) {
      enemy.dir *= -1;
      enemy.baseX = clamp(enemy.baseX, 34, W - 34 - enemy.w);
      enemy.baseY += difficulty.descent;
      enemy.y = enemy.baseY;
    }
    enemy.edgeLock = atEdge ? true : enemy.x > 50 && enemy.x + enemy.w < W - 50 ? false : enemy.edgeLock;

    if (!enemy.breached && enemy.y + enemy.h >= difficulty.breachY) {
      enemy.breached = true;
      state.playerHealth = clamp(state.playerHealth - difficulty.breachDamage, 0, 100);
      applyPollution(state, difficulty.breachDamage * 0.7);
      audio.play("warning");
      message = level.boss ? "Bossdruck kritisch" : "Formation zu nah an der Basis";
      messageTimer = 1.4;
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h, "#ff754a", 14);
    }

    enemy.leak -= dt;
    if (enemy.leak <= 0) {
      const phase = enemy.type === "boss" ? bossPhase({ hp: enemy.hp, maxHp: enemy.maxHp }) : null;
      enemy.leak = enemy.type === "boss"
        ? difficulty.leakPolluter * phase.leakMultiplier
        : enemy.type === "polluter" ? difficulty.leakPolluter : difficulty.leakDrone;
      spawnHazard(enemy, level);
      if (phase && phase.phase > (enemy.phaseLevel || 1)) {
        enemy.phaseLevel = phase.phase;
        message = phase.label;
        messageTimer = 1.7;
        burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff754a", 34);
      }
    }

    enemy.shoot -= dt;
    if (enemy.shoot <= 0) {
      const phase = enemy.type === "boss" ? bossPhase({ hp: enemy.hp, maxHp: enemy.maxHp }) : null;
      enemy.shoot = (difficulty.shootMin + Math.random() * difficulty.shootJitter) * (phase ? phase.shootMultiplier : 1);
      enemyBullets.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h,
        r: enemy.type === "boss" ? 8 : 5,
        vy: difficulty.enemyBulletSpeed,
        color: enemy.type === "shield" ? "#ffd166" : "#ff754a",
        damage: enemy.type === "boss" ? 3 : enemy.type === "shield" ? 3.4 : 4
      });
    }
  }
}

function spawnHazard(enemy, level) {
  const visual = pollutionVisual(level.metricLabel);
  const maxHazards = level.boss ? 72 : 88;
  if (hazards.length >= maxHazards) hazards.shift();
  hazards.push({
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h + 6,
    r: enemy.type === "boss" ? 16 : 8,
    grow: enemy.type === "boss" ? 8 : 3.5,
    shape: visual.shape,
    color: visual.color,
    alpha: 0.34
  });
}

function updateBullets(dt) {
  for (const bullet of bullets) {
    bullet.x += (bullet.vx || 0) * dt;
    bullet.y -= bullet.vy * dt;
    bullet.distance += Math.hypot((bullet.vx || 0) * dt, bullet.vy * dt);
  }
  for (const bullet of enemyBullets) bullet.y += bullet.vy * dt;
  bullets = bullets.filter((bullet) => bullet.y > -20 && bullet.distance <= bullet.range);
  enemyBullets = enemyBullets.filter((bullet) => bullet.y < H + 20);

  for (const bullet of bullets) {
    for (const enemy of enemies) {
      if (!bullet.dead && rectPoint(enemy, bullet.x, bullet.y, bullet.radius + 9)) {
        handlePlayerBulletHit(bullet, enemy);
      }
    }
  }

  for (const bullet of enemyBullets) {
    if (!bullet.dead && rectCircle(player, bullet.x, bullet.y, bullet.r)) {
      bullet.dead = true;
      state.playerHealth = clamp(state.playerHealth - (bullet.damage || 4), 0, 100);
      audio.play("playerHit");
      burst(player.x, player.y, "#ff754a", 10);
    }
  }

  enemies = enemies.filter((enemy) => !enemy.dead);
  bullets = bullets.filter((bullet) => !bullet.dead);
  enemyBullets = enemyBullets.filter((bullet) => !bullet.dead);
}

function handlePlayerBulletHit(bullet, enemy) {
  const hitX = enemy.x + enemy.w / 2;
  const hitY = enemy.y + enemy.h / 2;
  const targets = bullet.blastRadius > 0
    ? enemies
      .filter((candidate) => !candidate.dead && Math.hypot(candidate.x + candidate.w / 2 - hitX, candidate.y + candidate.h / 2 - hitY) <= bullet.blastRadius)
      .slice(0, bullet.maxTargets)
    : [enemy];

  for (const target of targets) {
    damageEnemy(target, bullet);
  }

  if (bullet.blastRadius > 0) {
    burst(hitX, hitY, "#ffd166", 24);
    audio.play("enemyDestroyed");
  } else {
    audio.play("enemyHit");
    burst(bullet.x, bullet.y, bullet.color, 6);
  }

  if (bullet.pollutionReduction) {
    state.pollution = clamp(state.pollution - bullet.pollutionReduction, 0, 100);
  }

  if (bullet.pierce > 0) {
    bullet.pierce -= 1;
  } else {
    bullet.dead = true;
  }
}

function damageEnemy(enemy, bullet) {
  const result = resolveWeaponHit({
    hp: enemy.hp,
    weapon: { id: bullet.weaponId, power: bullet.power },
    enemyKind: enemy.kind,
    enemyType: enemy.type
  });
  enemy.hp = result.hp;
  if (bullet.chain && result.destroyed) {
    const nearby = enemies.find((candidate) => candidate !== enemy && !candidate.dead && Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) < 110);
    if (nearby) {
      nearby.hp -= 0.85;
      finalizeEnemyIfDestroyed(nearby);
    }
  }
  finalizeEnemyIfDestroyed(enemy);
}

function finalizeEnemyIfDestroyed(enemy) {
  if (enemy.hp > 0 || enemy.dead) return;
  enemy.dead = true;
  score += enemy.type === "boss" ? 2500 : enemy.type === "polluter" ? 300 : 180;
  state.enemiesRemaining -= 1;
  audio.play("enemyDestroyed");
  burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffd166", 18);
}

function updateHazards(dt) {
  for (const hazard of hazards) {
    hazard.y += 24 * dt;
    hazard.r += hazard.grow * dt;
    if (Math.abs(hazard.x - player.x) < hazard.r + 28 && Math.abs(hazard.y - player.y) < hazard.r + 18) {
      state.playerHealth = clamp(state.playerHealth - 3 * dt, 0, 100);
    }
  }
  hazards = hazards.filter((hazard) => hazard.y < H + 80 && hazard.r < 48);
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

function fire() {
  if (cooldown > 0 || !running) return;
  cooldown = currentWeapon.cooldown;
  audio.play("shoot");
  spawnWeaponProjectiles(currentWeapon);
  burst(player.x, player.y - 18, "#9fffea", 3);
}

function spawnWeaponProjectiles(weapon) {
  const layouts = {
    single: [{ x: 0, vx: 0 }],
    double: [{ x: -18, vx: 0 }, { x: 18, vx: 0 }],
    triple: [{ x: -28, vx: -30 }, { x: 0, vx: 0 }, { x: 28, vx: 30 }],
    wide: [{ x: -22, vx: -75 }, { x: 22, vx: 75 }],
    beam: [{ x: 0, vx: 0 }],
    rail: [{ x: 0, vx: 0 }],
    rocket: [{ x: 0, vx: 0 }],
    chain: [{ x: -18, vx: -20 }, { x: 18, vx: 20 }],
    hybrid: [{ x: -24, vx: -28 }, { x: 0, vx: 0 }, { x: 24, vx: 28 }]
  };
  const pattern = layouts[weapon.pattern] || layouts.single;
  for (const shot of pattern) {
    bullets.push({
      x: player.x + shot.x,
      y: player.y - 24,
      vx: shot.vx,
      vy: weapon.speed,
      power: weapon.power,
      radius: weapon.radius,
      range: weapon.range,
      distance: 0,
      pierce: weapon.pierce,
      blastRadius: weapon.blastRadius,
      maxTargets: weapon.maxTargets,
      weaponId: weapon.id,
      chain: weapon.chain,
      pollutionReduction: weapon.pollutionReduction || 0,
      color: weapon.id === "bazooka" ? "#ffd166" : weapon.id === "railPulse" ? "#dffdf5" : "#9fffea"
    });
  }
}

function useSkill() {
  if (skillCooldown > 0 || !running) return;
  audio.unlock();
  skillCooldown = 5.8;
  audio.play("skill");
  state.pollution = clamp(state.pollution - 18, 0, 100);
  hazards = hazards.filter((hazard) => Math.hypot(hazard.x - player.x, hazard.y - player.y) > 190);
  burst(player.x, player.y, "#9fffea", 32);
  message = "Reinigungspuls aktiviert";
  messageTimer = 1.2;
}

function endLevel(won) {
  running = false;
  const level = LEVELS[levelIndex];
  let bonus = 0;
  if (won) {
    bonus = Math.round((100 - state.pollution) * 15 + state.playerHealth * 8);
    score += bonus;
  }
  const flow = resultFlow({ won, levelIndex, levelCount: LEVELS.length });
  audio.play(flow.final ? "campaignComplete" : won ? "levelClear" : "levelFail");
  showResult(won, level, bonus);
  updateDebugState();
}

function toggleSound() {
  audio.toggleMute();
  updateLabels();
  canvas.focus();
}

function draw() {
  const level = LEVELS[levelIndex];
  const theme = biomeTheme(level.biome);

  drawBackdrop(level, theme, levelIndex);
  drawHud(level);
  hazards.forEach(drawHazard);
  enemies.forEach((enemy) => drawEnemy(enemy, level));
  bullets.forEach(drawPlayerBullet);
  enemyBullets.forEach(drawEnemyBullet);
  drawPlayer();
  particles.forEach(drawParticle);

  if (messageTimer > 0) {
    const noticeY = H - 110;
    ctx.fillStyle = "rgba(3, 12, 14, 0.72)";
    roundRect(W / 2 - 260, noticeY, 520, 36, 8);
    ctx.fill();
    ctx.fillStyle = "#eff8f4";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, noticeY + 23);
  }
}

function comicStroke(width = 5, color = "#07171a") {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}

function shadeColor(color, amount) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return color;
  const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const next = channels.map((value) => clamp(value + amount, 0, 255).toString(16).padStart(2, "0"));
  return `#${next.join("")}`;
}

function drawComicGround(theme) {
  ctx.save();
  ctx.fillStyle = "rgba(5, 18, 20, 0.16)";
  ctx.beginPath();
  ctx.moveTo(0, 526);
  for (let x = 0; x <= W + 80; x += 96) {
    ctx.quadraticCurveTo(x + 42, 492 + (x % 3) * 10, x + 96, 526);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `${theme.accent}44`;
  comicStroke(5, theme.style.outline);
  ctx.beginPath();
  ctx.moveTo(0, 548);
  for (let x = 0; x <= W + 90; x += 112) {
    ctx.quadraticCurveTo(x + 48, 512 + (x % 4) * 7, x + 112, 548);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBackdrop(level, theme, index) {
  if (drawPaintedLevelBackdrop(index, theme)) {
    drawPaintedBackdropGrade(theme);
    drawScenarioProps(theme);
    drawArcadeTexture(theme, 0.16);
    ctx.globalAlpha = 1;
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, theme.horizon[0]);
  gradient.addColorStop(1, theme.horizon[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 4;
  for (let y = 98; y < H - 120; y += 74) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  if (theme.surface === "city" || theme.surface === "industrial") drawCityBackdrop(theme);
  else if (theme.surface === "forest") drawForestBackdrop(theme);
  else if (theme.surface === "meadow") drawMeadowBackdrop(theme);
  else if (theme.surface === "mountain") drawMountainBackdrop(theme);
  else if (theme.surface === "ice") drawIceBackdrop(theme);
  else if (theme.surface === "solar") drawSolarBackdrop(theme);
  else if (theme.surface === "reef") drawReefBackdrop(theme);
  else if (theme.surface === "wetland") drawWetlandBackdrop(theme);
  else drawWaterBackdrop(theme);

  drawComicGround(theme);
  drawScenarioThreats(level, theme);
  drawScenarioProps(theme);
  drawArcadeTexture(theme, 1);
  ctx.globalAlpha = 1;
}

function drawPaintedLevelBackdrop(index, theme) {
  const image = levelBackdropImages[index];
  canvas.dataset.artAsset = LEVEL_BACKDROP_ASSETS[index] || "";
  if (!image || !image.complete || image.naturalWidth === 0) {
    canvas.dataset.artLoaded = "false";
    return false;
  }

  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = W / H;
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = image.naturalWidth;
  let sourceH = image.naturalHeight;

  if (sourceRatio > targetRatio) {
    sourceW = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceW) / 2;
  } else if (sourceRatio < targetRatio) {
    sourceH = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceH) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, W, H);
  ctx.save();
  ctx.fillStyle = "rgba(2, 10, 12, 0.1)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  canvas.dataset.artLoaded = "true";
  return true;
}

function drawPaintedBackdropGrade(theme) {
  ctx.save();
  const topShade = ctx.createLinearGradient(0, 0, 0, H);
  topShade.addColorStop(0, "rgba(1, 8, 10, 0.04)");
  topShade.addColorStop(0.54, "rgba(1, 8, 10, 0)");
  topShade.addColorStop(1, "rgba(1, 8, 10, 0.38)");
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 3;
  for (let y = 98; y < H - 120; y += 74) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScenarioThreats(level, theme) {
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = theme.style.outline;

  if (theme.surface === "water") {
    drawBackdropTanker(64, 262, 560, 118, theme);
  } else if (theme.surface === "forest") {
    drawBackdropHarvester(638, 348, 220, 96, theme);
    drawStumps(theme);
  } else if (theme.surface === "city" || theme.surface === "industrial") {
    drawSmogStacks(theme);
  } else if (theme.surface === "meadow") {
    drawSprayerTracks(theme);
  } else if (theme.surface === "reef") {
    drawPlasticBloom(theme);
  } else if (theme.surface === "solar") {
    drawDustRigBackdrop(theme);
  } else if (theme.surface === "ice") {
    drawHeatRelayBackdrop(theme);
  } else if (theme.surface === "wetland") {
    drawToxicPipeBackdrop(theme);
  } else if (theme.surface === "mountain") {
    drawBarrelSpillBackdrop(theme);
  }

  ctx.restore();
}

function drawBackdropTanker(x, y, w, h, theme) {
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#252b2f";
  ctx.strokeStyle = theme.style.outline;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.44);
  ctx.lineTo(x + w - 42, y + h * 0.34);
  ctx.lineTo(x + w, y + h * 0.58);
  ctx.lineTo(x + w - 58, y + h);
  ctx.lineTo(x + 34, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#dffdf5";
  roundRect(x + w * 0.64, y + 4, 112, 48, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#253238";
  for (let i = 0; i < 4; i += 1) ctx.fillRect(x + w * 0.67 + i * 22, y + 18, 12, 12);
  ctx.fillStyle = "#fff3d1";
  ctx.strokeStyle = theme.style.outline;
  roundRect(x + 36, y + 12, 104, 32, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#07171a";
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("OIL", x + 88, y + 34);
  ctx.fillStyle = "#101010";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + 90 + i * 92, y + h + 16 + (i % 2) * 13, 92, 22, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 209, 102, 0.38)";
    ctx.beginPath();
    ctx.ellipse(x + 104 + i * 92, y + h + 13 + (i % 2) * 13, 44, 7, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#101010";
  }
  ctx.restore();
}

function drawBackdropHarvester(x, y, w, h, theme) {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#5b4635";
  ctx.strokeStyle = theme.style.outline;
  roundRect(x, y + 18, w, h - 24, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x + 52, y + h - 8, 28, 0, Math.PI * 2);
  ctx.arc(x + w - 48, y + h - 8, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#101820";
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI * 2 * i) / 10;
    ctx.beginPath();
    ctx.moveTo(x + 52, y + h - 8);
    ctx.lineTo(x + 52 + Math.cos(a) * 36, y + h - 8 + Math.sin(a) * 36);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStumps(theme) {
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = "#6b4a32";
  ctx.strokeStyle = theme.style.outline;
  for (let x = 62; x < W - 80; x += 138) {
    roundRect(x, 484 + (x % 3) * 9, 34, 28, 7);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawSmogStacks(theme) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#202735";
  ctx.strokeStyle = theme.style.outline;
  for (let x = 90; x < W; x += 190) {
    ctx.fillRect(x, 302, 42, 146);
    ctx.strokeRect(x, 302, 42, 146);
    ctx.fillRect(x + 58, 342, 34, 106);
    ctx.strokeRect(x + 58, 342, 34, 106);
    ctx.fillStyle = "rgba(255, 117, 74, 0.42)";
    ctx.beginPath();
    ctx.ellipse(x + 22, 284, 52, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 76, 324, 42, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#202735";
  }
  ctx.restore();
}

function drawSprayerTracks(theme) {
  ctx.save();
  ctx.globalAlpha = 0.44;
  ctx.strokeStyle = "#a4e04d";
  ctx.lineWidth = 8;
  for (let y = 428; y < 550; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 80) ctx.quadraticCurveTo(x + 34, y - 18, x + 80, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#556b2f";
  ctx.strokeStyle = theme.style.outline;
  roundRect(684, 354, 174, 58, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a4e04d";
  ctx.fillRect(824, 376, 48, 8);
  ctx.restore();
}

function drawPlasticBloom(theme) {
  ctx.save();
  ctx.globalAlpha = 0.64;
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 4;
  for (let x = 130; x < W - 80; x += 130) {
    ctx.fillStyle = x % 260 === 0 ? "#d66cff" : "#ff9f80";
    ctx.save();
    ctx.translate(x, 430 + (x % 3) * 26);
    ctx.rotate((x % 2 ? -1 : 1) * 0.24);
    roundRect(-38, -16, 76, 32, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eff8f4";
    ctx.fillRect(-22, -5, 44, 10);
    ctx.restore();
  }
  ctx.restore();
}

function drawDustRigBackdrop(theme) {
  ctx.save();
  ctx.globalAlpha = 0.68;
  ctx.fillStyle = "#7b5537";
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 4;
  roundRect(640, 330, 230, 82, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(690, 414, 30, 0, Math.PI * 2);
  ctx.arc(816, 414, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(201, 170, 82, 0.82)";
  ctx.lineWidth = 12;
  for (let y = 438; y < 540; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + 16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHeatRelayBackdrop(theme) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 4;
  ctx.fillStyle = "#516a86";
  for (let x = 118; x < W - 80; x += 210) {
    roundRect(x, 342, 76, 98, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ff8a4c";
    ctx.beginPath();
    ctx.arc(x + 38, 376, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#516a86";
  }
  ctx.strokeStyle = "rgba(255, 138, 76, 0.7)";
  ctx.lineWidth = 5;
  for (let x = 40; x < W; x += 130) {
    ctx.beginPath();
    ctx.moveTo(x, 482);
    ctx.lineTo(x + 86, 444);
    ctx.stroke();
  }
  ctx.restore();
}

function drawToxicPipeBackdrop(theme) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#3a5f50";
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 4;
  for (let x = 80; x < W; x += 240) {
    ctx.fillRect(x, 356, 170, 34);
    ctx.strokeRect(x, 356, 170, 34);
    ctx.fillRect(x + 136, 356, 34, 92);
    ctx.strokeRect(x + 136, 356, 34, 92);
    ctx.fillStyle = "#8aff62";
    ctx.beginPath();
    ctx.ellipse(x + 154, 468, 70, 20, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a5f50";
  }
  ctx.restore();
}

function drawBarrelSpillBackdrop(theme) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 4;
  for (let x = 122; x < W - 80; x += 170) {
    ctx.fillStyle = "#2a2a24";
    ctx.save();
    ctx.translate(x, 420 + (x % 2) * 28);
    ctx.rotate(-0.26);
    roundRect(-38, -24, 76, 48, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#050505";
    ctx.fillRect(-26, -6, 52, 12);
    ctx.restore();
    ctx.fillStyle = "#101010";
    ctx.beginPath();
    ctx.ellipse(x + 34, 466 + (x % 2) * 28, 72, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawArcadeTexture(theme, strength = 1) {
  ctx.save();
  ctx.globalAlpha = 0.13 * strength;
  ctx.fillStyle = theme.accent;
  for (let y = 118; y < H - 130; y += 28) {
    for (let x = (y % 56) / 2; x < W; x += 56) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 0.18 * strength;
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 88, W - 20, H - 160);
  ctx.restore();
}

function drawScenarioProps(theme) {
  if (theme.props.includes("oil-slick")) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#101010";
    for (let x = 150; x < W - 80; x += 118) {
      ctx.beginPath();
      ctx.ellipse(x, 468 + (x % 2) * 36, 58, 19, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 209, 102, 0.5)";
      ctx.beginPath();
      ctx.ellipse(x + 10, 468 + (x % 2) * 36, 32, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#101010";
    }
    ctx.restore();
  }

  if (theme.props.includes("buoy")) {
    for (let x = 84; x < W; x += 280) drawBuoy(x, 530, theme);
  }

  if (theme.props.includes("smog")) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#3f4649";
    for (let x = 60; x < W; x += 170) {
      ctx.beginPath();
      ctx.ellipse(x, 126, 58, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 42, 110, 48, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (theme.props.includes("sparks")) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#ff754a";
    for (let i = 0; i < 18; i += 1) {
      const x = 44 + i * 54;
      const y = 392 + ((i * 29) % 112);
      ctx.beginPath();
      ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (theme.props.includes("bubbles")) {
    ctx.save();
    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = "#ecfbff";
    ctx.lineWidth = 3;
    for (let i = 0; i < 20; i += 1) {
      const x = 44 + i * 52;
      const y = 360 + ((i * 41) % 170);
      ctx.beginPath();
      ctx.arc(x, y, 6 + (i % 4) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (theme.props.includes("heat")) {
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = "#ffe7a3";
    ctx.lineWidth = 4;
    for (let x = 42; x < W; x += 72) {
      ctx.beginPath();
      ctx.moveTo(x, 352);
      for (let y = 352; y < 530; y += 28) ctx.quadraticCurveTo(x + 18, y + 12, x, y + 28);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (theme.props.includes("ice-cracks")) {
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = "#376070";
    ctx.lineWidth = 4;
    for (let x = 62; x < W - 80; x += 170) {
      ctx.beginPath();
      ctx.moveTo(x, 458);
      ctx.lineTo(x + 38, 486);
      ctx.lineTo(x + 18, 522);
      ctx.lineTo(x + 72, 554);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (theme.props.includes("toxic-stream")) {
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = "#8aff62";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-40, 520);
    for (let x = 0; x <= W + 80; x += 90) ctx.quadraticCurveTo(x + 35, 482, x + 90, 520);
    ctx.stroke();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#f7b267";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  if (theme.props.includes("flowers")) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    for (let x = 28; x < W; x += 38) {
      const y = 488 + (x % 5) * 12;
      ctx.fillStyle = x % 76 === 0 ? "#fff2a8" : "#f7b267";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.arc(x + 6, y + 3, 4, 0, Math.PI * 2);
      ctx.arc(x - 5, y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#386641";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (theme.props.includes("stream")) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#9fe9ff";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(-30, 536);
    for (let x = 0; x <= W + 80; x += 100) ctx.quadraticCurveTo(x + 50, 492, x + 100, 536);
    ctx.stroke();
    ctx.restore();
  }

  if (theme.props.includes("warning-grid")) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#ffcc4d";
    ctx.lineWidth = 4;
    for (let x = -40; x < W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 506);
      ctx.lineTo(x + 88, 568);
      ctx.stroke();
    }
    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 3;
    for (let y = 498; y < 578; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBuoy(x, y, theme) {
  ctx.save();
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 3;
  ctx.fillStyle = "#ff754a";
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x - 14, y + 16);
  ctx.lineTo(x + 14, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#efffff";
  ctx.fillRect(x - 10, y - 5, 20, 8);
  ctx.restore();
}

function drawWaterBackdrop(theme) {
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = theme.detail;
  for (let x = -40; x < W; x += 150) {
    ctx.beginPath();
    ctx.ellipse(x + 76, 426, 74, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 122, 506, 110, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = theme.style.outline;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.2;
  for (let y = 410; y < 560; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 42) ctx.quadraticCurveTo(x + 18, y - 9, x + 42, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCityBackdrop(theme) {
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = theme.silhouette;
  for (let x = 16; x < W; x += 76) {
    const h = 150 + (x % 180);
    ctx.fillRect(x, 420 - h, 46, h);
    ctx.fillStyle = theme.detail;
    for (let wy = 430 - h; wy < 390; wy += 26) ctx.fillRect(x + 10, wy, 7, 10);
    ctx.fillStyle = theme.silhouette;
  }
}

function drawForestBackdrop(theme) {
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = theme.silhouette;
  for (let x = 18; x < W; x += 42) {
    triangle(x, 430, 38, 96);
    ctx.fillRect(x - 4, 420, 8, 42);
  }
}

function drawMeadowBackdrop(theme) {
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = theme.detail;
  ctx.lineWidth = 2;
  for (let x = 10; x < W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 520);
    ctx.quadraticCurveTo(x + 6, 488, x + 18, 462);
    ctx.stroke();
  }
}

function drawMountainBackdrop(theme) {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = theme.silhouette;
  for (let x = -40; x < W; x += 170) triangle(x + 110, 430, 150, 210);
  ctx.fillStyle = theme.detail;
  for (let x = -40; x < W; x += 170) triangle(x + 110, 250, 48, 66);
}

function drawIceBackdrop(theme) {
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = theme.detail;
  for (let x = 0; x < W; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 470);
    ctx.lineTo(x + 88, 450);
    ctx.lineTo(x + 146, 478);
    ctx.lineTo(x + 56, 500);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSolarBackdrop(theme) {
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = theme.detail;
  ctx.lineWidth = 3;
  for (let x = 50; x < W; x += 130) {
    ctx.strokeRect(x, 420, 78, 34);
    ctx.beginPath();
    ctx.moveTo(x + 39, 454);
    ctx.lineTo(x + 24, 488);
    ctx.moveTo(x + 39, 454);
    ctx.lineTo(x + 56, 488);
    ctx.stroke();
  }
}

function drawReefBackdrop(theme) {
  ctx.globalAlpha = 0.42;
  for (let x = 36; x < W; x += 92) {
    ctx.fillStyle = x % 184 === 0 ? theme.accent : theme.detail;
    ctx.beginPath();
    ctx.arc(x, 470, 18, 0, Math.PI * 2);
    ctx.arc(x + 24, 456, 14, 0, Math.PI * 2);
    ctx.arc(x + 42, 476, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWetlandBackdrop(theme) {
  ctx.globalAlpha = 0.36;
  ctx.strokeStyle = theme.detail;
  ctx.lineWidth = 3;
  for (let x = 18; x < W; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 510);
    ctx.lineTo(x + 8, 460);
    ctx.lineTo(x + 18, 510);
    ctx.stroke();
  }
}

function drawHud(level) {
  const status = pollutionStatus(state.pollution);
  const theme = biomeTheme(level.biome);
  comicPanel(16, 12, 292, 60, theme);
  comicPanel(W / 2 - 214, 12, 428, 66, theme);
  comicPanel(W - 354, 12, 338, 60, theme);

  bar(30, 28, 246, 16, state.playerHealth, "#41e5b4", "Energie");
  bar(W - 330, 28, 292, 16, state.pollution, status.color, level.metricLabel);

  ctx.fillStyle = "#f8fffb";
  ctx.font = "900 20px system-ui";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#07171a";
  ctx.lineWidth = 4;
  ctx.strokeText(level.name, W / 2, 35);
  ctx.fillText(level.name, W / 2, 35);
  ctx.fillStyle = "#d2e2dd";
  ctx.font = "13px system-ui";
  ctx.fillText(level.threat, W / 2, 56);
  ctx.fillStyle = "#41e5b4";
  ctx.font = "12px system-ui";
  ctx.fillText(`Ziele verbleibend: ${state.enemiesRemaining}`, W / 2, 70);
  ctx.textAlign = "right";
  ctx.fillStyle = status.color;
  ctx.fillText(status.label, W - 38, 63);
  drawSkillBar();
}

function comicPanel(x, y, w, h, theme) {
  ctx.save();
  ctx.fillStyle = "rgba(5, 18, 20, 0.78)";
  roundRect(x + 4, y + 5, w, h, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(7, 29, 32, 0.88)";
  comicStroke(4, theme.style.outline);
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + h - 8);
  ctx.lineTo(x + w - 12, y + h - 8);
  ctx.stroke();
  ctx.restore();
}

function drawSkillBar() {
  const y = H - 48;
  const slots = [
    { label: "Schuss", value: cooldown <= 0 ? "bereit" : "laedt", color: "#9fffea" },
    { label: "Reinigung Q", value: skillCooldown <= 0 ? "bereit" : `${skillCooldown.toFixed(1)}s`, color: skillCooldown <= 0 ? "#41e5b4" : "#ffd166" },
    { label: "Autofire", value: "Skill gesperrt", color: "#93a8a2" }
  ];

  ctx.fillStyle = "rgba(3, 12, 14, 0.7)";
  ctx.strokeStyle = "#08303a";
  ctx.lineWidth = 3;
  roundRect(W / 2 - 260, y - 10, 520, 42, 8);
  ctx.fill();
  ctx.stroke();
  slots.forEach((slot, index) => {
    const x = W / 2 - 240 + index * 164;
    ctx.strokeStyle = slot.color;
    ctx.lineWidth = 2;
    roundRect(x, y - 2, 146, 28, 6);
    ctx.stroke();
    ctx.fillStyle = slot.color;
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(slot.label, x + 73, y + 9);
    ctx.fillStyle = "#eff8f4";
    ctx.fillText(slot.value, x + 73, y + 22);
  });
}

function drawPlayer() {
  ctx.save();
  ctx.fillStyle = "rgba(65, 229, 180, 0.24)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 20, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  comicStroke(5, "#08303a");
  ctx.fillStyle = "#dffdf5";
  roundRect(player.x - 34, player.y - 18, 68, 36, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#efffff";
  roundRect(player.x - 20, player.y - 27, 40, 18, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#07171a";
  ctx.beginPath();
  ctx.arc(player.x - 8, player.y - 17, 3, 0, Math.PI * 2);
  ctx.arc(player.x + 8, player.y - 17, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#41e5b4";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y - 12, 9, 0.18, Math.PI - 0.18);
  ctx.stroke();
  ctx.fillStyle = "#41e5b4";
  roundRect(player.x - 22, player.y - 26, 44, 8, 4);
  ctx.fill();
  comicStroke(4, "#08303a");
  ctx.stroke();
  ctx.fillStyle = "#9fffea";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 42);
  ctx.lineTo(player.x - 12, player.y - 26);
  ctx.lineTo(player.x + 12, player.y - 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#41e5b4";
  ctx.beginPath();
  ctx.arc(player.x - 38, player.y + 7, 8, 0, Math.PI * 2);
  ctx.arc(player.x + 38, player.y + 7, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0b1f22";
  roundRect(player.x - 9, player.y - 4, 18, 11, 5);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(enemy, level) {
  const isBoss = enemy.type === "boss";
  const visual = isBoss ? polluterVisual("megaEmitter") : polluterVisual(enemy.kind);
  const roleScale = enemy.type === "polluter" ? 1.36 : enemy.type === "shield" ? 1.24 : 1.16;
  const scale = isBoss ? 1 : (visual.scale || 1) * roleScale;
  drawEnemyBody(enemy, visual, isBoss, scale);
  drawEnemyRoleMarker(enemy, visual, isBoss, scale);

  const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const sx = enemy.x + enemy.w / 2;
  const sw = enemy.w * scale;
  const showLabel = isBoss || enemy.type !== "drone" || state.enemiesRemaining <= 6;
  const label = visual.label;
  ctx.fillStyle = visual.secondary;
  ctx.strokeStyle = "#07171a";
  ctx.lineWidth = 2;
  roundRect(sx - sw / 2, enemy.y - 14, sw, 7, 3);
  ctx.stroke();
  ctx.fillRect(sx - sw / 2, enemy.y - 14, sw * hpRatio, 7);

  if (showLabel) {
    const labelW = Math.max(76, Math.min(152, label.length * 7 + 22));
    ctx.fillStyle = "rgba(5, 18, 20, 0.86)";
    ctx.strokeStyle = visual.secondary;
    ctx.lineWidth = 2;
    roundRect(sx - labelW / 2, enemy.y - 39, labelW, 20, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eff8f4";
    ctx.font = "900 11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, sx, enemy.y - 25);
  }
  drawThreatIcon(enemy.x + enemy.w + 8, enemy.y - 4, visual, isBoss ? 24 : enemy.type === "polluter" ? 21 : 18);
}

function drawEnemyRoleMarker(enemy, visual, isBoss, scale = 1) {
  const w = enemy.w * scale;
  const h = enemy.h * scale;
  const x = enemy.x + enemy.w / 2 - w / 2;
  const y = enemy.y + enemy.h / 2 - h / 2;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#07171a";
  ctx.fillStyle = visual.secondary;

  if (isBoss || enemy.type === "polluter") {
    ctx.fillStyle = "#fff3d1";
    roundRect(x + w * 0.18, y + h * 0.24, w * 0.64, h * 0.3, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.emission;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.78, w * 0.22, h * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#07171a";
    ctx.font = `900 ${isBoss ? 18 : 13}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("!", x + w * 0.5, y + h * 0.48);
  } else if (enemy.type === "shield") {
    ctx.strokeStyle = "#ffd166";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + i * 13, y + 7);
      ctx.lineTo(x + 24 + i * 13, y + h - 4);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#9fffea";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.42, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.beginPath();
    ctx.arc(x + 4, y + h * 0.48, 7, 0, Math.PI * 2);
    ctx.arc(x + w - 4, y + h * 0.48, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEnemyFace(x, y, w, h, visual, enemy, isBoss) {
  if (isBoss) return;
  ctx.save();
  const cx = x + w * 0.5;
  const eyeY = y + h * 0.4;
  const eyeGap = Math.max(10, w * 0.16);
  const eyeR = Math.max(5, Math.min(9, w * 0.09));
  ctx.fillStyle = "#fff8dc";
  comicStroke(3, "#07171a");
  ctx.beginPath();
  ctx.arc(cx - eyeGap, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(cx + eyeGap, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#07171a";
  const glare = enemy.type === "polluter" ? -2 : enemy.type === "shield" ? 0 : 2;
  ctx.beginPath();
  ctx.arc(cx - eyeGap + glare, eyeY + 1, eyeR * 0.42, 0, Math.PI * 2);
  ctx.arc(cx + eyeGap + glare, eyeY + 1, eyeR * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = visual.secondary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (enemy.type === "polluter") {
    ctx.moveTo(cx - 14, y + h * 0.67);
    ctx.quadraticCurveTo(cx, y + h * 0.56, cx + 14, y + h * 0.67);
  } else {
    ctx.moveTo(cx - 12, y + h * 0.64);
    ctx.quadraticCurveTo(cx, y + h * 0.74, cx + 12, y + h * 0.64);
  }
  ctx.stroke();
  ctx.restore();
}

function drawEnemyBody(enemy, visual, isBoss, scale = 1) {
  const w = enemy.w * scale;
  const h = enemy.h * scale;
  const x = enemy.x + enemy.w / 2 - w / 2;
  const y = enemy.y + enemy.h / 2 - h / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = visual.primary;
  comicStroke(isBoss ? 6 : 5, "#07171a");

  if (isBoss && visual.body === "tanker") {
    drawTankerBoss(x, y, w, h, visual);
    ctx.restore();
    return;
  }

  if (isBoss || visual.body === "core") {
    roundRect(x, y, isBoss ? w : w, isBoss ? h : h + 8, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, isBoss ? 18 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = visual.secondary;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawEmissionPorts(x, y, w, h, visual, isBoss ? 4 : 2);
    ctx.restore();
    return;
  }

  if (visual.body === "drone") {
    roundRect(x + 4, y + 3, w - 8, h, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shadeColor(visual.primary, 30);
    roundRect(x + 12, y + 8, w - 24, h * 0.28, 12);
    ctx.fill();
    ctx.fillStyle = visual.secondary;
    ctx.beginPath();
    ctx.arc(x + 2, y + h * 0.46, 11, 0, Math.PI * 2);
    ctx.arc(x + w - 2, y + h * 0.46, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    drawEmissionPorts(x, y, w, h, visual, 1);
    ctx.restore();
    return;
  }

  if (visual.body === "canister" || visual.body === "barrel") {
    roundRect(x + 8, y, w - 16, h + 8, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.fillRect(x + 16, y + 8, w - 32, 8);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 20, y + 20, w - 40, 12);
    drawEmissionPorts(x, y, w, h, visual, 2);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "pod") {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w * 0.42, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.42, Math.max(7, w * 0.16), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = visual.emission;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.31, 0, Math.PI * 2);
    ctx.stroke();
    drawEmissionPorts(x, y, w, h, visual, 1);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "skimmer") {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.6);
    ctx.lineTo(x + w * 0.24, y + h * 0.24);
    ctx.lineTo(x + w * 0.76, y + h * 0.24);
    ctx.lineTo(x + w - 4, y + h * 0.6);
    ctx.lineTo(x + w * 0.72, y + h + 4);
    ctx.lineTo(x + w * 0.28, y + h + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.fillRect(x + w * 0.22, y + h * 0.5, w * 0.56, 7);
    drawEmissionPorts(x, y, w, h, visual, 2);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "crate") {
    roundRect(x + 4, y + 2, w - 8, h + 4, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = visual.secondary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 10);
    ctx.lineTo(x + w - 10, y + h);
    ctx.moveTo(x + w - 10, y + 10);
    ctx.lineTo(x + 10, y + h);
    ctx.stroke();
    drawEmissionPorts(x, y, w, h, visual, 1);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "relay") {
    roundRect(x + w * 0.18, y, w * 0.64, h + 10, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.38, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = visual.secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + h * 0.2);
    ctx.lineTo(x + w - 8, y + h * 0.2);
    ctx.moveTo(x + 8, y + h * 0.74);
    ctx.lineTo(x + w - 8, y + h * 0.74);
    ctx.stroke();
    drawEmissionPorts(x, y, w, h, visual, 2);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "sawbot") {
    roundRect(x + 6, y + 4, w - 12, h - 2, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h + 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#101820";
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h + 2);
      ctx.lineTo(x + w / 2 + Math.cos(a) * 16, y + h + 2 + Math.sin(a) * 16);
      ctx.stroke();
    }
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "pipe" || visual.body === "stack") {
    ctx.fillRect(x + 15, y - 4, w - 30, h + 12);
    ctx.strokeRect(x + 15, y - 4, w - 30, h + 12);
    ctx.fillStyle = visual.secondary;
    ctx.fillRect(x + 8, y + h - 6, w - 16, 12);
    drawEmissionPorts(x, y, w, h, visual, 3);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "tank" || visual.body === "rig" || visual.body === "sprayer") {
    roundRect(x + 4, y + 6, w - 8, h - 2, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.fillRect(x + 12, y + h, w - 24, 6);
    ctx.fillRect(x + w - 12, y + 14, 18, 6);
    drawEmissionPorts(x, y, w, h, visual, 2);
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  if (visual.body === "turbine") {
    roundRect(x + 8, y + 8, w - 16, h - 8, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, 6, 20, (Math.PI * 2 * i) / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
    ctx.restore();
    return;
  }

  roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  drawEmissionPorts(x, y, w, h, visual, 1);
  drawEnemyFace(x, y, w, h, visual, enemy, isBoss);
  ctx.restore();
}

function drawTankerBoss(x, y, w, h, visual) {
  ctx.fillStyle = "rgba(16, 16, 16, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h + 20, w * 0.46, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = visual.primary;
  ctx.strokeStyle = "#07171a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + h * 0.42);
  ctx.lineTo(x + w - 46, y + h * 0.34);
  ctx.lineTo(x + w - 12, y + h * 0.58);
  ctx.lineTo(x + w - 58, y + h + 8);
  ctx.lineTo(x + 34, y + h + 8);
  ctx.lineTo(x + 6, y + h * 0.66);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#394147";
  ctx.strokeStyle = "#07171a";
  for (let i = 0; i < 4; i += 1) {
    const tx = x + 58 + i * (w * 0.15);
    roundRect(tx, y + h * 0.42, w * 0.11, h * 0.34, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = visual.secondary;
    ctx.fillRect(tx + 10, y + h * 0.5, w * 0.11 - 20, 6);
    ctx.fillStyle = "#394147";
  }

  ctx.fillStyle = "#dffdf5";
  ctx.strokeStyle = "#07171a";
  roundRect(x + w * 0.66, y + 4, w * 0.18, h * 0.36, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#253238";
  for (let i = 0; i < 3; i += 1) ctx.fillRect(x + w * 0.69 + i * 18, y + 16, 10, 10);

  ctx.fillStyle = "#30363b";
  ctx.strokeStyle = "#07171a";
  for (let i = 0; i < 2; i += 1) {
    const sx = x + w * 0.48 + i * 34;
    ctx.fillRect(sx, y + 2, 18, 44);
    ctx.strokeRect(sx, y + 2, 18, 44);
    ctx.fillStyle = "#8f9290";
    ctx.beginPath();
    ctx.ellipse(sx + 9, y - 8, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#30363b";
  }

  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 38, y + h * 0.62);
  ctx.lineTo(x + w - 68, y + h * 0.54);
  ctx.stroke();

  ctx.fillStyle = visual.emission;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.32, y + h + 15, 48, 12, -0.08, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.54, y + h + 20, 64, 15, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff3d1";
  ctx.strokeStyle = "#07171a";
  roundRect(x + 18, y + 8, 96, 28, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#07171a";
  ctx.font = "900 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("OIL", x + 66, y + 28);
}

function drawThreatIcon(x, y, visual, size = 15) {
  ctx.save();
  ctx.fillStyle = "#fff3d1";
  ctx.strokeStyle = "#07171a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = visual.secondary;
  ctx.fillStyle = visual.secondary;
  ctx.lineWidth = 3;
  if (visual.icon === "smog") {
    ctx.beginPath();
    ctx.arc(x - size * 0.4, y, size * 0.33, 0, Math.PI * 2);
    ctx.arc(x, y - size * 0.27, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y, size * 0.33, 0, Math.PI * 2);
    ctx.fill();
  } else if (visual.icon === "saw") {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.46, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * size * 0.78, y + Math.sin(a) * size * 0.78);
      ctx.stroke();
    }
  } else if (visual.icon === "oil") {
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.2, size * 0.62, size * 0.4, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (visual.icon === "spray" || visual.icon === "toxic") {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 2, y - size * 0.76, 4, size * 1.5);
  } else {
    ctx.font = "900 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("!", x, y + 5);
  }
  ctx.restore();
}

function drawEmissionPorts(x, y, w, h, visual, count) {
  ctx.fillStyle = visual.emission;
  for (let i = 0; i < count; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 16 + i * ((w - 32) / Math.max(1, count - 1)), y + h + 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHazard(hazard) {
  ctx.save();
  ctx.globalAlpha = hazard.alpha + 0.12;
  ctx.fillStyle = hazard.color;
  comicStroke(4, "#07171a");
  if (hazard.shape === "flame") {
    ctx.beginPath();
    ctx.moveTo(hazard.x, hazard.y - hazard.r * 1.7);
    ctx.quadraticCurveTo(hazard.x + hazard.r * 1.2, hazard.y, hazard.x, hazard.y + hazard.r);
    ctx.quadraticCurveTo(hazard.x - hazard.r, hazard.y, hazard.x, hazard.y - hazard.r * 1.7);
    ctx.fill();
    ctx.stroke();
  } else if (hazard.shape === "smog" || hazard.shape === "dust") {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(hazard.x + (i - 1) * hazard.r, hazard.y + (i % 2) * 4, hazard.r * 1.15, hazard.r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (hazard.shape === "plastic") {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(0.45);
    ctx.fillRect(-hazard.r, -hazard.r * 0.55, hazard.r * 2, hazard.r * 1.1);
    ctx.strokeRect(-hazard.r, -hazard.r * 0.55, hazard.r * 2, hazard.r * 1.1);
    ctx.restore();
  } else if (hazard.shape === "toxic" || hazard.shape === "heat") {
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = hazard.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, hazard.r * 1.55, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(hazard.x, hazard.y, hazard.r * 1.45, hazard.r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = hazard.alpha + 0.28;
    ctx.fillStyle = "rgba(255, 209, 102, 0.34)";
    ctx.beginPath();
    ctx.ellipse(hazard.x + hazard.r * 0.2, hazard.y - hazard.r * 0.08, hazard.r * 0.52, hazard.r * 0.18, -0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayerBullet(bullet) {
  ctx.save();
  ctx.strokeStyle = "#07171a";
  ctx.lineWidth = bullet.weaponId === "bazooka" ? 18 : bullet.weaponId === "railPulse" ? 9 : (bullet.radius || 7) + 5;
  ctx.beginPath();
  ctx.moveTo(bullet.x, bullet.y + (bullet.weaponId === "bazooka" ? 14 : 20));
  ctx.lineTo(bullet.x, bullet.y - (bullet.weaponId === "bazooka" ? 10 : 18));
  ctx.stroke();
  ctx.strokeStyle = bullet.color || "#9fffea";
  ctx.lineWidth = bullet.weaponId === "bazooka" ? 11 : bullet.weaponId === "railPulse" ? 5 : bullet.radius || 7;
  ctx.beginPath();
  ctx.moveTo(bullet.x, bullet.y + (bullet.weaponId === "bazooka" ? 14 : 20));
  ctx.lineTo(bullet.x, bullet.y - (bullet.weaponId === "bazooka" ? 10 : 18));
  ctx.stroke();
  if (bullet.blastRadius > 0) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = bullet.color || "#ffd166";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, Math.min(22, bullet.blastRadius / 3), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawEnemyBullet(bullet) {
  ctx.save();
  comicStroke(3, "#07171a");
  ctx.fillStyle = bullet.color;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff3d1";
  ctx.beginPath();
  ctx.arc(bullet.x - bullet.r * 0.28, bullet.y - bullet.r * 0.25, Math.max(2, bullet.r * 0.28), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticle(p) {
  ctx.globalAlpha = clamp(p.life, 0, 1);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x, p.y, 4, 4);
  ctx.globalAlpha = 1;
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 180;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: 0.35 + Math.random() * 0.45 });
  }
}

function bar(x, y, w, h, value, color, label) {
  ctx.fillStyle = "rgba(3, 12, 14, 0.72)";
  roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(x, y, w * clamp(value, 0, 100) / 100, h, 5);
  ctx.fill();
  ctx.fillStyle = "#d2e2dd";
  ctx.font = "12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y + h + 15);
}

function pollutionColor(value) {
  if (value > 78) return "#ff4d3d";
  if (value > 50) return "#ffd166";
  return "#41e5b4";
}

function rectPoint(rect, x, y, padding = 0) {
  return x >= rect.x - padding && x <= rect.x + rect.w + padding && y >= rect.y - padding && y <= rect.y + rect.h + padding;
}

function rectCircle(rect, x, y, r) {
  const cx = clamp(x, rect.x - rect.w / 2, rect.x + rect.w / 2);
  const cy = clamp(y, rect.y - rect.h / 2, rect.y + rect.h / 2);
  return Math.hypot(cx - x, cy - y) <= r;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function triangle(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();
}

function updateLabels() {
  const level = LEVELS[levelIndex];
  const status = pollutionStatus(state.pollution);
  levelLabel.textContent = `${level.id} / ${LEVELS.length}`;
  threatLabel.textContent = level.threat;
  environmentLabel.textContent = status.label;
  environmentLabel.style.color = status.color;
  scoreLabel.textContent = String(score);
  skillLabel.textContent = currentWeapon ? currentWeapon.name : "Basiswaffe";
  if (soundLabel) soundLabel.textContent = audio.settings.muted ? "aus" : "an";
  if (soundToggle) {
    soundToggle.textContent = audio.settings.muted ? "Sound aus" : "Sound an";
    soundToggle.setAttribute("aria-pressed", audio.settings.muted ? "true" : "false");
  }
  updateDebugState();
}

function debugSnapshot() {
  const level = LEVELS[levelIndex];
  const overlayText = overlay?.hidden ? "" : overlay?.innerText || "";
  return {
    running,
    levelIndex,
    levelId: level.id,
    levelName: level.name,
    threat: level.threat,
    weapon: currentWeapon?.name || null,
    elapsed: Math.round(levelElapsed * 10) / 10,
    playerHealth: Math.round(state.playerHealth * 10) / 10,
    pollution: Math.round(state.pollution * 10) / 10,
    enemiesRemaining: state.enemiesRemaining,
    enemyCount: enemies.length,
    hazards: hazards.length,
    enemyBullets: enemyBullets.length,
    score,
    overlayHidden: Boolean(overlay?.hidden),
    overlayText: overlayText.slice(0, 240)
  };
}

function updateDebugState() {
  if (!canvas || !state || !currentWeapon || !enemies) return;
  const snap = debugSnapshot();
  canvas.dataset.running = String(snap.running);
  canvas.dataset.level = String(snap.levelId);
  canvas.dataset.levelName = snap.levelName;
  canvas.dataset.weapon = snap.weapon || "";
  canvas.dataset.health = String(snap.playerHealth);
  canvas.dataset.pollution = String(snap.pollution);
  canvas.dataset.enemiesRemaining = String(snap.enemiesRemaining);
  canvas.dataset.enemyCount = String(snap.enemyCount);
  canvas.dataset.hazards = String(snap.hazards);
  canvas.dataset.enemyBullets = String(snap.enemyBullets);
  canvas.dataset.playerX = String(Math.round(player.x));
  canvas.dataset.bullets = String(bullets.length);
  const lowestEnemyHp = enemies.length ? Math.min(...enemies.map((enemy) => enemy.hp)) : 0;
  canvas.dataset.lowestEnemyHp = String(Math.round(lowestEnemyHp * 100) / 100);
}

window.__ecoDebug = debugSnapshot;

window.addEventListener("keydown", (event) => {
  const code = event.code || (event.key === " " ? "Space" : event.key);
  keys.add(code);
  if (code === "KeyQ" || event.key === "q") useSkill();
  if (code === "KeyR" || event.key === "r") resetLevel(levelIndex);
  if (code === "KeyM" || event.key === "m") {
    toggleSound();
  }
  if (code === "Space") {
    event.preventDefault();
    fire();
  }
});

window.addEventListener("keyup", (event) => {
  const code = event.code || (event.key === " " ? "Space" : event.key);
  keys.delete(code);
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width) * W;
  mouseActive = true;
});

canvas.addEventListener("pointerdown", (event) => {
  audio.unlock();
  const rect = canvas.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width) * W;
  player.x = clamp(pointerX, 32, W - 32);
  canvas.focus();
  mouseActive = true;
  mouseDown = true;
  if (event.button === 0) fire();
});
canvas.addEventListener("pointerleave", () => {
  mouseActive = false;
  mouseDown = false;
});
window.addEventListener("pointerup", () => {
  mouseDown = false;
});
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  useSkill();
});

overlay.addEventListener("click", (event) => {
  const action = event.target?.dataset?.action;
  const upgrade = event.target?.closest?.("[data-upgrade]")?.dataset?.upgrade;
  if (upgrade) chooseUpgrade(upgrade);
  if (action === "start") startGame();
  if (action === "restart") startGame();
  if (action === "next") beginLevel(levelIndex + 1, false);
  if (action === "upgrade") showUpgradeChoice();
});

soundToggle?.addEventListener("click", toggleSound);

resetLevel(0);
const params = new URLSearchParams(window.location.search);
const qaLevel = params.has("level") ? clamp(Number(params.get("level")) - 1, 0, LEVELS.length - 1) : 0;
if (params.get("autostart") === "1") {
  upgrades = createUpgradeState();
  beginLevel(qaLevel, true);
  const qaComplete = params.get("qaComplete");
  if (qaComplete === "win" || qaComplete === "fail") {
    window.setTimeout(() => endLevel(qaComplete === "win"), 220);
  }
} else {
  resetLevel(qaLevel);
  showLevelBriefing(qaLevel, "start", "Starten");
  draw();
}
