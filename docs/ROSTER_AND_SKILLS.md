# Roster & Skill Reference

## F.O.D. mastery types

The project defines these eight mastery types:

1. Energy
2. Kinetic
3. Electromagnetic
4. Toxic
5. Nuclear
6. Nanotech
7. Cryogenic
8. Anomaly

Falcon agents receive a +15 mastery bonus for their assigned mastery in the current data. Mastery resistance defaults to zero unless configured.

## Falcon playable roster (source snapshot)

| Agent | Mastery | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Elishia | Nanotech | 1100 | 130 | 95 | 150 | 75 | 82 | 15 | 10 |
| Evalete | Energy | 1450 | 110 | 85 | 120 | 110 | 95 | 10 | 5 |
| Zackry | Electromagnetic | 1250 | 120 | 100 | 135 | 90 | 100 | 10 | 5 |
| Jazen | Kinetic | 1350 | 100 | 125 | 95 | 100 | 75 | 10 | 5 |
| Zenki | Anomaly | 1000 | 150 | 80 | 145 | 70 | 110 | 10 | 5 |

## Training enemy roster (source snapshot)

| Enemy | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion | Mastery |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Training Drone | 700 | 0 | 65 | 50 | 45 | 45 | 70 | 0 | Kinetic |
| Rogue Automaton | 850 | 0 | 75 | 60 | 55 | 50 | 60 | 0 | Kinetic |
| Siege Turret | 900 | 0 | 90 | 45 | 70 | 40 | 0 | 0 | Kinetic |
| Recon Drone | 620 | 0 | 58 | 70 | 35 | 65 | 115 | 12 | Kinetic |
| Toxic Stalker | 760 | 0 | 72 | 85 | 45 | 60 | 82 | 0 | Toxic |

Enemy default critical rate is 5%; Recon Drone has 12 Evasion. (The table's Crit value is omitted/0 where not explicitly overridden; factory defaults should be checked when tuning.)

## Skill implementation notes

Skill functions are in `characters/skills.js`. Each skill entry is declarative: `key`, `cost`, `targeting` (`enemy`, `ally`, `none`, or `mode` for Nano Swarm's three sub-choices) and a `run(actor, { target, mode })` that executes an already-validated choice. Skills never prompt; controllers (terminal menu, GUI, AI, scripts) choose targets and modes. The current source includes:

### Elishia
- **Nano Swarm** — 20 MP, cooldown 2; can repair an ally (15% max HP), disrupt an enemy (Nanotech damage at 0.6 power + SPD −10% for 2 turns), or create a decoy (+15 Evasion for 2 turns).
- **Adaptive Barrier** — 25 MP, cooldown 3; shield equal to 25% target max HP for 2 turns.
- **Meo-9** — 35 MP, cooldown 4; deploys a 350 HP summon for 3 summon turns; automatic cover fire at 0.5 physical power.
- **Nanotech Singularity** — 65 MP, cooldown 6; 3 turns of allied ATK +15%, allied SPD +10% (implemented via Singularity state), 5% max-HP healing at ally turn start, and enemy SPD −10%.

### Evalete
- **Sentinel Pulse** — 20 MP, cooldown 2; Energy damage at 0.75 power and DEF −15% for 2 turns.
- **Aegis Protocol** — 25 MP, cooldown 3; shield equal to 30% target max HP for 2 turns.
- **Guardian Field** — 40 MP, cooldown 4; active allies gain shield equal to 15% max HP and DEF +15% for 2 turns.
- **Catalyst Overdrive** — 65 MP, cooldown 6; active allies gain DEF +25%, retaliation 25%, and shield equal to 20% max HP for 3 turns.

### Zackry
- **Tactical Mark** — 20 MP, cooldown 2; target receives +15% incoming damage for 3 turns.
- **Command Uplink** — 30 MP, cooldown 3; active allies gain ATK +15% for 3 turns.
- Other skills should be read from the source file before being documented as final; skill catalog is still prototype data.

## Enemy AI actions (current source)

- Training Drone: 25% chance to use Pulse Shot when ready (cooldown 3; 1.35 physical power).
- Rogue Automaton: at ≤50% HP may Overload (ATK +25%, 2 turns; cooldown 5); may Scan (target DEF −15%, 2 turns; cooldown 4; 35% chance); may Heavy Strike (1.5 physical power; cooldown 3; 40% chance).
- Other enemies generally use basic attacks in current AI.
- Enemy target selection: Training Drone targets the first living non-summon ally; other enemies target the ally with the lowest HP ratio.

**Important:** This file is a source-backed quick reference, not a full design bible. Re-check skill code whenever mechanics change.
