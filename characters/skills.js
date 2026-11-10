function createSkills(context) {
  const {
    addShield,
    addStatus,
    alive,
    applyDamage,
    basicAttack,
    calculateMastery,
    heal,
    hitMastery,
    makeActor,
    passive,
    pay,
    ready,
    say,
    state,
  } = context;
  const pct = (value, percent) => Math.floor((value * percent) / 100);

  function nanoSwarm(actor, mode, target) {
    if (!ready(actor, "nano", 20)) {
      say("Nano Swarm is unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 20);
    actor.cooldowns.nano = 2;
    if (mode === "Repair") {
      const restored = heal(target, pct(target.stats.HP, 15));
      say(`Nano Swarm repairs ${target.name}: +${restored} HP.`);
    } else if (mode === "Disrupt") {
      const outcome = calculateMastery(actor, target, "Nanotech", 0.6);
      applyDamage(target, outcome.damage);
      addStatus(target, "spdDown", { stat: "SPD", amount: -10, turns: 2 });
      say(
        `Nano Swarm disrupts ${target.name}: ${outcome.damage} Nanotech damage; SPD -10% (2 turns).`,
      );
    } else {
      addStatus(actor, "decoy", { stat: "Evasion", amount: 15, turns: 2 });
      say("Elishia deploys a decoy (+15% Evasion for 2 turns).");
    }
    passive(actor);
  }

  function adaptiveBarrier(actor, target) {
    if (!ready(actor, "barrier", 25)) {
      say("Adaptive Barrier is unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 25);
    actor.cooldowns.barrier = 3;
    const shield = pct(target.stats.HP, 25);
    addShield(target, shield, 2);
    say(`${target.name} gains Adaptive Barrier (${shield} shield, 2 turns).`);
    passive(actor);
  }

  function deployMeo(actor) {
    if (!ready(actor, "meo", 35)) {
      say("Meo-9 deployment is unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 35);
    actor.cooldowns.meo = 4;
    const meo = makeActor({
      id: "meo-9",
      name: "Meo-9",
      side: "ally",
      mastery: "Nanotech",
      summon: true,
      summonTurns: 3,
      stats: {
        HP: 350,
        MP: 0,
        ATK: 65,
        MPow: 80,
        DEF: 35,
        RES: 35,
        SPD: 100,
        CritRate: 0,
        Evasion: 0,
        masteryBonus: {},
        masteryResistance: {},
      },
    });
    state.actors.push(meo);
    say("Meo-9 deployed! It will cover-fire on its turns for 3 rounds.");
    passive(actor);
  }

  function ultimate(actor) {
    if (!ready(actor, "ultimate", 65)) {
      say("Nanotech Singularity is unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 65);
    actor.cooldowns.ultimate = 6;
    state.singularityTurns = 3;
    for (const ally of alive(state, "ally")) {
      addStatus(ally, "singularityAtk", {
        stat: "ATK",
        amount: 15,
        turns: 3,
      });
    }
    for (const foe of alive(state, "enemy")) {
      addStatus(foe, "spdDown", { stat: "SPD", amount: -10, turns: 3 });
    }
    say(
      "NANOTECH SINGULARITY! Allies gain ATK +15%, SPD +10%, and 5% Max HP healing each turn (3 turns).",
    );
    passive(actor);
  }

  function meoTurn(meo) {
    if (!meo.alive || meo.summonTurns <= 0) return;
    const target = alive(state, "enemy")[0];
    if (target) {
      const outcome = context.hitPhysical(meo, target, 0.5, false);
      say(
        `Meo-9 cover fire hits ${target.name} for ${outcome.damage} Physical damage.`,
      );
    }
    meo.summonTurns--;
    if (meo.summonTurns <= 0) {
      meo.alive = false;
      say("Meo-9's deployment expires.");
    }
  }

  function sentinelPulse(actor, target) {
    if (!ready(actor, "pulse", 20)) {
      say("Sentinel Pulse unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 20);
    actor.cooldowns.pulse = 2;
    const outcome = calculateMastery(actor, target, "Energy", 0.75);
    applyDamage(target, outcome.damage);
    addStatus(target, "defDown", { stat: "DEF", amount: -15, turns: 2 });
    say(
      `${actor.name} uses Sentinel Pulse! ${outcome.damage} Energy damage; DEF -15% (2 turns).`,
    );
  }

  function aegisProtocol(actor, target) {
    if (!ready(actor, "aegis", 25)) {
      say("Aegis Protocol unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 25);
    actor.cooldowns.aegis = 3;
    const shield = pct(target.stats.HP, 30);
    addShield(target, shield, 2);
    say(`${actor.name} grants ${target.name} an Aegis shield (${shield}, 2 turns).`);
  }

  function guardianField(actor) {
    if (!ready(actor, "guardian", 40)) {
      say("Guardian Field unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 40);
    actor.cooldowns.guardian = 4;
    for (const ally of alive(state, "ally")) {
      addShield(ally, pct(ally.stats.HP, 15), 2);
      addStatus(ally, "guardianDef", {
        stat: "DEF",
        amount: 15,
        turns: 2,
      });
    }
    say("GUARDIAN FIELD! Active allies gain shields and DEF +15% (2 turns).");
  }

  function catalystOverdrive(actor) {
    if (!ready(actor, "catalyst", 65)) {
      say("Catalyst Overdrive unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 65);
    actor.cooldowns.catalyst = 6;
    for (const ally of alive(state, "ally")) {
      addStatus(ally, "catalystGuard", {
        stat: "DEF",
        amount: 25,
        turns: 3,
      });
      addStatus(ally, "retaliation", { amount: 25, turns: 3 });
      addShield(ally, pct(ally.stats.HP, 20), 3);
    }
    say(
      "CATALYST OVERDRIVE! Allies gain shields, DEF +25%, and retaliation (3 turns).",
    );
  }

  function tacticalMark(actor, target) {
    if (!ready(actor, "mark", 20)) {
      say("Tactical Mark unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 20);
    actor.cooldowns.mark = 2;
    addStatus(target, "tacticalMark", { amount: 15, turns: 3 });
    say(`${actor.name} marks ${target.name}! Incoming damage +15% (3 turns).`);
  }

  function commandUplink(actor) {
    if (!ready(actor, "uplink", 30)) {
      say("Command Uplink unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 30);
    actor.cooldowns.uplink = 3;
    for (const ally of alive(state, "ally")) {
      addStatus(ally, "commandATK", { stat: "ATK", amount: 15, turns: 3 });
    }
    say("COMMAND UPLINK! Active allies gain ATK +15% (3 turns).");
  }

  function suppressionOrder(actor, target) {
    if (!ready(actor, "suppression", 35)) {
      say("Suppression Order unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 35);
    actor.cooldowns.suppression = 3;
    addStatus(target, "suppressedATK", {
      stat: "ATK",
      amount: -20,
      turns: 2,
    });
    addStatus(target, "spdDown", { stat: "SPD", amount: -10, turns: 2 });
    say(`${actor.name} suppresses ${target.name}! ATK -20%, SPD -10% (2 turns).`);
  }

  function dominionDirective(actor) {
    if (!ready(actor, "dominion", 70)) {
      say("Dominion Directive unavailable (MP/cooldown).");
      return;
    }
    pay(actor, 70);
    actor.cooldowns.dominion = 6;
    for (const ally of alive(state, "ally")) {
      addStatus(ally, "dominionATK", { stat: "ATK", amount: 25, turns: 3 });
      addStatus(ally, "dominionSPD", { stat: "SPD", amount: 15, turns: 3 });
    }
    for (const foe of alive(state, "enemy")) {
      addStatus(foe, "tacticalMark", { amount: 15, turns: 3 });
    }
    say(
      "DOMINION DIRECTIVE! Allies gain ATK +25%, SPD +15%; enemies are marked (3 turns).",
    );
  }

  function impactGrenade(actor) {
    const skill = "impactGrenade";
    if (!ready(actor, skill, 20)) return false;
    pay(actor, 20);
    actor.cooldowns[skill] = 2;
    say(`${actor.name} launches an Impact Grenade!`);
    for (const target of alive(state, "enemy")) {
      hitMastery(actor, target, "Kinetic", 0.8);
    }
    return true;
  }

  function breachCharge(actor, target) {
    const skill = "breachCharge";
    if (!target || !ready(actor, skill, 30)) return false;
    pay(actor, 30);
    actor.cooldowns[skill] = 3;
    say(`${actor.name} breaches ${target.name}'s defenses! DEF -20% (2 turns).`);
    hitMastery(actor, target, "Kinetic", 1.2);
    if (target.alive) {
      addStatus(target, "defDown", { stat: "DEF", amount: -20, turns: 2 });
    }
    return true;
  }

  function reinforcedPlating(actor) {
    const skill = "reinforcedPlating";
    if (!ready(actor, skill, 25)) return false;
    pay(actor, 25);
    actor.cooldowns[skill] = 3;
    const shield = pct(actor.stats.HP, 25);
    addShield(actor, shield, 3);
    addStatus(actor, "defUp", { stat: "DEF", amount: 20, turns: 3 });
    say(
      `${actor.name} activates Reinforced Plating! (${shield} shield, DEF +20%, 3 turns)`,
    );
    return true;
  }

  function cataclysmicPayload(actor) {
    const skill = "cataclysmicPayload";
    if (!ready(actor, skill, 65)) return false;
    pay(actor, 65);
    actor.cooldowns[skill] = 6;
    say(`${actor.name} unleashes CATACLYSMIC PAYLOAD! Enemy DEF -15% (2 turns).`);
    for (const target of alive(state, "enemy")) {
      hitMastery(actor, target, "Kinetic", 1.5);
      if (target.alive) {
        addStatus(target, "defDown", { stat: "DEF", amount: -15, turns: 2 });
      }
    }
    return true;
  }

  function systemBreach(actor, target) {
    const skill = "systemBreach";
    if (!target || !ready(actor, skill, 20)) return false;
    pay(actor, 20);
    actor.cooldowns[skill] = 2;
    say(`${actor.name} breaches ${target.name}'s systems! RES -20% (2 turns).`);
    hitMastery(actor, target, "Anomaly", 0.9);
    if (target.alive) {
      addStatus(target, "resDown", { stat: "RES", amount: -20, turns: 2 });
    }
    return true;
  }

  function ghostProtocol(actor) {
    const skill = "ghostProtocol";
    if (!ready(actor, skill, 25)) return false;
    pay(actor, 25);
    actor.cooldowns[skill] = 3;
    addStatus(actor, "evasionUp", { stat: "Evasion", amount: 25, turns: 3 });
    addStatus(actor, "spdUp", { stat: "SPD", amount: 20, turns: 3 });
    say(
      `${actor.name} activates Ghost Protocol! Evasion +25, SPD +20% (3 turns).`,
    );
    return true;
  }

  function neuralDisruption(actor, target) {
    const skill = "neuralDisruption";
    if (!target || !ready(actor, skill, 35)) return false;
    pay(actor, 35);
    actor.cooldowns[skill] = 3;
    say(
      `${actor.name} disrupts ${target.name}'s neural systems! ATK -20% (2 turns).`,
    );
    hitMastery(actor, target, "Anomaly", 1.1);
    if (target.alive) {
      addStatus(target, "atkDown", { stat: "ATK", amount: -20, turns: 2 });
    }
    return true;
  }

  function shadowOverride(actor) {
    const skill = "shadowOverride";
    if (!ready(actor, skill, 70)) return false;
    pay(actor, 70);
    actor.cooldowns[skill] = 6;
    say(
      `${actor.name} executes SHADOW OVERRIDE! Enemy ATK -15%, SPD -15% (2 turns).`,
    );
    for (const target of alive(state, "enemy")) {
      hitMastery(actor, target, "Anomaly", 1.4);
      if (target.alive) {
        addStatus(target, "atkDown", { stat: "ATK", amount: -15, turns: 2 });
        addStatus(target, "spdDown", { stat: "SPD", amount: -15, turns: 2 });
      }
    }
    return true;
  }

  // Skills are declarative: `targeting` says what a controller must pick
  // ("enemy", "ally", "none", or "mode" for a skill with sub-choices) and `run`
  // executes the already-validated choice. Prompting lives in the controllers.
  const needs = (targeting, action) => ({
    targeting,
    run: (actor, { target }) => action(actor, target),
  });
  const instant = (action) => ({
    targeting: "none",
    run: (actor) => action(actor),
  });

  const skills = {
    elishia: [
      {
        name: "Nano Swarm",
        key: "nano",
        cost: 20,
        targeting: "mode",
        modes: [
          { id: "Repair", label: "Repair", targeting: "ally" },
          { id: "Disrupt", label: "Disrupt", targeting: "enemy" },
          { id: "Decoy", label: "Decoy", targeting: "none" },
        ],
        run: (actor, { mode, target }) => nanoSwarm(actor, mode, target),
      },
      { name: "Adaptive Barrier", key: "barrier", cost: 25, ...needs("ally", adaptiveBarrier) },
      { name: "Meo-9", key: "meo", cost: 35, ...instant(deployMeo) },
      { name: "Nanotech Singularity", category: "Ultimate", key: "ultimate", cost: 65, ...instant(ultimate) },
    ],
    evalete: [
      { name: "Sentinel Pulse", key: "pulse", cost: 20, ...needs("enemy", sentinelPulse) },
      { name: "Aegis Protocol", key: "aegis", cost: 25, ...needs("ally", aegisProtocol) },
      { name: "Guardian Field", key: "guardian", cost: 40, ...instant(guardianField) },
      { name: "Catalyst Overdrive", key: "catalyst", cost: 65, ...instant(catalystOverdrive) },
    ],
    zackry: [
      { name: "Tactical Mark", key: "mark", cost: 20, ...needs("enemy", tacticalMark) },
      { name: "Command Uplink", key: "uplink", cost: 30, ...instant(commandUplink) },
      { name: "Suppression Order", key: "suppression", cost: 35, ...needs("enemy", suppressionOrder) },
      { name: "Dominion Directive", key: "dominion", cost: 70, ...instant(dominionDirective) },
    ],
    jazen: [
      { name: "Impact Grenade", key: "impactGrenade", cost: 20, ...instant(impactGrenade) },
      { name: "Breach Charge", key: "breachCharge", cost: 30, ...needs("enemy", breachCharge) },
      { name: "Reinforced Plating", key: "reinforcedPlating", cost: 25, ...instant(reinforcedPlating) },
      { name: "Cataclysmic Payload", key: "cataclysmicPayload", cost: 65, ...instant(cataclysmicPayload) },
    ],
    zenki: [
      { name: "System Breach", key: "systemBreach", cost: 20, ...needs("enemy", systemBreach) },
      { name: "Ghost Protocol", key: "ghostProtocol", cost: 25, ...instant(ghostProtocol) },
      { name: "Neural Disruption", key: "neuralDisruption", cost: 35, ...needs("enemy", neuralDisruption) },
      { name: "Shadow Override", key: "shadowOverride", cost: 70, ...instant(shadowOverride) },
    ],
  };

  return { skills, meoTurn };
}

module.exports = { createSkills };