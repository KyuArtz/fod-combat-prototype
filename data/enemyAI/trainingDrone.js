// Rule order and chance-check placement preserve the original Training Drone AI.
module.exports = {
  id: "trainingDrone",
  rules: [
    {
      when: [{ type: "skillReady", key: "pulseShot" }, { type: "chance", value: 0.25 }],
      action: { type: "skill", key: "pulseShot", target: "current" },
    },
  ],
  fallback: { type: "basic", target: "current" },
};
