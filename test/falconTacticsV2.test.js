const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createCoordinatedFalconController,
  hasToxicDot,
  reserveSwitchDecision,
  selectFocusEnemy,
} = require("../ai/falconTacticsV2");
const { playHeadless } = require("../tools/lib/headless");
const { createEventBus } = require("../core/eventBus");
const { enemyTarget } = require("../ai/targeting");
const { createPassiveRegistry } = require("../systems/passives/registry");

test("coordinated Falcon recognizes Toxic DoT and prioritizes Catalyst Overdrive cleanse", () => {
  const poison = { damageType: "Toxic", dotDamage: 55, turnStart: { damageField: "dotDamage", damageTypeField: "damageType" }, turns: 2 };
  const view = {
    actor: { id: "evalete", hp: 900, maxHp: 1450, statuses: {} },
    allies: [
      { id: "evalete", hp: 900, maxHp: 1450, statuses: {} },
      { id: "jazen", hp: 600, maxHp: 1350, statuses: { overseerSporeRot: poison } },
      { id: "zackry", hp: 700, maxHp: 1250, statuses: { overseerMiasma: poison } },
    ],
    enemies: [{ id: "blightheart-overseer-matriarch", hp: 2600, maxHp: 3900, statuses: {} }],
    actions: [
      { type: "skill", key: "catalyst", usable: true, targeting: "none" },
      { type: "skill", key: "guardian", usable: true, targeting: "none" },
    ],
  };
  assert.equal(hasToxicDot(view.allies[1]), true);
  assert.deepEqual(createCoordinatedFalconController().chooseAction(view), { type: "skill", skillKey: "catalyst" });
});

test("coordinated Falcon prioritizes Adaptive Barrier on an ally suffering Toxic DoT", () => {
  const poison = { damageType: "Toxic", dotDamage: 50, turnStart: { damageField: "dotDamage", damageTypeField: "damageType" }, turns: 2 };
  const view = {
    actor: { id: "elishia", hp: 1100, maxHp: 1100, statuses: {} },
    allies: [
      { id: "elishia", hp: 1100, maxHp: 1100, statuses: {} },
      { id: "jazen", hp: 900, maxHp: 1350, statuses: { overseerSporeRot: poison }, shields: [] },
      { id: "evalete", hp: 1300, maxHp: 1450, statuses: {} },
    ],
    enemies: [{ id: "toxic-stalker-test", hp: 700, maxHp: 1322, statuses: {} }],
    actions: [
      { type: "skill", key: "meo", usable: false, targeting: "none" },
      { type: "skill", key: "barrier", usable: true, targeting: "ally", targets: ["elishia", "jazen", "evalete"] },
      { type: "skill", key: "ultimate", usable: false, targeting: "none" },
    ],
  };
  assert.deepEqual(createCoordinatedFalconController().chooseAction(view), { type: "skill", skillKey: "barrier", targetId: "jazen" });
});

test("coordinated target focus clears dangerous adds before the boss, but executes a weakened boss", () => {
  const enemies = [
    { id: "blightheart-overseer-matriarch", hp: 2500, maxHp: 3900, statuses: {} },
    { id: "toxic-stalker-heart-stalker", hp: 900, maxHp: 1322, statuses: {} },
    { id: "recon-drone-heart-recon", hp: 600, maxHp: 1000, statuses: {} },
  ];
  const view = { enemies };
  assert.equal(selectFocusEnemy(view, enemies.map((unit) => unit.id)).id, "toxic-stalker-heart-stalker");
  enemies[0].hp = 1400;
  assert.equal(selectFocusEnemy(view, enemies.map((unit) => unit.id)).id, "blightheart-overseer-matriarch");
});

