const { makeActor } = require("./actorFactory");

const enemyDefinitions = {
  "training-drone": require("../data/enemies/trainingDrone"),
  "rogue-automaton": require("../data/enemies/rogueAutomaton"),
  "siege-turret": require("../data/enemies/siegeTurret"),
  "recon-drone": require("../data/enemies/reconDrone"),
  "toxic-stalker": require("../data/enemies/toxicStalker"),
};
const encounters = {
  trainingGround: require("../data/encounters/trainingGround"),
  droneCalibration: require("../data/encounters/droneCalibration"),
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

function createEnemyFromDefinition(definition) {
  if (!definition || !definition.id || !definition.name || !definition.stats) {
    throw new TypeError("Invalid enemy definition: id, name and stats are required.");
  }
  return makeActor({
    id: definition.id,
    name: definition.name,
    side: "enemy",
    mastery: definition.mastery || "Kinetic",
    ...(definition.skillSet ? { skillSet: definition.skillSet } : {}),
    aiPolicy: definition.aiPolicy || "basicOnly",
    stats: {
      CritRate: 5,
      Evasion: 0,
      masteryBonus: {},
      masteryResistance: {},
      ...structuredClone(definition.stats),
    },
  });
}

function createEncounterEnemies(encounterId = "trainingGround") {
  const encounter = encounters[encounterId];
  if (!encounter) throw new Error(`Unknown encounter "${encounterId}".`);
  return encounter.enemies.map((enemyId) => {
    const definition = enemyDefinitions[enemyId];
    if (!definition) throw new Error(`Encounter "${encounterId}" references unknown enemy "${enemyId}".`);
    return createEnemyFromDefinition(definition);
  });
}

// Backwards-compatible factory used by existing tests and tooling.
function createTrainingEnemies() {
  return createEncounterEnemies("trainingGround");
}

function validateEncounterData(encounter, definitions = enemyDefinitions) {
  if (!encounter || typeof encounter.id !== "string" || !Array.isArray(encounter.enemies) || !encounter.enemies.length) {
    throw new TypeError("Encounter needs an id and a non-empty enemies array.");
  }
  for (const enemyId of encounter.enemies) {
    if (typeof enemyId !== "string" || !definitions[enemyId]) throw new Error(`Encounter "${encounter.id}" references unknown enemy "${enemyId}".`);
  }
  return true;
}

module.exports = {
  createEnemy,
  createEnemyFromDefinition,
  createEncounterEnemies,
  createTrainingEnemies,
  validateEncounterData,
  enemyDefinitions,
  encounters,
};
