import {
  applyPollution,
  clamp,
  createInitialState,
  isLevelCleared,
  isLevelFailed
} from "./gameLogic.js";
import { LEVELS as LEVEL_DATA } from "./content/levels.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");
const levelLabel = document.querySelector("#levelLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const skillLabel = document.querySelector("#skillLabel");

const W = canvas.width;
const H = canvas.height;

const LEVELS = LEVEL_DATA.map((level, index) => ({
  ...level,
  top: level.background.sky,
  bottom: level.background.ground,
  count: level.waves.reduce((sum, wave) => sum + wave.count, 0),
  boss: index === LEVEL_DATA.length - 1,
  pollutionRate: index === LEVEL_DATA.length - 1 ? 1.4 : 0.22 + level.targetPollution / 90
}));

const keys = new Set();
let pointerX = W / 2;
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
let autoFire = true;

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
  message = `${level.biome}: ${level.threat} stoppen`;
  messageTimer = 2.4;
  enemies = createEnemies(level);
  state = createInitialState({ playerHealth: 100, pollution: 0, enemiesRemaining: enemies.length });
  updateLabels();
}

function createEnemies(level) {
  if (level.boss) {
    return [{
      type: "boss",
      x: W / 2 - 170,
      y: 78,
      w: 340,
      h: 86,
      hp: 90,
      maxHp: 90,
      dir: 1,
      leak: 0,
      shoot: 0.8
    }];
  }

  const result = [];
  const cols = Math.min(6, Math.ceil(level.count / 2));
  for (let i = 0; i < level.count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    result.push({
      type: i % 5 === 0 ? "polluter" : i % 3 === 0 ? "shield" : "drone",
      x: 132 + col * 138,
      y: 88 + row * 76,
      w: 58,
      h: 36,
      hp: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
      maxHp: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
      dir: 1,
      leak: Math.random() * 1.8,
      shoot: Math.random() * 1.5
    });
  }
  return result;
}

function startGame() {
  running = true;
  overlay.hidden = true;
  canvas.focus();
  resetLevel(0);
  lastTime = performance.now();
  requestAnimationFrame(loop);
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
  if (autoFire || keys.has("Space") || mouseDown) fire();

  updateEnemies(level, dt);
  updateBullets(dt);
  updateHazards(dt);
  updateParticles(dt);

  const pollutionStep = Math.min(0.06, level.pollutionRate * dt + hazards.length * 0.0015);
  applyPollution(state, pollutionStep);
  const failedByHealth = state.playerHealth <= 0;
  const failedByPollution = state.pollution >= 100 && levelElapsed > 18;
  if (failedByHealth || failedByPollution) endLevel(false);
  if (isLevelCleared(state)) endLevel(true);
  updateLabels();
}

function updateEnemies(level, dt) {
  const speed = level.boss ? 86 : 42 + levelIndex * 4;
  for (const enemy of enemies) {
    enemy.x += enemy.dir * speed * dt;
    if (enemy.x < 34 || enemy.x + enemy.w > W - 34) {
      enemy.dir *= -1;
      enemy.y += level.boss ? 0 : 12;
    }

    enemy.leak -= dt;
    if (enemy.leak <= 0) {
      enemy.leak = enemy.type === "boss" ? 0.28 : enemy.type === "polluter" ? 0.75 : 1.8;
      spawnHazard(enemy, level);
    }

    enemy.shoot -= dt;
    if (enemy.shoot <= 0) {
      enemy.shoot = enemy.type === "boss" ? 0.55 : 1.4 + Math.random() * 1.4;
      enemyBullets.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h,
        r: enemy.type === "boss" ? 8 : 5,
        vy: enemy.type === "boss" ? 210 : 170,
        color: enemy.type === "shield" ? "#ffd166" : "#ff754a"
      });
    }
  }
}

function spawnHazard(enemy, level) {
  const colors = {
    "Luftqualitaet": "#8f9290",
    "Biodiversitaet": "#a4e04d",
    "Waldgesundheit": "#ff5d36",
    "Wasserqualitaet": "#8aff62",
    "Eisstabilitaet": "#9fe9ff",
    "Riffgesundheit": "#d66cff",
    "Stadtgruen": "#b9b86b",
    "Meeresverschmutzung": "#070707",
    "Muellbelastung": "#b8c0c2"
  };
  hazards.push({
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h + 6,
    r: enemy.type === "boss" ? 16 : 8,
    grow: enemy.type === "boss" ? 8 : 3.5,
    color: colors[level.metricLabel] || "#101010",
    alpha: 0.34
  });
}

