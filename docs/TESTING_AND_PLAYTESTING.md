# Testing & Playtesting

## Automated test command

```bash
node --test
```

Current test files: `test/thresholdCombatReadiness.test.js`, `test/rng.test.js`, `test/eventBus.test.js`, `test/determinism.test.js`, `test/openingInitiative.test.js`, `test/goldenTranscripts.test.js`, `test/turnViewAndDecisions.test.js`, `test/controllers.test.js` (**84 tests, all passing** as of 2026-11-07). Test helpers live in `tools/lib/` (not in `test/`, because Node would run them as tests).

## Current verified test inventory (84)

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

### Opening initiative (`openingInitiative.test.js`, 12)

1. Documents the problem: with pure SPD order the enemy Recon Drone opens the real 5v5 battle.
2. Player-first: Zenki opens, then Recon Drone; the rest of the opening cycle is unchanged.
3. Head start equals the readiness gap (plus margin), scaled by each ally's SPD; enemies untouched; no ally starts ready.
4. Long-run turn counts stay SPD-proportional and in (shifted) time order over 800 turns.
5. No-op when allies are already faster.
6. An exact speed tie goes to the player regardless of array order or tie rotation.
7. The legacy scheduler also opens with the player once the rule is applied.
8. Summons and downed units are ignored when finding the fastest unit.
9. `firstSide` can be flipped for future ambush encounters; invalid sides throw.
10. Full seeded battles: the player acts first across seeds; the log line appears once; the event payload is plain data.
11. `openingInitiative: "speed"` keeps pure SPD order and logs nothing extra.
12. Unknown option values are rejected before anything starts.

### Golden transcripts (`goldenTranscripts.test.js`, 5)

Five full terminal battles (seeds 101, 202, 303, 404, 505; the last three with 3 active + 2 reserve) driven by seeded random-digit input, including invalid choices, unavailable skills, party switching (valid and invalid slots), all three Nano Swarm modes, every enemy skill, retaliation, Meo-9 and Singularity. Each must reproduce the recorded transcript (every prompt, answer and output line) byte for byte. They were recorded from the pre-controller build.

### Turn view and decisions (`turnViewAndDecisions.test.js`, 14)

1. Valid decisions of every shape are accepted.
2. Malformed or unknown decisions are rejected with a reason.
3. Targets must be present and legal for the action.
4. Skills must exist and be usable; modes must be valid and match their target rules.
5. Switch decisions need a living reserve and a real active slot.
6. Actions the actor does not have are rejected (an enemy cannot switch, a player cannot pass).
7. Enemy skills follow the same usable/target rules.
8. View ids: unique ids stay as they are; duplicates get `#n` and round-trip.
9. Reserves can be found by id although they are not deployed.
10. Every skill in the registry is declarative (targeting, `run`, consistent modes, no legacy `use`).
11. Terminal controller: basic attack with target choice.
12. Terminal controller: Nano Swarm Repair and Decoy.
13. Terminal controller: unavailable skill message, re-prompt, invalid input.
14. Terminal controller: out-of-range target for a skill.

### Controllers (`controllers.test.js`, 13)

1. A fully headless battle never touches stdin.
2. Events: `FormationSelected` once, `ActionChosen` per accepted action, plain-data payloads.
3. Views are plain data with consistent targets (including summon turns and enemy skills).
4. Fuzz: 60 battles with random player and random enemy controllers always finish, with zero rejected decisions.
5. The enemy controller is interchangeable (a custom enemy never uses the built-in AI skills).
6. Replay of a terminal 5v5 battle is exact (engine log, final unit states, random-number state).
7. Replay of a terminal battle with party switching is exact.
8. Recorded decisions survive a JSON round trip.
9. A drifted or exhausted replay fails loudly with the decision number.
10. An invalid decision is rejected with a reason and the controller is asked again.
11. A controller that never produces a legal action stops the battle with a clear error after 10 attempts.
12. Controllers may be plain functions and may be async.
13. Option validation: unknown controller names, non-controllers and bad party orders.

## Playtest matrix

| Scenario | Purpose | Status |
|---|---|---|
| 5 Falcon vs 5 enemies, threshold | Current baseline battle | Played once (2026-11-07 log): VICTORY, 3 rounds, no back-to-back turns, Recon Drone (enemy) opened, which led to the player-first rule (see ADR-010); more runs and seeds needed |
| Same 5v5, legacy | Scheduler comparison | Compared via scripted seeded battles and the fixed roster (see below); a hand-played legacy 5v5 log has not been collected |
| 4v5 | Numerical disadvantage / formation limit | Earlier experiment |
| Roster > active limit | Reserve queue and auto replacement | Existing mechanics; more integration tests needed |
| Active agent downed with reserve | Replacement slot and CR reset | More integration tests needed |
| Manual reserve switch | Player formation control | Scheduler unit test exists |
| Summon present/expired | Temporary actor lifecycle | Scheduler-adjacent test exists |
| SPD buff/debuff | Time-order response | Unit test exists; battle balance test needed |
| CR-pull skill | Ready queue and tie handling | Scheduler tests cover behavior; skill not yet present |
| Clone state for turn-order preview | GUI prediction foundation | Unit test exists |

## Scripted comparison tool

`node tools/compareSchedulers.js [battles]` runs (1) the real 5v5 roster through each scheduler by itself and (2) full seeded battles with a headless player (basic attack on the first enemy every turn, the same policy as answering "1" to every menu) for legacy and threshold, with and without the player-first opening. Use it to check scheduler or opening-rule changes. Only differences between rows are meaningful; the scripted policy says little about absolute balance.

## Golden transcripts

`test/goldenTranscripts.test.js` is the safety net for changes to the turn flow, menu text, prompt order or enemy random rolls. If it fails after a refactor, behavior changed. If the change is intentional (new menu text, new prompts, rebalanced numbers), regenerate with `node tools/updateGolden.js`, review what changed, and record it in the changelog. The fixtures are gzipped transcripts in `test/fixtures/golden/`.

## Playing without a terminal

`tools/lib/headless.js` exports `playHeadless({ seed, controllers, partyOrder, maxActive, scheduler, openingInitiative, events })`, a full battle with no prompts. `core/controllers.js` provides `createBasicAttackController`, `createRandomController({ seed, allowSwitch })` and `createScriptedController(decisions)`. Use them for scheduler experiments, fuzzing and replays.

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
- [ ] Test victory and defeat conditions.
- [ ] Test downed agents and reserve replacement if reserves exist.
- [ ] Check status effects, cooldowns, shields, MP and summons.
- [ ] Review logs for SPD fairness and unintended loops.
- [ ] Update changelog and status docs.
- [ ] Confirm source and documentation agree on `maxActive` (5 for both parties as of 2026-11-07).
