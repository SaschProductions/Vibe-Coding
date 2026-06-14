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
  pollutionTick,
  resultFlow,
  bossPhase,
  difficultyProfile,
  enemyCountForLevel,
  enemyLayout,
  enemyMotionProfile,
  weaponForLevel,
  weaponDamage,
  resolveWeaponHit,
  upgradeOptions,
  applyUpgrade,
  upgradeWeapon
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

assert.deepEqual(difficultyProfile({ levelIndex: 0, levelCount: 10, enemiesRemaining: 4, initialEnemies: 4, boss: false, training: true }), {
  movementSpeed: 0,
  descent: 8,
  enemyBulletSpeed: 150,
  shootMin: 3.6,
  shootJitter: 2.2,
  leakPolluter: 3.2,
  leakDrone: 4.8,
  breachY: 520,
  breachDamage: 0
});
assert.deepEqual(difficultyProfile({ levelIndex: 5, levelCount: 10, enemiesRemaining: 8, initialEnemies: 16, boss: false, training: false }), {
  movementSpeed: 90,
  descent: 20,
  enemyBulletSpeed: 250,
  shootMin: 0.78,
  shootJitter: 0.85,
  leakPolluter: 0.62,
  leakDrone: 1.28,
  breachY: 500,
  breachDamage: 11
});
assert.deepEqual(difficultyProfile({ levelIndex: 9, levelCount: 10, enemiesRemaining: 1, initialEnemies: 1, boss: true, training: false }), {
  movementSpeed: 108,
  descent: 0,
  enemyBulletSpeed: 270,
  shootMin: 0.78,
  shootJitter: 0.62,
  leakPolluter: 0.58,
  leakDrone: 1.08,
  breachY: 480,
  breachDamage: 16
});
assert.equal(enemyCountForLevel({ levelIndex: 0, levelCount: 10, training: true, boss: false }), 4);
assert.equal(enemyCountForLevel({ levelIndex: 1, levelCount: 10, training: false, boss: false }), 8);
assert.equal(enemyCountForLevel({ levelIndex: 5, levelCount: 10, training: false, boss: false }), 16);
assert.equal(enemyCountForLevel({ levelIndex: 8, levelCount: 10, training: false, boss: false }), 22);
assert.equal(enemyCountForLevel({ levelIndex: 9, levelCount: 10, training: false, boss: true }), 9);

const lineLayout = enemyLayout({ formation: "line", count: 5, lane: "top", levelIndex: 1, width: 960 });
assert.equal(lineLayout.length, 5);
assert.equal(new Set(lineLayout.map((point) => point.y)).size, 1);
assert.equal(lineLayout.every((point) => point.motion === "march"), true);

const zigzagLayout = enemyLayout({ formation: "zigzag", count: 7, lane: "mixed", levelIndex: 4, width: 960 });
assert.equal(zigzagLayout.length, 7);
assert.equal(new Set(zigzagLayout.map((point) => point.y)).size > 2, true);
assert.equal(zigzagLayout.some((point) => point.motion === "weave"), true);

const swarmLayout = enemyLayout({ formation: "swarm", count: 9, lane: "top", levelIndex: 7, width: 960 });
assert.equal(swarmLayout.length, 9);
assert.equal(swarmLayout.some((point) => point.motion === "dive"), true);
assert.equal(Math.max(...swarmLayout.map((point) => point.x)) - Math.min(...swarmLayout.map((point) => point.x)) > 500, true);

const finalEscortLayout = enemyLayout({ formation: "finalCore", count: 8, lane: "mixed", levelIndex: 9, width: 960 });
assert.equal(finalEscortLayout.length, 8);
assert.equal(finalEscortLayout.filter((point) => point.type === "shield").length >= 6, true);
assert.equal(finalEscortLayout.every((point) => point.motion === "guard" || point.motion === "heavy"), true);

assert.deepEqual(enemyMotionProfile({ enemyType: "drone", motion: "weave", levelIndex: 6, levelCount: 10 }), {
  speedMultiplier: 1.32,
  swayAmplitude: 34,
  swaySpeed: 2.6,
  verticalDrift: 8
});
assert.deepEqual(enemyMotionProfile({ enemyType: "polluter", motion: "heavy", levelIndex: 6, levelCount: 10 }), {
  speedMultiplier: 0.78,
  swayAmplitude: 8,
  swaySpeed: 0.9,
  verticalDrift: 4
});
assert.deepEqual(enemyMotionProfile({ enemyType: "shield", motion: "guard", levelIndex: 6, levelCount: 10 }), {
  speedMultiplier: 0.92,
  swayAmplitude: 14,
  swaySpeed: 1.1,
  verticalDrift: 2
});

