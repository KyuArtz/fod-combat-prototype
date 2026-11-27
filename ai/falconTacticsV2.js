// Coordinated Falcon controller (Iteration 3).
// Uses legal turn-view actions only; keeps encounter tactics separate from skill execution.

const PRIORITY = Object.freeze({
  "toxic-stalker": 120,
  "recon-drone": 112,
  "siege-turret": 108,
  "blightheart-overseer": 104,
  "rogue-automaton": 94,
  "training-drone": 82,
});

function ratio(unit) {
  return unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
}

function hasStatus(unit, key) {
  return Boolean(unit?.statuses && Object.hasOwn(unit.statuses, key));
}

function hasToxicDot(unit) {
  return Object.values(unit?.statuses || {}).some((status) =>
    status?.damageType === "Toxic" && status?.turnStart && Number(status?.dotDamage) > 0,
  );
}

function toxicDotCount(units) {
  return (units || []).filter(hasToxicDot).length;
}

function totalShield(unit) {
  return (unit?.shields || []).reduce((sum, shield) => sum + (Number(shield.value) || 0), 0);
}

function priorityScore(enemy) {
  const base = PRIORITY[enemy.id.split("#")[0].replace(/-[a-z]+\d*$/, "")] ??
    Object.entries(PRIORITY).find(([key]) => enemy.id.startsWith(`${key}-`))?.[1] ?? 70;
  const hp = ratio(enemy);
  const focusBonus = hasStatus(enemy, "tacticalMark") ? 10 : 0;
  const cipherBonus = hasStatus(enemy, "cipherTag") ? 7 : 0;
  const finishBonus = hp <= 0.2 ? 28 : hp <= 0.4 ? 12 : 0;
  const executeBossBonus = enemy.id.includes("blightheart-overseer") && hp < 0.4 ? 35 : 0;
  return base + (1 - hp) * 12 + focusBonus + cipherBonus + finishBonus + executeBossBonus;
}

function selectEnemy(view, ids, predicate = () => true) {
  const pool = (ids || [])
    .map((id) => view.enemies.find((unit) => unit.id === id))
    .filter((unit) => unit && predicate(unit));
  pool.sort((a, b) => priorityScore(b) - priorityScore(a) || ratio(a) - ratio(b) || a.id.localeCompare(b.id));
  return pool[0] || null;
}

// Do not waste single-target setup on the boss while dangerous adds remain.
// The boss becomes the focus target immediately when it enters execution range.
function selectFocusEnemy(view, ids) {
  const pool = (ids || []).map((id) => view.enemies.find((unit) => unit.id === id)).filter(Boolean);
  const boss = pool.find((unit) => unit.id.includes("blightheart-overseer"));
  if (boss && ratio(boss) < 0.4) return boss;
  const adds = pool.filter((unit) => !unit.id.includes("blightheart-overseer"));
  return selectEnemy(view, adds.length ? adds.map((unit) => unit.id) : pool.map((unit) => unit.id));
}

function selectLowestAlly(view, ids, predicate = () => true) {
  const pool = (ids || [])
    .map((id) => view.allies.find((unit) => unit.id === id))
    .filter((unit) => unit && !unit.summon && predicate(unit));
  pool.sort((a, b) => ratio(a) - ratio(b) || a.id.localeCompare(b.id));
  return pool[0] || null;
}

function action(view, key) {
  const type = view.kind === "enemy" ? "enemySkill" : "skill";
  return view.actions.find((item) => item.type === type && item.key === key && item.usable) || null;
}

function decisionForSkill(item, targetId, mode) {
  if (!item) return null;
  const legalTargets = mode ? item.modes?.find((candidate) => candidate.id === mode)?.targets : item.targets;
  const legalTargetId = targetId && legalTargets?.includes(targetId) ? targetId : targetId ? legalTargets?.[0] : undefined;
  return { type: item.type, skillKey: item.key, ...(mode ? { mode } : {}), ...(legalTargetId ? { targetId: legalTargetId } : {}) };
}

function modeFor(item, modeId) {
  return item?.modes?.find((mode) => mode.id === modeId) || null;
}

function chooseBasic(view, target) {
  const basic = view.actions.find((item) => item.type === "basic" && item.targets.length);
  const chosen = target && basic?.targets.includes(target.id) ? target : selectEnemy(view, basic?.targets);
  return chosen ? { type: "basic", targetId: chosen.id } : { type: "pass" };
}

