module.exports = {
  id: "blightheartOverseer",
  rules: [
    // The phase transition forces the next available bloom, making the awakening readable.
    { when: [{ type: "hpRatioAtMost", value: 0.55 }, { type: "skillReady", key: "cataclysmicBloom" }], action: { type: "skill", key: "cataclysmicBloom" } },
    { when: [{ type: "hpRatioAtMost", value: 0.42 }, { type: "skillReady", key: "heartbark" }], action: { type: "skill", key: "heartbark" } },
    { when: [{ type: "skillReady", key: "cataclysmicBloom" }, { type: "chance", value: 0.75 }], action: { type: "skill", key: "cataclysmicBloom" } },
    { when: [{ type: "skillReady", key: "miasmaWave" }, { type: "chance", value: 0.65 }], action: { type: "skill", key: "miasmaWave" } },
    { when: [{ type: "targetMissingStatus", key: "overseerSporeRot" }, { type: "skillReady", key: "sporeLance" }], action: { type: "skill", key: "sporeLance", target: "current" } },
  ],
  fallback: { type: "basic", target: "current" },
};
