# Testing & Playtesting

## Automated test command

```bash
node --test
```

Current test files: `test/thresholdCombatReadiness.test.js`, `test/rng.test.js`, `test/eventBus.test.js`, `test/determinism.test.js` (**40 tests, all passing** as of 2026-11-07).

## Current verified test inventory (40)

### Scheduler (`thresholdCombatReadiness.test.js`, 18)

1. Fastest actor reaches readiness first; other actors preserve fractional CR.
2. Equal-SPD tie order is deterministic and independent of formation array order.
3. Faster actors can legitimately take consecutive turns.
4. Resetting one actor does not erase other actors' partial CR.
5. SPD buffs/debuffs change continuous readiness timing.
6. Zero/invalid SPD fails explicitly rather than looping.
7. No living deployed actors returns no next actor.
8. Reserve deployment starts incoming actor at zero CR; incapacitated actors are skipped.
9. Summons are schedulable and expired summons are cleaned up.
10. Manual formation switch resets both actors' CR.
11. Turn-start effects and round bookkeeping remain linked to actual actions.
12. Legacy scheduler remains selectable and preserves fixed-step behavior.
13. Real roster follows SPD time order and turn counts track SPD over a full cycle.
14. Random rosters preserve time order and SPD-share behavior.
15. `structuredClone` scheduler preview predicts the same future sequence.
16. Two battles using one scheduler instance do not share scheduler queue/tie state.
17. CR-pulled actors order by CR, SPD, stable key—not side/name.
18. Equal CR/equal SPD fallback is formation-order independent.

### Seeded RNG (`rng.test.js`, 8)

1. Same seed gives the same sequence; different seeds differ.
2. Golden values lock the algorithm so saved seeds keep replaying the same way.
3. Values stay in [0, 1) and are roughly uniform.
4. `rollPercent`: 0 never succeeds, 100 always does, 25 is about a quarter.
5. RNG state is plain data: `structuredClone` continues the identical sequence.
6. Seeds accept integers and numeric strings and normalise to 32 bits.
7. Invalid seeds throw `TypeError`.
8. An omitted seed is random and recorded so it can be replayed.

### Event bus (`eventBus.test.js`, 7)

1. Typed delivery with payload and increasing `seq`.
2. `onAny` and handler ordering.
3. Unsubscribe, including from inside a handler.
4. Payload cannot override `type` or `seq`.
5. Optional recorded history is structured-clone friendly.
6. No-subscriber emit is fine; bad arguments throw.
7. A throwing handler propagates to the emitter.

### Determinism (`determinism.test.js`, 7)

1. Same seed and same choices replay the exact same full battle.
2. Different seeds produce different battles.
3. The seed is printed and kept on state.
4. Console output, `state.log`, and `Log` events carry the same lines.
5. Cloned battle state continues the same RNG sequence.
6. `createBattleLog` still works without a bus.
7. A second subscriber on a shared bus sees log lines without touching console output.

## Playtest matrix

| Scenario | Purpose | Status |
|---|---|---|
| 5 Falcon vs 5 enemies, threshold | Current baseline battle | Played once (2026-11-07 log): VICTORY, 3 rounds, no back-to-back turns, opening order matched SPD; more runs and seeds needed |
| Same 5v5, legacy | Scheduler comparison | Manual testing needed |
| 4v5 | Numerical disadvantage / formation limit | Earlier experiment |
| Roster > active limit | Reserve queue and auto replacement | Existing mechanics; more integration tests needed |
| Active agent downed with reserve | Replacement slot and CR reset | More integration tests needed |
| Manual reserve switch | Player formation control | Scheduler unit test exists |
| Summon present/expired | Temporary actor lifecycle | Scheduler-adjacent test exists |
| SPD buff/debuff | Time-order response | Unit test exists; battle balance test needed |
| CR-pull skill | Ready queue and tie handling | Scheduler tests cover behavior; skill not yet present |
| Clone state for turn-order preview | GUI prediction foundation | Unit test exists |

## Replaying a battle

```bash
FOD_SEED=12345 node index.js
```

The same seed **and the same menu choices** replay the same battle. Redirecting a file into stdin (`node index.js < answers.txt`) stops at the first prompt because readline drops lines that arrive before a question is asked (also true of the original code); drive prompts interactively or use the harness in `test/determinism.test.js`.

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
- [ ] Test victory and defeat conditions.
- [ ] Test downed agents and reserve replacement if reserves exist.
- [ ] Check status effects, cooldowns, shields, MP and summons.
- [ ] Review logs for SPD fairness and unintended loops.
- [ ] Update changelog and status docs.
- [ ] Confirm source and documentation agree on `maxActive` (5 for both parties as of 2026-11-07).
