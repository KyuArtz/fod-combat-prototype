const { getCharacterPreview, getFactionLabel, formatRoleLabel } = require("../characters/roster");

const SEPARATOR = "-------------------------------------------------------------------------------------";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function describeActor(actor) {
  const role = (actor.roles?.length ? actor.roles : (actor.role ? [actor.role] : [])).map(formatRoleLabel).join(" / ") || "Unassigned";
  return `${actor.name} | ${getFactionLabel(actor.faction)} | ${role} | ${actor.mastery || "unassigned"}`;
}

function matchesFilter(actor, filter) {
  if (!filter || filter.field === "all") return true;
  const expected = normalize(filter.value);
  if (!expected) return true;
  if (filter.field === "faction") {
    return normalize(actor.faction).includes(expected) || normalize(getFactionLabel(actor.faction)).includes(expected);
  }
  if (filter.field === "mastery") return normalize(actor.mastery).includes(expected);
  if (filter.field === "role") return [actor.role, ...(actor.roles || [])].some((role) => normalize(role).includes(expected));
  if (filter.field === "search") {
    // Deliberately search public-facing profile data only; do not expose or index
    // internal actor IDs such as the hidden operative's roster key.
    return [actor.name, getFactionLabel(actor.faction), actor.role, ...(actor.roles || []), actor.mastery]
      .some((value) => normalize(value).includes(expected));
  }
  return true;
}

function renderStats(stats) {
  return [
    `HP ${stats.HP}`,
    `MP ${stats.MP}`,
    `ATK ${stats.ATK}`,
    `MPow ${stats.MPow}`,
    `DEF ${stats.DEF}`,
    `RES ${stats.RES}`,
    `SPD ${stats.SPD}`,
    `EVA ${stats.Evasion}`,
    `Crit ${stats.CritRate}%`,
  ].join(" | ");
}

