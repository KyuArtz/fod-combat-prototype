# Project Status

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Snapshot:** 2026-11-22  
**Runtime:** Node.js CommonJS CLI  
**Preferred scheduler:** Threshold / continuous-time  
**Default encounter:** `trainingGround` (five active Falcon agents versus five active enemies)

## Current approved combat baseline (2026-11-22)

The five Falcon skill kits have been updated to the owner's approved kit v1. The global Combat Stacking v1 and Effect Timing/Trigger v1 rules are implemented in the shared runtime. Current authoritative details are in [Falcon Implementation Guide](../reference/FALCON_IMPLEMENTATION_GUIDE.md) and [Combat Mechanics](../reference/COMBAT_MECHANICS.md). The previous Step 9 mechanics summary is historical where it conflicts with ADR-017.

- Meo-9 now performs only owner-turn cover fire or Emergency Field healing; no scan, EMP destruction, Final Protocol or expiry attack.
- Catalyst Wing is targetable and passive; it pulses on every even Evalete turn through turn 12 and has no destruction fallback shield.
- Zackry buffs Mpow, and Overwatch only reduces Tactical Marked enemies' Evasion.
- Jazen's Recoil Dampeners stacks Mpow; no immunity, Stagger or Taunt remains in his Falcon kit.
- Zenki uses Energy mastery and his simplified stealth/precision/three-shot execution kit.
- Catalyst Overdrive reflects 25% of direct incoming damage for 3 turns without recursive reflection.
- Latest regression: 273 pass, 0 fail, 38 superseded legacy assertions skipped (311 total tests reported by Node's test runner).
- Added the initial deterministic tactical Falcon controller and the two-stage `blightheartSanctum` boss encounter.
- Added a coordinated controller with Toxic DoT awareness, cleanse prioritization, adaptive barrier selection, focus-fire rules, and active/reserve rotation.
- Evalete's live Catalyst Overdrive now cleanses harmful effects from active allies before applying its healing and defensive effects; positive buffs are preserved.
- Iteration 3 three-active boss benchmark: coordinated policy 103/150 victories (68.7%); random legal-action control 1/100 (1.0%). The five-active coordinated control won 100/100, showing that the five-active formation currently overwhelms this boss. These are controller-dependent headless observations, not universal balance estimates.
- Standard Training Ground enemy totals vs Falcon base totals: HP +12.7%, ATK +27.4%, MPow -1.9%, DEF +9.0%, RES +3.5%, SPD -0.7%. The boss encounter uses a separate tuned profile. See [Enemy Archetypes and Balance](../reference/ENEMY_ARCHETYPES_AND_BALANCE.md).

## Current state

The prototype has a controller-driven battle loop, deterministic seeded randomness, replayable player decisions, typed combat events, two readiness schedulers, declarative Falcon and enemy skills, a pluggable effect-handler registry, data-driven enemy AI, and data-driven multi-wave encounters with reinforcement support.

The interactive entry point is `index.js`. Headless execution and simulation use the same battle engine through `tools/lib/headless.js` and `tools/simulate.js`.

## Implemented capabilities

- Five playable Falcon agents with 20 active skills and passive definitions in `characters/skillData/`.
- Six enemy archetypes, including the Blightheart Overseer boss; each has a passive, three regular skills, an Ultimate, and a declarative AI policy using the shared skill runtime.
- Role-specific enemy target selection and two deterministic Falcon player controllers: the initial policy (`ai/falconTactics.js`) and coordinated reserve-aware policy (`ai/falconTacticsV2.js`).
- Encounter definitions in `data/encounters/`, including `siegeBreakthrough` and the two-stage `blightheartSanctum` boss encounter.
- Generic `masteryDamageAllOpponents` support for declarative AoE abilities used by either side.
- Turn views expose copied status and shield state for policy/UI decisions without exposing mutable engine actors.
- Per-instance enemy stat overrides and defeat-count-triggered reinforcement groups.
- Threshold and legacy readiness schedulers; threshold is the default.
- Player-first PvE opening initiative, configurable with `FOD_OPENING`.
- Seeded combat randomness (`FOD_SEED`) and replay from seed, party order, and recorded decisions.
- Controller-driven turns for terminal, enemy AI, summon automation, scripted, and random controllers.
- Shared basic-attack resolution for player and enemy actions.
- Typed combat events alongside human-readable logs.
- Headless simulator output in table, JSON, and CSV formats.
- Automated regression coverage including deterministic golden transcripts.

## Verification

The current runtime passes `npm test`: **273 passed, 0 failed, 38 superseded legacy assertions skipped**. Coverage includes approved Falcon kits, all 20 enemy skills, enemy passive stat modifiers and triggers, enemy stat-scaling bounds, source-attributed direct/reflected/DoT damage, shared stacking/timing behavior, and deterministic golden transcripts. Golden fixtures were regenerated for intentional behavior changes. Run `npm test` from the project root to verify the current checkout.

The three-active formation and two-reserve rotation are now covered by headless regression tests. The current Node baseline is 18 or newer. The project has no third-party runtime dependencies.

## Known limitations

- The prototype is terminal/headless; there is no graphical battle client.
- The default formation uses five active units per side. Encounter waves currently require at least five enemy entries.
- Only defeat-count reinforcement triggers are supported; reinforcement units enter the enemy reserve and deploy through normal replacement.
- Enemy AI is ordered-rule logic, not an adaptive or learning opponent; playtest results depend on the chosen player controller.
- Blightheart results depend strongly on party formation and controller: Iteration 2 five-active tactical baseline was 42.0%; Iteration 3 coordinated three-active/two-reserve is 68.7% over 150 seeds, while coordinated five-active is 100% over 100 seeds. Do not compare these as an isolated controller change because both formation and controller changed. The three-active configuration is the primary balance target; these results are not manual player win probabilities.
- `siegeBreakthrough` retains encounter-specific low-progression stat overrides and should not be confused with the scaled `trainingGround` balance benchmark.
- Encounter reward data and `onEncounterComplete` are integration hooks only. XP, currency, inventory, reward distribution, persistent stage progression, and save/load are not implemented.
- Runtime Falcon base stats in `characters/falcon.js` remain prototype values. A separate owner-approved stat-sheet synchronization decision is still open.

## Reference authority

Executable code and automated tests define actual runtime behavior. `references/characterTerraData.js` is the compact owner-reference extract containing selected skill objects and stat information; it is not a full character roster and is not imported by the engine. The owner maintains the separate website-facing character data and applies relevant updates there.

## Development status

Steps 1–9, the shared skill effect-registry pipeline, passive event registry and generic summon lifecycle registry are complete. Falcon skill/passive data is active under `characters/skillData/`; `characters/skills.js` builds the character and enemy registries through `core/skillInterpreter.js`. Passive subscriptions are dispatched through `systems/passives/registry.js`; reusable skill effects are in `systems/effects/`; summon owner-turn activation is in `systems/summons/`. Global Combat Stacking v1 and Effect Timing/Trigger v1 are recorded in ADR-017 and covered by the current approved regression tests. Earlier Step 9 balance details are historical wherever they conflict with ADR-017.

See the [architecture reference](../reference/ARCHITECTURE.md), [testing guide](TESTING_AND_PLAYTESTING.md), and [roadmap](ROADMAP.md) for details.


### Historical passive-registry migration note

This paragraph records the state at the start of the passive-registry migration, not the current state: the migration introduced `systems/passives/registry.js` and declarative event subscriptions. Subsequent increments migrated Catalyst Protocol, Biotech Overdrive, summon lifecycle, and the remaining defensive modifier/targeting configuration. The current audit result is summarized above.

## Passive lifecycle migration status

- Declarative passive event subscriptions and a battle-scoped handler registry are active under `systems/passives/`.
- Evalete's Catalyst Protocol uses registered lifecycle handlers for the targetable passive Catalyst Wing, periodic healing/shields, and destruction shutdown (no fallback shield).
- Elishia's Biotech Overdrive uses registered battle-start/turn-end handlers and generic timer-keyed stat modifiers; no character-specific timer field remains.
- Unobserved, Recoil Dampeners, and Overwatch Protocol were migrated in the preceding passive-registry step.
- Meo-9's Emergency Field and cover fire use declarative owner-turn activation handlers in `systems/summons/registry.js`; Final Protocol was removed by ADR-017. Summon destruction owner reactions remain generic and data-driven. No Phantom Rebellion content is part of this snapshot.
- Defensive modifier follow-up: Unobserved now uses generic `passiveFlags`, conditional `statMods`, and typed `incomingAttackMods`; no Unobserved-specific field or branch remains in shared combat systems. Railshot bonus state is also tracked through the generic passive flag contract.
- Railshot uses generic mastery-hit data for conditional power and guaranteed accuracy; no Railshot-specific effect handler remains.
- Zero Hour uses generic mastery-hit target-HP modifiers and a gated conditional-status follow-up; no Zero Hour-specific effect handler remains.
- Historical verification at the passive-registry migration milestone: 233 passed, 0 failed, 38 superseded legacy assertions skipped. The current verification is listed in the sections above.
