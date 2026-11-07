function enemyTarget(state, actor, alive) {
  const targets = alive(state, "ally").filter((target) => !target.summon);
  if (!targets.length) return null;

  if (actor.name === "Training Drone") return targets[0];
  return targets.reduce((weakest, current) =>
    current.hp / current.stats.HP < weakest.hp / weakest.stats.HP
      ? current
      : weakest,
  );
}

module.exports = { enemyTarget };