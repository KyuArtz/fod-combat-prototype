const test = require("node:test");
const assert = require("node:assert/strict");
const { playHeadless, DEFAULT_PARTY_ORDER } = require("../tools/lib/headless");
const { pruneIncomingPressure } = require("../core/incomingPressureTelemetry");

const baseId = (id) => String(id).replace(/#\d+$/, "");


function aggregate(records, keyFor) {
  const result = new Map();
  for (const record of records) {
    const key = keyFor(record);
    const row = result.get(key) || { damage: 0, hits: 0, bySource: {}, lastHitRound: null };
    row.damage += record.hpDamage;
    row.hits++;
    const sourceKey = baseId(record.sourceId);
    row.bySource[sourceKey] = (row.bySource[sourceKey] || 0) + record.hpDamage;
    row.lastHitRound = Math.max(row.lastHitRound ?? -Infinity, record.round);
    result.set(key, row);
  }
  return result;
}


test("rolling pressure telemetry matches DamageApplied HP-loss events across seeded battles", async () => {
  const configurations = [
    { seed: 4101, policy: "random", partyOrder: DEFAULT_PARTY_ORDER },
    { seed: 4102, policy: "random", partyOrder: [...DEFAULT_PARTY_ORDER].reverse() },
    { seed: 4103, policy: "random", partyOrder: DEFAULT_PARTY_ORDER },
    { seed: 4104, policy: "basic", partyOrder: [...DEFAULT_PARTY_ORDER].reverse() },
    { seed: 4105, policy: "basic", partyOrder: DEFAULT_PARTY_ORDER },
    { seed: 4106, policy: "basic", partyOrder: [...DEFAULT_PARTY_ORDER].reverse() },
  ];

  for (const config of configurations) {
    const battle = await playHeadless(config);
    const { state, events } = battle;
    const earliestRound = state.round - 2;
    let eventRound = 1;
    const expectedEvents = [];
    for (const event of events.history) {
      if (event.type === "RoundStarted") eventRound = event.round;
      if (event.type !== "DamageApplied" || !(event.hpLoss > 0) || !event.sourceId || !event.sourceSide) continue;
      const target = state.actors.find((actor) => actor.id === event.targetId);
      if (!target || target.side === event.sourceSide || eventRound < earliestRound || eventRound > state.round) continue;
      expectedEvents.push({ round: eventRound, targetId: event.targetId, sourceId: event.sourceId, hpDamage: event.hpLoss });
    }

    // Actor turn views prune opportunistically; validation explicitly applies the window at battle end.
    pruneIncomingPressure(state.incomingPressureTelemetry, state.round);
    const actual = aggregate(state.incomingPressureTelemetry.events, (event) => baseId(event.targetId));
    const expected = aggregate(expectedEvents, (event) => baseId(event.targetId));
    assert.deepEqual(actual, expected, `pressure telemetry diverged for seed ${config.seed} (${config.policy})`);
  }
});
