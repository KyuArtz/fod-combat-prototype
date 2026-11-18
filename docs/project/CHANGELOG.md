# Changelog

This file records notable implementation milestones. Detailed historical scope and test notes are linked from the [documentation index](../README.md). Git history remains the authoritative record of individual commits.

## 2026-11-18 — Documentation and codebase baseline audit

- Reorganized documentation into project guidance, technical references, and historical milestone reports; added a documentation index and audit record, and repaired internal navigation.
- Reconciled current-state documentation with the Step 9 implementation and the current `references/` layout; removed obsolete `ref/` and deferred-mechanics statements.
- Split the skill runtime into `core/skillInterpreter.js` (execution orchestration), `core/skillLifecycle.js` (passive/summon lifecycle), `core/skillEffects.js` (effect handlers), `core/skillDataValidation.js` (definition validation), and `core/skillMessages.js` (message formatting). Public exports from `core/skillInterpreter.js` remain compatible.
- Added `package.json` scripts, Node engine requirements, `.gitignore`, `.editorconfig`, and `.gitattributes`.
- Removed unlabelled generated simulator result files from the source bundle and documented the local `reports/` workflow.
- **Verification:** 202 tests passed before and after the skill-runtime split.

## 2026-11-17 — Step 9: Falcon mechanics finalization

- Finalized the previously underspecified Falcon mechanics using owner-approved implementation values: Meo-v9 Final Protocol, Nanotech Singularity DoT, Catalyst Wing lifecycle, Zackry next-attack Accuracy, and Jazen Stagger readiness delay.
- Added focused regression coverage and synchronized the current implementation guide with executable behavior.
- Falcon runtime base stats remain prototype values; stat-sheet synchronization is a separate open decision.

## 2026-11-17 — Step 8: encounter progression, waves, and reinforcements

- Added multi-wave encounter definitions, per-instance enemy stat overrides, unique instance IDs, and defeat-count-triggered reinforcement groups.
- Integrated reinforcement deployment with the existing enemy reserve/replacement path.
- Added encounter/wave lifecycle events, completion callback, reward metadata, simulator metrics, and the `siegeBreakthrough` example.
- Reward distribution and persistent progression were not added.
- Historical details: [Step 8 report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md).

## 2026-11-16 — Step 7: data-driven enemy AI and encounters

- Moved all five enemy archetypes/stats into `data/enemies/`, AI rules into `data/enemyAI/`, and encounter compositions into `data/encounters/`.
- Added a reusable ordered-rule evaluator while preserving the original Training Drone and Rogue Automaton decision priorities and random-roll order.
- Added Training Ground and Drone Calibration encounter definitions.
- Historical details: [Step 7 report](../history/milestones/STEP7_DATA_DRIVEN_ENEMY_AI_AND_ENCOUNTERS.md).

## 2026-11-16 — Step 6: data-driven enemy skills

- Migrated Training Drone Pulse Shot and Rogue Automaton Overload, Scan, and Heavy Strike to declarative data executed by the shared skill interpreter.
- Kept enemy AI decision policy separate from skill effect definitions.
- Historical details: [Step 6 report](../history/milestones/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md).

## 2026-11-16 — Step 5: headless simulator

- Added seeded batch simulation with configurable scheduler, opening policy, player policy, and table/JSON/CSV reports.
- Added aggregate and per-battle combat metrics and simulator regression tests.
- Historical details: [Step 5 report](../history/milestones/STEP5_HEADLESS_SIMULATOR.md).

## 2026-11-16 — Step 4: typed combat events

- Added a validated typed event contract alongside readable combat logs.
- Added structured events for battle/round/turn lifecycle, actions, damage, healing, shields, statuses, summons, formation changes, and battle completion.
- Replaced the full original reference JSON in the project package with the selected `references/characterTerraData.js` extract.
- Historical details: [Step 4 report](../history/milestones/STEP4_TYPED_COMBAT_EVENTS.md).

## 2026-11-16 — Step 3: full-battle regression coverage

- Expanded complete-battle tests for Falcon skills/passives, enemy AI interactions, victory/defeat, status and cooldown timing, switching, reserves, and deterministic replay.
- Historical details: [Step 3 report](../history/milestones/STEP3_FULL_BATTLE_REGRESSION.md).

## 2026-11-16 — Falcon skill data migration and owner-reference alignment

- Migrated the five Falcon skill sets to declarative data and a shared interpreter.
- Aligned names, costs, cooldowns, and specified mechanics to the compact owner-reference extract; later Step 9 decisions finalized previously missing values.
- Added passive lifecycle hooks and focused skill-data validation.
- Historical details: [Falcon skill migration](../history/milestones/FALCON_SKILL_MIGRATION.md).

## 2026-11-16 — Shared basic-attack resolution

- Added `core/actionResolver.js` as the shared basic-attack execution path for player and enemy actors.
- Preserved side-specific evasion and retaliation behavior and existing seeded RNG consumption.

## 2026-11-07 — Controller-driven turns and deterministic replay

- Added plain-data turn views, decision validation, controller injection, scripted/random controllers, and decision recording.
- Preserved terminal behavior with golden transcript fixtures.

## 2026-11-07 — Seeded RNG, event bus, and opening initiative

- Added battle-local seeded randomness and a synchronous event bus.
- Added player-first PvE opening initiative while retaining pure speed order as an option.

## 2026-11-07 — Threshold scheduler baseline

- Established the continuous-time threshold scheduler as preferred while retaining the legacy scheduler for comparison.
- Added stable tie handling and scheduler-state isolation.
