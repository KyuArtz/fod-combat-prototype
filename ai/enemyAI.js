const { enemyTarget } = require("./targeting");
const { findByViewId, viewIdOf } = require("../core/turnView");

function createEnemyAI(context) {
  const {
    addStatus,
    applyDamage,
    calculatePhysical,
    effectiveStat,
    say,
    state,
    random = Math.random,
  } = context;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const enemySkillReady = (actor, skill) =>
    actor.alive && (actor.cooldowns[skill] || 0) <= 0;
  const setCooldown = (actor, skill, turns) => {
    actor.cooldowns[skill] = turns;
  };

  function pulseShot(actor, target) {
    if (!target || !enemySkillReady(actor, "pulseShot")) return false;
    setCooldown(actor, "pulseShot", 3);
    const outcome = calculatePhysical(actor, target, 1.35, false);
    applyDamage(target, outcome.damage);
    say(
      `${actor.name} fires PULSE SHOT at ${target.name} for ${outcome.damage} damage!`,
    );
    return true;
  }

  function heavyStrike(actor, target) {
    if (!target || !enemySkillReady(actor, "heavyStrike")) return false;
    setCooldown(actor, "heavyStrike", 3);
    const outcome = calculatePhysical(actor, target, 1.5);
    applyDamage(target, outcome.damage);
    say(
      `${actor.name} unleashes HEAVY STRIKE on ${target.name} for ${outcome.damage} damage!`,
    );
    return true;
  }

  function scanTarget(actor, target) {
    if (!target || !enemySkillReady(actor, "scan")) return false;
    setCooldown(actor, "scan", 4);
    addStatus(target, "defDown", { stat: "DEF", amount: -15, turns: 2 });
    say(`${actor.name} scans ${target.name}! DEF -15% (2 turns).`);
    return true;
  }

  function overload(actor) {
    if (!enemySkillReady(actor, "overload")) return false;
    setCooldown(actor, "overload", 5);
    addStatus(actor, "overloadATK", { stat: "ATK", amount: 25, turns: 2 });
    say(`${actor.name} activates OVERLOAD! ATK +25% (2 turns).`);
    return true;
  }

  // Which skills each enemy owns, for the turn view and decision validation.
  const ENEMY_SKILLS = {
    "Training Drone": ["pulseShot"],
    "Rogue Automaton": ["overload", "scan", "heavyStrike"],
  };
  const SKILL_INFO = {
    pulseShot: { name: "Pulse Shot", targeting: "ally" },
    overload: { name: "Overload", targeting: "none" },
    scan: { name: "Scan", targeting: "ally" },
    heavyStrike: { name: "Heavy Strike", targeting: "ally" },
  };

  function describeSkills(actor) {
    return (ENEMY_SKILLS[actor.name] || []).map((key) => ({
      key,
      ...SKILL_INFO[key],
      usable: enemySkillReady(actor, key),
    }));
  }

  function useSkill(actor, key, target) {
    switch (key) {
      case "pulseShot":
        return pulseShot(actor, target);
      case "heavyStrike":
        return heavyStrike(actor, target);
      case "scan":
        return scanTarget(actor, target);
      case "overload":
        return overload(actor);
      default:
        return false;
    }
  }

  // The enemy basic attack: evasion check, damage, and retaliation.
  function basicAttack(actor, target) {
    const dodge = clamp(effectiveStat(target, "Evasion"), 0, 75);
    if (random() * 100 < dodge) {
      say(`${actor.name} attacks ${target.name}, but ${target.name} evades!`);
      return true;
    }

    const retaliation = target.statuses.retaliation;
    const outcome = calculatePhysical(actor, target);
    applyDamage(target, outcome.damage);
    say(
      `${actor.name} attacks ${target.name} for ${outcome.damage} Physical damage${outcome.crit ? " (CRIT)" : ""}.`,
    );

    if (retaliation && target.alive && actor.alive) {
      const counterDamage = Math.max(
        1,
        Math.floor((outcome.damage * retaliation.amount) / 100),
      );
      applyDamage(actor, counterDamage);
      say(
        `${target.name} retaliates against ${actor.name} for ${counterDamage} damage!`,
      );
    }
    return true;
  }

  // Decide-only: returns a decision and rolls the same skill-use chances, in the
  // same order, as the original single-function enemy turn. Nothing is executed.
  function decide(actor) {
    const target = enemyTarget(state, actor, context.alive);
    if (!target) return { type: "pass" };
    const targetId = viewIdOf(state, target);

    if (
      actor.name === "Training Drone" &&
      enemySkillReady(actor, "pulseShot") &&
      random() < 0.25
    ) {
      return { type: "enemySkill", skillKey: "pulseShot", targetId };
    }

    if (actor.name === "Rogue Automaton") {
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

  // Direct decide-and-execute, kept for callers that run an enemy turn without
  // the turn runner (the battle itself goes through the runner).
  async function enemyTurn(actor) {
    const decision = decide(actor);
    if (decision.type === "pass") return;
    const target = decision.targetId === undefined ? undefined : findByViewId(state, decision.targetId);
    if (decision.type === "basic") basicAttack(actor, target);
    else useSkill(actor, decision.skillKey, target);
  }

  // The built-in enemy controller.
  const controller = {
    chooseAction: (view, { actor }) => decide(actor),
  };

  return {
    enemyTurn,
    controller,
    decide,
    describeSkills,
    useSkill,
    basicAttack,
    enemySkillReady,
    pulseShot,
    heavyStrike,
    scanTarget,
    overload,
  };
}

module.exports = { createEnemyAI };