assert.deepEqual(weaponForLevel(0), {
  id: "scrapShot",
  name: "Schrottflinte",
  cooldown: 0.34,
  pattern: "single",
  projectiles: 1,
  power: 1,
  radius: 11,
  range: 560,
  speed: 560,
  pierce: 0,
  blastRadius: 0,
  maxTargets: 1
});
assert.equal(weaponForLevel(0).range >= 520, true);
assert.equal(weaponForLevel(1).id, "doublePulse");
assert.equal(weaponForLevel(4).id, "splitter");
assert.equal(weaponForLevel(7).id, "bazooka");
assert.equal(weaponForLevel(9).id, "hybridCore");
assert.equal(weaponForLevel(1).power > weaponForLevel(0).power, true);
assert.equal(weaponForLevel(4).power > weaponForLevel(1).power, true);
assert.equal(weaponForLevel(7).power > weaponForLevel(4).power, true);
assert.equal(weaponForLevel(9).power > weaponForLevel(6).power, true);

assert.equal(weaponDamage({ weaponId: "scrapShot", enemyKind: "smogDrone", enemyType: "drone" }), 1.35);
assert.equal(weaponDamage({ weaponId: "scrapShot", enemyKind: "stackBot", enemyType: "shield" }), 0.65);
assert.equal(weaponDamage({ weaponId: "bazooka", enemyKind: "leakCanister", enemyType: "polluter" }), 2.4);
assert.equal(weaponDamage({ weaponId: "railPulse", enemyKind: "stackBot", enemyType: "shield" }), 2);
assert.equal(weaponDamage({ weaponId: "cleanseBeam", enemyKind: "ashPod", enemyType: "polluter" }), 1.8);

assert.deepEqual(resolveWeaponHit({
  hp: 4,
  weapon: weaponForLevel(7),
  enemyKind: "leakCanister",
  enemyType: "polluter"
}), {
  damage: 5.76,
  hp: 0,
  destroyed: true
});
assert.deepEqual(resolveWeaponHit({
  hp: 4,
  weapon: { id: "scrapShot", power: 1 },
  enemyKind: "stackBot",
  enemyType: "shield"
}), {
  damage: 0.65,
  hp: 3.35,
  destroyed: false
});

assert.deepEqual(upgradeOptions(0).map((upgrade) => upgrade.id), ["damage", "cooldown", "cleanse"]);
assert.deepEqual(upgradeOptions(7).map((upgrade) => upgrade.id), ["blast", "pierce", "shield"]);

const upgrades = applyUpgrade({ damage: 0, cooldown: 0, cleanse: 0, blast: 0, pierce: 0, shield: 0 }, "damage");
assert.deepEqual(upgrades, { damage: 1, cooldown: 0, cleanse: 0, blast: 0, pierce: 0, shield: 0 });
const upgradedWeapon = upgradeWeapon(weaponForLevel(7), { damage: 1, cooldown: 1, cleanse: 0, blast: 1, pierce: 0, shield: 0 });
assert.equal(upgradedWeapon.power, 2.7);
assert.equal(upgradedWeapon.cooldown, 0.63);
assert.equal(upgradedWeapon.blastRadius, 90);

assert.deepEqual(resultFlow({ won: true, levelIndex: 8, levelCount: 10 }), {
  action: "next",
  buttonText: "Naechster Einsatz",
  final: false
});
assert.deepEqual(resultFlow({ won: true, levelIndex: 9, levelCount: 10 }), {
  action: "restart",
  buttonText: "Neue Kampagne",
  final: true
});
assert.deepEqual(resultFlow({ won: false, levelIndex: 9, levelCount: 10 }), {
  action: "restart",
  buttonText: "Neu starten",
  final: false
});

assert.deepEqual(bossPhase({ hp: 90, maxHp: 90 }), {
  phase: 1,
  leakMultiplier: 1,
  shootMultiplier: 1,
  label: "Tanker im Anflug"
});
assert.deepEqual(bossPhase({ hp: 50, maxHp: 90 }), {
  phase: 2,
  leakMultiplier: 0.72,
  shootMultiplier: 0.82,
  label: "Rumpf leckgeschlagen"
});
assert.deepEqual(bossPhase({ hp: 20, maxHp: 90 }), {
  phase: 3,
  leakMultiplier: 0.48,
  shootMultiplier: 0.64,
  label: "Oelkatastrophe kritisch"
});

console.log("gameLogic tests passed");