test("enemy support-priority targeting selects the Field Medic ahead of damage roles", () => {
  const medic = { id: "evalete", role: "field-medic", hp: 1100, stats: { HP: 1450 }, side: "ally", statuses: {} };
  const juggernaut = { id: "jazen", role: "juggernaut", hp: 700, stats: { HP: 1350 }, side: "ally", statuses: {} };
  const state = { actors: [medic, juggernaut] };
  const target = enemyTarget(state, { targetSelection: "supportPriority" }, (_state, side) => side === "ally" ? [medic, juggernaut] : []);
  assert.equal(target.id, "evalete");
});

test("reserve switching chooses a healthy replacement for a critically wounded active member", () => {
  const view = {
    actor: { id: "evalete" },
    allies: [
      { id: "jazen", hp: 230, maxHp: 1350, statuses: {}, shields: [] },
      { id: "evalete", hp: 1300, maxHp: 1450, statuses: {}, shields: [] },
      { id: "zackry", hp: 1000, maxHp: 1250, statuses: {}, shields: [] },
    ],
    actions: [{
      type: "switch",
      active: [{ id: "jazen", hp: 230, maxHp: 1350, alive: true }, { id: "evalete", hp: 1300, maxHp: 1450, alive: true }, { id: "zackry", hp: 1000, maxHp: 1250, alive: true }],
      reserves: [{ id: "elishia", hp: 1100, maxHp: 1100, alive: true }, { id: "zenki", hp: 1000, maxHp: 1000, alive: true }],
    }],
  };
  assert.deepEqual(reserveSwitchDecision(view), { type: "switch", reserveId: "elishia", activeId: "jazen" });
});

