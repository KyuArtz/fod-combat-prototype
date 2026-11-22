const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattle } = require("../core/battle");
const { createBattleState } = require("../core/battleState");
const { createBasicAttackController } = require("../core/controllers");
const { applyDamage } = require("../systems/damageApplication");
const { addShield, tickShields } = require("../systems/shields");
const { effectiveStat, tickStatuses } = require("../systems/statusEffects");
const { calculatePhysicalDamage, calculateMasteryDamage } = require("../systems/damage");
const { createFalconParty } = require("../characters/falcon");
const { createTrainingEnemies } = require("../characters/enemies");
const { DEFAULT_PARTY_ORDER } = require("../tools/lib/headless");
const elishiaData = require("../characters/skillData/elishia");

const clone = (value) => structuredClone(value);
const unitNamed = (units, name) => units.find((unit) => unit.name === name);

// ============================ Biotech Overdrive (passive) ============================

function elishiaInState() {
  const state = createBattleState({ seed: 1 });
  state.actors = [...createFalconParty(), ...createTrainingEnemies()];
  const elishia = unitNamed(state.actors, "Elishia");
  elishia.passiveTimers ||= {};
  elishia.passiveTimers.overdrive = 3;
  return { state, elishia };
}

test("Biotech Overdrive is timed for three Elishia turns and expires after her third turn", () => {
  const { state, elishia } = elishiaInState();
  assert.equal(effectiveStat(state, elishia, "SPD"), 104);
  elishia.passiveTimers.overdrive = 2;
  assert.equal(effectiveStat(state, elishia, "SPD"), 104);
  elishia.passiveTimers.overdrive = 1;
  assert.equal(effectiveStat(state, elishia, "Evasion"), 20);
  elishia.passiveTimers.overdrive = 0;
  assert.equal(effectiveStat(state, elishia, "SPD"), 95);
  assert.equal(effectiveStat(state, elishia, "Evasion"), 10);
});

test("passive data validates: each stat modifier has exactly one of percent or points", () => {
  const { validateSkillData } = require("../core/skillInterpreter");
  const bad = clone(elishiaData);
  bad.passive.statMods = [{ stat: "SPD", percent: 10, points: 5 }];
  assert.throws(() => validateSkillData(bad), /exactly one numeric percent or points/);
});

// ============================ Adaptive Barrier ============================

function shieldedTarget(adaptive = { resistance: 15 }) {
  const target = unitNamed(createFalconParty(), "Zenki");
  addShield(target, 100, 2, adaptive);
  return target;
}

test("adaptive barrier: absorbing typed damage adapts to that type and says so once", () => {
  const target = shieldedTarget();
  const said = [];
  applyDamage(target, 40, (message) => said.push(message), () => {}, "Kinetic");
  assert.equal(target.shields[0].value, 60);
  assert.equal(target.hp, target.stats.HP, "fully absorbed: no HP lost");
  assert.deepEqual(target.statuses.adaptiveResistance, { damageType: "Kinetic", amount: 15, turns: 2 });
  assert.deepEqual(said, ["Zenki's Adaptive Barrier adapts to Kinetic damage (+15% resistance)."]);

  applyDamage(target, 10, (message) => said.push(message), () => {}, "Kinetic");
  assert.equal(said.length, 1, "same type again: no repeated message");
});

test("adaptive barrier: the resistance switches to the newest absorbed type; typeless damage does not change it", () => {
  const target = shieldedTarget();
  const said = [];
  const say = (message) => said.push(message);
  applyDamage(target, 10, say, () => {}, "Kinetic");
  applyDamage(target, 10, say, () => {}, "Physical");
  assert.equal(target.statuses.adaptiveResistance.damageType, "Physical");
  assert.equal(said.length, 2);
  applyDamage(target, 10, say, () => {}); // typeless
  assert.equal(target.statuses.adaptiveResistance.damageType, "Physical");
  assert.equal(said.length, 2);
});

test("adaptive barrier: only damage that is actually absorbed adapts", () => {
  const target = unitNamed(createFalconParty(), "Zenki");
  const said = [];
  applyDamage(target, 30, (message) => said.push(message), () => {}, "Kinetic"); // no shield at all
  assert.equal(target.statuses.adaptiveResistance, undefined);
  addShield(target, 100, 2, { resistance: 15 });
  applyDamage(target, 0, (message) => said.push(message), () => {}, "Kinetic");
  assert.equal(target.statuses.adaptiveResistance, undefined, "zero damage absorbs nothing");
  assert.deepEqual(said, []);
});

test("adaptive barrier: a shield without the adaptive property (other skills' shields) never adapts", () => {
  const target = shieldedTarget(null);
  applyDamage(target, 40, () => {}, () => {}, "Kinetic");
  assert.equal(target.statuses.adaptiveResistance, undefined);
});

