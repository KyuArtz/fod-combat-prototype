# Testing & Playtesting

## Automated test command

```bash
node --test
```

Test helpers live in `tools/lib/` (not in `test/`, because Node would run them as tests). The current suite also includes owner-aligned Falcon mechanics, Falcon data validation, shared basic-attack tests, enemy archetype/policy validation and data-defined encounter tests.

## Current verified test inventory (202)

Latest full run: `node --test` -> **202 passed, 0 failed**.

| Suite | Coverage |
|---|---|
| `thresholdCombatReadiness.test.js` | Continuous-time scheduler, tie handling, cloned previews, reserve and turn effects |
| `rng.test.js`, `determinism.test.js` | Seeded random stream, reproducible full battles, cloned RNG state and replay |
| `eventBus.test.js`, `openingInitiative.test.js` | Event delivery, typed event contracts and player-first opening policy |
| `goldenTranscripts.test.js` (5) | Full terminal battles including prompts, switching and battle actions |
| `goldenElishia.test.js` (6) | Elishia-focused seeded battles, final states and logs |
| `skillData.test.js` (6) | Owner-data validation, costs/cooldowns, shared interpreter and flat MP discount |
| `falconSkillData.test.js` (3) | All five Falcon data modules, passive attachment and owner costs/cooldowns |
| `ownerFalconMechanics.test.js` (17) | All five Falcon kits/passives; Catalyst pulse; marks; stagger; taunt; Railshot; Cipher; Ghost and Zero Hour |
| `falconFinalizedMechanics.test.js` (11) | Meo-v9 Final Protocol, Singularity DoT, Catalyst Wing lifecycle, Zackry skill Accuracy, Stagger readiness delay, Recoil threshold and owner JSON/runtime reference synchronization |
| `fullBattleRegression.test.js` (29) | All 20 active skills in real battles; passive interactions; Taunt/Stagger AI behavior; switching/replay; automatic reserve deployment; victory/defeat; shield/cooldown timing |
| `elishiaMechanics.test.js` (24) | Timed Biotech Overdrive, Adaptive Barrier, Meo-v9 scan/cover fire/Emergency Field, Singularity and battle behavior |
| `basicAttack.test.js` (4) | Shared player/enemy basic attack, evasion, retaliation and invalid inputs |
| `turnViewAndDecisions.test.js` | Legal action validation, skill targeting, view IDs and terminal menu |
| `controllers.test.js` | Headless battles, controller fuzzing, decision replay and controller injection |
| `enemyDataAndEncounter.test.js` (3) | Enemy archetype stats, AI policy definitions, encounter references and alternate encounter execution |
| `simulator.test.js` (5) | CLI validation, seeded batch metrics, deterministic reports, CSV output and encounter selection |

Golden fixtures in `test/fixtures/golden/` were intentionally regenerated after the owner-reference skill changes. Their new outputs were reviewed alongside focused mechanics tests; they now protect the owner-aligned behavior rather than the superseded prototype skill values.

## Targeted owner-mechanics coverage

`test/ownerFalconMechanics.test.js` verifies owner-specified Falcon behavior. `test/falconFinalizedMechanics.test.js` verifies the owner-approved implementation additions where the source omitted tuning values: Meo-v9 EMP scaling, Singularity DoT scaling, Catalyst Wing durability/destruction, next-attack skill Accuracy, and Stagger readiness delay. See `docs/FALCON_MECHANICS_FINALIZATION.md` for the exact values.

## Playtest matrix

| Scenario | Purpose | Status |
|---|---|---|
| 5 Falcon vs 5 enemies, threshold | Current baseline battle | Played once (2026-11-07 log): VICTORY, 3 rounds, no back-to-back turns, Recon Drone (enemy) opened, which led to the player-first rule (see ADR-010); more runs and seeds needed |
| Same 5v5, legacy | Scheduler comparison | Compared via scripted seeded battles and the fixed roster (see below); a hand-played legacy 5v5 log has not been collected |
| 4v5 | Numerical disadvantage / formation limit | Earlier experiment |
| Roster > active limit | Reserve queue and auto replacement | Full-battle auto-replacement and manual-switch/replay tests pass |
| Active agent downed with reserve | Replacement slot and CR reset | Full-battle automatic deployment is covered; scheduler tests cover CR reset |
| Manual reserve switch | Player formation control | Full-battle switching and deterministic replay are covered |
| Summon present/expired | Temporary actor lifecycle | Scheduler-adjacent test exists |
| SPD buff/debuff | Time-order response | Unit test exists; battle balance test needed |
| CR-pull skill | Ready queue and tie handling | Scheduler tests cover behavior; skill not yet present |
| Clone state for turn-order preview | GUI prediction foundation | Unit test exists |

## Scripted comparison tool

`node tools/compareSchedulers.js [battles]` runs (1) the real 5v5 roster through each scheduler by itself and (2) full seeded battles with a headless player (basic attack on the first enemy every turn, the same policy as answering "1" to every menu) for legacy and threshold, with and without the player-first opening. Use it to check scheduler or opening-rule changes. Only differences between rows are meaningful; the scripted policy says little about absolute balance.

