const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../core/eventBus");
const { createBattleTelemetry, safeActorSnapshot, TELEMETRY_VERSION } = require("../core/telemetry/battleTelemetry");

function actor(id, side, faction, hp = 100) {
  return { id, name: id, side, faction, alive: hp > 0, hp, mp: 20, stats: { HP: 100, MP: 20 }, shields: [], statuses: {} };
}

test("battle telemetry captures KO, healing waste, shield and decision/reserve metrics without changing events", () => {
  const events = createEventBus({ record: true });
  const attacker = actor("serpent-kane", "ally", "serpent");
  const healer = actor("serpent-verra", "ally", "serpent");
  const target = actor("falcon-target", "enemy", "falcon", 15);
  const reserve = actor("serpent-reserve", "ally", "serpent");
  const state = { round: 1, actors: [attacker, healer, target, reserve], party: { roster: [attacker, healer, reserve] }, enemyParty: { roster: [target] } };
  const telemetry = createBattleTelemetry(events, state, { includeTimeline: true });
  events.emit("ActionChosen", { actorId: attacker.id, kind: "enemy", round: 1, decision: { type: "basic", targetId: target.id } });
  events.emit("DamageApplied", { sourceId: attacker.id, sourceSide: "ally", kind: "direct", targetId: target.id, requestedAmount: 20, hpLoss: 15, absorbedAmount: 5, damageType: "Toxic" });
  target.hp = 0; target.alive = false;
  events.emit("ActorDied", { actorId: target.id, side: target.side, round: 1 });
  events.emit("Healed", { targetId: healer.id, requestedAmount: 25, healed: 5 });
  events.emit("ShieldGained", { targetId: healer.id, amount: 12, turns: 2 });
  events.emit("ReserveDeployed", { incomingId: reserve.id, defeatedId: attacker.id, side: "ally", slot: 0, round: 1 });
  events.emit("TurnStarted", { actorId: reserve.id, side: "ally", round: 1, staggered: false });
  const report = telemetry.summary();
  assert.equal(report.version, TELEMETRY_VERSION);
  assert.equal(report.totalEventCount, 7);
  assert.equal(report.koTimeline[0].lastDamageSourceId, attacker.id);
  assert.equal(report.actorMetrics[attacker.id].damageDealt, 20);
  assert.equal(report.actorMetrics[healer.id].overhealing, 20);
  assert.equal(report.actorMetrics[healer.id].shieldsGenerated, 12);
  assert.equal(report.reserveMetrics[reserve.id].turnsActive, 1);
  assert.equal(report.eventCount, 7);
  assert.ok(report.timeline[0].telemetry.snapshots.length > 0);
  assert.equal(events.history[0].telemetry, undefined, "telemetry must not mutate raw event history");
  telemetry.dispose();
});

test("snapshot helper produces serializable scalar summaries", () => {
  const a = actor("test", "ally", "serpent", 50);
  a.shields = [{ value: 9, turns: 2 }]; a.statuses = { poison: { turns: 3 } };
  const snapshot = safeActorSnapshot(a);
  assert.equal(snapshot.hpPercent, 50);
  assert.equal(snapshot.shieldTotal, 9);
  assert.deepEqual(snapshot.statuses, [{ statusId: "poison", turns: 3, stacks: null }]);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
});

test("status uptime counts affected actor turns using the tracked status ID", () => {
  const events = createEventBus({ record: true });
  const target = actor("target", "enemy", "phantom");
  target.statuses = { poison: { turns: 3 } };
  const state = { round: 1, actors: [target], party: { roster: [] }, enemyParty: { roster: [target] } };
  const telemetry = createBattleTelemetry(events, state);
  events.emit("StatusApplied", { targetId: target.id, statusId: "poison", turns: 3 });
  events.emit("TurnStarted", { actorId: target.id, side: target.side, round: 1, staggered: false });
  events.emit("TurnStarted", { actorId: target.id, side: target.side, round: 2, staggered: false });
  events.emit("StatusExpired", { actorId: target.id, statusIds: ["poison"] });
  const report = telemetry.summary();
  assert.equal(report.actorMetrics[target.id].statusTurns, 2);
  assert.equal(report.statusUptime[0].turnsActive, 2);
  telemetry.dispose();
});

