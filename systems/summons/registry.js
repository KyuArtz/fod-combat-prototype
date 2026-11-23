// Reusable, data-driven summon lifecycle handlers.
const { formatMessage } = require("../../core/skillMessages");
const { isBattleTimerActive } = require("../battleTimers");
const pct = (value, percent) => Math.floor((value * percent) / 100);

function createSummonRegistry(context) {
  const { alive, heal, hitPhysical, say, state } = context;
  const handlers = {
    emergencyField(summon, rule) {
      const candidates = alive(state, rule.side || summon.side).filter((unit) =>
        !unit.summon && unit.hp / unit.stats.HP < rule.thresholdPercent / 100);
      candidates.sort((a, b) => a.hp / a.stats.HP - b.hp / b.stats.HP);
      if (!candidates.length) return false;
      const target = candidates[0];
      const amount = heal(target, pct(target.stats.HP, rule.healPercent));
      say(formatMessage(rule.message || "{actor} restores {target} for {healed} HP.", { actor: summon.name, target: target.name, healed: amount }));
      return true;
    },
    coverFire(summon, rule) {
      const target = alive(state, rule.targetSide || "enemy")[0];
      if (!target) return;
      const modifier = (rule.conditionalPower || []).find((entry) => isBattleTimerActive(state, entry.battleTimer));
      const power = modifier?.power ?? rule.power;
      const outcome = hitPhysical(summon, target, power, rule.canCrit);
      say(formatMessage(rule.message || "{actor} attacks {target} for {damage} Physical damage.", { actor: summon.name, target: target.name, damage: outcome.damage }));
    },
  };

  function dispatch(summon, subscriptions = []) {
    for (const subscription of subscriptions) {
      const handler = handlers[subscription.handler];
      if (!handler) throw new Error(`Unknown summon handler "${subscription.handler}"`);
      const result = handler(summon, subscription);
      if (result === true && subscription.stopOnSuccess) return true;
    }
    return false;
  }

  return {
    dispatch,
    register(name, handler) {
      if (handlers[name]) throw new Error(`Summon handler "${name}" is already registered`);
      if (typeof handler !== "function") throw new TypeError("Summon handler must be a function");
      handlers[name] = handler;
    },
  };
}

module.exports = { createSummonRegistry };
