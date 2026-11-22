const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSkillData } = require("../core/skillDataValidation");
const { createDefaultEffectRegistry } = require("../systems/effects");
const { createPassiveRegistry } = require("../systems/passives/registry");
const { createSummonRegistry } = require("../systems/summons/registry");
const { createSkillInterpreter } = require("../core/skillInterpreter");
const { createPlayableRoster } = require("../characters/roster");
const { createSkills, getCharacterSkillData } = require("../characters/skills");
const { createBattleState } = require("../core/battleState");
const { makeActor } = require("../characters/actorFactory");
const { createFalconWorld, skill } = require("./helpers/falconWorld");
const { processTurnStartStatuses, addStatus } = require("../systems/statusEffects");
const formation = require("../systems/formation");

const CHARACTER_IDS = ["elishia", "evalete", "zackry", "jazen", "zenki", "mirazhel", "elishia_p", "lucaz", "clarke", "liezli"];
const ENEMY_IDS = ["trainingDrone", "rogueAutomaton", "siegeTurret", "reconDrone", "toxicStalker", "blightheartOverseer"];

function stubContext() {
  return {
    state: { actors: [], party: { roster: [], active: [], reserve: [] }, enemyParty: { roster: [], active: [], reserve: [] } },
    say() {}, pay(actor, cost) { actor.mp -= cost; }, ready: () => true,
    addStatus(target, id, data) { target.statuses[id] = { ...(target.statuses[id] || {}), ...data }; },
    addShield() {}, heal() {}, hitMastery() {}, hitPhysical() {}, makeActor,
    alive(state, side) { return state.actors.filter((actor) => actor.alive && actor.side === side); },
  };
}

test("all selectable character and enemy skill definitions validate against live effect, passive, and summon registries", () => {
  const context = stubContext();
  const effects = createDefaultEffectRegistry(context);
  const passives = createPassiveRegistry(context);
  const summons = createSummonRegistry(context);
  for (const id of [...CHARACTER_IDS, ...ENEMY_IDS]) {
    const data = id in Object.fromEntries(ENEMY_IDS.map((key) => [key, true]))
      ? require(`../data/enemySkills/${id}`)
      : getCharacterSkillData(id);
    assert.ok(data, `${id} has a skill definition`);
    assert.doesNotThrow(() => validateSkillData(data, effects, passives, summons), id);
  }
  const roster = createPlayableRoster();
  assert.deepEqual(roster.map((actor) => actor.skillSet).sort(), [...CHARACTER_IDS].sort());
  const compiled = createSkills(context);
  for (const actor of roster) assert.ok(compiled.skills[actor.skillSet]?.length === 4, `${actor.name} has four compiled abilities`);
});

test("skill-data validation rejects unknown passive and summon registry handlers before battle start", () => {
  const elishia = structuredClone(require("../characters/skillData/elishia"));
  elishia.passive.events.turnStart = [{ handler: "misspelledPassiveHandler" }];
  assert.throws(() => validateSkillData(elishia), /unknown passive handler/);

  const summonData = structuredClone(require("../characters/skillData/elishia"));
  summonData.summons.meo9.ownerTurnLifecycle.activation[0].handler = "misspelledSummonHandler";
  assert.throws(() => validateSkillData(summonData), /unknown summon handler/);

  const unknownEvent = structuredClone(require("../characters/skillData/elishia"));
  unknownEvent.passive.events.turnStatr = [{ handler: "startTimedPassive", timerKey: "x", turns: 1 }];
  assert.throws(() => validateSkillData(unknownEvent), /not a supported lifecycle event/);
});

test("mode-based ally targeting enforces faction and excludeSelf restrictions in the interpreter", () => {
  const context = stubContext();
  const interpreter = createSkillInterpreter(context);
  const data = {
    characterId: "modeTargetTest",
    skills: [{
      key: "veilMode", name: "Veil Mode", cost: 5, cooldown: 1, tags: [], targeting: "mode",
      targetFaction: "phantom", excludeSelf: true,
      modes: [
        { id: "ally", label: "Ally", targeting: "ally", effects: [{ type: "status", to: "target", id: "modeBuff", stat: "SPD", amount: 10, turns: 1 }], message: "Applied to {target}." },
        { id: "none", label: "None", targeting: "none", effects: [{ type: "statusSelf", id: "modeSelf", stat: "DEF", amount: 5, turns: 1 }], message: "Applied to {actor}." },
      ],
    }],
  };
  const [skillEntry] = interpreter.buildSkills(data);
  const actor = makeActor({ id: "mirazhel-test", name: "Mirazhel", side: "ally", faction: "phantom", stats: { HP: 100, MP: 30 } });
  const phantomAlly = makeActor({ id: "clarke-test", name: "Clarke", side: "ally", faction: "phantom", stats: { HP: 100, MP: 30 } });
  const falconAlly = makeActor({ id: "evalete-test", name: "Evalete", side: "ally", faction: "falcon", stats: { HP: 100, MP: 30 } });

  assert.equal(skillEntry.run(actor, { mode: "ally", target: falconAlly }), false);
  assert.equal(actor.mp, 30, "invalid faction target does not consume MP");
  assert.equal(skillEntry.run(actor, { mode: "ally", target: actor }), false);
  assert.equal(actor.mp, 30, "self-target is rejected in ally mode");
  assert.equal(skillEntry.run(actor, { mode: "ally", target: phantomAlly }), true);
  assert.equal(phantomAlly.statuses.modeBuff.amount, 10);
});

