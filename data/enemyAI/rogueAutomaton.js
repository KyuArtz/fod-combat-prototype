// Rule order and chance-check placement preserve the original Rogue Automaton AI.
module.exports = {
  id: "rogueAutomaton",
  rules: [
    {
      when: [{ type: "hpRatioAtMost", value: 0.5 }, { type: "skillReady", key: "overload" }],
      action: { type: "skill", key: "overload" },
    },
    {
      when: [
        { type: "targetMissingStatus", key: "defDown" },
        { type: "skillReady", key: "scan" },
        { type: "chance", value: 0.35 },
      ],
      action: { type: "skill", key: "scan", target: "current" },
    },
    {
      when: [{ type: "skillReady", key: "heavyStrike" }, { type: "chance", value: 0.4 }],
      action: { type: "skill", key: "heavyStrike", target: "current" },
    },
  ],
  fallback: { type: "basic", target: "current" },
};
