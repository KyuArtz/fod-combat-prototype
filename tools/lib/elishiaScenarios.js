// Elishia-dense golden scenarios: headless battles where Elishia rotates through
// every one of her skills (and every Nano Swarm mode) as often as the rules allow,
// while the rest of the party attacks. The result is the engine log plus the final
// state of every unit, a much denser check of her skills than the terminal
// transcripts. Used by test/goldenElishia.test.js and tools/updateGolden.js.

const { playHeadless } = require("./headless");

function lowestHpRatio(units, view) {
  return [...units].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

// Elishia cycles Nano Swarm modes and skills; everyone else basic-attacks.
function createSkillCycler() {
  let turn = 0;
  const modeOrder = ["Repair", "Disrupt", "Decoy"];
  let modeIndex = 0;
  return {
    chooseAction(view) {
      const basic = view.actions.find((action) => action.type === "basic");
      const attack = { type: "basic", targetId: basic.targets[0] };
      if (view.actor.id !== "elishia") return attack;

      const order = ["nano", "barrier", "meo", "ultimate"];
      turn++;
      for (let offset = 0; offset < order.length; offset++) {
        const key = order[(turn + offset) % order.length];
        const skill = view.actions.find((action) => action.type === "skill" && action.key === key);
        if (!skill || !skill.usable) continue;
        if (key === "nano") {
          const mode = modeOrder[modeIndex++ % modeOrder.length];
          const sub = skill.modes.find((candidate) => candidate.id === mode);
          if (mode === "Repair") return { type: "skill", skillKey: key, mode, targetId: lowestHpRatio(view.allies).id };
          if (mode === "Disrupt") return { type: "skill", skillKey: key, mode, targetId: sub.targets[0] };
          return { type: "skill", skillKey: key, mode };
        }
        if (key === "barrier") return { type: "skill", skillKey: key, targetId: lowestHpRatio(view.allies).id };
        return { type: "skill", skillKey: key };
      }
      return attack;
    },
  };
}

function snapshot(state) {
  const units = new Map();
  for (const party of [state.party, state.enemyParty]) {
    for (const unit of [...party.active, ...party.reserve]) units.set(unit, true);
  }
  for (const unit of state.actors) units.set(unit, true);
  return [...units.keys()].map((unit) => ({
    id: unit.id, alive: unit.alive, hp: unit.hp, mp: unit.mp, cr: unit.cr,
    cooldowns: unit.cooldowns, shields: unit.shields, statuses: unit.statuses, discount: unit.discount,
  }));
}

// Elishia in different slots, with and without reserves.
const ELISHIA_SCENARIOS = [
  { name: "elishia-a", seed: 11, partyOrder: ["elishia", "zenki", "jazen", "evalete", "zackry"] },
  { name: "elishia-b", seed: 12, partyOrder: ["zenki", "elishia", "jazen", "evalete", "zackry"] },
  { name: "elishia-c", seed: 13, partyOrder: ["jazen", "zackry", "elishia", "zenki", "evalete"], maxActive: 3 },
  { name: "elishia-d", seed: 14, partyOrder: ["evalete", "zenki", "zackry", "jazen", "elishia"] },
  { name: "elishia-e", seed: 15, partyOrder: ["zackry", "jazen", "elishia", "evalete", "zenki"], maxActive: 3 },
  { name: "elishia-f", seed: 16, partyOrder: ["elishia", "evalete", "zenki", "zackry", "jazen"] },
];

async function playElishiaScenario({ seed, partyOrder, maxActive }) {
  const { result, state } = await playHeadless({
    seed,
    partyOrder,
    maxActive,
    controllers: { player: createSkillCycler() },
  });
  return { result, rounds: state.round, rng: state.rng, log: state.log, units: snapshot(state) };
}

module.exports = { ELISHIA_SCENARIOS, playElishiaScenario, createSkillCycler };
