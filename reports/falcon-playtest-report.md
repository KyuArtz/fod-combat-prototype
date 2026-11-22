# Falcon Squad Implementation & Playtest Report

**Date:** 2026-11-21  
**Scope:** Approved Falcon skill kits, shared combat stacking and effect timing rules  
**Runtime:** Node.js 18+, CommonJS, threshold/continuous-time scheduler

## Executive summary

The five approved Falcon kits have been applied to the active runtime skill data under `characters/skillData/`. Their mechanics continue to use the shared skill interpreter, effect handlers, passive registry, summon registry, damage pipeline and turn lifecycle. No character-specific skill interpreter was introduced.

The global Combat Stacking v1 and Effect Timing/Trigger v1 rules are implemented in the shared runtime. The updated website-facing character JSON is supplied separately as `characterTerraData-falcon-updated.json`; the input file was not overwritten.

## Approved Falcon mechanics implemented

- **Elishia:** Biotech Overdrive timed stats and one-use MP discount; Nano Swarm modes; adaptive shield; Meo-9 owner-turn cover fire or Emergency Field only; Nanotech Singularity field. Removed Meo-9 scan vulnerability, EMP/destruction reaction and expiry attack.
- **Evalete:** Targetable passive Catalyst Wing with owner-turn duration and even-turn pulses; no destruction fallback shield. Catalyst Overdrive includes 25% reflection of eligible direct incoming damage for 3 turns. Reflection is routed through the damage pipeline, mitigated by the original attacker's defenses, and cannot recurse.
- **Zackry:** Overwatch Protocol only lowers Tactical Marked targets' EVA; Tactical Mark, Mpow Command Uplink, EMP Burst, and Mpow Full Spectrum Assault.
- **Jazen:** Recoil Dampeners now grants up to two Mpow +10% stacks; no Stagger/action-delay immunity. Impact Grenade, Breach Charge, Reinforced Plating and Cataclysmic Payload use the approved effects without the removed Taunt/Stagger mechanics.
- **Zenki:** Energy mastery; Evasion-only Unobserved; Railshot without conditional damage; single-target Cipher Tag RES reduction; Ghost Protocol one-use damage boost with Untargetable; three-shot Zero Hour Execution with a target-HP threshold snapshot.

## Global rules implemented

### Combat Stacking v1

- Different-stat modifiers coexist.
- For modifiers to the same stat and direction, the strongest active value is effective; weaker active instances remain tracked and can resume after the stronger one expires.
- Opposing percentage modifiers offset in percentage points.
- Reapplication refreshes an effect's duration without increasing its strength unless explicit stacking is configured.
- Explicitly stackable effects respect their declared limit (Jazen's Recoil Dampeners: two stacks).
- Different status types can coexist; shield instances retain separate capacity and duration, with the oldest shield absorbing first.

### Effect Timing/Trigger v1

- Turn-start processing handles MP regeneration and cooldown ticks, then DOT, healing-over-time/turn-start healing and passive checks before the actor's action.
- Status and shield durations tick after the affected unit completes its turn. Effects applied during the current turn do not immediately lose duration.
- Owner-turn summons and fields use their owner's turns and do not take independent scheduler turns.
- Multi-hit actions resolve per hit; skill-level bonuses and one-use modifiers are scoped to the skill as specified.
- Damage reflection applies to eligible direct damage before shield absorption, returns damage to the original attacker through normal mitigation, and excludes DOT, self-damage, counter/reflected damage to prevent recursion.

## Automated regression results

Command: `npm test`

| Result | Count |
|---|---:|
| Tests discovered | 271 |
| Passed | 233 |
| Failed | 0 |
| Skipped | 38 |

The 38 skipped assertions are legacy tests whose expected results explicitly depended on mechanics superseded by the approved designs (including Meo-9's former scan/EMP/finale behavior, Evalete's destruction shield, Jazen's removed immunity/Taunt/Stagger mechanics and Zenki's previous conditional bonuses). Replacement tests cover the approved behavior and exercise the shared interpreter and real battle resolution paths. Skips are disclosed rather than counted as passes.

## Seeded headless playtests

All runs used the **threshold scheduler** and **player-first** opening. Outcomes below are observations from the prototype's current sample encounters, not a proof of universal balance.

| Encounter | Policy | Battles | Wins | Defeats | Draws | Win rate | Avg. rounds | Avg. ally HP damage | Avg. healing | Avg. shield absorbed |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `trainingGround` | Basic | 300 | 300 | 0 | 0 | 100% | 7.85 | 742.82 | 400.00 | 401.59 |
| `trainingGround` | Random | 300 | 300 | 0 | 0 | 100% | 5.59 | 747.19 | 640.54 | 360.13 |
| `siegeBreakthrough` | Random | 100 | 100 | 0 | 0 | 100% | 13.92 | 2,563.71 | 1,021.08 | 636.89 |

### Reproducibility

```bash
node tools/simulate.js --battles 300 --seed 20261121 --scheduler threshold --opening player-first --policy basic --encounter trainingGround --format json --out /tmp/falcon-training-basic.json
node tools/simulate.js --battles 300 --seed 20262121 --scheduler threshold --opening player-first --policy random --encounter trainingGround --format json --out /tmp/falcon-training-random.json
node tools/simulate.js --battles 100 --seed 20263121 --scheduler threshold --opening player-first --policy random --encounter siegeBreakthrough --format json --out /tmp/falcon-siege-random.json
```

The basic-policy sample averages only 2.33 skill uses and 89.24 basic attacks per battle, so it is mainly a baseline smoke run rather than a strong validation of the revised kits. The random-policy runs exercise more abilities (34.36 average skills per training battle and 70.07 per siege battle). All three runs recorded zero rejected decisions.

## Findings and remaining limitations

1. The supplied encounters were cleared in every sampled run. This suggests the current encounters may not be sufficiently punishing to expose upper-bound healing, shielding, buff uptime or burst combinations. Add dedicated boss/adversarial stress encounters before considering the squad fully balanced.
2. The simulator's damage summary reports target-side damage received, not complete source-attributed damage contributions. Per-character damage contribution analysis remains limited until damage events include source attribution.
3. Runtime Falcon base stats remain the prototype values. A separate deliberate stat synchronization/rebalance pass is still needed before drawing final stat-balance conclusions.
4. The website JSON and engine runtime are distinct data sources. The updated full JSON is provided separately; this package includes a compact in-project reference extract, not the entire site roster JSON.
5. The project is a terminal/headless prototype rather than a graphical battle client.

## Files in this delivery

- `fod-combat-prototype-updated.zip` — updated source, tests, documentation and this report.
- `characterTerraData-falcon-updated.json` — updated full website-facing character JSON with the five approved Falcon skill kits.
- Raw JSON simulation outputs are also supplied separately for inspection.

The original uploaded ZIP and JSON were left unchanged.
