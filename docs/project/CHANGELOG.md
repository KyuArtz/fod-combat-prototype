## 2026-11-26 — B6.3 Approved Actor Classification

- Classified all 15 playable actors as `organic` by approved canon. Galloz additionally receives `electronic-systems` for cybernetic components/EMP susceptibility.
- Added three focused classification tests; enemy profiles and neutral factory defaults are unchanged.
- Capability tags remain inert; no affinity bonus, combat effect, balance, AI, RNG, or golden transcript changes. Serpent full-team Toxic resistance remains a deferred idea. Verification: B6.2 baseline 438 passed; final suite 441 passed, 0 failed/skipped/todo. See [B6.3 reference](../reference/ACTOR_CLASSIFICATION_B6.3.md).

## 2026-11-26 — B6.2 Faction Affinity Schema

- Added schema/validation for optional faction damage resistance, effect resistance, control resistance, and control-duration reduction metadata.
- Added empty inert affinity profiles for Falcon, Phantom, and Serpent; no values are approved or activated.
- Actor factory now exposes validated partial `affinityOverrides`, defaulting to `{}`. No runtime inheritance/merge or combat consumer exists.
- Added focused schema validation tests. No capabilities, faction balance, skills, combat formulas, AI, RNG, or golden transcripts changed.
- Verification: B5 baseline **432 passed**; B6.2 suite pending final verification. See [B6.2 schema](../reference/FACTION_AFFINITY_SCHEMA_B6.2.md).

## 2026-11-26 — B5 Susceptibility Integration & Representative Effect Migration

- Integrated the B4 resolver through an opt-in helper in `systems/effects/defaultHandlers.js` for the generic `status`, `statusEnemies`, and `damageOverTime` handlers. Effects without susceptibility metadata continue through the legacy status path.
- Migrated shared Serpent Poison with the `biological-toxin` tag and both Lucaz Stagger payloads with `control:stagger`. No required actor capabilities were assigned; undeclared roster profiles remain neutral.
- Added skill-data validation for susceptibility objects, tags/capability arrays, and optional 0–100 chance values.
- Added seven integration regressions for independent damage/status behavior, partial resistance, control resistance/duration, capability gates, legacy bypass, validation, RNG draw preservation, and migration scope.
- No status routes outside the selected handlers, skill values, actor classifications, damage formulas, AI, or golden transcripts were changed.
- Verification: B4 baseline **425 passed**; B5 **432 passed, 0 failed, 0 skipped, 0 todo**. Focused set **66 passed**. Faction duel smoke checks: Falcon–Phantom 100 battles (77–23), Serpent–Falcon 20 (16–4), Serpent–Phantom 20 (9–11); zero rejected decisions. Small samples are not balance evidence. See [B5 integration report](../reference/SUSCEPTIBILITY_INTEGRATION_B5.md).

## 2026-11-26 — B4 Effect Susceptibility & Control Resolution

- Added a shared pure resolver (`systems/effectSusceptibility.js`) for capability eligibility, explicit immunity, generic effect resistance, control-only resistance, proc chance, and control-duration reduction.
- Supports all-of capability requirements, any-of requirements, and explicit excluded capabilities; undeclared profiles remain neutral.
- Effect and control resistance are independent strongest-value categories; control duration reduction is separate from chance and applies only to `control:` tags. Damage resistance does not affect effect/control resolution.
- Added 13 focused tests for eligibility, immunity, filters, resistance separation, duration, deterministic RNG injection, and malformed metadata.
- Resolver is not yet connected to live status/skill application; no character or faction effects migrated. No skill values, combat behavior, RNG streams, or golden transcripts changed.
- Verification: B3 baseline **412 passed**; B4 **425 passed, 0 failed, 0 skipped, 0 todo**.

## 2026-11-26 — B3 Generic Resistance Resolution

- Added universal resistance statuses (`resistancePercent` without filters) and optional `damageTypes` filters. Legacy `resistanceType` remains compatible; when both filters exist, both must match.
- Preserved strongest-value resistance stacking and Adaptive Barrier behavior. Resistance is shared by Physical, mastery, and reflected-damage mitigation.
- Added seven focused tests for universal coverage, filtered channels, empty filters, legacy typed behavior, stacking/clamping, adaptive interaction, and reflected mitigation.
- No skills, balance values, actor capability classifications, weakness/control effects, RNG ordering, or golden transcripts were intentionally changed.
- Verification: B2 baseline **405 passed**; B3 **412 passed, 0 failed, 0 skipped, 0 todo**.

## 2026-11-26 — B2 Actor Capability Metadata & Validation

- Actor creation now normalizes optional capability metadata to a validated array; unknown or malformed tags throw. Duplicate tags are removed while preserving order.
- Four clearly mechanical enemy definitions declare `mechanical` and `electronic-systems`; other enemies and playable roster actors remain undeclared/neutral.
- Added five focused tests covering neutral fallback, whitelist behavior, normalization, invalid metadata, enemy exposure, and invalid definition rejection.
- Metadata is inert; no damage, status, control, resistance, weakness, AI, or RNG behavior changed.
- Test suite: 400 baseline tests; 405 passing after B2.

