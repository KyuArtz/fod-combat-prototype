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

test("Meo-v9 Final Protocol fires once on natural expiry, prioritizes its selected enemy and applies the 50% secondary EMP", () => {
  const w = world();
  const elishia = w.byId.elishia;
  const [primary, ...secondary] = w.enemies;
  w.state.lastAllyTargetedEnemyId = primary.id;
  skill(w, "elishia", "meo").run(elishia, {});
  const meo = w.state.actors.find((actor) => actor.id === "meo-9");
  assert.equal(meo.finalProtocolTargetId, primary.id);
  for (let i = 0; i < 3; i++) w.skillSet.summonTurn(meo);
  assert.equal(meo.finalProtocolUsed, true);
  assert.ok(primary.hp < primary.stats.HP);
  assert.ok(secondary.every((enemy) => enemy.hp < enemy.stats.HP));
  assert.ok(w.enemies.every((enemy) => enemy.statuses.meoFinalProtocolSpdDown?.amount === -15));
  const after = w.enemies.map((enemy) => enemy.hp);
  w.skillSet.summonTurn(meo);
  assert.deepEqual(w.enemies.map((enemy) => enemy.hp), after, "Final Protocol cannot fire twice");
});

test("Meo-v9 destroyed before expiry does not trigger Final Protocol", () => {
  const w = world();
  skill(w, "elishia", "meo").run(w.byId.elishia, {});
  const meo = w.state.actors.find((actor) => actor.id === "meo-9");
  const hp = w.enemies.map((enemy) => enemy.hp);
  meo.alive = false;
  w.skillSet.summonDestroyed(meo);
  assert.deepEqual(w.enemies.map((enemy) => enemy.hp), hp);
  assert.equal(meo.finalProtocolUsed, undefined);
});

test("Nanotech Singularity applies a non-critical Nanotech DoT at the start of each enemy turn", () => {
  const w = world();
  const elishia = w.byId.elishia;
  skill(w, "elishia", "ultimate").run(elishia, {});
  const target = w.enemies[0];
  const dot = target.statuses.singularityDot;
  assert.ok(dot.dotDamage > 0);
  assert.equal(dot.turns, 3);
  assert.ok(w.enemies.every((enemy) => enemy.statuses.singularityDot?.turns === 3), "the reusable area DoT is assigned to every living enemy");
  assert.deepEqual(dot.turnStart, {
    damageField: "dotDamage", damageTypeField: "damageType",
    message: "{actor} takes {damage} Nanotech damage from Nanotech Singularity.",
  });
  const before = target.hp;
  w.skillSet.onTurnStart(target);
  assert.equal(target.hp, before - dot.dotDamage);
  assert.ok(w.logs.some((line) => line.includes("Nanotech Singularity")));
});

test("Catalyst Wing is a targetable, non-turn-taking passive summon and grants Evalete's emergency shield if destroyed", () => {
  const w = world();
  const evalete = w.byId.evalete;
  w.skillSet.onBattleStart(w.allies);
  const wing = w.state.actors.find((actor) => actor.id === evalete.catalystWingId);
  assert.ok(wing);
  assert.equal(wing.targetableByEnemy, true);
  assert.equal(wing.passiveSummon, true);
  assert.equal(wing.stats.HP, Math.floor(evalete.stats.HP * 0.25));
  assert.equal(wing.stats.DEF, Math.floor(evalete.stats.DEF * 0.5));
  const { enemyTarget } = require("../ai/targeting");
  wing.hp = Math.floor(wing.stats.HP * 0.1);
  assert.equal(enemyTarget(w.state, w.enemies[1], formation.alive), wing, "enemy single-target selection can hit the damaged Wing");
  wing.alive = false;
  w.skillSet.summonDestroyed(wing);
  assert.equal(evalete.shields[0].value, Math.floor(evalete.stats.HP * 0.15));
  assert.equal(evalete.shields[0].turns, 4);
});

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


test("Zackry's Overwatch Accuracy token applies to the next skill attack and is consumed", () => {
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


test("Jazen's Recoil Dampeners threshold uses HP loss after shield absorption", () => {
  const w = world();
  const jazen = w.byId.jazen;
  addShield(jazen, 1000, 2);
  w.skillSet.onDamageTaken(jazen, 500, "Physical", 0);
  assert.equal(jazen.statuses.jazenRecoil, undefined, "fully shielded damage does not count as a hit to HP");
  w.skillSet.onDamageTaken(jazen, 500, "Physical", Math.floor(jazen.stats.HP * 0.11));
  assert.equal(jazen.statuses.jazenRecoil.amount, 10);
});

test("Zenki's guaranteed-hit Railshot consumes, but is not blocked by, an Accuracy token", () => {
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
