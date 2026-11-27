const FACTIONS = Object.freeze(["falcon", "phantom", "serpent"]);
const FACTION_SET = new Set(FACTIONS);


function cloneEntries(entries) {
  return entries.map((entry) => ({
    ...entry,
    ...(entry.damageTypes ? { damageTypes: [...entry.damageTypes] } : {}),
    ...(entry.effectTags ? { effectTags: [...entry.effectTags] } : {}),
  }));
}


function validateTagList(value, field) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
    throw new TypeError(`${field} must be an array of non-empty strings.`);
  }
  return [...new Set(value)];
}


function validateResistanceEntries(value, field, valueKey, filterKey) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array.`);
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new TypeError(`${field}[${index}] must be an object.`);
    }
    const percent = entry[valueKey];
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new RangeError(`${field}[${index}].${valueKey} must be between 0 and 100.`);
    }
    const filter = validateTagList(entry[filterKey], `${field}[${index}].${filterKey}`);
    return { [valueKey]: percent, ...(filter !== undefined ? { [filterKey]: filter } : {}) };
  });
}


function validateAffinityProfile(profile, field = "affinityProfile") {
  if (profile === undefined) return {};
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new TypeError(`${field} must be an object.`);
  }
  const result = {};
  const damageResistance = validateResistanceEntries(profile.damageResistance, `${field}.damageResistance`, "resistancePercent", "damageTypes");
  const effectResistance = validateResistanceEntries(profile.effectResistance, `${field}.effectResistance`, "effectResistancePercent", "effectTags");
  if (damageResistance !== undefined) result.damageResistance = damageResistance;
  if (effectResistance !== undefined) result.effectResistance = effectResistance;
  for (const key of ["controlResistancePercent"]) {
    if (profile[key] !== undefined) {
      if (!Number.isFinite(profile[key]) || profile[key] < 0 || profile[key] > 100) {
        throw new RangeError(`${field}.${key} must be between 0 and 100.`);
      }
      result[key] = profile[key];
    }
  }
  if (profile.controlDurationReduction !== undefined) {
    if (!Number.isInteger(profile.controlDurationReduction) || profile.controlDurationReduction < 0) {
      throw new RangeError(`${field}.controlDurationReduction must be a non-negative integer.`);
    }
    result.controlDurationReduction = profile.controlDurationReduction;
  }
  return result;
}


function validateFactionAffinityConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Faction affinity config must be an object.");
  }
  const result = {};
  for (const [faction, profile] of Object.entries(config)) {
    if (!FACTION_SET.has(faction)) throw new TypeError(`Unknown faction affinity key: ${faction}.`);
    result[faction] = validateAffinityProfile(profile, `factions.${faction}`);
  }
  return result;
}


function validateActorAffinityOverrides(overrides) {
  return validateAffinityProfile(overrides, "actor.affinityOverrides");
}


module.exports = {
  FACTIONS,
  validateAffinityProfile,
  validateFactionAffinityConfig,
  validateActorAffinityOverrides,
};
