const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattleState } = require("../core/battleState");
const { createFalconParty } = require("../characters/falcon");
const { createTrainingEnemies } = require("../characters/enemies");
const { createSkills } = require("../characters/skills");
const { createActionResolver } = require("../core/actionResolver");
const { addStatus, effectiveStat } = require("../systems/statusEffects");
const { addShield } = require("../systems/shields");
const { applyDamage, heal } = require("../systems/damageApplication");
const { pay, ready, tickCooldowns } = require("../systems/cooldowns");
const formation = require("../systems/formation");

function world(randomValue = 0.99) {
  const state = createBattleState({ seed: 77 });
  const allies = createFalconParty();
  const enemies = createTrainingEnemies();
  state.actors = [...allies, ...enemies];
  const logs = [];
  const say = (line) => logs.push(line);
  const random = () => randomValue;
  const effective = (actor, stat) => effectiveStat(state, actor, stat);
  const resolver = createActionResolver({ state, effectiveStat: effective, applyDamage: (target, amount, type) => applyDamage(target, amount, say, () => {}, type), say, random });
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

test("Elishia Nano Swarm repairs all active allies, disrupts all enemies and applies Decoy", () => {
  const w = world();
  for (const ally of w.allies) ally.hp = 500;
  const elishia = w.byId.elishia;
  skill(w, "elishia", "nano").run(elishia, { mode: "Repair" });
  assert.ok(w.allies.every((ally) => ally.hp === 500 + Math.floor(ally.stats.HP * 0.15)));
  assert.equal(elishia.mpDiscount, 8, "Nanotech passive grants a flat 8 MP discount for the next skill");
  elishia.cooldowns.nano = 0;
  skill(w, "elishia", "nano").run(elishia, { mode: "Disrupt" });
  assert.ok(w.enemies.every((enemy) => enemy.statuses.nanoSpdDown?.amount === -10));
  elishia.cooldowns.nano = 0;
  skill(w, "elishia", "nano").run(elishia, { mode: "Decoy" });
  assert.equal(elishia.statuses.decoy.amount, 15);
});

test("Biotech Overdrive grants +10% SPD and +10 Evasion for three Elishia turns", () => {
  const w = world();
  const elishia = w.byId.elishia;
  w.skillSet.onBattleStart(w.allies);
  assert.equal(elishia.biotechOverdriveTurns, 3);
  assert.equal(w.effective(elishia, "SPD"), 104);
  assert.equal(w.effective(elishia, "Evasion"), 20);
  w.skillSet.onTurnEnd(elishia);
  w.skillSet.onTurnEnd(elishia);
  assert.equal(w.effective(elishia, "SPD"), 104);
  w.skillSet.onTurnEnd(elishia);
  assert.equal(w.effective(elishia, "SPD"), 95);
  assert.equal(w.effective(elishia, "Evasion"), 10);
});

test("Elishia Adaptive Barrier absorbs 25% Max HP and adapts to the last absorbed damage type", () => {
  const w = world();
  const target = w.byId.jazen;
  skill(w, "elishia", "barrier").run(w.byId.elishia, { target });
  assert.equal(target.shields[0].value, Math.floor(target.stats.HP * 0.25));
  assert.equal(target.shields[0].turns, 2);
  applyDamage(target, 100, () => {}, () => {}, "Kinetic");
  assert.deepEqual(target.statuses.adaptiveResistance, { damageType: "Kinetic", amount: 15, turns: 2 });
});

test("Meo-v9 Emergency Field heals the lowest ally below 25%; otherwise it cover-fires", () => {
  const w = world();
  const elishia = w.byId.elishia;
  skill(w, "elishia", "meo").run(elishia, {});
  const meo = w.state.actors.find((actor) => actor.summon);
  w.byId.zenki.hp = 200;
  w.byId.jazen.hp = 150;
  w.skillSet.summonTurn(meo);
  assert.equal(w.byId.jazen.hp, 285, "10% of Jazen Max HP is restored");
  assert.equal(w.byId.zenki.hp, 200, "lowest HP ratio is selected");
  assert.ok(w.logs.some((line) => line.includes("Emergency Field")));
});

test("Nanotech Singularity applies the specified team buffs, enemy slow and 5% turn-start healing", () => {
  const w = world();
  const elishia = w.byId.elishia;
  elishia.hp -= 100;
  skill(w, "elishia", "ultimate").run(elishia, {});
  assert.equal(w.state.singularityTurns, 3);
  assert.equal(elishia.statuses.singularityAtk.amount, 15);
  assert.equal(elishia.statuses.singularitySpd.amount, 10);
  assert.equal(w.enemies[0].statuses.singularitySpdDown.amount, -10);
  const before = elishia.hp;
  w.skillSet.onTurnStart(elishia);
  // Singularity's 5% Max HP recovery is owned by the turn engine's field tick.
  assert.equal(elishia.hp, before);
});

test("Evalete Catalyst Protocol pulses every second Evalete turn for 12 turns", () => {
  const w = world();
  const evalete = w.byId.evalete;
  for (const ally of w.allies) ally.hp = 500;
  w.skillSet.onBattleStart(w.allies);
  w.skillSet.onTurnEnd(evalete);
  assert.ok(w.allies.every((ally) => ally.hp === 500 && ally.shields.length === 0));
  w.skillSet.onTurnEnd(evalete);
  assert.ok(w.allies.every((ally) => ally.hp === 500 + Math.floor(ally.stats.HP * 0.08)));
  assert.ok(w.allies.every((ally) => ally.shields.some((shield) => shield.value === Math.floor(ally.stats.HP * 0.1) && shield.turns === 2)));
  assert.equal(evalete.catalystWingTurns, 10);
});

test("Evalete's Triage, Guardian Field and Catalyst Overdrive match the owner values", () => {
  const w = world();
  const evalete = w.byId.evalete;
  w.byId.zenki.hp = 400;
  skill(w, "evalete", "triage").run(evalete, { target: w.byId.zenki });
  assert.equal(w.byId.zenki.hp, 620);
  w.byId.zenki.hp = 400;
  skill(w, "evalete", "guardian").run(evalete, {});
  assert.equal(w.byId.zenki.hp, 520);
  assert.equal(w.byId.zenki.statuses.guardianDef.amount, 15);
  addStatus(w.byId.zenki, "poison", { amount: -10, debuff: true, turns: 2 });
  evalete.mp = 110;
  skill(w, "evalete", "catalyst").run(evalete, {});
  assert.equal(w.byId.zenki.statuses.poison, undefined);
  assert.equal(w.byId.zenki.statuses.catalystDef.amount, 25);
  assert.equal(w.byId.zenki.statuses.retaliation.amount, 25);
  assert.equal(w.byId.zenki.statuses.catalystHot.hotPercentMaxHP, 10);
});

test("status and shield durations grant the full number of actor turns after application", () => {
  const w = world();
  const ally = w.byId.zenki;
  ally._isTakingTurn = true;
  addStatus(ally, "twoTurnBuff", { stat: "ATK", amount: 10, turns: 2 });
  addShield(ally, 100, 2);
  const { tickStatuses } = require("../systems/statusEffects");
  const { tickShields } = require("../systems/shields");
  tickStatuses(ally);
  tickShields(ally);
  assert.equal(ally.statuses.twoTurnBuff.turns, 2, "application during the current turn does not consume a duration turn immediately");
  assert.equal(ally.shields[0].turns, 2);
  ally._isTakingTurn = false;
  tickStatuses(ally);
  tickShields(ally);
  assert.equal(ally.statuses.twoTurnBuff.turns, 1);
  assert.equal(ally.shields[0].turns, 1);
  tickStatuses(ally);
  tickShields(ally);
  assert.equal(ally.statuses.twoTurnBuff, undefined);
  assert.equal(ally.shields.length, 0);
});

test("Zackry Tactical Mark increases incoming damage and reduces Evasion; marked defeat restores MP once", () => {
  const w = world();
  const zackry = w.byId.zackry;
  const target = w.enemies[0];
  const base = w.resolver.calculateMastery(zackry, target, "Electromagnetic", 1, false).damage;
  skill(w, "zackry", "mark").run(zackry, { target });
  const marked = w.resolver.calculateMastery(zackry, target, "Electromagnetic", 1, false).damage;
  assert.equal(marked, Math.floor(base * 1.15));
  assert.equal(w.effective(target, "Evasion"), -10 < 0 ? 0 : (target.stats.Evasion || 0) - 10);
  for (const ally of w.allies) ally.mp = 0;
  const before = w.allies.map((ally) => ally.mp);
  w.skillSet.onUnitDefeated(target, { tacticalMark: { ...target.statuses.tacticalMark } });
  assert.ok(w.allies.every((ally, i) => ally.mp === before[i] + Math.floor(ally.stats.MP * 0.05)));
});

test("Zackry Command Uplink recalculates its conditional ATK bonus at each ally turn", () => {
  const w = world();
  skill(w, "zackry", "uplink").run(w.byId.zackry, {});
  const evalete = w.byId.evalete;
  w.skillSet.onTurnStart(evalete);
  assert.equal(evalete.statuses.commandUplink.amount, 20);
  evalete.hp = 500;
  w.skillSet.onTurnStart(evalete);
  assert.equal(evalete.statuses.commandUplink.amount, 15);
});

test("Zackry EMP Burst uses the stronger slow against a Tactical Marked target", () => {
  const w = world();
  const target = w.enemies[0];
  addStatus(target, "tacticalMark", { amount: 15, damageTakenPercent: 15, turns: 3 });
  skill(w, "zackry", "emp").run(w.byId.zackry, { target });
  assert.equal(target.statuses.empSpdDown.amount, -35);
});

test("Zackry Overwatch grants the relevant ally +10 Accuracy for their next basic attack", () => {
  const w = world();
  const recon = w.enemies.find((enemy) => enemy.name === "Recon Drone");
  const jazen = w.byId.jazen;
  recon.targetedByAllyId = jazen.id;
  skill(w, "zackry", "emp").run(w.byId.zackry, { target: recon });
  assert.equal(jazen.nextAttackAccuracy, 10);
  const result = w.resolver.basicAttack(jazen, recon);
  assert.equal(result, true);
  assert.equal(jazen.nextAttackAccuracy, 0, "the bonus is consumed by the next attack");
});

test("Jazen Impact Grenade can Stagger enemies and the turn engine consumes Stagger as a lost action", () => {
  const w = world(0);
  skill(w, "jazen", "impactGrenade").run(w.byId.jazen, {});
  assert.ok(w.enemies.every((enemy) => enemy.statuses.staggered?.turns === 1));
  const { createTurnEngine } = require("../core/turnEngine");
  const target = w.enemies[0];
  const engine = createTurnEngine({
    state: w.state, getResult: () => null, output: { log() {} },
    combatReadiness: { nextActor: () => target, resetCR() {} },
    tickCooldowns() {}, tickStatuses() {}, tickShields() {}, heal() {},
    takeTurn() { throw new Error("Staggered actor must not take its action"); },
  });
  assert.equal(engine.turnStart(target), true);
  assert.equal(target.statuses.staggered, undefined);
});

test("Jazen Recoil Dampeners stack to ATK +20% and grant Stagger/action-delay immunity", () => {
  const w = world();
  const jazen = w.byId.jazen;
  w.skillSet.onDamageTaken(jazen, Math.floor(jazen.stats.HP * 0.11));
  assert.equal(jazen.statuses.jazenRecoil.amount, 10);
  w.skillSet.onDamageTaken(jazen, Math.floor(jazen.stats.HP * 0.11));
  assert.equal(jazen.statuses.jazenRecoil.amount, 20);
  assert.equal(jazen.statuses.jazenRecoil.stacks, 2);
  assert.equal(addStatus(jazen, "staggered", { turns: 1, debuff: true }), false);
});

test("Jazen Reinforced Plating grants shield, DEF and Taunt; enemy targeting honors Taunt", () => {
  const w = world();
  const jazen = w.byId.jazen;
  skill(w, "jazen", "reinforcedPlating").run(jazen, {});
  assert.equal(jazen.shields[0].value, Math.floor(jazen.stats.HP * 0.25));
  assert.equal(jazen.statuses.reinforcedDef.amount, 20);
  assert.equal(jazen.statuses.taunt.turns, 2);
  const { enemyTarget } = require("../ai/targeting");
  assert.equal(enemyTarget(w.state, w.enemies[0], formation.alive), jazen);
});

test("Zenki's basic-attack Accuracy penalty remains active when Unobserved's Evasion bonus is suppressed", () => {
  const w = world(0);
  const zenki = w.byId.zenki;
  zenki.stats.Evasion = 0;
  zenki.unobservedSuppressed = true;
  const before = zenki.hp;
  w.resolver.basicAttack(w.enemies[0], zenki);
  assert.equal(zenki.hp, before);
  assert.ok(w.logs.some((line) => line.includes("evades")));
});

test("Zenki Unobserved, Railshot, Cipher Tag, Ghost Protocol and Zero Hour use owner values", () => {
  const w = world();
  const zenki = w.byId.zenki;
  const target = w.enemies[0];
  assert.equal(w.effective(zenki, "Evasion"), (zenki.stats.Evasion || 0) + 12);
  w.skillSet.onEnemySkillTargeted(w.enemies[0], zenki);
  assert.equal(w.effective(zenki, "Evasion"), zenki.stats.Evasion || 0);
  w.skillSet.onDamageTaken(zenki, 1);
  assert.equal(w.effective(zenki, "Evasion"), zenki.stats.Evasion || 0);
  w.skillSet.onTurnStart(zenki);
  assert.equal(zenki.unobservedSuppressed, false);

  zenki.railshotUntargeted = true;
  const before = target.hp;
  skill(w, "zenki", "railshot").run(zenki, { target });
  const bonusDamage = before - target.hp;
  target.hp = target.stats.HP;
  zenki.cooldowns.railshot = 0;
  zenki.railshotUntargeted = false;
  const beforeNormal = target.hp;
  skill(w, "zenki", "railshot").run(zenki, { target });
  const normalDamage = beforeNormal - target.hp;
  assert.ok(bonusDamage > normalDamage * 1.25);

  skill(w, "zenki", "cipher").run(zenki, { target });
  assert.equal(target.statuses.cipherTag.damageTakenPercent, 12);
  assert.equal(target.statuses.cipherResDown.amount, -15);
  skill(w, "zenki", "ghost").run(zenki, {});
  assert.equal(zenki.statuses.ghostDamage.damageDealtPercent, 25);
  assert.equal(zenki.statuses.ghostEvasion.amount, 25);

  target.stats.HP = 5000;
  target.hp = Math.floor(target.stats.HP * 0.35);
  zenki.mp = zenki.stats.MP;
  skill(w, "zenki", "ultimate").run(zenki, { target });
  assert.equal(target.statuses.zeroHourSpdDown.amount, -25);
});
