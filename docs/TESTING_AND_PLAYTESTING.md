# Testing & Playtesting

## Automated test command

```bash
node --test
```

Current test file: `test/thresholdCombatReadiness.test.js`.

## Current verified test inventory (18)

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

## Playtest matrix

| Scenario | Purpose | Status |
|---|---|---|
| 5 Falcon vs 5 enemies, threshold | Current baseline battle | Manual testing needed |
| Same 5v5, legacy | Scheduler comparison | Manual testing needed |
| 4v5 | Numerical disadvantage / formation limit | Earlier experiment |
| Roster > active limit | Reserve queue and auto replacement | Existing mechanics; more integration tests needed |
| Active agent downed with reserve | Replacement slot and CR reset | More integration tests needed |
| Manual reserve switch | Player formation control | Scheduler unit test exists |
| Summon present/expired | Temporary actor lifecycle | Scheduler-adjacent test exists |
| SPD buff/debuff | Time-order response | Unit test exists; battle balance test needed |
| CR-pull skill | Ready queue and tie handling | Scheduler tests cover behavior; skill not yet present |
| Clone state for turn-order preview | GUI prediction foundation | Unit test exists |

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
Random seed (if available):
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
- [ ] Confirm source and documentation agree on `maxActive`.
