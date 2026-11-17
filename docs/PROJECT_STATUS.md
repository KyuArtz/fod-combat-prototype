# Project Status & Snapshot

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Snapshot:** 2026-11-16  
**Runtime:** Node.js CommonJS CLI  
**Preferred scheduler:** threshold / continuous-time  
**Development encounter:** 5 Falcon agents vs. 5 training enemies

## Executive summary

F.O.D. is a modular, terminal-driven turn-based combat prototype. The engine has a controller-driven turn loop, seeded/replayable randomness, an event bus, two schedulers, shared basic-attack resolution, and data-driven Falcon skills.

The five Falcon skill sets have now been aligned to the owner's character reference. The project bundles only the selected character stats, skill definitions and stat descriptions in `references/characterTerraData.js`; the full original reference file and format are intentionally excluded. The readable design reference is `docs/OWNER_SKILL_REFERENCE.md`.

## Current engine capabilities

- Five playable Falcon agents and five training enemies.
- Active/reserve formation, switching and automatic replacement.
- Physical/mastery damage, critical hits, evasion, shields, adaptive resistance, status effects, cooldowns and MP recovery.
- Threshold and legacy readiness schedulers; threshold is preferred.
- Player-first PvE opening initiative (`FOD_OPENING=player-first|speed`).
- Seeded battle randomness (`FOD_SEED`) and replay from recorded decisions.
- Controller-driven turns: terminal player menu, enemy AI, summon automation, scripted and random controllers.
- One shared basic-attack execution path in `core/actionResolver.js`.
- Five owner-aligned Falcon skill definitions in `data/skills/`, run by `core/skillInterpreter.js`.
- Falcon passive hooks for turn start/end, damage taken, targeting, battle start and defeat events.
- Typed, structured combat events alongside the human-readable `Log` stream; validated event contracts cover turns, rounds, actions, skills, damage, healing, shields, statuses, summons, formation changes, incapacitation and battle completion.

## Current configuration

| Side | Roster | Active | Reserve |
|---|---:|---:|---:|
| Falcon | 5 | 5 | 0 |
| Training enemies | 5 | 5 | 0 |

Reserve mechanics remain implemented; they are simply unused in the standard 5v5 setup.

## Owner-reference alignment

All 20 Falcon active skills now use the owner's names, costs, cooldowns and described mechanics where the source provides enough information. The earlier prototype-only substitutions were replaced.

The following details remain deliberately deferred because the source does not provide the required mechanics:

1. Meo-v9 Final Protocol expiry EMP damage scaling.
2. Nanotech Singularity enemy DoT amount/scaling.
3. Catalyst Wing HP/targetability/destruction trigger for Evalete's emergency shield.
4. A general skill-hit accuracy model; Zackry's +10 Accuracy currently applies to the existing basic-attack accuracy check.

The engine's base Falcon stats remain the prototype values in `characters/falcon.js`; this milestone aligns skills, not the full stat sheet.

## Verification

The test suite includes scheduler, determinism, controller, golden replay, basic-attack, Elishia mechanics, Falcon data validation, owner-aligned skill mechanics and full-battle regression coverage. Run `node --test` from the project root. Latest verification: **178 passed, 0 failed** (includes simulator CLI tests). The exact suite breakdown is in `docs/TESTING_AND_PLAYTESTING.md`.

Golden transcripts were intentionally refreshed because the owner-aligned skill mechanics change battle output and outcomes. They are regression fixtures, not immutable evidence that the old prototype values were correct.

## Known limitations / next work

- Combat remains CLI-driven; no GUI exists.
- Enemy skills remain implemented in `ai/enemyAI.js` and are not data-driven.
- The three underspecified owner mechanics above need owner clarification.
- Step 3 full-battle regression coverage is complete for the current Falcon engine scope. See `docs/STEP3_FULL_BATTLE_REGRESSION.md`.
- Step 4 typed combat events is complete. See `docs/STEP4_TYPED_COMBAT_EVENTS.md` for event names, payload contracts, ordering and known limits.
- Step 5 headless simulator CLI is complete. It runs the same engine across deterministic seed ranges and emits table, JSON or CSV reports; see `docs/STEP5_HEADLESS_SIMULATOR.md` for metrics and caveats.
- Leveling, stage progression, rewards and persistent saves are not implemented.