## 2026-11-26 — B1 Agnostic Effect & Actor Capability Design

- Added design reference defining separation of damage channels, effect/control tags, actor capabilities, resistance/weakness, and conditional susceptibility.
- Documented current runtime constraints and a phased implementation gate.
- Documentation-only milestone; no runtime, skill values, character data, or tests changed.
- Baseline test verification: 400 passed, 0 failed, 0 skipped, 0 todo.

# Changelog

## 2026-11-26 — Controller-side Taunt legality (A1)


- Added `systems/targetingRules.js` as the shared source for active-Taunt lookup, longest-duration priority, stable formation-order ties, and target-list restriction.
- `core/turnView.js` now restricts hostile single-target legal targets for player/faction controllers and neutral enemy controllers. `view.opponents` stays unfiltered for strategic context; friendly-targeting modes and AoE remain unchanged.
- `ai/targeting.js` now uses the shared active-Taunter helper, preserving default PvE targeting behavior.
- Removed the Galloz full-battle Taunt `todo`; controller-side Taunt targeting is now exercised in battle. Added focused player-view, faction-enemy-view, and neutral-enemy-view tests.
- Updated the single-target skill-decision helpers in Falcon, Falcon V2, Phantom, and Serpent controllers to retain a chosen target only when it is legal for that action, otherwise falling back to an exposed legal target. This was necessary because some tactical priority choices originate from the unfiltered `view.opponents` list.
- Verification: `npm test` — **394 passed, 0 failed, 0 skipped, 0 todo**. 100-battle samples (seat alternation) yielded Falcon 76–24 vs Phantom, Serpent 67–33 vs Falcon, and Serpent 43–57 vs Phantom; execution smoke only, not balance evidence.



## 2026-11-24 — P1-2-13 review fixes: Taunt targeting and Reinforcement expiry

- **Fixed stale Reinforcement payoff (Galloz, Lucaz):** the `*ReinforcementPrimed` passive flag is now cleared by the new shared `clearPrimedFlagWithoutCharge` passive handler (subscribed on `turnStart` and `turnEnd`) when the matching Kinetic charge status has expired or been removed. Previously Galloz's Reactor Quake could still use its 120% ATK payoff after the charge had run out. In full duels continuous enemy skill hits usually keep refreshing the charge, so this rarely occurred naturally.
- **Taunt targeting (`ai/targeting.js`):** a Taunt payload with `turns <= 0` is ignored even if it lingers; with several taunters the longest remaining Taunt wins and ties keep formation order (previously roster order decided). New shared `hasActiveTaunt` helper; Phantom's Lucaz AI uses it instead of checking the literal `taunt` status ID.
- **Renamed** the shared passive handler `lucazReinforcement` to `stackReinforcement` (Lucaz and Galloz both use it). Behavior unchanged.
- **Wording:** the owner reference copy of Bastion of the Unyielding now says "drawing all enemy attacks (Taunt)" instead of "Taunting all enemies".
- Reviewed and kept as intended: Ironclad Impact and Catalyst Overlord consume Galloz's charge for its +15% ATK power bonus; Reactor Quake uses its defined 120% payoff instead.
- **Found, not yet fixed:** Taunt is not enforced for controller-driven sides (see Known limitations in `PROJECT_STATUS.md`). Recorded as a `todo` test.
- Added `test/reinforcementPrimedExpiry.test.js`, `test/gallozFullBattle.test.js`, and Taunt/helper/Phantom-AI cases in `test/tauntTargeting.test.js`. No golden transcript changed. **Verification:** 390 tests (389 passed, 0 failed, 0 skipped, 1 todo).

## 2026-11-23 — Iteration 6: Serpent Syndicate shared-runtime migration

- Added Verra, Kane, Galloz, Claude, and Tekushiki as five selectable Serpent Syndicate operatives through `characters/serpent.js` and the central `characters/roster.js` registry. Tekushiki is now an official/canon member by owner authorization; his origin and past remain deliberately unresolved.
- Migrated all 20 Serpent skill slots and five passives into `characters/skillData/`. Verra's two mode-based skills provide 22 executable branches across attack/heal options.
- Added reusable Poison behavior with source attribution and distinct tuning: Verra's Poison ticks for 0.25× her Mpow; Kane's and Claude's Poison ticks for 0.20× their applier's Mpow, each for two affected-unit turns.
- Integrated Verra's heal/cleanse/Toxic-resistance support, Kane's Poison damage synergy and multi-hit sequences, Galloz's Reinforcement and next-strike charge, Claude's Fracture and team support, and Tekushiki's two-mark Snare/Bind control through the shared effects/passive/status systems.
- Added Serpent tactical AI with role-aware targeting and reserve rotation; registered Serpent in the symmetric faction-duel harness so it can act on either battle side and face Falcon or Phantom.
- Updated the unified selector to include 15 operatives across all three factions, show Verra's mode names/descriptions in profile previews, and format primary/secondary roles consistently. Updated the compact owner reference and separate website-facing `characterTerraData` copy.
- Added Serpent migration, mechanics, selection, and faction-duel regression coverage. **Verification:** 333 tests passed, 0 failed, 0 skipped.
- Ran 10-battle Serpent-vs-Falcon and Serpent-vs-Phantom integration smoke batches with alternating seats and zero rejected decisions. These small batches verify execution only; they are not balance benchmarks.

