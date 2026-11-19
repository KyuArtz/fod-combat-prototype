## 2026-11-17 — Falcon combat mechanics finalization (Step 9)

- Implemented Meo-v9 Final Protocol on natural expiry (1.0x/0.5x Mpow Electromagnetic damage, primary target selection, one-time SPD -15% debuff).
- Implemented Nanotech Singularity's 0.2x Mpow non-critical Nanotech DoT at enemy turn start.
- Implemented Catalyst Wing as a targetable passive summon with 25% Evalete Max HP, 50% base DEF/RES, natural expiry, and early-destruction shield behavior.
- Corrected Zackry Overwatch so its +10 Accuracy token applies to the next attack, including skill attacks, and untargeted team skills no longer grant an unsupported team-wide token.
- Changed Jazen Stagger from losing a full action to a 20-readiness-point delay; reapplication does not stack the pushback. Recoil Dampeners now checks actual HP loss after shield absorption.
- Updated the owner JSON with clearly labeled implementation decisions, synchronized the bundled Falcon reference, and added focused regression tests.
- **Verification:** `node --test` -> **202 passed, 0 failed**. Same-seed simulator smoke samples: trainingGround 200/200 wins before/after (average rounds 4.65 -> 4.17); siegeBreakthrough 100/100 wins before/after (average rounds 10.94 -> 9.66). Random-action results are a regression smoke check, not a final balance verdict.

## 2026-11-16 — Step 6: data-driven enemy skills

- Added declarative skill data for Training Drone Pulse Shot and Rogue Automaton Overload, Scan and Heavy Strike under `data/enemySkills/`.
- Extended `core/skillInterpreter.js` with a reusable `physicalHit` effect; enemy skills now use the same interpreter and damage application path as Falcon skills.
- Added enemy skill-set identifiers and a separate enemy skill registry. `ai/enemyAI.js` now reads skill metadata/readiness from that registry and delegates execution to the shared interpreter.
- Preserved existing AI policy conditions and random-check order; Siege Turret, Recon Drone and Toxic Stalker remain unchanged because no special skill behavior was defined for them.
- Added `test/enemySkillData.test.js`, validating all four enemy skills through complete headless battles and the existing event/decision pipeline.
- Added `docs/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md`; updated roadmap, project status and AI handoff.
- **Verification:** `node --test` -> **183 passed, 0 failed**.
- **Scope note:** encounter configuration and additional enemy skill kits are not part of this milestone.

## 2026-11-16 — Step 3: full-battle regression coverage

- Added `test/fullBattleRegression.test.js` with 27 battle-level tests.
- Exercised all 20 owner-aligned Falcon active skills through real turn selection, decision validation and battle resolution.
- Added encounter coverage for all five Falcon actors, Jazen Taunt against built-in enemy AI, Breach Charge Stagger, manual reserve switching and deterministic replay, automatic reserve deployment, victory/defeat checks, and shield/cooldown timing.
- Updated project status, roadmap, AI handoff and testing documentation.
- **Verification:** `node --test` -> **171 passed, 0 failed**.
- **Scope:** no enemy skill migration or undocumented owner mechanic invention in this step. Manual balance playtesting remains outstanding.
- **Next:** Step 4, typed combat lifecycle events alongside text logs.

# Changelog

## 2026-11-17 — Step 8: encounter progression, waves and reinforcements

- Extended encounter definitions to support ordered waves while preserving legacy `enemies: [...]` single-wave definitions.
- Added per-instance enemy stat overrides and optional unique instance IDs; archetype definitions are not mutated.
- Added one-shot `enemyDefeatedCount` reinforcement triggers. Reinforcements enter the existing enemy reserve and use the existing automatic deployment path.
- Added `EncounterStarted`, `EncounterWaveStarted`, `EncounterWaveCleared`, `ReinforcementsQueued` and `EncounterCompleted` typed events.
- Added the `onEncounterComplete` callback with reward metadata as an integration hook; no reward inventory or persistent progression is implied.
- Added the two-wave `siegeBreakthrough` encounter and simulator metrics for waves, reinforcement units and encounter completion.
- Added focused progression tests and documentation.
- **Verification:** `node --test` -> **191 passed, 0 failed**. A 10-battle seeded `siegeBreakthrough` simulator smoke run completed 10/10 victories, 2 waves per battle, 2 reinforcement units per battle and 0 rejected decisions (smoke-test sample only).


