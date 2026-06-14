import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const game = readFileSync("src/game.js", "utf8");

assert.match(html, /id="soundToggle"/);
assert.match(html, /aria-pressed="false"/);
assert.match(html, /Sound an/);
assert.match(html, /src\/styles\.css\?v=publish-pass-15/);
assert.match(html, /src\/game\.js\?v=publish-pass-15/);
assert.match(game, /params\.get\("autostart"\) === "1"/);
assert.match(game, /params\.has\("level"\)/);
assert.match(game, /params\.get\("qaComplete"\)/);
assert.match(game, /window\.__ecoDebug = debugSnapshot/);
assert.match(game, /canvas\.dataset\.pollution/);
assert.match(game, /canvas\.dataset\.enemiesRemaining/);
assert.match(game, /canvas\.dataset\.lowestEnemyHp/);
assert.match(game, /overlayText: overlayText\.slice\(0, 240\)/);
assert.match(game, /theme\.props\.includes\("warning-grid"\)/);
assert.match(game, /theme\.props\.includes\("toxic-stream"\)/);
assert.match(game, /theme\.props\.includes\("ice-cracks"\)/);
assert.match(game, /const openingGrace = 1\.4 \+ Math\.min\(levelIndex, 8\) \* 0\.06/);
assert.match(game, /const formationStagger = \(i % 6\) \* 0\.18/);
assert.match(game, /atEdge && !enemy\.edgeLock/);
assert.match(game, /function comicStroke/);
assert.match(game, /function drawEnemyFace/);
assert.match(game, /function drawComicGround/);
assert.match(game, /const LEVEL_BACKDROP_ASSETS/);
assert.match(game, /function drawPaintedLevelBackdrop/);
assert.match(game, /canvas\.dataset\.artLoaded = "true"/);

for (let i = 1; i <= 10; i += 1) {
  const prefix = String(i).padStart(2, "0");
  assert.match(game, new RegExp(`assets/levels/level-${prefix}-`));
}

[
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
].forEach((asset) => assert.equal(existsSync(asset), true, `${asset} missing`));

console.log("static UI tests passed");
