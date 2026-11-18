const test = require("node:test");
const assert = require("node:assert/strict");
const { enemyDefinitions, encounters, validateEncounterData, createEncounterWaveEnemies } = require("../characters/enemies");
const { playHeadless } = require("../tools/lib/headless");

const basicParty = ["zenki", "elishia", "jazen", "evalete", "zackry"];

test("all encounters validate wave entries, reinforcement triggers and reward metadata", () => {
  for (const encounter of Object.values(encounters)) assert.equal(validateEncounterData(encounter), true);
  const invalid = {
    id: "bad",
    waves: [{ id: "too-small", enemies: ["training-drone"] }],
    reinforcements: [{ id: "bad-trigger", trigger: { type: "unknown", atLeast: 1 }, enemies: ["recon-drone"] }],
  };
  assert.throws(() => validateEncounterData(invalid), /at least five/);
  assert.throws(() => validateEncounterData({
    id: "bad-trigger",
    waves: [{ enemies: ["training-drone", "rogue-automaton", "siege-turret", "recon-drone", "toxic-stalker"] }],
    reinforcements: [{ id: "bad", trigger: { type: "unknown", atLeast: 1 }, enemies: ["recon-drone"] }],
  }), /unsupported trigger/);
});

test("wave stat overrides apply without mutating the registered enemy archetypes", () => {
  const before = structuredClone(enemyDefinitions["training-drone"].stats);
  const wave = createEncounterWaveEnemies("siegeBreakthrough", 1);
  const drone = wave.find((actor) => actor.id === "training-drone-inner-drone");
  assert.ok(drone);
  assert.equal(drone.stats.HP, 820);
  assert.equal(drone.stats.ATK, 72);
  assert.deepEqual(enemyDefinitions["training-drone"].stats, before);
});

test("Siege Breakthrough queues defeat-triggered reinforcements, advances waves and emits completion once", async () => {
  const completions = [];
  const battle = await playHeadless({
    seed: 80801,
    encounter: "siegeBreakthrough",
    partyOrder: basicParty,
    onEncounterComplete: (payload) => completions.push(payload),
  });
  const history = battle.events.history;
  const eventsOf = (type) => history.filter((event) => event.type === type);
  assert.equal(battle.result, "VICTORY");
  assert.equal(eventsOf("EncounterStarted").length, 1);
  assert.equal(eventsOf("EncounterWaveStarted").length, 2);
  assert.equal(eventsOf("EncounterWaveStarted")[1].waveId, "inner-defense");
  assert.equal(eventsOf("ReinforcementsQueued").length, 1);
  assert.equal(eventsOf("ReinforcementsQueued")[0].count, 2);
  assert.deepEqual(eventsOf("ReserveDeployed").map((event) => event.incomingId).filter((id) => id.includes("support-")), [
    "recon-drone-support-recon", "training-drone-support-drone",
  ]);
  assert.equal(eventsOf("EncounterCompleted").length, 1);
  assert.equal(completions.length, 1);
  assert.deepEqual(completions[0].rewards, { encounterClear: "siegeBreakthroughClear" });
  assert.equal(eventsOf("EncounterWaveCleared").length, 2);
});
