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

export function pollutionStatus(value) {
  if (value >= 90) return { label: "Kollapsnah", color: "#ff4d3d" };
  if (value >= 65) return { label: "Kritisch", color: "#ff8a4c" };
  if (value >= 30) return { label: "Belastet", color: "#ffd166" };
  return { label: "Stabil", color: "#41e5b4" };
}

export function resultRank({ pollution, playerHealth }) {
  if (pollution <= 15 && playerHealth >= 85) return "S";
  if (pollution <= 35 && playerHealth >= 65) return "A";
  if (pollution <= 60 && playerHealth >= 40) return "B";
  return "C";
}

export function pollutionTick({ pollutionRate, hazardCount, dt }) {
  const base = pollutionRate * 0.58 * dt;
  const hazardPressure = Math.min(hazardCount, 16) * 0.02 * dt;
  return Math.round(Math.min(1.2, base + hazardPressure) * 100) / 100;
}