## 2026-11-16 — Step 5: headless simulator CLI

- Added `tools/simulate.js` to run seeded batches of full battles without terminal prompts, with `threshold`/`legacy` scheduler selection, `player-first`/`speed` opening selection, and `random`/`basic` Falcon controller policies.
- Added aggregate and per-battle balance metrics: outcomes/win rate, rounds, actor turns, skills/basic attacks, HP damage received by side, shield absorption, healing, MP spent and rejected decisions. JSON includes per-actor received-damage/support details; CSV provides one row per battle.
- Extended `tools/lib/headless.js` with selectable deterministic player policies and a recordable event bus by default. Player-policy randomness uses its own seeded RNG and does not perturb battle RNG.
- Added `test/simulator.test.js` for CLI validation, report shape, deterministic batches and CSV output.
- Documented CLI options and interpretation caveats in `docs/STEP5_HEADLESS_SIMULATOR.md`; updated README, roadmap, project status and AI handoff.
- **Sample run:** 100 random-policy battles, threshold scheduler, seeds 20261116–20261215: 100 victories, 0 defeats; 4.64 average rounds and 73.7 average actor turns. This is a reproducible sample, not a balance conclusion.
- **Verification:** `node --test` -> **178 passed, 0 failed**.
- **Known limitation:** the current `DamageApplied` event lacks source actor identity, so the simulator reports target-side/target-actor damage received rather than source-attributed damage dealt.
- **Next:** review several simulator baselines, then proceed with data-driven enemy skills after confirming encounter and event contracts.

## 2026-11-16 — Step 4: typed combat events and compact reference bundle

- Added `core/combatEvents.js` as the typed event vocabulary and validation boundary, with required-field checks and structured-clone-safe payloads.
- Added typed battle, round and turn lifecycle events; skill/basic action, damage, healing, shield, status, incapacitation, summon, reserve-deployment and battle-completion events alongside the existing `Log` stream.
- Routed existing formation, initiative, accepted-action, rejected-decision and log events through the same event contract.
- Added battle-level event regression coverage and contract validation tests; event emission does not change RNG progression or terminal output.
- Added `docs/STEP4_TYPED_COMBAT_EVENTS.md` with the event catalogue, ordering rules, limitations and integration guidance.
- Replaced the full original JSON in the project `references/` folder with `characterTerraData.js`, containing only selected character stats, skill definitions and stat descriptions. The original file and original format are not included in updated full ZIPs.
- **Verification:** `node --test` -> **174 passed, 0 failed**.
- **Next:** Step 5, headless simulator CLI for balance runs.

## 2026-11-16 — Owner-reference Falcon skill engine alignment