## 2026-11-22 — Iteration 5: Combat effect coverage and mixed-faction validation

- Added live passive and summon registry introspection (`has`/`entries`) and load-time validation that every declared lifecycle event and handler resolves before battle execution.
- Extended `validateSkillData` to verify supported passive lifecycle events, registered passive/summon handlers, and supported declarative passive skill-use hooks across playable and enemy skill data.
- Re-enforced `targetFaction` and `excludeSelf` at shared skill-interpreter execution time for ally-targeting modes, not only in terminal legal-action filtering.
- Preserved DoT source attribution when an applier leaves the deployed actor list or moves into reserve by resolving its stable ID/side against both party rosters.
- Stopped processing further simultaneous turn-start DoT ticks once a tick incapacitates its target.
- Defined owner-linked summon behavior on owner incapacitation: dismiss the owner's active summons without treating dismissal as destruction or triggering destruction bursts/reactions. Owner-turn summon clocks and affected-unit status durations pause while the owner is in reserve and resume when redeployed.
- Added `test/engineCoverageAudit.test.js` to validate all ten playable and six enemy skill sets against live registries and cover invalid handlers, mode target restrictions, DoT attribution/death ordering, summon owner cleanup, and reserve lifecycle behavior.
- Regenerated only the golden fixtures affected by the intentional new summon-dismissal and DoT-defeat-order log changes; reviewed the divergence before updating the fixtures.
- **Verification:** 313 tests passed, 0 failed, 0 skipped. The audit scope and open Serpent migration handoff are documented in `docs/project/ENGINE_COVERAGE_AUDIT.md`.

## 2026-11-22 — Iteration 4: Unified Character Selection

- Added `characters/roster.js` as the central registry for selectable factions; the current combined catalog contains Falcon Company and Phantom Rebellion operatives.
- Replaced the default single-faction terminal flow in `index.js` with mixed-faction selection while preserving the legacy `selectPartyFaction` option for compatibility.
- Added roster filtering by faction, mastery, and role, plus public-profile search and individual previews for combat stats, passive descriptions, skill details, MP costs, and cooldowns.
- Players can select three to five unique operatives, order three active slots, then arrange any remaining selections into the reserve queue.
- Kept hidden operative `elishia_p` player-facing copy neutral; the selection UI uses the display name **Unknown** and does not expose internal actor IDs in public roster/search output.
- Added selector validation, roster, preview, hidden-ID neutrality, and real `createBattle` mixed-formation integration tests.
- Updated project documentation and extension guidance for adding future factions through the roster registry.
- **Verification:** 306 tests passed, 0 failed, 0 skipped.

## 2026-11-22 — Initial Phantom Rebellion skill migration

- Added runtime actor creation for Mirazhel, the Unknown operative (`elishia_p`), Lucaz, Clarke, and Liezli through `characters/phantom.js`, preserving source stat values and assigning Phantom faction metadata.
- Migrated all 20 Phantom active skills and five passives into `characters/skillData/`, using the same shared skill interpreter, effect registry, passive registry, damage pipeline, and status lifecycle used by Falcon.
- Added reusable support for faction-filtered damage vulnerability, faction-restricted ally targeting, ATK-scaled mastery damage, evasion-triggered passives, skill-specific one-use damage modifiers, replacement shield groups, and hit-filtered AoE follow-up effects.
- Added Lucaz's data-driven damage reduction/Reinforcement stack-and-consume behavior, Clarke and Liezli evasion passives, Mirazhel's Phantom-only mark benefit, and the hidden operative's DEF/RES passive reductions.
- Kept all five player-facing skill descriptions for `elishia_p` neutral; the runtime display name remains `Unknown` and no identity-bearing exposition was added.
- Added a real `createBattle` integration test proving all five Phantom units use skills through the shared runtime with zero rejected decisions.
- The source roster does not define Bleeding's damage magnitude. Initial executable Bleeding uses a **provisional** 0.15× ATK Anomaly tick for 2 turns; this remains open for owner approval and later tuning.
- Added the Phantom implementation guide, roster/reference entries, neutral player-facing copy, and synchronized separate website-facing JSON copy. The original uploaded roster remains untouched.
- **Verification:** `npm test` reports 283 passed, 0 failed, 0 skipped. One deterministic full-battle smoke run reached a valid result; this is integration verification, not a faction balance benchmark.
- **Scope at this historical migration snapshot:** Phantom tactical AI, Phantom enemy-side control, and Falcon-versus-Phantom playtesting had not yet been added. These were completed in later milestones; see the current [Phantom Implementation Guide](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md).

