// Declarative passive event registry. Character data names a registered handler;
// the lifecycle runtime only emits events and never branches on character IDs.
const pct = (value, percent) => Math.floor((value * percent) / 100);

const SUPPORTED_PASSIVE_EVENTS = Object.freeze([
  "battleStart", "turnStart", "turnEnd", "damageTaken", "damageDealt", "evade", "skillUsed", "summonDestroyed",
]);


function addTetherMark(actor, target, subscription, context) {
  if (!target?.alive || !actor || target.side === actor.side) return false;
  const markId = subscription.markStatusId || "tetherMarks";
  const snaredId = subscription.snaredStatusId || "tetherSnared";
  if (target.statuses?.[snaredId]) return false;
  const existing = target.statuses?.[markId];
  const durations = [...(Array.isArray(existing?.stackDurations) ? existing.stackDurations : [])];
  const maxStacks = subscription.maxStacks || 2;
  if (durations.length >= maxStacks) return false;
  durations.push(subscription.duration || 2);
  context.addStatus(target, markId, {
    debuff: true,
    stackable: true,
    stacks: durations.length,
    stackDurations: durations,
    turns: Math.max(...durations),
    label: "Tether Mark",
  });
  if (durations.length >= maxStacks) {
    context.addStatus(target, snaredId, {
      stat: subscription.stat || "SPD",
      amount: subscription.snareAmount ?? -15,
      turns: subscription.snareDuration || 2,
      debuff: true,
      control: "snare",
    });
    context.say?.(`${target.name} is Snared by ${actor.name}'s Tether of Ruin!`);
  }
  return true;
}

