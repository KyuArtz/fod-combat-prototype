const CONTROL_TAG_PREFIX = "control:";

function normalizedTags(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || !tag.trim())) {
    throw new TypeError(`${field} must be an array of non-empty strings`);
  }
  return [...new Set(value)];
}


function clampPercent(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}


function hasAll(capabilities, required) {
  return required.every((tag) => capabilities.includes(tag));
}


function matchesTags(modifier, tags) {
  if (!modifier.effectTags) return true;
  return Array.isArray(modifier.effectTags) && modifier.effectTags.some((tag) => tags.includes(tag));
}


function resolveEffectApplication(target, effect, random = Math.random) {
  if (!target || !effect || typeof effect !== "object") throw new TypeError("target and effect are required");
  if (typeof random !== "function") throw new TypeError("random must be a function");

  const capabilities = Array.isArray(target.capabilities) ? target.capabilities : [];
  const tags = normalizedTags(effect.effectTags, "effect.effectTags");
  const required = normalizedTags(effect.requiredCapabilities, "effect.requiredCapabilities");
  const requiredAny = normalizedTags(effect.requiredAnyCapabilities, "effect.requiredAnyCapabilities");
  const excluded = normalizedTags(effect.excludedCapabilities, "effect.excludedCapabilities");
  const effectId = typeof effect.id === "string" ? effect.id : null;
  const explicitImmunities = [
    ...(target.passive?.immunities || []),
    ...(target.passive?.effectImmunities || []),
  ];

  if (effectId && explicitImmunities.includes(effectId)) return { eligible: false, applied: false, reason: "explicit-immunity", chance: 0, duration: 0 };
  if (tags.some((tag) => explicitImmunities.includes(tag))) return { eligible: false, applied: false, reason: "explicit-immunity", chance: 0, duration: 0 };
  if (!hasAll(capabilities, required)) return { eligible: false, applied: false, reason: "missing-required-capability", chance: 0, duration: 0 };
  if (requiredAny.length && !requiredAny.some((tag) => capabilities.includes(tag))) return { eligible: false, applied: false, reason: "missing-any-required-capability", chance: 0, duration: 0 };
  if (excluded.some((tag) => capabilities.includes(tag))) return { eligible: false, applied: false, reason: "excluded-capability", chance: 0, duration: 0 };

  const isControl = tags.some((tag) => tag.startsWith(CONTROL_TAG_PREFIX));
  const modifiers = Object.values(target.statuses || {});
  const effectResistances = modifiers.filter((status) => Number.isFinite(status.effectResistancePercent) && matchesTags(status, tags));
  const controlResistances = isControl ? modifiers.filter((status) => Number.isFinite(status.controlResistancePercent) && matchesTags(status, tags)) : [];
  const effectResistance = effectResistances.length ? Math.max(...effectResistances.map((status) => clampPercent(status.effectResistancePercent))) : 0;
  const controlResistance = controlResistances.length ? Math.max(...controlResistances.map((status) => clampPercent(status.controlResistancePercent))) : 0;

  const baseChance = clampPercent(effect.chance, 100);
  const chance = baseChance * (1 - effectResistance / 100) * (1 - controlResistance / 100);
  const durationReductions = isControl ? modifiers.filter((status) => Number.isFinite(status.controlDurationReduction) && matchesTags(status, tags)) : [];
  const durationReduction = durationReductions.length ? Math.floor(Math.max(...durationReductions.map((status) => Math.max(0, status.controlDurationReduction)))) : 0;
  const baseDuration = Number.isFinite(effect.turns) && effect.turns > 0 ? Math.floor(effect.turns) : 0;
  const duration = baseDuration ? Math.max(1, baseDuration - durationReduction) : 0;
  const roll = chance <= 0 || chance >= 100 ? null : random() * 100;
  const applied = chance > 0 && (chance >= 100 || roll < chance);
  return { eligible: true, applied, reason: applied ? "applied" : "resisted", chance, duration, roll, effectResistance, controlResistance, durationReduction };
}


module.exports = { resolveEffectApplication };