function updateBullets(dt) {
  for (const bullet of bullets) bullet.y -= bullet.vy * dt;
  for (const bullet of enemyBullets) bullet.y += bullet.vy * dt;
  bullets = bullets.filter((bullet) => bullet.y > -20);
  enemyBullets = enemyBullets.filter((bullet) => bullet.y < H + 20);

  for (const bullet of bullets) {
    for (const enemy of enemies) {
      if (!bullet.dead && rectPoint(enemy, bullet.x, bullet.y)) {
        bullet.dead = true;
        enemy.hp -= bullet.power;
        burst(bullet.x, bullet.y, "#41e5b4", 6);
        if (enemy.hp <= 0) {
          enemy.dead = true;
          score += enemy.type === "boss" ? 2500 : enemy.type === "polluter" ? 300 : 180;
          state.enemiesRemaining -= 1;
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffd166", 18);
        }
      }
    }
  }

  for (const bullet of enemyBullets) {
    if (!bullet.dead && rectCircle(player, bullet.x, bullet.y, bullet.r)) {
      bullet.dead = true;
      state.playerHealth = clamp(state.playerHealth - 4, 0, 100);
      burst(player.x, player.y, "#ff754a", 10);
    }
  }

  enemies = enemies.filter((enemy) => !enemy.dead);
  bullets = bullets.filter((bullet) => !bullet.dead);
  enemyBullets = enemyBullets.filter((bullet) => !bullet.dead);
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
  cooldown = 0.16;
  bullets.push({ x: player.x - 12, y: player.y - 22, vy: 600, power: 1 });
  bullets.push({ x: player.x + 12, y: player.y - 22, vy: 600, power: 1 });
  burst(player.x, player.y - 18, "#9fffea", 3);
}

function useSkill() {
  if (skillCooldown > 0 || !running) return;
  skillCooldown = 5.8;
  state.pollution = clamp(state.pollution - 18, 0, 100);
  hazards = hazards.filter((hazard) => Math.hypot(hazard.x - player.x, hazard.y - player.y) > 190);
  burst(player.x, player.y, "#9fffea", 32);
  message = "Reinigungspuls aktiviert";
  messageTimer = 1.2;
}

function endLevel(won) {
  running = false;
  const level = LEVELS[levelIndex];
  if (won) {
    const bonus = Math.round((100 - state.pollution) * 15 + state.playerHealth * 8);
    score += bonus;
    if (levelIndex < LEVELS.length - 1) {
      overlay.innerHTML = `<h2>${level.name} gesichert</h2><p>${level.metricLabel}: ${Math.round(100 - state.pollution)}% stabil. Bonus ${bonus}.</p><button id="nextButton" type="button">Weiter</button>`;
      overlay.hidden = false;
      document.querySelector("#nextButton").addEventListener("click", () => {
        running = true;
        overlay.hidden = true;
        resetLevel(levelIndex + 1);
        lastTime = performance.now();
        requestAnimationFrame(loop);
      });
      return;
    }
  }

  overlay.innerHTML = won
    ? `<h2>Kampagne gewonnen</h2><p>Alle zehn Einsatzgebiete wurden stabilisiert. Score ${score}.</p><button id="restartButton" type="button">Neu starten</button>`
    : `<h2>${state.pollution >= 100 ? "Umweltkollaps" : "Einsatzfahrzeug kritisch"}</h2><p>${state.pollution >= 100 ? `${level.threat} war zu lange aktiv. ${level.metricLabel} ist gekippt.` : "Dein Schild ist gefallen. Setze den Reinigungspuls frueher ein und bleib in Bewegung."}</p><button id="restartButton" type="button">Neu starten</button>`;
  overlay.hidden = false;
  document.querySelector("#restartButton").addEventListener("click", () => {
    score = 0;
    running = true;
    overlay.hidden = true;
    resetLevel(0);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  });
}

function draw() {
  const level = LEVELS[levelIndex];
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, level.top);
  gradient.addColorStop(1, level.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  drawBackdrop(level);
  drawHud(level);
  hazards.forEach(drawHazard);
  enemies.forEach((enemy) => drawEnemy(enemy, level));
  bullets.forEach(drawPlayerBullet);
  enemyBullets.forEach(drawEnemyBullet);
  drawPlayer();
  particles.forEach(drawParticle);

  if (messageTimer > 0) {
    ctx.fillStyle = "rgba(3, 12, 14, 0.72)";
    roundRect(W / 2 - 230, 76, 460, 44, 8);
    ctx.fill();
    ctx.fillStyle = "#eff8f4";
    ctx.font = "20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, 105);
  }
}

