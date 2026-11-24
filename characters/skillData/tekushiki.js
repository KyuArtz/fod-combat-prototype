module.exports = {
  characterId: "tekushiki",
  passive: {
    id: "tetherSnare",
    name: "Tether Snare",
    description: "Tekushiki's damaging skills and basic attacks apply one Tether Mark to each enemy hit. Each enemy can hold up to 2 marks, with each mark lasting 2 turns. At 2 marks, the enemy becomes Snared, reducing SPD by 15% for 2 turns. Snared enemies cannot gain additional Tether Marks while Snared.",
    events: {
      skillUsed: [{
        handler: "applyTetherMarksOnSkillUse",
        markStatusId: "tetherMarks",
        snaredStatusId: "tetherSnared",
        maxStacks: 2,
        duration: 2,
        stat: "SPD",
        snareAmount: -15,
        snareDuration: 2,
        skipIfRunResult: "consumedMarks",
      }],
      damageDealt: [{
        handler: "applyTetherMarkOnBasicAttack",
        markStatusId: "tetherMarks",
        snaredStatusId: "tetherSnared",
        maxStacks: 2,
        duration: 2,
        stat: "SPD",
        snareAmount: -15,
        snareDuration: 2,
      }],
    },
  },
  skills: [
    {
      key: "ruinReversal", name: "Ruin Reversal", cost: 18, cooldown: 1,
      tags: ["Kinetic", "control"], targeting: "enemy",
      effects: [{
        type: "masteryHit", element: "Kinetic", power: 1.0, scalingStat: "ATK",
        powerModifiers: [{ when: { targetStatus: "tetherSnared" }, addPower: 0.35, bonusText: " (Snared target bonus)" }],
      }],
      message: "Tekushiki strikes {target} with the Tether of Ruin for {damage} Kinetic damage{bonusText}.",
    },
    {
      key: "nullKnot", name: "Null Knot", cost: 25, cooldown: 3,
      tags: ["Kinetic", "area", "control"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Kinetic", power: 0.7, scalingStat: "ATK" },
        { type: "statusEnemies", id: "nullKnotSlow", stat: "SPD", amount: -10, turns: 2, debuff: true, onlyHitTargets: true },
      ],
      message: "Tekushiki casts Null Knot, dealing Kinetic damage to all hit enemies and reducing their SPD by 10% for 2 turns. Each enemy hit receives a Tether Mark.",
    },
    {
      key: "lastThread", name: "Last Thread", cost: 40, cooldown: 4,
      tags: ["Kinetic", "control"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 1.5, scalingStat: "ATK" },
        {
          type: "consumeTetherMarks", markStatus: "tetherMarks", minimumStacks: 2,
          removeStatuses: ["tetherSnared"],
          apply: { id: "bound", skipAction: true, turns: 1, debuff: true, control: "bind" },
        },
      ],
      message: "Tekushiki lashes {target} with Last Thread for {damage} Kinetic damage. If 2 Tether Marks were present, both are consumed to Bind the target for 1 turn.",
    },
    {
      key: "ultimate", name: "Ruin's Embrace", category: "Ultimate", cost: 60, cooldown: 6,
      tags: ["Kinetic", "area", "control"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Kinetic", power: 1.2, scalingStat: "ATK" },
        { type: "statusEnemies", id: "ruinsEmbraceSlow", stat: "SPD", amount: -20, turns: 2, debuff: true, onlyHitTargets: true },
        { type: "statusEnemies", id: "bound", skipAction: true, control: "bind", turns: 1, debuff: true, requiresStatus: "tetherSnared", onlyHitTargets: true },
      ],
      message: "RUIN'S EMBRACE! Tekushiki lashes all enemies for Kinetic damage and reduces their SPD by 20% for 2 turns. Enemies already Snared are also Bound for 1 turn. Each enemy hit receives a Tether Mark.",
    },
  ],
};
