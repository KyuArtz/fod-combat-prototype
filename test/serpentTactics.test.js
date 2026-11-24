const test = require("node:test");
const assert = require("node:assert/strict");
const { chooseSerpentAction } = require("../ai/serpentTactics");

function makeView({ allyStatuses = {}, allyHp = 900, maxHp = 1000, treatmentAvailable = true, allies: allySpecs, actorStatuses = {} } = {}) {
  const verra = { id: "verra", skillSet: "verra", hp: 1000, maxHp: 1000, statuses: actorStatuses };
  const allies = (allySpecs || [{ id: "kane", role: "stalker", hp: allyHp, maxHp, statuses: allyStatuses }])
    .map((unit) => ({ role: "stalker", maxHp: 1000, statuses: {}, ...unit }));
  const enemy = { id: "phantom-lucaz", role: "juggernaut", hp: 1000, maxHp: 1000, statuses: {} };
  const targetIds = [verra.id, ...allies.map((unit) => unit.id)];
  const actions = [
    { type: "basic", targets: [enemy.id] },
    { type: "skill", key: "unstableRemedy", usable: true, modes: [{ id: "remedy", targets: targetIds }] },
    { type: "skill", key: "causticInjection", usable: treatmentAvailable, modes: [{ id: "treat", targets: targetIds }] },
    { type: "skill", key: "chemicalCatastrophe", usable: false },
    { type: "skill", key: "ultimate", usable: false },
  ];
  return { kind: "player", actor: verra, friendlies: [verra, ...allies], opponents: [enemy], actions };
}

test("Verra cleanses an ally's action-disrupting control even when healthy", () => {
  const view = makeView({ allyStatuses: { staggered: { debuff: true, delayCR: 20, turns: 1 } } });
  assert.deepEqual(chooseSerpentAction(view), { type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "kane" });
});

test("Verra prioritizes harmful damage-over-time cleansing on a healthy ally", () => {
  const view = makeView({ allyStatuses: { bleeding: { debuff: true, dotDamage: 80, damageType: "Anomaly", turns: 2 } } });
  assert.deepEqual(chooseSerpentAction(view), { type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "kane" });
});

test("Verra uses Caustic Injection treatment for a moderately injured ally with a harmful debuff", () => {
  const view = makeView({ allyHp: 880, allyStatuses: { defDown: { debuff: true, stat: "DEF", amount: -15, turns: 2 } } });
  assert.deepEqual(chooseSerpentAction(view), { type: "skill", skillKey: "causticInjection", mode: "treat", targetId: "kane" });
});

test("Verra does not waste a healing cleanse mode on a healthy ally with only beneficial statuses", () => {
  const view = makeView({ allyStatuses: { resistanceBuff: { resistancePercent: 15, turns: 2, debuff: false } } });
  const decision = chooseSerpentAction(view);
  assert.notEqual(decision.mode, "remedy");
  assert.notEqual(decision.mode, "treat");
});


test("Verra selects the ally with the more severe DoT when priority tiers match", () => {
  const view = makeView({
    allies: [
      { id: "aaron", hp: 900, statuses: { bleeding: { debuff: true, dotDamage: 25, damageType: "Anomaly", turns: 1 } } },
      { id: "zack", hp: 900, statuses: { bleeding: { debuff: true, dotDamage: 90, damageType: "Anomaly", turns: 3 } } },
    ],
  });

  assert.deepEqual(chooseSerpentAction(view), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "zack",
  });
});

test("Verra accounts for combined remaining DoT pressure across an ally's statuses", () => {
  const view = makeView({
    allies: [
      { id: "alpha", hp: 850, statuses: { bleeding: { debuff: true, dotDamage: 80, damageType: "Anomaly", turns: 2, turnStart: { damageField: "dotDamage", damageTypeField: "damageType" } } } },
      { id: "zulu", hp: 850, statuses: {
        poison: { debuff: true, dotDamage: 50, damageType: "Toxic", turns: 2, turnStart: { damageField: "dotDamage", damageTypeField: "damageType" } },
        bleeding: { debuff: true, dotDamage: 50, damageType: "Anomaly", turns: 2, turnStart: { damageField: "dotDamage", damageTypeField: "damageType" } },
      } },
    ],
  });

  assert.deepEqual(chooseSerpentAction(view), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "zulu",
  });
});

