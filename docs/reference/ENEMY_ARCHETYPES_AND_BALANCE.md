# Enemy Archetypes and Balance Playtest

## Scope

The standard `trainingGround` encounter now pits the complete five-member Falcon party against five distinct data-driven enemy archetypes. Each archetype has a passive and four declarative abilities (three regular skills plus an Ultimate), all executed by the same shared skill interpreter used by player characters.

Enemy-specific behaviour lives in data definitions and AI rule files. The battle lifecycle, skill interpreter, stat stacking, status timing, damage pipeline, shields, and summons remain shared systems.

## Standard training-ground stat profiles

These values are the live `data/enemies/*.js` base profiles. Passive modifiers are applied separately by the shared stat calculation.

| Enemy | HP | MP | ATK | MPow | DEF | RES | SPD | Passive |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Training Drone | 1,265 | 120 | 103 | 118 | 82 | 88 | 95 | Calibration Core: Evasion +8 points |
| Rogue Automaton | 1,702 | 130 | 134 | 112 | 116 | 110 | 70 | Reactive Plating: DEF +20% when HP reaches 55% or lower |
| Siege Turret | 1,552 | 110 | 162 | 112 | 127 | 82 | 42 | Braced Emplacement: DEF +15%, SPD -10% |
| Recon Drone | 1,092 | 125 | 101 | 134 | 72 | 99 | 125 | Evasive Array: Evasion +15 points |
| Toxic Stalker | 1,322 | 140 | 118 | 157 | 88 | 99 | 100 | Virulent Core: MPow +12% |

For comparison, the Falcon party's base stat totals (five characters) are HP 6,150, ATK 485, MPow 645, DEF 445, RES 462, and SPD 435. The enemy totals are HP 6,933 (+12.7%), ATK 618 (+27.4%), MPow 633 (-1.9%), DEF 485 (+9.0%), RES 478 (+3.5%), and SPD 432 (-0.7%). These are party-wide totals, not a claim that each unit is individually stat-matched. The asymmetry is intentional: enemies exert greater physical pressure, while Falcon retains mastery power, mobility, healing, and support advantages.

## Enemy skill kits

### Training Drone — mobile skirmisher

- **Passive — Calibration Core:** Evasion +8 points.
- **Pulse Shot:** Physical hit, 1.3x power, 18 MP, 2-turn cooldown.
- **Kinetic Burst:** Kinetic hit, 0.95x power, 24 MP, 3-turn cooldown.
- **Evasive Thrusters:** Evasion +18 for 2 turns, 20 MP, 4-turn cooldown.
- **Overclocked Shot (Ultimate):** Physical hit, 1.9x power, 48 MP, 6-turn cooldown.
- Targeting profile: frontline.

### Rogue Automaton — reactive bruiser

- **Passive — Reactive Plating:** At 55% HP or lower, DEF increases by 20% for the remainder of the encounter.
- **Overload:** ATK +20% for 2 turns, 22 MP, 4-turn cooldown.
- **Armor Scan:** Target DEF -15% for 2 turns, 18 MP, 3-turn cooldown.
- **Heavy Strike:** Physical hit, 1.55x power, 28 MP, 3-turn cooldown.
- **Crusher Protocol (Ultimate):** Kinetic hit, 1.65x power, target DEF -10% for 2 turns, 52 MP, 6-turn cooldown.
- Targeting profile: weakest ally.

### Siege Turret — slow artillery and anchor

- **Passive — Braced Emplacement:** DEF +15%, SPD -10%.
- **Ballistic Shell:** Physical hit, 1.65x power, 22 MP, 2-turn cooldown.
- **Suppression Round:** Kinetic hit, 0.9x power, target SPD -15% for 2 turns, 24 MP, 3-turn cooldown.
- **Fortify:** Shield equal to 18% Max HP and DEF +15% for 2 turns, 24 MP, 4-turn cooldown.
- **Siege Salvo (Ultimate):** Kinetic hit, 2.0x power, target DEF -15% for 2 turns, 55 MP, 6-turn cooldown.
- Targeting profile: highest threat.

