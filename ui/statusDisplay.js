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
  if (key === "tacticalMark") return "debuffs";
  if (key === "retaliation") return "buffs";
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
  if (key === "tacticalMark") {
    return `Incoming damage +${effect.amount}% (${formatDuration(effect.turns)})`;
  }
  if (!Number.isFinite(effect.amount)) {
    return `${label} (${formatDuration(effect.turns)})`;
  }

  const unit = effect.stat === "Evasion" ? " pts" : "%";
  const amount = `${effect.amount > 0 ? "+" : ""}${effect.amount}${unit}`;
  return `${label} ${amount} (${formatDuration(effect.turns)})`;
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

module.exports = { showStatus, showParty };
