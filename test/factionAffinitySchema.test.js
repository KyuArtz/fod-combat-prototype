const test = require("node:test");
const assert = require("node:assert/strict");
const { makeActor } = require("../characters/actorFactory");
const factionAffinityConfig = require("../data/factionAffinities");
const {
  FACTIONS,
  validateAffinityProfile,
  validateFactionAffinityConfig,
  validateActorAffinityOverrides,
} = require("../systems/factionAffinities");

test("B6.2 defines known factions with empty inert affinity profiles", () => {
  assert.deepEqual(FACTIONS, ["falcon", "phantom", "serpent"]);
  assert.deepEqual(validateFactionAffinityConfig(factionAffinityConfig), {
    falcon: {}, phantom: {}, serpent: {},
  });
});

test("B6.2 validates and clones damage and effect resistance entries", () => {
  const source = {
    damageResistance: [{ damageTypes: ["Toxic", "Kinetic", "Toxic"], resistancePercent: 12 }],
    effectResistance: [{ effectTags: ["biological-toxin"], effectResistancePercent: 8 }],
  };
  const normalized = validateAffinityProfile(source);
  assert.deepEqual(normalized.damageResistance[0], { resistancePercent: 12, damageTypes: ["Toxic", "Kinetic"] });
  assert.deepEqual(normalized.effectResistance[0], { effectResistancePercent: 8, effectTags: ["biological-toxin"] });
  normalized.damageResistance[0].damageTypes.push("Energy");
  assert.deepEqual(source.damageResistance[0].damageTypes, ["Toxic", "Kinetic", "Toxic"]);
});

test("B6.2 permits universal entries by omitting filters and accepts partial overrides", () => {
  assert.deepEqual(validateAffinityProfile({ damageResistance: [{ resistancePercent: 10 }] }), {
    damageResistance: [{ resistancePercent: 10 }],
  });
  assert.deepEqual(validateActorAffinityOverrides({ controlResistancePercent: 15 }), { controlResistancePercent: 15 });
});

test("B6.2 rejects unknown factions, malformed entries, invalid ranges, and invalid duration reductions", () => {
  assert.throws(() => validateFactionAffinityConfig({ phantomPrime: {} }), /Unknown faction/);
  assert.throws(() => validateAffinityProfile({ damageResistance: "10" }), /must be an array/);
  assert.throws(() => validateAffinityProfile({ effectResistance: [{ effectTags: [""], effectResistancePercent: 20 }] }), /non-empty strings/);
  assert.throws(() => validateAffinityProfile({ damageResistance: [{ resistancePercent: 101 }] }), /between 0 and 100/);
  assert.throws(() => validateAffinityProfile({ controlDurationReduction: -1 }), /non-negative integer/);
});

test("B6.2 actor factory exposes validated inert affinityOverrides with neutral default", () => {
  const actor = makeActor({ id: "schema-test", stats: { HP: 10, MP: 0 }, affinityOverrides: { controlResistancePercent: 5 } });
  const neutral = makeActor({ id: "neutral-test", stats: { HP: 10, MP: 0 } });
  assert.deepEqual(actor.affinityOverrides, { controlResistancePercent: 5 });
  assert.deepEqual(neutral.affinityOverrides, {});
  assert.throws(() => makeActor({ id: "bad-affinity", stats: { HP: 10, MP: 0 }, affinityOverrides: { controlResistancePercent: 120 } }), /between 0 and 100/);
});

test("B6.2 schema remains inert: no resolver consumes faction affinity config", () => {
  const raw = require("node:fs").readFileSync(require.resolve("../systems/factionAffinities"), "utf8");
  assert.doesNotMatch(raw, /require\([^)]*damage|require\([^)]*effectSusceptibility|applyDamage|resolveEffectApplication/);
  assert.deepEqual(factionAffinityConfig.serpent, {});
});