### Recon Drone — fast spotter

- **Passive — Evasive Array:** Evasion +15 points.
- **Spotter Mark:** Target receives 12% more damage for 2 turns, 18 MP, 3-turn cooldown.
- **Precision Burst:** Physical hit, 1.5x power, 22 MP, 2-turn cooldown.
- **Spoofing Maneuver:** Evasion +20 for 2 turns, 20 MP, 4-turn cooldown.
- **Targeting Cascade (Ultimate):** Kinetic hit, 1.45x power, target receives 18% more damage for 2 turns, 50 MP, 6-turn cooldown.
- Targeting profile: highest mastery power.

### Toxic Stalker — damage-over-time hunter

- **Passive — Virulent Core:** MPow +12%.
- **Venom Strike:** Toxic hit, 0.85x power plus 2-turn Toxic damage-over-time, 22 MP, 2-turn cooldown.
- **Caustic Spit:** Toxic hit, 0.95x power, target RES -15% for 2 turns, 25 MP, 3-turn cooldown.
- **Predator Instinct:** SPD +15% and MPow +10% for 2 turns, 22 MP, 4-turn cooldown.
- **Blight Surge (Ultimate):** Toxic hit, 1.55x power plus 3-turn Toxic damage-over-time, 55 MP, 6-turn cooldown.
- Targeting profile: weakest ally.

## Encounter behaviour

The standard enemy policies and the Blightheart boss policy are ordered-rule AI configurations. They use their skills when the configured conditions and cooldowns allow, then fall back to legal basic attacks. Each enemy archetype has its own target-selection profile. Taunt and Untargetable status handling continue to be enforced by shared targeting rules. Expired Taunt payloads are ignored, and when several allies are taunting, the longest remaining Taunt is targeted (ties keep formation order).

The `siegeBreakthrough` encounter retains its older per-encounter stat overrides as a lower-progression multi-wave scenario; it is not the benchmark for the newly scaled standard 5v5 balance test.

## Initial seeded playtest

Test configuration:

- Encounter: `trainingGround` (five enemies, one of each archetype).
- Scheduler: threshold readiness.
- Opening initiative: player-first.
- Random policy: 300 battles, seeds 20,261,122–20,261,421.
- Basic-only control: 100 battles, seeds 20,262,122–20,262,221.

Results:

| Player policy | Wins | Defeats | Win rate | Mean rounds |
|---|---:|---:|---:|---:|
| Random legal action | 194 | 106 | 64.7% | 23.10 |
| Basic attacks only | 0 | 100 | 0.0% | 14.53 |

Random-policy averages: 50.8 ally skill uses and 69.3 enemy skill uses per battle, plus 80.6 ally basic attacks and 86.2 enemy basic attacks. Average damage dealt (HP loss plus shield absorption) was 7,038.9 by Falcon and 9,195.9 by enemies. Falcon averaged 3,032.4 healing, 1,449.3 shield absorption, and 1,296.0 MP spent. No decisions were rejected. The random controller selects uniformly from legal actions and is deliberately not a tactical human-level player strategy.

The basic-only controller loses all 100 fights, showing that the new enemy pressure punishes ignoring active skills. Treat this as a controller baseline, not evidence that a human using the Falcon kit cannot win. The random result indicates a challenging but still player-favoured fight under an untactical player policy; subsequent testing should include purposeful skill priorities, target focus, reserve choices, and longer samples.

## Reproduction

```bash
node tools/simulate.js --battles 300 --seed 20261122 --policy random --encounter trainingGround --format json --out reports/falcon-random-300.json
node tools/simulate.js --battles 100 --seed 20262122 --policy basic --encounter trainingGround --format json --out reports/falcon-basic-100.json
npm test
```

`DamageApplied` events now carry `sourceId`, `sourceSide`, and `kind` (`direct`, `reflected`, or `dot`) so simulation reports can attribute damage to individual actors and separate direct damage from reflection/DoT sources.

## Balance interpretation and next work