- Used the owner-provided `characterTerraData.js` as the authoritative implementation source and added `docs/OWNER_SKILL_REFERENCE.md` as the readable source-derived skill specification. The project bundle was subsequently reduced to the selected JS extract.
- Replaced prototype Falcon skill names, costs, cooldowns and descriptions with the owner's initial skill reference for all five Falcon agents.
- Implemented supported passives and mechanics: Elishia's 3-turn battle-start SPD/Evasion buff, flat 8 MP discount and Nanotech effects; Evalete's 12-turn Catalyst Wing pulse; Zackry's Tactical Mark, Command Uplink, EMP Burst and Overwatch behavior; Jazen's Recoil Dampeners, Stagger, Taunt and damage effects; Zenki's Unobserved, Railshot, Cipher Tag, Ghost Protocol and Zero Hour.
- Added shared interpreter handlers and passive lifecycle callbacks, including HOT, cleanse, conditional stats, damage-taken/dealt modifiers, stagger skip and mark defeat rewards. Status and shield durations now tick after the affected actor completes their turn, preserving the full specified number of turns.
- Replaced Meo-v9's prototype revive behavior with the owner's Emergency Field: heal the lowest-HP-ratio living ally below 25% Max HP for 10% Max HP.
- At this historical Step 8 checkpoint, the remaining source gaps were deferred. Step 9 (2026-11-17) supersedes this status with owner-approved balance values and implementations; see `docs/FALCON_MECHANICS_FINALIZATION.md`.
- Added `test/ownerFalconMechanics.test.js` and updated Falcon data, validation and Elishia tests. Golden fixtures were intentionally regenerated after focused mechanics checks.
- **Verification:** `node --test` -> **144/144 passing**. Five terminal transcripts and six Elishia-focused golden scenarios were intentionally regenerated and pass.
- **Next agreed step:** full-battle regression coverage (victory/defeat, all Falcon kits/passives, AI targeting, status duration and reserve transitions).

This changelog records notable project decisions and implementation milestones. It is not a substitute for Git history.

## 2026-11-16 — Shared player/enemy basic-attack execution

- Moved the complete basic-attack execution path into `core/actionResolver.js`: evasion, physical damage, combat log output, and retaliation now live together.
- Simplified `core/turnRunner.js`: every validated `basic` decision calls the same resolver; it no longer branches between player and enemy implementations.
- Removed the duplicate enemy basic-attack implementation from `ai/enemyAI.js`. Enemy AI still chooses when to attack and which target to select; its `basicAttack` and direct `enemyTurn` interfaces delegate to the shared resolver for compatibility.
- Preserved existing combat behavior: enemy attacks check ally Evasion (0–75%) and can trigger ally Retaliation; player attacks retain their previous no-dodge/no-retaliation behavior. The enemy evasion RNG draw remains in place even at 0% Evasion so seeded battle sequences do not drift.
- Added `test/basicAttack.test.js` with focused tests for evasion, retaliation, player-side compatibility and invalid inputs.
- **Verification:** `node --test` -> **147/147 passing**. All five original terminal golden transcripts and six Elishia golden scenarios remain unchanged and pass.

## 2026-11-16 — Step 3 (Falcon roster): complete data-driven skill migration

- Added `data/skills/evalete.js`, `zackry.js`, `jazen.js` and `zenki.js`; each character's four skills now use declarative effect data.
- Replaced the remaining imperative skill functions in `characters/skills.js` with a small registry assembler. All five Falcon skill sets now use `core/skillInterpreter.js`.
- Extended the interpreter with shared hitMastery and area mastery damage, self/allied/enemy status effects, self/allied shields, pre-effect announcements, and survivor-only status application. Validation covers the new effect types and targeting constraints.
- Preserved the existing MP costs, cooldowns, damage multipliers, statuses, shield values and action targeting. The five terminal golden transcripts and six Elishia scenario goldens were not regenerated; they still pass unchanged.
- Added `test/falconSkillData.test.js` to validate each migrated definition, pin all 16 migrated skills' costs/cooldowns and exercise each through the shared interpreter.
- **Tests:** `node --test` -> **143/143 passing** (original 140 plus 3 new migration tests).
- **Remaining step-3 scope:** enemy skills are still implemented in `ai/enemyAI.js`; this change migrates the five Falcon playable agents only.

## 2026-11-09 — Step 3 (Elishia): data-driven skills, then the roster design ideas

**Branch:** `development` (not committed at time of writing)

