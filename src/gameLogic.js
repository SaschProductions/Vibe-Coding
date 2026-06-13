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
