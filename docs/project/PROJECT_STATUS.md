# Project Status

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Snapshot:** 2026-11-22  
**Runtime:** Node.js CommonJS CLI  
**Preferred scheduler:** Threshold / continuous-time  
**Interactive encounter:** `trainingGround`

## Current approved combat baseline

The five Falcon kits and five Phantom kits use the same owner-agnostic skill interpreter and effect/passive registries. Global Combat Stacking v1 and Effect Timing/Trigger v1 are implemented in the shared runtime. See the [Falcon Implementation Guide](../reference/FALCON_IMPLEMENTATION_GUIDE.md), [Phantom Implementation Guide](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md), and [Combat Mechanics](../reference/COMBAT_MECHANICS.md). The previous Step 9 mechanics summary is historical where it conflicts with ADR-017.

- Meo-9 performs only owner-turn cover fire or Emergency Field healing; no scan, EMP destruction, Final Protocol, or expiry attack.
- Catalyst Wing pulses every second Evalete turn through turn 12 and has no destruction fallback shield.
- Zackry buffs Mpow, and Overwatch only reduces Tactical Marked enemies' Evasion.
- Jazen's Recoil Dampeners stacks Mpow; no immunity, Stagger, or Taunt remains in his Falcon kit.
- Zenki uses Energy mastery and the simplified stealth/precision/three-shot execution kit.
- Catalyst Overdrive cleanses harmful effects, heals, improves DEF, applies 25% direct-damage reflection, and healing over time.
- Phantom skills and passives are integrated into the shared runtime. `elishia_p` appears as **Unknown**, and its player-facing skill/passive descriptions remain neutral.
- Phantom Bleeding uses a provisional 0.15× applier ATK Anomaly tick for 2 affected-unit turns. The source roster did not specify a magnitude; this remains open for owner review.

## Unified playable roster

`characters/roster.js` is the central registry for selectable factions. The current registry exposes five Falcon and five Phantom operatives in one catalog. The interactive selector supports faction, mastery, role, and public-profile search filters; individual character previews; and mixed-faction team building.

- The player selects three to five unique operatives.
- The player orders three active slots, then orders any remaining selected members as reserves.
- The default interactive setup is three active plus up to two reserves.
- Character selection preserves each actor's original faction, role, mastery, skill set, and stats.
- The hidden operative is searchable as `Unknown`; public selection listings and profile previews do not expose its internal actor ID.
- The selector is terminal-based. Saved formations, loadout slots, and a graphical roster screen are not implemented.

See [Unified Character Selection](../reference/UNIFIED_ROSTER_SELECTION.md) for the interaction flow and extension contract.

## Current state

The prototype has a controller-driven battle loop, deterministic seeded randomness, replayable player decisions, typed combat events, two readiness schedulers, declarative Falcon/Phantom/enemy skills, pluggable effect/passive/summon registries with load-time handler validation, data-driven enemy AI, and data-driven multi-wave encounters with reinforcement support.

The interactive entry point is `index.js`. Headless execution and simulation use the same battle engine through `tools/lib/headless.js` and `tools/simulate.js`. Falcon-versus-Phantom testing is supported by the faction-duel harness; the interactive selector currently starts a selected player formation in the configured PvE encounter.

## Implemented capabilities

- Five playable Falcon operatives and five playable Phantom operatives; each faction has 20 active skills plus passive definitions in `characters/skillData/`.
- Unified mixed-faction player selection through `characters/roster.js` and `ui/deploymentSelection.js`.
- Individual character previews with faction, role, mastery, combat stats, passive description, and skill details.
- Three-active/two-reserve selection, manual switching, automatic replacement, and tactical reserve rotation.
- Six enemy archetypes, including the Blightheart Overseer boss; each has a passive, three regular skills, an Ultimate, and a declarative AI policy using the shared skill runtime.
- Tactical controllers for Falcon and Phantom, plus the ordered-rule enemy controller.
- Encounter definitions in `data/encounters/`, including `siegeBreakthrough` and the two-stage `blightheartSanctum` boss encounter.
- Generic AoE and targeting support for player and enemy faction actors.
- Threshold and legacy readiness schedulers; threshold is the default.
- Player-first PvE opening initiative, configurable with `FOD_OPENING`.
- Seeded combat randomness (`FOD_SEED`) and replay from seed, party order, and recorded decisions.
- Controller-driven turns for terminal, enemy AI, summon automation, scripted, and random controllers.
- Typed combat events alongside human-readable logs; damage source attribution includes direct, reflected, and DoT damage.
- Headless simulator output in table, JSON, and CSV formats, plus faction-duel and field-medic substitution harnesses.
- Automated regression coverage including deterministic golden transcripts.

