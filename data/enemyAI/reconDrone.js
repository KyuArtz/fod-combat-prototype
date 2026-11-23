module.exports = {
  id: "reconDrone",
  rules: [
    { when: [{ type: "hpRatioAtMost", value: 0.5 }, { type: "skillReady", key: "spoofingManeuver" }], action: { type: "skill", key: "spoofingManeuver" } },
    { when: [{ type: "skillReady", key: "targetingCascade" }, { type: "chance", value: 0.3 }], action: { type: "skill", key: "targetingCascade", target: "current" } },
    { when: [{ type: "targetMissingStatus", key: "reconSpotterMark" }, { type: "skillReady", key: "spotterMark" }], action: { type: "skill", key: "spotterMark", target: "current" } },
    { when: [{ type: "skillReady", key: "precisionBurst" }, { type: "chance", value: 0.6 }], action: { type: "skill", key: "precisionBurst", target: "current" } },
  ],
  fallback: { type: "basic", target: "current" },
};
