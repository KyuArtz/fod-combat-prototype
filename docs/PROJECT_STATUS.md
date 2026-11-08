# Project Status & Snapshot

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Documentation baseline:** 2026-11-07  
**Branch workflow:** `main` (stable) / `development` (experiments)  
**Primary runtime:** Node.js CLI  
**Current scheduler choice:** Threshold scheduler  
**Latest reported playtest formation:** 5 active Falcon agents vs. 5 active enemies

## Executive summary

The prototype is a modular, terminal-driven turn-based combat sandbox. It currently includes:

- Five playable Falcon agents and five training enemies.
- Formation selection, active party/reserve representation, manual party switching, and automatic reserve replacement.
- Physical and mastery damage calculation, critical hits, evasion, shields, status effects, cooldowns, MP recovery, and summon support.
- Enemy AI with basic attacks and several enemy-specific actions.
- Two readiness schedulers: legacy fixed-step CR and threshold/continuous-time readiness.
- An environment-variable switch for scheduler A/B testing.
- Seeded, replayable randomness (`FOD_SEED`, `Seed: N` printed at battle start) and an event bus that carries battle log lines (`Log` events).
- A player-first opening initiative for PvE (`FOD_OPENING=player-first|speed`), so the player acts first even though the fastest 5v5 unit is an enemy.
- Automated tests for threshold scheduler correctness, tie handling, cloned-state preview, and related battle integration.

## Current configuration (latest user-reported development state)

| Side | Roster | Active | Reserve |
|---|---:|---:|---:|
| Falcon | 5 | 5 | 0 |
| Enemies | 5 | 5 | 0 |

Reserve/formation functionality is **not removed**. It is simply unused when all five Falcon roster members are deployed. It becomes relevant again if the roster grows beyond the active limit or the active limit is lowered.

## Snapshot reconciliation (resolved 2026-11-07)

An earlier snapshot had Falcon `maxActive: 4`. The current source sets `maxActive: 5` for both `party` and `enemyParty`, matching the 5v5 development setup. Source and documentation now agree.

## Scheduler decision

**Keep threshold as the preferred implementation.** The legacy scheduler remains available for comparison and regression experiments.

Reported comparison (Claude's test report; not independently reproduced here):

| Measure | Legacy | Threshold | Claude patch |
|---|---:|---:|---:|
| Incorrect time-order selections, real roster / 440 turns | 351 | 0 | 0 |
| Zenki turns / 440 | 132 | 110 | 110 |
| Random-roster back-to-back turns per 100 | 1.14 | 0.05 | 0.05 |
| Worst random turn-count error vs SPD share | 15.4 | 0.52 | 0.52 |
| Formation-order independent | No | Yes | No |
| Equal-SPD tie rotation | No | Yes | No |

The project owner selected the threshold scheduler and incorporated improvements inspired by the comparison rather than replacing the project scheduler with Claude's patch.

## Legacy vs threshold on the 5v5 roster (measured 2026-11-07)

Reproduce with `node tools/compareSchedulers.js`.

| Measure (real 10-unit roster, scheduler only, 800 turns) | Legacy | Threshold |
|---|---:|---:|
| Time-order errors | 706 | 0 |
| Worst turn-count error vs SPD share | 27.6 (Zenki) | 0.6 |
| Ally share of turns (SPD share 54.6%) | 51.8% | 54.6% |
| Zenki / Recon Drone / Elishia turns | 138 / 137 / 69 | 111 / 116 / 96 |

| Measure (120 seeded battles, scripted player) | Legacy | Threshold, speed order | Threshold, player-first |
|---|---:|---:|---:|
| Player acts first | 100% (array-order accident) | 0% (Recon Drone opens) | 100% |
| Average rounds | 10.36 | 8.96 | 8.56 |
| Average turns | 97.8 | 93.2 | 92.3 |
| Ally share of turns | 61.1% | 64.1% | 65.0% |

The scripted player always picks option 1, so only differences between columns are meaningful, not absolute win rates.

## Verification performed against uploaded ZIP

Command: `node --test`

Result: **52 tests passed, 0 failed** (2026-11-07): scheduler 18, RNG 8, event bus 7, battle determinism 7, opening initiative 12.

The determinism tests play a full scripted 5v5 battle to completion, but the suite still does not prove every battle, AI, skill, damage, or formation scenario is correct.

5v5 scheduler check (threshold, real 10-unit roster, 800 scheduler turns): 0 time-order inversions, 0 back-to-back turns, worst turn-count error 0.64 versus SPD share; allies take 54.6% of turns, equal to their SPD share (435 of 797 total SPD). The fastest unit in the game is an enemy (Recon Drone, SPD 115), ahead of Zenki (110).

## Known limitations / caveats

- No package manifest is present in the inspected ZIP; commands use Node's built-in runtime/test runner.
- Combat is currently terminal/CLI driven.
- Battles are reproducible from the printed seed plus identical menu choices. Menu choices are not recorded yet, so a replay must be re-entered by hand or driven by a script.
- Skill balance and SPD economy need additional playtesting.
- Full 5v5 end-to-end regression tests are not yet represented by the scheduler test suite.
- Leveling, stage progression, reward systems, and persistent agent progression are future work—not implemented features.
