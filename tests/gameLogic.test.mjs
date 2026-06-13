import assert from "node:assert/strict";
import {
  clamp,
  createInitialState,
  applyPollution,
  resolveHit,
  isLevelFailed,
  isLevelCleared
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

console.log("gameLogic tests passed");