function reserveSwitchDecision(view) {
  const switchAction = view.actions.find((item) => item.type === "switch");
  if (!switchAction) return null;

  const active = switchAction.active.filter((member) => member.alive);
  const reserves = switchAction.reserves.filter((member) => member.alive);
  if (!active.length || !reserves.length) return null;

  const activeHasMedic = active.some((member) => member.id === "evalete");
  const reserveMedic = reserves.find((member) => member.id === "evalete" && ratio(member) >= 0.65);
  const viewById = new Map(view.allies.map((unit) => [unit.id, unit]));

  // If the field medic is benched, bring her back as soon as a slot can be freed
  // without ejecting a healthier active member.
  if (!activeHasMedic && reserveMedic) {
    const outgoing = active
      .filter((member) => member.id !== "evalete")
      .map((member) => ({ member, detail: viewById.get(member.id) }))
      .filter(({ detail }) => detail && ratio(detail) <= 0.62)
      .sort((a, b) => ratio(a.detail) - ratio(b.detail))[0];
    if (outgoing) return { type: "switch", reserveId: reserveMedic.id, activeId: outgoing.member.id };
  }

  // Proactively rotate an endangered active operative to reserve when a healthy
  // replacement is available. Toxic DoT makes the threshold more conservative.
  const outgoing = active
    .map((member) => ({ member, detail: viewById.get(member.id) }))
    .filter(({ member, detail }) => {
      if (!detail) return false;
      const hp = ratio(detail);
      if (member.id === "evalete") return hp <= 0.28;
      return hp <= 0.25 || (hasToxicDot(detail) && hp <= 0.45);
    })
    .sort((a, b) => ratio(a.detail) - ratio(b.detail))[0];
  if (!outgoing) return null;

  const candidates = reserves
    .filter((member) => ratio(member) >= Math.max(0.68, ratio(outgoing.detail) + 0.30))
    .sort((a, b) => {
      const medicNeedA = !activeHasMedic && a.id === "evalete" ? 100 : 0;
      const medicNeedB = !activeHasMedic && b.id === "evalete" ? 100 : 0;
      const supportA = !active.some((unit) => unit.id === "elishia") && a.id === "elishia" ? 8 : 0;
      const supportB = !active.some((unit) => unit.id === "elishia") && b.id === "elishia" ? 8 : 0;
      return (medicNeedB + supportB + ratio(b)) - (medicNeedA + supportA + ratio(a));
    });
  const incoming = candidates[0];
  if (!incoming) return null;
  return { type: "switch", reserveId: incoming.id, activeId: outgoing.member.id };
}