function createPassiveRegistry(context) {
  const { addStatus, addShield, alive, state, makeActor, say } = context;
  const handlers = {
    announcePassive(actor, event, subscription, ctx) {
      if (!actor.alive || !actor.passive?.name) return;
      const detail = actor.passive.description ? `: ${actor.passive.description}` : " is active.";
      ctx.say(`${actor.name} passive — ${actor.passive.name}${detail}`);
    },
    activateFlagBelowHpPercent(actor, event, subscription, ctx) {
      if (!actor.alive || !subscription.flag || actor.passiveFlags?.[subscription.flag]) return;
      const threshold = pct(actor.stats.HP, subscription.thresholdPercent);
      if (actor.hp > threshold) return;
      actor.passiveFlags ||= {};
      actor.passiveFlags[subscription.flag] = true;
      if (subscription.transitionStatus?.id) {
        const { id, ...status } = subscription.transitionStatus;
        addStatus(actor, id, status);
      }
      if (subscription.message) ctx.say(subscription.message.replaceAll("{actor}", actor.name));
      else ctx.say(`${actor.name}'s ${actor.passive?.name || "passive"} activates!`);
    },
    initializeCatalystWing(actor, event, subscription, ctx) {
      const p = actor.passive;
      actor.catalystWingTurns = p.wingTurns;
      actor.catalystWingTurnCount = 0;
      const wing = makeActor({
        id: `catalyst-wing-${actor.id}`, name: p.summon.name, side: actor.side, mastery: p.summon.mastery,
        summon: true, passiveSummon: true, targetableByEnemy: true,
        summonTurns: p.wingTurns, ownerId: actor.id,
        stats: {
          HP: pct(actor.stats.HP, p.summon.hpPercent), MP: 0, ATK: 0, MPow: 0,
          DEF: pct(actor.stats.DEF, p.summon.defPercent), RES: pct(actor.stats.RES, p.summon.resPercent), SPD: 1,
          CritRate: 0, Evasion: 0, masteryBonus: {}, masteryResistance: {},
        },
      });
      ctx.state.actors.push(wing);
      actor.catalystWingId = wing.id;
    },
    tickCatalystProtocol(actor, event, subscription, ctx) {
      if (!(actor.catalystWingTurns > 0)) return;
      const p = actor.passive;
      const wing = ctx.state.actors.find((unit) => unit.id === actor.catalystWingId);
      if (!wing?.alive) {
        actor.catalystWingTurns = 0;
        return;
      }

      actor.catalystWingTurnCount++;
      // Catalyst Protocol pulses at the start of every second Evalete turn.
      if (actor.catalystWingTurnCount % p.pulseEvery === 0) {
        for (const ally of ctx.alive(ctx.state, actor.side).filter((unit) => !unit.summon)) {
          ctx.heal(ally, pct(ally.stats.HP, p.healPercent));
          const amount = pct(ally.stats.HP, p.shieldPercent);
          ctx.addShield(ally, amount, p.shieldTurns);
          ally.shields[ally.shields.length - 1].sourceId = p.shieldSource;
        }
      }
    },
    expireCatalystProtocol(actor, event, subscription, ctx) {
      if (!(actor.catalystWingTurns > 0)) return;
      const wing = ctx.state.actors.find((unit) => unit.id === actor.catalystWingId);
      if (!wing?.alive) {
        actor.catalystWingTurns = 0;
        return;
      }
      actor.catalystWingTurns--;
      wing.summonTurns = actor.catalystWingTurns;
      if (actor.catalystWingTurns <= 0) wing.alive = false;
    },
    startTimedPassive(actor, event, subscription) {
      const key = subscription.timerKey || "default";
      actor.passiveTimers ||= {};
      actor.passiveTimers[key] = subscription.turns || 1;
    },
    tickTimedPassive(actor, event, subscription) {
      const key = subscription.timerKey || "default";
      actor.passiveTimers ||= {};
      if (actor.passiveTimers[key] > 0) actor.passiveTimers[key]--;
    },
    setFlagFromHistory(actor, event, subscription) {
      actor.passiveFlags ||= {};
      actor.passiveFlags[subscription.flag] = !Boolean(actor[subscription.historyField]);
      if (subscription.resetHistory !== false) actor[subscription.historyField] = false;
    },
    setPassiveFlag(actor, event, subscription) {
      actor.passiveFlags ||= {};
      actor.passiveFlags[subscription.flag] = subscription.value !== false;
    },
    clearPassiveFlag(actor, event, subscription) {
      actor.passiveFlags ||= {};
      actor.passiveFlags[subscription.flag] = false;
    },
    recoilDampeners(actor, event) {
      const p = actor.passive;
      if (!actor.alive || (event.kind && event.kind !== "direct")) return;
      if (event.amount <= pct(actor.stats.HP, p.damageThresholdPercent)) return;
      const statusId = p.statusId;
      if (!statusId) throw new Error("recoilDampeners passive requires statusId");
      const stacks = Math.min(p.maxStacks, (actor.statuses[statusId]?.stacks || 0) + 1);
      addStatus(actor, statusId, { stat: "MPow", amount: p.mpowBonusPercent * stacks, stacks, stackable: true, turns: p.duration });
    },
    applyStatusesOnDamageDealt(actor, event, subscription) {
      if (!actor.alive || !event.target?.alive || (event.kind && event.kind !== "direct")) return;
      if (subscription.damageTypes?.length && !subscription.damageTypes.includes(event.damageType)) return;
      if (subscription.onlyAgainstOpponents && event.target.side === actor.side) return;
      for (const entry of subscription.statuses || []) {
        addStatus(event.target, entry.id, structuredClone(entry.data || {}));
      }
    },
    applyStatusesOnEvade(actor, event, subscription) {
      if (!actor.alive) return;
      for (const entry of subscription.statuses || []) {
        if (entry.requiresStatus && !actor.statuses?.[entry.requiresStatus]) continue;
        if (entry.requiresMissingStatus && actor.statuses?.[entry.requiresMissingStatus]) continue;
        if (entry.refresh === false && actor.statuses?.[entry.id]) continue;
        addStatus(actor, entry.id, structuredClone(entry.data || {}));
      }
    },
    consumeStatusesOnSkillUse(actor, event, subscription) {
      const skill = event.skill;
      if (!skill) return;
      if (subscription.skillTag && !skill.tags?.includes(subscription.skillTag)) return;
      if (subscription.skillKey && skill.key !== subscription.skillKey) return;
      for (const statusId of subscription.statusIds || []) delete actor.statuses[statusId];
    },
    consumeReinforcementOnChargedSkill(actor, event, subscription) {
      if (!actor.passiveFlags?.[subscription.primedFlag]) return;
      const explicitlyConsumed = (subscription.skillKeys || []).includes(event.skill?.key);
      const damagingResult = Number(event.run?.results?.damage) > 0;
      if (!event.run?.results?.skillBonus && !(subscription.consumeOnDamage && damagingResult) && !explicitlyConsumed) return;
      delete actor.statuses[subscription.reinforcementStatusId];
      if (subscription.chargeStatusId) delete actor.statuses[subscription.chargeStatusId];
      actor.passiveFlags[subscription.primedFlag] = false;
    },
    // The primed flag is derived from the charge status. If the charge expires
    // (or is removed) without being spent, the flag must not outlive it.
    clearPrimedFlagWithoutCharge(actor, event, subscription) {
      if (!actor.passiveFlags?.[subscription.primedFlag]) return;
      if (actor.statuses?.[subscription.chargeStatusId]) return;
      actor.passiveFlags[subscription.primedFlag] = false;
    },
    applyFractureToPrimaryHit(actor, event, subscription) {
      const run = event.run;
      if (!actor.alive || !run) return;
      const hitIds = new Set(run.results?.hitTargetIds || []);
      if (!hitIds.size) return;
      const candidates = (state?.actors || []).filter((unit) => unit.alive && unit.side !== actor.side && hitIds.has(unit.id));
      if (!candidates.length) return;
      const primary = run.target && run.target.side !== actor.side && hitIds.has(run.target.id)
        ? candidates.find((unit) => unit.id === run.target.id)
        : candidates[0];
      if (!primary) return;
      addStatus(primary, subscription.statusId || "fracture", {
        stat: subscription.stat || "DEF",
        amount: subscription.amount ?? -8,
        turns: subscription.duration || 2,
        debuff: true,
      });
    },
    grantResistanceToHealedAllies(actor, event, subscription, ctx) {
      if (!actor.alive) return;
      const run = event.run;
      const ids = new Set(run?.results?.healedTargetIds || []);
      if (!ids.size) return;
      for (const ally of state?.actors || []) {
        if (!ally.alive || ally.side !== actor.side || !ids.has(ally.id) || ally.summon) continue;
        addStatus(ally, subscription.statusId || "verraToxicResistance", {
          resistanceType: subscription.resistanceType || "Toxic",
          resistancePercent: subscription.resistancePercent || 10,
          turns: subscription.duration || 2,
        });
      }
    },
    applyTetherMarksOnSkillUse(actor, event, subscription) {
      if (subscription.skipIfRunResult && event.run?.results?.[subscription.skipIfRunResult]) return;
      if (!event.run?.results?.damage && !(event.run?.results?.hitTargetIds || []).length) return;
      const hitIds = new Set(event.run?.results?.hitTargetIds || []);
      if (!actor.alive || !hitIds.size) return;
      for (const target of state?.actors || []) {
        if (!target.alive || target.side === actor.side || !hitIds.has(target.id)) continue;
        addTetherMark(actor, target, subscription, context);
      }
    },
    applyTetherMarkOnBasicAttack(actor, event, subscription) {
      if (!actor.alive || event.actionType !== "basic" || (event.kind && event.kind !== "direct")) return;
      addTetherMark(actor, event.target, subscription, context);
    },
    stackReinforcement(actor, event, subscription) {
      if (!actor.alive || (event.kind && event.kind !== "direct")) return;
      if (subscription.requireEnemySkill && event.actionType !== "skill") return;
      const statusId = subscription.statusId;
      const existingStacks = actor.statuses[statusId]?.stacks || 0;
      const stacks = Math.min(subscription.maxStacks, existingStacks + 1);
      addStatus(actor, statusId, {
        stat: subscription.stat,
        amount: subscription.amountPerStack * stacks,
        stacks,
        stackable: true,
        turns: subscription.duration,
      });
      if (stacks >= subscription.maxStacks) {
        addStatus(actor, subscription.chargeStatusId, {
          ...(subscription.nextSkillPowerAdd !== undefined ? { nextSkillPowerAdd: subscription.nextSkillPowerAdd, scalingStat: subscription.scalingStat || "ATK" } : {}),
          ...(subscription.nextSkillDamagePercent !== undefined ? { nextSkillDamagePercent: subscription.nextSkillDamagePercent } : {}),
          ...(subscription.damageType ? { damageType: subscription.damageType } : {}),
          turns: subscription.duration,
        });
        actor.passiveFlags ||= {};
        actor.passiveFlags[subscription.primedFlag] = true;
      }
    },

  };

  function dispatch(actor, eventName, payload = {}) {
    const subscriptions = actor?.passive?.events?.[eventName] || [];
    for (const subscription of subscriptions) {
      const handler = handlers[subscription.handler];
      if (!handler) throw new Error(`Unknown passive handler "${subscription.handler}" for ${eventName}`);
      handler(actor, payload, subscription, context);
    }
  }
  return {
    dispatch,
    has(name) { return typeof handlers[name] === "function"; },
    entries() { return Object.entries(handlers); },
    register(name, handler) {
      if (handlers[name]) throw new Error(`Passive handler "${name}" is already registered`);
      if (typeof handler !== "function") throw new TypeError("Passive handler must be a function");
      handlers[name] = handler;
      return this;
    },
  };
}
module.exports = { createPassiveRegistry, SUPPORTED_PASSIVE_EVENTS };
