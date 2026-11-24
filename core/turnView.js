// Plain-data description of "what can this actor do right now".
//
// A controller (terminal menu, enemy AI, GUI, simulator, test script) reads a
// view and answers with a decision. Views contain only ids, names, numbers and
// strings, so they can be cloned, logged, sent to a UI or replayed.
//
// Target sides are absolute: "ally" means the Falcon side, "enemy" the enemy
// side, regardless of which side the acting unit is on.

// Ids are the actor's own id, with "#n" appended only when several living actors
// share one id (for example two Meo-9 summons), so every target is addressable.
function viewIdOf(state, actor) {
  const same = state.actors.filter((candidate) => candidate.id === actor.id);
  if (same.length <= 1) return actor.id;
  const index = same.indexOf(actor);
  return index < 0 ? actor.id : `${actor.id}#${index + 1}`;
}

function findByViewId(state, viewId) {
  if (typeof viewId !== "string") return null;
  const deployed = state.actors.find((actor) => viewIdOf(state, actor) === viewId);
  if (deployed) return deployed;
  return (
    [...state.party.reserve, ...state.party.active].find((actor) => actor.id === viewId) || null
  );
}

function summarize(state, actor) {
  return {
    id: viewIdOf(state, actor),
    name: actor.name,
    side: actor.side,
    faction: actor.faction || null,
    role: actor.role || null,
    mastery: actor.mastery || null,
    skillSet: actor.skillSet || actor.id,
    summon: Boolean(actor.summon),
    targetableByEnemy: Boolean(actor.targetableByEnemy),
    untargetable: Boolean(actor.statuses?.untargetable || Object.values(actor.statuses || {}).some((status) => status.untargetable)),
    hp: actor.hp,
    maxHp: actor.stats.HP,
    mp: actor.mp,
    maxMp: actor.stats.MP,
    shields: (actor.shields || []).map((shield) => ({ value: shield.value, turns: shield.turns })),
    statuses: structuredClone(actor.statuses || {}),
  };
}

function partyMember(actor) {
  return { id: actor.id, name: actor.name, hp: actor.hp, maxHp: actor.stats.HP, alive: actor.alive };
}

// Which kind of controller plays this actor. Mirrors the original turn-engine
// precedence: non-summon allies are the player, then enemies, then summons.
function controllerKindOf(actor) {
  if (actor.side === "ally" && !actor.summon) return "player";
  if (actor.side === "enemy") return "enemy";
  if (actor.summon) return "summon";
  return null;
}

