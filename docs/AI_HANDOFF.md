# AI Handoff / Project Continuation Context

Paste this into a future coding assistant session when continuing F.O.D. combat work.

---

You are helping develop the user's **F.O.D. (Fragments of Decay) combat prototype**, a Node.js/CommonJS CLI JRPG battle sandbox. Work should be incremental, source-grounded, and preserve the user's existing architecture.

## Project workflow

- `main` is the stable branch.
- `development` is the active experimental/integration branch.
- Do not assume ZIP/source snapshot equals latest remote commit. Inspect files and branch status first.
- Prefer changes in `development`; do not merge/push unless the user explicitly asks.

## Scheduler

- Preferred scheduler: `systems/thresholdCombatReadiness.js`.
- Legacy comparison: `systems/combatReadiness.js`.
- Select with `FOD_SCHEDULER=threshold|legacy`; default threshold.
- Threshold CR cap is 100 and uses continuous elapsed time based on effective SPD.
- Scheduler state lives in `state.scheduler` (`time`, `tieCursor`, `readyQueue`).
- Use `structuredClone(state)` for scheduler previews; JSON cloning breaks actor references in readyQueue.
- Tie handling: stable actor key + rotating tie cursor.
- CR-pulled ready actors: descending CR, then effective SPD, then stable key.
- Overshoot carry-over is intentionally deferred pending CR manipulation skills.
- Preserve legacy for comparisons unless the owner decides otherwise.

## Current formation/test setup

Current development battle: **5 active Falcon agents vs 5 active enemies (5v5)**. Confirmed in source (2026-11-07): `core/battleState.js` has `maxActive: 5` for both parties. Reserve structure remains implemented; no reserves are held in this setup.

Falcon agents: Elishia, Evalete, Zackry, Jazen, Zenki. Training enemies: Training Drone, Rogue Automaton, Siege Turret, Recon Drone, Toxic Stalker.

## Randomness and events (added 2026-11-07, step 1 of engine/view separation)

- Battle randomness is seeded. `state.rng` is plain data `{ seed, state }` (mulberry32 in `core/rng.js`), so `structuredClone(state)` copies it and cloned previews continue the same rolls.
- `createBattle({ seed })`, or `FOD_SEED=<int>` via `index.js`. Unset = random seed. The seed is printed as `Seed: N` at battle start.
- All engine rolls (crits, enemy evasion check, enemy skill chances) use `random()` from the battle context, which draws from `state.rng`. Do **not** call `Math.random()` in engine code; it remains only as a default parameter fallback in `systems/damage.js` and `ai/enemyAI.js`.
- Replay = seed + the same menu choices. Choices are not recorded yet.
- `core/eventBus.js`: synchronous bus (`on`, `onAny`, `emit`). Events are plain data `{ type, seq, ...payload }`. Handler errors propagate to the emitter.
- `say()` now records to `state.log` and emits a `Log` event (`{ message, round }`); the terminal printer subscribes to it in `ui/battleLog.js`. `createBattle` returns `events` so a GUI, simulator, or test can subscribe.
- Only `Log` events exist so far. Typed events (`DamageDealt`, `TurnStarted`, ...) are planned.
- Redirected stdin (`node index.js < file`) stops at the first prompt (readline limitation, also true of the original code). Drive prompts interactively or use the `createBattle` test harness in `test/determinism.test.js`.

## Opening initiative (added 2026-11-07)

- Problem: with accurate SPD ordering the fastest unit opens the battle, and in 5v5 that is an enemy (Recon Drone 115 vs Zenki 110). The legacy scheduler only opened with the player by accident (clamped ties resolved by array order).
- Rule (`systems/openingInitiative.js`): applied once after both parties are set up, before the first turn. If the enemy's fastest unit would be ready first (or tied), every living non-summon ally gets the same head start in *time* (`cr += SPD * delta`, `delta = tAllyFastest - tEnemyFastest + 1e-6`). Relative SPD order among allies and long-run turn share are unchanged. If allies are already faster, nothing changes.
- Real roster result: delta about 0.0395 time units (Zenki +4.35 CR, other allies about +2.8 to +3.8); opening becomes Zenki, Recon Drone, Elishia, Zackry, Toxic Stalker, ...
- Option: `createBattle({ openingInitiative: "player-first" | "speed" })`, `FOD_OPENING` in `index.js`. Default `player-first`; unknown values throw. When applied, the log says "The Falcon team seizes the initiative!" and an `OpeningInitiative` event is emitted.
- `applyOpeningInitiative(state, effectiveStat, { firstSide })` accepts `"enemy"` for future ambush encounters; not exposed as a battle option yet.
- Effect over 120 seeded scripted battles (threshold): 8.96 -> 8.56 average rounds, 93.2 -> 92.3 average turns, ally turn share 64.1% -> 65.0%.

## Verified test status (2026-11-07 snapshot)

`node --test`: **52 passing, 0 failing** (scheduler 18, RNG 8, event bus 7, determinism 7, opening initiative 12). `tools/compareSchedulers.js` is a dev tool, not part of the test run. The determinism tests play a full scripted 5v5 battle to completion; there are still no focused tests for victory/defeat variants, individual skills, AI, or reserve transitions.

## Future direction

- Battle balance and SPD/MP/cooldown economy.
- Full 5v5 playtest/regression.
- Agent management and formation expansion.
- Leveling and stage mechanics.
- Planned engine/view steps: (2) controller interface so `playerTurn`/`enemyAI` become interchangeable controllers (terminal, GUI, simulator); (3) data-driven skills with an effect interpreter, migrated one skill at a time with old-vs-new golden tests; (4) typed events alongside text logs; (5) headless simulator CLI.
- Also planned: recorded choice log for exact replays, analytics, GUI turn-order preview, saves/replays.
- Done: deterministic random seed (2026-11-07).

## Working rules

1. Inspect the current files and tests before editing.
2. State which behavior is confirmed versus proposed.
3. Do not duplicate stats/data structures unnecessarily.
4. Keep mechanics internally consistent and test them.
5. Run `node --test` after changes. Keep new randomness on `state.rng`; keep event payloads plain data. Event `seq` is shared by all event types on the bus.
6. Add tests for bug fixes and edge cases.
7. Update `docs/CHANGELOG.md`, status, and relevant mechanics docs when behavior changes.
8. Explain any source/document mismatch rather than silently guessing.
