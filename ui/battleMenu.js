const {
  removeIncapacitatedReserves,
  switchPartyMember,
} = require("../systems/formation");
const { showParty, showStatus } = require("./statusDisplay");

function createBattleMenu(context) {
  const { ask, output, ready, say, state, skills } = context;

  function showPartyStatus() {
    showParty(state.party, output);
  }

  async function chooseTarget(side, promptText = "Target") {
    const targets = context.alive(state, side);
    if (!targets.length) return null;
    output.log(`${promptText}:`);
    targets.forEach((actor, index) => {
      output.log(`  ${index + 1}. ${actor.name} (${actor.hp}/${actor.stats.HP} HP)`);
    });
    const choice = Number(await ask(`Choose target (1-${targets.length}): `)) || 0;
    output.log("-------------------------------------------------------------------------------------\n");
    return targets[choice - 1] || null;
  }

  async function chooseReserve() {
    removeIncapacitatedReserves(state.party);
    showPartyStatus();
    const reserveIndex =
      Number(await ask("\nReserve member to deploy (0 = cancel): ")) - 1;
    if (
      !Number.isInteger(reserveIndex) ||
      reserveIndex < 0 ||
      reserveIndex >= state.party.reserve.length
    ) {
      return false;
    }

    const activeIndex =
      Number(await ask(`Active member to replace (1-${state.party.active.length}): `)) - 1;
    output.log("-------------------------------------------------------------------------------------\n");
    const switched = switchPartyMember(state, reserveIndex, activeIndex);
    if (!switched.changed) {
      if (switched.reason === "invalid-slot") {
        output.log("-------------------------------------------------------------------------------------\n");
        say("Invalid formation slot.");
      } else {
        say("That reserve member is incapacitated!");
      }
      return false;
    }

    say(`${switched.incoming.name} joins the active formation!`);
    say(`${switched.outgoing.name} moves to reserve.`);
    return true;
  }

  async function playerTurn(actor) {
    const actorSkills = skills[actor.id] || [];
    while (true) {
      output.log("");
      output.log(`========== ${actor.name.toUpperCase()}'S TURN ===========================================================`);
      output.log(`HP: ${actor.hp} / ${actor.stats.HP}`);
      output.log(`MP: ${actor.mp} / ${actor.stats.MP}`);
      output.log(`CR: ${actor.cr}`);
      output.log("");
      output.log("1. Basic Attack");
      actorSkills.forEach((skill, index) => {
        const category =
          skill.category ||
          (index === actorSkills.length - 1 ? "Ultimate" : `Skill ${index + 1}`);
        output.log(
          `${index + 2}. ${category} - ${skill.name} [${skill.cost} MP, CD ${actor.cooldowns[skill.key] || 0}]`,
        );
      });
      output.log("");
      output.log("6. View Status");
      output.log("7. View Falcon Party");
      output.log("8. Switch Party Member");

      const choice = (await ask("Choose action (1-8): ")).trim();
      output.log("-------------------------------------------------------------------------------------\n");

      if (choice === "1") {
        const target = await chooseTarget("enemy");
        if (!target) {
          output.log("No valid target selected.");
          continue;
        }
        context.basicAttack(actor, target);
        return;
      }

      if (/^[2-5]$/.test(choice) && actorSkills[Number(choice) - 2]) {
        const skill = actorSkills[Number(choice) - 2];
        if (!ready(actor, skill.key, skill.cost)) {
          output.log(
            `${skill.name} is unavailable (not enough MP or on cooldown).`,
          );
          continue;
        }
        if ((await skill.use(actor, chooseTarget)) === false) continue;
        return;
      }

      if (choice === "6") {
        showStatus(state, output);
        continue;
      }
      if (choice === "7") {
        showPartyStatus();
        continue;
      }
      if (choice === "8") {
        const changed = await chooseReserve();
        if (changed) return;
        continue;
      }
      output.log("Invalid choice. Try again.");
    }
  }

  return { chooseTarget, playerTurn, showParty: showPartyStatus };
}

module.exports = { createBattleMenu };