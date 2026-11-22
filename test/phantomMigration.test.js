const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSkillData } = require("../core/skillInterpreter");
const { createPhantomParty } = require("../characters/phantom");
const mirazhel = require("../characters/skillData/mirazhel");
const elishiaP = require("../characters/skillData/elishia_p");
const lucaz = require("../characters/skillData/lucaz");
const clarke = require("../characters/skillData/clarke");
const liezli = require("../characters/skillData/liezli");
const { createPhantomWorld, phantomSkill } = require("./helpers/phantomWorld");
const { calculateMasteryDamage } = require("../systems/damage");
const { createFalconParty } = require("../characters/falcon");
const { effectiveStat } = require("../systems/statusEffects");
const ownerReference = require("../references/characterTerraData");
const { BLEEDING_TICK_POWER } = require("../characters/skillData/effects/bleeding");

const phantomData = [mirazhel, elishiaP, lucaz, clarke, liezli];

for (const data of phantomData) {
  test(`${data.characterId} skills validate through the shared skill schema`, () => {
    assert.doesNotThrow(() => validateSkillData(data));
    assert.equal(data.skills.length, 4);
  });
}

test("Phantom party uses its source stats, normalized Evasion/MPow keys, faction and passive data", () => {
  const party = createPhantomParty();
  assert.deepEqual(party.map((actor) => actor.id), ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"]);
  assert.ok(party.every((actor) => actor.faction === "phantom"));
  assert.ok(party.every((actor) => actor.passive && actor.skillSet === actor.id));
  assert.equal(party.find((actor) => actor.id === "liezli").stats.MPow, 0);
  assert.equal(party.find((actor) => actor.id === "elishia_p").name, "Unknown");
});

test("Phantom owner-reference effect tags use the standardized effect vocabulary", () => {
  const allowed = new Set(["DMG", "DOT", "HEAL", "SHIELD", "BUFF", "DEBUFF", "CONTROL", "UTILITY", "SUMMON"]);
  for (const id of ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"]) {
    const character = ownerReference.characters[id];
    for (const slot of ["passiveSkill", "skill1", "skill2", "skill3", "ultimate"]) {
      assert.ok(Array.isArray(character[slot].effects), `${id}.${slot} effects`);
      for (const tag of character[slot].effects) assert.ok(allowed.has(tag), `${id}.${slot} has nonstandard tag ${tag}`);
    }
  }
});

test("all 20 Phantom skills register and execute through the shared interpreter", () => {
  const w = createPhantomWorld();
  const cases = [
    ["mirazhel", "wraithfang", "enemy"], ["mirazhel", "veil", "ally"], ["mirazhel", "requiem", "enemy"], ["mirazhel", "ultimate", "none"],
    ["elishia_p", "severance", "enemy"], ["elishia_p", "aegis", "ally"], ["elishia_p", "phalanx", "enemy"], ["elishia_p", "ultimate", "none"],
    ["lucaz", "ironwake", "enemy"], ["lucaz", "bastion", "none"], ["lucaz", "faultline", "none"], ["lucaz", "ultimate", "none"],
    ["clarke", "riftpiercer", "enemy"], ["clarke", "aegisReversal", "none"], ["clarke", "thousandfold", "enemy"], ["clarke", "ultimate", "enemy"],
    ["liezli", "ghostlight", "enemy"], ["liezli", "refraction", "none"], ["liezli", "silverpoint", "none"], ["liezli", "ultimate", "enemy"],
  ];
  for (const [id, key, targeting] of cases) {
    const actor = w.byId[id];
    const skill = phantomSkill(w, id, key);
    actor.mp = 250;
    actor.cooldowns[key] = 0;
    const target = targeting === "enemy" ? w.enemies[0] : targeting === "ally" ? w.byId.clarke : undefined;
    assert.equal(skill.run(actor, { target }), true, `${id}/${key}`);
    assert.ok(actor.mp < 250, `${id}/${key} should charge MP`);
    assert.equal(actor.cooldowns[key], skill.cooldown, `${id}/${key} cooldown`);
  }
});

test("Mirazhel's Phantom Mark benefits Phantom damage only", () => {
  const w = createPhantomWorld();
  const mir = w.byId.mirazhel;
  const target = w.enemies[0];
  phantomSkill(w, "mirazhel", "wraithfang").run(mir, { target });
  assert.equal(target.statuses.phantomMark.damageTakenPercent, 10);
  assert.equal(target.statuses.phantomMark.damageTakenFaction, "phantom");

  const stat = (actor, key) => effectiveStat(w.state, actor, key);
  const faction = mir.faction;
  const phantomDamage = calculateMasteryDamage(mir, target, "Anomaly", stat, 1, false, () => 0.99).damage;
  mir.faction = "falcon";
  const nonPhantomDamage = calculateMasteryDamage(mir, target, "Anomaly", stat, 1, false, () => 0.99).damage;
  mir.faction = faction;
  assert.equal(phantomDamage, Math.floor(nonPhantomDamage * 1.1));
});

test("Veil of the Unseen can only target another Phantom ally", () => {
  const w = createPhantomWorld();
  const mir = w.byId.mirazhel;
  const veil = phantomSkill(w, "mirazhel", "veil");
  const mpBefore = mir.mp;
  assert.equal(veil.run(mir, { target: mir }), false);
  assert.equal(mir.mp, mpBefore);
  assert.equal(veil.run(mir, { target: w.byId.clarke }), true);
  assert.equal(w.byId.clarke.statuses.veilUnseenSpeed.amount, 15);

  const falconAlly = createFalconParty()[0];
  assert.equal(veil.run(mir, { target: falconAlly }), false);
});

test("hidden operative skill descriptions in the owner reference remain neutral", () => {
  const hidden = ownerReference.characters.elishia_p;
  const descriptions = ["passiveSkill", "skill1", "skill2", "skill3", "ultimate"]
    .map((slot) => hidden?.[slot]?.description);
  assert.equal(descriptions.filter(Boolean).length, 5);
  for (const description of descriptions) {
    assert.doesNotMatch(description, /phantom|elishia|sovereign|queen|roman|falcon/i);
  }
  assert.equal(hidden.skill1.title, "Skill 1: Scarlet Severance", "neutral descriptions do not rename approved skills");
});

test("successful Anomaly hits from the hidden operative apply DEF and RES reductions", () => {
  const w = createPhantomWorld();
  const hidden = w.byId.elishia_p;
  const target = w.enemies[0];
  phantomSkill(w, "elishia_p", "severance").run(hidden, { target });
  assert.equal(target.statuses.sovereignDefDown.amount, -10);
  assert.equal(target.statuses.sovereignResDown.amount, -10);
  assert.equal(target.statuses.sovereignDefDown.turns, 2);
});

test("the hidden operative's barrier scales from MPow and replaces only its own shield group", () => {
  const w = createPhantomWorld();
  const hidden = w.byId.elishia_p;
  const target = w.byId.lucaz;
  const shieldSkill = phantomSkill(w, "elishia_p", "aegis");
  assert.equal(shieldSkill.run(hidden, { target }), true);
  assert.equal(target.shields.at(-1).value, Math.floor(hidden.stats.MPow * 1.2));
  const otherShield = { value: 50, turns: 3, group: "other" };
  target.shields.unshift(otherShield);
  hidden.mp = 200;
  hidden.cooldowns.aegis = 0;
  assert.equal(shieldSkill.run(hidden, { target }), true);
  assert.ok(target.shields.includes(otherShield));
  assert.equal(target.shields.filter((shield) => shield.group === "scarletVeilAegis").length, 1);
});

test("Bleeding uses the approved 0.15× ATK baseline, stores Anomaly damage, and ticks at target turn start", () => {
  const w = createPhantomWorld();
  const liezliActor = w.byId.liezli;
  const target = w.enemies[0];
  const expectedTick = w.resolver.calculateMastery(liezliActor, target, "Anomaly", BLEEDING_TICK_POWER, false, "ATK").damage;
  phantomSkill(w, "liezli", "ghostlight").run(liezliActor, { target });
  const bleed = target.statuses.bleeding;
  assert.equal(BLEEDING_TICK_POWER, 0.15);
  assert.equal(bleed.turns, 2);
  assert.equal(bleed.damageType, "Anomaly");
  assert.equal(bleed.dotDamage, expectedTick);
  assert.equal(bleed.turnStart.damageField, "dotDamage");
  assert.equal(bleed.turnStart.damageTypeField, "damageType");
  const beforeTick = target.hp;
  w.skillSet.onTurnStart(target);
  assert.equal(target.hp, beforeTick - expectedTick);
});

test("Bleeding reapplication refreshes its two-turn duration without stacking or increasing the stored tick", () => {
  const w = createPhantomWorld();
  const liezliActor = w.byId.liezli;
  const target = w.enemies[0];
  const ghostlight = phantomSkill(w, "liezli", "ghostlight");
  ghostlight.run(liezliActor, { target });
  const initialTick = target.statuses.bleeding.dotDamage;
  target.statuses.bleeding.turns = 1;
  liezliActor.mp = 200;
  liezliActor.cooldowns.ghostlight = 0;
  ghostlight.run(liezliActor, { target });
  assert.equal(target.statuses.bleeding.turns, 2);
  assert.equal(target.statuses.bleeding.dotDamage, initialTick);
});

test("AoE follow-up Bleed, Stagger, and accuracy effects apply only to enemies actually hit", () => {
  // Crimson Phalanx: a missed single-target hit must not apply Bleeding.
  const hiddenWorld = createPhantomWorld({ randomValue: 0 });
  const hidden = hiddenWorld.byId.elishia_p;
  const missedTarget = hiddenWorld.enemies[0];
  missedTarget.stats.Evasion = 75;
  hidden.nextAttackAccuracy = 1;
  phantomSkill(hiddenWorld, "elishia_p", "phalanx").run(hidden, { target: missedTarget });
  assert.equal(missedTarget.statuses.bleeding, undefined, "missed Crimson Phalanx does not apply Bleeding");

  // Silverpoint Barrage: only the target that the AoE hit receives follow-up statuses.
  const liezliWorld = createPhantomWorld({ randomValue: 0 });
  const liezliActor = liezliWorld.byId.liezli;
  const evadeTarget = liezliWorld.enemies[0];
  const hitTarget = liezliWorld.enemies[1];
  evadeTarget.stats.Evasion = 75;
  liezliActor.nextAttackAccuracy = 1;
  phantomSkill(liezliWorld, "liezli", "silverpoint").run(liezliActor);
  assert.equal(evadeTarget.statuses.bleeding, undefined);
  assert.equal(evadeTarget.statuses.silverpointAccuracyDown, undefined);
  assert.ok(hitTarget.statuses.bleeding);
  assert.ok(hitTarget.statuses.silverpointAccuracyDown);

  // Faultline Breaker: Stagger is also restricted to opponents hit by the AoE.
  const lucazWorld = createPhantomWorld({ randomValue: 0 });
  const lucazActor = lucazWorld.byId.lucaz;
  const staggerEvade = lucazWorld.enemies[0];
  const staggerHit = lucazWorld.enemies[1];
  staggerEvade.stats.Evasion = 75;
  lucazActor.nextAttackAccuracy = 1;
  phantomSkill(lucazWorld, "lucaz", "faultline").run(lucazActor);
  assert.equal(staggerEvade.statuses.staggered, undefined);
  assert.ok(staggerHit.statuses.staggered);
});

test("Lucaz takes 10% reduced damage, builds two Reinforcement stacks, and consumes them on Kinetic damage", () => {
  const w = createPhantomWorld();
  const lucazActor = w.byId.lucaz;
  const attacker = w.enemies[0];
  assert.equal(lucazActor.passive.damageTakenPercent, -10);
  w.damage(lucazActor, 35, "Physical", attacker, { kind: "direct" });
  w.damage(lucazActor, 35, "Physical", attacker, { kind: "direct" });
  assert.equal(lucazActor.statuses.reinforcement.stacks, 2);
  assert.equal(lucazActor.statuses.reinforcement.amount, 16);
  assert.equal(lucazActor.statuses.reinforcementKineticCharge.nextSkillDamagePercent, 20);

  lucazActor.mp = 200;
  lucazActor.cooldowns.ironwake = 0;
  const hpBefore = attacker.hp;
  phantomSkill(w, "lucaz", "ironwake").run(lucazActor, { target: attacker });
  assert.ok(attacker.hp < hpBefore);
  assert.match(w.logs.at(-1), /\+20% next-skill bonus/);
  assert.equal(lucazActor.statuses.reinforcement, undefined);
  assert.equal(lucazActor.statuses.reinforcementKineticCharge, undefined);
  assert.equal(lucazActor.passiveFlags.reinforcementPrimed, false);
});

test("Lucaz's reinforcement charge is not consumed by a non-Kinetic damaging skill", () => {
  const w = createPhantomWorld();
  const lucazActor = w.byId.lucaz;
  const target = w.enemies[0];
  w.damage(lucazActor, 35, "Physical", target, { kind: "direct" });
  w.damage(lucazActor, 35, "Physical", target, { kind: "direct" });
  lucazActor.mp = 200;
  lucazActor.cooldowns.bastion = 0;
  phantomSkill(w, "lucaz", "bastion").run(lucazActor);
  assert.equal(lucazActor.statuses.reinforcement.stacks, 2);
  assert.ok(lucazActor.statuses.reinforcementKineticCharge);
});

test("Clarke gains Phase Advantage on evasion and consumes it on his next offensive skill", () => {
  const w = createPhantomWorld({ randomValue: 0 });
  const clarkeActor = w.byId.clarke;
  const attacker = w.enemies[0];
  w.resolver.basicAttack(attacker, clarkeActor);
  assert.ok(clarkeActor.statuses.phaseAdvantage);
  assert.equal(clarkeActor.statuses.phaseStrideDamage.nextSkillDamagePercent, 20);
  clarkeActor.mp = 200;
  clarkeActor.cooldowns.riftpiercer = 0;
  const target = w.enemies[1];
  phantomSkill(w, "clarke", "riftpiercer").run(clarkeActor, { target });
  assert.match(w.logs.at(-1), /\+20% next-skill bonus/);
  assert.equal(clarkeActor.statuses.phaseAdvantage, undefined);
  assert.equal(target.statuses.riftpiercerDefDown.amount, -10, "Phase Advantage also enables Riftpiercer's target DEF reduction");
});

test("Aegis Reversal's evasion proc is restricted to the next Riftpiercer", () => {
  const w = createPhantomWorld({ randomValue: 0 });
  const clarkeActor = w.byId.clarke;
  clarkeActor.mp = 200;
  phantomSkill(w, "clarke", "aegisReversal").run(clarkeActor);
  w.resolver.basicAttack(w.enemies[0], clarkeActor);
  assert.ok(clarkeActor.statuses.aegisRiftpiercerDamage);
  clarkeActor.cooldowns.thousandfold = 0;
  phantomSkill(w, "clarke", "thousandfold").run(clarkeActor, { target: w.enemies[1] });
  assert.ok(clarkeActor.statuses.aegisRiftpiercerDamage, "the Skill 1-only boost should remain for Riftpiercer");
});

test("Liezli gains a one-use CritRate boost on evasion and consumes it on an offensive skill", () => {
  const w = createPhantomWorld({ randomValue: 0 });
  const liezliActor = w.byId.liezli;
  w.resolver.basicAttack(w.enemies[0], liezliActor);
  assert.equal(liezliActor.statuses.mirageCritBoost.amount, 10);
  liezliActor.mp = 200;
  phantomSkill(w, "liezli", "ghostlight").run(liezliActor, { target: w.enemies[1] });
  assert.equal(liezliActor.statuses.mirageCritBoost, undefined);
});

test("Liezli's AoE applies Bleeding and an accuracy penalty to all living opponents", () => {
  const w = createPhantomWorld();
  const liezliActor = w.byId.liezli;
  liezliActor.mp = 200;
  phantomSkill(w, "liezli", "silverpoint").run(liezliActor);
  assert.ok(w.enemies.every((enemy) => enemy.statuses.bleeding));
  assert.ok(w.enemies.every((enemy) => enemy.statuses.silverpointAccuracyDown?.accuracyPenalty === 15));
});
