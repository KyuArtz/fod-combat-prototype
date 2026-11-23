module.exports = {
  id: "rogueAutomaton",
  rules: [
    { when: [{ type: "hpRatioAtMost", value: 0.55 }, { type: "skillReady", key: "overload" }, { type: "chance", value: 0.55 }], action: { type: "skill", key: "overload" } },
    { when: [{ type: "hpRatioAtMost", value: 0.5 }, { type: "skillReady", key: "crusherProtocol" }], action: { type: "skill", key: "crusherProtocol", target: "current" } },
    { when: [{ type: "targetMissingStatus", key: "automatonDefDown" }, { type: "skillReady", key: "scan" }], action: { type: "skill", key: "scan", target: "current" } },
    { when: [{ type: "skillReady", key: "heavyStrike" }, { type: "chance", value: 0.55 }], action: { type: "skill", key: "heavyStrike", target: "current" } },
  ],
  fallback: { type: "basic", target: "current" },
};
