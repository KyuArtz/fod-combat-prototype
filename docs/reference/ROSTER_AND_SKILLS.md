# Roster and Skills

## Unified selectable roster

The current interactive roster is assembled by `characters/roster.js`, which registers Falcon Company and Phantom Rebellion and merges their actor factories into one catalog. The selector supports faction/mastery/role filters, public-profile search, character previews, selecting three to five unique operatives, and ordering three active slots plus up to two reserves. The hidden operative is displayed as **Unknown** and is not searchable by its internal actor key. See [Unified Character Selection](UNIFIED_ROSTER_SELECTION.md) for terminal commands, battle integration, and the extension contract for future factions.

## Mastery types

The prototype defines eight mastery types: Energy, Kinetic, Electromagnetic, Toxic, Nuclear, Nanotech, Cryogenic, and Anomaly. Falcon and Phantom agents receive a +15 mastery bonus for their assigned mastery in the current runtime data. Mastery resistance defaults to zero unless configured.

## Falcon runtime roster

Base runtime stats are defined in `characters/falcon.js`. These are prototype values and are not automatically synchronized from the owner-maintained website stat sheet.

| Agent | Mastery | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Elishia | Nanotech | 1100 | 130 | 95 | 150 | 75 | 82 | 95 | 15 | 10 |
| Evalete | Energy | 1450 | 110 | 85 | 120 | 110 | 95 | 75 | 10 | 5 |
| Zackry | Electromagnetic | 1250 | 120 | 100 | 135 | 90 | 100 | 85 | 10 | 5 |
| Jazen | Kinetic | 1350 | 100 | 125 | 95 | 100 | 75 | 70 | 10 | 5 |
| Zenki | Energy | 1000 | 150 | 80 | 145 | 70 | 110 | 110 | 10 | 5 |

## Training enemy archetypes

Enemy definitions and base stats live in `data/enemies/`. Passives can apply additional runtime modifiers, so the table reports the configured base profile before passive modifiers.

| Enemy | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion | Mastery |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Training Drone | 1,265 | 120 | 103 | 118 | 82 | 88 | 95 | 9 | 4 | Kinetic |
| Rogue Automaton | 1,702 | 130 | 134 | 112 | 116 | 110 | 70 | 10 | 0 | Kinetic |
| Siege Turret | 1,552 | 110 | 162 | 112 | 127 | 82 | 42 | 12 | 0 | Kinetic |
| Recon Drone | 1,092 | 125 | 101 | 134 | 72 | 99 | 125 | 12 | 18 | Kinetic |
| Toxic Stalker | 1,322 | 140 | 118 | 157 | 88 | 99 | 100 | 12 | 10 | Toxic |

## Expanded enemy and boss roster

The five standard Training Ground archetypes retain their scaled profiles above. A sixth archetype, **Blightheart Overseer**, is reserved for the two-stage `blightheartSanctum` boss encounter. Its phase-change passive and four Toxic abilities are defined in `data/enemies/blightheartOverseer.js` and `data/enemySkills/blightheartOverseer.js`.

All six enemy archetypes now have declarative passive/skill data and AI policies. The Blightheart encounter is a separate progression/boss benchmark and should not be conflated with the standard five-enemy Training Ground test.

## Falcon skill registry

All five Falcon skill sets are data-defined in `characters/skillData/` and assembled by `characters/skills.js` through the shared interpreter.

| Agent | Passive | Skill 1 | Skill 2 | Skill 3 | Ultimate |
|---|---|---|---|---|---|
| Elishia | Biotech Overdrive | Nano Swarm | Adaptive Barrier | Meo-v9 | Nanotech Singularity |
| Evalete | Catalyst Protocol | Sentinel Pulse | Triage Infusion | Guardian Field | Catalyst Overdrive |
| Zackry | Overwatch Protocol | Tactical Mark | Command Uplink | EMP Burst | Full Spectrum Assault |
| Jazen | Recoil Dampeners | Impact Grenade | Breach Charge | Reinforced Plating | Cataclysmic Payload |
| Zenki | Unobserved | Railshot | Cipher Tag | Ghost Protocol | Zero Hour Execution |

