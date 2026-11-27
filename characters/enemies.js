const { makeActor } = require("./actorFactory");

const enemyDefinitions = {
  "training-drone": require("../data/enemies/trainingDrone"),
  "rogue-automaton": require("../data/enemies/rogueAutomaton"),
  "siege-turret": require("../data/enemies/siegeTurret"),
  "recon-drone": require("../data/enemies/reconDrone"),
  "toxic-stalker": require("../data/enemies/toxicStalker"),
  "blightheart-overseer": require("../data/enemies/blightheartOverseer"),
};
const encounters = {
  trainingGround: require("../data/encounters/trainingGround"),
  droneCalibration: require("../data/encounters/droneCalibration"),
  siegeBreakthrough: require("../data/encounters/siegeBreakthrough"),
  blightheartSanctum: require("../data/encounters/blightheartSanctum"),
};

function createEnemy(name, stats, mastery = "Kinetic", skillSet = null) {
  return makeActor({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    side: "enemy",
    mastery,
    ...(skillSet ? { skillSet } : {}),
    aiPolicy: "basicOnly",
    stats: {
      CritRate: 5, Evasion: 0, masteryBonus: {}, masteryResistance: {}, ...stats,
    },
  });
}

function createEnemyFromDefinition(definition, { stats: statOverrides = {}, actorId } = {}) {
  if (!definition || !definition.id || !definition.name || !definition.stats) {
    throw new TypeError("Invalid enemy definition: id, name and stats are required.");
  }
  return makeActor({
    id: actorId || definition.id,
    name: definition.name,
    side: "enemy",
    ...(definition.capabilities ? { capabilities: [...definition.capabilities] } : {}),
    mastery: definition.mastery || "Kinetic",
    ...(definition.skillSet ? { skillSet: definition.skillSet } : {}),
    ...(definition.passive ? { passive: structuredClone(definition.passive) } : {}),
    ...(definition.targetSelection ? { targetSelection: definition.targetSelection } : {}),
    aiPolicy: definition.aiPolicy || "basicOnly",
    stats: {
      CritRate: 5,
      Evasion: 0,
      masteryBonus: {},
      masteryResistance: {},
      ...structuredClone(definition.stats),
      ...structuredClone(statOverrides),
    },
  });
}

const ENEMY_STAT_KEYS = new Set(["HP", "MP", "ATK", "MPow", "DEF", "RES", "SPD", "CritRate", "Evasion"]);

function normalizeEnemyEntry(entry) {
  if (typeof entry === "string") return { enemyId: entry, stats: {}, instanceId: null };
  if (!entry || typeof entry !== "object" || typeof entry.enemy !== "string") {
    throw new TypeError("Enemy entry must be an enemy id or an object with an enemy field.");
  }
  const stats = entry.stats || {};
  for (const [key, value] of Object.entries(stats)) {
    if (!ENEMY_STAT_KEYS.has(key) || !Number.isFinite(value) || value < 0) {
      throw new TypeError(`Invalid enemy stat override ${key}.`);
    }
  }
  if (entry.instanceId !== undefined && (typeof entry.instanceId !== "string" || !entry.instanceId.trim())) {
    throw new TypeError("Enemy instanceId must be a non-empty string.");
  }
  return { enemyId: entry.enemy, stats, instanceId: entry.instanceId || null };
}

function createEnemyEntries(entries, encounterId) {
  return entries.map((rawEntry) => {
    const entry = normalizeEnemyEntry(rawEntry);
    const definition = enemyDefinitions[entry.enemyId];
    if (!definition) throw new Error(`Encounter "${encounterId}" references unknown enemy "${entry.enemyId}".`);
    const actorId = entry.instanceId ? `${definition.id}-${entry.instanceId}` : definition.id;
    return createEnemyFromDefinition(definition, { stats: entry.stats, actorId });
  });
}

function getEncounterWaves(encounter) {
  if (Array.isArray(encounter.waves)) return encounter.waves;
  return [{ id: "main", name: encounter.name || "Main Wave", enemies: encounter.enemies || [] }];
}