The stat totals and win rates are first-pass encounter tuning signals, not a final balance verdict. Next useful checks are a tactical Falcon controller, 5–10× longer seeded batches, one-boss and mixed-wave encounters, per-actor damage share, survival/healing efficiency, and passives/skills activation frequency. Avoid tuning an archetype only from aggregate ATK or HP totals; review its role-specific performance and target choices.


## Blightheart boss encounter and tactical Falcon controller (2026-11-22)

### New boss archetype

**Blightheart Overseer — Toxic boss**

- **Base stats:** HP 3,900; MP 250; ATK 155; MPow 202; DEF 132; RES 132; SPD 84; CritRate 12; Evasion 5.
- **Mastery:** Toxic, with +17% Toxic mastery bonus and 10% Toxic/Nanotech mastery resistance.
- **Passive — Blightheart Awakening:** At 55% HP or lower, permanently gains MPow +20% and DEF +15% for the encounter. The phase transition is data-driven through the shared passive registry.
- **Spore Lance:** 1.1x Toxic mastery hit plus 2-turn Toxic damage-over-time.
- **Miasma Wave:** 0.62x Toxic mastery damage to all opposing units plus 2-turn Toxic damage-over-time.
- **Heartbark Guard:** 16% Max HP shield and DEF +15% for 2 turns.
- **Cataclysmic Bloom (Ultimate):** 0.95x Toxic mastery damage to all opposing units plus 3-turn Toxic damage-over-time.

The AoE effect is a generic `masteryDamageAllOpponents` handler, so it works for either side and is not tied to the boss identity. The boss skill kit and passive use the same declarative skill interpreter, enemy AI policy evaluator, and passive registry as the existing roster.

### Blightheart Sanctum

A two-stage encounter with five entries per wave (the current encounter validator requires at least five):

1. **Perimeter Guardians:** five lower-stat versions of the existing archetypes.
2. **The Heart Chamber:** Blightheart Overseer plus four guards (Training Drone, Rogue Automaton, Recon Drone, Toxic Stalker).

### Tactical Falcon controller

`ai/falconTactics.js` is a deterministic, role-aware controller for the five Falcon members. It selects only legal actions from `buildTurnView` and does not bypass battle validation. The turn view now exposes copies of visible statuses and shield instances so the controller can avoid redundant marks, defensive buffs, and healing-over-time applications.

- Elishia prioritizes Meo-9 deployment, team field, emergency repair, and barrier.
- Evalete prioritizes team recovery, reflection, and emergency triage.
- Zackry prioritizes team Mpow buffs and target marking.
- Jazen uses Reinforced Plating under pressure, AoE when several enemies remain, and Breach Charge for focused targets.
- Zenki prioritizes Cipher Tag on the boss, uses Ghost Protocol to prepare a stronger follow-up, and selects Zero Hour based on target health / attack-boost timing.

The controller is deterministic for a given battle state/seed and is a reproducible heuristic baseline, not a learning agent or claim of optimal play. It does not switch reserves in the default five-active formation.

### Seeded playtests

All runs use the threshold readiness scheduler, player-first opening, and five active Falcon members.

| Encounter / policy | Battles | Wins | Defeats | Win rate | Mean rounds |
|---|---:|---:|---:|---:|---:|
| Training Ground / tactical | 120 | 120 | 0 | 100.0% | 14.10 |
| Blightheart Sanctum / random | 150 | 2 | 148 | 1.3% | 48.51 |
| Blightheart Sanctum / tactical | 150 | 63 | 87 | 42.0% | 39.41 |

Tactical Blightheart battles averaged 11,410 total damage dealt by Falcon (including shield absorption), 11,325 by enemies, 3,593 healing, and 1,863 shield absorption. No decisions were rejected. The tactical controller cleared the encounter in 63/150 runs, so the boss is challenging even for this coordinated automated policy. Random legal-action play cleared it only 2/150 times. The training encounter's 100% tactical win rate confirms the controller is effective against standard enemies but does not establish that the player will always win manually.