## 2026-11-22 — Obsolete runtime and test cleanup

- Removed the retired duplicate `data/skills/` Falcon definitions; the active definitions remain in `characters/skillData/`.
- Removed the unreachable legacy `core/skillEffects.js` implementation; shared effects remain in `systems/effects/` behind the current registry.
- Removed Meo-9 scan damage-bonus calculation, scan-template plumbing, Final Protocol summon handler, and their obsolete validation. The current Meo-9 lifecycle remains covering fire plus Emergency Field healing.
- Removed the retired dedicated `commandUplink` effect-type validator; Zackry's Mpow buff continues through the generic `statusAllies` handler.
- Removed obsolete scan/Final Protocol test assertions and 38 skipped legacy assertions; moved the still-useful global status/shield duration regression into `effectTiming.test.js`.
- Kept the legacy scheduler, initial Falcon tactical controller, `core/skillLifecycle.js` compatibility facade, reusable Accuracy-token and Stagger systems, generic conditional-status and multi-hit handlers, deterministic golden fixtures, and historical milestone records.
- Archived the superseded Step 9 Falcon mechanics note under `docs/history/milestones/` and repaired current documentation links and ownership descriptions.
- **Verification:** `npm test` reports 260 passed, 0 failed, 0 skipped.

## 2026-11-21 — Falcon approved kit v1, global stacking/timing and playtest

- Updated the active Falcon skill definitions in `characters/skillData/` to the five owner-approved kits. The shared interpreter and effect registries remain character-agnostic.
- Removed Meo-9 scan, EMP destruction and Final Protocol behavior; retained only owner-turn cover fire and Emergency Field healing.
- Removed Catalyst Wing destruction fallback; defined its turn-2/4/6/8/10/12 pulse schedule and passive summon lifecycle.
- Updated Zackry's Overwatch/marks and Mpow buffs; updated Jazen's Mpow-based Recoil Dampeners and removed his Stagger/Taunt/immunity mechanics; set Zenki to Energy and simplified his stealth/precision/three-hit Ultimate.
- Implemented Evalete's 25% non-recursive direct damage reflection through the battle damage pipeline.
- Implemented global strongest-value stat stacking, opposing-modifier offsets, effect refresh behavior, separate oldest-first shields, DOT-before-HOT turn-start ordering, owner-clock timers and passive summon owner-turn activations.
- Added approved-kit, lifecycle, stacking and battle-pipeline regression tests; regenerated deterministic golden transcripts. Latest `npm test`: 233 passed, 0 failed, 38 old assertions skipped as superseded by the new approved coverage.
- Seeded playtests: 300/300 `trainingGround` wins using the basic policy, 300/300 using the random policy, and 100/100 `siegeBreakthrough` wins using the random policy. This is a positive smoke/balance signal for the current prototype encounters, not proof against tougher or adversarial formations.
- Synced `references/characterTerraData.js` and supplied a separate updated website-facing JSON copy. The user's original JSON and base Falcon stat sheet were not modified in place.

## 2026-11-21 — Nanotech Singularity effect composition

- Removed the dedicated `singularity` active-effect handler and its specialized validation.
- Composed the ultimate from reusable `setBattleTimer`, `statusAllies`, `statusEnemies`, and `announceSummonPowerModifier` operations.
- Added generic battle-scoped timer contracts in `systems/battleTimers.js`, including actor turn-start reactions and completed-round ticking. Singularity's 5% Max HP heal remains after MP recovery and cooldown ticking and applies to non-summon allies who enter from reserve while active.
- Converted Meo-9's cover-fire bonus to a declarative conditional modifier keyed to the battle timer.

## 2026-11-19 — Declarative Falcon passive lifecycle migration (Step 3)

- Moved the passive/summon lifecycle runtime implementation from `core/skillLifecycle.js` to `systems/passives/runtime.js`.
- Kept `core/skillLifecycle.js` as a compatibility facade, preserving existing imports and behavior.
- Preserved the established documentation tree; updated existing architecture, status, roadmap, and handoff guidance only.
- **Scope note:** character-specific passive branches remain in the extracted runtime, and `overwatchProtocol` remains in `core/skillInterpreter.js`. Declarative passive event subscriptions and generic passive handlers are the next migration step, not yet complete.
- **Verification:** 205 tests passed.


- Added declarative passive event subscriptions for Evalete's Catalyst Protocol and Elishia's Biotech Overdrive.
- Moved Catalyst Wing creation, turn countdown/pulse, and destruction shield behavior into registered handlers in `systems/passives/registry.js`; the lifecycle runtime now emits `battleStart`, `turnEnd`, and `summonDestroyed` events without checking those passive IDs.
- Biotech Overdrive activation and countdown now use the same passive event registry; its stat modifiers remain data-defined and compatible with the shared stat calculation.
- Preserved Catalyst Wing's current owner-approved implementation values and existing summon behavior; Meo-v9's activation/expiry path was generalized in the subsequent summon-registry increment.
- **Verification:** 207 tests passed (baseline 207; all retained).

