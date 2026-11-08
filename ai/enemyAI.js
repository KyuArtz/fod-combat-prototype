const { enemyTarget } = require("./targeting");

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

  async function enemyTurn(actor) {
    const target = enemyTarget(state, actor, context.alive);
    if (!target) return;

    if (
      actor.name === "Training Drone" &&
      enemySkillReady(actor, "pulseShot") &&
      random() < 0.25
    ) {
      pulseShot(actor, target);
      return;
    }

    if (actor.name === "Rogue Automaton") {
      const hpRatio = actor.hp / actor.stats.HP;
      if (hpRatio <= 0.5 && enemySkillReady(actor, "overload")) {
        overload(actor);
        return;
      }
      if (
        !target.statuses.defDown &&
        enemySkillReady(actor, "scan") &&
        random() < 0.35
      ) {
        scanTarget(actor, target);
        return;
      }
      if (enemySkillReady(actor, "heavyStrike") && random() < 0.4) {
        heavyStrike(actor, target);
        return;
      }
    }

    const dodge = clamp(effectiveStat(target, "Evasion"), 0, 75);
    if (random() * 100 < dodge) {
      say(`${actor.name} attacks ${target.name}, but ${target.name} evades!`);
      return;
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
  }

  return {
    enemyTurn,
    enemySkillReady,
    pulseShot,
    heavyStrike,
    scanTarget,
    overload,
  };
}

module.exports = { createEnemyAI };