// Returns the longest remaining Taunt on a unit, or null when it has none.
// Statuses without a finite duration count as lasting indefinitely.
function tauntTurns(unit) {
  let best = null;
  for (const status of Object.values(unit.statuses || {})) {
    if (status?.taunt !== true) continue;
    const turns = Number.isFinite(status.turns) ? status.turns : Infinity;
    if (turns <= 0) continue;
    if (best === null || turns > best) best = turns;
  }
  return best;
}

function enemyTarget(state, actor, alive) {
  const targets = alive(state, "ally").filter((target) => (!target.summon || target.targetableByEnemy) &&
    !Object.values(target.statuses || {}).some((status) => status.untargetable));
  if (!targets.length) return null;
  // Taunt is stored under each effect's status ID (e.g. tyrantsGuardTaunt),
  // not necessarily under the generic "taunt" key, so inspect status payloads.
  // An expired payload (turns <= 0) is ignored even if it lingers. With several
  // taunters, the longest remaining Taunt wins; ties keep formation order.
  const taunter = targets.reduce((best, current) => {
    const turns = tauntTurns(current);
    if (turns === null) return best;
    return !best || turns > best.turns ? { unit: current, turns } : best;
  }, null)?.unit;
  if (taunter) return taunter;

  switch (actor.targetSelection || "weakest") {
    case "frontline":
      return targets[0];
    case "supportPriority": {
      const rolePriority = { "field-medic": 50, versatile: 38, tactician: 30, stalker: 18, demolitionist: 12, juggernaut: 8 };
      return targets.reduce((best, current) => {
        const bestScore = (rolePriority[best.role] || 0) + (1 - best.hp / best.stats.HP) * 12;
        const currentScore = (rolePriority[current.role] || 0) + (1 - current.hp / current.stats.HP) * 12;
        return currentScore > bestScore ? current : best;
      });
    }
    case "highestThreat":
      return targets.reduce((best, current) =>
        (current.stats.ATK + current.stats.MPow) > (best.stats.ATK + best.stats.MPow) ? current : best);
    case "highestMasteryPower":
      return targets.reduce((best, current) => current.stats.MPow > best.stats.MPow ? current : best);
    case "weakest":
    default:
      return targets.reduce((weakest, current) =>
        current.hp / current.stats.HP < weakest.hp / weakest.stats.HP ? current : weakest);
  }
}

// True when the unit has any live Taunt, whatever status ID carries it.
function hasActiveTaunt(unit) {
  return tauntTurns(unit) !== null;
}

module.exports = { enemyTarget, hasActiveTaunt };
