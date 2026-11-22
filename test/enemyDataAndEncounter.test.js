const test = require("node:test");
const assert = require("node:assert/strict");
const { enemyDefinitions, encounters, createEncounterEnemies, validateEncounterData } = require("../characters/enemies");
const { validatePolicy } = require("../ai/enemyAI");
const { playHeadless } = require("../tools/lib/headless");
const { createFalconParty } = require("../characters/falcon");
const { effectiveStat } = require("../systems/statusEffects");
const { createPassiveRegistry } = require("../systems/passives/registry");
const { createBattleState } = require("../core/battleState");

const policies = {
  trainingDrone: require("../data/enemyAI/trainingDrone"),
  rogueAutomaton: require("../data/enemyAI/rogueAutomaton"),
  siegeTurret: require("../data/enemyAI/siegeTurret"),
  reconDrone: require("../data/enemyAI/reconDrone"),
  toxicStalker: require("../data/enemyAI/toxicStalker"),
  blightheartOverseer: require("../data/enemyAI/blightheartOverseer"),
  basicOnly: require("../data/enemyAI/basicOnly"),
};

test("all six enemy archetypes are data-defined with valid stats and AI policies", () => {
  assert.equal(Object.keys(enemyDefinitions).length, 6);
  for (const definition of Object.values(enemyDefinitions)) {
    assert.ok(definition.id && definition.name);
    for (const stat of ["HP", "MP", "ATK", "MPow", "DEF", "RES", "SPD"]) {
      assert.ok(Number.isFinite(definition.stats[stat]) && definition.stats[stat] >= 0, `${definition.id}.${stat}`);
    }
    assert.ok(policies[definition.aiPolicy], `${definition.id} policy`);
    assert.ok(definition.passive?.name && definition.passive?.description, `${definition.id} passive`);
    assert.ok(definition.skillSet, `${definition.id} skill set`);
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


test("standard Training Ground enemy stat totals are scaled into the approved Falcon parity bands", () => {
  const allies = createFalconParty();
  const enemies = createEncounterEnemies("trainingGround");
  const ratio = (stat) => enemies.reduce((sum, actor) => sum + actor.stats[stat], 0) /
    allies.reduce((sum, actor) => sum + actor.stats[stat], 0);
  assert.ok(ratio("HP") >= 1.10 && ratio("HP") <= 1.15);
  assert.ok(ratio("ATK") >= 1.24 && ratio("ATK") <= 1.30);
  assert.ok(ratio("MPow") >= 0.96 && ratio("MPow") <= 1.02);
  assert.ok(ratio("DEF") >= 1.06 && ratio("DEF") <= 1.12);
  assert.ok(ratio("RES") >= 1.00 && ratio("RES") <= 1.07);
  assert.ok(ratio("SPD") >= 0.97 && ratio("SPD") <= 1.03);
});

test("enemy passives modify stats and Reactive Plating activates once at its HP threshold", () => {
  const state = createBattleState({ seed: 70702 });
  const enemies = createEncounterEnemies("trainingGround");
  state.actors = enemies;
  const byId = Object.fromEntries(enemies.map((actor) => [actor.id, actor]));
  const effective = (actor, stat) => effectiveStat(state, actor, stat);

  assert.equal(effective(byId["training-drone"], "Evasion"), 12);
  assert.equal(effective(byId["recon-drone"], "Evasion"), 33);
  assert.equal(effective(byId["siege-turret"], "DEF"), Math.floor(127 * 1.15));
  assert.equal(effective(byId["siege-turret"], "SPD"), Math.floor(42 * 0.9));
  assert.equal(effective(byId["toxic-stalker"], "MPow"), Math.floor(157 * 1.12));

  const messages = [];
  const passiveRegistry = createPassiveRegistry({
    addStatus() {}, addShield() {}, alive() { return []; }, state,
    makeActor() { throw new Error("not used in this passive test"); },
    say(message) { messages.push(message); },
  });
  const rogue = byId["rogue-automaton"];
  assert.equal(effective(rogue, "DEF"), 116);
  rogue.hp = Math.floor(rogue.stats.HP * 0.55);
  passiveRegistry.dispatch(rogue, "damageTaken", { amount: 1, hpLoss: 1, kind: "direct" });
  assert.equal(rogue.passiveFlags.reactivePlatingActive, true);
  assert.equal(effective(rogue, "DEF"), Math.floor(116 * 1.2));
  const activationCount = messages.length;
  passiveRegistry.dispatch(rogue, "damageTaken", { amount: 1, hpLoss: 1, kind: "direct" });
  assert.equal(messages.length, activationCount, "Reactive Plating should activate only once");
});


test("Blightheart Sanctum registers a two-stage boss encounter with a phase-change passive", () => {
  const encounter = encounters.blightheartSanctum;
  assert.equal(validateEncounterData(encounter), true);
  assert.equal(encounter.waves.length, 2);
  assert.equal(encounter.waves.every((wave) => wave.enemies.length === 5), true);
  const finalWave = require("../characters/enemies").createEncounterWaveEnemies("blightheartSanctum", 1);
  const boss = finalWave.find((unit) => unit.id.includes("blightheart-overseer"));
  assert.ok(boss);
  assert.equal(boss.passive.id, "blightheartAwakening");
  assert.equal(boss.passiveFlags.blightheartAwakened, false);
});

test("Blightheart Awakening activates once at 55% HP and applies both phase modifiers", () => {
  const state = createBattleState({ seed: 70703 });
  const boss = require("../characters/enemies").createEncounterWaveEnemies("blightheartSanctum", 1)
    .find((unit) => unit.id.includes("blightheart-overseer"));
  state.actors = [boss];
  const messages = [];
  const passiveRegistry = createPassiveRegistry({
    addStatus() {}, addShield() {}, alive() { return []; }, state,
    makeActor() { throw new Error("not used in this passive test"); },
    say(message) { messages.push(message); },
  });
  const beforeMpow = effectiveStat(state, boss, "MPow");
  const beforeDef = effectiveStat(state, boss, "DEF");
  boss.hp = Math.floor(boss.stats.HP * 0.55);
  passiveRegistry.dispatch(boss, "damageTaken", { amount: 1, hpLoss: 1, kind: "direct" });
  assert.equal(boss.passiveFlags.blightheartAwakened, true);
  assert.equal(effectiveStat(state, boss, "MPow"), Math.floor(beforeMpow * 1.2));
  assert.equal(effectiveStat(state, boss, "DEF"), Math.floor(beforeDef * 1.15));
  const count = messages.length;
  passiveRegistry.dispatch(boss, "damageTaken", { amount: 1, hpLoss: 1, kind: "direct" });
  assert.equal(messages.length, count);
});
