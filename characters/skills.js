// Character and enemy skill registries. Both use declarative data interpreted by
// core/skillInterpreter.js; controllers remain responsible for choosing targets.
const { createSkillInterpreter } = require("../core/skillInterpreter");
const skillData = {
  elishia: require("./skillData/elishia"),
  evalete: require("./skillData/evalete"),
  zackry: require("./skillData/zackry"),
  jazen: require("./skillData/jazen"),
  zenki: require("./skillData/zenki"),
  trainingDrone: require("../data/enemySkills/trainingDrone"),
  rogueAutomaton: require("../data/enemySkills/rogueAutomaton"),
  siegeTurret: require("../data/enemySkills/siegeTurret"),
  reconDrone: require("../data/enemySkills/reconDrone"),
  toxicStalker: require("../data/enemySkills/toxicStalker"),
  blightheartOverseer: require("../data/enemySkills/blightheartOverseer"),
};

function createSkills(context) {
  const interpreter = createSkillInterpreter(context);
  const skills = Object.fromEntries(
    Object.entries(skillData).map(([characterId, data]) => [
      characterId,
      interpreter.buildSkills(data),
    ]),
  );
  const enemySkills = {
    trainingDrone: skills.trainingDrone,
    rogueAutomaton: skills.rogueAutomaton,
    siegeTurret: skills.siegeTurret,
    reconDrone: skills.reconDrone,
    toxicStalker: skills.toxicStalker,
    blightheartOverseer: skills.blightheartOverseer,
  };
  delete skills.trainingDrone;
  delete skills.rogueAutomaton;
  delete skills.siegeTurret;
  delete skills.reconDrone;
  delete skills.toxicStalker;
  delete skills.blightheartOverseer;
  return {
    skills,
    enemySkills,
    summonTurn: interpreter.summonTurn,
    summonDestroyed: interpreter.summonDestroyed,
    onBattleStart: interpreter.onBattleStart,
    onTurnStart: interpreter.onTurnStart,
    onTurnEnd: interpreter.onTurnEnd,
    onDamageTaken: interpreter.onDamageTaken,
    onEnemySkillTargeted: interpreter.onEnemySkillTargeted,
    onRoundStart: interpreter.onRoundStart,
    onUnitDefeated: interpreter.onUnitDefeated,
  };
}

module.exports = { createSkills };
