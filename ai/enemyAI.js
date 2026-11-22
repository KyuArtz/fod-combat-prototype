const { enemyTarget } = require("./targeting");
const { findByViewId, viewIdOf } = require("../core/turnView");

function validatePolicy(policy) {
  if (!policy || typeof policy.id !== "string" || !Array.isArray(policy.rules) || !policy.fallback) {
    throw new TypeError("Enemy AI policy needs an id, rules array and fallback action.");
  }
  for (const [index, rule] of policy.rules.entries()) {
    if (!Array.isArray(rule.when) || !rule.action || !["skill", "basic"].includes(rule.action.type)) {
      throw new TypeError(`Invalid rule ${index} in enemy AI policy "${policy.id}".`);
    }
    for (const condition of rule.when) {
      if (!condition || !["skillReady", "hpRatioAtMost", "targetMissingStatus", "chance"].includes(condition.type)) {
        throw new TypeError(`Unknown condition in enemy AI policy "${policy.id}".`);
      }
      if (condition.type === "chance" && !(Number.isFinite(condition.value) && condition.value >= 0 && condition.value <= 1)) {
        throw new TypeError(`Invalid chance in enemy AI policy "${policy.id}".`);
      }
    }
  }
  return true;
}

function createEnemyAI(context) {
  const { basicAttack, state, random = Math.random, skills = {}, policies = {}, ready } = context;
  for (const policy of Object.values(policies)) validatePolicy(policy);
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
      category: skill.category,
      targetFaction: skill.targetFaction,
      excludeSelf: skill.excludeSelf,
      ...(skill.modes ? { modes: structuredClone(skill.modes) } : {}),
      usable: enemySkillReady(actor, skill.key),
    }));
  }

  function useSkill(actor, key, target, mode) {
    const skill = findSkill(actor, key);
    if (!skill || !enemySkillReady(actor, key)) return false;
    return skill.run(actor, { target, mode });
  }

  function conditionPasses(condition, actor, target) {
    switch (condition.type) {
      case "skillReady": return enemySkillReady(actor, condition.key);
      case "hpRatioAtMost": return actor.hp / actor.stats.HP <= condition.value;
      case "targetMissingStatus": return Boolean(target && !target.statuses[condition.key]);
      // Keep chance evaluation in rule order: earlier failed predicates consume no RNG.
      case "chance": return random() < condition.value;
      default: return false;
    }
  }

  function actionDecision(action, targetId) {
    if (action.type === "skill") {
      return { type: "enemySkill", skillKey: action.key, ...(action.target === "current" ? { targetId } : {}) };
    }
    return { type: "basic", ...(action.target === "current" ? { targetId } : {}) };
  }

  // Policy rules are data; this evaluator only implements the reusable condition/action vocabulary.
  function decide(actor) {
    const target = enemyTarget(state, actor, context.alive);
    if (!target) return { type: "pass" };
    const targetId = viewIdOf(state, target);
    const policy = policies[actor.aiPolicy || "basicOnly"] || policies.basicOnly;
    if (!policy) throw new Error(`No enemy AI policy registered for "${actor.aiPolicy}".`);

    for (const rule of policy.rules) {
      if (rule.when.every((condition) => conditionPasses(condition, actor, target))) {
        return actionDecision(rule.action, targetId);
      }
    }
    return actionDecision(policy.fallback, targetId);
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

module.exports = { createEnemyAI, validatePolicy };
