const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattle } = require("../core/battle");
const { createBattleState } = require("../core/battleState");
const { createActionResolver } = require("../core/actionResolver");
const { createSkillInterpreter } = require("../core/skillInterpreter");
const { createBasicAttackController } = require("../core/controllers");
const { applyDamage } = require("../systems/damageApplication");
const { addShield, tickShields } = require("../systems/shields");
const { addStatus, effectiveStat, tickStatuses } = require("../systems/statusEffects");
const { calculatePhysicalDamage, calculateMasteryDamage } = require("../systems/damage");
const { makeActor } = require("../characters/actorFactory");
const { createFalconParty } = require("../characters/falcon");
const { createTrainingEnemies } = require("../characters/enemies");
const { DEFAULT_PARTY_ORDER } = require("../tools/lib/headless");
const elishiaData = require("../data/skills/elishia");

const clone = (value) => structuredClone(value);
const unitNamed = (units, name) => units.find((unit) => unit.name === name);

// ============================ Biotech Overdrive (passive) ============================

function elishiaInState() {
  const state = createBattleState({ seed: 1 });
  state.actors = [...createFalconParty(), ...createTrainingEnemies()];
  const elishia = unitNamed(state.actors, "Elishia");
  elishia.biotechOverdriveTurns = 3;
  return { state, elishia, zenki: unitNamed(state.actors, "Zenki") };
}

test("passive: +10% SPD and +10 Evasion for Elishia only, on top of other modifiers", () => {
  const { state, elishia, zenki } = elishiaInState();
  assert.equal(effectiveStat(state, elishia, "SPD"), 104); // 95 * 1.10, floored
  assert.equal(effectiveStat(state, elishia, "Evasion"), 20); // 10 + 10
  assert.equal(effectiveStat(state, zenki, "SPD"), 110, "other allies are unchanged");

  addStatus(elishia, "decoy", { stat: "Evasion", amount: 15, turns: 2 });
  assert.equal(effectiveStat(state, elishia, "Evasion"), 35, "stacks additively with Decoy");

  addStatus(elishia, "spdDown", { stat: "SPD", amount: -10, turns: 2 });
  assert.equal(effectiveStat(state, elishia, "SPD"), 94); // 95 * 0.9 * 1.1
});

test("passive: multiplies with Nanotech Singularity's +10% SPD", () => {
  const { state, elishia } = elishiaInState();
  state.singularityTurns = 3;
  addStatus(elishia, "singularitySpd", { stat: "SPD", amount: 10, turns: 3 });
  assert.equal(effectiveStat(state, elishia, "SPD"), 114); // 95 * 1.1 * 1.1
});

