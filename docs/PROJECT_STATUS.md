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
- Automated tests for threshold scheduler correctness, tie handling, cloned-state preview, and related battle integration.

## Current configuration (latest user-reported development state)

| Side | Roster | Active | Reserve |
|---|---:|---:|---:|
| Falcon | 5 | 5 | 0 |
| Enemies | 5 | 5 | 0 |

Reserve/formation functionality is **not removed**. It is simply unused when all five Falcon roster members are deployed. It becomes relevant again if the roster grows beyond the active limit or the active limit is lowered.

## Important snapshot discrepancy

The ZIP inspected for this documentation has `core/battleState.js` configured as:

```js
party: { roster: [], active: [], reserve: [], maxActive: 4 },
enemyParty: { roster: [], active: [], reserve: [], maxActive: 5 },
```

The conversation's latest update says Falcon is now also at five active. This means one of the following is true:

1. The latest 5v5 change was made after the ZIP was created; or
2. The ZIP does not contain the latest `development` commit.

**Action:** Confirm/update `party.maxActive` to `5` in the current `development` source and refresh this documentation snapshot after the next upload.

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

## Verification performed against uploaded ZIP

Command: `node --test`

Result: **18 tests passed, 0 failed** (2026-11-07 review).

These tests are scheduler-focused. They do not prove every battle, AI, skill, damage, or formation scenario is correct.

## Known limitations / caveats

- No package manifest is present in the inspected ZIP; commands use Node's built-in runtime/test runner.
- Combat is currently terminal/CLI driven.
- Enemy actions include randomness; test logs are not deterministic unless random behavior is controlled.
- Skill balance and SPD economy need additional playtesting.
- Full 5v5 end-to-end regression tests are not yet represented by the scheduler test suite.
- Leveling, stage progression, reward systems, and persistent agent progression are future work—not implemented features.
