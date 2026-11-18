// Passive, summon, and actor-lifecycle behavior for declarative skill data.
const { formatMessage } = require("./skillMessages");

const pct = (value, percent) => Math.floor((value * percent) / 100);

function createSkillLifecycle(context) {
  const { addShield, addStatus, alive, applyDamage, heal, hitMastery, hitPhysical, makeActor, say, state } = context;

  function onBattleStart(actors) {
    for (const actor of actors) {
      if (actor.passive?.id === "catalystProtocol") {
        actor.catalystWingTurns = actor.passive.wingTurns;
        actor.catalystWingTurnCount = 0;
        const wingHp = pct(actor.stats.HP, actor.passive.wingHpPercent);
        const wing = makeActor({
          id: `catalyst-wing-${actor.id}`, name: "Catalyst Wing", side: "ally", mastery: "Energy",
          summon: true, passiveSummon: true, targetableByEnemy: true,
          summonTurns: actor.passive.wingTurns, ownerId: actor.id,
          stats: { HP: wingHp, MP: 0, ATK: 0, MPow: 0,
            DEF: pct(actor.stats.DEF, actor.passive.wingDefPercent),
            RES: pct(actor.stats.RES, actor.passive.wingResPercent), SPD: 1,
            CritRate: 0, Evasion: 0, masteryBonus: {}, masteryResistance: {} },
        });
        state.actors.push(wing);
        actor.catalystWingId = wing.id;
      }
      if (actor.passive?.id === "biotechOverdrive") {
        actor.biotechOverdriveTurns = actor.passive.battleStartBuffTurns || 3;
      }
    }
  }

  function onTurnStart(actor) {
    const dot = actor.statuses?.singularityDot;
    if (actor.side === "enemy" && dot && dot.turns > 0 && actor.alive) {
      applyDamage(actor, dot.dotDamage, dot.damageType);
      say(`${actor.name} takes ${dot.dotDamage} Nanotech damage from Nanotech Singularity.`);
    }
    if (actor.passive?.id === "unobserved") {
      actor.railshotUntargeted = !actor.targetedByEnemySinceLastTurn;
      actor.targetedByEnemySinceLastTurn = false;
      actor.unobservedSuppressed = false;
    }
    for (const status of Object.values(actor.statuses)) {
      if (status.hotPercentMaxHP) heal(actor, pct(actor.stats.HP, status.hotPercentMaxHP));
    }
    const uplink = actor.statuses.commandUplink;
    if (uplink) {
      // Recalculate from the base amount every turn; never compound the conditional bonus.
      if (uplink.baseAmount === undefined) uplink.baseAmount = uplink.amount;
      uplink.amount = uplink.baseAmount + (actor.hp / actor.stats.HP > uplink.hpThresholdPercent / 100 ? uplink.conditionalAmount || 0 : 0);
    }
  }

  function onTurnEnd(actor) {
    if (actor.passive?.id === "biotechOverdrive" && actor.biotechOverdriveTurns > 0) {
      actor.biotechOverdriveTurns--;
    }
    if (actor.passive?.id !== "catalystProtocol" || !(actor.catalystWingTurns > 0)) return;
    actor.catalystWingTurnCount++;
    actor.catalystWingTurns--;
    const wing = state.actors.find((unit) => unit.id === actor.catalystWingId);
    if (wing?.alive) {
      wing.summonTurns = actor.catalystWingTurns;
      if (actor.catalystWingTurns <= 0) wing.alive = false;
    }
    if (actor.catalystWingTurnCount % actor.passive.pulseEvery !== 0) return;
    for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
      heal(ally, pct(ally.stats.HP, actor.passive.healPercent));
      const amount = pct(ally.stats.HP, actor.passive.shieldPercent);
      const existing = ally.shields.find((shield) => shield.sourceId === "catalystWing");
      if (existing) { existing.value = amount; existing.turns = actor.passive.shieldTurns; }
      else {
        addShield(ally, amount, actor.passive.shieldTurns);
        ally.shields[ally.shields.length - 1].sourceId = "catalystWing";
      }
    }
  }

  function onDamageTaken(target, amount, damageType, hpLoss = amount) {
    if (target.alive && target.passive?.id === "recoilDampeners" && hpLoss > pct(target.stats.HP, target.passive.damageThresholdPercent)) {
      const passive = target.passive;
      const previous = target.statuses.jazenRecoil?.stacks || 0;
      const stacks = Math.min(passive.maxStacks, previous + 1);
      addStatus(target, "jazenRecoil", {
        stat: "ATK", amount: passive.attackBonusPercent * stacks,
        stacks, turns: passive.duration,
      });
    }
    if (target.passive?.id === "unobserved") target.unobservedSuppressed = true;
  }

  function onEnemySkillTargeted(attacker, target) {
    if (!target || target.side !== "ally") return;
    target.targetedByEnemySinceLastTurn = true;
    target.enemySkillTargetedThisRound = true;
  }

  function onRoundStart() {
    for (const actor of state.actors) {
      actor.enemySkillTargetedThisRound = false;
      actor.targetedByAllyId = null;
    }
  }

  function onUnitDefeated(unit, statuses = {}) {
    if (!statuses.tacticalMark || statuses.tacticalMark.rewardClaimed) return;
    for (const ally of alive(state, "ally").filter((member) => !member.summon)) {
      ally.mp = Math.min(ally.stats.MP, ally.mp + pct(ally.stats.MP, 5));
    }
  }

  // Meo-v9's Emergency Field replaces the old prototype revive behavior. It heals
  // the most injured living ally below 25% Max HP instead of firing that activation.
  function summonTurn(summon) {
    if (!summon.alive || summon.summonTurns <= 0) return;
    const behavior = summon.behavior || {};
    let healed = false;
    const rule = behavior.emergencyField;
    if (rule) {
      const candidates = alive(state, "ally").filter((unit) => !unit.summon && unit.hp / unit.stats.HP < rule.thresholdPercent / 100);
      candidates.sort((a, b) => a.hp / a.stats.HP - b.hp / b.stats.HP);
      if (candidates.length) {
        const target = candidates[0];
        const amount = heal(target, pct(target.stats.HP, rule.healPercent));
        say(formatMessage(rule.message, { actor: summon.name, target: target.name, healed: amount }));
        healed = true;
      }
    }
    if (!healed) {
      const target = alive(state, "enemy")[0];
      if (target && behavior.type === "coverFire") {
        const power = state.singularityTurns > 0 && behavior.singularityPower ? behavior.singularityPower : behavior.power;
        const outcome = hitPhysical(summon, target, power, behavior.canCrit);
        say(formatMessage(behavior.message, { actor: summon.name, target: target.name, damage: outcome.damage }));
      }
    }
    summon.summonTurns--;
    if (summon.summonTurns <= 0) {
      summon.alive = false;
      say(formatMessage(behavior.expireMessage || "{actor}'s deployment expires.", { actor: summon.name }));
      if (summon.finalProtocol) executeFinalProtocol(summon);
    }
  }

  function executeFinalProtocol(summon) {
    const protocol = summon.finalProtocol;
    if (!protocol || summon.finalProtocolUsed) return;
    summon.finalProtocolUsed = true;
    const enemies = alive(state, "enemy");
    if (!enemies.length) return;
    const primary = enemies.find((enemy) => enemy.id === summon.finalProtocolTargetId) || enemies[0];
    for (const enemy of enemies) {
      const power = enemy === primary ? protocol.power : protocol.power * protocol.secondaryMultiplier;
      const outcome = hitMastery(summon, enemy, protocol.element, power, false);
      if (enemy.alive) addStatus(enemy, "meoFinalProtocolSpdDown", { stat: "SPD", amount: protocol.spdDown, turns: protocol.turns, debuff: true });
      say(`${enemy.name} is struck by Meo-v9's Final Protocol for ${outcome.damage} ${protocol.element} damage${enemy === primary ? " (primary)" : " (secondary)"}.`);
    }
  }

  function summonDestroyed(summon) {
    if (summon.passiveSummon && summon.ownerId) {
      const owner = state.actors.find((unit) => unit.id === summon.ownerId && unit.alive);
      if (owner?.passive?.id === "catalystProtocol" && owner.catalystWingTurns > 0) {
        owner.catalystWingTurns = 0;
        const amount = pct(owner.stats.HP, owner.passive.destructionShieldPercent);
        addShield(owner, amount, owner.passive.destructionShieldTurns);
        say(`Catalyst Wing is destroyed. ${owner.name} gains an emergency shield (${amount}) for ${owner.passive.destructionShieldTurns} turns.`);
      }
      return;
    }
    const burst = summon.onDestroyed;
    if (!burst) return;
    say(formatMessage(burst.message, { actor: summon.name }));
    const opposing = summon.side === "ally" ? "enemy" : "ally";
    for (const foe of alive(state, opposing)) {
      hitMastery(summon, foe, burst.element, burst.power, false);
      if (foe.alive) addStatus(foe, burst.status.id, { stat: burst.status.stat, amount: burst.status.amount, turns: burst.status.turns });
    }
  }

  return { onBattleStart, onTurnStart, onTurnEnd, onDamageTaken, onEnemySkillTargeted, onRoundStart, onUnitDefeated, summonTurn, summonDestroyed };
}

module.exports = { createSkillLifecycle };
