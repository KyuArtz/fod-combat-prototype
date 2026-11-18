# Falcon Skill Descriptions

Player-facing copy for the five Falcon characters. These descriptions are written to be lively and readable while preserving the implemented skill effects. Skill mechanics remain defined by `data/skills/*.js`; this file and `references/characterTerraData.js` are copy references, not a separate mechanics source.

## Elishia Bluestein

**Biotech Overdrive — Passive**
Elishia's nanotech keeps her one step ahead. At battle start, she gains +10% SPD and +10 Evasion for 3 turns. After using a Nanotech skill, her next skill costs 8 less MP. The discount is used on the next skill and cannot stack.

**Skill 1: Nano Swarm**
Release a cloud of clever little troublemakers and choose their job: Repair restores 15% Max HP to active allies; Disrupt deals 0.6× Nanotech mastery damage to all enemies and lowers their SPD by 10 for 2 turns; or Decoy grants Elishia +15 Evasion for 2 turns.

**Skill 2: Adaptive Barrier**
Wrap Elishia or one ally in an adaptive nanotech shield worth 25% of their Max HP for up to 2 turns. The barrier learns from the first hit it absorbs, granting +15 resistance against that damage type for the shield's remaining duration.

**Skill 3: Meo-v9**
Send Meo-v9 into the fray for 3 turns. It scans enemies, making them take 10% more damage from Elishia, then peppers the field with covering fire for 0.5× its own ATK as Physical damage each turn. If an active ally starts its activation below 25% Max HP, Meo-v9 instead heals the lowest-HP-ratio ally for 10% Max HP. When its deployment naturally expires, Meo-v9 fires Final Protocol: 1.0× its own MPow against the priority target and 0.5× its MPow against other enemies, dealing Electromagnetic damage and reducing their SPD by 15 for 1 turn. It does not fire Final Protocol if destroyed early.

**Ultimate: Nanotech Singularity**
Turn the battlefield into Elishia's personal nanotech playground for 3 turns. Active allies gain +15 ATK and +10 SPD, and recover 5% Max HP at the start of their turns. Enemies lose 10 SPD and suffer Nanotech damage equal to 0.2× Elishia's MPow at the start of their turns. Meo-v9's covering fire rises to 0.75× its own ATK, while its scans make enemies take another 10% damage from Elishia. The damage-over-time tick cannot critically hit or trigger another damage-over-time effect.

## Evalete Rosewelt

**Catalyst Protocol — Passive**
Evalete's Catalyst Wing watches over the squad for 12 turns. Every 2 turns, it restores 8% Max HP to active allies and refreshes a shield worth 10% Max HP for 2 turns. The shields refresh rather than stack. The Wing can be targeted and destroyed; if it is destroyed before its time is up, Evalete gains a 15% Max HP shield for 4 turns.

**Skill 1: Sentinel Pulse**
Fire a focused Energy pulse that deals 0.75× Energy mastery damage to one enemy and weakens their DEF by 15 for 2 turns. A clean hit—and a much easier follow-up for the squad.

**Skill 2: Triage Infusion**
No time for a long checkup. Deliver a concentrated bio-catalyst dose to one ally, immediately restoring 22% of their Max HP.

**Skill 3: Guardian Field**
Raise a protective field around active allies, restoring 12% of their Max HP and granting +15 DEF for 2 turns. A little breathing room can change the whole fight.

**Ultimate: Catalyst Overdrive**
Bring the Catalyst system to full power. Cleanse removable debuffs from active allies, restore 18% Max HP, and grant +25 DEF and 25% Retaliation for 3 turns. The treatment keeps working too: allies recover another 10% Max HP at the start of each of their turns for 3 turns.

## Zackry Selviria

**Overwatch Protocol — Passive**
Zackry is always calling the next shot. When he uses a skill on an ally—or supports an enemy already targeted by an ally—that ally gains +10 Accuracy for their next attack. The bonus is consumed by that attack and does not stack. Tactical Mark also leaves its target with -10 Evasion.

