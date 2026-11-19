// Declarative skill effect handlers. Keep effect execution separate from skill policy and validation.
const { formatMessage } = require("./skillMessages");

const pct = (value, percent) => Math.floor((value * percent) / 100);

function createSkillEffects(context) {
  const {
    addShield, addStatus, alive, applyDamage, calculateMastery, heal, hitMastery,
    hitPhysical, makeActor, state, random = Math.random,
  } = context;

  const EFFECTS = {
    heal(effect, run) {
      run.results.healed = heal(run.target, pct(run.target.stats.HP, effect.percentMaxHP));
    },
    healAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        heal(ally, pct(ally.stats.HP, effect.percentMaxHP));
      }
    },
    hotAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        addStatus(ally, effect.id, { hotPercentMaxHP: effect.percentMaxHP, turns: effect.turns });
      }
    },
    physicalHit(effect, run) {
      const outcome = hitPhysical(run.actor, run.target, effect.power, effect.canCrit ?? true);
      run.results.damage = outcome.damage;
    },
    damage(effect, run) {
      const outcome = calculateMastery(run.actor, run.target, effect.element, effect.power, effect.canCrit ?? true);
      applyDamage(run.target, outcome.damage, effect.element);
      run.results.damage = outcome.damage;
    },
    status(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit) return;
      const { type, to, ...data } = effect;
      addStatus(unit, effect.id, data);
    },
    shield(effect, run) {
      run.results.shield = pct(run.target.stats.HP, effect.percentMaxHP);
      addShield(run.target, run.results.shield, effect.turns, effect.adaptive);
    },
    shieldSelf(effect, run) {
      run.results.shield = pct(run.actor.stats.HP, effect.percentMaxHP);
      addShield(run.actor, run.results.shield, effect.turns, effect.adaptive);
    },
    shieldAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        addShield(ally, pct(ally.stats.HP, effect.percentMaxHP), effect.turns, effect.adaptive);
      }
    },
    statusSelf(effect, run) {
      const { type, ...data } = effect;
      addStatus(run.actor, effect.id, data);
    },
    statusAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        const { type, ...data } = effect;
        addStatus(ally, effect.id, data);
      }
    },
    statusEnemies(effect) {
      for (const enemy of alive(state, "enemy")) {
        const { type, ...data } = effect;
        addStatus(enemy, effect.id, data);
      }
    },
    masteryHit(effect, run) {
      const outcome = hitMastery(run.actor, run.target, effect.element, effect.power, effect.canCrit ?? true);
      run.results.damage = outcome.damage;
      run.results.missed = Boolean(outcome.miss);
    },
    masteryDamageAllEnemies(effect, run) {
      for (const enemy of alive(state, "enemy")) {
        const outcome = hitMastery(run.actor, enemy, effect.element, effect.power, effect.canCrit ?? true);
        if (effect.status && enemy.alive && random() * 100 < effect.statusChance) {
          addStatus(enemy, effect.status.id, { ...effect.status, debuff: true });
        }
        if (enemy === run.target) run.results.damage = outcome.damage;
      }
    },
    cleanseAllies() {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        for (const [key, status] of Object.entries(ally.statuses)) {
          if (status.debuff || status.amount < 0) delete ally.statuses[key];
        }
      }
    },
    tacticalMark(effect, run) {
      addStatus(run.target, "tacticalMark", {
        amount: effect.damageTakenPercent,
        damageTakenPercent: effect.damageTakenPercent,
        evasionPenalty: effect.evasionPenalty,
        turns: effect.turns,
        debuff: true,
      });
    },
    commandUplink(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        addStatus(ally, "commandUplink", {
          stat: "ATK", amount: effect.amount, conditionalAmount: effect.conditionalAmount,
          hpThresholdPercent: effect.hpThresholdPercent, turns: effect.turns,
        });
      }
    },
    conditionalStatus(effect, run) {
      if (run.results.missed) return;
      const unit = effect.to === "self" ? run.actor : run.target;
      const amount = unit.statuses[effect.conditionStatus] ? effect.conditionalAmount : effect.amount;
      addStatus(unit, effect.id, { stat: effect.stat, amount, turns: effect.turns, debuff: effect.debuff });
    },
    cipherTag(effect, run) {
      for (const enemy of alive(state, "enemy")) {
        delete enemy.statuses.cipherTag;
        delete enemy.statuses.cipherResDown;
      }
      addStatus(run.target, "cipherTag", {
        damageTakenPercent: effect.damageTakenPercent,
        turns: effect.turns,
        debuff: true,
      });
      addStatus(run.target, "cipherResDown", { stat: "RES", amount: effect.resDown, turns: effect.turns, debuff: true });
    },
    railshot(effect, run) {
      const power = effect.normalPower * (run.actor.railshotUntargeted ? 1 + effect.unobservedBonus / 100 : 1);
      const outcome = hitMastery(run.actor, run.target, effect.element, power, true, { ignoreAccuracy: true });
      run.results.damage = outcome.damage;
      run.results.bonusText = run.actor.railshotUntargeted ? " (unobserved bonus)" : "";
    },
    zeroHour(effect, run) {
      const power = run.target.hp / run.target.stats.HP < effect.hpThresholdPercent / 100
        ? effect.executePower : effect.normalPower;
      const outcome = hitMastery(run.actor, run.target, effect.element, power, true);
      run.results.damage = outcome.damage;
      run.results.missed = Boolean(outcome.miss);
      run.results.bonusText = power === effect.executePower ? " (execution bonus)" : "";
      if (!outcome.miss && run.target.alive && run.target.statuses[effect.cipherStatus]) {
        addStatus(run.target, "zeroHourSpdDown", { stat: "SPD", amount: effect.cipherSpdDown, turns: effect.cipherTurns, debuff: true });
      }
    },
    summon(effect, run) {
      const template = run.data.summons[effect.template];
      const summon = makeActor({
        id: template.id, name: template.name, side: "ally", mastery: template.mastery,
        summon: true, summonTurns: template.turns, stats: structuredClone(template.stats),
        behavior: structuredClone(template.behavior), ownerId: run.actor.id,
        scan: template.scan && structuredClone(template.scan),
        finalProtocol: template.finalProtocol && structuredClone(template.finalProtocol),
        finalProtocolTargetId: run.target?.id || state.actors.find((unit) => unit.side === "enemy" && unit.alive && unit.id === state.lastAllyTargetedEnemyId)?.id || state.actors.find((unit) => unit.side === "enemy" && unit.alive && unit.targetedByAllyId)?.id || null,
        onDestroyed: template.onDestroyed && structuredClone(template.onDestroyed),
      });
      state.actors.push(summon);
      run.results.scan = template.scan ? template.scan.damageBonus : 0;
    },
    singularity(effect, run) {
      state.singularityTurns = effect.turns;
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        for (const status of effect.allies) {
          if (status.hotPercent !== undefined) addStatus(ally, status.id, { hotPercentMaxHP: status.hotPercent, turns: status.turns });
          else addStatus(ally, status.id, { stat: status.stat, amount: status.amount, turns: status.turns });
        }
      }
      for (const foe of alive(state, "enemy")) {
        for (const status of effect.enemies) addStatus(foe, status.id, { stat: status.stat, amount: status.amount, turns: status.turns, debuff: true });
        if (effect.dot) {
          const dot = typeof calculateMastery === "function"
            ? calculateMastery(run.actor, foe, effect.dot.element, effect.dot.power, false)
            : { damage: Math.max(1, Math.floor((run.actor.stats.MPow || 0) * effect.dot.power)) };
          addStatus(foe, effect.dot.id, { dotDamage: dot.damage, damageType: effect.dot.element, turns: effect.dot.turns, debuff: true });
        }
      }
      for (const summon of alive(state, "ally").filter((unit) => unit.summon && unit.behavior?.singularityPower)) {
        if (effect.summonMessage) run.after.push(formatMessage(effect.summonMessage, { actor: summon.name, power: Math.round(summon.behavior.singularityPower * 100) }));
      }
    },
    nextSkillDiscount(effect, run) {
      run.actor.mpDiscount = Math.max(run.actor.mpDiscount || 0, effect.amount || 0);
    },
  };

  return EFFECTS;
}

module.exports = { createSkillEffects };
