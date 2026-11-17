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
- Event vocabulary and payload validation: `core/combatEvents.js`; see `docs/STEP4_TYPED_COMBAT_EVENTS.md`. Events cover battle/round/turn lifecycle, accepted/rejected actions, skills, basic attacks, damage, healing, shields, statuses, incapacitation, summons and formation deployment/switching.
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
- Enemy AI is split: `decide(actor)` returns a decision and rolls skill chances in the original order; `useSkill` executes enemy skills. Basic attacks from both sides execute through `core/actionResolver.js`; `enemyAI.basicAttack` is a compatibility alias to that shared resolver. Keep the order of `random()` calls unchanged unless you intend to change the golden transcripts.
- Shared basic attacks preserve the current asymmetric rules: enemy attacks check ally Evasion and can trigger ally Retaliation; player attacks do not roll enemy Evasion or trigger Retaliation. The enemy evasion roll is still consumed at 0% Evasion for replay compatibility. See `docs/ARCHITECTURE.md`, "Shared basic-attack resolution".
- Events include `FormationSelected`, `ActionChosen`, `DecisionRejected` and the typed combat lifecycle events. Replay = seed + `partyOrder` + recorded player decisions.
- **Golden transcripts** (`test/goldenTranscripts.test.js`, fixtures in `test/fixtures/golden/*.txt.gz`) play 5 full terminal battles with seeded chaos input and must match byte for byte. If you change menu text, prompt order, enemy rolls or balance **on purpose**, run `node tools/updateGolden.js` and review the behavior change; otherwise a failing golden test means the refactor changed behavior.
- Refactor verification at the time: golden transcripts recorded from the pre-controller build matched exactly after the refactor, real `index.js` output was identical for three seeds, and the comparison tool reproduced the earlier numbers exactly.
- Known limits: summon behavior is one `summonAuto` decision; the terminal controller puts two menu-only messages into `state.log` (replays exclude them).

## Owner-aligned Falcon skills (2026-11-16)

- **Canonical source:** the original character reference uploaded by the owner. The full original file is not bundled. `references/characterTerraData.js` contains only the extracted character stats, skills and stat descriptions; use it together with `docs/OWNER_SKILL_REFERENCE.md` before changing any Falcon skill.
- All 20 active skills and five passive definitions are represented in `data/skills/` and assembled by `characters/skills.js` through `core/skillInterpreter.js`.
- The interpreter now supports area healing, HOT, cleanse, typed damage, shields, stat modifiers, marks, conditional effects, Stagger, Taunt, accuracy tokens and lifecycle passive callbacks.
- Do not restore old prototype values when they conflict with the owner source. The old Meo-v9 revive/EMP-on-destruction prototype behavior is removed; Emergency Field heals a living low-HP ally.
- Do not invent missing numbers: Meo-v9 Final Protocol EMP scaling, Singularity DoT scaling, and Catalyst Wing HP/destruction trigger are explicitly pending. Zackry's Accuracy currently applies to basic attacks only because the engine has no general skill accuracy model. Status and shield durations tick after the affected actor completes their turn; newly applied self-effects do not immediately lose a duration tick.
- Falcon base stats remain prototype values pending a separate stat-sheet sync decision.

## Current verification snapshot

Run `node --test`. Focused owner-alignment coverage lives in `test/ownerFalconMechanics.test.js`, with data/registry checks in `test/skillData.test.js` and `test/falconSkillData.test.js`. Golden fixtures are regenerated only after deliberate behavior changes and review. Current exact count is recorded in `docs/TESTING_AND_PLAYTESTING.md`.

## Step 3 completed — full-battle regression coverage

`test/fullBattleRegression.test.js` adds 27 battle-level tests covering all 20 Falcon active skills, all five agents in one encounter, Taunt and Stagger behavior, manual reserve switching with deterministic replay, automatic reserve deployment, victory/defeat checks, and shield/cooldown timing. At Step 3 completion, `node --test` reported 171 passed; Step 4 added event coverage; Step 5 adds simulator coverage, and the current suite is 178/178. Details: `docs/STEP3_FULL_BATTLE_REGRESSION.md` and `docs/STEP4_TYPED_COMBAT_EVENTS.md`.

## Step 4 completed — typed combat events

`core/combatEvents.js` defines and validates the event vocabulary. `docs/STEP4_TYPED_COMBAT_EVENTS.md` lists required fields, event semantics, ordering, test coverage and current limitations. The full suite currently passes 178/178. Keep payloads plain and clone-safe; event observers are read-only. Step 5 delivered `node tools/simulate.js` for deterministic batch balance runs and is complete. See `docs/STEP5_HEADLESS_SIMULATOR.md`.

## Future direction

- Battle balance and SPD/MP/cooldown economy.
- Full 5v5 playtest/regression.
- Agent management and formation expansion.
- Leveling and stage mechanics.
- Completed engine sequence: (1) data-driven Falcon skills and shared interpreter; (2) controller interface, recorded decisions and exact replays; (3) full-battle regression; (4) typed events alongside text logs; (5) headless simulator CLI.
- Completed: (5) headless simulator CLI for balance runs. Enemy skill migration is the next larger engine task after reviewing simulator baselines.
- Also planned: source-attributed combat analytics, GUI turn-order preview, saves.
- Done: deterministic random seed (2026-11-07).

