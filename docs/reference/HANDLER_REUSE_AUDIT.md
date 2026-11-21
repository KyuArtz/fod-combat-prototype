# Falcon Handler Reuse Audit

**Audit date:** 2026-11-21  
**Baseline:** Step 7 Falcon architecture audit  
**Scope:** `systems/effects/`, `systems/passives/`, `systems/summons/`, their consumers, and current Falcon skill data.  
**Behavior changes:** No combat values or RNG behavior changed. The final Singularity review decomposes its skill data across reusable effects and battle-timer contracts while preserving the recorded field, regeneration, summon, and DoT behavior.

## Findings

The registries are extensible, but extensibility does not make every registered handler generic. A handler can be correctly isolated from core while still implementing a narrow, mechanic-specific operation. The distinction below is intentional: do not collapse different game rules into a single overly-configurable handler merely to reduce the number of handler names.

## Active-skill effect handlers

| Current handler or family | Classification | Finding / recommendation |
|---|---|---|
| `heal`, `healAllies`, `hotAllies`, `shield`, `shieldSelf`, `shieldAllies` | Reusable primitives | Keep as shared operations. Target scope and values are declarative. |
| `physicalHit`, `damage`, `masteryHit`, `damageOverTime` | Reusable primitives | Keep separate where damage calculation or timing differs. |
| `status`, `statusSelf`, `statusAllies`, `statusEnemies`, `buff`, `debuff`, `conditionalStatus` | Reusable composition | These already cover most status application patterns. Prefer composing these before adding a new effect type. |
| `cleanseAllies` | Reusable group operation | General enough for a common cleanse rule; consider optional filters only when another real skill needs them. |
| `status` (Tactical Mark data) | Reusable status primitive | Tactical Mark now uses the generic status handler with its named status ID, damage/evasion metadata, and declarative defeat reaction. The status remains named because damage, crit, and conditional-skill rules consume it; no dedicated application handler is needed. |
| `commandUplink` | Parameterized effect + generic status contract | Applies a party-wide ATK status whose `turnStartRefresh` metadata declares the base, conditional bonus, and HP threshold fields. The generic status system recalculates the amount without a named status branch. |
| `statusGroup` (Cipher Tag data) | Reusable group operation | Removes statuses carrying the configured group key from the configured side, then applies the declared linked statuses to the selected target. Cipher Tag now uses this generic operation; its status IDs remain named for Zero Hour and combat consumers. |
| `masteryHit` (Railshot and Zero Hour data) | Reusable conditional hit composition | The shared mastery-hit operation accepts an `accuracy` policy and ordered `powerModifiers` gated by actor-flag and/or target-HP conditions. A modifier can scale power or set an exact override; optional `bonusText` keeps presentation data-driven. Railshot and Zero Hour both compose these fields; neither needs a dedicated hit handler. |
| `conditionalStatus` (Zero Hour follow-up) | Reusable gated status application | Supports an optional required target status and alive-target gate, and naturally skips when the preceding hit marked the run as missed. Zero Hour uses it after `masteryHit` to apply the Cipher Tag slow only after a successful hit on a surviving tagged enemy. |
| `setBattleTimer`, `damageOverTime`, `statusAllies`, `statusEnemies`, `announceSummonPowerModifier` | Reusable battle-wide composition | Nanotech Singularity now composes these operations: a generic battle timer carries the turn-start heal reaction, the existing status group handlers apply buffs/debuffs, area `damageOverTime` assigns a fixed non-critical DoT to living enemies, and the summon announcement reads a configured conditional-power modifier. No Singularity-specific active-effect handler remains. |
| `summon`, `nextSkillDiscount`, `lifecycle` | Shared orchestration operations | Keep at the effect layer; their detailed behavior is delegated to templates, passive hooks, or lifecycle handlers. |

## Passive handlers

| Handler family | Classification | Finding / recommendation |
|---|---|---|
| `setFlagFromHistory`, `setPassiveFlag`, `clearPassiveFlag` | Generic state primitives | Reusable for passive conditions; keep. |
| `startTimedPassive`, `tickTimedPassive` | Generic timer primitives | Reusable and already keyed by declarative `timerKey`; keep. |
| `recoilDampeners` | Parameterized mechanic handler | Its threshold, stack cap, bonus, duration, and status ID are data-driven. The operation remains a particular damage-reaction pattern; reuse it only where the same rule applies. |
| `grantOverwatchAccuracy` | Parameterized mechanic handler | Recipient resolution is reusable for the current targeting contract, but its “next attack accuracy” behavior is specific. If another mechanic needs a different reaction, add a separate handler or generalize around an explicit recipient/effect contract. |
| `initializeCatalystWing`, `tickCatalystProtocol`, `grantCatalystDestructionShield` | Character-mechanic handlers | These encode one summon-and-pulse package. They are properly isolated in the passive registry, but are not generic primitives. A future configurable summon lifecycle/pulse contract may absorb them if another passive needs the same pattern. |

