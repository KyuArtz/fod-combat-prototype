const { enemyTarget } = require("./targeting");
const { findByViewId, viewIdOf } = require("../core/turnView");

function createEnemyAI(context) {
  const { basicAttack, state, random = Math.random, skills = {}, ready } = context;
  const actorSkills = (actor) => skills[actor.skillSet] || [];
  const findSkill = (actor, key) => actorSkills(actor).find((skill) => skill.key === key);
  const enemySkillReady = (actor, key) => {
    const skill = findSkill(actor, key);
    return Boolean(skill && (ready ? ready(actor, skill.key, skill.cost) : actor.alive && !(actor.cooldowns[skill.key] > 0)));
  };

  function describeSkills(actor) {
    return actorSkills(actor).map((skill) => ({
      key: skill.key,
      name: skill.name,
      targeting: skill.targeting,
      usable: enemySkillReady(actor, skill.key),
    }));
  }

  function useSkill(actor, key, target) {
    const skill = findSkill(actor, key);
    if (!skill || !enemySkillReady(actor, key)) return false;
    return skill.run(actor, { target });
  }

  // AI policy remains intentionally separate from skill rules: this preserves
  // the prototype's original skill priorities and random-roll order.
  function decide(actor) {
    const target = enemyTarget(state, actor, context.alive);
    if (!target) return { type: "pass" };
    const targetId = viewIdOf(state, target);

    if (
      actor.skillSet === "trainingDrone" &&
      enemySkillReady(actor, "pulseShot") &&
      random() < 0.25
    ) {
      return { type: "enemySkill", skillKey: "pulseShot", targetId };
    }

    if (actor.skillSet === "rogueAutomaton") {
      const hpRatio = actor.hp / actor.stats.HP;
      if (hpRatio <= 0.5 && enemySkillReady(actor, "overload")) {
        return { type: "enemySkill", skillKey: "overload" };
      }
      if (
        !target.statuses.defDown &&
        enemySkillReady(actor, "scan") &&
        random() < 0.35
      ) {
        return { type: "enemySkill", skillKey: "scan", targetId };
      }
      if (enemySkillReady(actor, "heavyStrike") && random() < 0.4) {
        return { type: "enemySkill", skillKey: "heavyStrike", targetId };
      }
    }

    return { type: "basic", targetId };
  }

  async function enemyTurn(actor) {
    const decision = decide(actor);
    if (decision.type === "pass") return;
    const target = decision.targetId === undefined ? undefined : findByViewId(state, decision.targetId);
    if (decision.type === "basic") basicAttack(actor, target);
    else useSkill(actor, decision.skillKey, target);
  }

  return {
    enemyTurn,
    controller: { chooseAction: (view, { actor }) => decide(actor) },
    decide,
    describeSkills,
    useSkill,
    basicAttack,
    enemySkillReady,
  };
}

module.exports = { createEnemyAI };