test("Verra considers healing urgency when cleanse threats are otherwise equal", () => {
  const view = makeView({
    allies: [
      { id: "healthy", hp: 900, statuses: { bleeding: { debuff: true, dotDamage: 30, damageType: "Anomaly", turns: 2 } } },
      { id: "injured", hp: 360, statuses: { bleeding: { debuff: true, dotDamage: 30, damageType: "Anomaly", turns: 2 } } },
    ],
  });

  assert.deepEqual(chooseSerpentAction(view), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "injured",
  });
});

test("Verra keeps control priority above a larger collection of lower-tier debuffs", () => {
  const view = makeView({
    allies: [
      { id: "bleeding", hp: 900, statuses: {
        poisonA: { debuff: true, dotDamage: 500, damageType: "Toxic", turns: 3 },
        poisonB: { debuff: true, dotDamage: 500, damageType: "Toxic", turns: 3 },
        poisonC: { debuff: true, dotDamage: 500, damageType: "Toxic", turns: 3 },
      } },
      { id: "staggered", hp: 900, statuses: { staggered: { debuff: true, delayCR: 20, turns: 1 } } },
    ],
  });

  assert.deepEqual(chooseSerpentAction(view), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "staggered",
  });
});


test("Verra favors an equally urgent teammate over cleansing herself", () => {
  const view = makeView({
    actorStatuses: { defDown: { debuff: true, stat: "DEF", amount: -15, turns: 2 } },
    allies: [
      { id: "kane", hp: 900, statuses: { defDown: { debuff: true, stat: "DEF", amount: -15, turns: 2 } } },
    ],
  });

  assert.deepEqual(chooseSerpentAction(view), {
    type: "skill", skillKey: "causticInjection", mode: "treat", targetId: "kane",
  });
});

test("Verra still cleanses herself when her control threat outranks a teammate's stat debuff", () => {
  const view = makeView({
    actorStatuses: { staggered: { debuff: true, delayCR: 20, turns: 1 } },
    allies: [
      { id: "kane", hp: 900, statuses: { defDown: { debuff: true, stat: "DEF", amount: -15, turns: 2 } } },
    ],
  });

  assert.deepEqual(chooseSerpentAction(view), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "verra",
  });
});

const { createSerpentTacticsController } = require("../ai/serpentTactics");
function makeSwitchView({ actorId = "kane", activeHp = 150, poison = false, reserveHp = 900 } = {}) {
  const active = [
    { id: actorId, hp: activeHp, maxHp: 1000, alive: true },
    { id: "verra", hp: 800, maxHp: 1000, alive: true },
    { id: "galloz", hp: 800, maxHp: 1000, alive: true },
  ];
  const reserve = [{ id: "claude", hp: reserveHp, maxHp: 1000, alive: true }, { id: "tekushiki", hp: 900, maxHp: 1000, alive: true }];
  const actor = { id: actorId, skillSet: actorId, hp: activeHp, maxHp: 1000, statuses: poison ? { toxic: { dotDamage: 20, damageType: "Toxic", turns: 2, turnStart: true } } : {} };
  return { kind: "player", actor, friendlies: [actor, ...active.filter((u) => u.id !== actorId)], opponents: [], actions: [{ type: "switch", active, reserves: reserve }, { type: "basic", targets: [] }] };
}

test("conservative reserve policy holds at baseline switch HP but switches at its critical threshold", () => {
  const conservative = createSerpentTacticsController({ standardThreshold: 0.12, verraThreshold: 0.10, poisonThreshold: 0.22 });
  assert.notEqual(conservative.chooseAction(makeSwitchView({ activeHp: 150 })).type, "switch");
  assert.deepEqual(conservative.chooseAction(makeSwitchView({ activeHp: 100 })), { type: "switch", reserveId: "claude", activeId: "kane" });
});

