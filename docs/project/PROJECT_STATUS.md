# Project Status

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Snapshot:** 2026-11-26  
**Runtime:** Node.js CommonJS CLI  
**Preferred scheduler:** Threshold / continuous-time  
**Interactive encounter:** `trainingGround`

## Current approved combat baseline

Falcon Company, Phantom Rebellion, and Serpent Syndicate use the same owner-agnostic skill interpreter and shared effect/passive/status systems. Global Combat Stacking v1 and Effect Timing/Trigger v1 remain the shared combat rules. See the [Falcon Implementation Guide](../reference/FALCON_IMPLEMENTATION_GUIDE.md), [Phantom Implementation Guide](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md), [Serpent Implementation Guide](../reference/SERPENT_IMPLEMENTATION_GUIDE.md), and [Combat Mechanics](../reference/COMBAT_MECHANICS.md).

- Falcon's five approved kits are implemented, including Meo-9's covering-fire/Emergency Field behavior, Catalyst Wing lifecycle, Mpow support buffs, and the updated Zenki kit.
- Evalete's Catalyst Overdrive cleanses harmful effects, heals, improves DEF, applies 25% non-recursive direct-damage reflection, and provides healing over time.
- Phantom's five kits are integrated. The hidden operative appears as **Unknown**, and all player-facing skill descriptions remain neutral.
- Phantom Bleeding currently uses the owner-requested initial test value of 0.15× applier ATK as Anomaly damage at each affected-unit turn start for 2 turns. It remains a provisional balance baseline, separate from Serpent Poison.
- Serpent's five kits are integrated, including Verra's support modes and Poison, Kane's Poison synergy, Galloz's Reinforcement, Claude's Fracture, and Tekushiki's Tether Marks/Snare/Bind.
- Tekushiki is an official/canon Serpent Syndicate operative by explicit owner authorization on 2026-11-23. His current biography establishes his membership and broad concept while leaving the Tether of Ruin's origin and parts of his past unresolved.

## Unified playable roster

`characters/roster.js` registers three factions and exposes 15 unique selectable operatives: five Falcon, five Phantom, and five Serpent. The terminal selector supports faction, mastery, primary/secondary-role filters, public-profile search, full skill/passive previews, and descriptions for mode-based skills such as Verra's selectable attack/heal abilities.

- Select three to five unique operatives.
- Order three active slots, then order up to two reserves.
- Mix characters from any of the three factions.
- Preserve each actor's faction, role(s), mastery, stats, passive, and skill set.
- Keep the hidden Phantom operative displayed as **Unknown** without exposing its internal ID through selection/search/previews.
- Selection is terminal-based; graphical selection and saved formations are not implemented.

See [Unified Character Selection](../reference/UNIFIED_ROSTER_SELECTION.md).

## B1–B6.2 effect architecture

B1 design, B2 inert actor capabilities, B3 universal/filtered damage resistance, B4 susceptibility/control resolution, B5 opt-in effect integration, and B6.2 affinity schema are completed. B6.2 adds empty faction profile records and validated actor affinity override metadata; no profile values or runtime inheritance are active. B5 adds an opt-in integration helper to shared `status`, `statusEnemies`, and `damageOverTime` handlers. Shared Serpent Poison is tagged `biological-toxin`; Lucaz Stagger is tagged `control:stagger`. These tags do not assign actor capabilities or alter authored effect values. Untagged legacy effects bypass the resolver. Other status routes remain unmigrated. See [B4 contract](../reference/EFFECT_SUSCEPTIBILITY_CONTROL_RESOLUTION_B4.md) and [B5 integration reference](../reference/SUSCEPTIBILITY_INTEGRATION_B5.md).

## Current engine and tools

The prototype has a controller-driven battle loop, deterministic seeded randomness and replay, typed combat events, threshold and legacy readiness schedulers, declarative skills/passives/summons, load-time registry validation, data-driven enemy AI, and multi-wave encounters with reinforcements. Headless simulations use the same engine as interactive play.