**Skill 1: Tactical Mark**
Call out one enemy and make them everyone's problem. Tactical Mark makes the target take 15% more damage and suffer -10 Evasion for 3 turns. If the marked enemy is defeated, each active ally recovers 5% of their own Max MP.

**Skill 2: Command Uplink**
Broadcast a squad-wide combat order. Active allies gain +15 ATK for 3 turns; anyone above 50% Max HP gets another +5 ATK. That extra boost is checked again at the start of each ally's turn, so keep the team healthy and pressing forward.

**Skill 3: EMP Burst**
Shut down one enemy with an electromagnetic blast, dealing 0.8× Electromagnetic mastery damage and reducing SPD by 20 for 2 turns. If the target is Tactical Marked, the disruption hits harder: SPD drops by 35 instead.

**Ultimate: Full Spectrum Assault**
Zackry calls the entire battlefield into formation. All living enemies receive Tactical Mark for 3 turns, while active allies gain +20 ATK, +15 MPow, and +10 SPD for the same duration. Allies also gain +10 Critical Rate against marked enemies. Every target, every angle—one coordinated assault.

## Jazen

**Recoil Dampeners — Passive**
The gauntlets turn punishment into momentum. Whenever Jazen loses more than 10% of his Max HP from a hit after shield absorption, he gains +10% ATK for 2 turns, stacking up to 2 times. He is immune to Stagger and action-delay effects.

**Skill 1: Impact Grenade**
Lob an Impact Grenade into the enemy line, dealing 0.8× Kinetic mastery damage to all enemies. Each target has a 20% chance to be Staggered for 1 turn, pushing its readiness back by 20 points. Their next action is delayed—not erased.

**Skill 2: Breach Charge**
Plant a Breach Charge on one enemy for a 1.2× Kinetic mastery blast. The explosion tears down 20 DEF for 2 turns and Staggers the target for 1 turn, pushing its readiness back by 20 points.

**Skill 3: Reinforced Plating**
Lock in the heavy plating: Jazen gains a shield worth 25% of his Max HP and +20 DEF for 3 turns. He also Taunts enemies for 2 turns, daring eligible single-target attacks to come his way.

**Ultimate: Cataclysmic Payload**
Make room for the big one. Cataclysmic Payload slams every enemy for 1.5× Kinetic mastery damage and reduces their DEF by 15 for 2 turns. Each enemy hit has a 25% chance to be Staggered for 1 turn, pushing its readiness back by 20 points.

## Zenki Archeron

**Unobserved — Passive**
The harder Zenki is to track, the more dangerous he becomes. While no enemy skill has targeted him during the current interval, he gains +12 Evasion. An enemy basic attack against him suffers a 10-point Accuracy penalty. Taking a hit suppresses Unobserved until the start of his next turn.

**Skill 1: Railshot**
A quiet breath, a steady sightline, then one supersonic answer. Railshot deals 1.1× Energy mastery damage to one enemy and cannot miss. If Zenki has not been targeted by an enemy since his previous turn, the shot gains 30% bonus damage.

**Skill 2: Cipher Tag**
Slip a tracking exploit onto one enemy. Cipher Tag makes the target take 12% more damage and reduces its RES by 15 for 3 turns. Only one enemy can carry Zenki's tag at a time; tagging another replaces the first.

**Skill 3: Ghost Protocol**
Disappear from the enemy's calculations. For 3 turns, Ghost Protocol grants Zenki +25 Evasion, +20 SPD, and +25% damage dealt.

**Ultimate: Zero Hour Execution**
The Longstrike locks onto its final coordinate. Zero Hour Execution deals 2.4× Energy mastery damage to one enemy—or 3.2× if the target is below 40% Max HP. If a Cipher Tagged target survives the shot, its SPD is reduced by 25 for 2 turns.
