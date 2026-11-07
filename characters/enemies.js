const { makeActor } = require("./actorFactory");

function createEnemy(name, stats, mastery = "Kinetic") {
  return makeActor({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    side: "enemy",
    mastery,
    stats: {
      CritRate: 5,
      Evasion: 0,
      masteryBonus: {},
      masteryResistance: {},
      ...stats,
    },
  });
}

function createTrainingEnemies() {
  return [
    createEnemy("Training Drone", {
      HP: 700,
      MP: 0,
      ATK: 65,
      MPow: 50,
      DEF: 45,
      RES: 45,
      SPD: 70,
    }),
    createEnemy("Rogue Automaton", {
      HP: 850,
      MP: 0,
      ATK: 75,
      MPow: 60,
      DEF: 55,
      RES: 50,
      SPD: 60,
    }),
    createEnemy("Siege Turret", {
      HP: 900,
      MP: 0,
      ATK: 90,
      MPow: 45,
      DEF: 70,
      RES: 40,
      SPD: 35,
    }),
    createEnemy("Recon Drone", {
      HP: 620,
      MP: 0,
      ATK: 58,
      MPow: 70,
      DEF: 35,
      RES: 65,
      SPD: 115,
      Evasion: 12,
    }),
    createEnemy("Toxic Stalker", {
      HP: 760,
      MP: 0,
      ATK: 72,
      MPow: 85,
      DEF: 45,
      RES: 60,
      SPD: 82,
    }, "Toxic"),
  ];
}

module.exports = { createEnemy, createTrainingEnemies };