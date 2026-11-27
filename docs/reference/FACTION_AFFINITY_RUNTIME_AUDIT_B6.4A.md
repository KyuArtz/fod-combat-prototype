# B6.4-A — Faction Affinity Runtime Integration Audit

**Status:** Audit completed. No runtime changes made.

## Existing runtime paths

### Damage

- `systems/damage.js` owns calculation/mitigation for Physical and mastery damage through `calculatePhysicalDamage` and `calculateMasteryDamage`.
- Both calculations apply the existing resistance resolver (`resistanceMultiplier`) before the final damage floor.
- `mitigateReflectedDamage` is a separate damage-calculation path and also uses `resistanceMultiplier`.
- `core/actionResolver.js` routes basic attacks and skill-hit calculations through the damage calculation functions and applies calculated damage through the battle's damage callback.
- DoT status payloads are calculated through mastery damage when authored via the generic `damageOverTime` effect handler. Turn-start DoT ticks in `systems/statusEffects.js` apply their stored damage through the battle damage callback.
- `systems/damageApplication.js` is the HP/shield application layer. It receives already-calculated damage and handles shield absorption, HP loss, incapacitation, and reactions; it is not the current resistance-calculation owner.

### Effect and control susceptibility

- `systems/effectSusceptibility.js` provides pure `resolveEffectApplication`.
- The resolver currently reads target capabilities, explicit passive immunities, effect tags, and status-based effect/control resistance and duration reduction.
- `systems/effects/defaultHandlers.js` uses its opt-in `applyStatusEffect` helper for `status`, `statusEnemies`, and `damageOverTime` effects that include susceptibility metadata.
- Legacy status routes without susceptibility continue to bypass the resolver.
- Successful migrated statuses carry their effect tags for status-based matching.

### Affinity data

- `data/factionAffinities.js` currently contains empty profiles for `falcon`, `phantom`, and `serpent`.
- `systems/factionAffinities.js` validates faction profiles and actor partial overrides; it does not merge or resolve them.
- `characters/actorFactory.js` exposes validated `affinityOverrides`, defaulting to `{}`.
- Faction identity is authored on actors by faction roster constructors. Actor capability metadata remains separate from faction identity and affinity values.

## Recommended integration ownership

1. Add a pure profile-resolution layer in `systems/factionAffinities.js` or a focused sibling module. It should accept the target actor and validated faction config, resolve the faction profile plus actor override, and return a normalized defensive profile without mutating actors/config.
2. Damage affinity should be consumed by the damage calculation layer (`systems/damage.js`), not `systems/damageApplication.js`, so it can remain consistent with existing channel/type resistance handling and the damage floor. Verify direct Physical, mastery, reflected, and DoT-calculation paths.
3. Effect/control affinity should be injected into the susceptibility resolver's resistance inputs, keeping `systems/effectSusceptibility.js` pure. The opt-in handler path remains the integration boundary; legacy effects must continue to bypass susceptibility unless explicitly migrated.
4. Do not activate capability gating merely because an actor has a capability tag. Affinity resistance and capability eligibility are distinct mechanics.

## Resolution contracts requiring explicit decision before implementation

- **Faction baseline:** whether an actor receives only its own faction profile or also any other profile (recommended: own faction only).
- **Actor override precedence:** the B6.2 documentation proposes matching-selector actor overrides replacing matching faction entries while unspecified categories inherit; this is not implemented. Define exact matching for universal entries, filtered entries, multiple tags, and empty filters before runtime use.
- **Same-category sources:** preserve existing strongest-applicable resistance behavior rather than additive stacking unless explicitly approved.
- **Damage/effect separation:** damage resistance must not implicitly alter status application chance, effect resistance, control resistance, or duration.
- **Duration floors:** current control-duration logic keeps a positive base duration at a minimum of one turn; affinity duration reduction should preserve that contract unless separately approved.
- **RNG:** profile resolution and resistance application should not consume RNG. Susceptibility retains its existing seeded RNG behavior for chance rolls; guaranteed applications should not add RNG draws.
- **Neutral fallback:** missing faction/profile/override data resolves to an empty profile and therefore neutral behavior.
- **Summons/reserves:** inspect and test their actor faction/profile data explicitly during integration; do not infer behavior from active slot alone.

## Integration sequence recommended

- **B6.4-B:** pure affinity profile resolution and selector/override tests only; no combat consumers.
- **B6.4-C:** damage affinity integration after approved merge semantics; focused damage-path tests.
- **B6.4-D:** effect/control affinity integration after approved tag and duration semantics; preserve legacy bypass.

## Scope / verification

- No combat code, data values, actor profiles, affinity values, skills, AI, RNG, or golden transcripts were modified in this audit.
- All JavaScript files passed `node --check` during the audit.
- The packaged B6.3 test output confirms a completed full suite: 441 passed, 0 failed, 0 skipped, 0 todo; duration 13,922.372495 ms. This corrects the previous session's timeout caveat: that captured run was complete, not truncated.
- Full `npm test` was not rerun as part of this audit-only checkpoint.