test("summon damage inherits its owner's faction for fairness aggregation", () => {
  const events = createEventBus({ record: true });
  const owner = actor("owner", "ally", "serpent");
  const summon = actor("summon", "ally", null);
  summon.summon = true;
  summon.ownerId = owner.id;
  const target = actor("enemy-target", "enemy", "phantom", 80);
  const state = { round: 1, actors: [owner, summon, target], party: { roster: [owner] }, enemyParty: { roster: [target] } };
  const telemetry = createBattleTelemetry(events, state);
  events.emit("ActorSummoned", { actorId: summon.id, ownerId: owner.id, side: "ally", round: 1 });
  events.emit("DamageApplied", { sourceId: summon.id, sourceSide: "ally", kind: "direct", targetId: target.id, requestedAmount: 20, hpLoss: 20, absorbedAmount: 0, damageType: "Toxic" });
  const report = telemetry.summary();
  assert.equal(report.actorMetrics.summon.faction, "serpent");
  assert.equal(report.factionMetrics.serpent.damageDealt, 20);
  assert.equal(report.factionMetrics.phantom.damageReceived, 20);
  telemetry.dispose();
});

test("faction telemetry aggregates heuristic missed-finish target choices", () => {
  const events = createEventBus({ record: true });
  const actorA = actor("serpent-actor", "ally", "serpent");
  const lowTarget = actor("low-target", "enemy", "phantom", 10);
  const healthyTarget = actor("healthy-target", "enemy", "phantom", 100);
  const state = { round: 1, actors: [actorA, lowTarget, healthyTarget], party: { roster: [actorA] }, enemyParty: { roster: [lowTarget, healthyTarget] } };
  const telemetry = createBattleTelemetry(events, state);
  events.emit("ActionChosen", { actorId: actorA.id, kind: "enemy", round: 1, decision: { type: "basic", targetId: healthyTarget.id } });
  const report = telemetry.summary();
  assert.equal(report.actorMetrics[actorA.id].missedFinishOpportunities, 1);
  assert.equal(report.factionMetrics.serpent.missedFinishOpportunities, 1);
  telemetry.dispose();
});

test("status refresh preserves the previous uptime interval instead of overwriting it", () => {
  const events = createEventBus({ record: true });
  const target = actor("refresh-target", "enemy", "phantom");
  target.statuses = { poison: { turns: 3 } };
  const state = { round: 1, actors: [target], party: { roster: [] }, enemyParty: { roster: [target] } };
  const telemetry = createBattleTelemetry(events, state);
  events.emit("StatusApplied", { targetId: target.id, statusId: "poison", turns: 3 });
  events.emit("TurnStarted", { actorId: target.id, side: target.side, round: 1, staggered: false });
  events.emit("StatusApplied", { targetId: target.id, statusId: "poison", turns: 3 });
  events.emit("TurnStarted", { actorId: target.id, side: target.side, round: 2, staggered: false });
  events.emit("StatusExpired", { actorId: target.id, statusIds: ["poison"] });
  const report = telemetry.summary();
  assert.equal(report.actorMetrics[target.id].statusTurns, 2);
  assert.equal(report.statusUptime.length, 2);
  assert.equal(report.statusUptime[0].termination, "refreshed");
  telemetry.dispose();
});

test("faction KO telemetry separates summon losses from operative losses", () => {
  const events = createEventBus({ record: true });
  const owner = actor("ko-owner", "ally", "serpent");
  const summon = actor("ko-summon", "ally", null, 0);
  summon.summon = true;
  summon.ownerId = owner.id;
  const state = { round: 1, actors: [owner, summon], party: { roster: [owner] }, enemyParty: { roster: [] } };
  const telemetry = createBattleTelemetry(events, state);
  events.emit("ActorSummoned", { actorId: summon.id, ownerId: owner.id, side: "ally", round: 1 });
  events.emit("ActorDied", { actorId: summon.id, side: "ally", round: 1 });
  const report = telemetry.summary();
  assert.equal(report.factionMetrics.serpent.kOs, 1);
  assert.equal(report.factionMetrics.serpent.summonKOs, 1);
  assert.equal(report.factionMetrics.serpent.operativeKOs, 0);
  assert.equal(report.koTimeline[0].isSummon, true);
  telemetry.dispose();
});
