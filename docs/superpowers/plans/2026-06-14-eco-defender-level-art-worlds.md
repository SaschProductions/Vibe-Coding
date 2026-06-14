# Eco Defender Level Art Worlds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 10 distinct Eco Defender level art worlds defined in `docs/superpowers/specs/2026-06-14-eco-defender-level-art-bible.md`.

**Architecture:** Keep the game data-driven. Move level-specific art metadata into `src/visualConfig.js`, add focused renderer helpers in `src/game.js`, and protect the expected art hooks with static tests. Avoid large rewrites of gameplay systems while improving visible stage identity.

**Tech Stack:** HTML5 Canvas, vanilla JavaScript modules, existing Node-based test scripts.

---

## File Structure

- Modify: `src/visualConfig.js`
  - Add per-biome art direction fields: palette role names, foreground layers, pollution states, landmark props, and enemy silhouette hints.
- Modify: `src/game.js`
  - Add renderer helpers for level landmarks, foreground layers, pollution overlays, and boss-state visuals.
- Modify: `tests/visualConfig.test.mjs`
  - Assert each biome exposes complete art metadata.
- Modify: `tests/staticUi.test.mjs`
  - Assert the new renderer hooks exist and the cache version is bumped.
- Modify: `index.html`
  - Bump cache version after renderer changes.

### Task 1: Add Art Metadata To Visual Config

**Files:**
- Modify: `src/visualConfig.js`
- Test: `tests/visualConfig.test.mjs`

- [ ] **Step 1: Write the failing metadata coverage test**

Add assertions to `tests/visualConfig.test.mjs` that iterate over all current level biomes and require these keys:

```js
const requiredArtKeys = ["landmarks", "foreground", "pollutionStages", "atmosphere"];
for (const level of LEVELS) {
  const theme = biomeTheme(level.biome);
  for (const key of requiredArtKeys) {
    assert.ok(theme[key], `${level.biome} missing ${key}`);
  }
  assert.ok(theme.landmarks.length >= 2, `${level.biome} needs at least two landmarks`);
  assert.ok(theme.foreground.length >= 1, `${level.biome} needs foreground elements`);
  assert.equal(theme.pollutionStages.length, 3, `${level.biome} needs clean/load/critical stages`);
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\visualConfig.test.mjs
```

Expected: FAIL with missing `landmarks`, `foreground`, `pollutionStages`, or `atmosphere`.

- [ ] **Step 3: Add metadata to every theme**

For each entry in `THEMES`, add:

```js
landmarks: ["harbor-mole", "container-line"],
foreground: ["foam-bands", "warning-buoys"],
pollutionStages: ["clean-water", "oil-patches", "oil-slick-critical"],
atmosphere: "bright-coastal"
```

Use level-specific values from the Art Bible, for example:

```js
Wald: {
  surface: "forest",
  horizon: ["#8fd6a5", "#236b45"],
  accent: "#f4d35e",
  silhouette: "#174b33",
  detail: "#d6f7cf",
  props: ["tree-line", "stumps", "sparks"],
  landmarks: ["layered-canopy", "stump-field", "sunbeams"],
  foreground: ["moss-floor", "leaf-clumps"],
  pollutionStages: ["healthy-canopy", "spark-smoke", "burn-smoke-critical"],
  atmosphere: "warm-forest-fireline",
  style: { outline: "#123522", panel: "#efffec" }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\visualConfig.test.mjs
```

Expected: PASS with `visualConfig tests passed`.

- [ ] **Step 5: Commit**

```powershell
git add src\visualConfig.js tests\visualConfig.test.mjs
git commit -m "Add level art world metadata"
```

### Task 2: Render Distinct Level Landmarks

**Files:**
- Modify: `src/game.js`
- Test: `tests/staticUi.test.mjs`

- [ ] **Step 1: Write the failing static hook test**

Add these assertions to `tests/staticUi.test.mjs`:

```js
assert.match(game, /function drawLevelLandmarks/);
assert.match(game, /function drawForegroundLayer/);
assert.match(game, /theme\.landmarks/);
assert.match(game, /theme\.foreground/);
```

- [ ] **Step 2: Run the static test and verify it fails**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: FAIL until renderer hooks exist.

- [ ] **Step 3: Add landmark renderer hooks**

In `src/game.js`, call the new helpers from `drawBackdrop(level, theme)` after the existing surface-specific backdrop and before `drawComicGround(theme)`:

```js
drawLevelLandmarks(theme, level);
drawForegroundLayer(theme, level);
```

Add helper functions:

