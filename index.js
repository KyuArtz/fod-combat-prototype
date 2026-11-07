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

async function main() {
  const schedulerName = process.env.FOD_SCHEDULER || "threshold";
  const battle = createBattle({
    readinessScheduler: getReadinessScheduler(schedulerName),
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

module.exports = { getReadinessScheduler, main };