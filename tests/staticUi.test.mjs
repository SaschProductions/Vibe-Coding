import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const game = readFileSync("src/game.js", "utf8");

assert.match(html, /id="soundToggle"/);
assert.match(html, /aria-pressed="false"/);
assert.match(html, /Sound an/);
assert.match(html, /src\/styles\.css\?v=publish-pass-13/);
assert.match(html, /src\/game\.js\?v=publish-pass-13/);
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

console.log("static UI tests passed");
