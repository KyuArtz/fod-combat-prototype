const { createBattle } = require("./core/battle");
const legacyReadiness = require("./systems/combatReadiness");
const thresholdReadiness = require("./systems/thresholdCombatReadiness");

function getReadinessScheduler(name = process.env.FOD_SCHEDULER || "threshold") {
  if (name === "legacy") return legacyReadiness;
  if (name === "threshold") return thresholdReadiness;
  throw new Error(
    `Unknown FOD_SCHEDULER "${name}". Use "legacy" or "threshold".`,
  );
}

function getOpeningInitiative(name = process.env.FOD_OPENING || "player-first") {
  if (name === "player-first" || name === "speed") return name;
  throw new Error(`Unknown FOD_OPENING "${name}". Use "player-first" or "speed".`);
}

async function main() {
  const schedulerName = process.env.FOD_SCHEDULER || "threshold";
  // FOD_SEED=12345 replays the same crits and enemy rolls. Unset = random seed.
  const battle = createBattle({
    readinessScheduler: getReadinessScheduler(schedulerName),
    seed: process.env.FOD_SEED,
    // FOD_OPENING=speed turns off the player-first opening and uses pure SPD order.
    openingInitiative: getOpeningInitiative(),
  });
  try {
    console.log(`Readiness scheduler: ${schedulerName}`);
    await battle.run();
  } finally {
    battle.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Battle error:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { getReadinessScheduler, getOpeningInitiative, main };