## Summon lifecycle handlers

| Handler | Classification | Finding / recommendation |
|---|---|---|
| `emergencyField` | Reusable rule | Selects the lowest-HP%-eligible non-summon ally and heals using configured threshold and percentage. |
| `coverFire` | Reusable rule | Performs a configured physical hit, with an optional battle-state power override. |
| `finalProtocol` | Reusable rule with specialized area semantics | Performs a primary/secondary multi-target mastery attack and optional status. Reuse when the same priority and falloff rules apply; otherwise add a distinct registered rule. |

## Remaining runtime coupling outside the registries

The audit initially found three status identifiers interpreted directly by the passive lifecycle runtime. The first has now been migrated:

- `singularityDot`: migrated to a declarative `turnStart` status contract. `systems/statusEffects.js` processes configured damage fields and message templates; the passive runtime no longer checks the status ID.
- `commandUplink`: migrated to declarative `turnStartRefresh` metadata. `systems/statusEffects.js` recalculates the status amount from its base and configured threshold; the passive runtime no longer checks the status ID.
- `tacticalMark`: migrated to an `onUnitDefeated` status reaction. The passive runtime forwards the defeated unit and status snapshot to `processUnitDefeatedStatusReactions`; the generic handler restores 5% Max MP to living non-summon allies. Both Zackry skills that apply Tactical Mark declare the reaction.

The named lifecycle consumers in this audit scope have all migrated to generic status metadata. Additional consumers in `systems/damage.js`, `systems/statusEffects.js`, and `core/turnEngine.js` remain candidates for case-by-case review; some are shared combat semantics rather than character-specific coupling. The Singularity DoT migration preserves the original turn-start position, damage amount/type, message text, status duration, and deterministic damage/RNG sequence.

Additional consumers in `systems/damage.js`, `systems/statusEffects.js`, and `core/turnEngine.js` also interpret named status or battle-state fields. Those are not automatically defects: some are core combat semantics (e.g. damage-taken modifiers), while others are feature-specific state. They should be assessed when a generic consumer contract is designed, not mechanically removed in this audit.

## Recommended next implementation sequence

1. [x] Introduce declarative status turn-start/tick behavior so `singularityDot` no longer needs a named branch in passive runtime.
2. [x] Introduce declarative conditional status-value refresh so `commandUplink` no longer needs a named branch in passive runtime.
3. [x] Introduce declarative unit-defeated reactions so `tacticalMark` reward behavior is dispatched from status data.
4. [x] Replace Tactical Mark's dedicated application handler with the generic `status` primitive; retain the named status ID for combat consumers.
5. [x] Replace Cipher Tag's dedicated composite with the reusable `statusGroup` operation; verify linked-status replacement and refresh behavior.
6. [x] Compose Railshot from the reusable `masteryHit` operation with declarative guaranteed accuracy and conditional power modifiers; preserve RNG draw order and Accuracy-token consumption.
7. [x] Compose Zero Hour from `masteryHit` and `conditionalStatus`; preserve the strict-below-40% execute boundary, fixed 3.2 power, bonus text, and successful-hit / alive-target / Cipher Tag follow-up gates.
8. [x] Review and decompose Singularity into generic battle-timer, status, area-DoT, conditional summon-power, and summon-announcement contracts; preserve global duration, reserve entry, turn-start heal order, DoT values/timing, scan/cover-fire boosts, and output text.

## Verification baseline

The Step 8 documentation-only baseline passed **215 tests, 0 failures**. The status lifecycle migrations, Tactical Mark generic status application, Cipher Tag `statusGroup` migration, Railshot and Zero Hour `masteryHit` composition, and Singularity composition through generic battle-timer/effect contracts are covered by the current full suite: **227 tests passed, 0 failed**, including deterministic replay and unchanged golden transcripts. Cipher Tag regression coverage verifies linked-status application, replacement on a different enemy, and duration refresh on reapplication. Railshot regression coverage verifies the 1.1x base / conditional 30% power, guaranteed accuracy, Accuracy-token consumption, bonus message, and unchanged critical-only RNG draw count. Zero Hour regression coverage verifies exactly-40% normal power, below-40% fixed execute power, execution text, and follow-up suppression on miss, defeat, or absent Cipher Tag. Battle-timer tests verify side/summon filters, turn-start execution order, completed-round countdown, and unchanged golden transcripts after Singularity composition.
