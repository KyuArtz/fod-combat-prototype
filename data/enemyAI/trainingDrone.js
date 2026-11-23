module.exports = {
  id: "trainingDrone",
  rules: [
    { when: [{ type: "hpRatioAtMost", value: 0.5 }, { type: "skillReady", key: "evasiveThrusters" }], action: { type: "skill", key: "evasiveThrusters" } },
    { when: [{ type: "skillReady", key: "overclockedShot" }, { type: "chance", value: 0.25 }], action: { type: "skill", key: "overclockedShot", target: "current" } },
    { when: [{ type: "skillReady", key: "pulseShot" }, { type: "chance", value: 0.65 }], action: { type: "skill", key: "pulseShot", target: "current" } },
    { when: [{ type: "skillReady", key: "kineticBurst" }, { type: "chance", value: 0.45 }], action: { type: "skill", key: "kineticBurst", target: "current" } },
  ],
  fallback: { type: "basic", target: "current" },
};
