# Agnostic Effect & Actor Capability Design (B1)

**Status:** Design proposal; approved for design work, not implementation.
**Scope:** Establish extensible boundaries for damage, resistance, weaknesses, statuses, control effects, and actor-specific susceptibility before expanding the live combat runtime.

The executable prototype and tests remain authoritative for current combat behavior. Everything in this document is proposed unless explicitly marked as existing.

## Goals

- Add new combat interactions through reusable data and resolver contracts, not character-name branches.
- Separate damage channels, status effects, control effects, and actor capabilities.
- Permit faction/theme defenses without making faction membership the only source of susceptibility.
- Support organic, mechanical, synthetic, hybrid, and constructed actors without mutually exclusive hardcoded classes.
- Keep RNG use deterministic and avoid changing existing combat outcomes during architecture introduction.
- Preserve the current skill interpreter and registries where possible; extend only when a reusable effect cannot be expressed through existing handlers.

## Current implementation baseline (verified in the A2.1 snapshot)

- Mastery damage uses the eight mastery strings: Energy, Kinetic, Electromagnetic, Toxic, Nuclear, Nanotech, Cryogenic, and Anomaly. Physical damage is a separate path.
- `systems/damage.js` currently resolves mastery resistance from `stats.masteryResistance`, then status-based typed resistance (`resistanceType`/`resistancePercent`) and damage-taken modifiers.
- Status-based typed resistance currently matches a single damage type and selects the strongest applicable percentage. It is not a universal resistance.
- Actor factories set `faction`, `role`, `mastery`, `stats`, and other runtime fields, but there is no common body/composition/capability metadata contract yet.
- The shared effect registry supports declarative effects; status, damage, control-like status payloads, and passive reactions are expressed through current handlers and registries rather than one unified effect-resolution schema.
- `systems/statusEffects.js` blocks statuses by passive immunities and has a global same-status refresh/stacking rule. It does not yet resolve effect tags against actor capabilities.

## Proposed conceptual vocabulary

### 1. Damage channel

The channel identifies the damage calculation/resistance bucket. Keep the existing channels stable for compatibility:

- `Physical`
- Existing masteries: `Energy`, `Kinetic`, `Electromagnetic`, `Toxic`, `Nuclear`, `Nanotech`, `Cryogenic`, `Anomaly`

New channels should be added only when they need distinct damage calculation or resistance behavior. Do not create a new damage channel merely to represent a status condition.

### 2. Effect tags / conditions

These describe the interaction independently of damage. Initial examples for future design include:

- `biological-toxin` — poison/biological disruption that requires a compatible biological process
- `corrosion` — material degradation, especially where metallic/material components are susceptible
- `emp-disruption` — disruption of electronic systems, separate from Electromagnetic damage itself
- `control:stagger`, `control:stun`, `control:immobilize` — distinct control outcomes

These are illustrative identifiers, not approved skill IDs or a final naming convention.

### 3. Actor capabilities

Capabilities are non-exclusive tags. A unit may have several; hybrids should not need a new branch in the engine. Proposed profile tags:


- `organic` / `biological-processes`
- `mechanical` / `electronic-systems`
- `synthetic`
- `construct`
- `metallic-components`
- `nanotech-interface`
- `insulated-electronics`
- `corrosion-resistant-materials`

Prefer capabilities over assumptions from faction, mastery, or role. A profile tag alone should not grant blanket immunity unless an explicit rule says it does.

## Proposed resolution responsibilities

| Layer | Responsibility | Must not own |
|---|---|---|
| Skill/effect data | Declares damage channel, status/control payload, conditions, base proc chance, duration | Target-specific hardcoded exceptions |
| Actor profile | Declares actor capabilities/composition | Skill behavior or balance values |
| Faction trait | Optional shared baseline affinity/resistance for members | Actor-specific exceptions or global resolver logic |
| Resistance/weakness rules | Resolve applicable damage mitigation or effect susceptibility | Skill selection / AI intent |
| Effect resolver | Apply status/control only after relevant conditions and susceptibility checks | Character names or faction-specific branches |
| Damage resolver | Calculate damage and apply damage resistance layers | Status/control success rules unless explicitly coupled |

## Proposed order of resolution

1. Validate that the declared effect is well-formed and that the target is eligible.
2. Resolve the damage component using the existing damage channel and stat formula.
3. Apply existing and future applicable damage resistance/weakness layers using explicit filters and a documented stacking rule.
4. Apply damage and shields using the existing damage-application order.
5. Resolve each non-damage effect independently: required capabilities, explicit immunities, resistance/weakness modifiers, chance roll, duration, and application.
6. Emit typed events for damage and successful/blocked effects as instrumentation is expanded.

