const test = require("node:test");
const assert = require("node:assert/strict");
const { addStatus, effectiveStat, tickStatuses, expireTurnStartStatuses } = require("../systems/statusEffects");
const { addShield } = require("../systems/shields");
const { consumeNextAttackDamageModifier } = require("../systems/statusEffects");
const { createFalconWorld, skill } = require("./helpers/falconWorld");

const pct = (value, percent) => Math.floor(value * percent / 100);

function applySkill(world, id, key, args = {}) {
  return skill(world, id, key).run(world.byId[id], args);
}

test("Evalete's Triage Infusion applies its instant heal and three-turn healing over time", () => {
  const w = createFalconWorld();
  const evalete = w.byId.evalete;
  const jazen = w.byId.jazen;
  jazen.hp -= 500;
  const before = jazen.hp;
  applySkill(w, "evalete", "triage", { target: jazen });
  assert.equal(jazen.hp, before + pct(jazen.stats.HP, 22));
  assert.equal(jazen.statuses.triageHot.hotPercentMaxHP, 10);
  assert.equal(jazen.statuses.triageHot.turns, 3);

  jazen.hp -= 100;
  const beforeTick = jazen.hp;
  w.skillSet.onTurnStart(jazen);
  assert.equal(jazen.hp, beforeTick + pct(jazen.stats.HP, 10));
});

test("Evalete's Guardian Field heals all active allies and applies DEF +15%", () => {
  const w = createFalconWorld();
  for (const ally of w.allies) ally.hp -= 200;
  applySkill(w, "evalete", "guardian");
  for (const ally of w.allies) {
    assert.equal(ally.hp, Math.min(ally.stats.HP, ally.stats.HP - 200 + pct(ally.stats.HP, 12)));
    assert.equal(ally.statuses.guardianDef.amount, 15);
  }
});

test("Catalyst Overdrive applies the approved heal, DEF, HOT, and 25% reflection buff", () => {
  const w = createFalconWorld();
  for (const ally of w.allies) ally.hp = ally.stats.HP - 500;
  applySkill(w, "evalete", "catalyst");
  for (const ally of w.allies) {
    assert.equal(ally.hp, ally.stats.HP - 500 + pct(ally.stats.HP, 18));
    assert.equal(ally.statuses.catalystDef.amount, 25);
    assert.equal(ally.statuses.catalystDef.turns, 3);
    assert.equal(ally.statuses.catalystReflection.damageReflectionPercent, 25);
    assert.equal(ally.statuses.catalystReflection.turns, 3);
    assert.equal(ally.statuses.catalystHot.hotPercentMaxHP, 10);
    assert.equal(ally.statuses.catalystHot.turns, 3);
  }
});

test("Zackry Tactical Mark applies +15% received damage and -10 Evasion without a defeat MP reward", () => {
  const w = createFalconWorld();
  const target = w.enemies[0];
  const evasionBeforeMark = w.effective(target, "Evasion");
  applySkill(w, "zackry", "mark", { target });
  assert.equal(target.statuses.tacticalMark.damageTakenPercent, 15);
  assert.equal(target.statuses.tacticalMark.evasionPenalty, 10);
  assert.equal(w.effective(target, "Evasion"), Math.max(0, evasionBeforeMark - 10));
  assert.equal(target.statuses.tacticalMark.onUnitDefeated, undefined);
});

test("Zackry Command Uplink and Full Spectrum Assault use Mpow buffs with strongest-value priority", () => {
  const w = createFalconWorld();
  const evalete = w.byId.evalete;
  applySkill(w, "zackry", "uplink");
  assert.equal(evalete.statuses.commandUplink.amount, 15);
  assert.equal(w.effective(evalete, "MPow"), pct(evalete.stats.MPow, 115));

  applySkill(w, "zackry", "ultimate");
  assert.equal(evalete.statuses.fullSpectrumMPow.amount, 20);
  assert.equal(evalete.statuses.fullSpectrumSPD.amount, 10);
  assert.equal(w.effective(evalete, "MPow"), pct(evalete.stats.MPow, 120), "Mpow +20 takes priority over +15");
  assert.equal(w.effective(evalete, "SPD"), pct(evalete.stats.SPD, 110));
  assert.ok(w.enemies.every((enemy) => enemy.statuses.tacticalMark?.damageTakenPercent === 15));
});

