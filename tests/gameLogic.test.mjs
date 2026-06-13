import assert from "node:assert/strict";
import {
  clamp,
  createInitialState,
  applyPollution,
  resolveHit,
  isLevelFailed,
  isLevelCleared,
  pollutionStatus,
  resultRank,
  pollutionTick
} from "../src/gameLogic.js";

assert.equal(clamp(120, 0, 100), 100);
assert.equal(clamp(-4, 0, 100), 0);
assert.equal(clamp(42, 0, 100), 42);

const state = createInitialState({ playerHealth: 80, pollution: 10, enemiesRemaining: 2 });
assert.equal(state.playerHealth, 80);
assert.equal(state.pollution, 10);
assert.equal(state.enemiesRemaining, 2);

applyPollution(state, 95);
assert.equal(state.pollution, 100);
assert.equal(isLevelFailed(state), true);

const hitState = createInitialState({ playerHealth: 30, pollution: 0, enemiesRemaining: 1 });
resolveHit(hitState, { damage: 12, pollutionReduction: 4, enemyKilled: true });
assert.equal(hitState.playerHealth, 18);
assert.equal(hitState.pollution, 0);
assert.equal(hitState.enemiesRemaining, 0);
assert.equal(isLevelCleared(hitState), true);

assert.deepEqual(pollutionStatus(12), { label: "Stabil", color: "#41e5b4" });
assert.deepEqual(pollutionStatus(44), { label: "Belastet", color: "#ffd166" });
assert.deepEqual(pollutionStatus(72), { label: "Kritisch", color: "#ff8a4c" });
assert.deepEqual(pollutionStatus(96), { label: "Kollapsnah", color: "#ff4d3d" });

assert.equal(resultRank({ pollution: 8, playerHealth: 92 }), "S");
assert.equal(resultRank({ pollution: 31, playerHealth: 71 }), "A");
assert.equal(resultRank({ pollution: 55, playerHealth: 52 }), "B");
assert.equal(resultRank({ pollution: 80, playerHealth: 25 }), "C");

assert.equal(pollutionTick({ pollutionRate: 0.6, hazardCount: 0, dt: 1 }), 0.35);
assert.equal(pollutionTick({ pollutionRate: 0.6, hazardCount: 12, dt: 1 }), 0.59);
assert.equal(pollutionTick({ pollutionRate: 4, hazardCount: 30, dt: 1 }), 1.2);

console.log("gameLogic tests passed");
