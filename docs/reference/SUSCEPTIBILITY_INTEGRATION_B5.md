# B5 — Susceptibility Integration & Representative Effect Migration

**Status:** Completed and verified on 2026-11-26.

## Scope

B5 connects the B4 pure resolver to selected live declarative effect handlers. Integration is opt-in: effects without a `susceptibility` block retain their legacy `addStatus` path and do not consume the resolver or additional RNG.

## Runtime integration

- `systems/effects/defaultHandlers.js` imports `resolveEffectApplication` and adds a local `applyStatusEffect` helper.
- The helper is used by the generic `status`, `statusEnemies`, and `damageOverTime` handlers when an effect includes susceptibility metadata.
- A rejected susceptibility application does not call `addStatus`; therefore the status-applied event is not emitted for rejected effects.
- An accepted effect retains its existing status payload, carries its `effectTags` for tag-filtered resistance matching, and uses the resolver's duration when applicable.
- The battle-provided seeded `random` function is passed into the resolver. Automatically resolved 0%/100% chances skip RNG draws, as the B4 resolver contract specifies.
- The resolver is not connected to all status application routes. `statusSelf`, `statusAllies`, `statusGroup`, passives, and other legacy paths remain unchanged unless separately migrated.

## Representative migrations

### Shared Serpent Poison

`characters/skillData/effects/poison.js` now opts into the `biological-toxin` effect tag. Poison values, turn count, damage type, attribution, and tick timing are unchanged. The migration does **not** require a biological capability, because playable actors and several enemy profiles remain undeclared; no broad roster classification or blanket immunity was inferred. Existing targets without matching resistance remain neutral and Poison applies at its prior guaranteed chance.

### Lucaz Stagger

Both existing Lucaz `staggered` applications now opt into the `control:stagger` tag. Their one-turn duration and CR delay remain unchanged. The tag makes control-resistance and control-duration modifiers available to this effect without adding new control profiles or balance values.

## Validation

`core/skillDataValidation.js` validates susceptibility metadata on supported effect types: susceptibility must be a non-array object with non-empty `effectTags`, any supplied capability fields must be arrays of non-empty strings, and optional chance must be numeric in 0–100. Susceptibility metadata is restricted to `status`, `statusEnemies`, and `damageOverTime` in this milestone.

## Tests

Seven new focused tests cover:

1. Poison rejection does not undo preceding direct damage.
2. Poison applies with a successful injected deterministic roll under partial effect resistance.
3. Stagger applies control resistance and duration reduction independently.
4. Capability gating is enforced for opted-in effects while untagged legacy statuses bypass the resolver.
5. Malformed susceptibility metadata is rejected during skill validation.
6. Guaranteed 100% applications do not consume injected RNG.
7. The migration remains limited to shared Poison and Lucaz's two Stagger payloads.

## Explicitly unchanged

- No skill values, MP costs, cooldowns, status duration values, DoT powers, or faction balance changes.
- No broad capability assignment or actor susceptibility profiles.
- No migration of Bleeding, EMP, Corrosion, other controls, passive statuses, or grouped effects.
- No change to the B3 damage-resistance resolver.
- No manual golden-transcript edits.

## Verification

- B4 baseline: **425 tests passed**.
- B5 final: **432 tests passed, 0 failed, 0 skipped, 0 todo**.
- Focused integration and faction migration tests: **66 passed**.
- `npm run simulate:factions` Falcon vs Phantom: 100 battles, 77–23 Falcon, 0 rejected decisions (execution smoke sample).
- Serpent vs Falcon: 20 battles, 16–4 Serpent, 0 rejected decisions.
- Serpent vs Phantom: 20 battles, 9–11 Serpent/Phantom, 0 rejected decisions.
- The faction samples are not balance conclusions; they are smoke checks and are too small to support tuning.
