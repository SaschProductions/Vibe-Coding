import {
  applyPollution,
  clamp,
  createInitialState,
  isLevelCleared,
  isLevelFailed,
  pollutionTick,
  pollutionStatus,
  resultRank
} from "./gameLogic.js";
import { LEVELS as LEVEL_DATA } from "./content/levels.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const levelLabel = document.querySelector("#levelLabel");
const threatLabel = document.querySelector("#threatLabel");
const environmentLabel = document.querySelector("#environmentLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const skillLabel = document.querySelector("#skillLabel");

const W = canvas.width;
const H = canvas.height;

const LEVELS = LEVEL_DATA.map((level, index) => ({
  ...level,
  top: level.background.sky,
  bottom: level.background.ground,
  count: index === 0 ? 4 : level.waves.reduce((sum, wave) => sum + wave.count, 0),
  training: index === 0,
  boss: index === LEVEL_DATA.length - 1,
  pollutionRate: index === 0 ? 0.12 : index === LEVEL_DATA.length - 1 ? 1.4 : 0.22 + level.targetPollution / 90
}));

const keys = new Set();
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
  message = level.training ? "Training: Halte Leertaste oder Linksklick zum Schiessen" : level.intro;
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
  if (level.training) {
    const trainingPositions = [314, 438, 562, 686];
    for (let i = 0; i < trainingPositions.length; i += 1) {
      result.push({
        type: i === 0 ? "polluter" : "drone",
        x: trainingPositions[i] - 29,
        y: i < 2 ? 116 : 178,
        w: 58,
        h: 36,
        hp: 1,
        maxHp: 1,
        dir: i % 2 === 0 ? 1 : -1,
        leak: 4 + Math.random() * 2,
        shoot: 5 + Math.random() * 2
      });
    }
    return result;
  }

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
      hp: level.training ? 1 : i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
      maxHp: level.training ? 1 : i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
      dir: 1,
      leak: level.training ? 3 + Math.random() * 2 : Math.random() * 1.8,
      shoot: level.training ? 4 + Math.random() * 2 : Math.random() * 1.5
    });
  }
  return result;
}

