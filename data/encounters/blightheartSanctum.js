module.exports = {
  id: "blightheartSanctum",
  name: "Blightheart Sanctum",
  description: "A two-stage encounter: clear the contaminated perimeter, then confront the Blightheart Overseer and its remaining guards.",
  waves: [
    {
      id: "perimeter-guardians",
      name: "Perimeter Guardians",
      enemies: [
        { enemy: "training-drone", instanceId: "perimeter-drone", stats: { HP: 700, MP: 90, ATK: 75, MPow: 85, DEF: 60, RES: 65, SPD: 95 } },
        { enemy: "rogue-automaton", instanceId: "perimeter-automaton", stats: { HP: 820, MP: 95, ATK: 92, MPow: 78, DEF: 82, RES: 80, SPD: 65 } },
        { enemy: "siege-turret", instanceId: "perimeter-turret", stats: { HP: 760, MP: 90, ATK: 105, MPow: 80, DEF: 88, RES: 65, SPD: 40 } },
        { enemy: "recon-drone", instanceId: "perimeter-recon", stats: { HP: 620, MP: 95, ATK: 76, MPow: 96, DEF: 55, RES: 80, SPD: 115 } },
        { enemy: "toxic-stalker", instanceId: "perimeter-stalker", stats: { HP: 700, MP: 100, ATK: 82, MPow: 105, DEF: 65, RES: 82, SPD: 90 } },
      ],
    },
    {
      id: "heart-chamber",
      name: "The Heart Chamber",
      enemies: [
        { enemy: "blightheart-overseer", instanceId: "matriarch" },
        { enemy: "training-drone", instanceId: "heart-drone", stats: { HP: 520, MP: 90, ATK: 72, MPow: 78, DEF: 55, RES: 60, SPD: 90 } },
        { enemy: "rogue-automaton", instanceId: "heart-automaton", stats: { HP: 680, MP: 95, ATK: 88, MPow: 74, DEF: 78, RES: 78, SPD: 62 } },
        { enemy: "recon-drone", instanceId: "heart-recon", stats: { HP: 480, MP: 95, ATK: 70, MPow: 88, DEF: 48, RES: 72, SPD: 108 } },
        { enemy: "toxic-stalker", instanceId: "heart-stalker", stats: { HP: 540, MP: 100, ATK: 76, MPow: 100, DEF: 58, RES: 76, SPD: 88 } },
      ],
    },
  ],
  rewards: { encounterClear: "blightheartSanctumClear" },
};
