// Declarative skill effect handlers. Keep effect execution separate from skill policy and validation.
const { matchesModifierCondition, consumeNextAttackDamageModifier } = require("../statusEffects");
const { isBattleTimerActive } = require("../battleTimers");
const { emitCombatEvent } = require("../../core/combatEvents");

const pct = (value, percent) => Math.floor((value * percent) / 100);

function createDefaultEffectHandlers(context) {
  const {
    addShield, addStatus, alive, applyDamage, calculateMastery, heal, hitMastery,
    hitPhysical, makeActor, state, events, lifecycleHandlers = {}, random = Math.random,
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
      const bonus = consumeNextAttackDamageModifier(run.actor);
      const outcome = hitPhysical(run.actor, run.target, effect.power * (1 + bonus / 100), effect.canCrit ?? true);
      run.results.damage = outcome.damage;
    },
    damage(effect, run) {
      const bonus = consumeNextAttackDamageModifier(run.actor);
      const power = effect.power * (1 + bonus / 100);
      const outcome = calculateMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true);
      applyDamage(run.target, outcome.damage, effect.element, run.actor, { kind: "direct" });
      run.results.damage = outcome.damage;
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
      const targets = effect.side ? alive(state, effect.side) : (run.target ? [run.target] : []);
      for (const target of targets) {
        const outcome = typeof calculateMastery === "function"
          ? calculateMastery(run.actor, target, effect.element, effect.power, false)
          : { damage: Math.max(1, Math.floor((run.actor.stats.MPow || 0) * effect.power)) };
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
      let power = effect.power;
      const bonusText = [];
      for (const modifier of effect.powerModifiers || []) {
        const condition = modifier.when || {};
        if ((condition.flag || condition.andFlags?.length) && !matchesModifierCondition(run.actor, condition)) continue;
        if (condition.targetHpPercentBelow !== undefined) {
          const maxHp = run.target?.stats?.HP;
          if (!(Number.isFinite(maxHp) && maxHp > 0 && run.target.hp / maxHp * 100 < condition.targetHpPercentBelow)) continue;
        }
        if (modifier.setPower !== undefined) power = modifier.setPower;
        else power *= 1 + modifier.percent / 100;
        if (modifier.bonusText) bonusText.push(modifier.bonusText);
      }
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      power *= 1 + attackBonus / 100;
      if (attackBonus) bonusText.push(` (+${attackBonus}% next-attack bonus)`);
      const options = effect.accuracy === "guaranteed" ? { ignoreAccuracy: true } : undefined;
      const outcome = hitMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, options);
      run.results.damage = outcome.damage;
      run.results.missed = Boolean(outcome.miss);
      run.results.bonusText = bonusText.join("");
    },
    masteryMultiHit(effect, run) {
      const maxHp = run.target?.stats?.HP;
      const targetPercent = Number.isFinite(maxHp) && maxHp > 0 ? run.target.hp / maxHp * 100 : 100;
      const execute = effect.lastHitModifier && targetPercent < effect.lastHitModifier.targetHpPercentBelow;
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const hits = [];
      let totalDamage = 0;
      let missed = false;
      for (let index = 0; index < effect.hits.length; index++) {
        if (!run.target?.alive) break;
        let power = effect.hits[index];
        if (index === effect.hits.length - 1 && execute) power = effect.lastHitModifier.setPower;
        power *= 1 + attackBonus / 100;
        const options = index > 0 || effect.accuracy === "guaranteed" ? { ignoreAccuracy: true } : undefined;
        const outcome = hitMastery(run.actor, run.target, effect.element, power, effect.canCrit ?? true, options);
        if (outcome.miss) {
          missed = true;
          break;
        }
        hits.push(outcome.damage);
        totalDamage += outcome.damage;
      }
      run.results.damage = totalDamage;
      run.results.hitsLanded = hits.length;
      run.results.hitDamages = hits;
      run.results.missed = missed;
      run.results.bonusText = [
        execute ? " (execution shot)" : "",
        attackBonus ? ` (+${attackBonus}% next-attack bonus)` : "",
      ].join("");
    },
    masteryDamageAllEnemies(effect, run) {
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const power = effect.power * (1 + attackBonus / 100);
      for (const enemy of alive(state, "enemy")) {
        const outcome = hitMastery(run.actor, enemy, effect.element, power, effect.canCrit ?? true);
        if (effect.status && enemy.alive && random() * 100 < effect.statusChance) {
          addStatus(enemy, effect.status.id, { ...effect.status, debuff: true });
        }
        if (enemy === run.target) run.results.damage = outcome.damage;
      }
    },
    masteryDamageAllOpponents(effect, run) {
      const attackBonus = consumeNextAttackDamageModifier(run.actor);
      const power = effect.power * (1 + attackBonus / 100);
      const opponentSide = run.actor.side === "ally" ? "enemy" : "ally";
      let totalDamage = 0;
      let hits = 0;
      for (const target of alive(state, opponentSide)) {
        if (effect.excludeSummons && target.summon) continue;
        const outcome = hitMastery(run.actor, target, effect.element, power, effect.canCrit ?? true);
        if (!outcome.miss) {
          totalDamage += outcome.damage;
          hits++;
        }
      }
      run.results.damage = totalDamage;
      run.results.targetsHit = hits;
    },
    cleanseAllies(effect, run) {
      let totalCleansed = 0;
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
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
      if (effect.requireAlive && !unit.alive) return;
      if (effect.requiresStatus && !unit.statuses?.[effect.requiresStatus]) return;
      const amount = effect.conditionStatus && unit.statuses?.[effect.conditionStatus]
        ? effect.conditionalAmount : effect.amount;
      addStatus(unit, effect.id, { stat: effect.stat, amount, turns: effect.turns, debuff: effect.debuff });
    },
    summon(effect, run) {
      const template = run.data.summons[effect.template];
      const ownerTurnLifecycle = template.ownerTurnLifecycle && structuredClone(template.ownerTurnLifecycle);
      const summon = makeActor({
        id: template.id, name: template.name, side: "ally", mastery: template.mastery,
        summon: true, passiveSummon: Boolean(ownerTurnLifecycle), targetableByEnemy: Boolean(template.targetableByEnemy),
        summonTurns: template.turns, stats: structuredClone(template.stats),
        ownerTurnLifecycle, skipNextOwnerTurnEnd: Boolean(ownerTurnLifecycle?.skipFirstTurnEnd),
        lifecycle: structuredClone(template.lifecycle || {}), ownerId: run.actor.id,
        scan: template.scan && structuredClone(template.scan),
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
        ...(effect.ownerTurnClock ? { ownerId: run.actor.id, skipNextOwnerTurnEnd: true } : {}),
        ...(effect.turnStart ? { turnStart: structuredClone(effect.turnStart) } : {}),
      };
    },
    announceSummonPowerModifier(effect, run) {
      if (!isBattleTimerActive(state, effect.battleTimer)) return;
      for (const summon of alive(state, "ally").filter((unit) => unit.summon)) {
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
