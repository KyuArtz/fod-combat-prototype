const { createFalconParty } = require("./falcon");
const { createPhantomParty } = require("./phantom");
const { getCharacterSkillData } = require("./skills");

// Central registry for player-selectable factions. New factions can be added here
// without changing the deployment selector or battle setup.
const PLAYABLE_FACTIONS = Object.freeze([
  Object.freeze({ id: "falcon", label: "Falcon Company", factory: createFalconParty }),
  Object.freeze({ id: "phantom", label: "Phantom Rebellion", factory: createPhantomParty }),
]);

const FACTION_LABELS = Object.freeze(
  Object.fromEntries(PLAYABLE_FACTIONS.map(({ id, label }) => [id, label])),
);

function createPlayableRoster({ side = "ally" } = {}) {
  if (!["ally", "enemy"].includes(side)) {
    throw new TypeError('Roster side must be "ally" or "enemy".');
  }

  const roster = PLAYABLE_FACTIONS.flatMap(({ factory }) => factory({ side }));
  const ids = roster.map((actor) => actor.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Playable roster contains duplicate character IDs.");
  }
  return roster;
}

function getFactionLabel(faction) {
  return FACTION_LABELS[faction] || String(faction || "Independent");
}

function getCharacterPreview(actor) {
  const data = getCharacterSkillData(actor.skillSet || actor.id);
  return {
    name: actor.name,
    faction: actor.faction,
    factionLabel: getFactionLabel(actor.faction),
    role: actor.role || "unassigned",
    mastery: actor.mastery || "Unassigned",
    stats: {
      HP: actor.stats.HP,
      MP: actor.stats.MP,
      ATK: actor.stats.ATK,
      MPow: actor.stats.MPow,
      DEF: actor.stats.DEF,
      RES: actor.stats.RES,
      SPD: actor.stats.SPD,
      Evasion: actor.stats.Evasion ?? actor.stats.EVA ?? 0,
      CritRate: actor.stats.CritRate ?? 0,
    },
    passive: data?.passive ? structuredClone(data.passive) : null,
    skills: (data?.skills || []).map((skill, index) => ({
      category: skill.category || (index === 3 ? "Ultimate" : `Skill ${index + 1}`),
      name: skill.name,
      description: (skill.description || skill.message || "No description available.")
        .replaceAll("{actor}", actor.name)
        .replaceAll("{target}", "the selected target")
        .replaceAll("{damage}", "calculated damage")
        .replaceAll("{healed}", "the healing amount")
        .replaceAll("{shield}", "the shield amount")
        .replaceAll("{hitsLanded}", "multiple")
        .replaceAll("{cleansedCount}", "harmful effects")
        .replaceAll("{bonusText}", ""),
      cost: skill.cost,
      cooldown: skill.cooldown,
      tags: [...(skill.tags || [])],
    })),
  };
}

module.exports = {
  PLAYABLE_FACTIONS,
  FACTION_LABELS,
  createPlayableRoster,
  getFactionLabel,
  getCharacterPreview,
};
