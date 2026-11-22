// Phantom tactical controller.
// Favors stealth-oriented setup, priority isolation, evade-triggered pressure,
// and finishing windows. It works on either faction side via relative turn views.

function hpRatio(unit) {
  return unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
}

function hasStatus(unit, key) {
  return Boolean(unit?.statuses && Object.hasOwn(unit.statuses, key));
}

function totalShield(unit) {
  return (unit?.shields || []).reduce((sum, shield) => sum + (Number(shield.value) || 0), 0);
}

function hasBleed(unit) {
  return Object.values(unit?.statuses || {}).some((status) =>
    status?.damageType === "Anomaly" && Number(status?.dotDamage) > 0 && status?.turnStart,
  );
}

function selectTarget(units, score = () => 0) {
  return [...(units || [])].sort((a, b) =>
    score(b) - score(a) || hpRatio(a) - hpRatio(b) || a.id.localeCompare(b.id),
  )[0] || null;
}

function priorityTarget(view) {
  const opponents = (view.opponents || []).filter((unit) => !unit.untargetable && unit.hp > 0);
  return selectTarget(opponents, (unit) => {
    const hp = hpRatio(unit);
    const role = unit.role || "";
    const support = /medic|support|tactician/i.test(role) ? 18 : 0;
    const finisher = hp <= 0.25 ? 30 : hp <= 0.4 ? 14 : 0;
    const marked = hasStatus(unit, "phantomMark") ? 7 : 0;
    return support + finisher + marked + (1 - hp) * 8;
  });
}

function getAction(view, key) {
  const type = view.kind === "enemy" ? "enemySkill" : "skill";
  return view.actions.find((item) => item.type === type && item.key === key && item.usable) || null;
}

function skillDecision(view, action, targetId) {
  if (!action) return null;
  return {
    type: action.type,
    skillKey: action.key,
    ...(targetId ? { targetId } : {}),
  };
}

function basicDecision(view, preferredTarget) {
  const basic = view.actions.find((item) => item.type === "basic" && item.targets?.length);
  if (!basic) return { type: "pass" };
  const target = preferredTarget && basic.targets.includes(preferredTarget.id)
    ? preferredTarget
    : selectTarget((view.opponents || []).filter((unit) => basic.targets.includes(unit.id)));
  return target ? { type: "basic", targetId: target.id } : { type: "pass" };
}

function chooseReserveSwitch(view) {
  const action = view.actions.find((item) => item.type === "switch");
  if (!action || !action.active?.length || !action.reserves?.length) return null;
  const byId = new Map((view.friendlies || []).map((unit) => [unit.id, unit]));
  const endangered = action.active
    .map((member) => ({ member, detail: byId.get(member.id) }))
    .filter(({ detail }) => detail && (hpRatio(detail) <= 0.2 || (hasBleed(detail) && hpRatio(detail) <= 0.34)))
    .sort((a, b) => hpRatio(a.detail) - hpRatio(b.detail))[0];
  if (!endangered) return null;
  const replacement = action.reserves
    .filter((member) => member.alive && hpRatio(member) >= 0.68)
    .sort((a, b) => hpRatio(b) - hpRatio(a))[0];
  if (!replacement) return null;
  return { type: "switch", reserveId: replacement.id, activeId: endangered.member.id };
}

