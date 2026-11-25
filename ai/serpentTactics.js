const { getStatusCleansePriority, getCleanseSeverity, getHighestPriorityCleanseEntry } = require("../systems/statusEffects");

// Serpent Syndicate tactical controller.
// Prioritizes Poison setup, sustained debuffs, frontline protection, and Tether control.
// The controller uses relative turn-view fields and works from either battle side.

function ratio(unit) {
  return unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
}

function hasStatus(unit, id) {
  return Boolean(unit?.statuses && Object.hasOwn(unit.statuses, id));
}

function poisonStatus(unit) {
  return Object.values(unit?.statuses || {}).some((status) =>
    status?.damageType === "Toxic" && status?.turnStart && Number(status?.dotDamage) > 0,
  );
}

function tetherStacks(unit) {
  return Number(unit?.statuses?.tetherMarks?.stacks) || 0;
}

// Verra should cleanse based on tactical danger, not HP alone.
function cleanseValue(status) {
  return getStatusCleansePriority(status);
}


function cleanseCandidateScore(unit) {
  const statuses = Object.entries(unit?.statuses || {});
  const eligible = statuses.filter(([, status]) => cleanseValue(status) > 0);
  if (!eligible.length) return Number.NEGATIVE_INFINITY;

  // Score the status Verra's cleanse handler will actually remove first.
  const primaryEntry = getHighestPriorityCleanseEntry(unit.statuses || {});
  if (!primaryEntry) return Number.NEGATIVE_INFINITY;
  const primaryStatus = primaryEntry[1];
  const primaryPriority = cleanseValue(primaryStatus);
  const tierBase = primaryPriority >= 100 ? 1000
    : primaryPriority >= 75 ? 800
      : primaryPriority >= 55 ? 600
        : primaryPriority >= 50 ? 400 : 200;
  const primarySeverity = Math.min(25, Math.log1p(getCleanseSeverity(primaryStatus)) * 4);

  // Account for all ticking DoTs on this ally, rather than only the first one.
  const remainingDotDamage = eligible.reduce((total, [, status]) => {
    if (!(status.dotDamage > 0) || typeof status.damageType !== "string" || !status.turnStart) return total;
    const remainingTurns = Number.isFinite(status.turns) && status.turns > 0 ? status.turns : 1;
    return total + status.dotDamage * remainingTurns;
  }, 0);
  const dotRisk = Math.min(30, (remainingDotDamage / Math.max(1, unit.hp || 0)) * 100);
  const healingValue = Math.min(10, Math.max(0, 1 - ratio(unit)) * 10);

  return tierBase + primarySeverity + dotRisk + healingValue;
}

function cleanseCandidate(units, targets, minValue = 30, actorId = null) {
  const allowed = new Set(targets || []);
  const candidates = (units || []).filter((unit) => allowed.has(unit.id) &&
    Object.values(unit.statuses || {}).some((status) => cleanseValue(status) >= minValue));
  return [...candidates].sort((a, b) =>
    cleanseCandidateScore(b) - cleanseCandidateScore(a) ||
    Number(a.id === actorId) - Number(b.id === actorId) ||
    ratio(a) - ratio(b) || a.id.localeCompare(b.id),
  )[0] || null;
}

function selectTarget(units, score = () => 0) {
  return [...(units || [])].sort((a, b) =>
    score(b) - score(a) || ratio(a) - ratio(b) || a.id.localeCompare(b.id),
  )[0] || null;
}

function priorityTarget(view) {
  const opponents = (view.opponents || []).filter((unit) => !unit.untargetable && unit.hp > 0);
  return selectTarget(opponents, (unit) => {
    const role = unit.role || "";
    const support = /medic|field-medic|support/i.test(role) ? 28 : /tactician/i.test(role) ? 16 : 0;
    const fragile = ratio(unit) <= 0.25 ? 18 : ratio(unit) <= 0.4 ? 9 : 0;
    const poisoned = poisonStatus(unit) ? 5 : 0;
    return support + fragile + poisoned + (1 - ratio(unit)) * 8;
  });
}

function cleanseValueOnUnit(unit) {
  return Math.max(0, ...Object.values(unit?.statuses || {}).map(cleanseValue));
}

function getAction(view, key) {
  const type = view.kind === "enemy" ? "enemySkill" : "skill";
  return view.actions.find((item) => item.type === type && item.key === key && item.usable) || null;
}

function skillDecision(action, targetId, mode) {
  if (!action) return null;
  return {
    type: action.type,
    skillKey: action.key,
    ...(mode ? { mode } : {}),
    ...(targetId ? { targetId } : {}),
  };
}

function modeFor(action, modeId) {
  return action?.modes?.find((mode) => mode.id === modeId) || null;
}