```js
function drawLevelLandmarks(theme, level) {
  if (!theme.landmarks) return;
  if (theme.landmarks.includes("container-line")) drawHarborLandmarks(theme);
  if (theme.landmarks.includes("layered-canopy")) drawForestLandmarks(theme);
  if (theme.landmarks.includes("coral-garden")) drawReefLandmarks(theme);
  if (theme.landmarks.includes("solar-rows")) drawSolarLandmarks(theme);
  if (theme.landmarks.includes("city-skyline")) drawCityLandmarks(theme);
  if (theme.landmarks.includes("ice-wall")) drawIceLandmarks(theme);
  if (theme.landmarks.includes("reed-bank")) drawWetlandLandmarks(theme);
  if (theme.landmarks.includes("mountain-pass")) drawMountainLandmarks(theme);
  if (theme.landmarks.includes("flower-field")) drawMeadowLandmarks(theme);
  if (theme.landmarks.includes("storm-harbor")) drawFinalHarborLandmarks(theme, level);
}

function drawForegroundLayer(theme) {
  if (!theme.foreground) return;
  if (theme.foreground.includes("foam-bands")) drawFoamBands(theme);
  if (theme.foreground.includes("moss-floor")) drawMossFloor(theme);
  if (theme.foreground.includes("reef-bubbles")) drawReefBubbles(theme);
  if (theme.foreground.includes("dust-sheets")) drawDustSheets(theme);
  if (theme.foreground.includes("street-lights")) drawStreetLights(theme);
  if (theme.foreground.includes("snow-drifts")) drawSnowDrifts(theme);
  if (theme.foreground.includes("toxic-ripples")) drawToxicRipples(theme);
  if (theme.foreground.includes("wind-lines")) drawWindLines(theme);
  if (theme.foreground.includes("grass-blades")) drawGrassBlades(theme);
  if (theme.foreground.includes("warning-waves")) drawWarningWaves(theme);
}
```

Implement each called helper with simple Canvas shapes first: silhouettes, repeated rounded rectangles, arcs, and translucent overlays. Keep each helper under 40 lines.

- [ ] **Step 4: Run syntax and static tests**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\game.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: both pass.

- [ ] **Step 5: Commit**

```powershell
git add src\game.js tests\staticUi.test.mjs
git commit -m "Render distinct level art landmarks"
```

### Task 3: Add Pollution Stage Overlays

**Files:**
- Modify: `src/game.js`
- Test: `tests/staticUi.test.mjs`

- [ ] **Step 1: Write the failing static hook test**

Add assertions:

```js
assert.match(game, /function pollutionStageForValue/);
assert.match(game, /function drawPollutionStageOverlay/);
assert.match(game, /theme\.pollutionStages/);
```

- [ ] **Step 2: Run the static test and verify it fails**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: FAIL until hooks exist.

- [ ] **Step 3: Implement stage selection**

Add:

```js
function pollutionStageForValue(value) {
  if (value >= 72) return 2;
  if (value >= 35) return 1;
  return 0;
}
```

- [ ] **Step 4: Implement overlay rendering**

Add:

```js
function drawPollutionStageOverlay(theme) {
  if (!theme.pollutionStages) return;
  const stage = pollutionStageForValue(state.pollution);
  const token = theme.pollutionStages[stage];
  if (stage === 0) return;
  ctx.save();
  ctx.globalAlpha = stage === 1 ? 0.16 : 0.28;
  ctx.fillStyle = token.includes("oil") ? "#101010" : token.includes("smoke") ? "#6f7778" : token.includes("toxic") ? "#8aff62" : "#ff754a";
  for (let i = 0; i < 7 + stage * 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(70 + i * 135, 440 + ((i * 29) % 90), 48 + stage * 20, 14 + stage * 8, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
```

Call it near the end of `drawBackdrop(level, theme)`, before `drawArcadeTexture(theme)`.

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\game.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src\game.js tests\staticUi.test.mjs
git commit -m "Show level pollution stage overlays"
```

### Task 4: Strengthen Enemy Silhouettes By Body Type

**Files:**
- Modify: `src/game.js`
- Test: `tests/staticUi.test.mjs`

- [ ] **Step 1: Add static expectations**

Add assertions:

```js
assert.match(game, /function drawSawTeeth/);
assert.match(game, /function drawSprayerNozzle/);
assert.match(game, /function drawPipeValve/);
assert.match(game, /function drawDroneRotors/);
```

- [ ] **Step 2: Run static test and verify failure**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Extract silhouette detail helpers**

Add small helpers near `drawEnemyBody`:

```js
function drawDroneRotors(x, y, w, h, visual) {
  ctx.fillStyle = visual.secondary;
  ctx.beginPath();
  ctx.arc(x + 2, y + h * 0.46, 11, 0, Math.PI * 2);
  ctx.arc(x + w - 2, y + h * 0.46, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawSawTeeth(cx, cy, radius) {
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI * 2 * i) / 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }
}

