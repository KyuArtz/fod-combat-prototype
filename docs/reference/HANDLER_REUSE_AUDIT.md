# Handler Reuse Audit

**Updated:** 2026-11-22  
**Scope:** Active effect, passive and summon registries; their current consumers in Falcon, Phantom, and enemy skill data and shared combat systems.  
**Cleanup result:** Retired Meo-9 scan/Final Protocol plumbing and the old dedicated `commandUplink` validator were removed. No character-specific skill engine was introduced.

## Active skill-effect handlers

| Handler or family | Classification | Current use / guidance |
|---|---|---|
| `heal`, `healAllies`, `hotAllies`, `shield`, `shieldSelf`, `shieldAllies` | Reusable primitives | Shared healing-over-time and independent shield operations. |
| `physicalHit`, `damage`, `masteryHit`, `masteryMultiHit`, `damageOverTime` | Reusable damage operations | `masteryHit` is used by Falcon, Phantom, and enemy skills; `masteryMultiHit` handles multi-hit sequences such as Zenki's three-shot Zero Hour. Keep the multi-hit sequence and per-skill override declarative. |
| `status`, `statusSelf`, `statusAllies`, `statusEnemies`, `buff`, `debuff`, `conditionalStatus` | Reusable status operations | Prefer composition of these generic operations before adding a new handler. `conditionalStatus` remains available but has no current Falcon Zero Hour follow-up consumer. |
| `cleanseAllies` | Reusable group operation | Removes harmful statuses from active allies; Evalete's Catalyst Overdrive uses it before its healing and defensive effects. Positive statuses are preserved. |
| `statusGroup` | Reusable group operation | Replaces a target's existing statuses carrying the configured group key before applying the selected target's declared entries. Zenki uses this for Cipher Tag replacement. |
| `statusAllies` (`commandUplink` status ID) | Generic status application | Zackry's Command Uplink applies Mpow +15% for 3 turns through `statusAllies`. The identifier `commandUplink` is a status ID only; there is no dedicated `commandUplink` effect type or validator. |
| `setBattleTimer`, `statusAllies`, `statusEnemies`, `announceSummonPowerModifier` | Reusable battle-wide composition | Nanotech Singularity composes the owner-clocked timer, ally ATK/SPD buffs, enemy SPD reduction, 5% Max HP turn-start healing, and the Meo-9 cover-fire power announcement/modifier. It has no area DoT or scan vulnerability. |
| `summon`, `nextSkillDiscount`, `lifecycle` | Shared orchestration operations | Delegate details to summon templates, passive hooks, and lifecycle registries. Meo-9 has only owner-turn Emergency Field and cover-fire subscriptions. |

## Passive handlers

| Handler | Classification | Current use / guidance |
|---|---|---|
| `announcePassive`, `activateFlagBelowHpPercent` | Reusable event handlers | Used by enemy passives for battle-start announcements and phase/threshold flags. |
| `setFlagFromHistory`, `clearPassiveFlag` | Reusable state handlers | Used by Zenki's Unobserved passive to maintain Evasion while he has not taken damage since his prior turn. |
| `recoilDampeners` | Parameterized mechanic handler | Uses data-defined damage threshold, Mpow bonus, stack cap, duration, and status ID. Keep the stack behavior generic in the status system. |
| `initializeCatalystWing`, `tickCatalystProtocol`, `expireCatalystProtocol` | Character-mechanic lifecycle handlers | Create the targetable passive Wing, pulse team healing/shields, and shut down when destroyed or naturally expired. No destruction fallback shield remains. |
| `startTimedPassive`, `tickTimedPassive` | Reusable timer handlers | Used by Biotech Overdrive's three-turn battle-start buff. |
| `setPassiveFlag` | Reusable extension handler | Retained as a general registry capability; no current Falcon/enemy definition references it. Do not remove without checking future data compatibility requirements. |

## Summon lifecycle handlers

| Handler | Classification | Current use / guidance |
|---|---|---|
| `emergencyField` | Reusable rule | Heals the lowest-HP-ratio living non-summon ally below a configured threshold. Used by Meo-9. |
| `coverFire` | Reusable rule | Performs configured non-critical or normal Physical summon damage, including an optional timer-gated power modifier. Used by Meo-9. |

The retired `finalProtocol` summon handler has no current callers and was removed. The retired Meo-9 scan damage-bonus path, summon `scan` template field propagation, and scan-specific damage multiplier were also removed.

## Important infrastructure intentionally retained

- `nextAttackAccuracy` remains a generic status/action token with dedicated regression coverage; current Falcon passives do not grant it.
- Stagger and readiness pushback remain generic combat mechanics with dedicated timing coverage; Jazen no longer grants Stagger or immunity to it.
- `conditionalStatus` and `masteryMultiHit` remain reusable effect operations even where no current skill uses every optional feature.
- `core/skillLifecycle.js` remains a compatibility facade; lifecycle behavior lives in `systems/passives/` and `systems/summons/`.
- The legacy fixed-step scheduler remains available for explicit comparison with threshold readiness.

## Cleanup verification

The duplicate `data/skills/` directory and obsolete `core/skillEffects.js` file are removed. Current skill execution uses `characters/skillData/`, `core/skillInterpreter.js`, and the registry under `systems/effects/`. The current suite after the initial Phantom migration reports **283 passed, 0 failed, 0 skipped**. Historical Step 9 decisions and prior migration reports remain under `docs/history/` and are not current behavior references.

## Iteration 5 runtime coverage verification

- `validateSkillData` receives the live effect, passive, and summon registries from the skill interpreter. It validates that each referenced passive and summon handler is registered and that passive event names are in the supported lifecycle contract.
- The seven tests in `test/engineCoverageAudit.test.js` compile all ten selectable character skill sets and all six enemy skill sets against the runtime registries, and exercise invalid handler rejection.
- Ally-targeting mode restrictions are enforced in `core/skillInterpreter.js` as an execution-time precondition, including `targetFaction` and `excludeSelf`; the terminal decision view remains a separate earlier filter.
- DoT source attribution survives when the source moves to reserve or is no longer in the deployed actor list. Later simultaneous DoT ticks are skipped after the target is incapacitated by an earlier tick.
- Active owner-linked summons are dismissed when their owner is incapacitated. This does not invoke destruction-only handlers. Actor-turn statuses and owner-clocked summon activity/duration pause while their owner is in reserve.
- Full suite after these changes: **313 passed, 0 failed, 0 skipped**. See [Iteration 5 Engine Coverage Audit](../project/ENGINE_COVERAGE_AUDIT.md).
