const test = require("node:test");
const assert = require("node:assert/strict");
const { addStatus, getHighestPriorityCleanseEntry, getStatusCleansePriority } = require("../systems/statusEffects");
const { createSerpentWorld, serpentSkill } = require("./helpers/serpentWorld");

test("shared cleanse ranking orders control above damage-over-time, stat debuffs, and generic debuffs", () => {
  const statuses = {
    olderAtkDown: { debuff: true, stat: "ATK", amount: -10, turns: 2 },
    bleeding: { debuff: true, dotDamage: 90, damageType: "Anomaly", turns: 2 },
    bound: { debuff: true, control: "bind", skipAction: true, turns: 1 },
    genericMark: { debuff: true, turns: 3 },
  };

  assert.equal(getStatusCleansePriority(statuses.bound), 100);
  assert.equal(getStatusCleansePriority(statuses.bleeding), 75);
  assert.equal(getStatusCleansePriority(statuses.olderAtkDown), 55);
  assert.equal(getStatusCleansePriority(statuses.genericMark), 30);
  assert.equal(getHighestPriorityCleanseEntry(statuses)[0], "bound");
});

test("single-target cleanse breaks same-tier ties by total DoT threat, not insertion order", () => {
  const statuses = {
    poison: { debuff: true, dotDamage: 35, damageType: "Toxic", turns: 2 },
    bleeding: { debuff: true, dotDamage: 90, damageType: "Anomaly", turns: 2 },
  };

  assert.equal(getHighestPriorityCleanseEntry(statuses)[0], "bleeding");
  const reversed = Object.fromEntries(Object.entries(statuses).reverse());
  assert.equal(getHighestPriorityCleanseEntry(reversed)[0], "bleeding");
});

test("Verra's live single-target cleanse removes Stagger before older debuffs and preserves buffs", () => {
  const world = createSerpentWorld();
  const verra = world.byId.verra;
  const ally = world.byId.kane;
  ally.hp = 620;

  addStatus(ally, "olderDefDown", { stat: "DEF", amount: -15, turns: 2, debuff: true });
  addStatus(ally, "bleeding", { dotDamage: 90, damageType: "Anomaly", turns: 2, debuff: true });
  addStatus(ally, "staggered", { delayCR: 20, turns: 1, debuff: true });
  addStatus(ally, "resistanceBuff", { resistanceType: "Toxic", resistancePercent: 15, turns: 2, debuff: false });

  const skill = serpentSkill(world, "verra", "unstableRemedy");
  assert.equal(skill.run(verra, { mode: "remedy", target: ally }), true);

  assert.equal(ally.statuses.staggered, undefined, "highest priority control should be removed");
  assert.ok(ally.statuses.bleeding, "lower-priority DoT should remain for a later cleanse");
  assert.ok(ally.statuses.olderDefDown, "lower-priority stat debuff should remain");
  assert.ok(ally.statuses.resistanceBuff, "beneficial effects must never be cleansed");
  const cleanseEvent = world.events.history.find((event) => event.type === "StatusCleansed" && event.targetId === ally.id);
  assert.deepEqual(cleanseEvent.statusIds, ["staggered"]);
});

test("Verra's live single-target cleanse removes the strongest DoT before an older stat debuff", () => {
  const world = createSerpentWorld();
  const verra = world.byId.verra;
  const ally = world.byId.kane;
  ally.hp = 700;

  addStatus(ally, "olderDefDown", { stat: "DEF", amount: -15, turns: 2, debuff: true });
  addStatus(ally, "lightPoison", { dotDamage: 35, damageType: "Toxic", turns: 2, debuff: true });
  addStatus(ally, "heavyBleeding", { dotDamage: 90, damageType: "Anomaly", turns: 2, debuff: true });

  const skill = serpentSkill(world, "verra", "causticInjection");
  assert.equal(skill.run(verra, { mode: "treat", target: ally }), true);

  assert.ok(ally.statuses.olderDefDown, "stat debuff should remain behind the higher-priority DoTs");
  assert.ok(ally.statuses.lightPoison, "weaker DoT should remain behind the stronger DoT");
  assert.equal(ally.statuses.heavyBleeding, undefined, "highest total DoT threat should be removed first");
});
