# Iteration 5 — Combat Effect Coverage & Mixed-Faction Validation

**Status:** Complete  
**Snapshot:** 2026-11-22  
**Scope:** Shared engine coverage before Serpent Syndicate migration.

## Purpose

Verify that the current ten-member playable roster and six enemy archetypes can use the shared skill runtime safely across mixed-faction battles, reserve deployment, incapacitation, and owner-linked summon lifecycle transitions. This audit does not rebalance character stats or rewrite existing kits.

## Coverage inventory

- 10 playable character skill sets: five Falcon and five Phantom.
- 6 enemy skill sets: Training Drone, Rogue Automaton, Siege Turret, Recon Drone, Toxic Stalker, and Blightheart Overseer.
- All declared active skill effect types resolve through the active effect registry.
- Passive event names and handler names are checked against the passive registry at skill-data load time.
- Summon owner-turn and lifecycle handlers are checked against the summon registry at skill-data load time.

## Findings and changes

### 1. Registry-backed passive and summon validation

**Finding:** Skill-data validation previously verified the shape of passive/summon handler references but could allow an unknown handler name to survive until the event was dispatched in battle.

**Change:** Passive and summon registries expose `has()` and `entries()` introspection. `validateSkillData()` now validates supported passive lifecycle event names and rejects unknown passive or summon handlers before battle assembly. Declarative passive `onSkillUsed` hooks are also constrained to the supported `nextSkillDiscount` contract.

### 2. Execution-time ally target restrictions

**Finding:** The terminal legal-action view filters ally targets using faction/self restrictions, but the shared interpreter did not re-check those restrictions for ally-targeting variants of `targeting: "mode"` skills.

**Change:** `runSkill()` re-checks `targetFaction` and `excludeSelf` at execution time whenever the chosen skill variant targets an ally. This keeps the interpreter safe for terminal, AI, scripted, and future UI controllers.

### 3. DoT source attribution through reserve transitions

**Finding:** Turn-start DoT attribution only searched `state.actors`, so attribution could be lost if the source had moved into reserve or was no longer in the deployed actor list.

**Change:** DoT source resolution now checks deployed actors and both party rosters, matching both stable source ID and source side. This preserves analytics and damage-source events for roster-resident sources even when they are not deployed.

### 4. Simultaneous DoT after incapacitation

**Finding:** If multiple turn-start DoTs were attached to one target, the status loop could continue applying subsequent ticks after an earlier tick had already incapacitated the target.

**Change:** The processor stops immediately when the current target becomes incapacitated. No additional periodic damage is applied to an already-defeated unit during that turn-start resolution.

### 5. Owner-linked summons and reserve lifecycle

**Finding:** Active owner-linked summons could remain in the battle after their owner was incapacitated, leaving an orphaned summon with no future owner-turn activation.

**Change:** When an owner is incapacitated, its active owner-linked summons are dismissed. Dismissal is distinct from destruction: it does not trigger `onDestroyed` damage, summon destruction callbacks, or owner-destroyed reactions. Summon durations/actions tied to the owner clock pause while the owner is in reserve; actor-turn status durations also pause while their affected actor is in reserve, then resume on redeployment.

## Tests added

`test/engineCoverageAudit.test.js` adds focused regression coverage for:

1. All 10 playable and 6 enemy skill data sets compile against the live effect/passive/summon registries.
2. Unknown passive handler, unknown summon handler, and unsupported passive event rejection.
3. Execution-time faction and self-target restrictions for ally-targeting mode skills.
4. DoT source attribution when the applier is in reserve or outside the active actor list.
5. Halting subsequent simultaneous DoT ticks after a target is incapacitated.
6. Dismissing owner-linked summons on owner incapacitation without invoking destruction mechanics.
7. Pausing owner-clocked summons and actor-turn statuses while the owner is in reserve and resuming on return.

## Golden fixture updates

Seven golden scenarios changed only because of the intentional lifecycle behavior above: four Elishia scenarios and three terminal transcripts. The fixture updater was run, and the diffs were reviewed. The changes capture the new Meo-9 dismissal log and the removal of a later simultaneous DoT tick after incapacitation. No fixtures were updated merely to silence unrelated failures.

## Verification

- `npm test`: **313 passed, 0 failed, 0 skipped**.
- JavaScript syntax checks: **135 files passed**.
- Supplied `characterTerraData(1).json` parse check: passed.
- Internal Markdown links: **0 broken relative links across 29 files**.
- No balance simulation was run as part of this milestone; the work is engine correctness and coverage validation, not a new character balance claim.

## Out of scope / next milestone

- No Falcon or Phantom character stat or skill values were changed in this audit.
- Phantom Bleeding's 0.15× ATK Anomaly tick remains provisional pending owner approval.
- The next planned milestone is Serpent Syndicate migration through the existing unified roster and shared skill/effect/passive/summon registries.
