# AI Handoff / Project Continuation Context

Use this document as a concise starting point for future F.O.D. development sessions. It is a navigation and guardrail document; detailed behavior belongs in technical references and executable source.

## Current snapshot

- Project: F.O.D. (Fragments of Decay) combat prototype.
- Runtime: Node.js CommonJS, Node 18+; no third-party runtime dependencies.
- Default scheduler: `threshold`; `legacy` remains available for comparison.
- Default interactive flow: unified mixed-faction roster selection across Falcon Company, Phantom Rebellion, and Serpent Syndicate (3–5 unique operatives; first three active, remaining selected members become reserves), followed by `trainingGround`.
- Current roster: 15 selectable operatives, five per faction. Tekushiki is an official/canon member of Serpent by user authorization on 2026-11-23.
- Current verification: `npm test` — **425 passed, 0 failed, 0 skipped, 0 todo**. Shared Taunt legal-target enforcement is implemented in `systems/targetingRules.js` and `core/turnView.js`; tactical skill-decision helpers in all four controllers now fall back to an action-legal target when their strategic target is outside the legal list.
- All three faction tactical controllers and symmetric faction-duel simulations are integrated.

## Start every work session by

1. Inspect the actual Git branch, working tree, and latest files. A ZIP snapshot is not proof of the latest remote commit.
2. Read [project status](PROJECT_STATUS.md), [architecture](../reference/ARCHITECTURE.md), and the relevant focused reference.
3. Run `npm test` before making changes.
4. Identify the exact source and tests that own the behavior being changed.
5. Make incremental changes and rerun targeted tests plus the full suite.

Do not commit, push, or merge unless explicitly requested.

## Architecture boundaries

- `core/battle.js` is the composition root.
- `core/turnEngine.js`, `core/turnRunner.js`, `core/turnView.js`, and `core/decisions.js` own turn flow and action validation.
- `ai/enemyAI.js` evaluates data-defined enemy policies; `ai/targeting.js` owns generic enemy target selection.
- `ai/falconTacticsV2.js`, `ai/phantomTactics.js`, and `ai/serpentTactics.js` contain faction-specific tactical policies.
- `core/actionResolver.js` owns shared basic-attack execution; `core/skillInterpreter.js` owns skill execution orchestration.
- `core/skillLifecycle.js` is a compatibility facade; `systems/passives/runtime.js` owns passive, summon, and actor lifecycle hooks.
- `systems/effects/` owns declarative effect handlers and registry; `systems/passives/` and `systems/summons/` own lifecycle registries.
- `core/skillDataValidation.js` validates skill definitions and passive/summon contracts.
- `characters/falcon.js`, `characters/phantom.js`, and `characters/serpent.js` create faction actors; `characters/roster.js` owns the unified selectable-faction registry.
- `characters/skillData/` owns the live Falcon, Phantom, and Serpent skill/passive definitions; `characters/skills.js` builds the registries through the shared interpreter.
- `data/` owns enemy skills, archetypes, AI policy, and encounter definitions.

See [Architecture](../reference/ARCHITECTURE.md) for the full module map.

## Determinism and regression rules

- Combat RNG is stored as plain data in `state.rng`; engine randomness must use the injected battle RNG.
- Preserve random-call order when refactoring existing behavior unless a deliberate behavior change is approved.
- Replays depend on seed, party order, and accepted decisions.
- Golden transcript changes require deliberate regeneration, review, and a changelog explanation.
- Use `structuredClone(state)` for scheduler previews; JSON cloning breaks object references held by the threshold ready queue.

## Data and canon authority

