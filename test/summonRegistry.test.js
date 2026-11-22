const test = require("node:test");
const assert = require("node:assert/strict");
const { createSummonRegistry } = require("../systems/summons/registry");

function context() {
  return {
    addStatus() {}, alive: () => [], heal: () => 0,
    hitMastery: () => ({ damage: 0 }), hitPhysical: () => ({ damage: 0 }),
    say() {}, state: { actors: [], battleTimers: {} },
  };
}

test("summon registry accepts new reusable handlers without changing lifecycle runtime", () => {
  const registry = createSummonRegistry(context());
  let received;
  registry.register("testPulse", (summon, subscription) => { received = [summon.id, subscription.amount]; });
  registry.dispatch({ id: "test-summon" }, [{ handler: "testPulse", amount: 12 }]);
  assert.deepEqual(received, ["test-summon", 12]);
});

test("summon registry rejects duplicate and unknown handlers", () => {
  const registry = createSummonRegistry(context());
  registry.register("testPulse", () => {});
  assert.throws(() => registry.register("testPulse", () => {}), /already registered/);
  assert.throws(() => registry.dispatch({}, [{ handler: "missing" }]), /Unknown summon handler/);
});
