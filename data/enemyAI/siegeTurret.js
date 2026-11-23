module.exports = {
  id: "siegeTurret",
  rules: [
    { when: [{ type: "hpRatioAtMost", value: 0.6 }, { type: "skillReady", key: "fortify" }], action: { type: "skill", key: "fortify" } },
    { when: [{ type: "skillReady", key: "siegeSalvo" }, { type: "chance", value: 0.3 }], action: { type: "skill", key: "siegeSalvo", target: "current" } },
    { when: [{ type: "targetMissingStatus", key: "turretSuppression" }, { type: "skillReady", key: "suppressionRound" }, { type: "chance", value: 0.65 }], action: { type: "skill", key: "suppressionRound", target: "current" } },
    { when: [{ type: "skillReady", key: "ballisticShell" }, { type: "chance", value: 0.7 }], action: { type: "skill", key: "ballisticShell", target: "current" } },
  ],
  fallback: { type: "basic", target: "current" },
};
