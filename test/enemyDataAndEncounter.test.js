const test = require("node:test");
const assert = require("node:assert/strict");
const { enemyDefinitions, encounters, createEncounterEnemies, validateEncounterData } = require("../characters/enemies");
const { validatePolicy } = require("../ai/enemyAI");
const { playHeadless } = require("../tools/lib/headless");

const policies = {
  trainingDrone: require("../data/enemyAI/trainingDrone"),
  rogueAutomaton: require("../data/enemyAI/rogueAutomaton"),
  basicOnly: require("../data/enemyAI/basicOnly"),
};

test("all five enemy archetypes are data-defined with valid stats and AI policies", () => {
  assert.equal(Object.keys(enemyDefinitions).length, 5);
  for (const definition of Object.values(enemyDefinitions)) {
    assert.ok(definition.id && definition.name);
    for (const stat of ["HP", "MP", "ATK", "MPow", "DEF", "RES", "SPD"]) {
      assert.ok(Number.isFinite(definition.stats[stat]) && definition.stats[stat] >= 0, `${definition.id}.${stat}`);
    }
    assert.ok(policies[definition.aiPolicy], `${definition.id} policy`);
  }
  for (const policy of Object.values(policies)) assert.equal(validatePolicy(policy), true);
});

test("encounter definitions resolve only registered enemy archetypes", () => {
  for (const encounter of Object.values(encounters)) assert.equal(validateEncounterData(encounter), true);
  assert.deepEqual(createEncounterEnemies("trainingGround").map((actor) => actor.id), [
    "training-drone", "rogue-automaton", "siege-turret", "recon-drone", "toxic-stalker",
  ]);
  assert.deepEqual(createEncounterEnemies("droneCalibration").map((actor) => actor.id), [
    "training-drone", "recon-drone", "siege-turret", "recon-drone", "toxic-stalker",
  ]);
  assert.throws(() => createEncounterEnemies("missingEncounter"), /Unknown encounter/);
});

test("alternate data-defined encounter completes a headless battle with its configured enemies", async () => {
  const battle = await playHeadless({ seed: 70701, encounter: "droneCalibration" });
  assert.ok(["VICTORY", "DEFEAT"].includes(battle.result));
  assert.ok(battle.state.actors.some((actor) => actor.id === "training-drone"));
  assert.ok(battle.state.actors.some((actor) => actor.id === "recon-drone"));
  assert.equal(battle.state.actors.some((actor) => actor.id === "rogue-automaton"), false);
});