test("Zackry EMP Burst applies a fixed SPD -20% regardless of Tactical Mark", () => {
  const w = createFalconWorld();
  const target = w.enemies[0];
  applySkill(w, "zackry", "mark", { target });
  const baseSPD = w.effective(target, "SPD");
  w.byId.zackry.cooldowns.emp = 0;
  applySkill(w, "zackry", "emp", { target });
  assert.equal(target.statuses.empSpdDown.amount, -20);
  assert.equal(w.effective(target, "SPD"), pct(baseSPD, 80));
});

test("Jazen's Impact Grenade deals Kinetic area damage without Stagger", () => {
  const w = createFalconWorld();
  const before = w.enemies.map((enemy) => enemy.hp);
  applySkill(w, "jazen", "impactGrenade");
  assert.ok(w.enemies.every((enemy, index) => enemy.hp < before[index]));
  assert.ok(w.enemies.every((enemy) => enemy.statuses.staggered === undefined));
});

test("Jazen's Reinforced Plating grants only its shield and DEF buff, with no Taunt", () => {
  const w = createFalconWorld();
  const jazen = w.byId.jazen;
  applySkill(w, "jazen", "reinforcedPlating");
  assert.equal(jazen.shields[0].value, pct(jazen.stats.HP, 25));
  assert.equal(jazen.shields[0].turns, 3);
  assert.equal(jazen.statuses.reinforcedDef.amount, 20);
  assert.equal(jazen.statuses.taunt, undefined);
});

test("Zenki Unobserved grants Evasion after an undamaged interval and suppresses it when hit", () => {
  const w = createFalconWorld();
  const zenki = w.byId.zenki;
  const base = zenki.stats.Evasion;
  w.skillSet.onTurnStart(zenki);
  assert.equal(w.effective(zenki, "Evasion"), base + 12);
  w.damage(zenki, 5, "Physical", w.enemies[0]);
  assert.equal(w.effective(zenki, "Evasion"), base);
  w.skillSet.onTurnStart(zenki);
  assert.equal(w.effective(zenki, "Evasion"), base, "the prior hit suppresses the next start-of-turn bonus");
  w.skillSet.onTurnStart(zenki);
  assert.equal(w.effective(zenki, "Evasion"), base + 12, "the bonus returns after one undamaged interval");
});

test("Railshot is guaranteed to hit and uses only its 1.1x Energy power", () => {
  const w = createFalconWorld();
  const zenki = w.byId.zenki;
  const target = w.enemies[0];
  target.stats.Evasion = 75;
  const before = target.hp;
  applySkill(w, "zenki", "railshot", { target });
  assert.ok(target.hp < before);
  assert.equal(zenki.statuses.ghostAttackBoost, undefined);
});

test("Cipher Tag reduces RES by 15%, replaces its previous target, and does not add damage vulnerability", () => {
  const w = createFalconWorld();
  const zenki = w.byId.zenki;
  const first = w.enemies[0];
  const second = w.enemies[1];
  applySkill(w, "zenki", "cipher", { target: first });
  assert.equal(first.statuses.cipherTag.amount, -15);
  assert.equal(first.statuses.cipherTag.stat, "RES");
  assert.equal(first.statuses.cipherTag.damageTakenPercent, undefined);
  zenki.cooldowns.cipher = 0;
  applySkill(w, "zenki", "cipher", { target: second });
  assert.equal(first.statuses.cipherTag, undefined);
  assert.equal(second.statuses.cipherTag.amount, -15);
});

test("Ghost Protocol is Untargetable until Zenki's next turn and its +30% bonus is consumed once", () => {
  const w = createFalconWorld();
  const zenki = w.byId.zenki;
  const target = w.enemies[0];
  zenki._isTakingTurn = true;
  applySkill(w, "zenki", "ghost");
  assert.equal(zenki.statuses.ghostUntargetable.untargetable, true);
  assert.equal(consumeNextAttackDamageModifier(zenki), 30);
  assert.equal(consumeNextAttackDamageModifier(zenki), 0);
  zenki._isTakingTurn = false;
  expireTurnStartStatuses(zenki);
  assert.equal(zenki.statuses.ghostUntargetable, undefined);
  assert.ok(target.alive);
});

test("Zero Hour Execution fires three Energy hits and snapshots its below-40% final-shot override", () => {
  let calls = 0;
  const w = createFalconWorld({ randomValue: () => { calls++; return 0.99; } });
  const zenki = w.byId.zenki;
  const target = w.enemies[0];
  target.stats.HP = 10000;
  target.hp = 3900;
  const before = target.hp;
  applySkill(w, "zenki", "ultimate", { target });
  assert.ok(target.hp < before);
  assert.equal(calls, 3, "each of the three hits resolves an individual critical roll");
  assert.ok(w.logs.some((line) => /3 rail shots/.test(line)));
  assert.equal(target.statuses.zeroHourSpdDown, undefined, "old Cipher Tag follow-up removed");
});

