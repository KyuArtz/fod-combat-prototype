const test = require("node:test");
const assert = require("node:assert/strict");
const { createIncomingPressureTelemetry, recordIncomingDamage, getIncomingPressure } = require("../core/incomingPressureTelemetry");
const { buildTurnView } = require("../core/turnView");
const record = (telemetry, round, targetId, sourceId, hpDamage) => recordIncomingDamage(telemetry, { round, targetId, sourceId, hpDamage });

test("aggregates HP damage and individual hits by source", () => {
  const telemetry = createIncomingPressureTelemetry();
  record(telemetry, 1, "verra", "phantom-a", 12); record(telemetry, 1, "verra", "phantom-a", 7); record(telemetry, 2, "verra", "phantom-b", 20);
  assert.deepEqual(getIncomingPressure(telemetry, "verra", 2), { recentDamage: 39, recentHits: 3, window: 3, damageBySource: { "phantom-a": 19, "phantom-b": 20 }, lastHitRound: 2 });
});

test("prunes outside the rolling three-round window", () => {
  const telemetry = createIncomingPressureTelemetry();
  record(telemetry, 1, "verra", "enemy", 5); record(telemetry, 2, "verra", "enemy", 10); record(telemetry, 4, "verra", "enemy", 15);
  assert.deepEqual(getIncomingPressure(telemetry, "verra", 4), { recentDamage: 25, recentHits: 2, window: 3, damageBySource: { enemy: 25 }, lastHitRound: 4 });
});

test("ignores invalid and non-positive damage", () => {
  const telemetry = createIncomingPressureTelemetry();
  record(telemetry, 1, "verra", "enemy", 0); record(telemetry, 1, "verra", "enemy", -2); record(telemetry, 1, "verra", "enemy", NaN);
  recordIncomingDamage(telemetry, { round: 1, targetId: "verra", sourceId: "enemy" });
  assert.deepEqual(getIncomingPressure(telemetry, "verra", 1), { recentDamage: 0, recentHits: 0, window: 3, damageBySource: {}, lastHitRound: null });
});

test("AI view exposes actor-specific pressure as an isolated snapshot", () => {
  const telemetry = createIncomingPressureTelemetry(); record(telemetry, 1, "verra", "phantom", 30); record(telemetry, 1, "zenki", "phantom", 8);
  const actor = { id: "verra", name: "Verra", side: "ally", faction: "Serpents", role: "Support", skillSet: "verra", summon: false, hp: 70, stats: { HP: 100, MP: 50 }, mp: 20, cr: 100, statuses: {}, shields: [], cooldowns: {} };
  const state = { actors: [actor], round: 1, party: { active: [actor], reserve: [], roster: [] }, enemyParty: { active: [], reserve: [], roster: [] }, incomingPressureTelemetry: telemetry };
  const view = buildTurnView({ state, actor, skills: {}, describeEnemySkills: () => [], ready: () => true, alive: () => [actor] });
  assert.deepEqual(view.actor.incomingPressure, { recentDamage: 30, recentHits: 1, window: 3, damageBySource: { phantom: 30 }, lastHitRound: 1 });
  view.actor.incomingPressure.damageBySource.phantom = 999;
  assert.equal(getIncomingPressure(telemetry, "verra", 1).damageBySource.phantom, 30);
});

test("telemetry factory initializes independently for each battle", () => {
  const previous = createIncomingPressureTelemetry(); record(previous, 1, "verra", "enemy", 42);
  const next = createIncomingPressureTelemetry();
  assert.deepEqual(getIncomingPressure(next, "verra", 1), { recentDamage: 0, recentHits: 0, window: 3, damageBySource: {}, lastHitRound: null });
});