- Runtime behavior is defined by executable code, data definitions, and automated tests.
- Falcon, Phantom, and Serpent skill data: `characters/skillData/*.js`.
- Enemy skill data: `data/enemySkills/*.js`; archetypes and policies: `data/enemies/*.js`, `data/enemyAI/*.js`; encounters: `data/encounters/*.js`.
- `references/characterTerraData.js` is a compact owner-reference extract containing selected skill objects and stats; it is not a full roster and is not imported by the engine.
- The owner maintains separate website-facing character data. Use the supplied updated JSON when relevant, but do not overwrite original uploads or package the full original JSON into the prototype archive.
- The hidden operative key `elishia_p` must remain player-facing as `Unknown`; keep all descriptions and roster preview output neutral.
- Tekushiki is canon as a Serpent member by explicit owner authorization. Keep his broad established identity (former scientist turned rogue operative, Tether of Ruin, Serpent Syndicate) but do not invent the tether's origin or unexplained past details unless the owner asks.
- Do not silently canonize Kane, Galloz, Claude, or other backstories whose source text remains labelled as a development proposal.

## B1–B3 — Effect and resistance architecture

B1 design is documented in [Agnostic Effect & Actor Capability Design](../reference/AGNOSTIC_EFFECT_ACTOR_CAPABILITY_DESIGN.md); B2 actor metadata contract is [here](../reference/ACTOR_CAPABILITY_METADATA.md); B3 generic damage-resistance contract is [here](../reference/GENERIC_RESISTANCE_RESOLUTION_B3.md); B4 resolver contract is [here](../reference/EFFECT_SUSCEPTIBILITY_CONTROL_RESOLUTION_B4.md). Universal `resistancePercent` applies to all damage channels; optional `damageTypes` filters exact channels; legacy `resistanceType` remains supported. If both filters are present, both must match. Strongest-value stacking remains in force, and Adaptive Barrier still only affects its remembered type. B4 adds a pure resolver for capability requirements/exclusions, explicit immunity, effect/control chance resistance, and control duration reduction. It is not integrated into current status application; no character effects or balance values changed. B3 baseline: 412; current suite: 425.

## Current character mechanics

- Falcon uses the approved owner-reviewed kits and global stacking/timing rules. See [Falcon Implementation](../reference/FALCON_IMPLEMENTATION_GUIDE.md).
- Phantom uses five migrated kits; the hidden operative remains neutral. Bleeding is provisionally 0.15× applier ATK as Anomaly damage at each affected-unit turn start for 2 turns. See [Phantom Implementation](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md).
- Serpent uses five migrated kits. Verra Poison ticks at 0.25× her Mpow; Kane and Claude Poison tick at 0.20× their Mpow for two affected-unit turns. Poison is distinct from Phantom Bleeding. See [Serpent Implementation](../reference/SERPENT_IMPLEMENTATION_GUIDE.md).

## Faction testing

Run an alternating-seat matchup with:

```bash
npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3
npm run simulate:factions -- --player serpent --opponent phantom --battles 100 --active 3
```

Available player/opponent factions are `falcon`, `phantom`, and `serpent`; they must be different. Small smoke batches are execution checks only; use larger seed ranges and inspect per-actor metrics before proposing balance changes.

## Known limitations

- Interactive selection is terminal-based; no graphical roster screen or saved formation persistence is implemented.
- Enemy and faction AI are deterministic rule-based policies, not learning systems.
- Encounter rewards, XP, inventory, persistent stage progression, and save/load are not implemented.
- Runtime Falcon stats remain prototype values pending a separate stat-sync decision.
- **A2.1 Taunt legality matrix tests:** six added regressions cover longest Taunt priority/tie stability, hostile targetFaction intersection, support targeting with excludeSelf/targetFaction, player and faction-controller mode parity, eligible summon/untargetable Taunter handling, and targetless all-enemy actions. Test-only; no engine changes.

- **Taunt legal-target enforcement is shared** (`systems/targetingRules.js`) and applied by `core/turnView.js` to hostile single-target action targets in player, faction-controller, and neutral-enemy views. `view.opponents` remains unfiltered for tactical context; action target lists are authoritative. The existing tactical controllers use those action target lists for single-target selection. AoE target behavior is intentionally unchanged. Post-fix seed samples: 100 Falcon-vs-Phantom battles (seat alternation) yielded Falcon 76 / Phantom 24; 100 Serpent-vs-Falcon yielded Serpent 67 / Falcon 33; 100 Serpent-vs-Phantom yielded Serpent 43 / Phantom 57. Treat these as execution smoke samples only, not balance evidence.