test("same-stat modifiers use strongest-value priority and reapplication refreshes duration without strengthening", () => {
  const w = createFalconWorld();
  const actor = w.byId.evalete;
  addStatus(actor, "buffA", { stat: "MPow", amount: 15, turns: 2 });
  addStatus(actor, "buffB", { stat: "MPow", amount: 20, turns: 1 });
  assert.equal(w.effective(actor, "MPow"), pct(actor.stats.MPow, 120));
  addStatus(actor, "buffA", { stat: "MPow", amount: 30, turns: 4 });
  assert.equal(actor.statuses.buffA.amount, 15);
  assert.equal(actor.statuses.buffA.turns, 4);
  assert.equal(w.effective(actor, "MPow"), pct(actor.stats.MPow, 120));
  addStatus(actor, "mpowDown", { stat: "MPow", amount: -10, turns: 2 });
  assert.equal(w.effective(actor, "MPow"), pct(actor.stats.MPow, 110));
});

test("same status types can coexist, but weaker same-stat modifiers resume after stronger ones expire", () => {
  const w = createFalconWorld();
  const actor = w.byId.jazen;
  addStatus(actor, "mpow15", { stat: "MPow", amount: 15, turns: 3 });
  addStatus(actor, "mpow20", { stat: "MPow", amount: 20, turns: 1 });
  addStatus(actor, "bleed", { dotDamage: 5, damageType: "Toxic", turns: 2 });
  addStatus(actor, "slow", { stat: "SPD", amount: -20, turns: 2, debuff: true });
  assert.equal(w.effective(actor, "MPow"), pct(actor.stats.MPow, 120));
  assert.ok(actor.statuses.bleed && actor.statuses.slow, "different effect categories coexist");
  tickStatuses(actor);
  assert.equal(actor.statuses.mpow20, undefined);
  assert.equal(w.effective(actor, "MPow"), pct(actor.stats.MPow, 115), "the weaker +15% buff resumes after +20% expires");
});

test("Catalyst Overdrive reflection damages the original attacker through the battle damage pipeline without recursion", async () => {
  const { createBattle } = require("../core/battle");
  const { createEventBus } = require("../core/eventBus");
  const { createBasicAttackController } = require("../core/controllers");
  const events = createEventBus({ record: true });
  let evaleteHpAfterDirectHit;
  let enemyHpBefore;
  let enemyHpAfter;
  const battle = createBattle({
    seed: 9182,
    events,
    partyOrder: ["elishia", "evalete", "zackry", "jazen", "zenki"],
    output: { log() {} },
    controllers: {
      player: createBasicAttackController(),
      enemy: createBasicAttackController(),
    },
  });

  events.on("BattleStarted", () => {
    const evalete = battle.state.actors.find((actor) => actor.id === "evalete");
    const enemy = battle.state.actors.find((actor) => actor.side === "enemy" && actor.alive);
    // This mirrors Catalyst Overdrive's declared 3-turn reflection buff. The
    // skill application itself is covered separately by the interpreter test.
    addStatus(evalete, "catalystReflection", { damageReflectionPercent: 25, turns: 3 });
    addShield(evalete, 500, 3);
    enemyHpBefore = enemy.hp;
    const logStart = battle.state.log.length;
    battle.dealDamage(evalete, 100, "Physical", enemy, { kind: "direct" });
    enemyHpAfter = enemy.hp;
    evaleteHpAfterDirectHit = evalete.hp;
    // The probe should emit exactly one reflection event: reflected damage itself
    // cannot trigger another reflection.
    battle.reflectionProbeCount = battle.state.log.slice(logStart).filter((line) => /reflects \d+ damage back/.test(line)).length;
  });

  await battle.run();
  const evalete = battle.state.actors.find((actor) => actor.id === "evalete");
  assert.equal(evaleteHpAfterDirectHit, evalete.stats.HP, "the direct hit is absorbed by Evalete's shield");
  assert.ok(enemyHpAfter < enemyHpBefore, "25% of the mitigated direct hit is returned to the attacker");
  assert.ok(battle.state.log.some((line) => /Evalete reflects \d+ damage back/.test(line)));
  assert.equal(battle.reflectionProbeCount, 1, "the direct hit creates one reflection and no recursive reflection");
});
