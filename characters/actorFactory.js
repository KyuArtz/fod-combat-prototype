const ACTOR_CAPABILITIES = Object.freeze([
  "organic",
  "biological-processes",
  "mechanical",
  "electronic-systems",
  "synthetic",
  "construct",
  "metallic-components",
  "nanotech-interface",
  "insulated-electronics",
  "corrosion-resistant-materials",
]);
const ACTOR_CAPABILITY_SET = new Set(ACTOR_CAPABILITIES);
const { validateActorAffinityOverrides } = require("../systems/factionAffinities");

function normalizeActorCapabilities(capabilities) {
  if (capabilities === undefined) return [];
  if (!Array.isArray(capabilities)) {
    throw new TypeError("Invalid actor capabilities: expected an array of capability tags.");
  }
  const normalized = [];
  const seen = new Set();
  for (const capability of capabilities) {
    if (typeof capability !== "string" || !ACTOR_CAPABILITY_SET.has(capability)) {
      throw new TypeError(`Invalid actor capability: ${String(capability)}.`);
    }
    if (!seen.has(capability)) {
      seen.add(capability);
      normalized.push(capability);
    }
  }
  return normalized;
}


function makeActor(data) {
  if (!data || !data.stats) {
    throw new Error("Invalid actor data: missing stats.");
  }

  return {
    ...data,
    capabilities: normalizeActorCapabilities(data.capabilities),
    affinityOverrides: validateActorAffinityOverrides(data.affinityOverrides),
    stats: { ...data.stats },
    hp: data.stats.HP,
    mp: data.stats.MP,
    alive: true,
    shields: [],
    statuses: {},
    passiveTimers: {},
    cooldowns: {},
    summon: data.summon || false,
    summonTurns: data.summonTurns || 0,
    discount: false,
    mpDiscount: 0,
    nextAttackAccuracy: 0,
    _isTakingTurn: false,
    targetedByAllyId: null,
    targetedByEnemySinceLastTurn: false,
    enemySkillTargetedThisRound: false,
    passiveFlags: { ...(data.passive?.initialFlags || {}) },
    cr: 0,
  };
}


module.exports = { makeActor, ACTOR_CAPABILITIES, normalizeActorCapabilities };
