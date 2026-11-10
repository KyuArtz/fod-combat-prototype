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
- Replay = seed + party order + the accepted player decisions (recorded as `ActionChosen` events; see "Controllers and decisions").
- `core/eventBus.js`: synchronous bus (`on`, `onAny`, `emit`). Events are plain data `{ type, seq, ...payload }`. Handler errors propagate to the emitter.
- `say()` now records to `state.log` and emits a `Log` event (`{ message, round }`); the terminal printer subscribes to it in `ui/battleLog.js`. `createBattle` returns `events` so a GUI, simulator, or test can subscribe.
- Events so far: `Log`, `OpeningInitiative`, `FormationSelected`, `ActionChosen`, `DecisionRejected`. Typed combat events (`DamageDealt`, `TurnStarted`, ...) are planned (step 4).
- Redirected stdin (`node index.js < file`) stops at the first prompt (readline limitation, also true of the original code). Drive prompts interactively or use the `createBattle` test harness in `test/determinism.test.js`.

## Opening initiative (added 2026-11-07)

- Problem: with accurate SPD ordering the fastest unit opens the battle, and in 5v5 that is an enemy (Recon Drone 115 vs Zenki 110). The legacy scheduler only opened with the player by accident (clamped ties resolved by array order).
- Rule (`systems/openingInitiative.js`): applied once after both parties are set up, before the first turn. If the enemy's fastest unit would be ready first (or tied), every living non-summon ally gets the same head start in *time* (`cr += SPD * delta`, `delta = tAllyFastest - tEnemyFastest + 1e-6`). Relative SPD order among allies and long-run turn share are unchanged. If allies are already faster, nothing changes.
- Real roster result: delta about 0.0395 time units (Zenki +4.35 CR, other allies about +2.8 to +3.8); opening becomes Zenki, Recon Drone, Elishia, Zackry, Toxic Stalker, ...
- Option: `createBattle({ openingInitiative: "player-first" | "speed" })`, `FOD_OPENING` in `index.js`. Default `player-first`; unknown values throw. When applied, the log says "The Falcon team seizes the initiative!" and an `OpeningInitiative` event is emitted.
- `applyOpeningInitiative(state, effectiveStat, { firstSide })` accepts `"enemy"` for future ambush encounters; not exposed as a battle option yet.
- Effect over 120 seeded scripted battles (threshold): 8.96 -> 8.56 average rounds, 93.2 -> 92.3 average turns, ally turn share 64.1% -> 65.0%.

## Controllers and decisions (added 2026-11-07, step 2 of engine/view separation)

- Every turn goes through `core/turnRunner.js`: build a plain-data **view** (`core/turnView.js`), ask the actor's **controller** for a **decision**, validate it (`core/decisions.js`), then execute it. Controllers only decide; the engine executes. Full description: `docs/ARCHITECTURE.md`, "Turns, controllers and decisions".
- `createBattle({ controllers: { player, enemy, summon }, partyOrder })`. Defaults: terminal menu (`ui/battleMenu.js`), built-in AI (`enemyAI.controller`), automatic summon. Headless controllers in `core/controllers.js`: `createBasicAttackController`, `createRandomController({ seed, allowSwitch })` (own RNG), `createScriptedController(decisions)`, `createDecisionRecorder(events)`. `tools/lib/headless.js` has `playHeadless(...)`.
- Skills in `characters/skills.js` are declarative: `{ name, key, cost, targeting: "enemy" | "ally" | "none" | "mode", modes?, run(actor, { target, mode }) }`. A skill must never prompt or read input; the terminal controller does the prompting. A new skill needs `targeting` and `run`, nothing else.
- Enemy AI is split: `decide(actor)` returns a decision and rolls skill chances in the original order; `useSkill` and `basicAttack` execute. Keep the order of `random()` calls unchanged unless you intend to change the golden transcripts.
- Events added: `FormationSelected`, `ActionChosen`, `DecisionRejected`. Replay = seed + `partyOrder` + recorded player decisions.
- **Golden transcripts** (`test/goldenTranscripts.test.js`, fixtures in `test/fixtures/golden/*.txt.gz`) play 5 full terminal battles with seeded chaos input and must match byte for byte. If you change menu text, prompt order, enemy rolls or balance **on purpose**, run `node tools/updateGolden.js` and review the behavior change; otherwise a failing golden test means the refactor changed behavior.
- Refactor verification at the time: golden transcripts recorded from the pre-controller build matched exactly after the refactor, real `index.js` output was identical for three seeds, and the comparison tool reproduced the earlier numbers exactly.
- Known limits: player vs enemy basic attacks use separate code; summon behavior is one `summonAuto` decision; the terminal controller puts two menu-only messages into `state.log` (replays exclude them).

## Verified test status (2026-11-07 snapshot)

`node --test`: **84 passing, 0 failing** (scheduler 18, RNG 8, event bus 7, determinism 7, opening initiative 12, golden transcripts 5, turn view and decisions 14, controllers 13). `tools/compareSchedulers.js` is a dev tool, not part of the test run. Full battles are covered by the golden transcripts, the determinism tests and a 60-battle fuzz run with random player and enemy controllers; there are still no focused tests for individual skill numbers or enemy AI target rules.

## Future direction

- Battle balance and SPD/MP/cooldown economy.
- Full 5v5 playtest/regression.
- Agent management and formation expansion.
- Leveling and stage mechanics.
- Planned engine/view steps: (3) data-driven skills with an effect interpreter, migrated one skill at a time, checked against the golden transcripts and old-vs-new comparisons; (4) typed events alongside text logs; (5) headless simulator CLI (a headless player and a random controller already exist).
- Done: (2) controller interface, recorded decisions and exact replays.
- Also planned: analytics, GUI turn-order preview, saves.
- Done: deterministic random seed (2026-11-07).

## Working rules

1. Inspect the current files and tests before editing.
2. State which behavior is confirmed versus proposed.
3. Do not duplicate stats/data structures unnecessarily.
4. Keep mechanics internally consistent and test them.
5. Run `node --test` after changes. Keep new randomness on `state.rng`; keep event payloads plain data. Event `seq` is shared by all event types on the bus.
6. Add tests for bug fixes and edge cases. Skills and AI must not prompt; only controllers talk to the player.
7. Update `docs/CHANGELOG.md`, status, and relevant mechanics docs when behavior changes.
8. Explain any source/document mismatch rather than silently guessing.