function drawBackdrop(level) {
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#ffffff";
  if (level.biome.includes("Innenstadt") || level.biome.includes("Stadt")) {
    for (let x = 20; x < W; x += 76) ctx.fillRect(x, 230 - (x % 150), 44, 260);
  } else if (level.biome.includes("Wald") || level.biome.includes("Wiese")) {
    for (let x = 18; x < W; x += 58) triangle(x, 410, 28, 70);
  } else if (level.biome.includes("Gebirge")) {
    for (let x = 0; x < W; x += 160) triangle(x + 80, 410, 110, 180);
  } else {
    for (let x = -40; x < W; x += 170) {
      ctx.beginPath();
      ctx.ellipse(x + 80, 430, 80, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawHud(level) {
  bar(24, 20, 260, 18, state.playerHealth, "#41e5b4", "Energie");
  bar(W - 344, 20, 320, 18, state.pollution, pollutionColor(state.pollution), level.metricLabel);
  ctx.fillStyle = "#eff8f4";
  ctx.font = "18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${level.name}: ${level.threat}`, W / 2, 35);
  ctx.font = "13px system-ui";
  ctx.fillText(`Q Cooldown: ${skillCooldown <= 0 ? "bereit" : skillCooldown.toFixed(1) + "s"}`, W / 2, 58);
}

function drawPlayer() {
  ctx.fillStyle = "#dffdf5";
  roundRect(player.x - 28, player.y - 14, 56, 28, 8);
  ctx.fill();
  ctx.fillStyle = "#41e5b4";
  ctx.fillRect(player.x - 18, player.y - 20, 36, 8);
  ctx.fillStyle = "#0b1f22";
  ctx.fillRect(player.x - 6, player.y - 8, 12, 8);
}

function drawEnemy(enemy, level) {
  const isBoss = enemy.type === "boss";
  ctx.fillStyle = isBoss ? "#20242a" : enemy.type === "polluter" ? "#4b342b" : enemy.type === "shield" ? "#59606a" : "#26323a";
  roundRect(enemy.x, enemy.y, enemy.w, enemy.h, isBoss ? 10 : 6);
  ctx.fill();

  ctx.fillStyle = isBoss || level.threat.includes("Oel") || level.threat.includes("Tanker") ? "#050505" : "#ff754a";
  for (let i = 0; i < (isBoss ? 4 : 2); i += 1) {
    ctx.beginPath();
    ctx.arc(enemy.x + 24 + i * 74, enemy.y + enemy.h + 8, isBoss ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = enemy.type === "shield" ? "#ffd166" : "#ff754a";
  ctx.lineWidth = 3;
  ctx.strokeRect(enemy.x + 5, enemy.y + 5, enemy.w - 10, enemy.h - 10);

  const hpRatio = enemy.hp / enemy.maxHp;
  ctx.fillStyle = "#ff754a";
  ctx.fillRect(enemy.x, enemy.y - 8, enemy.w * hpRatio, 4);
}

function drawHazard(hazard) {
  ctx.globalAlpha = hazard.alpha;
  ctx.fillStyle = hazard.color;
  ctx.beginPath();
  ctx.ellipse(hazard.x, hazard.y, hazard.r * 1.45, hazard.r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlayerBullet(bullet) {
  ctx.strokeStyle = "#9fffea";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(bullet.x, bullet.y + 20);
  ctx.lineTo(bullet.x, bullet.y - 18);
  ctx.stroke();
}

function drawEnemyBullet(bullet) {
  ctx.fillStyle = bullet.color;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
  ctx.fill();
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

function rectPoint(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
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
  levelLabel.textContent = `${level.id} / ${LEVELS.length}`;
  scoreLabel.textContent = String(score);
  skillLabel.textContent = skillCooldown <= 0 ? "bereit" : `${skillCooldown.toFixed(1)}s`;
  window.ecoDebug = {
    running,
    health: Math.round(state.playerHealth),
    pollution: Math.round(state.pollution),
    enemies: enemies.length,
    hazards: hazards.length,
    level: level.name
  };
}

window.addEventListener("keydown", (event) => {
  const code = event.code || (event.key === " " ? "Space" : event.key);
  keys.add(code);
  if (code === "KeyQ" || event.key === "q") useSkill();
  if (code === "KeyR" || event.key === "r") resetLevel(levelIndex);
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
});

canvas.addEventListener("pointerdown", (event) => {
  canvas.focus();
  mouseDown = true;
  if (event.button === 0) fire();
});
window.addEventListener("pointerup", () => {
  mouseDown = false;
});
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  useSkill();
});

startButton.addEventListener("click", startGame);
resetLevel(0);
draw();