test("DoT source attribution survives when its applier is in reserve or has left the active actor list", () => {
  const state = createBattleState();
  const applier = makeActor({ id: "toxic-source", name: "Toxic Stalker", side: "enemy", stats: { HP: 100, MP: 0 } });
  const target = makeActor({ id: "target", name: "Target", side: "ally", stats: { HP: 100, MP: 0 } });
  state.actors = [target];
  state.enemyParty.roster = [applier];
  state.enemyParty.reserve = [applier];
  addStatus(target, "testDot", {
    dotDamage: 12, damageType: "Toxic", turns: 2, sourceId: applier.id, sourceSide: applier.side,
    turnStart: { damageField: "dotDamage", damageTypeField: "damageType" },
  });
  let observedSource;
  processTurnStartStatuses(target, {
    state, say() {},
    applyDamage: (_target, _amount, _type, sourceActor, metadata) => { observedSource = { sourceActor, metadata }; },
  });
  assert.equal(observedSource.sourceActor, applier);
  assert.deepEqual(observedSource.metadata, { kind: "dot" });
});

test("simultaneous DoTs stop resolving after the first tick incapacitates their target", () => {
  const target = makeActor({ id: "target", name: "Target", side: "ally", stats: { HP: 5, MP: 0 } });
  addStatus(target, "dotOne", { dotDamage: 6, damageType: "Toxic", turnStart: { damageField: "dotDamage", damageTypeField: "damageType" } });
  addStatus(target, "dotTwo", { dotDamage: 8, damageType: "Anomaly", turnStart: { damageField: "dotDamage", damageTypeField: "damageType" } });
  const ticks = [];
  processTurnStartStatuses(target, {
    state: { actors: [] }, say() {},
    applyDamage(actor, amount, damageType) {
      ticks.push({ amount, damageType });
      actor.hp = 0;
      actor.alive = false;
    },
  });
  assert.deepEqual(ticks, [{ amount: 6, damageType: "Toxic" }]);
});

test("owner-linked summons are dismissed when their owner is incapacitated, without destruction effects", () => {
  const world = createFalconWorld();
  const elishia = world.byId.elishia;
  const evalete = world.byId.evalete;
  assert.equal(skill(world, "elishia", "meo").run(elishia), true);
  world.skillSet.onBattleStart([evalete]);
  const meo = world.state.actors.find((actor) => actor.id === "meo-9");
  const wing = world.state.actors.find((actor) => actor.id === "catalyst-wing-evalete");
  assert.ok(meo?.alive && wing?.alive);
  world.skillSet.onUnitDefeated(elishia, {});
  world.skillSet.onUnitDefeated(evalete, {});
  assert.equal(meo.alive, false);
  assert.equal(wing.alive, false);
  assert.equal(meo.summonTurns, 0);
  assert.ok(world.events.history.some((event) => event.type === "ActorSummonExpired" && event.actorId === "meo-9" && event.reason === "owner-defeated"));
  assert.ok(!world.logs.some((line) => /EMP|Final Protocol/.test(line)));
});

test("owner-clocked summon turns and actor statuses pause while the owner is in reserve, then resume on return", () => {
  const world = createFalconWorld();
  const elishia = world.byId.elishia;
  skill(world, "elishia", "meo").run(elishia);
  const meo = world.state.actors.find((actor) => actor.id === "meo-9");
  world.skillSet.onTurnEnd(elishia); // skip deployment turn
  assert.equal(meo.summonTurns, 3);
  addStatus(elishia, "reservePauseTest", { stat: "SPD", amount: 5, turns: 2 });

  world.state.party.maxActive = 3;
  world.state.party.active = [world.byId.elishia, world.byId.evalete, world.byId.zackry];
  world.state.party.reserve = [world.byId.jazen, world.byId.zenki];
  world.state.actors = [...world.state.party.active, ...world.enemies, meo];
  const switchedOut = formation.switchPartyMember(world.state, 0, 0, "ally");
  assert.equal(switchedOut.outgoing, elishia);
  world.skillSet.onTurnEnd(world.byId.jazen);
  assert.equal(meo.summonTurns, 3, "Meo-9's owner clock does not advance while Elishia is in reserve");
  assert.equal(elishia.statuses.reservePauseTest.turns, 2, "Elishia's actor-turn status duration pauses in reserve");

  const elishiaReserveIndex = world.state.party.reserve.findIndex((actor) => actor.id === "elishia");
  formation.switchPartyMember(world.state, elishiaReserveIndex, 0, "ally");
  world.skillSet.onTurnEnd(elishia);
  assert.equal(meo.summonTurns, 2, "Meo-9 resumes its owner-clocked lifecycle when Elishia returns");
});
