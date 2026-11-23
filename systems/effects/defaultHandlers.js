// Declarative skill effect handlers. Keep effect execution separate from skill policy and validation.
const { matchesModifierCondition, consumeNextAttackDamageModifier, consumeNextSkillDamageModifier } = require("../statusEffects");
const { isBattleTimerActive } = require("../battleTimers");
const { emitCombatEvent } = require("../../core/combatEvents");

const pct = (value, percent) => Math.floor((value * percent) / 100);

function createDefaultEffectHandlers(context) {
  const opposingSide = (side) => side === "ally" ? "enemy" : "ally";
  const sideActors = (side) => alive(state, side);
  const {
    addShield, addStatus, alive, applyDamage, calculateMastery, effectiveStat, heal, hitMastery,
    hitPhysical, makeActor, state, events, lifecycleHandlers = {}, random = Math.random,
  } = context;



  const EFFECTS = {
    heal(effect, run) {
      run.results.healed = heal(run.target, pct(run.target.stats.HP, effect.percentMaxHP));
    },
    healAllies(effect, run) {
      for (const ally of sideActors(run.actor.side).filter((unit) => !unit.summon)) {
        heal(ally, pct(ally.stats.HP, effect.percentMaxHP));
      }
    },
    hotAllies(effect, run) {
      for (const ally of sideActors(run.actor.side).filter((unit) => !unit.summon)) {
        addStatus(ally, effect.id, { hotPercentMaxHP: effect.percentMaxHP, turns: effect.turns });
      }
    },
    physicalHit(effect, run) {
      const bonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, "Physical");
      const outcome = hitPhysical(run.actor, run.target, effect.power * (1 + bonus / 100) * (1 + skillBonus / 100), effect.canCrit ?? true);
      run.results.skillBonus = skillBonus;
      run.results.damage = outcome.damage;
      run.results.missed = Boolean(outcome.miss);
      run.results.hitTargetIds = outcome.miss ? [] : [run.target.id];
      run.results.missedTargetIds = outcome.miss ? [run.target.id] : [];
    },
    damage(effect, run) {
      const bonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      const power = effect.power * (1 + bonus / 100) * (1 + skillBonus / 100);
      const outcome = calculateMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, effect.scalingStat || "MPow");
      applyDamage(run.target, outcome.damage, effect.element, run.actor, { kind: "direct" });
      run.results.skillBonus = skillBonus;
      run.results.damage = outcome.damage;
      run.results.missed = false;
      run.results.hitTargetIds = [run.target.id];
      run.results.missedTargetIds = [];
    },
    status(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit) return;
      const { type, to, ...data } = effect;
      addStatus(unit, effect.id, data);
    },
    statusGroup(effect, run) {
      if (!run.target) return;
      for (const unit of alive(state, effect.replaceOn)) {
        for (const [statusId, status] of Object.entries(unit.statuses || {})) {
          if (status.statusGroup === effect.group) delete unit.statuses[statusId];
        }
      }
      for (const entry of effect.statuses) {
        addStatus(run.target, entry.id, { ...entry.data, statusGroup: effect.group });
      }
    },
    buff(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit) return;
      addStatus(unit, effect.id, { stat: effect.stat, amount: effect.amount, turns: effect.turns, ...(effect.data || {}) });
    },
    debuff(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit) return;
      addStatus(unit, effect.id, { stat: effect.stat, amount: effect.amount, turns: effect.turns, debuff: true, ...(effect.data || {}) });
    },
    damageOverTime(effect, run) {
      if (run.results.missed) return;
      let targets = effect.side
        ? alive(state, effect.side === "opponent" ? opposingSide(run.actor.side) : effect.side)
        : (run.target ? [run.target] : []);
      if (effect.onlyHitTargets) {
        const hitIds = new Set(run.results.hitTargetIds || []);
        targets = targets.filter((target) => hitIds.has(target.id));
      }
      for (const target of targets) {
        const outcome = typeof calculateMastery === "function"
          ? calculateMastery(run.actor, target, effect.element, effect.power, false, effect.scalingStat || "MPow")
          : { damage: Math.max(1, Math.floor((run.actor.stats[effect.scalingStat || "MPow"] || 0) * effect.power)) };
        addStatus(target, effect.id, {
          dotDamage: outcome.damage, damageType: effect.element, turns: effect.turns, debuff: true,
          sourceId: run.actor.id,
          sourceSide: run.actor.side,
          ...(effect.turnStart ? { turnStart: effect.turnStart } : {}),
        });
        if (target === run.target) run.results.dotDamage = outcome.damage;
      }
    },
    shield(effect, run) {
      const amount = effect.scalingStat
        ? Math.floor((effectiveStat ? effectiveStat(run.actor, effect.scalingStat) : (run.actor.stats[effect.scalingStat] || 0)) * effect.multiplier)
        : pct(run.target.stats.HP, effect.percentMaxHP);
      if (effect.replaceGroup) {
        run.target.shields = (run.target.shields || []).filter((shield) => shield.group !== effect.replaceGroup);
      }
      run.results.shield = amount;
      addShield(run.target, amount, effect.turns, effect.adaptive);
      const created = run.target.shields[run.target.shields.length - 1];
      if (effect.replaceGroup) created.group = effect.replaceGroup;
    },
    shieldSelf(effect, run) {
      run.results.shield = pct(run.actor.stats.HP, effect.percentMaxHP);
      addShield(run.actor, run.results.shield, effect.turns, effect.adaptive);
    },
    shieldAllies(effect, run) {
      for (const ally of sideActors(run.actor.side).filter((unit) => !unit.summon)) {
        addShield(ally, pct(ally.stats.HP, effect.percentMaxHP), effect.turns, effect.adaptive);
      }
    },
    statusSelf(effect, run) {
      const { type, ...data } = effect;
      addStatus(run.actor, effect.id, data);
    },
    statusAllies(effect, run) {
      for (const ally of sideActors(run.actor.side).filter((unit) => !unit.summon)) {
        const { type, ...data } = effect;
        addStatus(ally, effect.id, data);
      }
    },
    statusEnemies(effect, run) {
      let targets = sideActors(opposingSide(run.actor.side));
      if (effect.onlyHitTargets) {
        const hitIds = new Set(run.results.hitTargetIds || []);
        targets = targets.filter((target) => hitIds.has(target.id));
      }
      for (const enemy of targets) {
        const { type, ...data } = effect;
        addStatus(enemy, effect.id, data);
      }
    },
    masteryHit(effect, run) {
      let power = effect.power;
      const bonusText = [];
      for (const modifier of effect.powerModifiers || []) {
        const condition = modifier.when || {};
        if ((condition.flag || condition.andFlags?.length) && !matchesModifierCondition(run.actor, condition)) continue;
        if (condition.status && !run.actor.statuses?.[condition.status]) continue;
        if (condition.targetStatus && !run.target?.statuses?.[condition.targetStatus]) continue;
        if (condition.targetHpPercentBelow !== undefined) {
          const maxHp = run.target?.stats?.HP;
          if (!(Number.isFinite(maxHp) && maxHp > 0 && run.target.hp / maxHp * 100 < condition.targetHpPercentBelow)) continue;
        }
        if (modifier.setPower !== undefined) power = modifier.setPower;
        else power *= 1 + modifier.percent / 100;
        if (modifier.bonusText) bonusText.push(modifier.bonusText);
      }
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      power *= 1 + attackBonus / 100;
      power *= 1 + skillBonus / 100;
      if (attackBonus) bonusText.push(` (+${attackBonus}% next-attack bonus)`);
      if (skillBonus) bonusText.push(` (+${skillBonus}% next-skill bonus)`);
      const options = {
        ...(effect.accuracy === "guaranteed" ? { ignoreAccuracy: true } : {}),
        scalingStat: effect.scalingStat || "MPow",
      };
      if (effect.critRateBonusWhenStatus && run.actor.statuses?.[effect.critRateBonusWhenStatus]) {
        options.critRateBonus = effect.critRateBonus || 0;
      } else if (effect.critRateBonus) {
        options.critRateBonus = effect.critRateBonus;
      }
      const outcome = hitMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, options);
      run.results.skillBonus = skillBonus;
      run.results.damage = outcome.damage;
      run.results.missed = Boolean(outcome.miss);
      run.results.hitTargetIds = outcome.miss ? [] : [run.target.id];
      run.results.missedTargetIds = outcome.miss ? [run.target.id] : [];
      run.results.bonusText = bonusText.join("");
    },
    masteryMultiHit(effect, run) {
      const maxHp = run.target?.stats?.HP;
      const targetPercent = Number.isFinite(maxHp) && maxHp > 0 ? run.target.hp / maxHp * 100 : 100;
      const execute = effect.lastHitModifier && targetPercent < effect.lastHitModifier.targetHpPercentBelow;
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      const hits = [];
      let totalDamage = 0;
      let missed = false;
      const hitTargetIds = [];
      const missedTargetIds = [];
      for (let index = 0; index < effect.hits.length; index++) {
        if (!run.target?.alive) break;
        let power = effect.hits[index];
        if (index === effect.hits.length - 1 && execute) power = effect.lastHitModifier.setPower;
        power *= 1 + attackBonus / 100;
        power *= 1 + skillBonus / 100;
        const options = {
          ...(index > 0 || effect.accuracy === "guaranteed" ? { ignoreAccuracy: true } : {}),
          scalingStat: effect.scalingStat || "MPow",
        };
        const outcome = hitMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, options);
        if (outcome.miss) {
          missed = true;
          missedTargetIds.push(run.target.id);
          break;
        }
        if (!hitTargetIds.includes(run.target.id)) hitTargetIds.push(run.target.id);
        hits.push(outcome.damage);
        totalDamage += outcome.damage;
      }
      run.results.skillBonus = skillBonus;
      run.results.damage = totalDamage;
      run.results.hitsLanded = hits.length;
      run.results.hitDamages = hits;
      run.results.hitTargetIds = hitTargetIds;
      run.results.missedTargetIds = missedTargetIds;
      run.results.missed = missed;
      run.results.bonusText = [
        execute ? " (execution shot)" : "",
        attackBonus ? ` (+${attackBonus}% next-attack bonus)` : "",
        skillBonus ? ` (+${skillBonus}% next-skill bonus)` : "",
      ].join("");
    },
    masteryDamageAllEnemies(effect, run) {
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      const power = effect.power * (1 + attackBonus / 100) * (1 + skillBonus / 100);
      run.results.hitTargetIds = [];
      run.results.missedTargetIds = [];
      for (const enemy of sideActors(opposingSide(run.actor.side))) {
        const outcome = hitMastery(run.actor, enemy, effect.element, power, effect.canCrit ?? true, { scalingStat: effect.scalingStat || "MPow" });
        if (outcome.miss) run.results.missedTargetIds.push(enemy.id);
        else run.results.hitTargetIds.push(enemy.id);
        if (effect.status && !outcome.miss && enemy.alive && random() * 100 < effect.statusChance) {
          addStatus(enemy, effect.status.id, { ...effect.status, debuff: true });
        }
        if (enemy === run.target) run.results.damage = outcome.damage;
      }
      run.results.skillBonus = skillBonus;
    },
    masteryDamageAllOpponents(effect, run) {
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      const power = effect.power * (1 + attackBonus / 100) * (1 + skillBonus / 100);
      const opponentSide = opposingSide(run.actor.side);
      let totalDamage = 0;
      let hits = 0;
      run.results.hitTargetIds = [];
      run.results.missedTargetIds = [];
      for (const target of alive(state, opponentSide)) {
        if (effect.excludeSummons && target.summon) continue;
        const outcome = hitMastery(run.actor, target, effect.element, power, effect.canCrit ?? true, { scalingStat: effect.scalingStat || "MPow" });
        if (!outcome.miss) {
          totalDamage += outcome.damage;
          hits++;
          run.results.hitTargetIds.push(target.id);
        } else run.results.missedTargetIds.push(target.id);
      }
      run.results.skillBonus = skillBonus;
      run.results.damage = totalDamage;
      run.results.targetsHit = hits;
    },
    cleanseAllies(effect, run) {
      let totalCleansed = 0;
      for (const ally of sideActors(run.actor.side).filter((unit) => !unit.summon)) {
        const statusIds = [];
        for (const [key, status] of Object.entries(ally.statuses || {})) {
          if (status.debuff || status.amount < 0) {
            delete ally.statuses[key];
            statusIds.push(key);
          }
        }
        if (statusIds.length) {
          totalCleansed += statusIds.length;
          if (events) {
            emitCombatEvent(events, "StatusCleansed", {
              actorId: run?.actor?.id || "system",
              targetId: ally.id,
              statusIds,
            });
          }
        }
      }
      if (run) run.results.cleansedCount = totalCleansed;
    },
    conditionalStatus(effect, run) {
      if (run.results.missed) return;
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit || (effect.requireAlive && !unit.alive)) return;
      const conditionUnit = effect.conditionOn === "actor" ? run.actor : unit;
      if (effect.requiresStatus && !conditionUnit.statuses?.[effect.requiresStatus]) return;
      const amount = effect.conditionStatus && conditionUnit.statuses?.[effect.conditionStatus]
        ? effect.conditionalAmount : effect.amount;
      addStatus(unit, effect.id, { stat: effect.stat, amount, turns: effect.turns, debuff: effect.debuff });
    },
    summon(effect, run) {
      const template = run.data.summons[effect.template];
      const ownerTurnLifecycle = template.ownerTurnLifecycle && structuredClone(template.ownerTurnLifecycle);
      const summon = makeActor({
        id: template.id, name: template.name, side: run.actor.side, mastery: template.mastery,
        summon: true, passiveSummon: Boolean(ownerTurnLifecycle), targetableByEnemy: Boolean(template.targetableByEnemy),
        summonTurns: template.turns, stats: structuredClone(template.stats),
        ownerTurnLifecycle, skipNextOwnerTurnEnd: Boolean(ownerTurnLifecycle?.skipFirstTurnEnd),
        lifecycle: structuredClone(template.lifecycle || {}), ownerId: run.actor.id,
        onDestroyed: template.onDestroyed && structuredClone(template.onDestroyed),
        ownerEvents: template.ownerEvents && structuredClone(template.ownerEvents),
      });
      state.actors.push(summon);
      run.results.summon = summon.name;
    },
    setBattleTimer(effect, run) {
      state.battleTimers ||= {};
      state.battleTimers[effect.key] = {
        turns: effect.turns,
        ...(effect.ownerTurnClock ? { ownerId: run.actor.id, ownerSide: run.actor.side, skipNextOwnerTurnEnd: true } : {}),
        ...(effect.turnStart ? { turnStart: structuredClone(effect.turnStart) } : {}),
      };
    },
    announceSummonPowerModifier(effect, run) {
      if (!isBattleTimerActive(state, effect.battleTimer)) return;
      for (const summon of alive(state, run.actor.side).filter((unit) => unit.summon)) {
        const rules = summon.ownerTurnLifecycle?.activation || summon.lifecycle?.activation || [];
        const rule = rules.find((entry) => entry.handler === effect.ruleHandler);
        const modifier = rule?.conditionalPower?.find((entry) => entry.battleTimer === effect.battleTimer);
        if (!modifier) continue;
        run.after.push(effect.message
          .replaceAll("{actor}", summon.name)
          .replaceAll("{power}", String(Math.round(modifier.power * 100))));
      }
    },
    nextSkillDiscount(effect, run) {
      run.actor.mpDiscount = Math.max(run.actor.mpDiscount || 0, effect.amount || 0);
    },
    lifecycle(effect, run) {
      const handler = lifecycleHandlers[effect.event];
      if (typeof handler !== "function") throw new Error(`No lifecycle handler registered for "${effect.event}"`);
      return handler(effect, run);
    },
  };

  return EFFECTS;
}

module.exports = { createDefaultEffectHandlers };