**Phase A: migration with identical behavior.**
- Before touching skills, recorded 6 Elishia-dense golden scenarios from the old imperative code (`tools/lib/elishiaScenarios.js`, `test/goldenElishia.test.js`): Elishia rotates through every skill and Nano Swarm mode in 5v5 and 3-active-plus-reserve battles.
- Added `core/skillInterpreter.js` (effects, passive hooks, summon behavior, load-time validation) and `data/skills/elishia.js`. `characters/skills.js` builds Elishia's registry from data; her imperative functions were removed. `summonTurn` replaced `meoTurn`.
- Result: all 11 golden recordings (5 terminal transcripts + 6 Elishia-dense) matched byte for byte on the first run. 21 new tests (`test/skillData.test.js`) pin MP/cooldown values, validation errors and interpreter behavior.

**Phase B: the roster JSON's Elishia ideas, MP and cooldowns unchanged (20/2, 25/3, 35/4, 65/6).**
- Passive **Biotech Overdrive**: +10% SPD (effective 104) and +10 Evasion, stored on the actor (`passive.statMods`, read by `effectiveStat`), surviving incapacitation. Skills are tagged Nanotech so each triggers the next-skill MP discount.
- **Adaptive Barrier**: damage now carries a type (`Physical` or a mastery type) through `applyDamage`; an adaptive shield that absorbs damage gives the target 15% resistance to that type for the barrier's remaining turns (announced once per type change).
- **EB's Drone: Meo-9** (renamed from "Meo-9" to the roster title): scan (+10% damage from Elishia to enemies while it lives; no stacking), stabilize (once per deployment, instead of attacking, revives a downed ally still on the field at 15% Max HP), EMP on destruction (Electromagnetic, 100% of its MPow to all enemies, SPD −15% for 1 turn). **Nanotech Singularity** raises cover fire to 75% and the scan bonus by another +10%, and announces the amplification after its own message.
- Added `battle.dealDamage` (test and tool hook), `systems/shields.js` adaptive support, `ui/statusDisplay.js` label for adaptive resistance.
- 29 new tests (`test/elishiaMechanics.test.js`) including full-battle integration. Three deliberate sabotages (scan disabled, passive not attached, a cost changed in the data) are all caught.
- Goldens regenerated (intentional change); the recordings contain no NaN/undefined/error text. In the Elishia-dense scenarios victories are unchanged and rounds move by at most one.
- Updated tests that assumed the old numbers: opening-initiative tests and `tools/compareSchedulers.js` now use effective SPD (Elishia's is 104).
- **Scheduler numbers re-measured** (see `docs/PROJECT_STATUS.md`): threshold still 0 time-order errors; legacy 673.
- **Tests:** `node --test` -> **140/140 passing**.
- **Known limitation:** enemies never target summons (`ai/targeting.js`), so Meo-9's EMP is dormant in normal play (tested through `battle.dealDamage`).
- **Docs:** fixed the misaligned stat tables in `docs/ROSTER_AND_SKILLS.md` (SPD column was missing); added a roster-JSON sync status section. `characterTerraData.json` was **not** modified (Elishia's JSON text is still accurate; the other four agents' JSON blocks stay outdated until finalized).
- **Next:** decide how enemies may target summons; balance review of the prototype-filled numbers; migrate the next agent.

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

## Step 7 — data-driven enemy AI and encounters

- Moved all five training enemy archetypes and their combat stats into `data/enemies/` definitions.
- Moved Training Drone, Rogue Automaton and basic-only AI behavior into declarative rule sets under `data/enemyAI/`.
- Replaced enemy-specific conditional branches with a reusable policy evaluator in `ai/enemyAI.js`; rule order and conditional RNG consumption preserve the original Training Drone/Rogue Automaton behavior.
- Added encounter definitions under `data/encounters/`, including the original five-enemy Training Ground and a Drone Calibration variant.
- Added `createEncounterEnemies()` and an `encounter` option to battles, headless runs and the simulator CLI (`--encounter`).
- Added validation and regression tests for enemy definitions, AI policies, encounter references and alternate encounter execution.


## Step 9 packaging clarification

- Removed the full `characterTerraData.json` from the package root and placed the website-facing reference copy at `references/characterTerraData.js`.
- Clarified that the combat engine and automated tests are authoritative; the JSON is a separate guide/idea reference updated after engine mechanics change.