function createEncounterWaveEnemies(encounterId = "trainingGround", waveIndex = 0) {
  const encounter = encounters[encounterId];
  if (!encounter) throw new Error(`Unknown encounter "${encounterId}".`);
  const wave = getEncounterWaves(encounter)[waveIndex];
  if (!wave) throw new Error(`Encounter "${encounterId}" has no wave at index ${waveIndex}.`);
  return createEnemyEntries(wave.enemies, encounterId);
}

function createEncounterEnemies(encounterId = "trainingGround") {
  return createEncounterWaveEnemies(encounterId, 0);
}

function createEncounterReinforcements(encounterId, reinforcementId) {
  const encounter = encounters[encounterId];
  if (!encounter) throw new Error(`Unknown encounter "${encounterId}".`);
  const reinforcement = (encounter.reinforcements || []).find((item) => item.id === reinforcementId);
  if (!reinforcement) throw new Error(`Unknown reinforcement "${reinforcementId}" in encounter "${encounterId}".`);
  return createEnemyEntries(reinforcement.enemies, encounterId);
}

// Backwards-compatible factory used by existing tests and tooling.
function createTrainingEnemies() {
  return createEncounterEnemies("trainingGround");
}

function validateEncounterData(encounter, definitions = enemyDefinitions) {
  if (!encounter || typeof encounter.id !== "string" || !encounter.id.trim()) {
    throw new TypeError("Encounter needs an id.");
  }
  const waves = getEncounterWaves(encounter);
  if (!waves.length) throw new TypeError(`Encounter "${encounter.id}" needs at least one wave.`);
  for (const [index, wave] of waves.entries()) {
    if (!wave || !Array.isArray(wave.enemies) || wave.enemies.length < 5) {
      throw new TypeError(`Encounter "${encounter.id}" wave ${index + 1} needs at least five enemy entries.`);
    }
    for (const rawEntry of wave.enemies) {
      const entry = normalizeEnemyEntry(rawEntry);
      if (!definitions[entry.enemyId]) throw new Error(`Encounter "${encounter.id}" references unknown enemy "${entry.enemyId}".`);
    }
  }
  const reinforcementIds = new Set();
  for (const reinforcement of encounter.reinforcements || []) {
    if (!reinforcement || typeof reinforcement.id !== "string" || !reinforcement.id.trim() || reinforcementIds.has(reinforcement.id)) {
      throw new TypeError(`Encounter "${encounter.id}" has an invalid or duplicate reinforcement id.`);
    }
    reinforcementIds.add(reinforcement.id);
    if (!reinforcement.trigger || reinforcement.trigger.type !== "enemyDefeatedCount" || !Number.isInteger(reinforcement.trigger.atLeast) || reinforcement.trigger.atLeast < 1) {
      throw new TypeError(`Reinforcement "${reinforcement.id}" has an unsupported trigger.`);
    }
    if (!Array.isArray(reinforcement.enemies) || !reinforcement.enemies.length) {
      throw new TypeError(`Reinforcement "${reinforcement.id}" needs at least one enemy.`);
    }
    for (const rawEntry of reinforcement.enemies) {
      const entry = normalizeEnemyEntry(rawEntry);
      if (!definitions[entry.enemyId]) throw new Error(`Reinforcement "${reinforcement.id}" references unknown enemy "${entry.enemyId}".`);
    }
  }
  if (encounter.rewards !== undefined && (typeof encounter.rewards !== "object" || Array.isArray(encounter.rewards) || encounter.rewards === null)) {
    throw new TypeError(`Encounter "${encounter.id}" rewards must be an object.`);
  }
  return true;
}

module.exports = {
  createEnemy,
  createEnemyFromDefinition,
  createEncounterEnemies,
  createEncounterWaveEnemies,
  createEncounterReinforcements,
  createTrainingEnemies,
  validateEncounterData,
  enemyDefinitions,
  encounters,
};
