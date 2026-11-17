// An adaptive shield (Adaptive Barrier) remembers the last damage type it absorbed:
// the shielded unit gains a resistance to that type for the shield's remaining
// duration (status "adaptiveResistance", applied in systems/damage.js).
function addShield(target, amount, turns = 2, adaptive = null) {
  target.shields.push({
    value: amount, turns,
    ...(adaptive ? { adaptive: { ...adaptive } } : {}),
    ...(target._isTakingTurn ? { appliedDuringCurrentTurn: true } : {}),
  });
}

function tickShields(actor) {
  for (const shield of actor.shields) {
    if (shield.appliedDuringCurrentTurn) {
      delete shield.appliedDuringCurrentTurn;
      continue;
    }
    shield.turns--;
  }
  actor.shields = actor.shields.filter(
    (shield) => shield.turns > 0 && shield.value > 0,
  );
}

function absorbDamage(target, amount, damageType = null, onAdapt = () => {}) {
  let remaining = amount;
  let adaptiveShield = null;
  for (const shield of target.shields) {
    const absorbed = Math.min(shield.value, remaining);
    shield.value -= absorbed;
    remaining -= absorbed;
    if (absorbed > 0 && shield.adaptive && damageType) adaptiveShield = shield;
    if (remaining <= 0) break;
  }

  if (adaptiveShield) {
    const current = target.statuses.adaptiveResistance;
    if (!current || current.damageType !== damageType) {
      onAdapt(damageType, adaptiveShield.adaptive.resistance);
    }
    target.statuses.adaptiveResistance = {
      damageType,
      amount: adaptiveShield.adaptive.resistance,
      turns: adaptiveShield.turns,
    };
  }

  target.shields = target.shields.filter((shield) => shield.value > 0);
  return remaining;
}

module.exports = { addShield, tickShields, absorbDamage };
