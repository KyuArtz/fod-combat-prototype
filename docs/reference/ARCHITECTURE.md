# Architecture Reference

This document describes current module ownership and runtime flow. Executable source and tests take precedence if this document becomes stale.

## High-level runtime flow

```text
index.js
  └─ selects scheduler and opening policy from environment
     └─ core/battle.js (composition root)
        ├─ creates battle state, seeded RNG, and event bus
        ├─ resolves enemy encounter data and creates Falcon/enemy actors
        ├─ sets up active/reserve formations
        ├─ applies opening initiative
        ├─ wires combat systems, skill registries, AI, controllers, and terminal UI
        └─ core/turnEngine.js
             ├─ selects the next actor through the scheduler
             ├─ applies turn-start effects
             ├─ core/turnRunner.js: view → controller → validate → execute
             ├─ applies turn-end lifecycle and duration ticks
             ├─ advances encounter waves/reinforcements when required
             └─ checks round and battle completion
```

## Module ownership

| Area | Modules | Responsibility |
|---|---|---|
| Composition | `index.js`, `core/battle.js`, `core/battleState.js` | CLI configuration, dependency wiring, initial state, battle lifecycle |
| Turn flow | `core/turnEngine.js`, `core/turnRunner.js`, `core/turnView.js`, `core/decisions.js` | Scheduler loop, turn views, controller selection, decision validation, execution dispatch |
| Controllers | `core/controllers.js`, `ui/battleMenu.js`, `ai/enemyAI.js` | Player, scripted, random, summon, and enemy decision policies |
| Combat resolution | `core/actionResolver.js`, `systems/damage.js`, `systems/damageApplication.js` | Shared basic attacks, damage calculation/application, HP and incapacitation |
| Skill runtime | `core/skillInterpreter.js`, `core/skillLifecycle.js`, `core/skillEffects.js`, `core/skillDataValidation.js`, `core/skillMessages.js` | Skill execution orchestration, passive/summon lifecycle, effect handlers, data validation, message formatting |
| Actor and registry | `characters/actorFactory.js`, `characters/falcon.js`, `characters/skills.js`, `characters/enemies.js` | Runtime actor construction, Falcon roster, skill registry assembly, enemy/encounter resolution |
| Data definitions | `data/skills/`, `data/enemySkills/`, `data/enemies/`, `data/enemyAI/`, `data/encounters/` | Declarative skill, archetype, policy, and encounter content |
| Reusable systems | `systems/` | Readiness, initiative, formation, cooldowns, shields, statuses, and damage systems |
| Events and randomness | `core/eventBus.js`, `core/combatEvents.js`, `core/rng.js` | Battle-local deterministic RNG, event delivery, typed event validation |
| Presentation | `ui/` | Terminal prompts, deployment selection, status display, readable battle log |
| Tooling | `tools/`, `tools/lib/` | Headless execution, simulation, scheduler comparison, golden fixture maintenance |

## Dependency rules

- `core/battle.js` is the composition root and may wire UI, AI, systems, characters, and tools-facing interfaces together.
- Reusable combat rules belong in `systems/` or `core/`, not in terminal UI modules.
- UI controllers present a view and return a decision; they do not directly mutate combat state.
- Enemy AI chooses actions from data-defined policies. Enemy skill definitions describe effects; the shared interpreter executes them.
- Character/enemy data modules should remain declarative. Runtime actor objects are created through `characters/actorFactory.js`.
- Keep the skill runtime boundaries explicit: execution orchestration in `skillInterpreter`, passive/summon lifecycle in `skillLifecycle`, effect handlers in `skillEffects`, validation in `skillDataValidation`, and formatting in `skillMessages`.
- Avoid introducing new module-level mutable battle state. State that differs per battle belongs on the battle state or in a battle-scoped context.

## Turns, controllers, and decisions

For each actor turn, `core/turnRunner.js`:

1. Determines the controller kind (`player`, `enemy`, or `summon`).
2. Builds a plain-data view containing the acting actor, living allies/enemies, legal actions, targets, skill readiness, and supported modes.
3. Requests a decision from the controller.
4. Validates the decision with `core/decisions.js`.
5. Emits `ActionChosen` for accepted decisions and dispatches execution.
6. Emits `DecisionRejected` and retries an invalid decision, with a bounded retry count.

Controllers do not own combat rules. The terminal menu, built-in enemy AI, scripted controller, and random controller all use the same view/decision contract. Replay requires the battle seed, party order, and recorded accepted player decisions.

## Skill runtime

- `data/skills/*.js` defines Falcon skills and passive data.
- `data/enemySkills/*.js` defines the current enemy skill sets.
- `characters/skills.js` builds both registries through `core/skillInterpreter.js`.
- `core/skillInterpreter.js` checks readiness, pays MP, assigns cooldowns, and runs the selected skill variant.
- `core/skillLifecycle.js` owns passive, summon, and actor lifecycle callbacks.
- `core/skillEffects.js` maps declarative effect types to shared combat operations.
- `core/skillDataValidation.js` rejects invalid definitions, unsupported effect types, malformed targeting, missing message placeholders, and invalid effect values.
- `core/skillMessages.js` formats messages using named placeholders.

When adding an effect, update its handler and validation rules together, add focused tests, and verify full-battle/golden behavior. Do not put prompts or terminal I/O in skill data or effect handlers.

## Enemy AI and encounters

- `data/enemies/` contains archetype identity, base stats, skill-set references, and AI policy keys.
- `data/enemyAI/` contains ordered conditions, actions, and fallback decisions.
- `ai/enemyAI.js` evaluates policy rules and delegates skill execution to the shared registry; `ai/targeting.js` owns target selection.
- `data/encounters/` contains encounter compositions, waves, per-instance overrides, reinforcement rules, and reward metadata.
- `characters/enemies.js` validates and resolves encounter data into runtime enemy actors.
- `core/battle.js` and the turn engine coordinate wave transitions, reserve reinforcements, and encounter completion.

Current encounter constraints and trigger support are documented in [Combat Mechanics](COMBAT_MECHANICS.md) and the [Step 8 report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md).

## Readiness and deterministic randomness

The preferred threshold scheduler models readiness as continuous time. Scheduler state belongs to `state.scheduler`; the legacy fixed-step scheduler remains available for comparisons. Use `structuredClone(state)` for previews because the threshold ready queue contains actor references.

Combat randomness is stored as plain data in `state.rng` and exposed to battle-scoped systems through the injected `random()` function. Preserve the number and order of random draws when refactoring existing behavior. Player random-policy selection uses its own RNG so it does not perturb the battle RNG.

## Events

`core/eventBus.js` provides synchronous subscriptions. `core/combatEvents.js` validates typed event payloads. Events contain serializable IDs and values, not live actor objects. `Log` events retain the readable text stream.

The vocabulary includes battle, round, turn, action, skill, basic attack, damage, healing, shield, status, incapacitation, summon, formation, reserve deployment, encounter, wave, reinforcement, and completion events. See the [Step 4 report](../history/milestones/STEP4_TYPED_COMBAT_EVENTS.md) and [Step 8 report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md) for milestone-specific catalogs.

Known analytics limit: `DamageApplied` does not currently identify the source actor, so the simulator reports damage received by targets rather than damage dealt by source actor.

## Data authority

Runtime behavior is defined by executable code, data definitions, and automated tests. `references/characterTerraData.js` is a compact owner-reference extract of selected skill objects and stat information; it is not a full roster and is not imported by the engine. The owner maintains the separate website-facing data. Do not create a duplicate `ref/` directory or include the full original JSON in project packages.
