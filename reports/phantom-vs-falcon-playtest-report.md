# Phantom vs Falcon — 500-Battle Playtest Report

## Executive result

- Battles: **500**
- Falcon victories: **355 (71.0%)**
- Phantom victories: **145 (29.0%)**
- Draws: **0**
- Average battle duration: **27.912 rounds**
- Average reserve deployments: **3.764 per battle**
- Rejected decisions: **0**

## Test configuration

- Seed base: `20261122` (consecutive deterministic seeds)
- Formation: 3 active combatants and 2 reserves per faction
- Controllers: coordinated Falcon AI vs Phantom tactical AI
- Opening initiative: speed-based
- Faction seating: alternating every battle
- Hit/evasion behavior: symmetric FvF mode; both sides use the same Evasion and basic-attack counter/retaliation treatment
- Engine: shared skill interpreter, passive/effect registries, damage pipeline, and turn scheduler

## Seating fairness

| Falcon placement | Battles | Falcon wins | Falcon win rate |
|---|---:|---:|---:|
| Player side | 250 | 175 | 70.0% |
| Enemy side | 250 | 180 | 72.0% |

The difference between 70.0% and 72.0% is small. This supports the conclusion that the earlier player-side hit/evasion and side-targeting asymmetries have been corrected for this faction-duel harness. The result does not mean that all possible seat or seed effects are eliminated, but no major player-side advantage is apparent in this sample.

## Average damage and interpretation

- Falcon average attributed damage: **4503.3 per battle**
- Phantom average attributed damage: **7433.0 per battle**

Phantom dealt substantially more attributed damage but won only 29% of battles. This suggests its current kits can generate strong offensive pressure, while Falcon’s sustain and defensive support are more effective at converting long encounters into victories. This is an interpretation of this AI-versus-AI setup, not proof that Phantom is intrinsically weaker in every player-controlled situation.

### Highest cumulative damage contributors

| Actor | Cumulative attributed damage |
|---|---:|
| Lucaz | 1,503,317 |
| Liezli | 1,268,309 |
| Unknown | 1,038,342 |
| Clarke | 1,013,232 |
| Zenki | 922,612 |
| Jazen | 792,245 |
| Mirazhel | 784,336 |
| Elishia | 498,732 |
| Evalete | 484,801 |
| Zackry | 412,641 |

Cumulative values combine all 500 matches and are not per-battle averages. Meo-9 appears as a separate summon source.

## Skill and interaction observations

- Phantom’s mark and Anomaly burst skills interact with the faction-restricted damage vulnerability as intended.
- Bleeding is applied only to targets actually hit by the associated skill. Its provisional baseline is 0.15× the applier’s ATK as Anomaly damage per tick for 2 turns.
- Liezli’s Bleeding and area pressure contribute to Phantom’s high raw damage total.
- Lucaz is the highest cumulative Phantom damage contributor in this batch.
- Falcon’s Catalyst Wing, Meo-9, Nano Swarm, Triage Infusion, shields, and reserves contribute to its higher battle win rate despite lower total damage.
- Both sides can use their support, summon, and reserve systems regardless of whether they are player-side or enemy-side.
- Hidden operative battle output remains neutral as **Unknown**.

## Recommended next balance pass

Do not increase Phantom damage across the board. Its measured raw damage is already higher than Falcon’s. Investigate instead:
1. Phantom’s defensive uptime and mitigation during sustained encounters.
2. Whether the Phantom AI protects its fragile high-damage stalkers effectively.
3. Whether Mirazhel’s ally buffs and Phantom-only mark vulnerability are being used at the right timing.
4. Whether reserve deployment is preserving the team’s best damage sources or exposing them too late.
5. Whether Bleeding’s 0.15× ATK baseline creates too much repeated pressure when Liezli applies it to multiple targets.

Treat the 71% Falcon win rate as a first balance signal, not a final rating. Keep the approved character stats and skill values unchanged until the next targeted tuning tests provide evidence for a specific adjustment.

## Reproduction

From the project root:

```bash
npm run simulate:factions -- --battles 500 --seed 20261122 --active 3
```

Raw per-battle metrics are in `reports/phantom-vs-falcon-500.json`. Curated deterministic battle excerpts are in `phantom-vs-falcon-sample-battles.md`.
