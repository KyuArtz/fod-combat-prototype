# Obsolete Code and Legacy Test Cleanup — 2026-11-22

## Scope

This cleanup was intentionally conservative. It removed code and assertions that no longer have a live consumer under the approved Falcon kit, while retaining reusable combat mechanics, compatibility surfaces, comparison tools, and historical records. It did not change approved skill values or redesign combat behavior.

## Removed as obsolete

- `data/skills/`: duplicate, unreferenced Falcon skill definitions. The live source remains `characters/skillData/`.
- `core/skillEffects.js`: unreachable pre-registry effect implementation. The active shared effect registry and handlers remain in `systems/effects/`.
- Meo-9 scan-damage bonus calculation in `core/actionResolver.js`, its unused damage-formula multiplier argument in `systems/damage.js`, `scan` summon-template propagation in `systems/effects/defaultHandlers.js`, and matching validation in `core/skillDataValidation.js`. The current drone kit has no scan vulnerability mechanic.
- The `finalProtocol` summon handler in `systems/summons/registry.js`, which had no current caller after Meo-9 Final Protocol was removed.
- The dedicated `commandUplink` effect-type validator. Zackry's Mpow buff is implemented by generic `statusAllies`; the existing `commandUplink` label remains only as a status ID.
- `test/skillData.test.js` and `test/ownerFalconMechanics.test.js`, whose remaining active assertions were redundant or superseded by approved-kit tests.
- Superseded skipped assertions and retired Meo-9 scan/fake-context tests. The still-useful status/shield duration regression was retained in `test/effectTiming.test.js`; Adaptive Barrier and real-battle Elishia tests remain in `test/elishiaMechanics.test.js`.

## Preserved intentionally

- `systems/combatReadiness.js` and the `legacy` scheduler option for fixed-tick comparison.
- `ai/falconTactics.js` as the initial deterministic policy, alongside the coordinated `ai/falconTacticsV2.js`.
- `core/skillLifecycle.js` as a compatibility facade for existing callers.
- Generic `nextAttackAccuracy` token handling and Stagger/readiness behavior, even though current Falcon passives no longer grant those effects.
- Generic `conditionalStatus`, `masteryMultiHit`, status grouping, shield handling, summon lifecycle, effect/passive registries, and validation infrastructure.
- Active approved-kit, enemy, battle, replay, simulator, scheduler, and golden-transcript regression coverage.
- Historical ADRs, milestone reports, old implementation notes, and previous playtest records. The old Step 9 finalization document was moved to `docs/history/milestones/STEP9_SUPERSEDED_FALCON_MECHANICS.md` and marked as superseded by ADR-017.

## Documentation maintenance

Current technical references now point to `characters/skillData/`, `systems/effects/`, and the current shared registries. Historical records retain their original paths and decisions but are explicitly labelled as historical where they conflict with ADR-017.

## Verification

- `npm test`: **260 passed, 0 failed, 0 skipped**.
- All JavaScript files pass `node --check`.
- Headless smoke: 10 seeded tactical Blightheart battles completed with 0 rejected decisions. The sample produced 0 victories, so it was treated strictly as a plumbing check, not a balance result.
- Internal relative Markdown links: 0 missing.
- Previous Iteration 3 source archive and original owner JSON were not modified.
