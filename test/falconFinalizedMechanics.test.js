const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattleState } = require("../core/battleState");
const { createFalconParty } = require("../characters/falcon");
const { createTrainingEnemies } = require("../characters/enemies");
const { createSkills } = require("../characters/skills");
const { createActionResolver } = require("../core/actionResolver");
const { addStatus, effectiveStat, incomingAttackModifier } = require("../systems/statusEffects");
const { addShield } = require("../systems/shields");
const { applyDamage, heal } = require("../systems/damageApplication");
const { pay, ready, tickCooldowns } = require("../systems/cooldowns");
const formation = require("../systems/formation");

function world(randomValue = 0.99) {
  const state = createBattleState({ seed: 91 });
  const allies = createFalconParty();
  const enemies = createTrainingEnemies();
  state.actors = [...allies, ...enemies];
  const logs = [];
  const say = (line) => logs.push(line);
  const random = () => randomValue;
  const effective = (actor, stat) => effectiveStat(state, actor, stat);
  const resolver = createActionResolver({ state, effectiveStat: effective, applyDamage: (target, amount, type) => applyDamage(target, amount, say, () => {}, type), say, random, incomingAttackModifier });
  const context = {
    state, say, random, alive: formation.alive, addStatus, addShield,
    applyDamage: (target, amount, type) => applyDamage(target, amount, say, () => {}, type),
    calculateMastery: resolver.calculateMastery, heal, hitMastery: resolver.hitMastery,
    hitPhysical: resolver.hitPhysical, makeActor: require("../characters/actorFactory").makeActor,
    pay, ready, tickCooldowns, tickShields() {}, tickStatuses() {},
  };
  const skillSet = createSkills(context);
  const byId = Object.fromEntries(allies.map((actor) => [actor.id, actor]));
  return { state, allies, enemies, logs, resolver, skillSet, byId, effective };
}
const skill = (w, id, key) => w.skillSet.skills[id].find((entry) => entry.key === key);

test("Catalyst Wing natural expiry does not grant the destruction shield", () => {
  const w = world();
  const evalete = w.byId.evalete;
  w.skillSet.onBattleStart(w.allies);
  const wing = w.state.actors.find((actor) => actor.id === evalete.catalystWingId);
  for (let i = 0; i < 12; i++) w.skillSet.onTurnEnd(evalete);
  assert.equal(wing.alive, false);
  assert.ok(!evalete.shields.some((shield) => shield.value === Math.floor(evalete.stats.HP * 0.15) && shield.turns === 4), "natural expiry does not grant the early-destruction shield");
});

test("Zackry Overwatch does not grant a team-wide Accuracy bonus from untargeted skills", () => {
  const w = world();
  skill(w, "zackry", "uplink").run(w.byId.zackry, {});
  assert.ok(w.allies.every((ally) => ally.nextAttackAccuracy === 0));
});

test("Generic next-attack Accuracy token reduces Evasion for the next eligible skill attack and is consumed", () => {
  const w = world(0.45);
  const zackry = w.byId.zackry;
  const target = w.enemies[0];
  target.stats.Evasion = 50;
  zackry.nextAttackAccuracy = 10;
  const before = target.hp;
  skill(w, "zackry", "emp").run(zackry, { target });
  assert.ok(target.hp < before, "45% roll clears the reduced 40% evasion check");
  assert.equal(zackry.nextAttackAccuracy, 0);
});

test("Stagger delays a unit that is at zero readiness as well as one already partway to its turn", () => {
  const w = world();
  const target = w.enemies[0];
  target.cr = 0;
  assert.equal(addStatus(target, "staggered", { turns: 1, debuff: true, delayCR: 20 }), true);
  assert.equal(target.cr, -20);
});

test("Guaranteed-hit mastery attacks consume but are not blocked by a pending Accuracy token", () => {
  const w = world(0);
  const zenki = w.byId.zenki;
  const target = w.enemies[0];
  target.stats.Evasion = 75;
  zenki.nextAttackAccuracy = 10;
  const before = target.hp;
  skill(w, "zenki", "railshot").run(zenki, { target });
  assert.ok(target.hp < before);
  assert.equal(zenki.nextAttackAccuracy, 0);
});

test("Evalete's Catalyst Protocol does not activate from reserve and initializes only on deployment", () => {
  const w = world();
  const evalete = w.byId.evalete;
  const active = w.allies.filter((actor) => actor.id !== "evalete");
  w.skillSet.onBattleStart(active);
  assert.equal(evalete.catalystWingId, undefined, "reserve Evalete should not spawn her passive Wing");
  w.skillSet.onBattleStart([evalete]);
  const wing = w.state.actors.find((actor) => actor.id === evalete.catalystWingId);
  assert.ok(wing?.alive, "deploying Evalete should activate her passive Wing");
});