function buildTurnView({ state, actor, skills, describeEnemySkills, ready, alive }) {
  const allies = alive(state, "ally").map((unit) => summarize(state, unit));
  const enemies = alive(state, "enemy").map((unit) => summarize(state, unit));
  const kind = controllerKindOf(actor);

  const view = {
    kind,
    round: state.round,
    actor: {
      id: viewIdOf(state, actor),
      name: actor.name,
      side: actor.side,
      faction: actor.faction || null,
      role: actor.role || null,
      mastery: actor.mastery || null,
      skillSet: actor.skillSet || actor.id,
      summon: Boolean(actor.summon),
      hp: actor.hp,
      maxHp: actor.stats.HP,
      mp: actor.mp,
      maxMp: actor.stats.MP,
      cr: actor.cr,
      statuses: structuredClone(actor.statuses || {}),
      shields: (actor.shields || []).map((shield) => ({ value: shield.value, turns: shield.turns })),
    },
    allies,
    enemies,
    // Relative aliases let either faction use the same tactical controller and skill data.
    friendlies: actor.side === "ally" ? allies : enemies,
    opponents: actor.side === "ally" ? enemies : allies,
    actions: [],
  };

  if (kind === "player") {
    const enemyIds = enemies.filter((unit) => !unit.untargetable).map((unit) => unit.id);
    const allyIds = allies.filter((unit) => !unit.summon).map((unit) => unit.id);
    const targetsFor = (targeting, skill = {}) => {
      if (targeting === "enemy") return enemyIds;
      if (targeting !== "ally") return [];
      return allyIds.filter((id) => {
        if (skill.excludeSelf && id === actor.id) return false;
        if (skill.targetFaction) {
          const target = allies.find((unit) => unit.id === id);
          if (target?.faction !== skill.targetFaction) return false;
        }
        return true;
      });
    };
    const actorSkills = skills[actor.skillSet || actor.id] || [];

    view.actions.push({ type: "basic", targeting: "enemy", targets: enemyIds });
    actorSkills.forEach((skill, index) => {
      const action = {
        type: "skill",
        key: skill.key,
        name: skill.name,
        category:
          skill.category || (index === actorSkills.length - 1 ? "Ultimate" : `Skill ${index + 1}`),
        cost: skill.cost,
        cooldown: actor.cooldowns[skill.key] || 0,
        usable: ready(actor, skill.key, skill.cost),
        targeting: skill.targeting,
      };
      if (skill.targeting === "mode") {
        action.modes = skill.modes.map((mode) => ({
          id: mode.id,
          label: mode.label,
          targeting: mode.targeting,
          targets: targetsFor(mode.targeting, skill),
        }));
      } else {
        action.targets = targetsFor(skill.targeting, skill);
      }
      view.actions.push(action);
    });
    view.actions.push({
      type: "switch",
      reserves: state.party.reserve.map(partyMember),
      active: state.party.active.map(partyMember),
    });
  } else if (kind === "enemy") {
    const factionActor = Boolean(actor.faction);
    const foeUnits = view.opponents.filter((unit) => (!unit.summon || unit.targetableByEnemy) && !unit.untargetable);
    const friendUnits = view.friendlies.filter((unit) => !unit.summon && !unit.untargetable);
    const foeIds = foeUnits.map((unit) => unit.id);
    const friendIds = friendUnits.map((unit) => unit.id);
    if (foeIds.length) view.actions.push({ type: "basic", targeting: "enemy", targets: foeIds });

    const enemyTargetsFor = (targeting, skill = {}) => {
      let targets = [];
      let candidates = [];
      if (targeting === "none") return targets;
      if (factionActor && targeting === "ally") {
        targets = friendIds;
        candidates = friendUnits;
      } else if (targeting === "enemy" || (!factionActor && targeting === "ally")) {
        // Existing neutral enemy archetypes use `ally` to mean the player side;
        // faction actors use the same player/character semantics as their own kits.
        targets = foeIds;
        candidates = foeUnits;
      }
      if (skill.excludeSelf) targets = targets.filter((id) => id !== actor.id);
      if (skill.targetFaction) {
        targets = targets.filter((id) => candidates.find((unit) => unit.id === id)?.faction === skill.targetFaction);
      }
      return targets;
    };
    for (const skill of describeEnemySkills(actor)) {
      const action = {
        type: "enemySkill",
        key: skill.key,
        name: skill.name,
        category: skill.category,
        cost: skill.cost,
        cooldown: skill.cooldown,
        targeting: skill.targeting,
        usable: skill.usable,
      };
      if (skill.targeting === "mode") {
        action.modes = (skill.modes || []).map((mode) => ({
          id: mode.id,
          label: mode.label,
          targeting: mode.targeting,
          targets: enemyTargetsFor(mode.targeting, skill),
        }));
      } else {
        action.targets = enemyTargetsFor(skill.targeting, skill);
      }
      view.actions.push(action);
    }
    if (factionActor) {
      const sideParty = actor.side === "ally" ? state.party : state.enemyParty;
      view.actions.push({
        type: "switch",
        reserves: sideParty.reserve.map(partyMember),
        active: sideParty.active.map(partyMember),
      });
    }
    if (!foeIds.length && !view.actions.some((action) => action.type === "enemySkill" && action.usable)) {
      view.actions.push({ type: "pass" });
    }
  } else if (kind === "summon") {
    view.actions.push({ type: "summonAuto" });
  }

  return view;
}

module.exports = { buildTurnView, controllerKindOf, findByViewId, summarize, viewIdOf };
