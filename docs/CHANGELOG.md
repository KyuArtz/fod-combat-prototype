# Changelog

This changelog records notable project decisions and implementation milestones. It is not a substitute for Git history.

## 2026-11-07 — Step 2: controller interface, decisions and replays

**Branch:** `development` (not committed at time of writing)

- **Before touching the turn flow:** recorded 5 golden transcripts (full terminal battles, seeded chaos input, 20k to 29k lines each) from the pre-controller build and added `test/goldenTranscripts.test.js` plus `tools/updateGolden.js` (see ADR-012).
- Added `core/turnView.js` (plain-data turn view, view ids), `core/decisions.js` (`validateDecision`), `core/turnRunner.js` (view, controller, validate, execute, retry) and `core/controllers.js` (scripted, basic-attack and random controllers, decision recorder). See ADR-011.
- `ui/battleMenu.js` is now the **terminal controller**: it prints the same menus and prompts, returns decisions, and no longer executes anything. Skills in `characters/skills.js` are declarative (`targeting`, `modes`, `run`) with no prompting. `ai/enemyAI.js` is split into `decide` (same roll order as before) and `useSkill` / `basicAttack`; `enemyAI.controller` is the built-in enemy controller.
- `createBattle` gained `controllers` (`player`, `enemy`, `summon`) and `partyOrder` (skips the formation prompts). The readline interface is now created lazily, so fully headless battles never touch stdin. New events: `FormationSelected`, `ActionChosen`, `DecisionRejected`.
- `core/turnEngine.js` takes an optional `takeTurn`; the old `playerTurn` / `enemyTurn` / `meoTurn` parameters still work for callers that supply them.
- `tools/compareSchedulers.js` now uses a headless player (`tools/lib/headless.js`) instead of scripted stdin.
- **Verification:** the 5 golden transcripts matched byte for byte on the first run after the refactor; real `node index.js` output was identical before and after for seeds 7, 21 and 33 (about 63,000 lines); `compareSchedulers` output was identical to the pre-refactor baseline (all rows). Mutation checks: a one-word menu change, a swap of two enemy random rolls, and a validator that accepts everything are all caught by the tests.
- **Replays:** a terminal battle recorded with `createDecisionRecorder` is reproduced exactly by seed + `partyOrder` + `createScriptedController` (same final unit states and random-number state), including a battle with party switching. Drift fails loudly with the decision number.
- **Tests:** `node --test` -> **84/84 passing** (52 before + 5 golden + 14 turn view/decisions + 13 controllers). Includes a 60-battle fuzz run with random player and enemy controllers: no illegal actions, all battles finish.
- Moved test helpers out of `test/` (Node ran the helper as a test and over-counted).
- **Known limitations:** player and enemy `basic` attacks still use separate code; summon behaviour is a single `summonAuto` decision; the terminal controller still writes two menu-only messages ("No valid target selected.", "Invalid formation slot.") into `state.log`, as before.
- **Next:** step 3, data-driven skills with an effect interpreter, migrated one skill at a time against the golden transcripts; consider per-turn scheduler logging for balance analysis.

## 2026-11-07 — Legacy comparison and player-first opening initiative

**Branch:** `development` (not committed at time of writing)

- **Legacy vs threshold on the real 5v5 roster (scheduler only, 800 turns):** legacy 706 time-order errors, worst turn-count error 27.6 (Zenki 138 turns, Recon Drone 137, most others about 68 to 69, Siege Turret 45); threshold 0 errors, worst error 0.6, turn counts match SPD (ally share 54.6%). Legacy gives every unit with SPD 50 to 99 the same turn rate and SPD 100+ units double.
- **Seeded full battles (120 seeds, identical choices, scripted player):** legacy 10.36 average rounds, threshold 8.96; no back-to-back turns in either. The scripted "always option 1" policy makes absolute win rates and per-unit counts uninformative; only row-to-row differences are meaningful.
- **Finding:** under legacy Zenki opened 120/120 battles only by array-order accident (Zenki and Recon Drone both clamp to CR 100 on tick 1). Under threshold Recon Drone opened 120/120 because SPD 115 beats 110. This explains the "Recon attacks first after party selection" playtest observation.
- Added `systems/openingInitiative.js` and the `openingInitiative` battle option (`"player-first"` default, `"speed"`), `FOD_OPENING` in `index.js`, an `OpeningInitiative` event, and a log line "The Falcon team seizes the initiative!" when it applies. See ADR-010.
- Real roster: head start delta about 0.0395 time units (Zenki +4.35 CR); opening is now Zenki, Recon Drone, Elishia, Zackry, Toxic Stalker, Evalete, Jazen, Training Drone, Rogue Automaton, Recon Drone. Effect on threshold battles (120 seeds): average rounds 8.96 -> 8.56, average turns 93.2 -> 92.3, ally turn share 64.1% -> 65.0%. Legacy is unchanged.
- Added `tools/compareSchedulers.js` (`node tools/compareSchedulers.js [battles]`) to reproduce both comparisons.
- Added `test/openingInitiative.test.js` (12). Fixed a test assumption in `test/determinism.test.js`: event `seq` is shared by all event types, so it is contiguous across all events, not across `Log` events alone.
- **Tests:** `node --test` -> **52/52 passing** (18 scheduler + 22 RNG/event bus/determinism + 12 opening initiative). The full-battle opening test was confirmed to fail when the rule is disabled by default. Real `index.js` checked: default opens with the player; `FOD_OPENING=speed` lets an enemy act first; an unknown value gives a clear error.
- **Known limitations:** the head start is applied to all living allies at battle start only (no mid-battle or per-stage initiative yet); PvP and ambush policy undecided; a hand-played legacy 5v5 log has not been collected for comparison.
- **Next:** step 2 controller interface; consider logging scheduler time and effective SPD per turn.

