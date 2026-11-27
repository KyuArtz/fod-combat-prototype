// Declarative skill effect handlers. Keep effect execution separate from skill policy and validation.
const { matchesModifierCondition, getHighestPriorityCleanseEntry, consumeNextAttackDamageModifier, consumeNextSkillDamageModifier, consumeNextSkillPowerModifier } = require("../statusEffects");
const { isBattleTimerActive } = require("../battleTimers");
const { resolveEffectApplication } = require("../effectSusceptibility");
const { emitCombatEvent } = require("../../core/combatEvents");

const pct = (value, percent) => Math.floor((value * percent) / 100);

function resolvePowerModifiers(basePower, modifiers = [], actor, target) {
  let power = basePower;
  const bonusText = [];
  for (const modifier of modifiers) {
    const condition = modifier.when || {};
    if ((condition.flag || condition.andFlags?.length) && !matchesModifierCondition(actor, condition)) continue;
    if (condition.status && !actor.statuses?.[condition.status]) continue;
    if (condition.targetStatus && !target?.statuses?.[condition.targetStatus]) continue;
    if (condition.targetHpPercentBelow !== undefined) {
      const maxHp = target?.stats?.HP;
      if (!(Number.isFinite(maxHp) && maxHp > 0 && target.hp / maxHp * 100 < condition.targetHpPercentBelow)) continue;
    }
    if (modifier.setPower !== undefined) power = modifier.setPower;
    else if (modifier.addPower !== undefined) power += modifier.addPower;
    else power *= 1 + modifier.percent / 100;
    if (modifier.bonusText) bonusText.push(modifier.bonusText);
  }
  return { power, bonusText };
}

