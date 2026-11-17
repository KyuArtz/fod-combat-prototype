const { absorbDamage } = require("./shields");

// damageType ("Physical" or a mastery type such as "Kinetic") lets adaptive shields
// adapt to what they absorb; leave it out for typeless damage.
function applyDamage(target, amount, say, onIncapacitated = () => {}, damageType = null) {
  const shieldBefore = target.shields.reduce((sum, shield) => sum + shield.value, 0);
  const remaining = absorbDamage(target, amount, damageType, (type, resistance) => {
    say(`${target.name}'s Adaptive Barrier adapts to ${type} damage (+${resistance}% resistance).`);
  });
  const absorbedAmount = Math.max(0, Math.min(amount, shieldBefore - target.shields.reduce((sum, shield) => sum + shield.value, 0)));
  target.hp = Math.max(0, target.hp - remaining);
  if (target.hp <= 0 && target.alive) {
    const defeatStatuses = { ...target.statuses };
    target.alive = false;
    target.statuses = {};
    target.shields = [];
    say(`${target.name} is incapacitated!`);
    onIncapacitated(target, defeatStatuses, { requestedAmount: amount, remainingDamage: remaining, absorbedAmount });
  }
  return remaining;
}

function heal(target, amount) {
  if (!target.alive) return 0;
  const before = target.hp;
  target.hp = Math.min(target.stats.HP, target.hp + amount);
  return target.hp - before;
}

module.exports = { applyDamage, heal };
