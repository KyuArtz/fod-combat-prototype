# Changelog

This changelog records notable project decisions and implementation milestones. It is not a substitute for Git history.

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