function beginLevel(index, resetScore = false) {
  if (resetScore) score = 0;
  running = true;
  overlay.hidden = true;
  canvas.focus();
  resetLevel(index);
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function startGame() {
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
      <p>${level.training ? "Halte Leertaste oder Linksklick zum Schiessen. Nutze Q fuer den Reinigungspuls." : level.intro}</p>
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
  const title = won ? `${level.name} gesichert` : state.pollution >= 100 ? "Umweltkollaps" : "Einsatzfahrzeug kritisch";
  const body = won
    ? `${level.metricLabel}: ${Math.round(100 - state.pollution)}% stabil. Rang ${rank}. Bonus ${bonus}.`
    : state.pollution >= 100
      ? `${level.threat} war zu lange aktiv. ${level.metricLabel} ist gekippt.`
      : "Dein Schild ist gefallen. Setze den Reinigungspuls frueher ein und bleib in Bewegung.";
  const action = won && levelIndex < LEVELS.length - 1 ? "next" : "restart";
  const buttonText = won && levelIndex < LEVELS.length - 1 ? "Naechster Einsatz" : "Neu starten";

  overlay.innerHTML = `
    <div class="briefing result">
      <p class="eyebrow">${won ? "Einsatz erfolgreich" : "Einsatz fehlgeschlagen"}</p>
      <h2>${title}</h2>
      <div class="briefing-grid">
        <div><span>Rang</span><strong>${rank}</strong></div>
        <div><span>Umweltstatus</span><strong style="color:${status.color}">${status.label}</strong></div>
        <div><span>Score</span><strong>${score}</strong></div>
      </div>
      <p>${body}</p>
      <button type="button" data-action="${action}">${buttonText}</button>
    </div>`;
  overlay.hidden = false;
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
  const failedByHealth = state.playerHealth <= 0;
  const failedByPollution = state.pollution >= 100 && levelElapsed > 18;
  if (failedByHealth || failedByPollution) endLevel(false);
  if (isLevelCleared(state)) endLevel(true);
  updateLabels();
}

function updateEnemies(level, dt) {
  const speed = level.training ? 0 : level.boss ? 86 : 42 + levelIndex * 4;
  for (const enemy of enemies) {
    enemy.x += enemy.dir * speed * dt;
    if (enemy.x < 34 || enemy.x + enemy.w > W - 34) {
      enemy.dir *= -1;
      enemy.y += level.boss ? 0 : 12;
    }

    enemy.leak -= dt;
    if (enemy.leak <= 0) {
      enemy.leak = enemy.type === "boss" ? 0.28 : level.training ? 3.2 : enemy.type === "polluter" ? 0.75 : 1.8;
      spawnHazard(enemy, level);
    }

    enemy.shoot -= dt;
    if (enemy.shoot <= 0) {
      enemy.shoot = enemy.type === "boss" ? 0.55 : level.training ? 3.5 + Math.random() * 2 : 1.4 + Math.random() * 1.4;
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
    "Muellbelastung": "#b8c0c2",
    "Luftqualitaet am Hafen": "#8f9290",
    "Solarfeld-Leistung": "#c9aa52",
    "Stadtluft": "#8f9290",
    "Bachreinheit": "#8aff62",
    "Bodenleben": "#a4e04d",
    "Regionale Stabilitaet": "#ff754a"
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
      if (!bullet.dead && rectPoint(enemy, bullet.x, bullet.y, 18)) {
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
  bullets.push({ x: player.x - 26, y: player.y - 22, vy: 600, power: 1 });
  bullets.push({ x: player.x, y: player.y - 24, vy: 620, power: 1 });
  bullets.push({ x: player.x + 26, y: player.y - 22, vy: 600, power: 1 });
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
  let bonus = 0;
  if (won) {
    bonus = Math.round((100 - state.pollution) * 15 + state.playerHealth * 8);
    score += bonus;
  }
  showResult(won, level, bonus);
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
  const status = pollutionStatus(state.pollution);
  ctx.fillStyle = "rgba(3, 12, 14, 0.62)";
  roundRect(16, 12, 292, 60, 8);
  ctx.fill();
  roundRect(W / 2 - 214, 12, 428, 60, 8);
  ctx.fill();
  roundRect(W - 354, 12, 338, 60, 8);
  ctx.fill();

  bar(30, 28, 246, 16, state.playerHealth, "#41e5b4", "Energie");
  bar(W - 330, 28, 292, 16, state.pollution, status.color, level.metricLabel);

  ctx.fillStyle = "#eff8f4";
  ctx.font = "18px system-ui";
  ctx.textAlign = "center";
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

function drawSkillBar() {
  const y = H - 48;
  const slots = [
    { label: "Schuss", value: cooldown <= 0 ? "bereit" : "laedt", color: "#9fffea" },
    { label: "Reinigung Q", value: skillCooldown <= 0 ? "bereit" : `${skillCooldown.toFixed(1)}s`, color: skillCooldown <= 0 ? "#41e5b4" : "#ffd166" },
    { label: "Autofire", value: "Skill gesperrt", color: "#93a8a2" }
  ];

  ctx.fillStyle = "rgba(3, 12, 14, 0.58)";
  roundRect(W / 2 - 260, y - 10, 520, 42, 8);
  ctx.fill();
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
  skillLabel.textContent = skillCooldown <= 0 ? "bereit" : `${skillCooldown.toFixed(1)}s`;
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
  mouseActive = true;
});

canvas.addEventListener("pointerdown", (event) => {
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
  if (action === "start") startGame();
  if (action === "restart") startGame();
  if (action === "next") beginLevel(levelIndex + 1, false);
});

resetLevel(0);
showLevelBriefing(0, "start", "Starten");
draw();
