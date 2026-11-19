# Roster and Skills

## Mastery types

The prototype defines eight mastery types: Energy, Kinetic, Electromagnetic, Toxic, Nuclear, Nanotech, Cryogenic, and Anomaly. Falcon agents receive a +15 mastery bonus for their assigned mastery in the current runtime data. Mastery resistance defaults to zero unless configured.

## Falcon runtime roster

Base runtime stats are defined in `characters/falcon.js`. These are prototype values and are not automatically synchronized from the owner-maintained website stat sheet.

| Agent | Mastery | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Elishia | Nanotech | 1100 | 130 | 95 | 150 | 75 | 82 | 95 | 15 | 10 |
| Evalete | Energy | 1450 | 110 | 85 | 120 | 110 | 95 | 75 | 10 | 5 |
| Zackry | Electromagnetic | 1250 | 120 | 100 | 135 | 90 | 100 | 85 | 10 | 5 |
| Jazen | Kinetic | 1350 | 100 | 125 | 95 | 100 | 75 | 70 | 10 | 5 |
| Zenki | Anomaly | 1000 | 150 | 80 | 145 | 70 | 110 | 110 | 10 | 5 |

## Training enemy archetypes

Enemy definitions and stats live in `data/enemies/`.

| Enemy | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion | Mastery |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Training Drone | 700 | 0 | 65 | 50 | 45 | 45 | 70 | 5 | 0 | Kinetic |
| Rogue Automaton | 850 | 0 | 75 | 60 | 55 | 50 | 60 | 5 | 0 | Kinetic |
| Siege Turret | 900 | 0 | 90 | 45 | 70 | 40 | 35 | 5 | 0 | Kinetic |
| Recon Drone | 620 | 0 | 58 | 70 | 35 | 65 | 115 | 5 | 12 | Kinetic |
| Toxic Stalker | 760 | 0 | 72 | 85 | 45 | 60 | 82 | 5 | 0 | Toxic |

## Falcon skill registry

All five Falcon skill sets are data-defined in `data/skills/` and assembled by `characters/skills.js`.

| Agent | Passive | Skill 1 | Skill 2 | Skill 3 | Ultimate |
|---|---|---|---|---|---|
| Elishia | Biotech Overdrive | Nano Swarm | Adaptive Barrier | Meo-v9 | Nanotech Singularity |
| Evalete | Catalyst Protocol | Sentinel Pulse | Triage Infusion | Guardian Field | Catalyst Overdrive |
| Zackry | Overwatch Protocol | Tactical Mark | Command Uplink | EMP Burst | Full Spectrum Assault |
| Jazen | Recoil Dampeners | Impact Grenade | Breach Charge | Reinforced Plating | Cataclysmic Payload |
| Zenki | Unobserved | Railshot | Cipher Tag | Ghost Protocol | Zero Hour Execution |

The [Falcon implementation guide](FALCON_IMPLEMENTATION_GUIDE.md) documents exact costs, cooldowns, values, targeting, and passive timing. The [Step 9 finalization note](FALCON_MECHANICS_FINALIZATION.md) separates owner-authored behavior from owner-approved implementation values added where the source omitted tuning details.

## Implemented passive overview

- **Elishia — Biotech Overdrive:** battle-start SPD/Evasion bonus for three Elishia turns and a non-stacking 8 MP discount after Nanotech skills.
- **Evalete — Catalyst Protocol:** targetable Catalyst Wing, periodic team healing/shields, and an early-destruction shield for Evalete.
- **Zackry — Overwatch Protocol:** next-attack Accuracy tokens for supported targeted ally/enemy support cases; Tactical Mark and marked-defeat MP recovery.
- **Jazen — Recoil Dampeners:** shield-aware damage threshold for stacking ATK bonuses and immunity to Stagger/action-delay statuses.
- **Zenki — Unobserved:** conditional Evasion bonus and attacker Accuracy penalty; Railshot has its separate conditional damage bonus.

## Enemy skills and AI

Training Drone and Rogue Automaton have declarative skill sets in `data/enemySkills/`. All five enemy archetypes reference declarative AI policies in `data/enemyAI/`; Siege Turret, Recon Drone, and Toxic Stalker currently use the basic-only policy.

## Data authority

Runtime skill behavior comes from `data/skills/`, `data/enemySkills/`, the shared skill runtime, combat systems, and tests. `references/characterTerraData.js` is the compact owner-reference extract containing selected skill objects and stat information; it is not a full character roster and is not imported by the engine. The owner maintains the separate website-facing character data.