test("adaptive barrier: overflow damage still hurts, and the resistance outlives the used-up shield for its remaining turns", () => {
  const target = shieldedTarget();
  applyDamage(target, 160, () => {}, () => {}, "Energy"); // 100 absorbed, 60 through
  assert.equal(target.hp, target.stats.HP - 60);
  assert.deepEqual(target.shields, []);
  assert.deepEqual(target.statuses.adaptiveResistance, { damageType: "Energy", amount: 15, turns: 2 });
  tickStatuses(target);
  assert.equal(target.statuses.adaptiveResistance.turns, 1);
  tickStatuses(target);
  assert.equal(target.statuses.adaptiveResistance, undefined, "ends when the barrier's duration would have");
});

test("adaptive barrier: the status lasts the shield's REMAINING turns", () => {
  const target = shieldedTarget();
  tickShields(target); // one turn passes
  applyDamage(target, 10, () => {}, () => {}, "Kinetic");
  assert.equal(target.statuses.adaptiveResistance.turns, 1);
});

test("resistance reduces matching damage by 15% and ignores other types", () => {
  const [, , , , zenki] = createFalconParty();
  const foe = unitNamed(createTrainingEnemies(), "Siege Turret");
  const stat = (actor, name) => effectiveStat({ battleTimers: {} }, actor, name);
  const physical = () => calculatePhysicalDamage(foe, zenki, stat, 10, false, () => 0.99).damage;
  const kinetic = () => calculateMasteryDamage(foe, zenki, "Kinetic", stat, 10, false, () => 0.99).damage;
  const basePhysical = physical();
  const baseKinetic = kinetic();

  zenki.statuses.adaptiveResistance = { damageType: "Physical", amount: 15, turns: 2 };
  assert.ok(Math.abs(physical() / basePhysical - 0.85) < 0.01, `${physical()} vs ${basePhysical}`);
  assert.equal(kinetic(), baseKinetic, "a different type is unaffected");

  zenki.statuses.adaptiveResistance = { damageType: "Kinetic", amount: 15, turns: 2 };
  assert.ok(Math.abs(kinetic() / baseKinetic - 0.85) < 0.01);
  assert.equal(physical(), basePhysical);
});

// ============================ Through a real battle ============================

const firstBasic = (view) => ({ type: "basic", targetId: view.actions.find((action) => action.type === "basic").targets[0] });

// Elishia deploys Meo-9 as soon as she can; everyone else attacks.
function elishiaDeploysMeo() {
  return {
    chooseAction(view) {
      const meo = view.actions.find((action) => action.type === "skill" && action.key === "meo" && action.usable);
      return view.actor.id === "elishia" && meo ? { type: "skill", skillKey: "meo" } : firstBasic(view);
    },
  };
}

function drivenBattle({ enemy, seed = 3, maxActive }) {
  const holder = {};
  holder.battle = createBattle({
    output: { log() {} },
    seed,
    partyOrder: DEFAULT_PARTY_ORDER,
    controllers: { player: elishiaDeploysMeo(), enemy: enemy(holder) },
  });
  if (maxActive) holder.battle.state.party.maxActive = maxActive;
  return holder.battle;
}

test("battle: a real Adaptive Barrier adapts to the type that hits it (Physical from enemy attacks)", async () => {
  const { playHeadless } = require("../tools/lib/headless");
  const barrierOnWeakest = {
    chooseAction(view) {
      const barrier = view.actions.find((action) => action.type === "skill" && action.key === "barrier" && action.usable);
      if (view.actor.id === "elishia" && barrier) {
        const weakest = [...view.allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        return { type: "skill", skillKey: "barrier", targetId: weakest.id };
      }
      return firstBasic(view);
    },
  };
  let adaptations = 0;
  let statusSeen = false;
  for (const seed of [1, 2, 3, 4]) {
    const { state } = await playHeadless({ seed, controllers: { player: barrierOnWeakest } });
    adaptations += state.log.filter((line) => /Adaptive Barrier adapts to Physical damage \(\+15% resistance\)\./.test(line)).length;
    statusSeen ||= state.actors.some((unit) => unit.statuses && unit.statuses.adaptiveResistance);
  }
  assert.ok(adaptations > 0, "enemy attacks should trigger adaptation");
});

test("battle: Elishia's effective SPD in a real battle includes the timed battle-start passive", async () => {
  let battle;
  let observedSpeed;
  const basic = createBasicAttackController();
  const player = {
    chooseAction(view) {
      if (observedSpeed === undefined) {
        const elishia = battle.state.actors.find((unit) => unit.id === "elishia");
        observedSpeed = effectiveStat(battle.state, elishia, "SPD");
      }
      return basic.chooseAction(view);
    },
  };
  battle = createBattle({
    output: { log() {} }, seed: 1, partyOrder: DEFAULT_PARTY_ORDER,
    controllers: { player },
  });
  await battle.run();
  assert.equal(observedSpeed, 104, "Biotech Overdrive is active during the battle's opening turns");
  battle.close();
});