Damage and control should be independently resolvable: a target may take damage while resisting the accompanying disruption. A failed control proc should not silently undo damage unless the skill explicitly defines that behavior.

## Resistance design

- Player-facing text should use the generic term **Resistance** unless a specific damage family is necessary to explain the mechanic.
- A generic resistance payload without filters is proposed to reduce all applicable damage channels. A filtered payload may specify `damageTypes` and/or `effectTags` for a narrower defense.
- Generic damage resistance must not imply resistance to status/control proc chances or durations. Control/effect resistance should be a separate, explicitly designed modifier category.
- Same-direction resistance modifiers should follow the existing strongest-value priority rule unless an effect explicitly opts into another documented stacking contract. Opposing effects should follow the established global stacking rules where applicable.
- Resistance percentages remain clamped and validated; immunity should be explicit rather than represented by an accidental extreme percentage.
- A faction can have a baseline affinity (e.g., Serpent's Toxic-focused identity), but its magnitude and whether it is implemented as a faction trait, actor passive, or profile modifier are still a balance/design decision. This proposal does not add Serpent resistance values.

## Example interactions (illustrative, not balance-approved)

| Effect | Organic actor | Mechanical actor | Hybrid / synthetic |
|---|---|---|---|
| Biological poison | Compatible; susceptibility can apply | Normally incompatible unless biological processes exist | Resolve against capabilities |
| Corrosion | Depends on materials | Susceptible when vulnerable material capability is present | Resolve against materials |
| EMP disruption | Usually not applicable without electronic systems | Can trigger if electronic systems are present and susceptible | Resolve against electronic-system capability |
| Kinetic damage | Normal damage/resistance formula | Normal damage/resistance formula | Normal damage/resistance formula |

Unknown or undeclared actor capabilities should not create automatic immunity or vulnerability. Use the current neutral behavior as the compatibility fallback until an explicit profile is authored.

## Example declarative shape (concept only)

```json
{
  "type": "damageAndEffect",
  "damage": {
    "channel": "Electromagnetic",
    "power": 1.0,
    "scalingStat": "MPow"
  },
  "effects": [
    {
      "kind": "control",
      "effect": "stagger",
      "effectTag": "emp-disruption",
      "requiresCapability": "electronic-systems",
      "chance": 0.25,
      "turns": 1
    }
  ]
}
```

This example is schematic only; the syntax is not final or validated by the current skill-data validator. The combined effect should not be implemented as a single handler unless composition is proven necessary. Prefer existing primitives and a small resolver contract.

## Explicitly deferred decisions

- Final actor profile/capability vocabulary and whether profiles are composed from tags or named templates.
- Faction baseline affinities and numerical values (including Serpent Toxic resistance).
- Weakness multipliers and their stacking with resistance.
- Whether capability rules are static tags, condition predicates, or data-driven matchup entries.
- Control-effect resistance, proc probability modifiers, duration reduction, immunity precedence, and cleanse interactions.
- New damage channels beyond current Physical/mastery channels.
- Migration of existing typed resistance statuses to a generic status ID/payload.
- RNG draw ordering for conditional effect procs; must preserve deterministic replay when implemented.
- Verra kit redesign and values; should follow a concrete effect-system contract rather than precede it.

## Non-goals

- No current actor reclassification.
- No changes to existing damage formulas, status stacking, mastery resistance, passive handlers, or skill values.
- No automatic faction buffs/debuffs.
- No implementation of Poison, Corrosion, EMP proc, Stun, or Immobilize interactions in this milestone.

## Implementation gate / recommended sequence

1. Review and approve the vocabulary and resolver boundaries.
2. Design actor-profile metadata and validation with neutral fallback.
3. Add test-first, data-driven capability query helpers without changing old behavior.
4. Add effect-susceptibility and generic resistance contracts with unit tests.
5. Migrate a small representative skill/status only after compatibility tests and golden transcript checks.
6. Introduce faction baselines and reclassify actors in separate, owner-approved balance steps.
7. Rework Verra's healing kit/passive after the generic resistance contract is settled.

## B1 conclusion

B1 establishes a design direction for agnostic effects and actor capabilities. It is documentation-only; no runtime mechanics are approved for implementation yet. Next review should focus on the proposed vocabulary, resistance semantics, actor metadata, and deterministic effect-resolution order before any B2 code change.