## Working rules

1. Inspect the current files and tests before editing.
2. State which behavior is confirmed versus proposed.
3. Do not duplicate stats/data structures unnecessarily.
4. Keep mechanics internally consistent and test them.
5. Run `node --test` after changes. Keep new randomness on `state.rng`; use `emitCombatEvent` for engine events. Payloads must be plain structured-clone-safe data; dispatch receives an isolated copy. Event `seq` is shared by all event types on the bus.
6. Add tests for bug fixes and edge cases. Skills and AI must not prompt; only controllers talk to the player.
7. Update `docs/CHANGELOG.md`, status, and relevant mechanics docs when behavior changes.
8. Explain any source/document mismatch rather than silently guessing.


## Step 5 completed — headless simulator

`tools/simulate.js` runs seeded complete battles without terminal prompts. Use `--battles`, `--seed`, `--scheduler`, `--opening`, `--policy`, `--format`, and `--out`; output formats are table, JSON and CSV. It reports outcomes, rounds/turns, skill/basic action counts, HP damage received by side, shield absorption, healing, MP spent and rejected decisions. Per-actor received damage/support is included in JSON. Source-attributed damage is not yet available because `DamageApplied` does not identify the source actor. Read `docs/STEP5_HEADLESS_SIMULATOR.md` before interpreting balance results.


## Step 6 completed — data-driven enemy skills

- Enemy skill data is in `data/enemySkills/trainingDrone.js` and `data/enemySkills/rogueAutomaton.js`; both are built by `characters/skills.js` using the same `core/skillInterpreter.js` as Falcon.
- The shared interpreter now includes `physicalHit` for declarative physical attacks.
- Enemy actors are instantiated from `data/enemies/` definitions and carry `aiPolicy` plus an optional `skillSet` (`trainingDrone` / `rogueAutomaton`); `createSkills()` returns a separate `enemySkills` registry.
- `ai/enemyAI.js` evaluates ordered declarative policy rules from `data/enemyAI/`; policy data controls skill priorities/chances and the evaluator selects a target. Skill metadata/readiness comes from the enemy skill registry and effects run through the shared interpreter. Preserve rule order and conditional RNG evaluation unless intentionally changing golden behavior. Encounter compositions are registered in `data/encounters/` and selected with `createBattle({ encounter })` or simulator `--encounter`.
- Current enemy definitions: Pulse Shot (1.35 physical, no crit, CD 3); Overload (+25% ATK, 2 turns, CD 5); Scan (DEF −15%, 2 turns, CD 4); Heavy Strike (1.5 physical, CD 3). All cost 0 MP.
- Focused full-battle validation: `test/enemySkillData.test.js`. Full suite: 187/187. Details: `docs/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md`.
- Not migrated: enemy encounter configuration and any skills for Siege Turret, Recon Drone or Toxic Stalker; none were present in the existing prototype behavior.

- Step 7: enemy archetypes/stats live in `data/enemies/`; ordered AI policy rules live in `data/enemyAI/`; encounter compositions live in `data/encounters/`. `createBattle({ encounter })` and simulator `--encounter` choose a registered roster. Current formation setup requires five enemy entries.


## Step 8 completed — encounter progression, waves and reinforcements

- Encounter definitions are in `data/encounters/`. Legacy `enemies: [...]` definitions remain one-wave compatible; multi-wave definitions use `waves: [{ id, name, enemies }]`.
- A wave enemy entry may be an archetype ID string or `{ enemy, instanceId?, stats? }`. Numeric stat overrides are validated and merged into a fresh actor; they never mutate archetype data. Use `instanceId` for stable unique IDs when an archetype appears more than once across a multi-wave encounter.
- Reinforcement groups use `trigger: { type: "enemyDefeatedCount", atLeast }`. Each group triggers once, appends actors to the enemy reserve, and relies on existing automatic reserve deployment. Do not create a second deployment path.
- `createBattle({ encounter, onEncounterComplete })` and `playHeadless({ encounter, onEncounterComplete })` support the completion callback. Reward values are metadata only; no progression persistence or actual reward awarding exists.
- Typed events added: `EncounterStarted`, `EncounterWaveStarted`, `EncounterWaveCleared`, `ReinforcementsQueued`, `EncounterCompleted`. Simulator output now reports wave and reinforcement counts.
- `siegeBreakthrough` is the multi-wave reference encounter. Training Ground and Drone Calibration remain one-wave and preserve their existing roster behavior.
- Current limits: five enemy entries per wave; only defeat-count reinforcement triggers; reinforcement arrivals use reserve replacement; no save/resume for an in-progress encounter.
- Verification snapshot: **191 passed, 0 failed**. See `docs/STEP8_ENCOUNTER_PROGRESSION.md`.