## 2026-11-07 — Step 1: seeded RNG and event bus

**Branch:** `development` (not committed at time of writing)

- Added `core/rng.js`: seeded mulberry32 RNG whose state is plain data on `state.rng` (`{ seed, state }`), so cloned state continues the same rolls.
- Replaced `Math.random()` in `systems/damage.js` (crits) and `ai/enemyAI.js` (enemy skill chances, evasion check) with the battle's seeded `random()`. `Math.random` remains only as a default-parameter fallback.
- Added `createBattle({ seed })` and `FOD_SEED` in `index.js`; the seed is printed as `Seed: N` at battle start. Invalid seeds throw a clear error.
- Added `core/eventBus.js` (synchronous `on` / `onAny` / `emit`, plain-data events with `seq`).
- `say()` now emits `Log` events; the terminal printer subscribes in `ui/battleLog.js`. `createBattle` returns `events`. Console output is otherwise unchanged apart from the new `Seed:` line.
- Added tests: `test/rng.test.js` (8), `test/eventBus.test.js` (7), `test/determinism.test.js` (7).
- **Tests:** `node --test` → **40/40 passing** (18 scheduler + 22 new).
- **Verification beyond unit tests:** drove the real `index.js` interactively; `FOD_SEED=7` produced byte-identical output on two runs and a different battle for seed 8. The replay test was confirmed to fail if the old `Math.random` code is swapped back in.
- **Source reconciliation:** `maxActive` is 5 for both parties in source; earlier "snapshot says 4" caveats are resolved.
- **5v5 scheduler check (threshold, real 10-unit roster, 800 scheduler turns):** 0 time-order inversions, 0 back-to-back turns, worst turn-count error 0.64 vs SPD share, first cycle in SPD order (Recon Drone, Zenki, Elishia, Zackry, Toxic Stalker, Evalete, Jazen, Training Drone, Rogue Automaton).
- **Playtest outcome (`battle-log-threshold-5v5.txt`):** VICTORY in 3 rounds (~50 inferred turns, enemy turns inferred from action lines); no adjacent same-actor turns; opening order matched SPD. Later order differs from the SPD-only ideal in places, consistent with active SPD buffs/debuffs but not provable from the log (effective SPD is not logged).
- **Known limitations:** replay needs the same menu choices (choices are not recorded yet); only `Log` events exist so far; redirected stdin stops at the first prompt (readline behavior, also in the original code).
- **Next:** step 2 controller interface (`playerTurn` / `enemyAI` as interchangeable controllers), then data-driven skills, typed events, headless simulator. Consider logging scheduler time and effective SPD per turn for balance analysis.

## 2026-11-07 — Documentation baseline / threshold scheduler hardening

- Documented threshold scheduler as preferred implementation.
- Captured scheduler comparison against legacy and an external patch review.
- Recorded scheduler state on `state.scheduler` for cloned-state previews.
- Recorded CR-pull ready-queue order: CR, effective SPD, stable actor key.
- Added/verified formation-order-independent tie behavior and rotating tie cursor.
- Added long-run real-roster and randomized SPD/time-order checks.
- Test suite verified from supplied ZIP: **18/18 passing**.
- Development branch testing moved from 4v5 to **5v5** per project owner.
- Reserve logic remains in place; no reserve members are held when all five Falcon agents are active.
- Future agent leveling and stage mechanics remain planned.

## Earlier scheduler comparison (reported)

- Legacy: 351 incorrect time-order selections out of 440 real-roster turns; Zenki 132 turns.
- Threshold: 0 incorrect time-order selections; Zenki 110 turns, matching SPD share.
- Claude patch: also corrected time ordering but lacked formation-independent tie rotation; threshold was retained.

## Changelog discipline

For every future milestone, add:

- Date and branch/commit.
- Added/changed/removed behavior.
- Reason or issue addressed.
- Tests run and results.
- Playtest outcome.
- Known limitations and next steps.