- Playable actor factories: `characters/falcon.js`, `characters/phantom.js`, `characters/serpent.js`.
- Unified faction registry: `characters/roster.js`.
- Character skill data: `characters/skillData/`.
- Tactical controllers: `ai/falconTacticsV2.js`, `ai/phantomTactics.js`, `ai/serpentTactics.js`.
- Faction matchup runner: `npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3` (any distinct faction pair is supported; seating alternates).
- Enemy and encounter data: `data/enemies/`, `data/enemySkills/`, `data/enemyAI/`, `data/encounters/`.

## Implemented capabilities

- 15 playable operatives across Falcon, Phantom, and Serpent; five actor skill sets per faction.
- Shared skill interpreter and effect/passive/summon registries with live handler validation.
- Global stacking and effect timing rules.
- Three-active/two-reserve formations, manual switching, automatic replacement, and faction-specific tactical reserve rotation.
- Six enemy archetypes including the two-phase Blightheart Overseer.
- Threshold/legacy scheduler comparison, seeded RNG, deterministic replays, typed events, and direct/reflected/DoT source attribution.
- Headless table/JSON/CSV simulation, faction-duel, and field-medic substitution tools.

## Verification

Current `npm test`: **432 passed, 0 failed, 0 skipped, 0 todo**. The controller-side Taunt legality fix adds four focused TurnView cases and removes the Galloz full-battle todo. A2.1 adds six more Taunt legality-matrix regressions. Coverage includes all 15 playable skill sets, all six enemy skill sets, Serpent passive/effect mechanics, three-faction selection, mode-based target previews, hidden-operative neutral-copy checks, faction-duel execution on either side, effect timing/stacking, source-attributed DoT, reserve/summon lifecycle, and deterministic transcripts.

Additional validation for this Serpent migration: all 145 JavaScript files pass `node --check`, the website-facing JSON parses, the compact owner-reference module loads, and 40 Markdown documents have no broken relative links. Run `npm test` from the project root to verify the checkout.

## Integration smoke observations

- B5 post-integration smoke: Falcon vs Phantom 100 battles (77–23 Falcon), Serpent vs Falcon 20 (16–4 Serpent), and Serpent vs Phantom 20 (9–11); all had zero rejected decisions.
- These are small integration smoke samples, not balance estimates or evidence of final faction strength.

## Known limitations

- The prototype is terminal/headless; there is no graphical battle client.
- The terminal selector does not save/load formations or provide persistent loadout slots.
- Enemy and faction tactical AI are rule-based; outcomes depend on controllers, formation, encounter, and seed.
- Encounter rewards, XP, currency, inventory, persistent progression, and save/load remain unimplemented.
- Runtime Falcon base stats remain prototype values and are not automatically synchronized with the owner-maintained stat sheet.
- Phantom Bleeding's 0.15× ATK Anomaly tick remains a provisional test baseline pending later balance review.
- **A2.1 Taunt legality matrix coverage:** six focused tests exercise longest-duration priority and stable ties, hostile `targetFaction` intersection, ally support with `excludeSelf`/`targetFaction`, player/faction-controller hostile-mode parity, summon eligibility and untargetable fall-through, and targetless all-enemy action targeting. No engine behavior changed in A2.1.

- **Taunt legal-target enforcement is now shared** (`systems/targetingRules.js`) and applied by `core/turnView.js` to hostile single-target actions for player, faction-controller, and neutral-enemy views. `view.opponents` remains unfiltered for tactical context; action target lists are authoritative. Tactical controllers consume those action target lists for single-target selections. AoE behavior is not restricted by Taunt. Post-fix 100-battle samples: Falcon vs Phantom (seats alternate) 76–24; Serpent vs Falcon 67–33; Serpent vs Phantom 43–57. These are directional observations only, not balance conclusions.

## B1–B5 implementation status

