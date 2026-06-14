import assert from "node:assert/strict";
import { LEVELS } from "../src/content/levels.js";
import { biomeTheme, polluterVisual } from "../src/visualConfig.js";

assert.equal(LEVELS.length, 10);
assert.deepEqual(LEVELS.map((level) => level.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const biomes = new Set(LEVELS.map((level) => level.biome));
assert.equal(biomes.size, 10);

for (const level of LEVELS) {
  assert.equal(typeof level.name, "string");
  assert.equal(level.name.length > 3, true);
  assert.equal(typeof level.threat, "string");
  assert.equal(level.threat.length > 8, true);
  assert.equal(typeof level.metricLabel, "string");
  assert.equal(level.targetPollution > 0, true);
  assert.equal(level.polluters.length >= 2, true);
  assert.equal(level.waves.length >= 3, true);
  assert.equal(biomeTheme(level.biome).surface.length > 0, true);

  for (const polluter of level.polluters) {
    const visual = polluterVisual(polluter.type);
    assert.notEqual(visual.label, "Umweltmaschine");
    assert.equal(typeof visual.icon, "string");
    assert.equal(typeof visual.body, "string");
  }
}

const finalLevel = LEVELS.at(-1);
assert.equal(finalLevel.name, "Tanker-Havarie");
assert.equal(finalLevel.polluters.some((polluter) => polluter.type === "megaEmitter"), true);
assert.equal(polluterVisual("megaEmitter").body, "tanker");
assert.equal(polluterVisual("megaEmitter").icon, "oil");

console.log("levels tests passed");