This file records notable implementation milestones. Detailed historical scope and test notes are linked from the [documentation index](../README.md). Git history remains the authoritative record of individual commits.

## 2026-11-18 — Documentation and codebase baseline audit

- Reorganized documentation into project guidance, technical references, and historical milestone reports; added a documentation index and audit record, and repaired internal navigation.
- Reconciled current-state documentation with the Step 9 implementation and the current `references/` layout; removed obsolete `ref/` and deferred-mechanics statements.
- Split the skill runtime into `core/skillInterpreter.js` (execution orchestration), `core/skillLifecycle.js` (passive/summon lifecycle), `core/skillEffects.js` (effect handlers), `core/skillDataValidation.js` (definition validation), and `core/skillMessages.js` (message formatting). Public exports from `core/skillInterpreter.js` remain compatible.
- Added `package.json` scripts, Node engine requirements, `.gitignore`, `.editorconfig`, and `.gitattributes`.
- Removed unlabelled generated simulator result files from the source bundle and documented the local `reports/` workflow.
- **Verification:** 202 tests passed before and after the skill-runtime split.

## 2026-11-17 — Step 9: Falcon mechanics finalization

- Finalized the previously underspecified Falcon mechanics using owner-approved implementation values: Meo-v9 Final Protocol, Nanotech Singularity DoT, Catalyst Wing lifecycle, Zackry next-attack Accuracy, and Jazen Stagger readiness delay.
- Added focused regression coverage and synchronized the current implementation guide with executable behavior.
- Falcon runtime base stats remain prototype values; stat-sheet synchronization is a separate open decision.

## 2026-11-17 — Step 8: encounter progression, waves, and reinforcements

- Added multi-wave encounter definitions, per-instance enemy stat overrides, unique instance IDs, and defeat-count-triggered reinforcement groups.
- Integrated reinforcement deployment with the existing enemy reserve/replacement path.
- Added encounter/wave lifecycle events, completion callback, reward metadata, simulator metrics, and the `siegeBreakthrough` example.
- Reward distribution and persistent progression were not added.
- Historical details: [Step 8 report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md).

## 2026-11-16 — Step 7: data-driven enemy AI and encounters

- Moved all five enemy archetypes/stats into `data/enemies/`, AI rules into `data/enemyAI/`, and encounter compositions into `data/encounters/`.
- Added a reusable ordered-rule evaluator while preserving the original Training Drone and Rogue Automaton decision priorities and random-roll order.
- Added Training Ground and Drone Calibration encounter definitions.
- Historical details: [Step 7 report](../history/milestones/STEP7_DATA_DRIVEN_ENEMY_AI_AND_ENCOUNTERS.md).

## 2026-11-16 — Step 6: data-driven enemy skills

- Migrated Training Drone Pulse Shot and Rogue Automaton Overload, Scan, and Heavy Strike to declarative data executed by the shared skill interpreter.
- Kept enemy AI decision policy separate from skill effect definitions.
- Historical details: [Step 6 report](../history/milestones/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md).

## 2026-11-16 — Step 5: headless simulator

- Added seeded batch simulation with configurable scheduler, opening policy, player policy, and table/JSON/CSV reports.
- Added aggregate and per-battle combat metrics and simulator regression tests.
- Historical details: [Step 5 report](../history/milestones/STEP5_HEADLESS_SIMULATOR.md).

## 2026-11-16 — Step 4: typed combat events

- Added a validated typed event contract alongside readable combat logs.
- Added structured events for battle/round/turn lifecycle, actions, damage, healing, shields, statuses, summons, formation changes, and battle completion.
- Replaced the full original reference JSON in the project package with the selected `references/characterTerraData.js` extract.
- Historical details: [Step 4 report](../history/milestones/STEP4_TYPED_COMBAT_EVENTS.md).

## 2026-11-16 — Step 3: full-battle regression coverage

- Expanded complete-battle tests for Falcon skills/passives, enemy AI interactions, victory/defeat, status and cooldown timing, switching, reserves, and deterministic replay.
- Historical details: [Step 3 report](../history/milestones/STEP3_FULL_BATTLE_REGRESSION.md).

## 2026-11-16 — Falcon skill data migration and owner-reference alignment

- Migrated the five Falcon skill sets to declarative data and a shared interpreter.
- Aligned names, costs, cooldowns, and specified mechanics to the compact owner-reference extract; later Step 9 decisions finalized previously missing values.
- Added passive lifecycle hooks and focused skill-data validation.
- Historical details: [Falcon skill migration](../history/milestones/FALCON_SKILL_MIGRATION.md).

## 2026-11-16 — Shared basic-attack resolution

- Added `core/actionResolver.js` as the shared basic-attack execution path for player and enemy actors.
- Preserved side-specific evasion and retaliation behavior and existing seeded RNG consumption.

## 2026-11-07 — Controller-driven turns and deterministic replay

