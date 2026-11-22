const test = require("node:test");
const assert = require("node:assert/strict");
const { addStatus, effectiveStat, tickStatuses } = require("../systems/statusEffects");
const { addShield, tickShields } = require("../systems/shields");
const { calculateMasteryDamage } = require("../systems/damage");
const { createFalconWorld, skill } = require("./helpers/falconWorld");
const { validateSkillData } = require("../core/skillInterpreter");
const elishiaData = require("../characters/skillData/elishia");

const byId = (world, id) => world.state.actors.find((actor) => actor.id === id);

function startBattle(world) {
  world.skillSet.onBattleStart(world.allies);
}

function takeOwnerTurn(world, actor) {
  world.skillSet.onTurnStart(actor);
  world.skillSet.onTurnEnd(actor);
}

test("Biotech Overdrive starts at battle start, lasts three Elishia turns, and respects strongest-stat priority", () => {
  const w = createFalconWorld();
  startBattle(w);
  const elishia = w.byId.elishia;
  assert.equal(elishia.passiveTimers.overdrive, 3);
  assert.equal(w.effective(elishia, "SPD"), 104);
  assert.equal(w.effective(elishia, "Evasion"), 20);

  addStatus(elishia, "decoy", { stat: "Evasion", amount: 15, turns: 2 });
  assert.equal(w.effective(elishia, "Evasion"), 25, "Decoy's +15 takes priority over passive +10");
  addStatus(elishia, "spdDown", { stat: "SPD", amount: -10, turns: 2 });
  assert.equal(w.effective(elishia, "SPD"), 95, "opposing modifiers offset in percentage points");

  takeOwnerTurn(w, elishia);
  assert.equal(elishia.passiveTimers.overdrive, 2);
  takeOwnerTurn(w, elishia);
  assert.equal(elishia.passiveTimers.overdrive, 1);
  takeOwnerTurn(w, elishia);
  assert.equal(elishia.passiveTimers.overdrive, 0);
  assert.equal(w.effective(elishia, "SPD"), 85, "only the active -10% SPD debuff remains");
});

test("Nano Swarm Repair heals one selected ally only", () => {
  const w = createFalconWorld();
  const elishia = w.byId.elishia;
  const target = w.byId.evalete;
  const untouched = w.byId.jazen;
  target.hp -= 400;
  const otherBefore = untouched.hp;

  skill(w, "elishia", "nano").run(elishia, { mode: "Repair", target });

  assert.equal(target.hp, target.stats.HP - 400 + Math.floor(target.stats.HP * 0.15));
  assert.equal(untouched.hp, otherBefore);
});

test("Nano Swarm Disrupt and Decoy apply only their declared one-target effects", () => {
  const w = createFalconWorld();
  const elishia = w.byId.elishia;
  const target = w.enemies[0];
  const before = target.hp;
  skill(w, "elishia", "nano").run(elishia, { mode: "Disrupt", target });
  assert.ok(target.hp < before);
  assert.equal(target.statuses.nanoSpdDown.amount, -10);
  assert.equal(w.enemies[1].statuses.nanoSpdDown, undefined);

  elishia.cooldowns.nano = 0; // the previous mode used the same active skill cooldown
  skill(w, "elishia", "nano").run(elishia, { mode: "Decoy" });
  assert.equal(elishia.statuses.decoy.amount, 15);
});

test("Adaptive Barrier maintains separate shield capacity and adapts to the newest absorbed damage type", () => {
  const w = createFalconWorld();
  const target = w.byId.zenki;
  skill(w, "elishia", "barrier").run(w.byId.elishia, { target });
  const originalShield = target.shields[0];
  const originalShieldValue = originalShield.value;
  assert.equal(originalShieldValue, Math.floor(target.stats.HP * 0.25));
  assert.equal(originalShield.turns, 2);

  const kinetic = Math.floor(originalShieldValue / 2);
  w.damage(target, kinetic, "Kinetic", w.enemies[0]);
  assert.equal(target.statuses.adaptiveResistance.damageType, "Kinetic");
  w.damage(target, 1, "Energy", w.enemies[0]);
  assert.equal(target.statuses.adaptiveResistance.damageType, "Energy");

  addShield(target, 30, 3);
  assert.equal(target.shields.length, 2);
  assert.ok(target.shields[0].value < originalShieldValue);
  tickShields(target);
  assert.equal(target.shields.length, 2);
});