function createCoordinatedFalconController() {
  return {
    chooseAction(rawView) {
      // The same controller can command Falcon from either battle side. Keep the
      // older all-versus-allies aliases for existing player-side rules, but expose
      // the acting faction as `allies` and its opponents as `enemies` here.
      const view = rawView.kind === "enemy"
        ? { ...rawView, allies: rawView.friendlies, enemies: rawView.opponents }
        : rawView;
      const swap = reserveSwitchDecision(view);
      if (swap) return swap;

      const actorId = view.actor.skillSet || view.actor.id;
      const allies = view.allies.filter((unit) => !unit.summon);
      const enemies = view.enemies;
      const injured = allies.filter((unit) => ratio(unit) <= 0.78);
      const criticalAlly = selectLowestAlly(view, allies.map((unit) => unit.id), (unit) => ratio(unit) <= 0.36);
      const priority = selectEnemy(view, enemies.map((unit) => unit.id));
      const focus = selectFocusEnemy(view, enemies.map((unit) => unit.id));
      const toxicAffected = allies.filter(hasToxicDot);
      const severeToxicPressure = toxicAffected.length >= 2 || toxicAffected.some((unit) => ratio(unit) <= 0.48);

      if (actorId === "elishia") {
        const meo = action(view, "meo");
        if (meo && !allies.some((unit) => unit.name === "Meo-9" || unit.name === "Meo-v9")) return decisionForSkill(meo);

        // Adaptive Barrier becomes the first response to Toxic DoT: its adaptive
        // resistance locks onto the damage type when the shield absorbs a Toxic hit.
        const barrier = action(view, "barrier");
        const poisonedTarget = selectLowestAlly(view, barrier?.targets, (unit) =>
          hasToxicDot(unit) && ratio(unit) <= 0.88 && totalShield(unit) < unit.maxHp * 0.18,
        );
        if (poisonedTarget) return decisionForSkill(barrier, poisonedTarget.id);

        const ultimate = action(view, "ultimate");
        if (ultimate && allies.length >= 3 && !hasStatus(view.actor, "singularitySpd") && (injured.length >= 2 || enemies.length >= 3)) {
          return decisionForSkill(ultimate);
        }

        const nano = action(view, "nano");
        const repairMode = modeFor(nano, "Repair");
        const repairTarget = selectLowestAlly(view, repairMode?.targets, (unit) => ratio(unit) <= 0.58);
        if (repairTarget) return decisionForSkill(nano, repairTarget.id, "Repair");

        const barrierTarget = selectLowestAlly(view, barrier?.targets, (unit) =>
          ratio(unit) <= 0.65 && totalShield(unit) < unit.maxHp * 0.12,
        );
        if (barrierTarget) return decisionForSkill(barrier, barrierTarget.id);

        const disruptMode = modeFor(nano, "Disrupt");
        const disruptTarget = selectEnemy(view, disruptMode?.targets, (unit) => !hasStatus(unit, "nanoSpdDown"));
        if (disruptTarget) return decisionForSkill(nano, disruptTarget.id, "Disrupt");

        const decoyMode = modeFor(nano, "Decoy");
        if (decoyMode && ratio(view.actor) <= 0.55 && !hasStatus(view.actor, "decoy")) return decisionForSkill(nano, undefined, "Decoy");
        return chooseBasic(view, priority);
      }

      if (actorId === "evalete") {
        const catalystType = view.kind === "enemy" ? "enemySkill" : "skill";
        const catalystOption = view.actions.find((item) => item.type === catalystType && item.key === "catalyst");
        const catalyst = catalystOption?.usable ? catalystOption : null;
        const hasCleanseablePressure = severeToxicPressure || (toxicAffected.length >= 1 && (criticalAlly || injured.length >= 3));
        if (hasCleanseablePressure) {
          if (catalyst) return decisionForSkill(catalyst);
          // Do not spend MP on low-impact actions while enough pressure is
          // present to justify a cleanse; wait for MP regeneration instead.
          if (catalystOption && view.actor.mp < catalystOption.cost) return chooseBasic(view, priority);
        }
        if (catalyst && injured.length >= 3 && criticalAlly) return decisionForSkill(catalyst);

        const guardian = action(view, "guardian");
        const injuredNoGuard = injured.filter((unit) => !hasStatus(unit, "guardianDef"));
        if (guardian && injuredNoGuard.length >= 2) return decisionForSkill(guardian);

        const triage = action(view, "triage");
        const triageTarget = selectLowestAlly(view, triage?.targets, (unit) =>
          ratio(unit) <= 0.68 && !hasStatus(unit, "triageHot"),
        );
        if (triageTarget) return decisionForSkill(triage, triageTarget.id);

        const pulse = action(view, "pulse");
        const pulseTarget = selectEnemy(view, pulse?.targets, (unit) => !hasStatus(unit, "sentinelDefDown"));
        if (pulseTarget) return decisionForSkill(pulse, pulseTarget.id);
        return chooseBasic(view, priority);
      }

      if (actorId === "zackry") {
        const ultimate = action(view, "ultimate");
        if (ultimate && enemies.length >= 3 && !allies.some((unit) => hasStatus(unit, "fullSpectrumMPow"))) return decisionForSkill(ultimate);

        const uplink = action(view, "uplink");
        const uplinkActive = allies.some((unit) => hasStatus(unit, "commandUplink") || hasStatus(unit, "fullSpectrumMPow"));
        if (uplink && !uplinkActive) return decisionForSkill(uplink);

        const mark = action(view, "mark");
        const markTarget = selectEnemy(view, mark?.targets, (unit) => !hasStatus(unit, "tacticalMark"));
        if (markTarget) return decisionForSkill(mark, markTarget.id);

        const emp = action(view, "emp");
        const empTarget = selectEnemy(view, emp?.targets, (unit) => !hasStatus(unit, "empSpdDown"));
        if (empTarget) return decisionForSkill(emp, empTarget.id);
        return chooseBasic(view, priority);
      }

      if (actorId === "jazen") {
        const plating = action(view, "reinforcedPlating");
        if (plating && (ratio(view.actor) <= 0.68 || totalShield(view.actor) < view.actor.maxHp * 0.08) && !hasStatus(view.actor, "reinforcedDef")) {
          return decisionForSkill(plating);
        }

        const ultimate = action(view, "cataclysmicPayload");
        if (ultimate && enemies.length >= 2) return decisionForSkill(ultimate);

        const grenade = action(view, "impactGrenade");
        if (grenade && enemies.length >= 3) return decisionForSkill(grenade);

        const breach = action(view, "breachCharge");
        const breachTarget = selectEnemy(view, breach?.targets, (unit) => !hasStatus(unit, "breachDefDown"));
        if (breachTarget) return decisionForSkill(breach, breachTarget.id);
        return chooseBasic(view, priority);
      }

      if (actorId === "zenki") {
        const cipher = action(view, "cipher");
        const cipherTarget = selectEnemy(view, cipher?.targets, (unit) => !hasStatus(unit, "cipherTag"));
        if (cipherTarget) return decisionForSkill(cipher, cipherTarget.id);

        const bestTarget = selectFocusEnemy(view, enemies.map((unit) => unit.id));
        const executeTarget = selectEnemy(view, enemies.map((unit) => unit.id), (unit) => ratio(unit) < 0.4);
        const ultimate = action(view, "ultimate");
        if (ultimate && (executeTarget || enemies.length <= 2)) {
          return decisionForSkill(ultimate, (executeTarget || bestTarget)?.id);
        }

        const ghost = action(view, "ghost");
        if (ghost && bestTarget && !hasStatus(view.actor, "ghostAttackBoost") && (ultimate || ratio(view.actor) <= 0.72)) {
          return decisionForSkill(ghost);
        }

        const railshot = action(view, "railshot");
        if (railshot && bestTarget) return decisionForSkill(railshot, bestTarget.id);
        if (ultimate && bestTarget) return decisionForSkill(ultimate, bestTarget.id);
        return chooseBasic(view, priority);
      }

      return chooseBasic(view, priority);
    },
  };
}

module.exports = {
  PRIORITY,
  createCoordinatedFalconController,
  hasToxicDot,
  priorityScore,
  reserveSwitchDecision,
  selectFocusEnemy,
  selectEnemy,
};