- Added plain-data turn views, decision validation, controller injection, scripted/random controllers, and decision recording.
- Preserved terminal behavior with golden transcript fixtures.

## 2026-11-07 — Seeded RNG, event bus, and opening initiative

- Added battle-local seeded randomness and a synchronous event bus.
- Added player-first PvE opening initiative while retaining pure speed order as an option.

## 2026-11-07 — Threshold scheduler baseline

- Established the continuous-time threshold scheduler as preferred while retaining the legacy scheduler for comparison.
- Added stable tie handling and scheduler-state isolation.


## Passive lifecycle registry increment

- Added `systems/passives/registry.js` with declarative event subscriptions and extensible handler registration.
- Migrated Zenki's Unobserved, Jazen's Recoil Dampeners, and Zackry's Overwatch Protocol triggers to passive data subscriptions.
- Removed the Overwatch Protocol character-ID branch from the shared skill interpreter.
- Replaced the Unobserved ID check in basic-attack accuracy handling with passive data configuration.
- Added registry dispatch and extension tests.
- Catalyst Protocol and Biotech Overdrive lifecycle behavior remain scheduled for migration.


## 2026-11-19 — Step 4: declarative summon lifecycle registry

- Added `systems/summons/registry.js` with reusable activation and expiry handlers and battle-scoped handler registration.
- Migrated Meo-v9 Emergency Field, cover fire, and Final Protocol to declarative lifecycle subscriptions in Elishia's summon template.
- Kept summon turn timing and owner-linked destruction dispatch in the lifecycle runtime; retained a compatibility adapter for the previous behavior shape.
- Added summon registry extension/validation tests; full suite passes (209 tests).


## 2026-11-19 — Step 5: generic summon destruction and passive timers

- Summons can declare owner-event subscriptions for destruction reactions; the runtime dispatches those events without checking a summon-specific flag.
- Generic summon `onDestroyed` effects remain supported alongside owner reactions.
- Replaced Elishia's character-specific timed passive field with generic `passiveTimers` and timer-keyed `statMods`.
- Removed the legacy summon behavior compatibility adapter; Meo-v9 lifecycle behavior is fully declared through summon subscriptions.
- Added tests for custom timer keys and registry extension; full suite passes (212 tests).


## 2026-11-19 — Step 6: reusable defensive passive modifiers

- Added conditional passive stat modifier evaluation using generic actor flags and timer keys.
- Added typed incoming attack modifiers consumed by the shared action resolver through dependency injection.
- Migrated Zenki's Unobserved Evasion and incoming basic-attack penalty to declarative modifier data; separated the Evasion suppression state from Railshot's untargeted bonus flag.
- Removed the remaining Unobserved-specific runtime fields and shared-system checks.
- Added focused modifier tests and retained all golden battle transcripts; full suite passes (214 tests).


## 2026-11-20 — Falcon shared-runtime architecture audit

- Removed the remaining Zackry-specific targeter attribution check from `core/turnRunner.js`; the behavior is declared by `passive.targeting.trackTargeter`.
- Moved Recoil Dampeners' status identifier into `passive.statusId`; the shared passive handler no longer hard-codes Jazen's status key.
- Expanded skill-data validation for passive event subscriptions, initial flags, targeting configuration, status identifiers, and conditional modifier flag arrays.
- Added regression coverage for parameterized passive behavior and validation.
- Full test suite: 215 passed, 0 failed; deterministic replay and golden transcripts remain covered by the suite.


## 2026-11-20 — Falcon specialized-handler reuse audit

- Reviewed active-skill effect, passive event, and summon lifecycle handlers for reuse boundaries.
- Documented which handlers are shared primitives, parameterized mechanic handlers, or intentionally specialized composites.
- Identified the remaining named-status branches in passive lifecycle runtime: `singularityDot`, `commandUplink`, and `tacticalMark`.
- Recorded a behavior-preserving migration sequence for generic status ticking, conditional status refresh, and unit-defeated reactions.
- Documentation-only increment; baseline suite remains 215 passing tests.


## 2026-11-20 — Falcon status lifecycle Step 1: declarative turn-start ticks

- Added a generic status turn-start processor in `systems/statusEffects.js`, driven by status metadata rather than named status IDs.
- Migrated Nanotech Singularity DoT to declare its damage fields and exact combat-log message in Elishia's skill data.
- Removed the `singularityDot` branch from `systems/passives/runtime.js`; damage timing remains before passive `turnStart` dispatch, as before.
- Added focused metadata assertions and retained the existing DoT behavior regression.
- Full test suite: 215 passed, 0 failed; deterministic replay and golden transcript tests pass.


## 2026-11-20 — Falcon status lifecycle Step 2: declarative conditional refresh

