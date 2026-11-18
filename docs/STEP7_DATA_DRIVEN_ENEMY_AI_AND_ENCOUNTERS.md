# Step 7 — Data-Driven Enemy AI and Encounter Definitions

## Goal

Separate enemy archetype data, AI decision policy and encounter composition from engine code. Preserve the existing Training Ground battle behavior while making it possible to assemble other encounters from registered enemy definitions.

## Enemy archetypes

All five existing training enemies now have definitions in `data/enemies/`:

- `trainingDrone.js`
- `rogueAutomaton.js`
- `siegeTurret.js`
- `reconDrone.js`
- `toxicStalker.js`

Each definition owns the enemy ID, display name, mastery, base stats, AI policy key and (where applicable) skill-set key. `characters/enemies.js` builds runtime actors from these definitions through the common actor factory.

## Data-driven AI policies

Policies live in `data/enemyAI/`. The policy evaluator in `ai/enemyAI.js` supports these reusable conditions:

- `skillReady`: the registered skill exists and is off cooldown/usable.
- `hpRatioAtMost`: actor current HP divided by max HP is at or below a threshold.
- `targetMissingStatus`: the current target does not have a specified status.
- `chance`: a seeded random chance check.

Actions currently support a skill or a basic attack, optionally against the current target. Rules are evaluated in listed order; a fallback action applies when no rule matches.

The Training Drone's Pulse Shot check and Rogue Automaton's Overload/Scan/Heavy Strike priorities retain their previous order and probability checks. In particular, chance checks are only consumed when earlier conditions in that rule pass, preserving seeded random-call order and existing golden transcripts. Siege Turret, Recon Drone and Toxic Stalker use the declarative `basicOnly` policy; no new skills or behavior were invented for them.

## Encounter definitions

Encounter compositions live in `data/encounters/`:

- `trainingGround`: the original five-enemy roster, unchanged.
- `droneCalibration`: an alternate five-unit composition emphasizing drone behavior.

Use `createEncounterEnemies(encounterId)` to create an encounter roster. `createTrainingEnemies()` remains as a backwards-compatible wrapper for existing tests and tools. The current formation engine requires at least five combatants per side, so encounter definitions must currently contain at least five enemy entries. Repeated archetype IDs are allowed and produce separate runtime actors.

`createBattle({ encounter: "droneCalibration" })` and `playHeadless({ encounter: "droneCalibration" })` select an encounter. The simulator accepts `--encounter trainingGround|droneCalibration`.

Example:

```bash
node tools/simulate.js --battles 100 --seed 42 --encounter droneCalibration
```

## Validation

`test/enemyDataAndEncounter.test.js` validates all enemy archetypes and AI policies, verifies encounter references and runs an alternate encounter to completion. Simulator tests cover encounter selection. The existing golden transcript and full regression suite verify that the default Training Ground remains deterministic and behavior-compatible.

Run all tests with:

```bash
node --test
```

## Current limitations

- The battle formation setup currently requires at least five combatants on each side; smaller encounters are not yet supported.
- AI condition/action vocabulary is intentionally small. More sophisticated target scoring, team coordination, phases, telegraphs and reinforcement triggers remain future extensions.
- Enemy stats are data-driven but not yet stage-scaled or level-scaled.
- Encounter definitions currently specify ordered enemy archetype IDs only; per-instance stat overrides, waves and scripted spawn timing are not implemented.
