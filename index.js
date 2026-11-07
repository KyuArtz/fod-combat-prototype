const { createBattle } = require("./core/battle");

async function main() {
  const battle = createBattle();
  try {
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

module.exports = { main };