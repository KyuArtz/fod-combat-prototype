const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSkillData } = require("../core/skillInterpreter");
const { createSerpentParty } = require("../characters/serpent");
const { createPlayableRoster } = require("../characters/roster");
const { getCharacterSkillData } = require("../characters/skills");
const { effectiveStat } = require("../systems/statusEffects");
const { calculateMasteryDamage } = require("../systems/damage");
const { addStatus } = require("../systems/statusEffects");
const { createSerpentWorld, serpentSkill } = require("./helpers/serpentWorld");
const verra = require("../characters/skillData/verra");
const kane = require("../characters/skillData/kane");
const galloz = require("../characters/skillData/galloz");
const claude = require("../characters/skillData/claude");
const tekushiki = require("../characters/skillData/tekushiki");

const serpentData = [verra, kane, galloz, claude, tekushiki];
const serpentIds = ["verra", "kane", "galloz", "claude", "tekushiki"];

for (const data of serpentData) {
  test(`${data.characterId} skills validate through the shared skill schema`, () => {
    assert.doesNotThrow(() => validateSkillData(data));
    assert.equal(data.skills.length, 4);
  });
}

test("Serpent party uses roster stats, normalized combat keys, unique IDs, and official Tekushiki membership", () => {
  const party = createSerpentParty();
  assert.deepEqual(party.map((actor) => actor.id), serpentIds);
  assert.ok(party.every((actor) => actor.faction === "serpent"));
  assert.ok(party.every((actor) => actor.skillSet === actor.id && actor.passive));
  assert.equal(party.find((actor) => actor.id === "verra").role, "field-medic");
  assert.equal(party.find((actor) => actor.id === "kane").mastery, "Toxic");
  assert.equal(party.find((actor) => actor.id === "galloz").stats.MPow, 0);
  assert.equal(party.find((actor) => actor.id === "tekushiki").role, "vanguard");
  const unified = createPlayableRoster();
  assert.equal(unified.filter((actor) => actor.faction === "serpent").length, 5);
  assert.deepEqual(unified.filter((actor) => actor.faction === "serpent").map((actor) => actor.id), serpentIds);
  for (const id of serpentIds) assert.ok(getCharacterSkillData(id));
});

test("all Serpent skill modes and abilities compile and execute through the shared interpreter", () => {
  const world = createSerpentWorld();
  const enemy = world.enemies[0];
  const cases = [
    ["verra", "causticInjection", "treat", "ally"],
    ["verra", "causticInjection", "attack", "enemy"],
    ["verra", "chemicalCatastrophe", null, "none"],
    ["verra", "unstableRemedy", "remedy", "ally"],
    ["verra", "unstableRemedy", "corrosive", "enemy"],
    ["verra", "ultimate", null, "none"],
    ["kane", "twinFang", null, "enemy"],
    ["kane", "venomousPursuit", null, "enemy"],
    ["kane", "phantomOrbit", null, "enemy"],
    ["kane", "ultimate", null, "enemy"],
    ["galloz", "ironcladImpact", null, "enemy"],
    ["galloz", "tyrantsGuard", null, "none"],
    ["galloz", "reactorQuake", null, "none"],
    ["galloz", "ultimate", null, "none"],
    ["claude", "rallyingCatalyst", null, "ally"],
    ["claude", "ruptureFlask", null, "enemy"],
    ["claude", "sabotageCocktail", null, "none"],
    ["claude", "ultimate", null, "none"],
    ["tekushiki", "ruinReversal", null, "enemy"],
    ["tekushiki", "nullKnot", null, "none"],
    ["tekushiki", "lastThread", null, "enemy"],
    ["tekushiki", "ultimate", null, "none"],
  ];
  for (const [id, key, mode, targeting] of cases) {
    const actor = world.byId[id];
    const skill = serpentSkill(world, id, key);
    actor.mp = 250;
    actor.cooldowns[key] = 0;
    const target = targeting === "enemy" ? enemy : targeting === "ally"
      ? (id === "verra" ? world.byId.kane : world.byId.galloz)
      : undefined;
    assert.equal(skill.run(actor, { mode: mode || undefined, target }), true, `${id}/${key}/${mode || "default"}`);
    assert.ok(actor.mp < 250, `${id}/${key} should consume MP`);
    assert.equal(actor.cooldowns[key], skill.cooldown, `${id}/${key} cooldown`);
  }
});

test("Verra's Poison applies a 0.25× Mpow Toxic tick for 2 turns", () => {
  const world = createSerpentWorld();
  const verraActor = world.byId.verra;
  const target = world.enemies[0];
  const skill = serpentSkill(world, "verra", "causticInjection");
  assert.equal(skill.run(verraActor, { mode: "attack", target }), true);
  const poison = target.statuses.poison;
  const expected = world.resolver.calculateMastery(verraActor, target, "Toxic", 0.25, false, "MPow").damage;
  assert.equal(poison.turns, 2);
  assert.equal(poison.dotDamage, expected);
  assert.equal(poison.damageType, "Toxic");
  assert.equal(poison.sourceId, verraActor.id);
});

test("Verra's healing mode cleanses one debuff and grants Toxic Resistance to the healed ally", () => {
  const world = createSerpentWorld();
  const verraActor = world.byId.verra;
  const ally = world.byId.kane;
  ally.hp = 500;
  addStatus(ally, "testDebuff", { stat: "SPD", amount: -10, turns: 2, debuff: true });
  const skill = serpentSkill(world, "verra", "causticInjection");
  assert.equal(skill.run(verraActor, { mode: "treat", target: ally }), true);
  assert.ok(ally.hp > 500);
  assert.equal(ally.statuses.testDebuff, undefined);
  assert.equal(ally.statuses.verraToxicResistance.resistanceType, "Toxic");
  assert.equal(ally.statuses.verraToxicResistance.resistancePercent, 10);
});

