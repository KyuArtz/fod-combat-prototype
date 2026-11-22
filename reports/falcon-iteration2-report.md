# Falcon Iteration 2 — Tactical Controller & Blightheart Boss Playtest

**Snapshot:** 2026-11-22  
**Runtime:** Node.js headless prototype  
**Scheduler:** Threshold / continuous-time  
**Opening:** Player-first  
**Player formation:** Five active Falcon agents  
**Verification:** 263 passed, 0 failed, 38 superseded legacy assertions skipped (301 tests total)

## Scope of this iteration

- Added a deterministic, role-aware Falcon tactical controller in `ai/falconTactics.js`. It selects from the legal actions provided by the normal turn view and does not bypass action validation.
- Extended copied turn-view state with visible statuses and independent shield instances so controllers can make state-aware decisions without mutating runtime actors.
- Added a generic `masteryDamageAllOpponents` effect handler. It is available to either battle side and is not tied to the Blightheart boss.
- Added the Blightheart Overseer, a Toxic boss with a phase-change passive, three regular skills and an Ultimate, all executed through the shared skill interpreter and registries.
- Added the two-stage `blightheartSanctum` encounter: perimeter guardians followed by the boss and four guards.
- Extended simulator JSON output with `skillUsesByActor` and `skillUsesByKey`, alongside existing per-actor damage contribution.

## Blightheart Overseer profile

| Stat | Value |
|---|---:|
| HP | 3,900 |
| MP | 250 |
| ATK | 155 |
| MPow | 202 |
| DEF | 132 |
| RES | 132 |
| SPD | 84 |
| CritRate | 12 |
| Evasion | 5 |

**Passive — Blightheart Awakening:** At 55% HP or lower, permanently gains MPow +20% and DEF +15% for the encounter.

| Ability | Implementation |
|---|---|
| Spore Lance | 1.1× Toxic mastery hit plus 2-turn Toxic DoT |
| Miasma Wave | 0.62× Toxic AoE against all opponents plus 2-turn Toxic DoT |
| Heartbark Guard | 16% Max HP shield and DEF +15% for 2 turns |
| Cataclysmic Bloom | 0.95× Toxic AoE against all opponents plus 3-turn Toxic DoT |

The boss AI uses an ordered, chance-gated policy. Its phase passive is permanent once triggered. The second wave contains four support enemies so the encounter still respects the prototype's five-entry wave requirement.

## Seeded results

All simulations use the same threshold scheduler and player-first opening. Seed ranges are fixed so that runs can be reproduced.

| Encounter | Player policy | Battles | Wins | Defeats | Win rate | Mean rounds |
|---|---|---:|---:|---:|---:|---:|
| Training Ground | Tactical | 120 | 120 | 0 | 100.0% | 14.10 |
| Blightheart Sanctum | Random legal action | 150 | 2 | 148 | 1.3% | 48.51 |
| Blightheart Sanctum | Tactical | 150 | 63 | 87 | 42.0% | 39.41 |

The tactical boss run averaged:

- **Total damage including shield absorption:** 11410.0 by Falcon; 11325.0 by enemies.
- **HP damage:** 9108.0 to enemies; 9054.7 to allies.
- **Support:** 3592.7 healing and 1863.2 shield absorption.
- **Actions:** 85.8 Falcon skill uses and 74.7 enemy skill uses per battle.
- **Decision validation:** 0 rejected decisions across the full batch.

Random boss control averaged 8447.1 total damage by Falcon and 10971.6 by enemies, with 2869.3 healing and 1756.8 shield absorption.

## Falcon contribution snapshot

Average damage contribution per attempted boss encounter, including damage absorbed by shields. These are averages across all 150 battles, not only victories.

| Agent | Total damage | HP damage | Shield damage | Skill uses / battle | Most-used skill |
|---|---:|---:|---:|---:|---|
| Elishia | 1,342.9 | 1,030.8 | 312.0 | 24.40 | `nano` (17.55) |
| Evalete | 2,218.8 | 1,583.6 | 635.1 | 18.08 | `pulse` (16.19) |
| Zackry | 1,785.9 | 1,274.6 | 511.3 | 16.75 | `mark` (13.75) |
| Jazen | 3,911.6 | 3,317.2 | 594.4 | 11.04 | `impactGrenade` (8.67) |
| Zenki | 1,935.9 | 1,687.0 | 249.0 | 15.53 | `railshot` (10.53) |

The Blightheart Overseer averaged **7,268.5 total damage per attempted encounter** across the tactical batch. Its mean skill uses per battle were: `cataclysmicBloom` 2.00, `heartbark` 8.55, `miasmaWave` 3.19, `sporeLance` 12.28.

## Tuning record

Two earlier boss profiles were rejected before the final 150-seed comparison:

- An initial, softer profile produced a **91.7%** tactical Falcon win rate and did not create enough pressure.
- A harder profile (HP 4,320 / ATK 165 / MPow 220, with guaranteed high-frequency area attacks) reduced tactical wins to **5.0%** in 80 battles and was judged overtuned.

The current profile was selected between those extremes. Its 42.0% tactical win rate makes it a substantial challenge while still allowing repeatable Falcon victories. This is an iteration target, not a claim of final balance.

## Sample battles and raw data

- `falcon-blightheart-sample-battles.md`: one deterministic tactical victory (seed 20266122) and one defeat (seed 20266123), including the phase transition and skill logs.
- `falcon-tactical-training-120.json`: 120 tactical Training Ground simulations, seeds 20261122–20261241.
- `falcon-random-blightheart-150.json`: 150 random-policy boss simulations, seeds 20266122–20266271.
- `falcon-tactical-blightheart-150.json`: 150 tactical boss simulations with the same seed range.

## Interpretation and limitations

- The tactical controller is deterministic and heuristic-based, not a learning agent or optimal strategy. Its 42.0% win rate is controller-dependent and must not be presented as a human player's win probability.
- The random policy uniformly chooses from legal actions; its 1.3% boss win rate is a low-skill control, not a practical play recommendation.
- The training encounter's 100% tactical win rate indicates that it is now below the tactical controller's capability ceiling; future difficulty work should focus on the boss and mixed encounters rather than arbitrarily raising every standard enemy stat.
- These are headless simulations. No GUI/manual input playtest was performed. Reserve switching is not used by the default five-active tactical controller.
- Toxic DoT is a clear boss pressure source; the Overseer averaged 12.28 Spore Lance uses per attempted encounter. Monitor DoT uptime and whether support actions can meaningfully answer it in future playtests.
- Damage contributions include shield absorption; source attribution records direct, reflected, and DoT damage.

## Reproduction commands

```bash
npm test
node tools/simulate.js -n 120 --seed 20261122 --policy tactical --encounter trainingGround --format json --out reports/falcon-tactical-training-120.json
node tools/simulate.js -n 150 --seed 20266122 --policy random --encounter blightheartSanctum --format json --out reports/falcon-random-blightheart-150.json
node tools/simulate.js -n 150 --seed 20266122 --policy tactical --encounter blightheartSanctum --format json --out reports/falcon-tactical-blightheart-150.json
```
