// Deterministic, role-aware controller for the five-member Falcon roster.
// It chooses only from legal actions exposed by the shared turn-view contract.

const PRIORITY = Object.freeze({
  "toxic-stalker": 120,
  "recon-drone": 112,
  "siege-turret": 108,
  "blightheart-overseer": 106,
  "rogue-automaton": 94,
  "training-drone": 82,
});

function ratio(unit) {
  return unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
}

function totalShield(unit) {
  return (unit?.shields || []).reduce((sum, shield) => sum + (Number(shield.value) || 0), 0);
}

function hasStatus(unit, key) {
  return Boolean(unit?.statuses && Object.hasOwn(unit.statuses, key));
}

function priorityScore(enemy) {
  const base = PRIORITY[enemy.id.split("-").slice(0, 2).join("-")] ??
    (enemy.id.includes("blightheart-overseer") ? PRIORITY["blightheart-overseer"] : 70);
  return base + (1 - ratio(enemy)) * 18;
}

function selectEnemy(view, ids, predicate = () => true) {
  const pool = (ids || []).map((id) => view.enemies.find((unit) => unit.id === id)).filter((unit) => unit && predicate(unit));
  pool.sort((a, b) => priorityScore(b) - priorityScore(a) || ratio(a) - ratio(b) || a.id.localeCompare(b.id));
  return pool[0] || null;
}

function selectBossOrPriority(view, ids) {
  const boss = (ids || []).map((id) => view.enemies.find((unit) => unit.id === id)).find((unit) => unit?.id.includes("blightheart-overseer"));
  return boss || selectEnemy(view, ids);
}

function selectLowestAlly(view, ids, predicate = () => true) {
  const pool = (ids || []).map((id) => view.allies.find((unit) => unit.id === id)).filter((unit) => unit && !unit.summon && predicate(unit));
  pool.sort((a, b) => ratio(a) - ratio(b) || a.id.localeCompare(b.id));
  return pool[0] || null;
}

function action(view, key) {
  return view.actions.find((item) => item.type === "skill" && item.key === key && item.usable) || null;
}

function decisionForSkill(item, targetId, mode) {
  if (!item) return null;
  return {
    type: "skill",
    skillKey: item.key,
    ...(mode ? { mode } : {}),
    ...(targetId ? { targetId } : {}),
  };
}

function modeFor(item, modeId) {
  return item?.modes?.find((mode) => mode.id === modeId) || null;
}

function chooseBasic(view, target) {
  const basic = view.actions.find((item) => item.type === "basic" && item.targets.length);
  const chosen = target && basic?.targets.includes(target.id) ? target : selectEnemy(view, basic?.targets);
  return chosen ? { type: "basic", targetId: chosen.id } : { type: "pass" };
}

function createTacticalFalconController() {
  return {
    chooseAction(view) {
      const actorId = view.actor.id;
      const allies = view.allies.filter((unit) => !unit.summon);
      const enemies = view.enemies;
      const criticalAlly = allies.filter((unit) => ratio(unit) <= 0.42).sort((a, b) => ratio(a) - ratio(b))[0];
      const injured = allies.filter((unit) => ratio(unit) <= 0.78);
      const priority = selectEnemy(view, enemies.map((unit) => unit.id));
      const boss = enemies.find((unit) => unit.id.includes("blightheart-overseer"));

      if (actorId === "elishia") {
        const meo = action(view, "meo");
        if (meo && !allies.some((unit) => unit.name === "Meo-9")) return decisionForSkill(meo);

        const ultimate = action(view, "ultimate");
        if (ultimate && allies.length >= 3 && !hasStatus(view.actor, "singularityAtk")) return decisionForSkill(ultimate);

        const repair = action(view, "nano");
        const repairMode = modeFor(repair, "Repair");
        const repairTarget = selectLowestAlly(view, repairMode?.targets, (unit) => ratio(unit) <= 0.62);
        if (repairTarget) return decisionForSkill(repair, repairTarget.id, "Repair");

        const barrier = action(view, "barrier");
        const barrierTarget = selectLowestAlly(view, barrier?.targets, (unit) => ratio(unit) <= 0.68 && totalShield(unit) < unit.maxHp * 0.12);
        if (barrierTarget) return decisionForSkill(barrier, barrierTarget.id);

        const disruptMode = modeFor(repair, "Disrupt");
        const disruptTarget = selectEnemy(view, disruptMode?.targets, (unit) => !hasStatus(unit, "nanoSpdDown"));
        if (disruptTarget) return decisionForSkill(repair, disruptTarget.id, "Disrupt");

        const decoyMode = modeFor(repair, "Decoy");
        if (decoyMode && ratio(view.actor) <= 0.58 && !hasStatus(view.actor, "decoy")) return decisionForSkill(repair, undefined, "Decoy");

        return chooseBasic(view, priority);
      }

      if (actorId === "evalete") {
        const catalyst = action(view, "catalyst");
        const alreadyReflected = hasStatus(view.actor, "catalystReflection");
        if (catalyst && !alreadyReflected && (injured.length >= 3 || criticalAlly || (boss && injured.length >= 2))) {
          return decisionForSkill(catalyst);
        }

        const guardian = action(view, "guardian");
        const injuredNoGuard = injured.filter((unit) => !hasStatus(unit, "guardianDef"));
        if (guardian && injuredNoGuard.length >= 2) return decisionForSkill(guardian);

        const triage = action(view, "triage");
        const triageTarget = selectLowestAlly(view, triage?.targets, (unit) => ratio(unit) <= 0.68 && !hasStatus(unit, "triageHot"));
        if (triageTarget) return decisionForSkill(triage, triageTarget.id);

        const pulse = action(view, "pulse");
        const pulseTarget = selectEnemy(view, pulse?.targets, (unit) => !hasStatus(unit, "sentinelDefDown"));
        if (pulseTarget) return decisionForSkill(pulse, pulseTarget.id);
        return chooseBasic(view, priority);
      }

      if (actorId === "zackry") {
        const ultimate = action(view, "ultimate");
        const alliesHaveUplink = allies.some((unit) => hasStatus(unit, "commandUplink") || hasStatus(unit, "fullSpectrumMPow"));
        if (ultimate && enemies.length >= 3 && !allies.some((unit) => hasStatus(unit, "fullSpectrumMPow"))) return decisionForSkill(ultimate);

        const uplink = action(view, "uplink");
        if (uplink && !alliesHaveUplink) return decisionForSkill(uplink);

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
        const cipherTarget = selectBossOrPriority(view, cipher?.targets?.filter((id) => {
          const target = view.enemies.find((unit) => unit.id === id);
          return target && !hasStatus(target, "cipherTag");
        }));
        if (cipherTarget) return decisionForSkill(cipher, cipherTarget.id);

        const ultimate = action(view, "ultimate");
        const bestTarget = selectBossOrPriority(view, enemies.map((unit) => unit.id));
        if (ultimate && bestTarget && (ratio(bestTarget) < 0.4 || (hasStatus(view.actor, "ghostAttackBoost") && (boss || enemies.length <= 2)))) {
          return decisionForSkill(ultimate, bestTarget.id);
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

module.exports = { createTacticalFalconController };
