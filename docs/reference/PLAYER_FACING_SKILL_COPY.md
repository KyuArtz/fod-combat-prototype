# Falcon Skill Descriptions — approved kit v1

This file is a short player-facing companion to the executable data in `characters/skillData/*.js`. Exact values, target rules, trigger timing and implementation details are documented in the [Falcon Implementation Guide](FALCON_IMPLEMENTATION_GUIDE.md). The owner's website-facing JSON is provided separately; it is not loaded by the engine.

## Elishia Bluestein

- **Biotech Overdrive:** Battle-start SPD and Evasion enhancement, plus a one-use 8 MP discount after a Nanotech skill.
- **Nano Swarm:** Choose Repair for one ally, Disrupt for one enemy, or Decoy for Elishia.
- **Adaptive Barrier:** Protect one ally with a shield that adapts to the latest damage type it absorbs.
- **EB's Drone: Meo-9:** A temporary support drone that alternates between cover fire and emergency healing after Elishia's turns. It has no destruction or expiry attack.
- **Nanotech Singularity:** Team ATK/SPD support, team turn-start healing, enemy SPD reduction, and stronger Meo-9 cover fire.

## Evalete Rosewelt

- **Catalyst Protocol:** The Catalyst Wing periodically heals and shields the squad. Destroying it stops future pulses without granting Evalete a fallback shield.
- **Sentinel Pulse:** Focused Energy damage and DEF reduction.
- **Triage Infusion:** Immediate single-target healing followed by three turns of healing over time.
- **Guardian Field:** Team healing and a temporary DEF increase.
- **Catalyst Overdrive:** Cleanses harmful effects, then provides team healing, DEF, healing over time and 25% direct-damage reflection.

## Zackry Selviria

- **Overwatch Protocol:** Tactical Marked enemies lose Evasion.
- **Tactical Mark:** Designates a priority enemy for increased incoming damage.
- **Command Uplink:** Grants the active squad Mpow +15%.
- **EMP Burst:** Electromagnetic damage and a fixed SPD reduction.
- **Full Spectrum Assault:** Marks all living enemies and grants the squad Mpow +20% and SPD +10%.

## Jazen Pryce

- **Recoil Dampeners:** Qualifying direct hits build up to two Mpow +10% stacks.
- **Impact Grenade:** Kinetic area damage.
- **Breach Charge:** Strong single-target Kinetic damage and DEF reduction.
- **Reinforced Plating:** Personal shield and DEF increase.
- **Cataclysmic Payload:** Heavy Kinetic area damage and DEF reduction.

## Zenki Archeron

- **Unobserved:** Evasion bonus while he has remained undamaged since his previous turn.
- **Railshot:** Reliable, guaranteed-hit Energy precision shot.
- **Cipher Tag:** Single-target RES reduction; applying a new tag replaces the old one.
- **Ghost Protocol:** Temporary untargetability followed by a one-use damage bonus.
- **Zero Hour Execution:** Three Energy rail shots, with a stronger final shot against a target that was already below 40% HP when the Ultimate began.
