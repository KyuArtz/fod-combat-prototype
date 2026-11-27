// Shared targeting rules for controllers and the default enemy AI.
// Taunt is represented by a payload, not necessarily a generic status ID.
function tauntTurns(unit) {
  let best = null;
  for (const status of Object.values(unit?.statuses || {})) {
    if (status?.taunt !== true) continue;
    const turns = Number.isFinite(status.turns) ? status.turns : Infinity;
    if (turns <= 0) continue;
    if (best === null || turns > best) best = turns;
  }
  return best;
}


function getActiveTaunter(targets) {
  let best = null;
  for (const target of targets || []) {
    const turns = tauntTurns(target);
    if (turns === null) continue;
    if (!best || turns > best.turns) best = { unit: target, turns };
  }
  return best?.unit || null;
}


function restrictHostileTargets(targets) {
  const taunter = getActiveTaunter(targets);
  return taunter ? [taunter] : targets;
}


function hasActiveTaunt(unit) {
  return tauntTurns(unit) !== null;
}


module.exports = { tauntTurns, getActiveTaunter, restrictHostileTargets, hasActiveTaunt };
