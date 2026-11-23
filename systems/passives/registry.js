// Declarative passive event registry. Character data names a registered handler;
// the lifecycle runtime only emits events and never branches on character IDs.
const pct = (value, percent) => Math.floor((value * percent) / 100);

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
        id: `catalyst-wing-${actor.id}`, name: p.summon.name, side: "ally", mastery: p.summon.mastery,
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
        for (const ally of ctx.alive(ctx.state, "ally").filter((unit) => !unit.summon)) {
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

  };

  function dispatch(actor, eventName, payload = {}) {
    const subscriptions = actor?.passive?.events?.[eventName] || [];
    for (const subscription of subscriptions) {
      const handler = handlers[subscription.handler];
      if (!handler) throw new Error(`Unknown passive handler "${subscription.handler}" for ${eventName}`);
      handler(actor, payload, subscription, context);
    }
  }
  return { dispatch, register(name, handler) {
    if (handlers[name]) throw new Error(`Passive handler "${name}" is already registered`);
    if (typeof handler !== "function") throw new TypeError("Passive handler must be a function");
    handlers[name] = handler;
  } };
}
module.exports = { createPassiveRegistry };
