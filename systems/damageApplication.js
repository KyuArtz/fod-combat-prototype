const { absorbDamage } = require("./shields");

function applyDamage(target, amount, say, onIncapacitated = () => {}) {
  const remaining = absorbDamage(target, amount);
  target.hp = Math.max(0, target.hp - remaining);
  if (target.hp <= 0 && target.alive) {
    target.alive = false;
    target.statuses = {};
    target.shields = [];
    say(`${target.name} is incapacitated!`);
    onIncapacitated(target);
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
