const test = require("node:test");
const assert = require("node:assert/strict");
const { formatStatus, formatStatuses } = require("../ui/statusDisplay");

test("status display renders data-driven damage modifiers instead of undefined amounts", () => {
  assert.equal(
    formatStatus("tacticalMark", { damageTakenPercent: 15, evasionPenalty: 10, turns: 3, debuff: true }),
    "Incoming damage +15%; Evasion -10 pts (3t)",
  );
  assert.equal(
    formatStatus("phantomMark", { damageTakenPercent: 10, turns: 2, debuff: true }),
    "Incoming damage +10% (2t)",
  );
  assert.equal(
    formatStatus("ironTitanDamageGuard", { damageTakenPercent: -10, turns: 2 }),
    "Incoming damage -10% (2t)",
  );
  assert.equal(
    formatStatus("scarletEclipseDamage", { damageDealtPercent: 15, turns: 2 }),
    "Damage dealt +15% (2t)",
  );
  assert.equal(
    formatStatus("catalystReflection", { damageReflectionPercent: 25, turns: 3 }),
    "Damage reflection 25% (3t)",
  );
});

test("status display groups DOT as a debuff and healing/reflection as buffs", () => {
  const groups = formatStatuses({
    bleeding: { dotDamage: 18, damageType: "Anomaly", turns: 2, debuff: true },
    triageHot: { hotPercentMaxHP: 10, turns: 3 },
    catalystReflection: { damageReflectionPercent: 25, turns: 3 },
  });
  assert.deepEqual(groups.debuffs, ["18 Anomaly damage per turn (2t)"]);
  assert.deepEqual(groups.buffs, [
    "Healing +10% Max HP per turn (3t)",
    "Damage reflection 25% (3t)",
  ]);
});