function basicDecision(view, preferred) {
  const basic = view.actions.find((item) => item.type === "basic" && item.targets?.length);
  if (!basic) return { type: "pass" };
  const target = preferred && basic.targets.includes(preferred.id)
    ? preferred
    : selectTarget((view.opponents || []).filter((unit) => basic.targets.includes(unit.id)));
  return target ? { type: "basic", targetId: target.id } : { type: "pass" };
}

function reserveSwitch(view, switchPolicy = {}) {
  const action = view.actions.find((item) => item.type === "switch");
  if (!action?.active?.length || !action?.reserves?.length) return null;
  const byId = new Map((view.friendlies || []).map((unit) => [unit.id, unit]));
  const active = action.active.filter((unit) => unit.alive);
  const reserves = action.reserves.filter((unit) => unit.alive);
  const activeHasMedic = active.some((unit) => unit.id === "verra");
  const reserveMedic = reserves.find((unit) => unit.id === "verra" && ratio(unit) >= 0.6);

  if (!activeHasMedic && reserveMedic) {
    const outgoing = active
      .filter((unit) => unit.id !== "verra")
      .map((member) => ({ member, detail: byId.get(member.id) }))
      .filter(({ detail }) => detail && ratio(detail) <= 0.5)
      .sort((a, b) => ratio(a.detail) - ratio(b.detail))[0];
    if (outgoing) return { type: "switch", reserveId: reserveMedic.id, activeId: outgoing.member.id };
  }

  const thresholds = {
    standard: switchPolicy.standardThreshold ?? 0.20,
    verra: switchPolicy.verraThreshold ?? 0.16,
    poison: switchPolicy.poisonThreshold ?? 0.32,
  };
  const outgoing = active
    .map((member) => ({ member, detail: byId.get(member.id) }))
    .filter(({ member, detail }) => detail && (ratio(detail) <= (member.id === "verra" ? thresholds.verra : thresholds.standard) || (poisonStatus(detail) && ratio(detail) <= thresholds.poison)))
    .sort((a, b) => ratio(a.detail) - ratio(b.detail))[0];
  if (!outgoing) return null;

  const incoming = reserves
    .filter((member) => ratio(member) >= Math.max(0.65, ratio(outgoing.detail) + 0.25))
    .sort((a, b) => (b.id === "verra" ? 0.08 : 0) + ratio(b) - ((a.id === "verra" ? 0.08 : 0) + ratio(a)))[0];
  if (!incoming) return null;
  return { type: "switch", reserveId: incoming.id, activeId: outgoing.member.id };
}