test("conservative policy lowers poison-triggered rotation threshold while baseline retains it", () => {
  const conservative = createSerpentTacticsController({ standardThreshold: 0.12, verraThreshold: 0.10, poisonThreshold: 0.22 });
  const poisonedView = makeSwitchView({ activeHp: 250, poison: true });
  assert.deepEqual(chooseSerpentAction(poisonedView), { type: "switch", reserveId: "claude", activeId: "kane" });
  assert.notEqual(conservative.chooseAction(poisonedView).type, "switch");
});

function makeVerraEmergencySwitchView({ allyHp = 135, actorHp = 800, treatmentAvailable = true, targetable = true, reserveHp = 900 } = {}) {
  const verra = { id: "verra", skillSet: "verra", hp: actorHp, maxHp: 1000, alive: true, statuses: {} };
  const kane = { id: "kane", role: "stalker", hp: allyHp, maxHp: 1000, alive: true, statuses: {} };
  const galloz = { id: "galloz", role: "juggernaut", hp: 800, maxHp: 1000, alive: true, statuses: {} };
  const reserve = { id: "claude", role: "tactician", hp: reserveHp, maxHp: 1000, alive: true, statuses: {} };
  const targets = targetable ? ["verra", "kane", "galloz"] : ["verra", "galloz"];
  return {
    kind: "player",
    actor: verra,
    friendlies: [verra, kane, galloz],
    opponents: [{ id: "phantom-lucaz", role: "juggernaut", hp: 1000, maxHp: 1000, statuses: {} }],
    actions: [
      { type: "switch", active: [kane, verra, galloz], reserves: [reserve] },
      { type: "basic", targets: ["phantom-lucaz"] },
      { type: "skill", key: "unstableRemedy", usable: treatmentAvailable, modes: [{ id: "remedy", targets }] },
      { type: "skill", key: "causticInjection", usable: treatmentAvailable, modes: [{ id: "treat", targets }] },
    ],
  };
}

test("Verra prioritizes emergency treatment over rotation when a teammate is critically injured", () => {
  assert.deepEqual(chooseSerpentAction(makeVerraEmergencySwitchView()), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "kane",
  });
});

test("Verra does not defer rotation when emergency treatment is unavailable", () => {
  assert.deepEqual(chooseSerpentAction(makeVerraEmergencySwitchView({ treatmentAvailable: false })), {
    type: "switch", reserveId: "claude", activeId: "kane",
  });
});

test("Verra does not defer rotation when the critical ally cannot be treated by available modes", () => {
  assert.deepEqual(chooseSerpentAction(makeVerraEmergencySwitchView({ targetable: false })), {
    type: "switch", reserveId: "claude", activeId: "kane",
  });
});


test("Verra rotates when she is critical but no teammate has an emergency treatment need", () => {
  assert.deepEqual(chooseSerpentAction(makeVerraEmergencySwitchView({ actorHp: 135, allyHp: 900 })), {
    type: "switch", reserveId: "claude", activeId: "verra",
  });
});

test("when Verra and a teammate are both critical, she treats the teammate before rotation", () => {
  assert.deepEqual(chooseSerpentAction(makeVerraEmergencySwitchView({ actorHp: 135, allyHp: 135 })), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "kane",
  });
});

test("emergency treatment still wins when reserve health is too low for a safe rotation", () => {
  assert.deepEqual(chooseSerpentAction(makeVerraEmergencySwitchView({ allyHp: 135, reserveHp: 400 })), {
    type: "skill", skillKey: "unstableRemedy", mode: "remedy", targetId: "kane",
  });
});

test("Verra emergency-treatment override respects its configurable HP threshold", () => {
  const view = makeVerraEmergencySwitchView({ allyHp: 200 });
  assert.deepEqual(chooseSerpentAction(view), {
    type: "switch", reserveId: "claude", activeId: "kane",
  });
});