- Added a generic `turnStartRefresh` status contract in `systems/statusEffects.js`, mapping base amount, current amount, conditional bonus, and threshold fields.
- Migrated Command Uplink's ATK recalculation into status metadata created by its registered effect handler.
- Removed the `commandUplink` named-status branch from `systems/passives/runtime.js`; refresh remains after passive turn-start dispatch and HoT processing.
- Expanded skill-data validation for Command Uplink's conditional amount and 0–100 HP threshold.
- Extended regression coverage for above-threshold, exactly-at-threshold, and below-threshold HP, including non-compounding base amount behavior.
- Full test suite: 215 passed, 0 failed; deterministic replay and golden transcript tests pass.


## 2026-11-20 — Falcon status lifecycle Step 3: declarative unit-defeated reactions

- Added a generic `onUnitDefeated` status-reaction processor in `systems/statusEffects.js`; the passive runtime now forwards defeat events without checking `tacticalMark` by name.
- Migrated Tactical Mark's 5% Max MP reward into declarative status data for both Zackry's single-target Mark and Full Spectrum Assault's party-wide application.
- Preserved eligibility: living allies only, non-summon allies only, capped at each ally's Max MP.
- Added once-only processing for a supplied defeat-status snapshot and validation for supported handler configuration and percentage range.
- Regression coverage verifies summon exclusion and duplicate dispatch protection; golden transcripts confirm both Tactical Mark application paths retain their reward.
- Full test suite: 215 passed, 0 failed; deterministic replay and golden transcript tests pass.


## 2026-11-20 — Falcon effect composition review: Tactical Mark

- Replaced the dedicated `tacticalMark` effect handler with the existing generic `status` handler and declarative status metadata.
- Preserved the named `tacticalMark` status ID, 15% incoming-damage modifier, 10-point Evasion penalty, three-turn duration, and 5% Max MP unit-defeated reaction.
- Kept both single-target Mark and Full Spectrum Assault application paths aligned; removed the obsolete specialized effect validation path.
- Added a registry assertion that Tactical Mark is not registered as a dedicated effect type.
- Full test suite: 215 passed, 0 failed; golden transcripts and deterministic replay pass.


## 2026-11-20 — Falcon effect composition: reusable status groups

- Added the generic `statusGroup` effect operation: remove matching grouped statuses from a configured side, then apply the declared status entries to the selected target.
- Migrated Zenki's Cipher Tag from a dedicated effect handler to declarative grouped statuses (`cipherTag` and `cipherResDown`); retained both status IDs for Zero Hour and combat consumers.
- Added validation for group identity, replacement side, unique status IDs, and positive status durations.
- Added regression coverage for initial application, replacement of a prior enemy's linked statuses, and reapplication duration refresh.
- Removed the dedicated `cipherTag` handler and updated the architecture, handler reuse audit, roadmap, and project status in place.
- Full test suite: 215 passed, 0 failed; deterministic replay and golden transcript tests pass.


## 2026-11-21 — Falcon effect composition: Railshot

- Removed the dedicated `railshot` effect handler and expressed the attack through generic `masteryHit` data.
- Added reusable mastery-hit accuracy policies (`standard` / `guaranteed`) and ordered conditional power modifiers using shared actor-flag conditions.
- Kept Railshot's 1.1x Energy mastery base, conditional +30% Unobserved power, bonus message text, and guaranteed-hit behavior.
- Preserved next-attack Accuracy-token consumption and the original RNG sequence: no accuracy roll is added; the normal critical roll remains.
- Expanded skill-data validation and regression coverage for configuration, damage conditions, presentation, and RNG draw count.
- Updated the handler reuse audit, architecture reference, roadmap, and project status in place.
- Full test suite: 218 passed, 0 failed; deterministic replay and golden transcripts pass.


## 2026-11-21 — Falcon effect composition: Zero Hour

- Removed the dedicated `zeroHour` effect handler and composed Zero Hour from generic `masteryHit` and `conditionalStatus` effects.
- Extended mastery-hit power modifiers with strict target-HP-percent-below conditions and exact `setPower` overrides, alongside existing actor-flag and percentage modifiers.
- Extended `conditionalStatus` with declarative `requiresStatus` and `requireAlive` gates; follow-up application still skips after a miss.
- Preserved the exact boundary and values: below 40% target HP uses 3.2x Energy power; at exactly 40% it uses 2.4x; successful hits on surviving Cipher-Tagged targets apply -25% SPD for 2 turns.
- Added validation and regression coverage for boundary, fixed power, bonus text, miss, defeat, and missing-tag behavior.
- Updated the handler reuse audit, architecture reference, roadmap, and project status in place. Singularity is now the sole remaining specialized Falcon active-skill effect in this review.
- Full test suite: 224 passed, 0 failed; deterministic replay and golden transcript tests pass. An additional draw-count regression confirms Zero Hour consumes only its normal mastery critical roll when no Accuracy-token check is in play.

## 2026-11-22 — Scaled enemy roster, full enemy kits, and Falcon balance playtest

