module.exports = {
  characterId: "siegeTurret",
  skills: [
    {
      key: "ballisticShell", name: "Ballistic Shell", cost: 22, cooldown: 2, tags: ["Artillery"], targeting: "ally",
      effects: [{ type: "physicalHit", power: 1.65 }],
      message: "{actor} launches a BALLISTIC SHELL at {target} for {damage} damage!",
    },
    {
      key: "suppressionRound", name: "Suppression Round", cost: 24, cooldown: 3, tags: ["Kinetic", "Control"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 0.9 },
        { type: "status", id: "turretSuppression", stat: "SPD", amount: -15, turns: 2, debuff: true },
      ],
      message: "{actor} fires a SUPPRESSION ROUND at {target}: {damage} Kinetic damage and SPD -15% (2 turns).",
    },
    {
      key: "fortify", name: "Fortify", cost: 24, cooldown: 4, tags: ["Defense"], targeting: "none",
      effects: [
        { type: "shieldSelf", percentMaxHP: 18, turns: 2 },
        { type: "statusSelf", id: "turretFortified", stat: "DEF", amount: 15, turns: 2 },
      ],
      message: "{actor} anchors into FORTIFY mode ({shield} shield and DEF +15% for 2 turns).",
    },
    {
      key: "siegeSalvo", name: "Siege Salvo", category: "Ultimate", cost: 55, cooldown: 6, tags: ["Artillery", "Ultimate"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 2.0 },
        { type: "status", id: "siegeBreach", stat: "DEF", amount: -15, turns: 2, debuff: true },
      ],
      message: "{actor} unleashes SIEGE SALVO on {target}: {damage} Kinetic damage and DEF -15% (2 turns).",
    },
  ],
};
