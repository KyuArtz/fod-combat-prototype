function discountFor(actor) {
  // `discount` remains supported for old fixtures; new passives use a flat MP amount.
  return Math.max(0, Number(actor.mpDiscount) || (actor.discount ? 0 : 0));
}

function actualCost(actor, cost) {
  const flat = discountFor(actor);
  return Math.max(
    0,
    cost - flat - (actor.discount ? Math.ceil(cost * 0.1) : 0),
  );
}

function pay(actor, cost) {
  const actual = actualCost(actor, cost);
  if (actor.mp < actual) throw new Error("Not enough MP.");
  actor.mp -= actual;
  actor.discount = false;
  actor.mpDiscount = 0;
  return true;
}

function ready(actor, skill, cost) {
  if (!actor.alive || (actor.cooldowns[skill] || 0) > 0) return false;
  return actor.mp >= actualCost(actor, cost);
}

function tickCooldowns(actor) {
  for (const key of Object.keys(actor.cooldowns)) {
    actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1);
  }
}

module.exports = { pay, ready, tickCooldowns, actualCost };
