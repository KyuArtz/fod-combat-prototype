module.exports = {
  id: "siegeBreakthrough",
  name: "Siege Breakthrough",
  description: "A two-wave encounter with a defeat-triggered reinforcement squad.",
  waves: [
    {
      id: "outer-defense",
      name: "Outer Defense",
      enemies: [
        "training-drone",
        "rogue-automaton",
        "siege-turret",
        "recon-drone",
        "toxic-stalker",
      ],
    },
    {
      id: "inner-defense",
      name: "Inner Defense",
      enemies: [
        { enemy: "training-drone", instanceId: "inner-drone", stats: { HP: 820, ATK: 72 } },
        { enemy: "rogue-automaton", instanceId: "inner-rogue", stats: { HP: 920, DEF: 58 } },
        { enemy: "siege-turret", instanceId: "inner-turret", stats: { HP: 1100, ATK: 88 } },
        { enemy: "recon-drone", instanceId: "inner-recon", stats: { HP: 620, SPD: 92 } },
        { enemy: "toxic-stalker", instanceId: "inner-stalker", stats: { HP: 760, RES: 62 } },
      ],
    },
  ],
  reinforcements: [
    {
      id: "outer-defense-support",
      trigger: { type: "enemyDefeatedCount", atLeast: 2 },
      enemies: [
        { enemy: "recon-drone", instanceId: "support-recon", stats: { HP: 500 } },
        { enemy: "training-drone", instanceId: "support-drone", stats: { HP: 560 } },
      ],
    },
  ],
  rewards: { encounterClear: "siegeBreakthroughClear" },
};
