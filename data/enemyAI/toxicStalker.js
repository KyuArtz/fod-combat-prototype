module.exports = {
  id: "toxicStalker",
  rules: [
    { when: [{ type: "skillReady", key: "blightSurge" }, { type: "chance", value: 0.3 }], action: { type: "skill", key: "blightSurge", target: "current" } },
    { when: [{ type: "hpRatioAtMost", value: 0.6 }, { type: "skillReady", key: "predatorInstinct" }], action: { type: "skill", key: "predatorInstinct" } },
    { when: [{ type: "targetMissingStatus", key: "toxicVenom" }, { type: "skillReady", key: "venomStrike" }], action: { type: "skill", key: "venomStrike", target: "current" } },
    { when: [{ type: "skillReady", key: "causticSpit" }, { type: "chance", value: 0.55 }], action: { type: "skill", key: "causticSpit", target: "current" } },
  ],
  fallback: { type: "basic", target: "current" },
};
