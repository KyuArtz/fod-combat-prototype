// Decisions are what a controller returns: plain data describing the chosen action.
//
//   { type: "basic",      targetId }
//   { type: "skill",      skillKey, targetId?, mode? }       (player skills)
//   { type: "enemySkill", skillKey, targetId? }              (enemy skills)
//   { type: "switch",     reserveId, activeId }              (party formation)
//   { type: "summonAuto" }                                   (summon behaviour)
//   { type: "pass" }                                         (nothing to do)
//
// validateDecision() checks a decision against the view it was chosen from, so a
// buggy or hostile controller can never make the engine run an illegal action.

function ok() {
  return { ok: true };
}

function fail(reason) {
  return { ok: false, reason };
}

function checkTarget(action, decision, targets) {
  if (typeof decision.targetId !== "string") return fail("missing-target");
  return targets.includes(decision.targetId) ? null : fail("invalid-target");
}

function validateDecision(view, decision) {
  if (!decision || typeof decision !== "object" || typeof decision.type !== "string") {
    return fail("malformed-decision");
  }

  switch (decision.type) {
    case "basic": {
      const action = view.actions.find((candidate) => candidate.type === "basic");
      if (!action) return fail("action-not-available");
      return checkTarget(action, decision, action.targets) || ok();
    }

    case "skill":
    case "enemySkill": {
      const action = view.actions.find(
        (candidate) => candidate.type === decision.type && candidate.key === decision.skillKey,
      );
      if (!action) return fail("unknown-skill");
      if (!action.usable) return fail("skill-unavailable");
      if (action.targeting === "mode") {
        const mode = (action.modes || []).find((candidate) => candidate.id === decision.mode);
        if (!mode) return fail("invalid-mode");
        if (mode.targeting === "none") return ok();
        return checkTarget(action, decision, mode.targets) || ok();
      }
      if (action.targeting === "none") return ok();
      return checkTarget(action, decision, action.targets) || ok();
    }

    case "switch": {
      const action = view.actions.find((candidate) => candidate.type === "switch");
      if (!action) return fail("action-not-available");
      const reserve = action.reserves.find((member) => member.id === decision.reserveId);
      if (!reserve || !reserve.alive) return fail("invalid-reserve");
      if (!action.active.some((member) => member.id === decision.activeId)) {
        return fail("invalid-slot");
      }
      return ok();
    }

    case "summonAuto":
    case "pass":
      return view.actions.some((candidate) => candidate.type === decision.type)
        ? ok()
        : fail("action-not-available");

    default:
      return fail("unknown-decision-type");
  }
}

module.exports = { validateDecision };
