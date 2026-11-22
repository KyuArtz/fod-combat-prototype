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
  };
  delete skills.trainingDrone;
  delete skills.rogueAutomaton;
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
