// Selected in-engine Falcon skill reference. Mechanics are implemented in characters/skillData/*.js.
// The website-facing characterTerraData.json is maintained separately by the project owner.
module.exports = {
  "characters": {
    "elishia": {
      "stats": {
        "HP": 1100,
        "MP": 140,
        "ATK": 99,
        "Mpow": 150,
        "DEF": 78,
        "RES": 88,
        "SPD": 95,
        "EVA": 10,
        "CritRate": 15
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_passive.webp",
        "title": "Biotech Overdrive",
        "description": "Elishia's nanotech keeps her one step ahead. At battle start, she gains +10% SPD and +10 Evasion for 3 turns. After using a Nanotech skill, her next skill costs 8 less MP. The discount is used on the next skill and cannot stack.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_1.webp",
        "title": "Skill 1: Nano Swarm",
        "description": "Release a cloud of clever little troublemakers and choose their job: Repair restores 15% Max HP to active allies; Disrupt deals 0.6× Nanotech mastery damage to all enemies and lowers their SPD by 10 for 2 turns; or Decoy grants Elishia +15 Evasion for 2 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_2.webp",
        "title": "Skill 2: Adaptive Barrier",
        "description": "Wrap Elishia or one ally in an adaptive nanotech shield worth 25% of their Max HP for up to 2 turns. The barrier learns from the first hit it absorbs, granting +15 resistance against that damage type for the shield's remaining duration.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "BUFF",
          "SHIELD"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_3.webp",
        "title": "Skill 3: Meo-v9",
        "description": "Send Meo-v9 into the fray for 3 turns. It scans enemies, making them take 10% more damage from Elishia, then peppers the field with covering fire for 0.5× its own ATK as Physical damage each turn. If an active ally starts its activation below 25% Max HP, Meo-v9 instead heals the lowest-HP-ratio ally for 10% Max HP. When its deployment naturally expires, Meo-v9 fires Final Protocol: 1.0× its own MPow against the priority target and 0.5× its MPow against other enemies, dealing Electromagnetic damage and reducing their SPD by 15 for 1 turn. It does not fire Final Protocol if destroyed early.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_4.webp",
        "title": "Ultimate: Nanotech Singularity",
        "description": "Turn the battlefield into Elishia's personal nanotech playground for 3 turns. Active allies gain +15 ATK and +10 SPD, and recover 5% Max HP at the start of their turns. Enemies lose 10 SPD and suffer Nanotech damage equal to 0.2× Elishia's MPow at the start of their turns. Meo-v9's covering fire rises to 0.75× its own ATK, while its scans make enemies take another 10% damage from Elishia. The damage-over-time tick cannot critically hit or trigger another damage-over-time effect.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "BUFF",
          "DEBUFF"
        ]
      }
    },
    "evalete": {
      "stats": {
        "HP": 1450,
        "MP": 110,
        "ATK": 85,
        "Mpow": 120,
        "DEF": 110,
        "RES": 105,
        "SPD": 95,
        "EVA": 5,
        "CritRate": 10
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/evalete_passive.webp",
        "title": "Catalyst Protocol",
        "description": "Evalete's Catalyst Wing watches over the squad for 12 turns. Every 2 turns, it restores 8% Max HP to active allies and refreshes a shield worth 10% Max HP for 2 turns. The shields refresh rather than stack. The Wing can be targeted and destroyed; if it is destroyed before its time is up, Evalete gains a 15% Max HP shield for 4 turns.",
        "type": "passive",
        "effects": [
          "HEAL",
          "SHIELD"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/evalete_skill_1.webp",
        "title": "Skill 1: Sentinel Pulse",
        "description": "Fire a focused Energy pulse that deals 0.75× Energy mastery damage to one enemy and weakens their DEF by 15 for 2 turns. A clean hit—and a much easier follow-up for the squad.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/evalete_skill_2.webp",
        "title": "Skill 2: Triage Infusion",
        "description": "No time for a long checkup. Deliver a concentrated bio-catalyst dose to one ally, immediately restoring 22% of their Max HP.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "HEAL"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/evalete_skill_3.webp",
        "title": "Skill 3: Guardian Field",
        "description": "Raise a protective field around active allies, restoring 12% of their Max HP and granting +15 DEF for 2 turns. A little breathing room can change the whole fight.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "HEAL",
          "BUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/evalete_skill_4.webp",
        "title": "Ultimate: Catalyst Overdrive",
        "description": "Bring the Catalyst system to full power. Cleanse removable debuffs from active allies, restore 18% Max HP, and grant +25 DEF and 25% Retaliation for 3 turns. The treatment keeps working too: allies recover another 10% Max HP at the start of each of their turns for 3 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "HEAL",
          "BUFF",
          "CLEANSE"
        ]
      }
    },
    "zackry": {
      "stats": {
        "HP": 1300,
        "MP": 140,
        "ATK": 97,
        "Mpow": 135,
        "DEF": 95,
        "RES": 105,
        "SPD": 90,
        "EVA": 5,
        "CritRate": 10
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_passive.webp",
        "title": "Overwatch Protocol",
        "description": "Zackry is always calling the next shot. When he uses a skill on an ally—or supports an enemy already targeted by an ally—that ally gains +10 Accuracy for their next attack. The bonus is consumed by that attack and does not stack. Tactical Mark also leaves its target with -10 Evasion.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_skill_1.webp",
        "title": "Skill 1: Tactical Mark",
        "description": "Call out one enemy and make them everyone's problem. Tactical Mark makes the target take 15% more damage and suffer -10 Evasion for 3 turns. If the marked enemy is defeated, each active ally recovers 5% of their own Max MP.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_skill_2.webp",
        "title": "Skill 2: Command Uplink",
        "description": "Broadcast a squad-wide combat order. Active allies gain +15 ATK for 3 turns; anyone above 50% Max HP gets another +5 ATK. That extra boost is checked again at the start of each ally's turn, so keep the team healthy and pressing forward.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_skill_3.webp",
        "title": "Skill 3: EMP Burst",
        "description": "Shut down one enemy with an electromagnetic blast, dealing 0.8× Electromagnetic mastery damage and reducing SPD by 20 for 2 turns. If the target is Tactical Marked, the disruption hits harder: SPD drops by 35 instead.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_skill_4.webp",
        "title": "Ultimate: Full Spectrum Assault",
        "description": "Zackry calls the entire battlefield into formation. All living enemies receive Tactical Mark for 3 turns, while active allies gain +20 ATK, +15 MPow, and +10 SPD for the same duration. Allies also gain +10 Critical Rate against marked enemies. Every target, every angle—one coordinated assault.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "BUFF",
          "DEBUFF"
        ]
      }
    },
    "jazen": {
      "stats": {
        "HP": 1400,
        "MP": 110,
        "ATK": 125,
        "Mpow": 95,
        "DEF": 105,
        "RES": 85,
        "SPD": 75,
        "EVA": 5,
        "CritRate": 10
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_passive.webp",
        "title": "Recoil Dampeners",
        "description": "The gauntlets turn punishment into momentum. Whenever Jazen loses more than 10% of his Max HP from a hit after shield absorption, he gains +10% ATK for 2 turns, stacking up to 2 times. He is immune to Stagger and action-delay effects.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_skill_1.webp",
        "title": "Skill 1: Impact Grenade",
        "description": "Lob an Impact Grenade into the enemy line, dealing 0.8× Kinetic mastery damage to all enemies. Each target has a 20% chance to be Staggered for 1 turn, pushing its readiness back by 20 points. Their next action is delayed—not erased.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_skill_2.webp",
        "title": "Skill 2: Breach Charge",
        "description": "Plant a Breach Charge on one enemy for a 1.2× Kinetic mastery blast. The explosion tears down 20 DEF for 2 turns and Staggers the target for 1 turn, pushing its readiness back by 20 points.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_skill_3.webp",
        "title": "Skill 3: Reinforced Plating",
        "description": "Lock in the heavy plating: Jazen gains a shield worth 25% of his Max HP and +20 DEF for 3 turns. He also Taunts enemies for 2 turns, daring eligible single-target attacks to come his way.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "BUFF",
          "SHIELD"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_skill_4.webp",
        "title": "Ultimate: Cataclysmic Payload",
        "description": "Make room for the big one. Cataclysmic Payload slams every enemy for 1.5× Kinetic mastery damage and reduces their DEF by 15 for 2 turns. Each enemy hit has a 25% chance to be Staggered for 1 turn, pushing its readiness back by 20 points.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      }
    },
    "zenki": {
      "stats": {
        "HP": 1050,
        "MP": 150,
        "ATK": 80,
        "Mpow": 145,
        "DEF": 70,
        "RES": 110,
        "SPD": 110,
        "EVA": 12,
        "CritRate": 18
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_passive.webp",
        "title": "Unobserved",
        "description": "The harder Zenki is to track, the more dangerous he becomes. While no enemy skill has targeted him during the current interval, he gains +12 Evasion. An enemy basic attack against him suffers a 10-point Accuracy penalty. Taking a hit suppresses Unobserved until the start of his next turn.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_1.webp",
        "title": "Skill 1: Railshot",
        "description": "A quiet breath, a steady sightline, then one supersonic answer. Railshot deals 1.1× Energy mastery damage to one enemy and cannot miss. If Zenki has not been targeted by an enemy since his previous turn, the shot gains 30% bonus damage.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_2.webp",
        "title": "Skill 2: Cipher Tag",
        "description": "Slip a tracking exploit onto one enemy. Cipher Tag makes the target take 12% more damage and reduces its RES by 15 for 3 turns. Only one enemy can carry Zenki's tag at a time; tagging another replaces the first.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "DEBUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_3.webp",
        "title": "Skill 3: Ghost Protocol",
        "description": "Disappear from the enemy's calculations. For 3 turns, Ghost Protocol grants Zenki +25 Evasion, +20 SPD, and +25% damage dealt.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "BUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_4.webp",
        "title": "Ultimate: Zero Hour Execution",
        "description": "The Longstrike locks onto its final coordinate. Zero Hour Execution deals 2.4× Energy mastery damage to one enemy—or 3.2× if the target is below 40% Max HP. If a Cipher Tagged target survives the shot, its SPD is reduced by 25 for 2 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG"
        ]
      }
    },
    "mirazhel": {
      "stats": {
        "HP": 1300,
        "MP": 145,
        "ATK": 90,
        "Mpow": 135,
        "DEF": 80,
        "RES": 100,
        "SPD": 100,
        "EVA": 10,
        "CritRate": 18
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_passive.webp",
        "title": "Unpredictable",
        "description": "Mirazhel's tactics shift every turn. At the start of each of her turns, she randomly selects one of three stances: Phantom (EVA +15), Anomaly (Mpow +15%), or Tactician (ATK +15%). She cannot change stances during the turn. After using a skill, she gains +10% CritRate for that turn.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_1.webp",
        "title": "Skill 1: Phantom Lunge",
        "description": "Dash through a target enemy with the Phantom Scythe, dealing Anomaly mastery damage at 1.2× Mpow power. If the target has less than 50% HP, hits them again for 0.6× Mpow damage. After striking, Mirazhel gains EVA +20 for 1 turn.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_2.webp",
        "title": "Skill 2: Spectral Command",
        "description": "Overlays a spectral command on the battlefield, granting one ally or enemy a debuff: allies gain SPD +15% for 2 turns, enemies have their DEF reduced by 20% for 2 turns. Mirazhel can only maintain one Spectral Command target at a time; retagging replaces the existing one.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "DEBUFF",
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_3.webp",
        "title": "Skill 3: Phantom Gambit",
        "description": "Mirazhel sacrifices 10% of her current HP to become Untargetable for 1 turn. At the end of the turn, she reappears and deals Anomaly mastery damage at 1.5× Mpow power to the marked enemy. If the target is below 50% HP, the damage is increased by 50%.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "DMG"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_4.webp",
        "title": "Ultimate: Phantom Dominion",
        "description": "Mirazhel dissolves into phantom energy and strikes all living enemies for Anomaly mastery damage at 0.8× Mpow power each. Enemies hit below 40% HP are executed (instantly defeated). After the barrage, Mirazhel gains Anomaly Mastery +30 for 2 turns and her next skill costs 20 MP less.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG"
        ]
      }
    },
    "elishia_p": {
      "stats": {
        "HP": 1100,
        "MP": 160,
        "ATK": 120,
        "Mpow": 165,
        "DEF": 65,
        "RES": 80,
        "SPD": 115,
        "EVA": 18,
        "CritRate": 25
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_passive.webp",
        "title": "Sovereign Authority",
        "description": "The Sovereign's Anomaly attacks inflict Suppression on the target, reducing their ATK by 15% for 2 turns. Reapplying Suppression refreshes its duration but does not stack. Additionally, the Sovereign gains +10% CritRate when facing enemies with lower DEF than their own Mpow.",
        "type": "passive",
        "effects": [
          "DEBUFF",
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_1.webp",
        "title": "Skill 1: Phantom Rend",
        "description": "Unleashes a concentrated Phantom Blade slash against a single enemy, dealing 160% Mpow as Anomaly damage. Applies Suppression through Sovereign Authority.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_2.webp",
        "title": "Skill 2: Sovereign Veil",
        "description": "The Sovereign commands their nanites to construct a protective veil, manifesting their defensive capabilities through Anomaly. The barrier absorbs damage equal to 150% Mpow (247.5 at base Mpow 165) for 2 turns or until broken. Recasting replaces the existing barrier.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 3,
        "effects": [
          "SHIELD",
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_3.webp",
        "title": "Skill 3: Phantom Legion",
        "description": "The Sovereign deploys their nanites to construct a temporary Phantom Legion formation that performs 3 coordinated Anomaly strikes against a single enemy, each dealing 60% Mpow (99 Anomaly damage at base Mpow 165), for a total of 180% Mpow (297 Anomaly damage). Applies Suppression through Sovereign Authority.",
        "type": "active",
        "mpCost": 45,
        "cooldown": 5,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_4.webp",
        "title": "Ultimate: Phantom Dominion",
        "description": "The Sovereign commands their nanites to converge around the Scarlet Blade, amplifying its Anomaly manifestation. She unleashes a devastating sweeping strike against all enemies, dealing 300% Mpow as Anomaly damage. Applies Suppression through Sovereign Authority.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      }
    },
    "lucaz": {
      "stats": {
        "HP": 1950,
        "MP": 100,
        "ATK": 118,
        "Mpow": 20,
        "DEF": 120,
        "RES": 100,
        "SPD": 42,
        "EVA": 10,
        "CritRate": 8
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_passive.webp",
        "title": "Colossus Frame",
        "description": "Lucaz's Colossus Frame converts kinetic impact into structural reinforcement. Each time he uses a skill, he gains DEF +8 for 2 turns (stacks up to 3 times). When at full stacks, his ATK is also increased by 10%. This effect persists even if he is unable to act.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_1.webp",
        "title": "Skill 1: Siege Fist",
        "description": "Delivers a devastating punch to a single enemy for Kinetic damage at 1.4× ATK power. If the target is already Staggered, deals 20% more damage and extends their Stagger duration by 1 turn.",
        "type": "active",
        "mpCost": 15,
        "cooldown": 1,
        "effects": [
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_2.webp",
        "title": "Skill 2: Anchor Protocol",
        "description": "Plants his Impact Maul into the ground, rooting himself in place. Lucaz gains DEF +25% and RES +15% for 3 turns. While active, he cannot move or be displaced by effects, and gains the ability to Taunt nearby enemies, forcing them to target him for 2 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_3.webp",
        "title": "Skill 3: Phantom Quake",
        "description": "Slams his Impact Maul into the ground, dealing Kinetic damage at 1.1× ATK power to all enemies and applying Stagger for 1 turn. Staggered enemies suffer 15% reduced SPD.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_4.webp",
        "title": "Ultimate: Tectonic Collapse",
        "description": "Channels all kinetic energy into his Impact Maul and slams it into the ground in a devastating arc, dealing Kinetic damage at 2.0× ATK power to all enemies in a wide area. Enemies hit are Staggered for 2 turns and have their DEF reduced by 20% for 2 turns. After use, Lucaz's SPD is reduced by 10% for 2 turns as the Colossus Frame cools down.",
        "type": "active",
        "mpCost": 45,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      }
    },
    "clarke": {
      "stats": {
        "HP": 1325,
        "MP": 110,
        "ATK": 112,
        "Mpow": 60,
        "DEF": 82,
        "RES": 82,
        "SPD": 105,
        "EVA": 20,
        "CritRate": 18
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_passive.webp",
        "title": "Phase Stride",
        "description": "Clarke's Phase-Lancer allows him to slip between attacks. When he successfully evades an attack, his next Kinetic skill deals +20% damage and gains +10 CritRate for that turn. This effect does not stack.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_1.webp",
        "title": "Skill 1: Phase Strike",
        "description": "Dashes forward with the Phase-Lancer, dealing Kinetic damage at 1.2× ATK power to a single enemy. If Clarke evaded an attack since his last turn, this strike also reduces the target's DEF by 10% for 2 turns.",
        "type": "active",
        "mpCost": 15,
        "cooldown": 1,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_2.webp",
        "title": "Skill 2: Shield Bash",
        "description": "Slams the Phantom Shield into a single enemy, dealing Kinetic damage at 0.9× ATK power and reducing their SPD by 15% for 2 turns. If the target is already Staggered, the SPD reduction is increased to 30%.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_3.webp",
        "title": "Skill 3: Lance Barrage",
        "description": "Performs a rapid sequence of three lance thrusts against a single enemy, each dealing 0.7× ATK Kinetic damage (total 2.1× ATK). Each hit has a chance to apply Bleed: 5% max HP physical damage over 2 turns.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_4.webp",
        "title": "Ultimate: Shadow Execution",
        "description": "Clarke vanishes into shadow and reappears behind the target enemy, delivering a devastating lance strike for 2.5× ATK Kinetic damage. If the target is below 40% max HP, this damage is increased to 3.5× ATK. After use, Clarke's EVA is reduced by 10 for 2 turns as his phase tech recalibrates.",
        "type": "active",
        "mpCost": 50,
        "cooldown": 6,
        "effects": [
          "DMG"
        ]
      }
    },
    "liezli": {
      "stats": {
        "HP": 1020,
        "MP": 130,
        "ATK": 118,
        "Mpow": 0,
        "DEF": 62,
        "RES": 84,
        "SPD": 104,
        "EVA": 14,
        "CritRate": 22
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_passive.webp",
        "title": "Mirage Reservoir",
        "description": "Liezli maintains up to 3 Mirage Charges. She gains 1 Charge if no enemy has targeted her since her last turn, and 1 Charge whenever an attack against her misses or is evaded. Charges never exceed 3. Spending a Charge on a skill empowers that skill; empowered effects are noted in each skill.",
        "type": "passive",
        "effects": [
          "UTILITY",
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_1.webp",
        "title": "Skill 1: Mirage Cloak",
        "description": "Liezli activates Phantom stealth tech, becoming Hidden until the start of her next turn and gaining 100% Evasion against targeted attacks. Stealth breaks early if she attacks, is hit by an area, unavoidable, or detection-capable attack, or uses another skill. While Hidden, her next offensive action deals +20% damage with +15% additional CritRate. If Liezli spends 1 Mirage Charge, she instead remains visible and manifests a Mirror Duplicate that intercepts the first single-target attack aimed at her before dissipating.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 3,
        "effects": [
          "BUFF",
          "UTILITY"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_2.webp",
        "title": "Skill 2: Executor's Step",
        "description": "Liezli fires a precision shot dealing 160% ATK as Anomaly damage with 15% additional CritRate. If Liezli spends 1 Mirage Charge, the shot also ignores 25% of the target's DEF and applies Marked, causing Liezli to deal +12% damage to that target for 2 turns.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_3.webp",
        "title": "Skill 3: Final Reflection",
        "description": "Liezli locks her Phantom rifle onto a single enemy, applying a Delayed Shot status that resolves automatically at the start of her next turn, dealing 240% ATK as Anomaly damage with 20% additional CritRate and 30% DEF penetration. While the lock is active, Liezli gains +25 Evasion and any active Mirror Duplicate is consumed to absorb the first incoming hit. If Liezli is defeated before the shot resolves, the status expires without firing.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG",
          "UTILITY"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_4.webp",
        "title": "Ultimate: Mirage Execution",
        "description": "Liezli projects overlapping holographic targeting signatures, revealing all Hidden or cloaked enemies, then concentrates every projected firing trajectory into one devastating precision shot at a single target, dealing 300% ATK as Anomaly damage with 30% additional CritRate and ignoring 40% of the target's DEF. Enemies below 30% max HP take an additional 20% damage. This skill consumes all remaining Mirage Charges; each Charge beyond the first increases the damage by 25%, up to a maximum of +50%.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG"
        ]
      }
    },
    "verra": {
      "stats": {
        "HP": 1125,
        "MP": 150,
        "ATK": 82,
        "Mpow": 155,
        "DEF": 72,
        "RES": 100,
        "SPD": 88,
        "EVA": 5,
        "CritRate": 12
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_passive.webp",
        "title": "Volatile Expertise",
        "description": "Verra's compounds are bidirectional. Whenever Verra deals damage with a skill, all active allies are healed for 20% of her Mpow. Enemies afflicted with Toxic take additional Toxic damage equal to 35% of Verra's Mpow at the start of their turns; reapplying Toxic refreshes its duration instead of stacking. When an enemy afflicted with Toxic is defeated, Verra recovers 8 MP. Additionally, when Verra applies Toxic to an enemy, all Serpent allies gain Toxic Resonance: +5% damage to that target for 2 turns (stacks up to 3 times, one per Serpent ally).",
        "type": "passive",
        "effects": [
          "DEBUFF",
          "HEAL",
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_1.webp",
        "title": "Skill 1: Caustic Injection",
        "description": "Inject a concentrated compound into one enemy, dealing 105% Mpow as Toxic damage and inflicting Toxic for 2 turns. All active allies are simultaneously healed for 45% Mpow.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 1,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_2.webp",
        "title": "Skill 2: Chemical Catastrophe",
        "description": "Mode A (all enemies): Detonate a volatile chemical cloud dealing 80% Mpow as Toxic damage to all enemies and inflicting Toxic for 2 turns on all targets not already afflicted. If at least one enemy already has Toxic, this mode deals 110% Mpow as Toxic damage to each Toxic-afflicted enemy instead. All active allies are healed for 55% Mpow.\n\nMode B (single target): If no enemy currently has Toxic, this skill auto-targets all enemies (same as Mode A). If the controller selects a single target that already has Toxic, deals 110% Mpow as Toxic damage to them only and heals all allies for 55% Mpow.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 3,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_3.webp",
        "title": "Skill 3: Unstable Remedy",
        "description": "Administer an unstable antidote: restore one ally's HP by 140% Mpow and remove one debuff from them, while dealing 70% Mpow as Toxic damage to one enemy target of your choice. If the healed ally is below 50% max HP, the heal increases to 180% Mpow. Costs 10 MP less if the target had no debuffs to remove.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 2,
        "effects": [
          "HEAL",
          "DMG",
          "UTILITY"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_ultimate.webp",
        "title": "Ultimate: Pandemic Protocol",
        "description": "Release a catastrophic chemical cloud dealing 140% Mpow as Toxic damage to all enemies. Enemies already afflicted with Toxic take an additional 60% Mpow as Toxic damage. All active allies are healed for 75% Mpow and gain Toxic Resistance 10% for 2 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 5,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF",
          "BUFF"
        ]
      }
    },
    "kane": {
      "stats": {
        "HP": 1275,
        "MP": 135,
        "ATK": 105,
        "Mpow": 0,
        "DEF": 78,
        "RES": 88,
        "SPD": 80,
        "EVA": 0,
        "CritRate": 14
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_passive.webp",
        "title": "Modular Architecture",
        "description": "Deployed charges last for 4 turns or until detonated. When a charge detonates, it deals 70% ATK as Kinetic damage to one primary enemy and 35% ATK to one additional enemy, and applies Exposed (+10% incoming damage for 2 turns) to the primary target. If two charges detonate within the same turn, both Exposed bonuses are suppressed and the damage instead increases by 50%. Additionally, when Kane takes damage from any source, there is a 30% chance a Construct Charge detonates automatically at 40% ATK (one trigger per turn).",
        "type": "passive",
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_1.webp",
        "title": "Skill 1: Construct Charge",
        "description": "Place one Construct Charge on one enemy for 4 turns. If Kane has fewer than 2 charges deployed, this charge is placed. Otherwise, the oldest existing charge is detonated first (dealing 65% ATK as Kinetic damage to one enemy and 32% ATK to one additional enemy, plus Exposed for 2 turns), then the new charge is placed. Costs 5 MP less if detonating a placed charge. The charge can be manually detonated by placing a second charge or by the passive trigger.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_2.webp",
        "title": "Skill 2: Reactive Scaffold",
        "description": "Deploy a short-lived cover segment lasting 3 turns with 150 HP. While the scaffold exists, Kane gains ATK +10% for 2 turns. The scaffold blocks targeting for both sides — it counts as an active ally for enemy target selection, and enemies cannot be targeted through it (enemy skills that require line of sight to a target are blocked). Only one scaffold can exist at a time; redeploying replaces it. The scaffold is destroyed if it absorbs damage equal to 150 HP.",
        "type": "active",
        "mpCost": 28,
        "cooldown": 3,
        "effects": [
          "BUFF",
          "UTILITY"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_3.webp",
        "title": "Skill 3: Architect's Gambit",
        "description": "Trigger a chain reaction through all active Construct Charges on the battlefield, detonating each for 75% ATK as Kinetic damage (one primary + one additional enemy per charge) with Exposed for 2 turns. Enemies affected by multiple charge detonations take +20% damage per additional hit. If no charges are active, deals 40% ATK as Kinetic damage to all enemies and applies Exposed to one of them.",
        "type": "active",
        "mpCost": 38,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_4.webp",
        "title": "Ultimate: Masterwork Detonation",
        "description": "Deploy 3 Construct Charges on 3 different enemies of your choice. At the start of Kane's next turn, they detonate in sequence. Each direct hit deals 60% ATK as Kinetic damage to the primary target and 30% ATK to an additional enemy, with Exposed for 2 turns. If all 3 charges detonate in the same turn, the final explosion deals 120% ATK instead of 60%.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      }
    },
    "galloz": {
      "stats": {
        "HP": 1800,
        "MP": 95,
        "ATK": 120,
        "Mpow": 0,
        "DEF": 108,
        "RES": 88,
        "SPD": 45,
        "EVA": 0,
        "CritRate": 10
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_passive.webp",
        "title": "Catalyst Shell",
        "description": "Galloz's reinforced armor passively reduces incoming damage by 8%. When Galloz uses a skill that deals damage, the Catalyst Shell overheats: he gains DEF +15% for 1 turn but his SPD is reduced by 10 for 1 turn. This effect can stack up to 2 times. At 2 stacks, his next skill costs 10 MP less. Additionally, when Galloz's SPD penalty from Catalyst Overlord ends, he gains DEF +20% for 1 turn.",
        "type": "passive",
        "effects": [
          "BUFF",
          "DEBUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_1.webp",
        "title": "Skill 1: Breach Cannon",
        "description": "Fire a heavy close-range blast dealing 120% ATK as Kinetic damage to one target and all enemies adjacent to it (one primary + up to 2 additional enemies). Enemies hit are pushed to the end of their next CR accumulation cycle (they lose their next scheduled action). Lighter enemies (HP below 800 at time of hit) are also Staggered for 1 turn.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 2,
        "effects": [
          "DMG",
          "CONTROL"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_2.webp",
        "title": "Skill 2: Pressure Reactor",
        "description": "Charge for 1 turn. Galloz becomes Untargetable for 1 turn and gains ATK +20% for 2 turns starting from the charge's completion. If Galloz is hit by a damaging skill during the channel, the charge is interrupted, he takes +20% damage from that hit, and gains no buff.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_3.webp",
        "title": "Skill 3: Tyrant's Rupture",
        "description": "Release a radial blast dealing 110% ATK as Kinetic damage to one primary enemy and one additional enemy. After this skill, Galloz is Slowed: SPD −15 for 2 turns. If Galloz has 2 stacks of Catalyst Shell overheating, this skill costs 10 MP less and the Slow duration is reduced to 1 turn.",
        "type": "active",
        "mpCost": 45,
        "cooldown": 5,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_4.webp",
        "title": "Ultimate: Catalyst Overlord",
        "description": "Overload Galloz's Catalyst Shell for 3 turns. During this time, Galloz gains DEF +40%, RES +20%, and his skills deal +30% ATK as Kinetic damage. At the end of the 3 turns, Galloz releases a devastating radial blast dealing 240% ATK as Kinetic damage to all enemies, then enters a cooldown state: ATK −20% and SPD −20 for 2 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 7,
        "effects": [
          "DMG",
          "BUFF",
          "DEBUFF"
        ]
      }
    },
    "claude": {
      "stats": {
        "HP": 1175,
        "MP": 145,
        "ATK": 90,
        "Mpow": 0,
        "DEF": 75,
        "RES": 95,
        "SPD": 90,
        "EVA": 0,
        "CritRate": 14
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_passive.webp",
        "title": "Showstopper Charge",
        "description": "Claude can place 1 Showstopper Charge on one enemy or ally per turn. Charges detonate automatically at the start of Claude's next turn, dealing 40% ATK as Kinetic damage to the target and 20% ATK to one additional enemy of your choice. Detonating a charge grants Claude SPD +10 for 1 turn. If the target enemy has 2 or more other enemies with a Toxic status at the time of detonation, the damage increases by 50%.",
        "type": "passive",
        "effects": [
          "DMG",
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_1.webp",
        "title": "Skill 1: Volatile Orders",
        "description": "Boost a nearby ally's ATK +15% and SPD +10 for 2 turns. The effect ends if the ally is defeated or swapped out of the active formation. Claude gains +5 MP when this skill is cast.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "BUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_2.webp",
        "title": "Skill 2: Chain Reaction",
        "description": "Detonate an active Showstopper Charge early, dealing 80% ATK as Kinetic damage to the target and one additional enemy. If the target has 2 or more other enemies nearby (allies of your choice), the damage increases by 40% and all nearby enemies are Staggered for 1 turn. If no charge is active, this skill costs 5 MP less and deals 40% ATK as Kinetic damage to one enemy without applying Stagger.",
        "type": "active",
        "mpCost": 28,
        "cooldown": 3,
        "effects": [
          "DMG",
          "CONTROL"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_3.webp",
        "title": "Skill 3: Grand Finale",
        "description": "Channel for 1 turn, marking a target enemy. At the end of the channel, deal 150% ATK as Kinetic damage to that enemy and one additional enemy. If Claude has an active Showstopper Charge on the primary target or any enemy within range of the mark, that charge detonates immediately and the damage to that target increases by 60%. Claude cannot act during the channel turn.",
        "type": "active",
        "mpCost": 45,
        "cooldown": 5,
        "effects": [
          "DMG"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_4.webp",
        "title": "Ultimate: Curtain Call",
        "description": "Place Showstopper Charges on up to 3 enemies of your choice. At the start of Claude's next turn, all charges detonate in sequence. Each direct hit deals 55% ATK as Kinetic damage, and one additional enemy takes 45% ATK as Kinetic damage splash. If any detonation occurs within range of another enemy, that enemy also takes 30% ATK as Kinetic damage. After this skill, Claude gains SPD +15 for 2 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 7,
        "effects": [
          "DMG",
          "BUFF"
        ]
      }
    },
    "tekushiki": {
      "stats": {
        "HP": 1150,
        "MP": 110,
        "ATK": 100,
        "Mpow": 0,
        "DEF": 75,
        "RES": 78,
        "SPD": 88,
        "EVA": 0,
        "CritRate": 14
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_passive.webp",
        "title": "Tether Snare",
        "description": "When Tekushiki targets an enemy with a skill, he applies 1 Tether Mark for 2 turns. Enemies with 3 Tether Marks are Bound: SPD −15 and lose their next scheduled action (their CR is pushed to the end of the current accumulation cycle). Tekushiki can maintain up to 3 Tether Marks simultaneously; applying a mark to a fully-marked enemy refreshes all three targets' durations instead.",
        "type": "passive",
        "effects": [
          "DEBUFF",
          "CONTROL"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_1.webp",
        "title": "Skill 1: Ruin Reversal",
        "description": "Reposition by using the tether to strike a target enemy, dealing 80% ATK as Kinetic damage. If Tekushiki ends his turn with a Tether Mark on that enemy, the mark's duration is extended by 1 turn. If he ends his turn with no Tether Marks active, he gains RES +15% for 1 turn instead.",
        "type": "active",
        "mpCost": 18,
        "cooldown": 2,
        "effects": [
          "BUFF",
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_2.webp",
        "title": "Skill 2: Null Knot",
        "description": "Create a stationary disruption zone on one enemy for 2 turns. Enemies starting their turn within the zone (the marked enemy and one additional enemy of your choice) have their skills interrupted if they are channeling, and their SPD reduced by 15 for the duration. The zone also reveals hidden/cloaked enemies within it. Tekushiki gains +1 Tether Mark on all enemies starting their turn in the zone.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "CONTROL",
          "DEBUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_3.webp",
        "title": "Skill 3: Last Thread",
        "description": "Link to a marked enemy with the Tether of Ruin, then deal 140% ATK as Kinetic damage and interrupt any channeling skill they are using. If the target has 3 Tether Marks, they are also Bound for 1 turn. If Tekushiki and the target are separated by an enemy or the target becomes Untargetable before the damage resolves, the skill is cancelled and only the Tether Mark is applied.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG",
          "CONTROL",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_4.webp",
        "title": "Ultimate: Ruin's Embrace",
        "description": "Unleash the Tether of Ruin in a wide arc, binding all enemies in a target area. Each enemy takes 100% ATK as Kinetic damage and gains 1 Tether Mark. Enemies with 3 or more Tether Marks from this skill are Bound for 2 turns. Additionally, Tekushiki pulls himself to the position of the enemy with the most Tether Marks in the area and deals 60% ATK as Kinetic damage to all enemies within 2 tiles of his new position. If no enemies are in the area, Tekushiki gains DEF +20% for 1 turn instead.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "CONTROL",
          "DEBUFF"
        ]
      }
    },
    "lexer": {
      "stats": {
        "HP": 1375,
        "MP": 140,
        "ATK": 95,
        "Mpow": 65,
        "DEF": 90,
        "RES": 110,
        "SPD": 75,
        "EVA": 0,
        "CritRate": 10
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/lexer_passive.webp",
        "title": "Command Architecture",
        "description": "Allies dealing damage to a Target-Locked enemy gain +15% damage multiplier against that target. Lexer can maintain Target Lock on up to 2 enemies simultaneously. When an enemy with Target Lock is defeated, Lexer gains +10 SPD for 2 turns. Target Lock does not stack with itself; applying it to a new target replaces the oldest existing lock.",
        "type": "passive",
        "effects": [
          "BUFF",
          "DEBUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/lexer_skill_1.webp",
        "title": "Skill 1: Tactical Relay",
        "description": "Relay target data to all allies, applying Target Lock to one enemy for 3 turns (+15% incoming damage from all sources). Additionally deals 55% Mpow as Anomaly damage to the locked target. If 2 enemies are already Target-Locked, this skill costs 10 MP less and instead refreshes both locks to full duration.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "BUFF",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/lexer_skill_2.webp",
        "title": "Skill 2: Adaptive Command",
        "description": "Select one directive for all active allies: ATK +15% for 2 turns, DEF +15% for 2 turns, or SPD +10 for 2 turns. If every active ally already has the selected buff active, this skill instead applies Target Lock to one enemy of your choice.",
        "type": "active",
        "mpCost": 28,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/lexer_skill_3.webp",
        "title": "Skill 3: Master Sequence",
        "description": "Reveal all hidden/cloaked enemies and apply Target Lock to up to 2 of them. All allies gain ATK +10% for 2 turns and an empowered opening hit: each ally's next attack against a Target-Locked enemy deals +25% damage. The empowered hit expires at the end of that ally's following turn.",
        "type": "active",
        "mpCost": 42,
        "cooldown": 5,
        "effects": [
          "BUFF",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/lexer_skill_4.webp",
        "title": "Ultimate: Orchestrator's Decree",
        "description": "Issue a battlefield-wide command: all Target-Locked enemies lose 20% DEF and RES for 3 turns; all allies gain +20% CritRate while attacking Target-Locked enemies for 3 turns. Lexer deals 180% ATK as Anomaly damage to every Target-Locked enemy. If all living enemies are Target-Locked, this skill's cooldown is reduced by 1 turn on use.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 7,
        "effects": [
          "DMG",
          "BUFF",
          "DEBUFF"
        ]
      }
    },
    "gdbv1": {
      "stats": {
        "HP": 2100,
        "MP": 80,
        "ATK": 125,
        "Mpow": 0,
        "DEF": 125,
        "RES": 112,
        "SPD": 32,
        "EVA": 0,
        "CritRate": 5
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/gdbv1_passive.webp",
        "title": "Frontal Plating",
        "description": "Bulwark Plating When GDB-V1 is targeted by a single-target attack or skill, he gains DEF +25% against that instance. Area-of-effect attacks ignore this bonus. GDB-V1 cannot have his CR reduced below its current value by enemy effects (immune to action-delay/skip). When GDB-V1 defeats an enemy, he gains ATK +10% for 2 turns (stacks up to 2 times).",
        "type": "passive",
        "effects": [
          "BUFF",
          "CONTROL"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/gdbv1_skill_1.webp",
        "title": "Skill 1: Siege Plating",
        "description": "Enter a fortified stance for 2 turns: DEF +30%, RES +15%, and incoming damage reduced by 20%. While active, if GDB-V1 is hit by an area-of-effect attack, the stance loses 1 remaining turn. Only one stance may be active at a time; recasting replaces it.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/gdbv1_skill_2.webp",
        "title": "Skill 2: Breach Pulse",
        "description": "Emit a kinetic shockwave dealing 90% ATK as Kinetic damage to one enemy and 45% ATK to one additional enemy of your choice. All enemies hit are Staggered for 1 turn (SPD −15%). If GDB-V1 has 2 stacks of Kinetic Overdrive from Bulwark Plating, Stagger lasts 2 turns instead.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "DMG",
          "CONTROL"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/gdbv1_skill_3.webp",
        "title": "Skill 3: Foundry Protocol",
        "description": "Anchor into a bombardment sequence on one enemy: strike 3 times at the end of each of GDB-V1's next 3 turns for 40% ATK each (total 120% ATK). Each strike is telegraphed when placed — the target may be shielded, healed, or swapped out of the active formation before it resolves. GDB-V1 cannot use this skill again while a sequence is pending. If all 3 strikes connect on the same target, that target is Staggered for 1 turn.",
        "type": "active",
        "mpCost": 45,
        "cooldown": 5,
        "effects": [
          "DMG",
          "CONTROL"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/gdbv1_skill_4.webp",
        "title": "Ultimate: Siege Cataclysm",
        "description": "Lock into a fortified assault stance for 2 turns: DEF +50%, RES +25%, and GDB-V1 cannot act offensively (basic attacks and skills disabled; stances and items still usable). At the end of each of those turns, release a shockwave dealing 100% ATK as Kinetic damage to all enemies. Enemies damaged by both a shockwave and a separate allied attack during this stance take +20% extra damage from that attack. After the 2nd turn, fire a final barrage dealing 200% ATK to all enemies, then enter a cooldown state: SPD −10 for 2 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 7,
        "effects": [
          "DMG",
          "BUFF",
          "DEBUFF"
        ]
      }
    },
    "elaine": {
      "stats": {
        "HP": 1150,
        "MP": 175,
        "ATK": 45,
        "Mpow": 145,
        "DEF": 78,
        "RES": 115,
        "SPD": 88,
        "EVA": 0,
        "CritRate": 6
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/elaine_passive.webp",
        "title": "Vitality Dart",
        "description": "When Elaine heals an ally below 50% max HP, that heal is increased by 30%. Whenever Elaine removes a debuff from an ally, she deals 40% Mpow as Energy damage to one enemy (auto-targets the lowest-HP-ratio enemy if the controller does not select one). Triggers once per skill use.",
        "type": "passive",
        "effects": [
          "HEAL",
          "DMG"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/elaine_skill_1.webp",
        "title": "Skill 1: Stabilizing Field",
        "description": "Deploy a medical field lasting 2 turns with 200 durability. At the start of each active ally's turn, they are healed for 60% Mpow and have one debuff removed. The field is destroyed early if it absorbs damage equal to its durability (damage dealt to fields is distributed from unblocked incoming attacks against allies). Only one Stabilizing Field can exist at a time; redeploying replaces it.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "HEAL",
          "UTILITY"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/elaine_skill_2.webp",
        "title": "Skill 2: Emergency Triage",
        "description": "Cleanse all debuffs from one ally and grant Stabilized: they cannot be knocked below 1 HP by damage until the start of Elaine's next turn. If the target had no debuffs, heal them for 90% Mpow instead. Costs 10 MP less if used on an ally above 70% max HP.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 2,
        "effects": [
          "BUFF",
          "HEAL",
          "UTILITY"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/elaine_skill_3.webp",
        "title": "Skill 3: Sovereign Lifeline",
        "description": "Channel for 1 turn. At the end of the channel, all active allies are healed for 80% Mpow and gain RES +20% for 2 turns. Any ally below 25% max HP when the channel began is also granted Stabilized for 1 turn. If Elaine is hit by a damaging attack during the channel, it is interrupted: the heal is reduced to 40% Mpow and the RES buff is cancelled.",
        "type": "active",
        "mpCost": 50,
        "cooldown": 5,
        "effects": [
          "HEAL",
          "BUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/elaine_skill_4.webp",
        "title": "Ultimate: Vitality Ascendant",
        "description": "Deploy an advanced medical field for 3 turns. At the start of each active ally's turn, they are healed for 50% Mpow and have one debuff removed. While active, all active allies take 15% reduced incoming damage and are immune to Stagger and Bind. After the final tick, Elaine gains +15 SPD for 2 turns. The field ends immediately if Elaine is defeated.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 8,
        "effects": [
          "HEAL",
          "BUFF"
        ]
      }
    },
    "zaine": {
      "stats": {
        "HP": 1100,
        "MP": 115,
        "ATK": 135,
        "Mpow": 20,
        "DEF": 48,
        "RES": 68,
        "SPD": 98,
        "EVA": 0,
        "CritRate": 28
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/zaine_passive.webp",
        "title": "Zero-Sight Calibration",
        "description": "When Zaine uses a skill, he gains Calibrated: his next attack against the same target deals +20% damage and ignores 15% of their DEF. Calibrated persists across turns until consumed or until Zaine is hit by a damaging attack, whichever comes first. Attacks against Marked or Target-Locked enemies gain +10 CritRate.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/zaine_skill_1.webp",
        "title": "Skill 1: Breach Marker",
        "description": "Mark an enemy's position, revealing them and applying Marked for 2 turns (+10% incoming damage from all sources). If the target is already Marked, this skill instead deals 65% ATK as Kinetic damage to them and refreshes Marked.",
        "type": "active",
        "mpCost": 15,
        "cooldown": 1,
        "effects": [
          "DEBUFF",
          "UTILITY",
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/zaine_skill_2.webp",
        "title": "Skill 2: Remote Breach",
        "description": "Plant a breach charge on one enemy that detonates at the start of Zaine's next turn, dealing 100% ATK as Kinetic damage to that enemy and 50% ATK to one additional enemy, then reducing their DEF by 15% for 2 turns. The charge is visible and telegraphed: if the marked enemy is defeated, swapped out of the active formation, or becomes Untargetable before detonation, the charge dissipates harmlessly and Zaine recovers 8 MP.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DEBUFF",
          "UTILITY"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/zaine_skill_3.webp",
        "title": "Skill 3: Execution Trace",
        "description": "Fire a high-penetration rail shot dealing 170% ATK as Kinetic damage to the primary target and 60% ATK to one additional enemy, with piercing damage reduced by 25% per further enemy struck. If the primary target is Marked or Target-Locked, this shot ignores 30% of their DEF instead of 15%.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/zaine_skill_4.webp",
        "title": "Ultimate: Zero-Sight Verdict",
        "description": "Lock onto a single target through sensor prediction and fire a precision rail shot dealing 260% ATK as Kinetic damage with +25% CritRate, ignoring 40% of their DEF. Cannot miss and is not reduced by Evasion. If the target is below 35% max HP, damage increases to 340% ATK. If the target is Marked or Target-Locked, Zaine recovers 15 MP on hit. After firing, Zaine's SPD is reduced by 12 for 1 turn as his rifle recalibrates.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG"
        ]
      }
    }
  },
  "statDescriptions": {
    "combatStats": {
      "title": "Combat Stats Information",
      "items": [
        {
          "label": "HP",
          "description": "Represents a character's survivability. When HP reaches zero, the character becomes incapacitated."
        },
        {
          "label": "MP",
          "description": "A resource consumed when using active skills. MP regenerates at the start of each character's turn."
        },
        {
          "label": "ATK",
          "description": "Determines the character's physical attack power and contributes to physical damage calculations."
        },
        {
          "label": "MPow",
          "description": "Determines the base damage power of mastery-based attacks and abilities."
        },
        {
          "label": "DEF",
          "description": "Reduces incoming physical damage. Higher DEF improves resistance against conventional attacks."
        },
        {
          "label": "RES",
          "description": "Reduces incoming mastery-based damage. Higher RES improves resistance against specialized combat abilities."
        },
        {
          "label": "SPD",
          "description": "Determines how quickly a character becomes ready to act. Higher SPD generally allows more frequent actions."
        },
        {
          "label": "CritRate",
          "description": "Represents the percentage chance of triggering a critical hit, which increases attack damage."
        },
        {
          "label": "EVA",
          "description": "Represents the percentage chance of avoiding eligible enemy attacks. Its effectiveness depends on the attack's evasion-check behavior."
        }
      ]
    },
    "mastery": {
      "title": "Mastery Information",
      "items": [
        {
          "label": "Mastery",
          "description": "Identifies a character's primary mastery, determining their associated damage category and specialization."
        },
        {
          "label": "Mastery Bonus",
          "description": "Increases damage dealt with the specified mastery by a percentage."
        },
        {
          "label": "Mastery Resistance",
          "description": "Reduces incoming damage from the specified mastery by a percentage."
        }
      ]
    }
  }
};