- Scaled the five standard Training Ground enemy stat profiles against the five-member Falcon prototype roster; enemy party totals are HP +12.7%, ATK +27.4%, MPow -1.9%, DEF +9.0%, RES +3.5%, and SPD -0.7% versus Falcon base totals.
- Added a passive and four declarative abilities (three skills plus an Ultimate) to Training Drone, Rogue Automaton, Siege Turret, Recon Drone, and Toxic Stalker.
- Added five enemy AI policies and role-based target-selection profiles; all 20 enemy abilities execute through the shared skill interpreter.
- Added generic battle-start passive announcement and HP-threshold flag handlers. Enemy passives are initialized by the shared battle-start lifecycle.
- Added source attribution (`sourceId`, `sourceSide`, `kind`) to `DamageApplied` events, including source-retained DoT ticks, and per-actor damage contribution metrics to the simulator.
- Added regression coverage for all 20 enemy skills, enemy data/passives, target profiles, and source-attributed simulation metrics; refreshed golden transcripts for intentional combat-log changes.
- Seeded `trainingGround` playtest: 194/300 victories (64.7%) with random legal player actions; 0/100 victories using basic attacks only. These are initial controller-dependent balance signals, not a final claim of equal player/enemy difficulty.
- `npm test`: 253 passed, 0 failed, 38 skipped legacy assertions superseded by the updated approved-kits and engine tests.


## 2026-11-22 — Tactical Falcon controller and Blightheart boss encounter

- Added a deterministic role-aware tactical Falcon controller that chooses from legal turn-view actions and can be used by the headless simulator (`--policy tactical`).
- Extended turn views with copied status and shield state for tactical decision-making.
- Added generic `masteryDamageAllOpponents` effect handling for both battle sides.
- Added the data-driven Blightheart Overseer boss: phase-change passive, three regular skills, Ultimate, and dedicated AI.
- Added the two-stage `blightheartSanctum` encounter.
- Added boss/passive/skill/tactical-controller tests and updated the enemy balance reference with 150-seed comparison results.
- Verification: 262 tests passed, 0 failed, 38 superseded legacy assertions skipped.


## 2026-11-22 — Tactical Falcon controller, Blightheart boss tuning, and iteration 2 playtest

- Added the deterministic role-aware `tactical` Falcon player policy and exposed copied status/shield data in controller turn views.
- Added the generic `masteryDamageAllOpponents` effect and the two-stage `blightheartSanctum` encounter featuring the phase-changing Blightheart Overseer and four accompanying guards.
- Added boss passive/skill/AI data and regression coverage through the existing shared interpreter and registries.
- Added per-actor and per-skill usage counts to simulator JSON output.
- Tuned the boss after comparing an overly player-favoured profile (91.7% tactical wins) and an over-tuned profile (5.0% tactical wins); retained the intermediate profile for a 150-seed tactical benchmark.
- Final seeded results: `trainingGround` tactical 120/120 wins (100.0%); `blightheartSanctum` random legal-action 2/150 wins (1.3%); `blightheartSanctum` tactical 63/150 wins (42.0%).
- Final verification: `npm test` 263 passed, 0 failed, 38 superseded legacy assertions skipped. These are headless prototype results, not manual GUI tests or a guarantee of player win probability.


## 2026-11-22 — Coordinated Falcon controller, cleanse counterplay, and three-active reserve playtest (Iteration 3)

- Added `ai/falconTacticsV2.js`, a deterministic coordinated policy using legal turn-view actions, dangerous-add prioritization, Toxic DoT awareness, Adaptive Barrier selection, cleanse reservation, and reserve rotation.
- Fixed headless setup so `--active 3` produces a true three-active/two-reserve formation before party initialization.
- Wired `cleanseAllies` into Evalete's live Catalyst Overdrive skill data. It removes harmful/debuff statuses from living active non-summon allies while preserving positive buffs, before healing and defensive effects resolve.
- Added regression coverage for the live cleanse path, Toxic cleanse decisions, adaptive shielding, target focus, reserve switching, and true active/reserve formation.
- Re-ran seeded `blightheartSanctum` batches: coordinated 3-active 103/150 wins (68.7%); random 3-active 1/100 (1.0%); coordinated 5-active 100/100 (100.0%). The five-active result is a formation control, not the main fairness target.
- Three-active coordinated averages: 56.79 rounds, 1.86 party-switch events, 0.91 reserve-deployment events, 1.8 statuses cleansed, 4,432 healing, and 1,844 shield absorption per battle; zero rejected decisions.
- Full verification: `npm test` 273 passed, 0 failed, 38 superseded legacy assertions skipped.
- Added full deterministic victory and defeat transcripts for seeds 996000 and 996004.

## 2026-11-26 — B6.4-A Runtime Integration Audit

- Audited damage, reflected mitigation, DoT, and opt-in effect/control susceptibility integration owners and recommended a staged implementation sequence.
- Recorded unresolved selector/override semantics, neutral fallback, stacking, RNG, duration, and summon/reserve considerations.
- Audit-only; no runtime, combat values, actor metadata, RNG, AI, or golden transcripts changed. All JS syntax checks passed. B6.3 captured full suite output verifies 441 passing.
- See [B6.4-A audit](../reference/FACTION_AFFINITY_RUNTIME_AUDIT_B6.4A.md).
