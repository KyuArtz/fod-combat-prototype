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
    summon: Boolean(actor.summon),
    hp: actor.hp,
    maxHp: actor.stats.HP,
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
      summon: Boolean(actor.summon),
      hp: actor.hp,
      maxHp: actor.stats.HP,
      mp: actor.mp,
      maxMp: actor.stats.MP,
      cr: actor.cr,
    },
    allies,
    enemies,
    actions: [],
  };

  if (kind === "player") {
    const enemyIds = enemies.map((unit) => unit.id);
    const allyIds = allies.map((unit) => unit.id);
    const targetsFor = (targeting) =>
      targeting === "enemy" ? enemyIds : targeting === "ally" ? allyIds : [];
    const actorSkills = skills[actor.id] || [];

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
          targets: targetsFor(mode.targeting),
        }));
      } else {
        action.targets = targetsFor(skill.targeting);
      }
      view.actions.push(action);
    });
    view.actions.push({
      type: "switch",
      reserves: state.party.reserve.map(partyMember),
      active: state.party.active.map(partyMember),
    });
  } else if (kind === "enemy") {
    const foeIds = allies.filter((unit) => !unit.summon).map((unit) => unit.id);
    if (foeIds.length) view.actions.push({ type: "basic", targeting: "ally", targets: foeIds });
    for (const skill of describeEnemySkills(actor)) {
      view.actions.push({
        type: "enemySkill",
        key: skill.key,
        name: skill.name,
        targeting: skill.targeting,
        usable: skill.usable,
        targets: skill.targeting === "ally" ? foeIds : [],
      });
    }
    if (!foeIds.length) view.actions.push({ type: "pass" });
  } else if (kind === "summon") {
    view.actions.push({ type: "summonAuto" });
  }

  return view;
}

module.exports = { buildTurnView, controllerKindOf, findByViewId, summarize, viewIdOf };