## Documentation rules

Use the [documentation index](../README.md) to navigate. Keep current state in `PROJECT_STATUS.md`, plans in `ROADMAP.md`, design decisions in `DECISIONS.md`, implementation history in `CHANGELOG.md`, and detailed historical scope in milestone reports. Historical milestones preserve the capabilities and limitations known at their own dates and must not be mistaken for current status.

- **P1.2.4 audit completed (diagnostic only):** 10 paired-seat Phantom seeds (20 battles) captured 160 Verra decision snapshots, reserve health/eligibility, treatment options, and healing/cleanse events. 148 treatment actions; 106 self-targeted (71.6%). At ≤16% HP, 8 decisions had no safe reserve; the reserve Claude was at 1.33% HP in those windows. At 16–30% HP, a healthy reserve was present in 38/40 snapshots, but Verra is not switch-eligible until 16% under current policy. Treatment output: 34,066 actual healing from 36,768 requested (2,702 overheal, 7.35%) and 140 cleanse events. No AI changes. Next: isolated threshold-policy comparison with matched seeds/seats.

- **P1.2.7 feasibility audit completed (telemetry only):** 80 matched-seat battles (20 seeds, Phantom/Falcon) captured 2,085 Verra decisions. Existing decision view supports reactive context (HP/status, enemies, ally/reserve health, action availability), but has no rolling incoming-damage/focus-fire history. Avoid opponent-name and unvalidated role-weight heuristics; keep Verra threshold at 16%. Next if pursued: design a minimal faction-neutral recent-damage view field, then test a prototype separately.


## Current B5 susceptibility integration

B5 is completed. The B4 resolver is opt-in through `applyStatusEffect` in `systems/effects/defaultHandlers.js`, used by `status`, `statusEnemies`, and `damageOverTime`. The shared Serpent Poison effect is tagged `biological-toxin`; Lucaz's two Stagger payloads are tagged `control:stagger`. Tags are stored on successful migrated statuses for resistance matching. The helper uses the battle-injected seeded RNG. Untagged legacy status effects still call `addStatus` directly; other handlers/status routes are not migrated. No actor capability profiles or balance values were assigned. Seven new tests are in `test/b5SusceptibilityIntegration.test.js`. Baseline was 425; current suite is 432 passing. See `docs/reference/SUSCEPTIBILITY_INTEGRATION_B5.md`.

Faction smoke results (not balance estimates): 100 Falcon vs Phantom battles = Falcon 77 / Phantom 23; 20 Serpent vs Falcon = Serpent 16 / Falcon 4; 20 Serpent vs Phantom = Serpent 9 / Phantom 11; all had zero rejected decisions.

## B6.2 faction affinity schema

B6.2 adds the inert schema in `systems/factionAffinities.js`, empty faction profiles in `data/factionAffinities.js`, and validated actor `affinityOverrides` in `characters/actorFactory.js`. The supported profile fields are damage resistance entries, effect resistance entries, control resistance percentage, and control duration reduction. No faction values are populated and no runtime merge/apply path exists. Preserve neutral behavior. See `docs/reference/FACTION_AFFINITY_SCHEMA_B6.2.md`.

## B6.3 approved actor classification

All current playable actors are explicitly classified `organic`. Galloz is `organic` + `electronic-systems` because of cybernetic components and EMP susceptibility. Armor/shields are equipment and do not change composition. Fully android future characters should be classified from confirmed lore; none are added here. Capability metadata is still inert. The full-Serpent Toxic resistance idea is deferred. See `docs/reference/ACTOR_CLASSIFICATION_B6.3.md`.
