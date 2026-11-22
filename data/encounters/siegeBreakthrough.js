module.exports = {
  id: "siegeBreakthrough",
  name: "Siege Breakthrough",
  description: "A two-wave legacy progression encounter with a defeat-triggered reinforcement squad. Enemy archetype kits are active, while encounter-specific stat profiles preserve its earlier progression difficulty.",
  waves: [
    {
      id: "outer-defense",
      name: "Outer Defense",
      enemies: [
        { enemy: "training-drone", stats: { HP: 700, MP: 90, ATK: 65, MPow: 50, DEF: 45, RES: 45, SPD: 70 } },
        { enemy: "rogue-automaton", stats: { HP: 850, MP: 100, ATK: 75, MPow: 60, DEF: 55, RES: 50, SPD: 60 } },
        { enemy: "siege-turret", stats: { HP: 900, MP: 90, ATK: 90, MPow: 45, DEF: 70, RES: 40, SPD: 35 } },
        { enemy: "recon-drone", stats: { HP: 620, MP: 90, ATK: 58, MPow: 70, DEF: 35, RES: 65, SPD: 115 } },
        { enemy: "toxic-stalker", stats: { HP: 760, MP: 100, ATK: 72, MPow: 85, DEF: 45, RES: 60, SPD: 82 } },
      ],
    },
    {
      id: "inner-defense",
      name: "Inner Defense",
      enemies: [
        { enemy: "training-drone", instanceId: "inner-drone", stats: { HP: 820, MP: 95, ATK: 72, MPow: 55, DEF: 48, RES: 48, SPD: 76 } },
        { enemy: "rogue-automaton", instanceId: "inner-rogue", stats: { HP: 920, MP: 105, ATK: 80, MPow: 65, DEF: 58, RES: 55, SPD: 63 } },
        { enemy: "siege-turret", instanceId: "inner-turret", stats: { HP: 1100, MP: 95, ATK: 98, MPow: 50, DEF: 75, RES: 45, SPD: 38 } },
        { enemy: "recon-drone", instanceId: "inner-recon", stats: { HP: 620, MP: 95, ATK: 62, MPow: 76, DEF: 38, RES: 68, SPD: 92 } },
        { enemy: "toxic-stalker", instanceId: "inner-stalker", stats: { HP: 760, MP: 105, ATK: 78, MPow: 92, DEF: 48, RES: 62, SPD: 86 } },
      ],
    },
  ],
  reinforcements: [
    {
      id: "outer-defense-support",
      trigger: { type: "enemyDefeatedCount", atLeast: 2 },
      enemies: [
        { enemy: "recon-drone", instanceId: "support-recon", stats: { HP: 500, MP: 80, ATK: 52, MPow: 62, DEF: 32, RES: 58, SPD: 105 } },
        { enemy: "training-drone", instanceId: "support-drone", stats: { HP: 560, MP: 80, ATK: 58, MPow: 48, DEF: 40, RES: 40, SPD: 72 } },
      ],
    },
  ],
  rewards: { encounterClear: "siegeBreakthroughClear" },
};