function createDeploymentSelector({ ask, output }) {
  if (typeof ask !== "function" || !output || typeof output.log !== "function") {
    throw new TypeError("Deployment selector requires ask() and output.log().");
  }

  async function selectFaction(factions) {
    if (!Array.isArray(factions) || factions.length < 2) throw new TypeError("Faction selection needs at least two choices.");
    output.log("\n=== FACTION SELECTION ================================================================");
    factions.forEach((faction, index) => output.log(`${index + 1}. ${faction.label}`));
    while (true) {
      const answer = Number(await ask(`Choose your faction (1-${factions.length}): `));
      const selected = factions[answer - 1];
      if (selected) {
        output.log(`Selected: ${selected.label}\n`);
        return selected.id;
      }
      output.log("Invalid selection. Choose one of the listed factions.");
    }
  }

  // Backwards-compatible selector for choosing a complete single-faction roster.
  async function selectFormation(roster, activeCount = 4) {
    const remaining = [...roster];
    const order = [];

    output.log("\n=== FORMATION SETUP ================================================================");
    output.log(
      `Select ${roster.length} combatants in order. The first ${activeCount} deploy; the rest form the reserve queue.`,
    );

    while (remaining.length) {
      output.log("\nAvailable:");
      remaining.forEach((actor, index) => output.log(`${index + 1}. ${actor.name}`));
      const selectedIndex = Number(await ask(`Select combatant (1-${remaining.length}): `)) - 1;
      output.log(SEPARATOR);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= remaining.length) {
        output.log("Invalid selection. Try again.");
        continue;
      }
      order.push(remaining.splice(selectedIndex, 1)[0]);
      if (order.length === activeCount) output.log("Active formation selected. Choose the reserve queue order.");
    }

    output.log(`Active: ${order.slice(0, activeCount).map((actor) => actor.name).join(", ")}`);
    output.log(`Reserve queue: ${order.slice(activeCount).map((actor) => actor.name).join(", ")}`);
    return order;
  }

  function printRoster(roster, selectedIds, filter, maxPartySize = 5) {
    const filtered = roster.filter((actor) => matchesFilter(actor, filter));
    output.log("\n=== UNIFIED OPERATIVE ROSTER =========================================================");
    const filterLabel = !filter
      ? "All operatives"
      : filter.field === "search"
        ? "Search results"
        : `${filter.field} = ${filter.value}`;
    output.log(`Filter: ${filterLabel} | Selected: ${selectedIds.size}/${maxPartySize}`);
    if (!filtered.length) output.log("No operatives match this filter.");
    filtered.forEach((actor, index) => {
      const selected = selectedIds.has(actor.id) ? "[SELECTED]" : "";
      const role = (actor.roles?.length ? actor.roles : (actor.role ? [actor.role] : [])).map(formatRoleLabel).join(" / ") || "Unassigned";
      output.log(`${index + 1}. ${selected} ${actor.name} — ${getFactionLabel(actor.faction)} | ${role} | ${actor.mastery}`);
    });
    output.log("\nCommands: number = select/deselect | info N = details | filter faction|mastery|role VALUE | search TEXT | all | selected | done | help");
    return filtered;
  }

  function printCharacterDetails(actor) {
    const preview = getCharacterPreview(actor);
    output.log(`\n=== OPERATIVE PROFILE: ${preview.name.toUpperCase()} ===============================================`);
    output.log(`Faction: ${preview.factionLabel}`);
    output.log(`Role: ${preview.role} | Mastery: ${preview.mastery}`);
    output.log(renderStats(preview.stats));
    if (preview.passive) {
      output.log(`\nPASSIVE — ${preview.passive.name}`);
      output.log(preview.passive.description || "No description available.");
    }
    output.log("\nSKILLS:");
    preview.skills.forEach((skill) => {
      output.log(`- ${skill.category}: ${skill.name} [${skill.cost} MP, CD ${skill.cooldown}]`);
      output.log(`  ${skill.description}`);
      for (const mode of skill.modes || []) {
        output.log(`    • ${mode.label} (${mode.targeting}): ${mode.description}`);
      }
    });
    output.log(SEPARATOR);
  }

  async function chooseSelectedOrder(actors, count, label) {
    const remaining = [...actors];
    const ordered = [];
    while (ordered.length < count) {
      output.log(`\nChoose ${label} slot ${ordered.length + 1} of ${count}:`);
      remaining.forEach((actor, index) => output.log(`${index + 1}. ${describeActor(actor)}`));
      const selectedIndex = Number(await ask(`Choose operative (1-${remaining.length}): `)) - 1;
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= remaining.length) {
        output.log("Invalid selection. Try again.");
        continue;
      }
      ordered.push(remaining.splice(selectedIndex, 1)[0]);
    }
    return { ordered, remaining };
  }

  async function selectMixedFormation(roster, { activeCount = 3, maxPartySize = 5 } = {}) {
    if (!Array.isArray(roster) || roster.length < activeCount) {
      throw new TypeError(`Mixed roster must contain at least ${activeCount} operatives.`);
    }
    if (!Number.isInteger(activeCount) || activeCount < 1 || !Number.isInteger(maxPartySize) || maxPartySize < activeCount) {
      throw new RangeError("Mixed formation requires valid activeCount and maxPartySize values.");
    }
    const ids = roster.map((actor) => actor.id);
    if (ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
      throw new Error("Mixed roster must contain unique non-empty actor IDs.");
    }

    const selectedIds = new Set();
    const selectedOrder = [];
    const actorsById = new Map(roster.map((actor) => [actor.id, actor]));
    let filter = null;
    const selectedActors = () => selectedOrder.map((id) => actorsById.get(id));

    while (true) {
      const filtered = printRoster(roster, selectedIds, filter, maxPartySize);
      const answer = normalize(await ask("Roster selection: "));

      if (answer === "help" || answer === "?") {
        output.log("Select at least the active slot count and at most five operatives. Use 'info N' to inspect a profile, 'filter faction phantom' to narrow the roster, 'search medic' to search public profile details, and 'done' when ready.");
        continue;
      }
      if (answer === "all") {
        filter = null;
        continue;
      }
      if (answer === "selected") {
        const chosen = selectedActors();
        output.log(`\nSelected (${chosen.length}/${maxPartySize}): ${chosen.map(describeActor).join("; ") || "none"}`);
        continue;
      }
      if (answer.startsWith("search ")) {
        const term = answer.slice(7).trim();
        filter = term ? { field: "search", value: term } : null;
        continue;
      }
      if (answer.startsWith("filter ")) {
        const [, field, ...valueParts] = answer.split(/\s+/);
        const value = valueParts.join(" ").trim();
        if (!["faction", "mastery", "role"].includes(field) || !value) {
          output.log("Use: filter faction|mastery|role VALUE");
          continue;
        }
        filter = { field, value };
        continue;
      }
      if (answer.startsWith("info ")) {
        const index = Number(answer.slice(5).trim()) - 1;
        if (!Number.isInteger(index) || index < 0 || index >= filtered.length) {
          output.log("Invalid roster number.");
          continue;
        }
        printCharacterDetails(filtered[index]);
        continue;
      }
      if (answer === "done") {
        if (selectedIds.size < activeCount) {
          output.log(`Choose at least ${activeCount} operatives before continuing.`);
          continue;
        }
        break;
      }
      if (/^\d+$/.test(answer)) {
        const index = Number(answer) - 1;
        const actor = filtered[index];
        if (!actor) {
          output.log("Invalid roster number.");
          continue;
        }
        if (selectedIds.has(actor.id)) {
          selectedIds.delete(actor.id);
          selectedOrder.splice(selectedOrder.indexOf(actor.id), 1);
          output.log(`${actor.name} removed from selection.`);
        } else if (selectedIds.size >= maxPartySize) {
          output.log(`Your formation is full (${maxPartySize}). Remove an operative before adding another.`);
        } else {
          selectedIds.add(actor.id);
          selectedOrder.push(actor.id);
          output.log(`${actor.name} selected (${selectedIds.size}/${maxPartySize}).`);
        }
        continue;
      }
      output.log("Unrecognized command. Type 'help' for roster commands.");
    }

    const chosen = selectedActors();
    const active = await chooseSelectedOrder(chosen, activeCount, "active");
    const reserves = active.remaining.length
      ? await chooseSelectedOrder(active.remaining, active.remaining.length, "reserve")
      : { ordered: [], remaining: [] };
    const order = [...active.ordered, ...reserves.ordered];
    output.log("\n=== CONFIRMED FORMATION =============================================================");
    output.log(`Active (${active.ordered.length}): ${active.ordered.map((actor) => actor.name).join(", ")}`);
    output.log(`Reserve (${reserves.ordered.length}): ${reserves.ordered.map((actor) => actor.name).join(", ") || "none"}`);
    output.log(`Faction mix: ${[...new Set(order.map((actor) => getFactionLabel(actor.faction)))].join(" + ")}`);
    return order;
  }

  return { selectFaction, selectFormation, selectMixedFormation };
}

module.exports = { createDeploymentSelector, describeActor, matchesFilter };