The [Falcon implementation guide](FALCON_IMPLEMENTATION_GUIDE.md) documents current costs, cooldowns, values, targeting, and passive timing. [ADR-017](../project/DECISIONS.md) records the owner-approved global rules. The original Step 9 implementation choices remain available as a superseded [historical milestone](../history/milestones/STEP9_SUPERSEDED_FALCON_MECHANICS.md).

## Implemented passive overview

- **Elishia — Biotech Overdrive:** battle-start SPD/Evasion bonus for three Elishia turns and a non-stacking 8 MP discount after Nanotech skills.
- **Evalete — Catalyst Protocol:** targetable, non-turn-taking Catalyst Wing, periodic team healing/shields, and no destruction fallback shield.
- **Zackry — Overwatch Protocol:** marked enemies lose 10 Evasion; no ally accuracy token or marked-defeat MP reward.
- **Jazen — Recoil Dampeners:** direct-hit threshold is checked after mitigation but before shield absorption; grants up to two Mpow +10% stacks. No Stagger/action-delay immunity.
- **Zenki — Unobserved:** +12 Evasion while undamaged since his previous turn; no attacker accuracy penalty or Railshot damage bonus.

## Phantom runtime roster

The Phantom party factory is `characters/phantom.js`. It creates the five migrated units with source stat values, normalized `MPow`/`Evasion` keys, faction metadata (`phantom`), and a +15 bonus to each unit's primary mastery.

| Character | Mastery | Role | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Mirazhel Veyra | Anomaly | Tactician / Vanguard | 1300 | 145 | 90 | 135 | 80 | 100 | 100 | 18 | 10 |
| Unknown operative | Anomaly | Stalker | 1100 | 160 | 120 | 165 | 65 | 80 | 115 | 25 | 18 |
| Lucaz Durn | Kinetic | Juggernaut | 1950 | 100 | 118 | 20 | 120 | 100 | 42 | 8 | 10 |
| Clarke Voss | Electromagnetic | Vanguard | 1325 | 110 | 112 | 60 | 82 | 82 | 105 | 18 | 20 |
| Liezli Noct | Anomaly | Stalker | 1020 | 130 | 118 | 0 | 62 | 84 | 104 | 22 | 14 |

The source roster uses the internal key `elishia_p` for the Unknown operative. Her player-facing skill descriptions are intentionally neutral and do not reveal her identity. See the [Phantom Implementation Guide](PHANTOM_IMPLEMENTATION_GUIDE.md) for mechanics and the provisional Bleeding value.

## Phantom skill registry

All 20 Phantom active skills and their passive subscriptions are data-defined in `characters/skillData/` and assembled by `characters/skills.js` through the same interpreter used by Falcon. Mirazhel's mark applies its damage-taken bonus only to Phantom-faction attackers. Veil of the Unseen is restricted to another Phantom ally. Evasion passives, ATK/MPow scaling, one-use modifiers, Bleeding, Stagger, and shield replacement use shared registries/handlers.

## Enemy skills and AI

All six enemy archetypes have declarative skill sets in `data/enemySkills/` and dedicated policies in `data/enemyAI/`. The Blightheart Overseer has a dedicated phase-aware boss policy; the five standard archetypes use role-specific ordered rules.

## Data authority

Runtime Falcon and Phantom skill behavior comes from `characters/skillData/`; enemy skill behavior comes from `data/enemySkills/`. Both factions use the shared skill runtime, combat systems, and tests. `references/characterTerraData.js` is the compact owner-reference extract containing selected skill objects and stat information; it is not a full character roster and is not imported by the engine. The owner maintains the separate website-facing character data.