function chooseAction(view) {
  const swap = chooseReserveSwitch(view);
  if (swap) return swap;

  const actorId = view.actor.skillSet || view.actor.id;
  const friendlies = (view.friendlies || []).filter((unit) => !unit.summon);
  const opponents = (view.opponents || []).filter((unit) => !unit.untargetable && unit.hp > 0);
  const priority = priorityTarget(view);

  if (actorId === "mirazhel") {
    const veil = getAction(view, "veil");
    const veilTargets = (veil?.targets || []).map((id) => friendlies.find((unit) => unit.id === id)).filter(Boolean);
    const veilTarget = selectTarget(veilTargets.filter((unit) =>
      !hasStatus(unit, "veilUnseenSpeed") || !hasStatus(unit, "veilUnseenCrit"),
    ), (unit) => (unit.role === "stalker" ? 12 : 0) + (1 - hpRatio(unit)) * 4);
    if (veilTarget) return skillDecision(view, veil, veilTarget.id);

    const ultimate = getAction(view, "ultimate");
    if (ultimate && opponents.length >= 2 && !friendlies.some((unit) => hasStatus(unit, "nocturneAttackBuff"))) {
      return skillDecision(view, ultimate);
    }
    const requiem = getAction(view, "requiem");
    const marked = selectTarget(opponents.filter((unit) => hasStatus(unit, "phantomMark")), (unit) =>
      (1 - hpRatio(unit)) * 10 + (hpRatio(unit) <= 0.55 ? 8 : 0),
    );
    if (requiem && marked) return skillDecision(view, requiem, marked.id);
    const pursuit = getAction(view, "wraithfang");
    if (pursuit && priority) return skillDecision(view, pursuit, priority.id);
  }

  if (actorId === "elishia_p") {
    const aegis = getAction(view, "aegis");
    const aegisTargets = (aegis?.targets || []).map((id) => friendlies.find((unit) => unit.id === id)).filter(Boolean);
    const shieldTarget = selectTarget(aegisTargets.filter((unit) =>
      hpRatio(unit) <= 0.82 && totalShield(unit) < unit.maxHp * 0.15,
    ), (unit) => (1 - hpRatio(unit)) * 20 + (unit.id === actorId ? 3 : 0));
    if (aegis && shieldTarget) return skillDecision(view, aegis, shieldTarget.id);

    const ultimate = getAction(view, "ultimate");
    if (ultimate && opponents.length >= 2 && !hasStatus(view.actor, "scarletEclipseDamage")) {
      return skillDecision(view, ultimate);
    }
    const phalanx = getAction(view, "phalanx");
    const bleedTarget = selectTarget(opponents.filter((unit) => !hasBleed(unit)), (unit) =>
      (1 - hpRatio(unit)) * 7 + (unit.role === "field-medic" || unit.role === "tactician" ? 5 : 0),
    );
    if (phalanx && bleedTarget) return skillDecision(view, phalanx, bleedTarget.id);
    const severance = getAction(view, "severance");
    if (severance && priority) return skillDecision(view, severance, priority.id);
  }

  if (actorId === "lucaz") {
    const bastion = getAction(view, "bastion");
    if (bastion && hpRatio(view.actor) <= 0.82 && !hasStatus(view.actor, "taunt")) {
      return skillDecision(view, bastion);
    }
    const ultimate = getAction(view, "ultimate");
    if (ultimate && opponents.length >= 2 && !friendlies.some((unit) => hasStatus(unit, "ironTitanDamageGuard"))) {
      return skillDecision(view, ultimate);
    }
    const faultline = getAction(view, "faultline");
    const unstaggered = opponents.filter((unit) => !hasStatus(unit, "staggered"));
    if (faultline && unstaggered.length >= 2) return skillDecision(view, faultline);
    const ironwake = getAction(view, "ironwake");
    const staggered = selectTarget(opponents.filter((unit) => hasStatus(unit, "staggered")));
    if (ironwake && staggered) return skillDecision(view, ironwake, staggered.id);
    if (ironwake && priority) return skillDecision(view, ironwake, priority.id);
  }

  if (actorId === "clarke") {
    const reversal = getAction(view, "aegisReversal");
    if (reversal && !hasStatus(view.actor, "aegisReversal")) return skillDecision(view, reversal);

    const ultimate = getAction(view, "ultimate");
    const executeTarget = selectTarget(opponents.filter((unit) => hpRatio(unit) < 0.4));
    if (ultimate && executeTarget) return skillDecision(view, ultimate, executeTarget.id);

    const thousandfold = getAction(view, "thousandfold");
    if (thousandfold && hasStatus(view.actor, "phaseAdvantage") && priority) {
      return skillDecision(view, thousandfold, priority.id);
    }
    const riftpiercer = getAction(view, "riftpiercer");
    if (riftpiercer && priority) return skillDecision(view, riftpiercer, priority.id);
    if (thousandfold && priority) return skillDecision(view, thousandfold, priority.id);
    if (ultimate && priority) return skillDecision(view, ultimate, priority.id);
  }

  if (actorId === "liezli") {
    const refraction = getAction(view, "refraction");
    if (refraction && !hasStatus(view.actor, "phantomRefractionEvasion") && !hasStatus(view.actor, "phantomRefractionDamage")) {
      return skillDecision(view, refraction);
    }
    const ultimate = getAction(view, "ultimate");
    const executeTarget = selectTarget(opponents.filter((unit) => hpRatio(unit) < 0.3));
    if (ultimate && executeTarget) return skillDecision(view, ultimate, executeTarget.id);

    const silverpoint = getAction(view, "silverpoint");
    const bleedCount = opponents.filter(hasBleed).length;
    if (silverpoint && opponents.length >= 2 && bleedCount < Math.ceil(opponents.length / 2)) {
      return skillDecision(view, silverpoint);
    }
    const ghostlight = getAction(view, "ghostlight");
    const unbled = selectTarget(opponents.filter((unit) => !hasBleed(unit)));
    if (ghostlight && unbled) return skillDecision(view, ghostlight, unbled.id);
    if (ultimate && priority) return skillDecision(view, ultimate, priority.id);
  }

  return basicDecision(view, priority);
}

function createPhantomTacticsController() {
  return { chooseAction };
}

module.exports = { createPhantomTacticsController, choosePhantomAction: chooseAction };
