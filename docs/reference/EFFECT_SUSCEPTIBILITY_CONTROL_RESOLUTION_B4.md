# Effect Susceptibility & Control Resolution (B4)

**Status:** Implemented shared resolver foundation. Existing skill/status execution does not consume it yet; no character effects were migrated in B4.

## API

`systems/effectSusceptibility.js` exports `resolveEffectApplication(target, effect, random)`.

The function returns a decision record with `eligible`, `applied`, `reason`, adjusted `chance`, resolved `duration`, and resistance/roll details when relevant. It is pure with respect to actor state: it reads target metadata and statuses but does not mutate them or apply a status.

## Effect metadata

- `id`: optional status/effect identifier for explicit immunity lookup.
- `effectTags`: array of effect/control tags.
- `requiredCapabilities`: all listed capability tags must be present.
- `requiredAnyCapabilities`: at least one listed capability must be present.
- `excludedCapabilities`: any matching capability blocks the effect.
- `chance`: base proc chance, default 100%, clamped to 0–100.
- `turns`: optional positive base duration; resolved duration is whole turns and never falls below one when a duration is present.

Missing/undeclared actor capabilities remain neutral unless a requirement or exclusion is explicitly authored.

## Immunity

Explicit target passive immunity may be declared in either `passive.immunities` (existing status IDs) or `passive.effectImmunities` (effect IDs/tags). Matching effect ID or tag blocks application before chance is rolled.

## Resistance and control handling

- Status modifier `effectResistancePercent` reduces the proc chance for all effects, unless filtered by its optional `effectTags` array. Multiple applicable values use the strongest value.
- `controlResistancePercent` applies only when the effect includes a tag beginning with `control:`. It is independently strongest-value resolved and then applied after general effect resistance.
- `controlDurationReduction` reduces duration only for control-tagged effects; matching `effectTags` can filter it. Reductions are floored to whole turns and duration remains at least one turn if the effect was otherwise duration-bearing.
- Effect resistance and control resistance are separate categories; each resolves its own strongest applicable modifier. Their resulting multipliers are applied sequentially.
- Damage resistance (`resistancePercent`) is not read by this module and does not implicitly affect control/effect chance or duration.

## RNG and determinism

The caller supplies the battle RNG function. A chance below 100% uses one RNG draw; chance at 0% and 100% skips RNG. The default argument is `Math.random` for standalone use, but battle integration must inject the seeded RNG to preserve deterministic replay.

## Validation / fail-closed behavior

Effect tag and capability requirement arrays must contain non-empty strings; malformed arrays throw `TypeError`. Invalid actor capability metadata falls back to an empty capability list for resolution, maintaining neutral compatibility. Malformed status filter arrays do not match modifiers.

## Non-goals in B4

- No integration into `addStatus` or the active skill interpreter yet.
- No new control skills or migrated status payloads.
- No character, faction, or enemy susceptibility profiles authored.
- No skill values, combat balance, damage formulas, or RNG streams changed.
- No Poison/Corrosion/EMP mechanics introduced.

B4 provides a tested, reusable resolver contract. Integration and representative effect migrations are a later separately scoped step.
