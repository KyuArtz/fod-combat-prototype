const test = require("node:test");
const assert = require("node:assert/strict");
const { createFalconParty } = require("../characters/falcon");
const { createPhantomParty } = require("../characters/phantom");
const { makeActor } = require("../characters/actorFactory");
const formation = require("../systems/formation");
const { addShield } = require("../systems/shields");
const { heal } = require("../systems/damageApplication");
const { createPassiveRegistry } = require("../systems/passives/registry");
const { createDefaultEffectHandlers } = require("../systems/effects/defaultHandlers");
const { createSummonRegistry } = require("../systems/summons/registry");
const { processBattleTimerTurnStart } = require("../systems/battleTimers");

test("Catalyst Wing belongs to Evalete's faction and pulses only her faction", () => {
  const falcons = createFalconParty({ side: "enemy" });
  const phantoms = createPhantomParty({ side: "ally" });
  const state = { actors: [...falcons, ...phantoms] };
  const evalete = falcons.find((actor) => actor.id === "evalete");
  const heals = [];
  const registry = createPassiveRegistry({
    addStatus() {},
    addShield,
    alive: formation.alive,
    state,
    makeActor,
    say() {},
    heal(actor, amount) {
      heals.push(actor.id);
      heal(actor, amount);
    },
  });

  for (const actor of state.actors) actor.hp = Math.floor(actor.stats.HP / 2);
  registry.dispatch(evalete, "battleStart");

  const wing = state.actors.find((actor) => actor.id === evalete.catalystWingId);
  assert.ok(wing, "Catalyst Wing is deployed at battle start");
  assert.equal(wing.side, "enemy", "summon inherits its owner's side");

  registry.dispatch(evalete, "turnStart");
  assert.deepEqual(heals, [], "first turn does not pulse");
  registry.dispatch(evalete, "turnStart");

  const expectedFalconIds = falcons.map((actor) => actor.id);
  assert.deepEqual(heals.sort(), expectedFalconIds.sort());
  assert.ok(falcons.every((actor) => actor.shields.length === 1), "all Falcon allies receive a shield");
  assert.ok(phantoms.every((actor) => actor.shields.length === 0), "opposing Phantom members receive no Catalyst shield");
});

test("owner-relative battle timers heal the timer owner's side, not the player side", () => {
  const state = { actors: [], battleTimers: {} };
  const handlers = createDefaultEffectHandlers({
    addShield() {}, addStatus() {}, alive: formation.alive, applyDamage() {},
    calculateMastery() {}, effectiveStat() {}, heal() {}, hitMastery() {},
    hitPhysical() {}, makeActor, state,
  });
  const elishia = createFalconParty({ side: "enemy" })[0];
  const enemyBuddy = createFalconParty({ side: "enemy" })[1];
  const ally = createPhantomParty({ side: "ally" })[0];
  state.actors.push(elishia, enemyBuddy, ally);

  handlers.setBattleTimer({
    key: "singularity",
    turns: 3,
    ownerTurnClock: true,
    turnStart: [{ handler: "healPercentMaxHP", percentMaxHP: 5, side: "owner", excludeSummons: true }],
  }, { actor: elishia });

  const healed = [];
  const doHeal = (actor, amount) => healed.push([actor.id, amount]);
  processBattleTimerTurnStart(ally, state, { heal: doHeal });
  processBattleTimerTurnStart(enemyBuddy, state, { heal: doHeal });

  assert.equal(state.battleTimers.singularity.ownerSide, "enemy");
  assert.deepEqual(healed, [[enemyBuddy.id, Math.floor(enemyBuddy.stats.HP * 0.05)]]);
});

test("Elishia's summon modifier announcement finds summons on the owner's side", () => {
  const elishia = createFalconParty({ side: "enemy" })[0];
  const meo = makeActor({
    id: "meo9-enemy-side",
    name: "Meo-9",
    side: "enemy",
    summon: true,
    ownerId: elishia.id,
    ownerTurnLifecycle: {
      activation: [{
        handler: "coverFire",
        power: 0.5,
        conditionalPower: [{ battleTimer: "singularity", power: 0.75 }],
      }],
    },
    stats: { HP: 100, MP: 0, ATK: 10, MPow: 10, DEF: 5, RES: 5, SPD: 1 },
  });
  const state = { actors: [elishia, meo], battleTimers: { singularity: { turns: 3, ownerId: elishia.id, ownerSide: "enemy" } } };
  const handlers = createDefaultEffectHandlers({
    addShield() {}, addStatus() {}, alive: formation.alive, applyDamage() {},
    calculateMastery() {}, effectiveStat() {}, heal() {}, hitMastery() {},
    hitPhysical() {}, makeActor, state,
  });
  const run = { actor: elishia, after: [] };

  handlers.announceSummonPowerModifier({
    battleTimer: "singularity",
    ruleHandler: "coverFire",
    message: "{actor} cover power {power}",
  }, run);

  assert.deepEqual(run.after, ["Meo-9 cover power 75"]);
});

test("enemy-side Meo-9 covering fire automatically targets the opposing faction", () => {
  const falcon = createFalconParty({ side: "enemy" });
  const phantom = createPhantomParty({ side: "ally" });
  const state = { actors: [...falcon, ...phantom], battleTimers: {} };
  const hitTargets = [];
  const registry = createSummonRegistry({
    alive: formation.alive,
    heal() {},
    hitPhysical(summon, target, power) {
      hitTargets.push({ summon: summon.id, target: target.id, power });
      return { damage: 1 };
    },
    say() {},
    state,
  });
  const meo = makeActor({ id: "meo9-enemy", name: "Meo-9", side: "enemy", summon: true, stats: { HP: 100, ATK: 20 } });
  state.actors.push(meo);

  registry.dispatch(meo, [{ handler: "coverFire", power: 0.75 }]);

  assert.equal(hitTargets.length, 1);
  assert.equal(hitTargets[0].target, phantom[0].id);
  assert.equal(state.actors.find((actor) => actor.id === hitTargets[0].target).side, "ally");
});