## Golden transcripts

`test/goldenTranscripts.test.js` (terminal transcripts) and `test/goldenElishia.test.js` (Elishia-dense headless battles) are the safety nets for changes to the turn flow, menu text, prompt order, enemy random rolls and skill behavior. If it fails after a refactor, behavior changed. If the change is intentional (new menu text, new prompts, rebalanced numbers), regenerate with `node tools/updateGolden.js`, review what changed, and record it in the changelog. The fixtures are gzipped transcripts in `test/fixtures/golden/`.

## Playing without a terminal

`tools/lib/headless.js` exports `playHeadless({ seed, controllers, partyOrder, maxActive, scheduler, openingInitiative, encounter, events })`, a full battle with no prompts. `core/controllers.js` provides `createBasicAttackController`, `createRandomController({ seed, allowSwitch })` and `createScriptedController(decisions)`. Use them for scheduler experiments, fuzzing and replays.

## Replaying a battle

```bash
FOD_SEED=12345 node index.js
```

The same seed **and the same menu choices** replay the same battle. Redirecting a file into stdin (`node index.js < answers.txt`) stops at the first prompt because readline drops lines that arrive before a question is asked (also true of the original code); drive prompts interactively, or replay headlessly from recorded decisions (`createDecisionRecorder` + `createScriptedController` with the same seed and `partyOrder`, see `test/controllers.test.js`).

## Suggested metrics to record

- Battle outcome and number of actions.
- Actions per actor / per side.
- Mean and maximum gap between actor turns.
- Damage dealt and received by actor.
- Healing and shield amount.
- MP spent, MP regenerated, cooldown turns.
- Enemy target distribution.
- Reserve replacement/switch count.
- Battle duration in scheduler time and wall-clock time.
- Any unexpected consecutive action or tie ordering.

## Test-log format suggestion

Record at minimum:

```text
Date / commit:
Branch:
Scheduler:
Formation:
Random seed (printed as `Seed: N` at battle start):
Result:
Rounds:
Actions by actor:
Damage totals:
Observed issues:
Expected behavior:
Actual behavior:
Follow-up:
```

## Before merging to main

- [ ] `node --test` passes.
- [ ] Run complete 5v5 threshold encounter.
- [ ] Run complete 5v5 legacy comparison if scheduler behavior is relevant.
- [x] Test victory and defeat conditions.
- [x] Test downed agents and reserve replacement if reserves exist.
- [x] Check status effects, cooldowns, shields and summons with focused and battle-level regression tests; MP recovery remains covered by mechanics tests.
- [ ] Review logs for SPD fairness and unintended loops.
- [ ] Update changelog and status docs.
- [ ] Confirm source and documentation agree on `maxActive` (5 for both parties as of 2026-11-07).


### Falcon skill data migration (`falconSkillData.test.js`, 3)

Validates the Evalete, Zackry, Jazen and Zenki data definitions; pins all 16 skill keys, MP costs and cooldowns; and runs every registered Falcon skill through the shared interpreter with a recording fake battle context. The pre-existing terminal golden transcripts and Elishia golden scenarios remain unchanged and are still required to pass.


## Step 3 full-battle regression suite

See [`STEP3_FULL_BATTLE_REGRESSION.md`](./STEP3_FULL_BATTLE_REGRESSION.md) for the 27 new integration cases, their scope, and the latest verification result.


## Step 5 simulator checks

`test/simulator.test.js` validates simulator argument handling, aggregate/per-battle report metrics, deterministic repeated batches, and CSV output. Run `node tools/simulate.js --battles 100 --seed 1` for a quick balance sample; use `--format json` or `--format csv` to preserve results. Simulator metric semantics and caveats are documented in `docs/STEP5_HEADLESS_SIMULATOR.md`.


## Step 6 enemy skill migration checks

`test/enemySkillData.test.js` validates the Training Drone and Rogue Automaton data definitions and executes Pulse Shot, Overload, Scan and Heavy Strike through complete headless battles. It checks accepted `SkillUsed` events, no rejected decisions and the expected combat log message for each skill.


## Step 7 enemy data and encounter checks

`test/enemyDataAndEncounter.test.js` validates all five enemy archetypes and their AI policy references, validates registered encounter compositions, and completes an alternate Drone Calibration encounter. The simulator accepts `--encounter trainingGround` (default) or `--encounter droneCalibration`; the current battle formation still requires five enemy entries. See `docs/STEP7_DATA_DRIVEN_ENEMY_AI_AND_ENCOUNTERS.md`.


## Step 8 encounter progression checks

`test/encounterProgression.test.js` validates all registered encounter wave/reinforcement data, rejects unsupported triggers and undersized waves, verifies per-instance stat overrides do not mutate archetypes, and runs the two-wave `siegeBreakthrough` battle through reinforcement deployment and the completion callback. Simulator tests verify wave/reinforcement metrics. The simulator accepts `--encounter siegeBreakthrough`; see `docs/STEP8_ENCOUNTER_PROGRESSION.md`. Latest full-suite result: **202 passed, 0 failed**.
