const { makeActor } = require("./actorFactory");

const TYPES = [
  "Energy",
  "Kinetic",
  "Electromagnetic",
  "Toxic",
  "Nuclear",
  "Nanotech",
  "Cryogenic",
  "Anomaly",
];

function falconMember(id, name, mastery, stats) {
  return makeActor({
    id,
    name,
    side: "ally",
    mastery,
    stats: {
      CritRate: 10,
      Evasion: 5,
      masteryBonus: Object.fromEntries(
        TYPES.map((type) => [type, type === mastery ? 15 : 0]),
      ),
      masteryResistance: Object.fromEntries(TYPES.map((type) => [type, 0])),
      ...stats,
    },
  });
}

function createFalconParty() {
  return [
    makeActor({
      id: "elishia",
      name: "Elishia",
      side: "ally",
      mastery: "Nanotech",
      stats: {
        HP: 1100,
        MP: 130,
        ATK: 95,
        MPow: 150,
        DEF: 75,
        RES: 82,
        SPD: 95,
        CritRate: 15,
        Evasion: 10,
        masteryBonus: Object.fromEntries(
          TYPES.map((type) => [type, type === "Nanotech" ? 15 : 0]),
        ),
        masteryResistance: Object.fromEntries(TYPES.map((type) => [type, 0])),
      },
    }),
    falconMember("evalete", "Evalete", "Energy", {
      HP: 1450,
      MP: 110,
      ATK: 85,
      MPow: 120,
      DEF: 110,
      RES: 95,
      SPD: 75,
    }),
    falconMember("zackry", "Zackry", "Electromagnetic", {
      HP: 1250,
      MP: 120,
      ATK: 100,
      MPow: 135,
      DEF: 90,
      RES: 100,
      SPD: 85,
    }),
    falconMember("jazen", "Jazen", "Kinetic", {
      HP: 1350,
      MP: 100,
      ATK: 125,
      MPow: 95,
      DEF: 100,
      RES: 75,
      SPD: 70,
    }),
    falconMember("zenki", "Zenki", "Anomaly", {
      HP: 1000,
      MP: 150,
      ATK: 80,
      MPow: 145,
      DEF: 70,
      RES: 110,
      SPD: 110,
    }),
  ];
}

module.exports = { TYPES, createFalconParty };