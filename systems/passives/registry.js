// Declarative passive event registry. Character data names a registered handler;
// the lifecycle runtime only emits events and never branches on character IDs.
const pct = (value, percent) => Math.floor((value * percent) / 100);

function createPassiveRegistry(context) {
  const { addStatus, addShield, alive, state, makeActor, say } = context;
  const handlers = {
    initializeCatalystWing(actor, event, subscription, ctx) {
      const p = actor.passive;
      actor.catalystWingTurns = p.wingTurns;
      actor.catalystWingTurnCount = 0;
      const wing = makeActor({
        id: `catalyst-wing-${actor.id}`, name: p.summon.name, side: "ally", mastery: p.summon.mastery,
        summon: true, passiveSummon: true, targetableByEnemy: true,
        summonTurns: p.wingTurns, ownerId: actor.id,
        ownerEvents: { destroyed: [{ event: "summonDestroyed" }] },
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
      actor.catalystWingTurnCount++;
      actor.catalystWingTurns--;
      const wing = ctx.state.actors.find((unit) => unit.id === actor.catalystWingId);
      if (wing?.alive) {
        wing.summonTurns = actor.catalystWingTurns;
        if (actor.catalystWingTurns <= 0) wing.alive = false;
      }
      const p = actor.passive;
      if (actor.catalystWingTurnCount % p.pulseEvery !== 0) return;
      for (const ally of ctx.alive(ctx.state, "ally").filter((unit) => !unit.summon)) {
        ctx.heal(ally, pct(ally.stats.HP, p.healPercent));
        const amount = pct(ally.stats.HP, p.shieldPercent);
        const existing = ally.shields.find((shield) => shield.sourceId === p.shieldSource);
        if (existing) { existing.value = amount; existing.turns = p.shieldTurns; }
        else {
          ctx.addShield(ally, amount, p.shieldTurns);
          ally.shields[ally.shields.length - 1].sourceId = p.shieldSource;
        }
      }
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
    grantCatalystDestructionShield(owner, event, subscription, ctx) {
      if (!(owner.catalystWingTurns > 0)) return;
      owner.catalystWingTurns = 0;
      const p = owner.passive;
      const amount = pct(owner.stats.HP, p.destructionShieldPercent);
      ctx.addShield(owner, amount, p.destructionShieldTurns);
      ctx.say(`${p.summon.name} is destroyed. ${owner.name} gains an emergency shield (${amount}) for ${p.destructionShieldTurns} turns.`);
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
      if (!actor.alive || event.hpLoss <= pct(actor.stats.HP, p.damageThresholdPercent)) return;
      const statusId = p.statusId;
      if (!statusId) throw new Error("recoilDampeners passive requires statusId");
      const stacks = Math.min(p.maxStacks, (actor.statuses[statusId]?.stacks || 0) + 1);
      addStatus(actor, statusId, { stat: "ATK", amount: p.attackBonusPercent * stacks, stacks, turns: p.duration });
    },
    grantOverwatchAccuracy(actor, event) {
      const p = actor.passive;
      const recipients = [];
      if (event.target?.side === "ally") recipients.push(event.target);
      else if (event.target?.targetedByAllyId) {
        const recipient = state.actors.find((unit) => unit.id === event.target.targetedByAllyId && unit.alive);
        if (recipient) recipients.push(recipient);
      }
      for (const recipient of recipients) recipient.nextAttackAccuracy = p.nextAttackAccuracy || 10;
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