**Tuning note:** an initial boss stat increase (HP 4,320 / ATK 165 / MPow 220) with guaranteed AoE cadence drove tactical wins to 4/80 (5%). That version was rejected. The current profile is the intermediate tuned version above; it produced a 42.0% tactical win rate over 150 seeds.

These are controller-dependent prototype observations, not universal balance estimates. Raw JSON batches and sample transcripts from these historical runs are not included in the clean snapshot; rerun the commands in this guide for fresh results.

Raw reports and sample transcripts from the earlier Iteration 2/3 playtests are intentionally omitted from the clean snapshot. The historical findings and configuration details remain documented here; reproduce current runs using the simulator commands below. The Iteration 2 test count (263 passed and 38 superseded assertions skipped) is historical only.


## Iteration 3 — Coordinated Falcon, cleanse counterplay and active/reserve boss test (2026-11-22)

### Implementation changes

- Added `ai/falconTacticsV2.js`, a coordinated role-aware policy that uses only legal turn-view actions. It focuses dangerous adds before the boss, switches to the boss when it enters the below-40% execution window, avoids redundant marks and buffs, responds to Toxic DoT with Adaptive Barrier, and conserves MP for Evalete's cleanse.
- Corrected the headless formation setup so `--active 3` sets the active limit before the initial formation is created. The tested composition starts with Jazen, Evalete and Zackry active; Elishia and Zenki are reserves.
- Added Catalyst Overdrive cleanse behavior through the existing shared `cleanseAllies` effect. It removes negative/debuff statuses from living active non-summon allies before healing and buffs; positive buffs remain. The effect is covered by a live skill regression that verifies Toxic DoT and harmful stat effects are removed.
- Added regression coverage for Toxic detection, cleanse prioritization, Adaptive Barrier selection, target focus, reserve replacement, true three-active formation, and the coordinated boss battle.

### Seeded playtest configuration

All battles use the threshold scheduler, player-first opening, party order `jazen,evalete,zackry,elishia,zenki`, the two-wave `blightheartSanctum` encounter, and the shared headless combat engine.

| Policy / formation | Battles | Victories | Defeats | Win rate | Mean rounds |
|---|---:|---:|---:|---:|---:|
| Coordinated / 3 active + 2 reserve | 150 | 103 | 47 | 68.7% | 56.79 |
| Random / 3 active + 2 reserve | 100 | 1 | 99 | 1.0% | 39.31 |
| Coordinated / 5 active | 100 | 100 | 0 | 100.0% | 31.86 |

The three-active coordinated run averaged 1.86 manual party-switch events, 0.91 reserve-deployment events, 1.8 harmful statuses cleansed, 4,432 healing, and 1,844 shield absorption per battle. No decisions were rejected. The coordinated controller switched at least once in all 150 three-active battles, and reserve deployment events occurred in 71 of 150 battles. Jazen averaged the highest Falcon damage contribution at 3,659.8 damage per attempt, followed by Evalete (2,445.1) and Zenki (2,203.4).

The five-active coordinated run won all 100 attempts and never used reserves; it is a formation comparison, not the primary fairness target. The random three-active controller won 1/100, indicating the encounter strongly rewards coordinated ability use and reserve management. The three-active 68.7% result is the primary challenge benchmark for the current formation. These are deterministic headless controller observations, not estimates of human-player win probability.

### Reproduction

Historical raw reports and transcripts from Iteration 3 are not included in the clean snapshot. Reproduce the primary run with:

```bash
node tools/simulate.js --battles 150 --seed 996000 --policy coordinated --active 3 --party-order jazen,evalete,zackry,elishia,zenki --encounter blightheartSanctum --format json --out reports/iteration3/falcon-coordinated-3active-150.json
```

Verification at the Iteration 3 snapshot (before the 2026-11-22 cleanup): `npm test` reported 273 passed, 0 failed, and 38 superseded legacy assertions skipped. After cleanup the suite reported 260 passed; after the initial Phantom migration it reported 283 passed, 0 failed, and 0 skipped. The later unified-roster-selection checkout reports 306 passed, 0 failed, and 0 skipped; see [Project Status](../project/PROJECT_STATUS.md) for the current count.