function drawSprayerNozzle(x, y, w, h, visual) {
  ctx.fillStyle = visual.secondary;
  ctx.fillRect(x + w - 10, y + h * 0.34, 22, 7);
  ctx.strokeRect(x + w - 10, y + h * 0.34, 22, 7);
}

function drawPipeValve(x, y, w, h, visual) {
  ctx.strokeStyle = visual.secondary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.38, 12, 0, Math.PI * 2);
  ctx.moveTo(x + w * 0.5 - 16, y + h * 0.38);
  ctx.lineTo(x + w * 0.5 + 16, y + h * 0.38);
  ctx.stroke();
}
```

Use these helpers inside the matching `visual.body` branches.

- [ ] **Step 4: Run tests**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\game.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src\game.js tests\staticUi.test.mjs
git commit -m "Clarify enemy silhouettes"
```

### Task 5: Make Level 10 A True Boss Screen

**Files:**
- Modify: `src/game.js`
- Test: `tests/staticUi.test.mjs`

- [ ] **Step 1: Add static boss expectations**

Add assertions:

```js
assert.match(game, /function drawBossDamagePhase/);
assert.match(game, /function drawTankerLeakPoints/);
assert.match(game, /function drawFinalAlarmLights/);
```

- [ ] **Step 2: Run static test and verify failure**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Add boss phase helpers**

Add:

```js
function drawBossDamagePhase(enemy, x, y, w, h) {
  const missingHealth = 1 - enemy.hp / Math.max(1, enemy.maxHp || enemy.hp);
  if (missingHealth > 0.25) drawTankerLeakPoints(x, y, w, h, missingHealth);
  if (missingHealth > 0.55) drawFinalAlarmLights(x, y, w, h);
}

function drawTankerLeakPoints(x, y, w, h, intensity) {
  ctx.save();
  ctx.fillStyle = "#101010";
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + w * (0.25 + i * 0.22), y + h * 0.78, 14 + intensity * 12, 6 + intensity * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFinalAlarmLights(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#ffcc4d";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(x + w * (0.18 + i * 0.16), y + h * 0.22, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
```

Call `drawBossDamagePhase(enemy, x, y, w, h)` from the tanker boss branch.

- [ ] **Step 4: Run tests**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\game.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src\game.js tests\staticUi.test.mjs
git commit -m "Make tanker finale visually escalate"
```

### Task 6: Browser Visual QA And Cache Bump

**Files:**
- Modify: `index.html`
- Modify: `src/game.js`
- Modify: `tests/staticUi.test.mjs`

- [ ] **Step 1: Bump cache version**

Replace `publish-pass-14` with `publish-pass-15` in `index.html`, imports in `src/game.js`, and expectations in `tests/staticUi.test.mjs`.

- [ ] **Step 2: Run full local tests**

Run:

```powershell
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\game.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\gameLogic.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\audio.js
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\gameLogic.test.mjs
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\levels.test.mjs
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\visualConfig.test.mjs
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\audio.test.mjs
& 'C:\Users\sasch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests\staticUi.test.mjs
```

Expected: all pass.

- [ ] **Step 3: Browser-check representative levels**

Open these URLs in the in-app browser and inspect screenshots:

```text
http://127.0.0.1:5173/?level=1&autostart=1&artpass=15
http://127.0.0.1:5173/?level=5&autostart=1&artpass=15
http://127.0.0.1:5173/?level=10&autostart=1&artpass=15
```

Expected:
- Level 1 reads as coast/harbor.
- Level 5 reads as city/smog.
- Level 10 reads as final tanker boss.

- [ ] **Step 4: Commit and push**

```powershell
git add index.html src\game.js tests\staticUi.test.mjs
git commit -m "Complete level art world renderer pass"
git push origin playtest-vertical-slice
```

## Self-Review

Spec coverage: The plan covers art metadata, landmarks, pollution stages, enemy silhouettes, the final boss screen, cache busting, tests, and browser QA.

Placeholder scan: No placeholder tasks remain. Each task includes concrete files, code shape, commands, expected outcomes, and commit messages.

Type consistency: The metadata keys are consistently named `landmarks`, `foreground`, `pollutionStages`, and `atmosphere`. Renderer hooks reference the same names.
