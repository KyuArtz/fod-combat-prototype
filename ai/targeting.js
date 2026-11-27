const { getActiveTaunter, hasActiveTaunt } = require("../systems/targetingRules");

function enemyTarget(state, actor, alive) {
  const targets = alive(state, "ally").filter((target) => (!target.summon || target.targetableByEnemy) &&
    !Object.values(target.statuses || {}).some((status) => status.untargetable));
  if (!targets.length) return null;
  // Shared payload-based Taunt lookup: longest duration wins; ties keep formation order.
  const taunter = getActiveTaunter(targets);
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

module.exports = { enemyTarget, hasActiveTaunt };
