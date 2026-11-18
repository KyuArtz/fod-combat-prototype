# Step 6 — Data-Driven Enemy Skills

## Goal

Move the training encounter's existing enemy skills out of imperative branches in `ai/enemyAI.js` and into declarative definitions executed by the same `core/skillInterpreter.js` used by Falcon. Keep AI decision policy separate from skill rules.

## What changed

- Added `data/enemySkills/trainingDrone.js` with Pulse Shot.
- Added `data/enemySkills/rogueAutomaton.js` with Overload, Scan and Heavy Strike.
- Extended the shared interpreter with `physicalHit`, allowing data-defined physical attacks to use the common damage calculation and damage-application path.
- `characters/skills.js` now assembles separate playable-character and enemy skill registries through the same interpreter. Enemy definitions are exposed as `enemySkills` keyed by each enemy's `skillSet`.
- `characters/enemies.js` assigns the corresponding skill-set key to the Training Drone and Rogue Automaton.
- `ai/enemyAI.js` now reads skill names, targeting and readiness from the data registry and executes the selected definition through the shared interpreter.
- Enemy AI retains its existing policy: Training Drone's 25% Pulse Shot check; Rogue Automaton's low-HP Overload priority, 35% Scan check and 40% Heavy Strike check. Random decision checks remain in their original order.

## Behavior preserved

| Enemy | Skill | MP | Cooldown | Effect |
|---|---|---:|---:|---|
| Training Drone | Pulse Shot | 0 | 3 | Physical hit at 1.35 power; cannot crit |
| Rogue Automaton | Overload | 0 | 5 | Self ATK +25% for 2 turns |
| Rogue Automaton | Scan | 0 | 4 | Target DEF −15% for 2 turns |
| Rogue Automaton | Heavy Strike | 0 | 3 | Physical hit at 1.5 power; can crit |

Enemy AI still chooses *when* and *which* skill to use. Declarative skill data owns the skill's key, display name, cost, cooldown, targeting, effects and combat message. All four enemy skills continue through ordinary enemy-skill decision validation and emit the existing `SkillUsed` event.

## Validation

`test/enemySkillData.test.js` validates both enemy data sets and runs each of the four skills through a complete headless battle, including decision validation, shared interpreter execution and event emission. The existing golden transcripts and all previous regression suites remain part of `node --test`.

## Scope and next work

This milestone migrates the skills currently used by the Training Drone and Rogue Automaton. Siege Turret, Recon Drone and Toxic Stalker currently have no registered special skills, so no new behavior is invented for them. Encounter composition, enemy stat data and AI policy are not migrated in this step.
