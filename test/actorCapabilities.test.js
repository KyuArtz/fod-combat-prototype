const test = require("node:test");
const assert = require("node:assert/strict");
const { makeActor, ACTOR_CAPABILITIES } = require("../characters/actorFactory");
const { createEnemyFromDefinition, enemyDefinitions, createEncounterEnemies } = require("../characters/enemies");

const base = { id: "capability-test", name: "Capability Test", side: "ally", stats: { HP: 100, MP: 0 } };

test("actors expose neutral capability metadata when none is declared", () => {
  assert.deepEqual(makeActor(base).capabilities, []);
});

test("actor capability metadata validates, preserves order, and removes duplicate tags", () => {
  const capabilities = ["mechanical", "electronic-systems", "mechanical"];
  const actor = makeActor({ ...base, capabilities });
  assert.deepEqual(actor.capabilities, ["mechanical", "electronic-systems"]);
  assert.notEqual(actor.capabilities, capabilities, "actor metadata should not alias the source array");
  assert.ok(Object.isFrozen(ACTOR_CAPABILITIES));
});

test("actor capability metadata rejects malformed arrays and unknown tags", () => {
  assert.throws(() => makeActor({ ...base, capabilities: "mechanical" }), /expected an array/);
  assert.throws(() => makeActor({ ...base, capabilities: [null] }), /Invalid actor capability/);
  assert.throws(() => makeActor({ ...base, capabilities: ["robotic"] }), /Invalid actor capability/);
});

test("enemy capability profiles are declared only for clearly mechanical archetypes and exposed on actors", () => {
  const mechanicalIds = ["training-drone", "rogue-automaton", "siege-turret", "recon-drone"];
  for (const id of mechanicalIds) {
    assert.deepEqual(enemyDefinitions[id].capabilities, ["mechanical", "electronic-systems"]);
  }
  assert.equal(enemyDefinitions["toxic-stalker"].capabilities, undefined);
  assert.equal(enemyDefinitions["blightheart-overseer"].capabilities, undefined);
  const deployed = createEncounterEnemies("trainingGround");
  for (const id of mechanicalIds.slice(0, 3)) {
    const actor = deployed.find((unit) => unit.id === id);
    assert.deepEqual(actor.capabilities, ["mechanical", "electronic-systems"]);
  }
  assert.deepEqual(deployed.find((unit) => unit.id === "toxic-stalker").capabilities, []);
});

test("enemy-definition capability metadata is validated by the actor factory", () => {
  const malformed = { id: "bad-profile", name: "Bad Profile", capabilities: ["unknown-tag"], stats: { HP: 1, MP: 0 } };
  assert.throws(() => createEnemyFromDefinition(malformed), /Invalid actor capability/);
});
