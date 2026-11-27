const test = require("node:test");
const assert = require("node:assert/strict");
const { makeActor } = require("../characters/actorFactory");
const { effectiveStat } = require("../systems/statusEffects");
const { calculatePhysicalDamage, calculateMasteryDamage, mitigateReflectedDamage } = require("../systems/damage");

const stats = { HP: 1000, MP: 100, ATK: 100, MPow: 100, DEF: 0, RES: 0, CritRate: 0, Evasion: 0, SPD: 100, masteryBonus: {}, masteryResistance: {} };
const makeUnit = (id) => makeActor({ id, name: id, stats: { ...stats } });
const effective = (actor, stat) => effectiveStat({ battleTimers: {} }, actor, stat);
const physical = (attacker, target) => calculatePhysicalDamage(attacker, target, effective, 100, false, () => 0.99).damage;
const mastery = (attacker, target, type = "Kinetic") => calculateMasteryDamage(attacker, target, type, effective, 100, false, () => 0.99).damage;


test("generic resistance applies to Physical and all mastery damage channels", () => {
  const attacker = makeUnit("attacker");
  const target = makeUnit("target");
  const basePhysical = physical(attacker, target);
  const masteryTypes = ["Energy", "Kinetic", "Electromagnetic", "Toxic", "Nuclear", "Nanotech", "Cryogenic", "Anomaly"];
  const baseMastery = Object.fromEntries(masteryTypes.map((type) => [type, mastery(attacker, target, type)]));
  target.statuses.genericResistance = { resistancePercent: 20, turns: 2 };
  assert.equal(physical(attacker, target), Math.floor(basePhysical * 0.8));
  for (const type of masteryTypes) {
    assert.equal(mastery(attacker, target, type), Math.floor(baseMastery[type] * 0.8), `${type} should receive generic resistance`);
  }
});

test("damageTypes filter applies only to listed channels; empty filter matches none", () => {
  const attacker = makeUnit("attacker");
  const target = makeUnit("target");
  const basePhysical = physical(attacker, target);
  const baseKinetic = mastery(attacker, target, "Kinetic");
  const baseToxic = mastery(attacker, target, "Toxic");
  target.statuses.filteredResistance = { resistancePercent: 30, damageTypes: ["Kinetic", "Toxic"], turns: 2 };
  assert.equal(physical(attacker, target), basePhysical);
  assert.equal(mastery(attacker, target, "Kinetic"), Math.floor(baseKinetic * 0.7));
  assert.equal(mastery(attacker, target, "Toxic"), Math.floor(baseToxic * 0.7));
  target.statuses.filteredResistance.damageTypes = [];
  assert.equal(mastery(attacker, target, "Kinetic"), baseKinetic);
});

test("legacy resistanceType payloads remain single-channel and compatible", () => {
  const attacker = makeUnit("attacker");
  const target = makeUnit("target");
  const baseKinetic = mastery(attacker, target, "Kinetic");
  const baseToxic = mastery(attacker, target, "Toxic");
  target.statuses.legacyResistance = { resistanceType: "Kinetic", resistancePercent: 15, turns: 2 };
  assert.equal(mastery(attacker, target, "Kinetic"), Math.floor(baseKinetic * 0.85));
  assert.equal(mastery(attacker, target, "Toxic"), baseToxic);
});

test("multiple resistance sources retain strongest-value stacking and clamp at 100%", () => {
  const attacker = makeUnit("attacker");
  const target = makeUnit("target");
  const base = mastery(attacker, target, "Kinetic");
  target.statuses.lower = { resistancePercent: 10, turns: 2 };
  target.statuses.higher = { resistancePercent: 25, turns: 2 };
  assert.equal(mastery(attacker, target, "Kinetic"), Math.floor(base * 0.75));
  target.statuses.total = { resistancePercent: 150, turns: 2 };
  assert.equal(mastery(attacker, target, "Kinetic"), 1, "100% damage resistance preserves the minimum damage floor");
});

test("Adaptive Barrier still contributes only to its matching channel alongside generic resistance", () => {
  const attacker = makeUnit("attacker");
  const target = makeUnit("target");
  const basePhysical = physical(attacker, target);
  const baseKinetic = mastery(attacker, target, "Kinetic");
  target.statuses.genericResistance = { resistancePercent: 10, turns: 2 };
  target.statuses.adaptiveResistance = { damageType: "Kinetic", amount: 15, turns: 2 };
  assert.equal(physical(attacker, target), Math.floor(basePhysical * 0.9));
  assert.equal(mastery(attacker, target, "Kinetic"), Math.floor(baseKinetic * 0.85));
});

test("reflected damage mitigation uses the same generic and filtered resistance resolver", () => {
  const target = makeUnit("target");
  const base = mitigateReflectedDamage(target, 100, "Physical", effective);
  target.statuses.genericResistance = { resistancePercent: 20, turns: 2 };
  assert.equal(mitigateReflectedDamage(target, 100, "Physical", effective), Math.floor(base * 0.8));
  target.statuses.filteredResistance = { resistancePercent: 30, damageTypes: ["Kinetic"], turns: 2 };
  assert.equal(mitigateReflectedDamage(target, 100, "Physical", effective), Math.floor(base * 0.8));
  assert.equal(mitigateReflectedDamage(target, 100, "Kinetic", effective), Math.floor(base * 0.7));
});

test("combined filters intersect and malformed damageTypes filters are ignored", () => {
  const attacker = makeUnit("attacker");
  const target = makeUnit("target");
  const baseKinetic = mastery(attacker, target, "Kinetic");
  const baseToxic = mastery(attacker, target, "Toxic");
  target.statuses.intersection = { resistanceType: "Toxic", damageTypes: ["Toxic", "Nanotech"], resistancePercent: 20, turns: 2 };
  assert.equal(mastery(attacker, target, "Kinetic"), baseKinetic);
  assert.equal(mastery(attacker, target, "Toxic"), Math.floor(baseToxic * 0.8));
  target.statuses.intersection.damageTypes = "Toxic";
  assert.equal(mastery(attacker, target, "Toxic"), baseToxic, "malformed filters do not contribute resistance");
});
