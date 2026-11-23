# Character Skill Descriptions — current migrated kits

This file is a short player-facing companion to the executable data in `characters/skillData/*.js`. Exact Falcon values and implementation details are in the [Falcon Implementation Guide](FALCON_IMPLEMENTATION_GUIDE.md); Phantom values and mechanics are in the [Phantom Implementation Guide](PHANTOM_IMPLEMENTATION_GUIDE.md). The owner's website-facing JSON is provided separately; it is not loaded by the engine.

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


## Phantom Rebellion

### Mirazhel Veyra

- **Phantom Mark:** Successful Anomaly hits mark enemies for 2 turns; the mark increases damage from Phantom-faction attackers by 10%.
- **Wraithfang Pursuit:** A focused Anomaly strike that grants Evasion after a successful hit.
- **Veil of the Unseen:** Enhances another Phantom ally's Speed and critical rate.
- **Requiem of the Vanishing Blade:** A powerful strike that deals additional damage to Phantom Marked targets.
- **Nocturne of the Phantom Queen:** An Anomaly wave that marks targets hit and strengthens active allies' ATK.

### Unknown operative

The following descriptions intentionally avoid revealing the character's identity or faction affiliation.

- **Sovereign Authority:** Successful Anomaly attacks reduce a target's DEF and RES for 2 turns.
- **Scarlet Severance:** A focused Anomaly blade strike against one enemy.
- **Aegis of the Scarlet Veil:** A replaceable nanite barrier for the operative or one selected ally.
- **Crimson Phalanx:** A rapid three-strike sequence resolved as one damage instance, with Bleeding.
- **Scarlet Eclipse:** A sweeping Anomaly wave followed by a temporary increase to the operative's damage dealt.

### Lucaz Durn

- **Colossus Frame:** Reduces incoming damage and builds Reinforcement stacks when he takes qualifying hits; two stacks empower his next Kinetic damaging skill.
- **Ironwake Impact:** A heavy Kinetic strike with a bonus against Staggered targets.
- **Bastion of the Unyielding:** Raises DEF and RES, Taunts enemies, and reduces Lucaz's Speed.
- **Faultline Breaker:** Kinetic area damage and Stagger.
- **Cataclysm of the Iron Titan:** A stronger Kinetic area attack, Stagger, and team damage reduction.

### Clarke Voss

- **Phase Stride:** Successful evasion primes the next offensive skill for additional damage.
- **Riftpiercer:** An Electromagnetic strike that can reduce the target's DEF while Phase Advantage is active.
- **Aegis Reversal:** Raises Evasion and can prime a stronger Riftpiercer.
- **Thousandfold Pursuit:** A powerful Electromagnetic strike with a critical-rate bonus while Phase Advantage is active.
- **Eventide Impalement:** A high-damage Electromagnetic finisher with a conditional execute bonus.

### Liezli Noct

- **Mirage Synchronization:** Successful evasion grants a one-use critical-rate bonus.
- **Ghostlight Volley:** A paired-construct Anomaly attack that applies Bleeding.
- **Phantom Refraction:** Raises Evasion and empowers the next offensive skill.
- **Silverpoint Barrage:** An Anomaly area attack that applies Bleeding and reduces eligible enemy basic-attack accuracy.
- **Last Light, No Witnesses:** A high-damage Anomaly shot with a conditional execute bonus.

**Bleeding baseline:** Bleeding deals Anomaly damage based on 0.15× the applier's ATK, calculated when applied and ticked at the start of the affected unit's turns for 2 turns. It does not stack; reapplication refreshes its duration.
