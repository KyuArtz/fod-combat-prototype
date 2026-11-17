// Character skill registry. All Falcon skills are declarative data interpreted by
// core/skillInterpreter.js; controllers remain responsible for choosing targets.
const { createSkillInterpreter } = require("../core/skillInterpreter");
const skillData = {
  elishia: require("../data/skills/elishia"),
  evalete: require("../data/skills/evalete"),
  zackry: require("../data/skills/zackry"),
  jazen: require("../data/skills/jazen"),
  zenki: require("../data/skills/zenki"),
};

function createSkills(context) {
  const interpreter = createSkillInterpreter(context);
  const skills = Object.fromEntries(
    Object.entries(skillData).map(([characterId, data]) => [
      characterId,
      interpreter.buildSkills(data),
    ]),
  );
  return {
    skills,
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
