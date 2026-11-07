function addShield(target, amount, turns = 2) {
  target.shields.push({ value: amount, turns });
}

function tickShields(actor) {
  for (const shield of actor.shields) shield.turns--;
  actor.shields = actor.shields.filter(
    (shield) => shield.turns > 0 && shield.value > 0,
  );
}

function absorbDamage(target, amount) {
  let remaining = amount;
  for (const shield of target.shields) {
    const absorbed = Math.min(shield.value, remaining);
    shield.value -= absorbed;
    remaining -= absorbed;
    if (remaining <= 0) break;
  }
  target.shields = target.shields.filter((shield) => shield.value > 0);
  return remaining;
}

module.exports = { addShield, tickShields, absorbDamage };