function chooseAction(rawView, switchPolicy = {}) {
  const swap = reserveSwitch(rawView, switchPolicy);
  if (swap) return swap;

  const view = rawView;
  const actorId = view.actor.skillSet || view.actor.id;
  const friendlies = (view.friendlies || []).filter((unit) => !unit.summon);
  const opponents = (view.opponents || []).filter((unit) => !unit.untargetable && unit.hp > 0);
  const priority = priorityTarget(view);
  const lowest = selectTarget(friendlies.filter((unit) => ratio(unit) < 0.82), (unit) => (1 - ratio(unit)) * 100 + (poisonStatus(unit) ? 12 : 0));
  const poisoned = selectTarget(opponents.filter(poisonStatus), (unit) => (1 - ratio(unit)) * 10 + (ratio(unit) <= 0.35 ? 15 : 0));

  if (actorId === "verra") {
    const remedy = getAction(view, "unstableRemedy");
    const remedyMode = modeFor(remedy, "remedy");
    const remedyTargets = remedyMode?.targets || [];
    const urgentCleanse = cleanseCandidate(friendlies, remedyTargets, 75, view.actor.id);
    const criticalAlly = selectTarget(remedyTargets.map((id) => friendlies.find((unit) => unit.id === id)).filter(Boolean),
      (unit) => (1 - ratio(unit)) * 100 + (poisonStatus(unit) ? 10 : 0));
    if (remedy && urgentCleanse) return skillDecision(remedy, urgentCleanse.id, "remedy");
    if (remedy && criticalAlly && ratio(criticalAlly) <= 0.58) {
      return skillDecision(remedy, criticalAlly.id, "remedy");
    }

    const injection = getAction(view, "causticInjection");
    const injectionMode = modeFor(injection, "treat");
    const injectionTargets = injectionMode?.targets || [];
    const cleanseUseful = cleanseCandidate(friendlies, injectionTargets, 30, view.actor.id);
    const injuredAlly = selectTarget(injectionTargets.map((id) => friendlies.find((unit) => unit.id === id)).filter(Boolean),
      (unit) => (1 - ratio(unit)) * 100 + (poisonStatus(unit) ? 8 : 0));
    if (injection && cleanseUseful && (ratio(cleanseUseful) <= 0.9 || cleanseValueOnUnit(cleanseUseful) >= 50)) {
      return skillDecision(injection, cleanseUseful.id, "treat");
    }
    if (injection && injuredAlly && ratio(injuredAlly) <= 0.72) {
      return skillDecision(injection, injuredAlly.id, "treat");
    }

    const ultimate = getAction(view, "ultimate");
    const missingHp = friendlies.reduce((sum, unit) => sum + Math.max(0, unit.maxHp - unit.hp), 0);
    if (ultimate && opponents.length >= 2 && (missingHp >= 450 || friendlies.some(poisonStatus))) {
      return skillDecision(ultimate);
    }

    const catastrophe = getAction(view, "chemicalCatastrophe");
    if (catastrophe && opponents.length >= 2) return skillDecision(catastrophe);

    if (remedy && priority) return skillDecision(remedy, priority.id, "corrosive");
    if (injection && priority) return skillDecision(injection, priority.id, "attack");
  }

  if (actorId === "kane") {
    const ultimate = getAction(view, "ultimate");
    if (ultimate && poisoned && (ratio(poisoned) <= 0.72 || opponents.length === 1)) {
      return skillDecision(ultimate, poisoned.id);
    }
    const orbit = getAction(view, "phantomOrbit");
    if (orbit && poisoned) return skillDecision(orbit, poisoned.id);
    const pursuit = getAction(view, "venomousPursuit");
    if (pursuit && priority && (!hasStatus(view.actor, "venomousPursuitSpeed") || !poisonStatus(priority))) {
      return skillDecision(pursuit, priority.id);
    }
    const fang = getAction(view, "twinFang");
    if (fang && priority) return skillDecision(fang, priority.id);
  }

  if (actorId === "galloz") {
    const guard = getAction(view, "tyrantsGuard");
    const guarded = friendlies.some((unit) => hasStatus(unit, "tyrantsGuardDamageReduction"));
    if (guard && friendlies.length >= 2 && !guarded && (friendlies.some((unit) => ratio(unit) <= 0.78) || opponents.length >= 3)) {
      return skillDecision(guard);
    }
    const ultimate = getAction(view, "ultimate");
    if (ultimate && opponents.length >= 2 && !hasStatus(view.actor, "catalystOverlordDamageReduction")) {
      return skillDecision(ultimate);
    }
    const quake = getAction(view, "reactorQuake");
    if (quake && opponents.length >= 2) return skillDecision(quake);
    const impact = getAction(view, "ironcladImpact");
    if (impact && priority) return skillDecision(impact, priority.id);
  }

  if (actorId === "claude") {
    const rally = getAction(view, "rallyingCatalyst");
    const rallyTarget = selectTarget((rally?.targets || []).map((id) => friendlies.find((unit) => unit.id === id)).filter(Boolean)
      .filter((unit) => !hasStatus(unit, "rallyingCatalystAtk")),
      (unit) => (unit.role === "stalker" ? 12 : unit.role === "juggernaut" ? 8 : 0) + (1 - ratio(unit)) * 3);
    if (rally && rallyTarget) return skillDecision(rally, rallyTarget.id);

    const ultimate = getAction(view, "ultimate");
    if (ultimate && opponents.length >= 2 && !friendlies.some((unit) => hasStatus(unit, "masterpieceAtk"))) {
      return skillDecision(ultimate);
    }
    const sabotage = getAction(view, "sabotageCocktail");
    if (sabotage && opponents.length >= 2) return skillDecision(sabotage);
    const rupture = getAction(view, "ruptureFlask");
    if (rupture && priority) return skillDecision(rupture, priority.id);
  }

  if (actorId === "tekushiki") {
    const lastThread = getAction(view, "lastThread");
    const fullyMarked = selectTarget(opponents.filter((unit) => tetherStacks(unit) >= 2),
      (unit) => (1 - ratio(unit)) * 10 + (unit.role === "field-medic" || unit.role === "tactician" ? 8 : 0));
    if (lastThread && fullyMarked) return skillDecision(lastThread, fullyMarked.id);

    const ultimate = getAction(view, "ultimate");
    if (ultimate && opponents.length >= 2 && opponents.some((unit) => hasStatus(unit, "tetherSnared"))) {
      return skillDecision(ultimate);
    }
    const knot = getAction(view, "nullKnot");
    if (knot && opponents.length >= 2 && opponents.some((unit) => tetherStacks(unit) < 2)) {
      return skillDecision(knot);
    }
    const reversal = getAction(view, "ruinReversal");
    if (reversal && priority) return skillDecision(reversal, priority.id);
  }

  return basicDecision(view, priority);
}

function createSerpentTacticsController(switchPolicy = {}) {
  return { chooseAction: (view) => chooseAction(view, switchPolicy) };
}

module.exports = { createSerpentTacticsController, chooseSerpentAction: chooseAction };