test("Kane's Serpent's Instinct increases Toxic damage against Poisoned targets only", () => {
  const world = createSerpentWorld();
  const kaneActor = world.byId.kane;
  const target = world.enemies[0];
  const stat = (actor, key) => effectiveStat(world.state, actor, key);
  const normal = calculateMasteryDamage(kaneActor, target, "Toxic", stat, 1, false, () => 0.99).damage;
  addStatus(target, "poison", { dotDamage: 20, damageType: "Toxic", turns: 2, debuff: true });
  const poisoned = calculateMasteryDamage(kaneActor, target, "Toxic", stat, 1, false, () => 0.99).damage;
  const otherType = calculateMasteryDamage(kaneActor, target, "Kinetic", stat, 1, false, () => 0.99).damage;
  assert.ok(poisoned > normal);
  assert.equal(otherType, calculateMasteryDamage(kaneActor, target, "Kinetic", stat, 1, false, () => 0.99).damage);
});

test("Galloz gains Reinforcement only from enemy skills and consumes its one-use Kinetic power bonus", () => {
  const world = createSerpentWorld();
  const gallozActor = world.byId.galloz;
  const source = world.enemies[0];
  world.damage(gallozActor, 100, "Physical", source, { kind: "direct", actionType: "basic" });
  assert.equal(gallozActor.statuses.gallozReinforcement, undefined);
  world.damage(gallozActor, 100, "Physical", source, { kind: "direct", actionType: "skill" });
  world.damage(gallozActor, 100, "Physical", source, { kind: "direct", actionType: "skill" });
  assert.equal(gallozActor.statuses.gallozReinforcement.stacks, 2);
  assert.equal(gallozActor.statuses.gallozReinforcement.amount, 10);
  assert.equal(gallozActor.statuses.gallozKineticCharge.nextSkillPowerAdd, 0.15);
  const attack = serpentSkill(world, "galloz", "ironcladImpact");
  gallozActor.mp = 250;
  assert.equal(attack.run(gallozActor, { target: source }), true);
  assert.equal(gallozActor.statuses.gallozReinforcement, undefined);
  assert.equal(gallozActor.statuses.gallozKineticCharge, undefined);
  assert.equal(gallozActor.passiveFlags.gallozReinforcementPrimed, false);
});

test("Galloz's Catalyst Overlord empowers and consumes the next damaging Kinetic skill", () => {
  const world = createSerpentWorld();
  const gallozActor = world.byId.galloz;
  const target = world.enemies[0];
  const ultimate = serpentSkill(world, "galloz", "ultimate");
  gallozActor.mp = 250;
  assert.equal(ultimate.run(gallozActor), true);
  assert.equal(gallozActor.statuses.catalystOverlordNextStrike.nextSkillPowerAdd, 0.2);

  const strike = serpentSkill(world, "galloz", "ironcladImpact");
  gallozActor.cooldowns.ironcladImpact = 0;
  assert.equal(strike.run(gallozActor, { target }), true);
  assert.equal(gallozActor.statuses.catalystOverlordNextStrike, undefined);
});

test("Galloz's Reactor Quake uses its defined 120% ATK payoff instead of stacking the passive charge again", () => {
  const world = createSerpentWorld();
  const gallozActor = world.byId.galloz;
  const source = world.enemies[0];
  world.damage(gallozActor, 100, "Physical", source, { kind: "direct", actionType: "skill" });
  world.damage(gallozActor, 100, "Physical", source, { kind: "direct", actionType: "skill" });
  const quake = serpentSkill(world, "galloz", "reactorQuake");
  gallozActor.mp = 250;
  const hpBefore = source.hp;
  assert.equal(quake.run(gallozActor), true);
  assert.ok(source.hp < hpBefore);
  assert.equal(gallozActor.statuses.gallozKineticCharge, undefined);
  assert.equal(gallozActor.passiveFlags.gallozReinforcementPrimed, false);
});

test("Claude applies Fracture to the primary enemy successfully hit by an active skill", () => {
  const world = createSerpentWorld();
  const claudeActor = world.byId.claude;
  const target = world.enemies[0];
  const skill = serpentSkill(world, "claude", "ruptureFlask");
  assert.equal(skill.run(claudeActor, { target }), true);
  assert.equal(target.statuses.fracture.amount, -8);
  assert.equal(target.statuses.fracture.turns, 2);
  assert.ok(target.statuses.poison);
});

test("Tekushiki applies two independently timed Tether Marks, then Last Thread consumes them to Bind", () => {
  const world = createSerpentWorld();
  const tekushikiActor = world.byId.tekushiki;
  const target = world.enemies[0];
  const reversal = serpentSkill(world, "tekushiki", "ruinReversal");
  tekushikiActor.mp = 250;
  assert.equal(reversal.run(tekushikiActor, { target }), true);
  assert.equal(target.statuses.tetherMarks.stacks, 1);
  tekushikiActor.cooldowns.ruinReversal = 0;
  assert.equal(reversal.run(tekushikiActor, { target }), true);
  assert.equal(target.statuses.tetherMarks.stacks, 2);
  assert.deepEqual(target.statuses.tetherMarks.stackDurations, [2, 2]);
  assert.equal(target.statuses.tetherSnared.amount, -15);

  const lastThread = serpentSkill(world, "tekushiki", "lastThread");
  tekushikiActor.cooldowns.lastThread = 0;
  assert.equal(lastThread.run(tekushikiActor, { target }), true);
  assert.equal(target.statuses.tetherMarks, undefined);
  assert.equal(target.statuses.tetherSnared, undefined);
  assert.equal(target.statuses.bound.skipAction, true);
  assert.equal(target.statuses.bound.turns, 1);
});
