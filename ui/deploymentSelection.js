function createDeploymentSelector({ ask, output }) {
  async function selectFormation(roster, activeCount = 4) {
    const remaining = [...roster];
    const order = [];

    output.log("\n=== FORMATION SETUP ================================================================");
    output.log(
      `Select ${roster.length} combatants in order. The first ${activeCount} deploy; the rest form the reserve queue.`,
    );

    while (remaining.length) {
      output.log("\nAvailable:");
      remaining.forEach((actor, index) => {
        output.log(`${index + 1}. ${actor.name}`);
      });

      const selectedIndex =
        Number(await ask(`Select combatant (${remaining.length ? `1-${remaining.length}` : ""}): `)) - 1;
        output.log("-------------------------------------------------------------------------------------");
      if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= remaining.length
      ) {
        output.log("Invalid selection. Try again.");
        continue;
      }

      order.push(remaining.splice(selectedIndex, 1)[0]);
      if (order.length === activeCount) {
        output.log("Active formation selected. Choose the reserve queue order.");
      }
    }

    output.log(`Active: ${order.slice(0, activeCount).map((actor) => actor.name).join(", ")}`);
    output.log(`Reserve queue: ${order.slice(activeCount).map((actor) => actor.name).join(", ")}`);
    return order;
  }

  return { selectFormation };
}

module.exports = { createDeploymentSelector };
