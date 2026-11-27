# B6.2 — Faction Affinity Schema

**Status:** Implemented schema and validation only. Affinity values are empty and inert.

## Purpose

Separate faction-level affinity data from individual actor capabilities and actor-specific affinity overrides. This milestone introduces a data contract and validation; it does not activate combat behavior.

## Layers

1. **Faction affinity profile** — shared optional values for `falcon`, `phantom`, and `serpent`, stored in `data/factionAffinities.js`. All profiles are currently empty.
2. **Actor capabilities** — existing non-exclusive `capabilities` metadata (B2), describing composition or systems; it remains independent from affinity values.
3. **Actor affinity overrides** — optional partial profile exposed on actors as `affinityOverrides`, validated at actor creation. It is currently unused and defaults to `{}`.
4. **Runtime resolution** — intentionally not implemented in B6.2. No code combines faction profiles and actor overrides or applies them to damage/status/control.

## Schema

Profiles may contain the following optional fields:


```js
{
  damageResistance: [
    { resistancePercent: 10, damageTypes: ["Toxic"] }
  ],
  effectResistance: [
    { effectResistancePercent: 10, effectTags: ["biological-toxin"] }
  ],
  controlResistancePercent: 10,
  controlDurationReduction: 1
}
```

- `damageResistance` entries require a finite `resistancePercent` from 0 through 100. `damageTypes` is an optional non-empty-string list; omission represents an unfiltered entry.
- `effectResistance` entries require a finite `effectResistancePercent` from 0 through 100. `effectTags` is an optional non-empty-string list; omission represents an unfiltered entry.
- `controlResistancePercent` is an optional finite number from 0 through 100.
- `controlDurationReduction` is an optional non-negative integer.
- Duplicate filter tags are removed while preserving order; input arrays are cloned.
- Unknown faction keys, malformed entries, and out-of-range values are rejected.
- An omitted profile is normalized to an empty object.

## Future inheritance/override proposal (not active)

When a later milestone introduces runtime resolution, the proposed contract is:

- An actor receives the faction profile as its baseline.
- An actor-specific override only replaces the matching profile category or matching filtered entry; unspecified categories inherit faction values.
- For an exact same filter selector, actor values take precedence rather than adding to the faction value.
- Different simultaneously applicable sources follow the existing strongest-applicable resistance convention unless a future design gate explicitly approves another rule.
- No automatic weaknesses or capability-derived immunity are inferred.

These semantics are design guidance only; B6.2 does not implement merging or resolution.

## Current data

`data/factionAffinities.js` defines all three faction keys with empty objects. No Serpent Toxic affinity value is approved or populated. Falcon and Phantom remain empty as recommended in B6.1.

## Validation and actor metadata

`systems/factionAffinities.js` exports `FACTIONS`, `validateAffinityProfile`, `validateFactionAffinityConfig`, and `validateActorAffinityOverrides`. `characters/actorFactory.js` validates and exposes `affinityOverrides`, defaulting to `{}`. The schema module has no combat resolver integration.

## Verification

B6.2 tests cover faction keys and neutral defaults, normalization/copy behavior, universal filters, partial overrides, malformed entries and numeric ranges, actor-factory exposure, and the inert configuration contract. No character classifications, faction values, skills, combat systems, RNG, AI, or golden transcripts are changed.