test("Biotech Overdrive is timed for three Elishia turns and expires after her third turn", () => {
  const { state, elishia } = elishiaInState();
  assert.equal(effectiveStat(state, elishia, "SPD"), 104);
  elishia.biotechOverdriveTurns = 2;
  assert.equal(effectiveStat(state, elishia, "SPD"), 104);
  elishia.biotechOverdriveTurns = 1;
  assert.equal(effectiveStat(state, elishia, "Evasion"), 20);
  elishia.biotechOverdriveTurns = 0;
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
  const stat = (actor, name) => effectiveStat({ singularityTurns: 0 }, actor, name);
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

// ============================ Meo-9: scan ============================

function scanWorld() {
  const state = createBattleState({ seed: 1 });
  const allies = createFalconParty();
  const enemies = createTrainingEnemies();
  const elishia = unitNamed(allies, "Elishia");
  const zenki = unitNamed(allies, "Zenki");
  const foe = unitNamed(enemies, "Siege Turret");
  const meo = (extra = {}) =>
    makeActor({
      id: "meo-9", name: "Meo-9", side: "ally", summon: true, summonTurns: 3,
      ownerId: "elishia", scan: { damageBonus: 10, singularityBonus: 10 },
      stats: { HP: 350, MP: 0, ATK: 65, MPow: 80, DEF: 35, RES: 35, SPD: 100, CritRate: 0, Evasion: 0 },
      ...extra,
    });
  state.actors = [...allies, ...enemies];
  const resolver = createActionResolver({
    state,
    effectiveStat: (actor, stat) => effectiveStat(state, actor, stat),
    applyDamage: () => {},
    say: () => {},
    random: () => 0.99,
  });
  return { state, elishia, zenki, foe, enemies, meo, resolver };
}

const ratio = (a, b) => a / b;

test("scan: while Meo-9 lives, Elishia deals +10% damage to enemies (physical and mastery)", () => {
  const { state, elishia, foe, meo, resolver } = scanWorld();
  const basePhysical = resolver.calculatePhysical(elishia, foe, 10, false).damage;
  const baseMastery = resolver.calculateMastery(elishia, foe, "Nanotech", 10, false).damage;
  state.actors.push(meo());
  assert.ok(Math.abs(ratio(resolver.calculatePhysical(elishia, foe, 10, false).damage, basePhysical) - 1.1) < 0.005);
  assert.ok(Math.abs(ratio(resolver.calculateMastery(elishia, foe, "Nanotech", 10, false).damage, baseMastery) - 1.1) < 0.005);
});

test("scan: Singularity adds another +10% (total +20%)", () => {
  const { state, elishia, foe, meo, resolver } = scanWorld();
  const base = resolver.calculatePhysical(elishia, foe, 10, false).damage;
  state.actors.push(meo());
  state.singularityTurns = 3;
  assert.ok(Math.abs(ratio(resolver.calculatePhysical(elishia, foe, 10, false).damage, base) - 1.2) < 0.005);
});

test("scan: only Elishia's damage to enemies is boosted, never Meo-9's own, her allies', or damage to allies", () => {
  const { state, elishia, zenki, foe, meo, resolver } = scanWorld();
  const unit = meo();
  const beforeZenki = resolver.calculatePhysical(zenki, foe, 10, false).damage;
  const beforeMeo = resolver.calculatePhysical(unit, foe, 10, false).damage;
  const beforeFriendly = resolver.calculatePhysical(elishia, zenki, 10, false).damage;
  state.actors.push(unit);
  assert.equal(resolver.calculatePhysical(zenki, foe, 10, false).damage, beforeZenki);
  assert.equal(resolver.calculatePhysical(unit, foe, 10, false).damage, beforeMeo);
  assert.equal(resolver.calculatePhysical(elishia, zenki, 10, false).damage, beforeFriendly);
});

test("scan: a destroyed or expired Meo-9 stops scanning; two Meo-9 do not stack", () => {
  const { state, elishia, foe, meo, resolver } = scanWorld();
  const base = resolver.calculatePhysical(elishia, foe, 10, false).damage;
  const first = meo();
  state.actors.push(first);
  const scanned = resolver.calculatePhysical(elishia, foe, 10, false).damage;
  state.actors.push(meo());
  assert.equal(resolver.calculatePhysical(elishia, foe, 10, false).damage, scanned, "no stacking");
  first.alive = false;
  state.actors[state.actors.length - 1].alive = false;
  assert.equal(resolver.calculatePhysical(elishia, foe, 10, false).damage, base);
});

test("scan: a Meo-9 owned by someone else does not boost Elishia", () => {
  const { state, elishia, foe, meo, resolver } = scanWorld();
  const base = resolver.calculatePhysical(elishia, foe, 10, false).damage;
  state.actors.push(meo({ ownerId: "someone-else" }));
  assert.equal(resolver.calculatePhysical(elishia, foe, 10, false).damage, base);
});

// ============================ Meo-9: behaviour (fake context) ============================

function fakeWorld() {
  const calls = [];
  const said = [];
  const state = { actors: [], singularityTurns: 0 };
  const unit = (name, side, extra = {}) => ({
    id: name.toLowerCase(), name, side, alive: true, hp: 100, cr: 55,
    stats: { HP: 1000 }, cooldowns: {}, statuses: {}, shields: [], ...extra,
  });
  const context = {
    state,
    alive: (s, side) => s.actors.filter((actor) => actor.alive && actor.side === side),
    say: (message) => said.push(message),
    hitPhysical: (attacker, target, power, canCrit) => {
      calls.push(["hitPhysical", target.name, power, canCrit]);
      return { damage: 17 };
    },
    heal: (target, amount) => {
      const actual = Math.min(amount, target.stats.HP - target.hp);
      target.hp += actual;
      calls.push(["heal", target.name, actual]);
      return actual;
    },
    hitMastery: (attacker, target, element, power, canCrit) => {
      calls.push(["hitMastery", target.name, element, power, canCrit]);
      if (target.hp <= 20) target.alive = false; // lets a test kill an enemy with the burst
      return { damage: 30 };
    },
    addStatus: (target, id, data) => calls.push(["addStatus", target.name, id, data]),
  };
  const interpreter = createSkillInterpreter(context);
  const meo = () => ({
    ...unit("Meo-v9", "ally", { summon: true, id: "meo-9", summonTurns: 3 }),
    behavior: clone(elishiaData.summons.meo9.behavior),
    onDestroyed: clone(elishiaData.summons.meo9.onDestroyed),
  });
  return { calls, said, state, unit, interpreter, meo };
}

test("cover fire is 50% of its ATK normally and 75% during Nanotech Singularity", () => {
  const { calls, state, unit, interpreter, meo } = fakeWorld();
  state.actors.push(unit("Drone", "enemy"));
  const unitMeo = meo();
  state.actors.push(unitMeo);
  interpreter.summonTurn(unitMeo);
  state.singularityTurns = 2;
  interpreter.summonTurn(unitMeo);
  assert.deepEqual(calls.filter((call) => call[0] === "hitPhysical").map((call) => call[2]), [0.5, 0.75]);
});

test("Emergency Field heals the lowest-HP-ratio living ally below 25% Max HP instead of attacking", () => {
  const { calls, said, state, unit, interpreter, meo } = fakeWorld();
  const first = unit("Zenki", "ally", { hp: 240, stats: { HP: 1000 } });
  const second = unit("Jazen", "ally", { hp: 150, stats: { HP: 1000 } });
  state.actors.push(first, second, unit("Drone", "enemy"));
  const summon = meo();
  state.actors.push(summon);
  interpreter.summonTurn(summon);
  assert.equal(first.hp, 240, "the higher percentage ally is not selected");
  assert.equal(second.hp, 250, "the lowest percentage ally receives 10% Max HP healing");
  assert.equal(calls.filter((call) => call[0] === "hitPhysical").length, 0, "healing replaces cover fire for this activation");
  assert.match(said[0], /Emergency Field restores Jazen for 100 HP/);
  assert.equal(summon.summonTurns, 2);
});

test("Emergency Field does not revive incapacitated allies and cover fire continues if nobody qualifies", () => {
  const { calls, state, unit, interpreter, meo } = fakeWorld();
  const downed = unit("Zenki", "ally", { alive: false, hp: 0 });
  state.actors.push(downed, unit("Drone", "enemy"));
  const summon = meo();
  state.actors.push(summon);
  interpreter.summonTurn(summon);
  assert.equal(downed.alive, false);
  assert.equal(calls.filter((call) => call[0] === "hitPhysical").length, 1);
});

test("Meo-v9 expires after three activations; an EMP is not invented without owner-specified scaling", () => {
  const { calls, said, state, unit, interpreter, meo } = fakeWorld();
  const ally = unit("Elishia", "ally", { hp: 1000 });
  state.actors.push(ally, unit("Drone", "enemy"));
  const summon = meo();
  state.actors.push(summon);
  interpreter.summonTurn(summon);
  interpreter.summonTurn(summon);
  interpreter.summonTurn(summon);
  assert.equal(summon.alive, false);
  assert.ok(said.some((line) => line.includes("deployment expires")));
  assert.equal(calls.filter((call) => call[0] === "hitMastery").length, 0);
});

test("Singularity announces amplified Meo-v9 cover fire for living summons only", () => {
  const { said, state, unit, interpreter, meo } = fakeWorld();
  const summon = meo();
  state.actors.push(unit("Elishia", "ally"), summon, unit("Drone", "enemy"));
  const full = {
    state, say: (m) => said.push(m), alive: (s, side) => s.actors.filter((a) => a.alive && a.side === side),
    ready: () => true, pay: () => true, addStatus: () => {}, heal: () => 0,
  };
  const skills = createSkillInterpreter(full).buildSkills(elishiaData);
  const ultimate = skills.find((skill) => skill.key === "ultimate");
  ultimate.run(state.actors[0], {});
  assert.ok(said.includes("Meo-v9's covering fire is amplified to 75% of its ATK."));
  assert.match(said[0], /^NANOTECH SINGULARITY!/);
  said.length = 0;
  summon.alive = false;
  ultimate.run(state.actors[0], {});
  assert.ok(!said.some((message) => message.includes("amplified")));
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

test("battle: Meo-v9 destruction does not trigger an unspecified EMP burst", async () => {
  let destroyed = false;
  const battle = drivenBattle({
    enemy: (holder) => ({
      chooseAction(view) {
        const summon = holder.battle.state.actors.find((unit) => unit.summon && unit.alive);
        if (summon && !destroyed) {
          destroyed = true;
          holder.battle.dealDamage(summon, 99999, "Physical");
        }
        return firstBasic(view);
      },
    }),
  });
  await battle.run();
  battle.close();
  assert.ok(battle.state.log.includes("Meo-v9 is incapacitated!"));
  assert.ok(!battle.state.log.some((line) => line.includes("releases an EMP")));
});

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