test("headless maxActive creates a true three-active, two-reserve formation", { timeout: 120000 }, async () => {
  const observed = [];
  const events = createEventBus({ record: true });
  const player = {
    chooseAction(view) {
      const switchAction = view.actions.find((item) => item.type === "switch");
      if (!observed.length) observed.push({ active: switchAction.active.map((item) => item.id), reserve: switchAction.reserves.map((item) => item.id) });
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  const battle = await playHeadless({
    seed: 991301, maxActive: 3,
    partyOrder: ["jazen", "evalete", "zackry", "elishia", "zenki"],
    events, controllers: { player },
  });
  assert.equal(observed.length, 1);
  assert.deepEqual(observed[0].active, ["jazen", "evalete", "zackry"]);
  assert.deepEqual(observed[0].reserve, ["elishia", "zenki"]);
  assert.equal(battle.state.party.maxActive, 3);
});

test("phase threshold handler applies a temporary exposed-core debuff when awakening", () => {
  const applied = [];
  const actor = {
    id: "blightheart-overseer", name: "Blightheart Overseer", alive: true, hp: 500,
    stats: { HP: 1000 }, passiveFlags: { blightheartAwakened: false },
    passive: { name: "Blightheart Awakening", events: { damageTaken: [{
      handler: "activateFlagBelowHpPercent", flag: "blightheartAwakened", thresholdPercent: 55,
      transitionStatus: { id: "overseerCoreExposed", stat: "RES", amount: -15, turns: 2, debuff: true },
    }] } },
  };
  const registry = createPassiveRegistry({ addStatus: (_unit, id, data) => applied.push({ id, data }), say() {} });
  registry.dispatch(actor, "damageTaken");
  assert.equal(actor.passiveFlags.blightheartAwakened, true);
  assert.deepEqual(applied, [{ id: "overseerCoreExposed", data: { stat: "RES", amount: -15, turns: 2, debuff: true } }]);
});

test("coordinated controller completes a real three-active boss battle without rejected actions", { timeout: 120000 }, async () => {
  const events = createEventBus({ record: true });
  const rejected = [];
  const switches = [];
  const skillUses = [];
  events.on("DecisionRejected", (event) => rejected.push(event));
  events.on("PartySwitched", (event) => switches.push(event));
  events.on("SkillUsed", (event) => skillUses.push(event));
  const battle = await playHeadless({
    seed: 991302,
    encounter: "blightheartSanctum",
    policy: "coordinated",
    maxActive: 3,
    partyOrder: ["jazen", "evalete", "zackry", "elishia", "zenki"],
    events,
  });
  assert.ok(["VICTORY", "DEFEAT"].includes(battle.result));
  assert.equal(rejected.length, 0, JSON.stringify(rejected.slice(0, 3)));
  assert.ok(skillUses.length > 0);
  assert.equal(battle.state.party.maxActive, 3);
  assert.equal(battle.state.party.active.length, 3);
  assert.ok(battle.events.history.some((event) => event.type === "EncounterWaveStarted" && event.waveId === "heart-chamber"));
});

test("Evalete's live Catalyst Overdrive cleanses Toxic DoT and harmful debuffs from active allies", () => {
  const { createFalconWorld, skill } = require("./helpers/falconWorld");
  const world = createFalconWorld();
  const toxicDot = {
    damageType: "Toxic",
    dotDamage: 63,
    turns: 2,
    debuff: true,
    turnStart: { damageField: "dotDamage", damageTypeField: "damageType" },
    sourceId: "toxic-stalker",
  };
  world.byId.jazen.statuses.overseerSporeRot = { ...toxicDot };
  world.byId.zackry.statuses.overseerMiasma = { ...toxicDot };
  world.byId.elishia.statuses.hostileAimDisruption = { stat: "EVA", amount: -10, turns: 2, debuff: true };
  world.byId.jazen.statuses.helpfulShielding = { stat: "DEF", amount: 10, turns: 2 };

  const catalyst = skill(world, "evalete", "catalyst");
  assert.equal(catalyst.run(world.byId.evalete), true);

  assert.equal(world.byId.jazen.statuses.overseerSporeRot, undefined);
  assert.equal(world.byId.zackry.statuses.overseerMiasma, undefined);
  assert.equal(world.byId.elishia.statuses.hostileAimDisruption, undefined);
  assert.ok(world.byId.jazen.statuses.helpfulShielding, "positive ally buffs should not be cleansed");
  assert.ok(world.byId.jazen.statuses.catalystReflection, "Catalyst Overdrive should still apply reflection");
  assert.ok(world.byId.jazen.statuses.catalystDef, "Catalyst Overdrive should still apply DEF support");
  const cleanses = world.events.history.filter((event) => event.type === "StatusCleansed");
  assert.equal(cleanses.length, 3);
  assert.ok(cleanses.some((event) => event.targetId === "jazen" && event.statusIds.includes("overseerSporeRot")));
  assert.ok(world.logs.some((line) => line.includes("Cleanses 3 harmful effects")));
});


test("Evalete conserves MP for Catalyst Overdrive while multiple allies suffer Toxic DoT", () => {
  const poison = { damageType: "Toxic", dotDamage: 55, turnStart: { damageField: "dotDamage", damageTypeField: "damageType" }, turns: 2 };
  const view = {
    actor: { id: "evalete", hp: 900, maxHp: 1450, mp: 40, statuses: {} },
    allies: [
      { id: "evalete", hp: 900, maxHp: 1450, statuses: {} },
      { id: "jazen", hp: 600, maxHp: 1350, statuses: { spore: poison } },
      { id: "zackry", hp: 700, maxHp: 1250, statuses: { miasma: poison } },
    ],
    enemies: [{ id: "toxic-stalker-test", hp: 700, maxHp: 1322, statuses: {} }],
    actions: [
      { type: "basic", targets: ["toxic-stalker-test"] },
      { type: "skill", key: "catalyst", cost: 65, usable: false, targeting: "none" },
      { type: "skill", key: "pulse", cost: 20, usable: true, targeting: "enemy", targets: ["toxic-stalker-test"] },
    ],
  };
  assert.deepEqual(createCoordinatedFalconController().chooseAction(view), { type: "basic", targetId: "toxic-stalker-test" });
});