test("Meo-9 skips the deployment turn, then performs three owner-turn activations and expires without a finale", () => {
  const w = createFalconWorld();
  const elishia = w.byId.elishia;
  const target = w.enemies[0];
  const before = target.hp;
  skill(w, "elishia", "meo").run(elishia, {});
  const meo = byId(w, "meo-9");
  assert.ok(meo);
  assert.equal(meo.passiveSummon, true);
  assert.equal(meo.targetableByEnemy, true);

  w.skillSet.onTurnEnd(elishia);
  assert.equal(target.hp, before, "no activation during the deployment turn");
  assert.equal(meo.summonTurns, 3);

  for (let i = 0; i < 3; i++) w.skillSet.onTurnEnd(elishia);
  assert.ok(target.hp < before, "covering fire is applied on subsequent owner turns");
  assert.equal(meo.alive, false);
  assert.equal(meo.summonTurns, 0);
  assert.equal(w.events.history?.some((event) => event.type === "ActorSummonExpired" && event.actorId === meo.id), true);
  assert.equal(w.enemies.some((enemy) => enemy.statuses.meoFinalProtocolSpdDown), false);
});

test("Meo-9 Emergency Field heals the lowest HP-ratio ally below 25% instead of attacking", () => {
  const w = createFalconWorld();
  const elishia = w.byId.elishia;
  const jazen = w.byId.jazen;
  const zenki = w.byId.zenki;
  jazen.hp = Math.floor(jazen.stats.HP * 0.18);
  zenki.hp = Math.floor(zenki.stats.HP * 0.20);
  const target = w.enemies[0];
  const enemyBefore = target.hp;
  skill(w, "elishia", "meo").run(elishia, {});
  w.skillSet.onTurnEnd(elishia); // deployment turn: skipped
  w.skillSet.onTurnEnd(elishia); // activation 1

  assert.equal(jazen.hp, Math.floor(jazen.stats.HP * 0.18) + Math.floor(jazen.stats.HP * 0.10));
  assert.equal(zenki.hp, Math.floor(zenki.stats.HP * 0.20));
  assert.equal(target.hp, enemyBefore, "Emergency Field replaces covering fire");
});

test("Meo-9 uses 75% covering fire during Nanotech Singularity and has no EMP destruction effect", () => {
  const w = createFalconWorld();
  const elishia = w.byId.elishia;
  skill(w, "elishia", "meo").run(elishia, {});
  const meo = byId(w, "meo-9");
  w.skillSet.onTurnEnd(elishia); // skip deployment turn
  skill(w, "elishia", "ultimate").run(elishia, {});
  const target = w.enemies[0];
  const before = target.hp;
  w.skillSet.onTurnEnd(elishia);
  assert.ok(target.hp < before);
  assert.equal(w.state.battleTimers.singularity.turns, 3, "the timer does not tick on the turn when it is applied");

  const remaining = w.enemies.map((enemy) => enemy.hp);
  meo.alive = false;
  w.skillSet.summonDestroyed(meo);
  assert.deepEqual(w.enemies.map((enemy) => enemy.hp), remaining, "destroying Meo-9 does not trigger an EMP or other burst");
});

test("Nanotech Singularity heals active allies at their turn starts and uses the approved ATK/SPD effects", () => {
  const w = createFalconWorld();
  const elishia = w.byId.elishia;
  const evalete = w.byId.evalete;
  evalete.hp -= 300;
  skill(w, "elishia", "ultimate").run(elishia, {});
  assert.equal(evalete.statuses.singularityAtk.amount, 15);
  assert.equal(evalete.statuses.singularitySpd.amount, 10);
  assert.equal(w.enemies[0].statuses.singularitySpdDown.amount, -10);

  const before = evalete.hp;
  w.skillSet.onTurnStart(evalete);
  assert.equal(evalete.hp, before + Math.floor(evalete.stats.HP * 0.05));
  assert.equal(evalete.statuses.singularityAtk.turns, 3, "a field applied mid-owner-turn is not immediately ticked on the owner's turn end");
});

test("Elishia skill data validates and no removed Meo-9 effects remain", () => {
  assert.doesNotThrow(() => validateSkillData(elishiaData));
  const meo = elishiaData.summons.meo9;
  assert.equal(meo.scan, undefined);
  assert.equal(meo.onDestroyed, undefined);
  assert.deepEqual(meo.ownerTurnLifecycle.activation.map((entry) => entry.handler), ["emergencyField", "coverFire"]);
  assert.equal(meo.lifecycle, undefined);
});
