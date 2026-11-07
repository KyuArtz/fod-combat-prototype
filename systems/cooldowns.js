function pay(actor, cost) {
  const actual = actor.discount ? Math.ceil(cost * 0.9) : cost;
  if (actor.mp < actual) throw new Error("Not enough MP.");
  actor.mp -= actual;
  actor.discount = false;
  return true;
}

function ready(actor, skill, cost) {
  if (!actor.alive || (actor.cooldowns[skill] || 0) > 0) return false;
  const actual = actor.discount ? Math.ceil(cost * 0.9) : cost;
  return actor.mp >= actual;
}

function tickCooldowns(actor) {
  for (const key of Object.keys(actor.cooldowns)) {
    actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1);
  }
}

module.exports = { pay, ready, tickCooldowns };