function createDefaultEffectHandlers(context) {
  const opposingSide = (side) => side === "ally" ? "enemy" : "ally";
  const sideActors = (side) => alive(state, side);
  const {
    addShield, addStatus, alive, applyDamage, calculateMastery, effectiveStat, heal, hitMastery,
    hitPhysical, makeActor, state, events, lifecycleHandlers = {}, random = Math.random,
  } = context;

  // Opt-in integration: legacy effects bypass susceptibility exactly as before.
  function applyStatusEffect(unit, id, statusData, susceptibility) {
    if (!susceptibility) return addStatus(unit, id, statusData);
    const tags = susceptibility.effectTags || [];
    const resolution = resolveEffectApplication(unit, {
      id, effectTags: tags,
      requiredCapabilities: susceptibility.requiredCapabilities,
      requiredAnyCapabilities: susceptibility.requiredAnyCapabilities,
      excludedCapabilities: susceptibility.excludedCapabilities,
      chance: susceptibility.chance,
      turns: statusData.turns,
    }, random);
    if (!resolution.applied) return false;
    const resolvedData = { ...statusData, ...(tags.length ? { effectTags: [...tags] } : {}) };
    if (resolution.duration && statusData.turns !== undefined) resolvedData.turns = resolution.duration;
    return addStatus(unit, id, resolvedData);
  }

  const EFFECTS = {
    heal(effect, run) {
      run.results.healed = heal(run.target, pct(run.target.stats.HP, effect.percentMaxHP));
    },
    healPower(effect, run) {
      const stat = effect.scalingStat || "MPow";
      const base = effectiveStat ? effectiveStat(run.actor, stat) : (run.actor.stats[stat] || 0);
      const maxHp = run.target?.stats?.HP || 0;
      const hpPercent = maxHp > 0 ? run.target.hp / maxHp * 100 : 100;
      const multiplier = effect.multiplierBelowHpPercent !== undefined && hpPercent < effect.multiplierBelowHpPercent
        ? (effect.conditionalMultiplier || effect.multiplier)
        : effect.multiplier;
      run.results.healed = heal(run.target, Math.floor(base * multiplier));
      run.results.healedTargetIds = run.results.healed > 0 ? [run.target.id] : [];
    },
    healPowerAllies(effect, run) {
      const amount = Math.floor((effectiveStat ? effectiveStat(run.actor, effect.scalingStat || "MPow") : (run.actor.stats[effect.scalingStat || "MPow"] || 0)) * effect.multiplier);
      let total = 0;
      const healedTargetIds = [];
      for (const ally of sideActors(run.actor.side).filter((unit) => !unit.summon)) {
        const healed = heal(ally, amount);
        total += healed;
        if (healed > 0) healedTargetIds.push(ally.id);
      }
      run.results.healed = total;
      run.results.healedTargetIds = healedTargetIds;
    },
    healSelf(effect, run) {
      run.results.healed = heal(run.actor, pct(run.actor.stats.HP, effect.percentMaxHP));
    },
    cleanseTarget(effect, run) {
      if (!run.target) return;
      const entry = getHighestPriorityCleanseEntry(run.target.statuses || {});
      if (!entry) {
        run.results.cleansedCount = 0;
        return;
      }
      delete run.target.statuses[entry[0]];
      run.results.cleansedCount = 1;
      if (events) emitCombatEvent(events, "StatusCleansed", {
        actorId: run.actor.id, targetId: run.target.id, statusIds: [entry[0]],
      });
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
      const outcome = hitPhysical(run.actor, run.target, effect.power * (1 + bonus / 100) * (1 + skillBonus / 100), effect.canCrit ?? true, {
        actionType: "skill", skillKey: run.skill?.key,
      });
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
      applyDamage(run.target, outcome.damage, effect.element, run.actor, {
        kind: "direct", actionType: "skill", skillKey: run.skill?.key,
      });
      run.results.skillBonus = skillBonus;
      run.results.damage = outcome.damage;
      run.results.missed = false;
      run.results.hitTargetIds = [run.target.id];
      run.results.missedTargetIds = [];
    },
    status(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit) return;
      const { type, to, susceptibility, ...data } = effect;
      applyStatusEffect(unit, effect.id, data, susceptibility);
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
        applyStatusEffect(target, effect.id, {
          dotDamage: outcome.damage, damageType: effect.element, turns: effect.turns, debuff: true,
          sourceId: run.actor.id,
          sourceSide: run.actor.side,
          ...(effect.turnStart ? { turnStart: effect.turnStart } : {}),
        }, effect.susceptibility);
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
      if (effect.requiresStatus) targets = targets.filter((enemy) => enemy.statuses?.[effect.requiresStatus]);
      if (effect.onlyHitTargets) {
        const hitIds = new Set(run.results.hitTargetIds || []);
        targets = targets.filter((target) => hitIds.has(target.id));
      }
      for (const enemy of targets) {
        const { type, susceptibility, ...data } = effect;
        applyStatusEffect(enemy, effect.id, data, susceptibility);
      }
    },
    masteryHit(effect, run) {
      const resolved = resolvePowerModifiers(effect.power, effect.powerModifiers || [], run.actor, run.target);
      let power = resolved.power;
      const bonusText = [...resolved.bonusText];
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const skillBonus = consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      const skillPowerAdd = effect.ignoreNextSkillPowerModifier
        ? (consumeNextSkillPowerModifier(run.actor, run.skill?.key, effect.element, effect.scalingStat || "MPow"), 0)
        : consumeNextSkillPowerModifier(run.actor, run.skill?.key, effect.element, effect.scalingStat || "MPow");
      power += skillPowerAdd;
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
      const outcome = hitMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, {
        ...options, actionType: "skill", skillKey: run.skill?.key,
      });
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
      const skillPowerAdd = effect.ignoreNextSkillPowerModifier
        ? (consumeNextSkillPowerModifier(run.actor, run.skill?.key, effect.element, effect.scalingStat || "MPow"), 0)
        : consumeNextSkillPowerModifier(run.actor, run.skill?.key, effect.element, effect.scalingStat || "MPow");
      const hits = [];
      let totalDamage = 0;
      let missed = false;
      const hitTargetIds = [];
      const missedTargetIds = [];
      const lastHitModifiers = [];
      for (let index = 0; index < effect.hits.length; index++) {
        if (!run.target?.alive) break;
        let power = effect.hits[index];
        if (index === effect.hits.length - 1 && execute) power = effect.lastHitModifier.setPower;
        const standard = resolvePowerModifiers(power, effect.powerModifiers || [], run.actor, run.target);
        power = standard.power;
        if (index === effect.hits.length - 1) {
          const finalHit = resolvePowerModifiers(power, effect.lastHitPowerModifiers || [], run.actor, run.target);
          power = finalHit.power;
          lastHitModifiers.push(...finalHit.bonusText);
        }
        if (index === 0) power += skillPowerAdd;
        power *= 1 + attackBonus / 100;
        power *= 1 + skillBonus / 100;
        const options = {
          ...(index > 0 || effect.accuracy === "guaranteed" ? { ignoreAccuracy: true } : {}),
          scalingStat: effect.scalingStat || "MPow",
        };
        const outcome = hitMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, {
        ...options, actionType: "skill", skillKey: run.skill?.key,
      });
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
        ...lastHitModifiers,
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
        const outcome = hitMastery(run.actor, enemy, effect.element, power, effect.canCrit ?? true, {
        scalingStat: effect.scalingStat || "MPow", actionType: "skill", skillKey: run.skill?.key,
      });
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
      const skillBonus = effect.ignoreNextSkillDamageModifier
        ? (consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element), 0)
        : consumeNextSkillDamageModifier(run.actor, run.skill?.key, effect.element);
      const skillPowerAdd = effect.ignoreNextSkillPowerModifier
        ? (consumeNextSkillPowerModifier(run.actor, run.skill?.key, effect.element, effect.scalingStat || "MPow"), 0)
        : consumeNextSkillPowerModifier(run.actor, run.skill?.key, effect.element, effect.scalingStat || "MPow");
      const opponentSide = opposingSide(run.actor.side);
      let totalDamage = 0;
      let hits = 0;
      const bonusText = [];
      run.results.hitTargetIds = [];
      run.results.missedTargetIds = [];
      for (const target of alive(state, opponentSide)) {
        if (effect.excludeSummons && target.summon) continue;
        const resolved = resolvePowerModifiers(effect.power, effect.powerModifiers || [], run.actor, target);
        const power = (resolved.power + skillPowerAdd) * (1 + attackBonus / 100) * (1 + skillBonus / 100);
        bonusText.push(...resolved.bonusText);
        const outcome = hitMastery(run.actor, target, effect.element, power, effect.canCrit ?? true, {
          scalingStat: effect.scalingStat || "MPow", actionType: "skill", skillKey: run.skill?.key,
        });
        if (!outcome.miss) {
          totalDamage += outcome.damage;
          hits++;
          run.results.hitTargetIds.push(target.id);
        } else run.results.missedTargetIds.push(target.id);
      }
      run.results.skillBonus = skillBonus;
      run.results.damage = totalDamage;
      run.results.targetsHit = hits;
      run.results.bonusText = [...new Set(bonusText)].join("");
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
    consumeTetherMarks(effect, run) {
      const target = run.target;
      if (!target?.alive || run.results.missed || !(run.results.hitTargetIds || []).includes(target.id)) return;
      const mark = target.statuses?.[effect.markStatus || "tetherMarks"];
      if (!mark || (mark.stacks || 0) < (effect.minimumStacks || 2)) return;
      delete target.statuses[effect.markStatus || "tetherMarks"];
      for (const statusId of effect.removeStatuses || []) delete target.statuses[statusId];
      const status = { ...(effect.apply || {}) };
      const id = status.id;
      delete status.id;
      if (id) addStatus(target, id, status);
      run.results.consumedMarks = mark.stacks;
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