- **B1 — Agnostic Effect & Actor Capability Design:** documented the separation of damage channels, effect/control tags, actor capabilities, resistance, weakness, faction affinities, and deterministic resolution boundaries.
- **B2 — Actor Capability Metadata & Validation:** actors expose validated, inert `capabilities` arrays. Four clearly mechanical enemy definitions declare `mechanical` and `electronic-systems`; playable profiles were neutral/undeclared before B6.3; B6.3 now classifies all 15 playable actors as organic, with Galloz additionally electronic-systems. Two ambiguous enemies remain neutral/undeclared. See [B2 metadata contract](../reference/ACTOR_CAPABILITY_METADATA.md).
- **B3 — Generic Resistance Resolution:** universal `resistancePercent` and optional exact `damageTypes` filters apply to Physical, mastery, and reflected damage. Legacy `resistanceType` and Adaptive Barrier remain compatible. Both filters intersect when present. Strongest-value stacking is preserved; capability tags, weakness, effect/control resistance, and faction affinities remain unconnected. See [B3 contract](../reference/GENERIC_RESISTANCE_RESOLUTION_B3.md).

## Data authority

Executable source and tests define runtime behavior. `references/characterTerraData.js` is the compact in-project owner reference; the separate website-facing character JSON remains owner-maintained. The delivered `characterTerraData-serpent-updated.json` includes the Serpent description/role changes for application to the website data. The original uploaded source JSON and previous project archives were preserved.

See [Architecture](../reference/ARCHITECTURE.md), [Testing](TESTING_AND_PLAYTESTING.md), and [Roadmap](ROADMAP.md).

### P1.2.3 Verra action priority audit

- 10 unique Phantom seeds replayed with both seat orientations (20 battles); decision counts analyzed once per seed.
- 69 Verra decisions across 10 unique battles; Verra KO in 10/10.
- All 14 actions at 16–30% HP were self-treatment; rotation decisions did not occur in that HP band.
- At ≤16% HP, 4/6 actions were switches; reserve eligibility was not captured for the two non-switch actions, so no rotation defect was asserted.
- No combat/AI changes. Next recommended instrumentation: reserve HP and switch candidates plus treatment value/next-turn HP delta.

### P1.2.4 Reserve eligibility & treatment value capture

- 10 matched Phantom seed pairs (20 battles; seeds 20261633–20261642) captured Verra decisions with active/reserve HP, legal treatment options, and healing/cleanse events.
- 160 Verra decision snapshots; 148 treatment/remedy actions (106 self-targeted, 71.6%).
- At ≤16% HP, 8 decisions had no safe reserve available; reserve Claude was at 1.33% HP in the critical windows.
- At 16–30% HP, healthy reserves appeared in 38/40 snapshots, but Verra's current 16% switch threshold does not make her eligible in this band absent another outgoing teammate.
- Treatment output: 34,066 actual healing from 36,768 requested (2,702 overheal; 7.35%); 140 cleanse events.
- Diagnostic only. No AI/combat behavior changes. Next: matched rotation-threshold policy experiment, keeping treatment rules and stats fixed.

### P1.2.7 Matchup-dependent rotation policy feasibility

- Telemetry-only feasibility audit across 80 battles (20 seeds, both seats, Phantom/Falcon) captured 2,085 Verra decision snapshots. Current turn view supports reactive state-based policy using HP/status, enemy count/roles/HP, treatment target availability, and reserve health. It does **not** provide rolling incoming-damage/focus history, so true pressure-history adaptation would require a neutral turn-view/engine telemetry addition. Role labels are not validated threat scores. No AI or combat behavior changed; retain 16% default. See `reports/experiments/P1-2-7-matchup-dependent-rotation-feasibility.md`.

## B6.2 faction affinity schema

- `data/factionAffinities.js` defines Falcon, Phantom, and Serpent with empty profiles.
- `systems/factionAffinities.js` validates profile fields, filters, percentages, faction keys, and duration reduction.
- Actor objects expose validated `affinityOverrides`, default `{}`.
- No merge/resolution function consumes affinity data. All factions remain combat-neutral; B6.1 Serpent Toxic proposal remains unapproved/unpopulated. See [B6.2 reference](../reference/FACTION_AFFINITY_SCHEMA_B6.2.md).

## B6.3 actor classification

- All 15 playable actors have `organic` capability metadata. Galloz additionally has `electronic-systems` to reflect cybernetic components and EMP susceptibility.
- Capability metadata remains inert. Enemy profiles unchanged; faction affinity profiles remain empty. Serpent team Toxic resistance is deferred. See [B6.3 reference](../reference/ACTOR_CLASSIFICATION_B6.3.md).
