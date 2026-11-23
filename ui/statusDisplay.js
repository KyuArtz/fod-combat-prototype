const STATUS_LABELS = {
  atkDown: "ATK Down",
  catalystGuard: "Catalyst Guard",
  commandATK: "Command Uplink",
  decoy: "Decoy",
  defDown: "DEF Down",
  defUp: "DEF Up",
  dominionATK: "Dominion ATK",
  dominionSPD: "Dominion SPD",
  evasionUp: "Evasion Up",
  guardianDef: "Guardian Field",
  overloadATK: "Overload",
  resDown: "RES Down",
  retaliation: "Retaliation",
  singularityAtk: "Singularity ATK",
  spdDown: "SPD Down",
  spdUp: "SPD Up",
  suppressedATK: "Suppressed ATK",
  tacticalMark: "Tactical Mark",
};

function humanize(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function statusLabel(key, effect) {
  if (effect.stat === "Evasion") return "Evasion";
  if (effect.stat) return effect.stat;
  return STATUS_LABELS[key] || humanize(key);
}

function statusCategory(key, effect) {
  if (effect.debuff || key === "tacticalMark" || Number.isFinite(effect.damageTakenPercent) ||
      Number.isFinite(effect.accuracyPenalty) || Number.isFinite(effect.evasionPenalty)) return "debuffs";
  if (key === "retaliation" || Number.isFinite(effect.damageDealtPercent) ||
      Number.isFinite(effect.damageReflectionPercent) || Number.isFinite(effect.hotPercentMaxHP)) return "buffs";
  if (!Number.isFinite(effect.amount)) return "other";
  if (effect.amount < 0) return "debuffs";
  if (effect.amount > 0) return "buffs";
  return "other";
}

function formatDuration(turns) {
  if (!Number.isFinite(turns)) return "permanent";
  return `${turns}t`;
}

function formatStatus(key, effect) {
  const label = statusLabel(key, effect);
  const duration = formatDuration(effect.turns);
  if (key === "adaptiveResistance") {
    return `${effect.damageType} resistance +${effect.amount}% (${duration})`;
  }

  const details = [];
  if (Number.isFinite(effect.damageTakenPercent)) {
    const value = effect.damageTakenPercent;
    details.push(`Incoming damage ${value > 0 ? "+" : ""}${value}%`);
  }
  if (Number.isFinite(effect.evasionPenalty)) details.push(`Evasion -${Math.abs(effect.evasionPenalty)} pts`);
  if (Number.isFinite(effect.accuracyPenalty)) details.push(`Accuracy -${Math.abs(effect.accuracyPenalty)} pts`);
  if (Number.isFinite(effect.damageDealtPercent)) {
    const value = effect.damageDealtPercent;
    details.push(`Damage dealt ${value > 0 ? "+" : ""}${value}%`);
  }
  if (Number.isFinite(effect.damageReflectionPercent)) details.push(`Damage reflection ${effect.damageReflectionPercent}%`);
  if (Number.isFinite(effect.dotDamage)) details.push(`${effect.dotDamage} ${effect.damageType || ""} damage per turn`.trim());
  if (Number.isFinite(effect.hotPercentMaxHP)) details.push(`Healing +${effect.hotPercentMaxHP}% Max HP per turn`);
  if (details.length) return `${details.join("; ")} (${duration})`;
  if (!Number.isFinite(effect.amount)) return `${label} (${duration})`;

  const unit = effect.stat === "Evasion" ? " pts" : "%";
  const amount = `${effect.amount > 0 ? "+" : ""}${effect.amount}${unit}`;
  return `${label} ${amount} (${duration})`;
}

function formatStatuses(statuses) {
  const grouped = { buffs: [], debuffs: [], other: [] };
  for (const [key, effect] of Object.entries(statuses || {})) {
    grouped[statusCategory(key, effect)].push(formatStatus(key, effect));
  }
  return grouped;
}

function formatShields(shields) {
  if (!shields.length) return "none";
  return shields
    .map((shield) => `${shield.value} (${formatDuration(shield.turns)})`)
    .join(", ");
}

function showActor(actor, output) {
  const hpPercent =
    actor.stats.HP > 0
      ? Math.floor((actor.hp / actor.stats.HP) * 100)
      : 0;
  const shieldTotal = actor.shields.reduce(
    (total, shield) => total + shield.value,
    0,
  );
  const statuses = formatStatuses(actor.statuses);
  const cooldowns = Object.entries(actor.cooldowns)
    .filter(([, turns]) => turns > 0)
    .map(([skill, turns]) => `${humanize(skill)} ${turns}t`);

  output.log(
    `  ${actor.name} — ${actor.alive ? "ACTIVE" : "DOWN"}`,
  );
  output.log(
    `    HP ${actor.hp}/${actor.stats.HP} (${hpPercent}%) | MP ${actor.mp}/${actor.stats.MP} | CR ${actor.cr}/100`,
  );
  if (actor.summon) {
    output.log(`    Summon duration: ${formatDuration(actor.summonTurns)}`);
  }
  output.log(
    `    Shields: ${shieldTotal} total${shieldTotal ? ` [${formatShields(actor.shields)}]` : ""}`,
  );

  for (const category of ["buffs", "debuffs", "other"]) {
    if (statuses[category].length) {
      output.log(
        `    ${category.toUpperCase()}: ${statuses[category].join("; ")}`,
      );
    }
  }
  output.log(
    `    Cooldowns: ${cooldowns.length ? cooldowns.join(", ") : "none"}`,
  );
}

function showStatus(state, output = console) {
  output.log("\n============================== BATTLE STATUS ==============================");
  const groups = [
    {
      title: "ALLIES",
      actors: state.actors.filter(
        (actor) => actor.side === "ally" && !actor.summon,
      ),
    },
    {
      title: "ENEMIES",
      actors: state.actors.filter(
        (actor) => actor.side === "enemy" && !actor.summon,
      ),
    },
    {
      title: "SUMMONS",
      actors: state.actors.filter((actor) => actor.summon),
    },
  ];

  for (const group of groups) {
    output.log(`\n--- ${group.title} (${group.actors.length}) ---`);
    if (!group.actors.length) {
      output.log("  None");
      continue;
    }
    for (const actor of group.actors) showActor(actor, output);
  }
  output.log("\n============================================================================");
}

function showParty(party, output = console, title = "PARTY") {
  output.log(`\n=== ${title} ==============================================================================`);
  output.log("\nACTIVE:");
  party.active.forEach((actor, index) => {
    output.log(`${index + 1}. ${actor.name} - ${actor.hp}/${actor.stats.HP} HP`);
  });
  output.log("\nRESERVE:");
  if (!party.reserve.length) output.log("None");
  party.reserve.forEach((actor, index) => {
    output.log(
      `${index + 1}. ${actor.name} - ${actor.hp}/${actor.stats.HP} HP${actor.alive ? "" : " (DOWN)"}`,
    );
  });
}

module.exports = { statusCategory, formatStatus, formatStatuses, showStatus, showParty };
