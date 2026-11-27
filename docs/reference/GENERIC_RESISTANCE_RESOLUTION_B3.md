# Generic Resistance Resolution (B3)

**Status:** Implemented; damage mitigation only. No skill values or actor balance profiles changed.

## Runtime contract

- A status with numeric `resistancePercent` and no filters provides **universal damage resistance** across Physical and all mastery damage channels.
- `resistanceType` remains supported as the legacy single-channel filter.
- `damageTypes` may be supplied as an array to filter to one or more exact damage channels. An empty array matches no channel; a malformed non-array filter contributes no resistance.
- When both `resistanceType` and `damageTypes` are present, both filters must match (intersection).
- The strongest applicable resistance source is used, not additive stacking. Values are clamped to 0–100%. Negative resistance values remain neutral under this resolver.
- Adaptive Barrier's `adaptiveResistance` remains a separate source and applies only to its remembered damage type. It participates in strongest-value stacking with other applicable sources.
- Resistance is applied consistently by Physical damage, mastery damage, and reflected-damage mitigation paths.
- Existing damage floor remains `Math.max(1, floor(...))`; 100% resistance therefore leaves the minimum 1 damage and is not a true immunity.

## Payload examples

Universal:

```js
{ resistancePercent: 20, turns: 2, debuff: false }
```

Single channel (legacy):

```js
{ resistanceType: "Toxic", resistancePercent: 15, turns: 2, debuff: false }
```

Multiple channels:

```js
{ damageTypes: ["Kinetic", "Toxic"], resistancePercent: 25, turns: 2, debuff: false }
```

Filters can be combined, and both must match:

```js
{ resistanceType: "Toxic", damageTypes: ["Toxic", "Nanotech"], resistancePercent: 15, turns: 2 }
```

## Scope boundaries

- No status/control effect chance or duration resistance is implemented; `effectTags` filtering remains future work.
- Actor capability tags from B2 are not consulted by this resolver.
- No weakness, immunity, faction affinity, or faction-wide resistance values are introduced.
- No existing character skills, passive values, enemy definitions, AI policies, RNG ordering, or golden transcripts are intentionally changed.

## Tests

`test/genericResistance.test.js` covers universal resistance across Physical and mastery channels, multi-channel filtering and empty filters, legacy typed compatibility, strongest-value stacking/clamping, Adaptive Barrier interaction, and reflected damage. The full test suite is the compatibility gate.
