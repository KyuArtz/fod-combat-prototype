# Actor Capability Metadata (B2)

**Status:** Implemented as inert metadata and validation; no combat rules consume it yet.

## Runtime contract

- Actors expose `capabilities`, always an array.
- Omitted metadata normalizes to an empty array (`[]`), meaning neutral/undeclared.
- Capability tags are validated by `characters/actorFactory.js` against the exported `ACTOR_CAPABILITIES` whitelist.
- Invalid non-array values, non-string tags, and unknown tags throw `TypeError` during actor creation.
- Duplicate tags are removed while preserving first-seen order.
- The array is copied at actor creation so an actor's metadata does not alias the definition's array.
- Metadata is descriptive only. No damage, status, control, resistance, weakness, AI, or RNG logic reads it in B2.

## Supported tags

| Tag | Meaning (metadata only) |
|---|---|
| `organic` | Organic composition is explicitly declared. |
| `biological-processes` | Biological processes are explicitly declared. |
| `mechanical` | Mechanical components/systems are explicitly declared. |
| `electronic-systems` | Electronic systems are explicitly declared. |
| `synthetic` | Synthetic composition is explicitly declared. |
| `construct` | Constructed/assembled actor profile. |
| `metallic-components` | Metallic components are explicitly declared. |
| `nanotech-interface` | Nanotechnology interface is explicitly declared. |
| `insulated-electronics` | Electronics with insulation is explicitly declared. |
| `corrosion-resistant-materials` | Corrosion-resistant material is explicitly declared. |

These tags are extensible through an explicit whitelist update, with tests. They are non-exclusive; hybrids may list multiple tags.

## Current authoring coverage

The four clearly mechanical enemy definitions—Training Drone, Rogue Automaton, Siege Turret, and Recon Drone—declare `mechanical` and `electronic-systems`. Toxic Stalker and Blightheart Overseer remain undeclared rather than guessing their composition. All 15 playable faction characters are currently neutral/undeclared (`[]`) until profiles are explicitly authored.

## Validation and tests

`test/actorCapabilities.test.js` covers neutral fallback, accepted tags, deduplication, malformed values, unknown-tag rejection, enemy-profile exposure, and malformed enemy-definition rejection. The metadata is inert; B2 does not authorize susceptibility or balance changes.

## Next boundary

B3 may add generic resistance resolution, but it must not infer compatibility from these tags without an owner-approved rule contract and tests. B2 itself changes no combat outcomes.
