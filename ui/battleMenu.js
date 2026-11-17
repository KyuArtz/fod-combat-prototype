const { showParty, showStatus } = require("./statusDisplay");

const SEPARATOR = "-------------------------------------------------------------------------------------";

// The terminal player controller. It shows the turn menu, prompts for choices
// with readline, and returns a decision. It never changes the battle itself, and
// every decision is derived from the `view`; `state` is only read to print the
// status and party screens.
function createBattleMenu(context) {
  const { ask, output, say, state } = context;

  function showPartyStatus() {
    showParty(state.party, output);
  }

  async function chooseTarget(view, side, promptText = "Target") {
    const targets = side === "enemy" ? view.enemies : view.allies;
    if (!targets.length) return null;
    output.log(`${promptText}:`);
    targets.forEach((target, index) => {
      output.log(`  ${index + 1}. ${target.name} (${target.hp}/${target.maxHp} HP)`);
    });
    const choice = Number(await ask(`Choose target (1-${targets.length}): `)) || 0;
    output.log(`${SEPARATOR}\n`);
    return targets[choice - 1] || null;
  }

  async function chooseSwitch(view) {
    const { reserves, active } = view.actions.find((action) => action.type === "switch");
    showPartyStatus();
    const reserveIndex = Number(await ask("\nReserve member to deploy (0 = cancel): ")) - 1;
    if (!Number.isInteger(reserveIndex) || reserveIndex < 0 || reserveIndex >= reserves.length) {
      return null;
    }

    const activeIndex = Number(await ask(`Active member to replace (1-${active.length}): `)) - 1;
    output.log(`${SEPARATOR}\n`);
    if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= active.length) {
      output.log(`${SEPARATOR}\n`);
      say("Invalid formation slot.");
      return null;
    }
    return { type: "switch", reserveId: reserves[reserveIndex].id, activeId: active[activeIndex].id };
  }

  // Returns a decision for a skill, or null to go back to the menu.
  async function chooseSkill(view, skill) {
    if (skill.targeting === "mode") {
      output.log(`${skill.name}: ${skill.modes.map((mode, index) => `${index + 1} ${mode.label}`).join(" | ")}`);
      const answer = (await ask(`Choose mode (1-${skill.modes.length}): `)).trim();
      output.log(`${SEPARATOR}\n`);
      const mode = skill.modes.find((candidate, index) => answer === String(index + 1));
      if (!mode) return null;
      if (mode.targeting === "none") return { type: "skill", skillKey: skill.key, mode: mode.id };
      const target = await chooseTarget(view, mode.targeting);
      if (!target) return null;
      return { type: "skill", skillKey: skill.key, mode: mode.id, targetId: target.id };
    }

    if (skill.targeting === "none") return { type: "skill", skillKey: skill.key };

    const target = await chooseTarget(view, skill.targeting);
    if (!target) {
      say("No valid target selected.");
      return null;
    }
    return { type: "skill", skillKey: skill.key, targetId: target.id };
  }

  async function chooseAction(view) {
    const actor = view.actor;
    const skills = view.actions.filter((action) => action.type === "skill");
    while (true) {
      output.log("");
      output.log(`========== ${actor.name.toUpperCase()}'S TURN ===========================================================`);
      output.log(`HP: ${actor.hp} / ${actor.maxHp}`);
      output.log(`MP: ${actor.mp} / ${actor.maxMp}`);
      output.log(`CR: ${actor.cr}`);
      output.log("");
      output.log("1. Basic Attack");
      skills.forEach((skill, index) => {
        output.log(`${index + 2}. ${skill.category} - ${skill.name} [${skill.cost} MP, CD ${skill.cooldown}]`);
      });
      output.log("");
      output.log("6. View Status");
      output.log("7. View Falcon Party");
      output.log("8. Switch Party Member");

      const choice = (await ask("Choose action (1-8): ")).trim();
      output.log(`${SEPARATOR}\n`);

      if (choice === "1") {
        const target = await chooseTarget(view, "enemy");
        if (!target) {
          output.log("No valid target selected.");
          continue;
        }
        return { type: "basic", targetId: target.id };
      }

      if (/^[2-5]$/.test(choice) && skills[Number(choice) - 2]) {
        const skill = skills[Number(choice) - 2];
        if (!skill.usable) {
          output.log(`${skill.name} is unavailable (not enough MP or on cooldown).`);
          continue;
        }
        const decision = await chooseSkill(view, skill);
        if (decision) return decision;
        continue;
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
        const decision = await chooseSwitch(view);
        if (decision) return decision;
        continue;
      }
      output.log("Invalid choice. Try again.");
    }
  }

  return { chooseAction, showParty: showPartyStatus };
}

module.exports = { createBattleMenu };