## Verification

The current checkout passes `npm test`: **313 passed, 0 failed, 0 skipped**. Coverage includes the approved Falcon and Phantom kits, mixed-faction roster construction and selection, hidden-operative neutral copy, all enemy skills/passives, registry-backed passive/summon validation, mode-based ally-target enforcement, source-attributed DoT, DoT defeat ordering, owner-linked summon cleanup, reserve lifecycle behavior, shared stacking/timing behavior, faction-side support targeting, and deterministic golden transcripts. Run `npm test` from the project root to verify the current checkout.

See the [Iteration 5 Engine Coverage Audit](ENGINE_COVERAGE_AUDIT.md) for the runtime gaps addressed and the focused regression coverage.

The current Node baseline is 18 or newer. The project has no third-party runtime dependencies.

## Playtest observations

- The 500-battle Falcon-versus-Phantom tactical baseline recorded 355 Falcon wins and 145 Phantom wins (71% vs 29%), with faction seating alternated. The player-side/enemy-side split for Falcon remained close (70%/72%). This is a controller- and formation-dependent headless observation, not a universal matchup estimate.
- The field-medic substitution experiment found that removing Evalete caused large win-rate and sustain drops. The experiment is documented separately and did not change either permanent faction roster.
- Blightheart results depend strongly on party formation and controller. The three-active/two-reserve coordinated configuration is the primary balance target; five-active results are retained only as a control because that formation currently overwhelms the boss.

See [Enemy Archetypes and Balance](../reference/ENEMY_ARCHETYPES_AND_BALANCE.md) and the generated playtest reports for detailed configurations and metrics.

## Known limitations

- The prototype is terminal/headless; there is no graphical battle client.
- The selectable registry currently contains Falcon and Phantom only. Serpent Syndicate has not yet been migrated into the combat runtime or added to the selectable roster.
- The interactive player selector defaults to three active slots and permits up to two reserves. Headless battles retain their explicit configuration/defaults; enemy encounter waves may use different active counts.
- Enemy AI is rule-based rather than adaptive or learning; playtest results depend on the selected player and enemy controllers.
- Encounter reward data and `onEncounterComplete` are integration hooks only. XP, currency, inventory, reward distribution, persistent stage progression, and save/load are not implemented.
- Runtime Falcon base stats in `characters/falcon.js` remain prototype values. Synchronizing them with the owner-maintained stat sheet is a separate open decision.
- Bleeding's 0.15× ATK Anomaly tick remains provisional pending owner review.

## Reference authority

Executable code and automated tests define actual runtime behavior. `references/characterTerraData.js` is the compact owner-reference extract containing selected skill objects and stat information; it is not a full character roster and is not imported by the engine. The owner maintains the separate website-facing character data and applies relevant updates there.

## Development status

The Falcon and Phantom skill/passive migrations, enemy data/AI, shared effect/passive/summon registries, global Combat Stacking v1, Effect Timing/Trigger v1, faction-duel harness, conservative obsolete-code cleanup, unified mixed-faction selector, and Iteration 5 combat effect coverage audit are complete. The next recommended feature is Serpent Syndicate migration into the existing roster and shared skill engine.

See the [architecture reference](../reference/ARCHITECTURE.md), [testing guide](TESTING_AND_PLAYTESTING.md), and [roadmap](ROADMAP.md) for details.
