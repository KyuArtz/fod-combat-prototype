// Selected in-engine Falcon, Phantom, and Serpent skill reference. Mechanics are implemented in characters/skillData/*.js.
// The hidden operative retains neutral player-facing skill descriptions; Tekushiki is an official Serpent member.
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
        "description": "Nanotechnology improves Elishia's aim stability, reload speed, and evasion. Gains SPD +10% and EVA +10 for 3 turns. After Elishia uses a Nanotech skill, her next active skill costs 8 MP less. The discount is consumed by the next active skill and does not stack. This passive does not increase damage.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_1.webp",
        "title": "Skill 1: Nano Swarm",
        "description": "Deploys nanobots and selects one of three modes: Repair restores 15% of one selected ally's Max HP; Disrupt deals 0.6× Nanotech mastery damage to one enemy and reduces its SPD by 10% for 2 turns; Decoy grants Elishia +15 Evasion for 2 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF",
          "BUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_2.webp",
        "title": "Skill 2: Adaptive Barrier",
        "description": "Protects Elishia or one selected ally with a nanotech barrier that absorbs damage equal to 25% of the target's Max HP. Lasts 2 turns or until depleted. Adapts to the latest damage type absorbed, granting 15% resistance against that type for the remaining duration.",
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
        "title": "Skill 3: EB's Drone: Meo-9",
        "description": "Deploys Meo-9 for 3 subsequent Elishia turns; it skips the deployment turn. After each subsequent Elishia turn, Meo-9 checks active living allies below 25% Max HP. If one qualifies, it heals the ally with the lowest HP percentage for 10% Max HP instead of attacking. Otherwise, it fires once for Physical Damage equal to 50% of its own ATK. During Nanotech Singularity, covering fire increases to 75% of its ATK. Meo-9 has no destruction or expiration effect.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "SUMMON",
          "DMG",
          "HEAL"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_skill_4.webp",
        "title": "Ultimate: Nanotech Singularity",
        "description": "Deploys a nanotech field for 3 Elishia turns. All active allies gain ATK +15% and SPD +10%, and recover 5% of their Max HP at the start of their turns. Enemies suffer SPD -10%. While Meo-9 is deployed, its covering fire increases to 75% of its own ATK as Physical Damage.",
        "type": "active",
        "mpCost": 65,
        "cooldown": 6,
        "effects": [
          "DMG",
          "HEAL",
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
        "description": "The Catalyst Wing is automatically deployed at battle start as a targetable passive summon and persists for 12 Evalete turns. At the start of every second Evalete turn, beginning with turn 2, it heals all active allies for 8% of their Max HP and grants each a shield equal to 10% of their Max HP for 2 turns. Destroying the Wing disables future pulses and grants no fallback shield.",
        "type": "passive",
        "effects": [
          "HEAL",
          "SHIELD",
          "SUMMON"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/evalete_skill_1.webp",
        "title": "Skill 1: Sentinel Pulse",
        "description": "Fires an Energy pulse at one enemy for mastery damage at 0.75× Mpow power. The target's DEF is reduced by 15% for 2 turns.",
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
        "description": "Administers a concentrated bio-catalyst dose to one selected ally, instantly healing them for 22% of their Max HP and applying healing over time equal to 10% Max HP per turn for 3 turns.",
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
        "description": "Generates a protective field on all active allies, healing each for 12% of their Max HP and granting DEF +15% for 2 turns.",
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
        "description": "Activates full Catalyst Protocol on all active allies. First cleanses harmful statuses (debuffs or negative stat effects) from living active non-summon allies, then instantly heals each for 18% of their Max HP, grants DEF +25%, and applies healing over time equal to 10% Max HP per turn for 3 turns. Allies also gain 25% damage reflection for 3 turns, returning 25% of direct incoming damage after mitigation and before shield absorption to its original attacker. Reflected damage cannot trigger reflection again.",
        "type": "active",
        "mpCost": 65,
        "cooldown": 6,
        "effects": [
          "HEAL",
          "BUFF"
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
        "description": "Enemies affected by Tactical Mark lose 10 Evasion for the duration of the mark. This passive grants no ally accuracy bonus.",
        "type": "passive",
        "effects": [
          "DEBUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_skill_1.webp",
        "title": "Skill 1: Tactical Mark",
        "description": "Designates one enemy as a priority target. The marked enemy receives 15% increased damage from all sources and loses 10 Evasion for 3 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DEBUFF",
          "UTILITY"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/zackry_skill_2.webp",
        "title": "Skill 2: Command Uplink",
        "description": "Broadcasts a combat directive to all active allies, granting Mpow +15% for 3 turns.",
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
        "description": "Deals Electromagnetic mastery damage at 0.8× Mpow power to one enemy and reduces its SPD by 20% for 2 turns, regardless of whether it is Tactical Marked.",
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
        "description": "Marks all living enemies with Tactical Mark and grants all active allies Mpow +20% and SPD +10% for 3 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "BUFF",
          "DEBUFF",
          "UTILITY"
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
        "description": "After a direct hit deals more than 10% of Jazen's Max HP after mitigation but before shield absorption, he gains Mpow +10% for 2 turns. This effect can stack up to 2 times. Further qualifying hits at maximum stacks refresh the duration. Jazen has no Stagger or action-delay immunity.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_skill_1.webp",
        "title": "Skill 1: Impact Grenade",
        "description": "Launches an Impact Grenade at all enemies, dealing Kinetic mastery damage at 0.8× Mpow power.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/jazen_skill_2.webp",
        "title": "Skill 2: Breach Charge",
        "description": "Detonates a Breach Charge on one enemy for Kinetic mastery damage at 1.2× Mpow power. Reduces the target's DEF by 20% for 2 turns.",
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
        "description": "Activates Reinforced Plating, granting Jazen a shield equal to 25% of his Max HP for 3 turns and DEF +20% for 3 turns. This skill does not apply Taunt.",
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
        "description": "Unleashes Cataclysmic Payload on all enemies, dealing Kinetic mastery damage at 1.5× Mpow power and reducing their DEF by 15% for 2 turns.",
        "type": "active",
        "mpCost": 65,
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
        "description": "At the start of each Zenki turn, if he has not taken damage since the end of his previous turn, he gains EVA +12 until he takes damage. This passive has no attacker accuracy penalty.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_1.webp",
        "title": "Skill 1: Railshot",
        "description": "Charges the Longstrike rail sniper and fires a high-velocity Falconite slug at one enemy for Energy mastery damage at 1.1× Mpow power. This shot cannot miss and has no conditional damage bonus.",
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
        "description": "Plants a tracking exploit on one enemy, marking it as compromised and reducing its RES by 15% for 3 turns. Only one enemy can be Cipher Tagged at a time; applying a new tag replaces the existing one. It does not increase damage received directly.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "DEBUFF",
          "UTILITY"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_3.webp",
        "title": "Skill 3: Ghost Protocol",
        "description": "Zenki breaks line of sight and repositions, becoming Untargetable until the start of his next turn. His next damaging skill gains a one-use +30% damage bonus, applied to that skill's total damage.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "BUFF",
          "UTILITY"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/zenki_skill_4.webp",
        "title": "Ultimate: Zero Hour Execution",
        "description": "Zenki locks onto one enemy and fires three rapid rail shots, each dealing Energy mastery damage at 0.9× Mpow power. If the target is below 40% of its Max HP when the Ultimate is activated, the final shot instead deals 1.6× Mpow power. The HP threshold is checked once at activation; the 1.6× final-shot value replaces, rather than adds to, the normal 0.9× value.",
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
        "title": "Phantom Mark",
        "description": "Whenever Mirazhel hits an enemy with an attack, she applies Phantom Mark to that enemy for 2 turns. Marked enemies receive 10% increased damage from Phantom allies. Phantom Mark does not stack; reapplication refreshes its duration.",
        "type": "passive",
        "effects": [
          "DEBUFF",
          "UTILITY"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_1.webp",
        "title": "Skill 1: Wraithfang Pursuit",
        "description": "Mirazhel dashes through one enemy, dealing Anomaly mastery damage at 1.25× Mpow power. After a successful hit, she gains EVA +15 for 1 turn.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 1,
        "effects": [
          "DMG",
          "BUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_2.webp",
        "title": "Skill 2: Veil of the Unseen",
        "description": "Mirazhel cloaks one other Phantom ally in Anomaly energy, increasing their SPD by 15% and CritRate by 10% for 2 turns. This skill cannot target Mirazhel herself or a non-Phantom ally. Recasting refreshes the duration instead of stacking the bonuses.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_3.webp",
        "title": "Skill 3: Requiem of the Vanishing Blade",
        "description": "Mirazhel strikes one enemy with a concentrated blade attack, dealing Anomaly mastery damage at 2.0× Mpow power. If the target is Phantom Marked, this attack deals 25% additional damage.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/mirazhel_skill_4.webp",
        "title": "Ultimate: Nocturne of the Phantom Queen",
        "description": "Mirazhel releases a sweeping Anomaly wave against all enemies, dealing 1.0× Mpow damage to each. All enemies hit receive Phantom Mark. After the attack, all active Phantom allies gain ATK +15% for 2 turns. The ATK bonus does not stack; reapplication refreshes its duration.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF",
          "BUFF"
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
        "description": "Successful Anomaly attacks reduce the target's DEF and RES by 10% for 2 turns. Each reduction is maintained independently; reapplication refreshes its duration instead of stacking.",
        "type": "passive",
        "effects": [
          "DEBUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_1.webp",
        "title": "Skill 1: Scarlet Severance",
        "description": "Delivers a focused blade strike against one enemy, dealing Anomaly mastery damage at 1.5× Mpow power.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 1,
        "effects": [
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_2.webp",
        "title": "Skill 2: Aegis of the Scarlet Veil",
        "description": "Deploys a nanite barrier on the user or one selected ally. The barrier absorbs damage equal to 120% of the user's Mpow for 2 turns or until depleted. Reapplication replaces this barrier rather than adding another.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "SHIELD",
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_3.webp",
        "title": "Skill 3: Crimson Phalanx",
        "description": "Resolves a rapid three-strike sequence as one damage instance, dealing Anomaly mastery damage at 2.0× Mpow power to one enemy and applying Bleeding for 2 turns. Bleeding deals Anomaly damage based on 0.15× the applier's ATK, calculated on application and ticked at the start of the affected unit's turns. It does not stack; reapplication refreshes its duration.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DOT"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/elishia_p_skill_4.webp",
        "title": "Ultimate: Scarlet Eclipse",
        "description": "Releases a sweeping Anomaly wave against all enemies, dealing 1.1× Mpow damage to each. Successful hits apply the user's DEF and RES reductions. The user then gains 15% increased damage dealt for 2 turns; reapplication refreshes the duration instead of stacking.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF",
          "BUFF"
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
        "description": "Lucaz takes 10% reduced damage from all attacks. Whenever he is hit, he gains Reinforcement, increasing DEF by 8% for 2 turns, stacking up to 2 times. At 2 stacks, his next damaging skill deals 20% additional Kinetic damage and consumes both stacks. Reinforcement cannot stack beyond 2, and reaching maximum stacks refreshes its duration.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_1.webp",
        "title": "Skill 1: Ironwake Impact",
        "description": "Lucaz strikes one enemy with his Impact Maul, dealing 150% ATK as Kinetic damage. If the target is Staggered, the attack deals 20% additional damage.",
        "type": "active",
        "mpCost": 15,
        "cooldown": 1,
        "effects": [
          "DMG"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_2.webp",
        "title": "Skill 2: Bastion of the Unyielding",
        "description": "Lucaz braces himself, increasing DEF by 25% and RES by 15% for 2 turns while drawing all enemy attacks (Taunt) for 2 turns. His SPD decreases by 15% while this stance is active.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "BUFF",
          "CONTROL"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_3.webp",
        "title": "Skill 3: Faultline Breaker",
        "description": "Lucaz slams the ground with overwhelming force, dealing 90% ATK as Kinetic damage to all enemies and Staggering them for 1 turn.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "DMG",
          "CONTROL"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/lucaz_skill_4.webp",
        "title": "Ultimate: Cataclysm of the Iron Titan",
        "description": "Lucaz unleashes a devastating shockwave, dealing 180% ATK as Kinetic damage to all enemies and Staggering them for 1 turn. All active allies gain 10% damage reduction for 2 turns.",
        "type": "active",
        "mpCost": 55,
        "cooldown": 6,
        "effects": [
          "DMG",
          "CONTROL",
          "BUFF"
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
        "description": "Whenever Clarke successfully evades an enemy attack, he gains Phase Advantage for 2 turns. His next offensive skill consumes Phase Advantage to deal 20% additional damage. Phase Advantage cannot stack or refresh while active.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_1.webp",
        "title": "Skill 1: Riftpiercer",
        "description": "Clarke lunges at a single enemy, dealing 150% ATK as Electromagnetic damage. If Phase Advantage is active, the attack additionally reduces the target's DEF by 10% for 2 turns.",
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
        "title": "Skill 2: Aegis Reversal",
        "description": "Clarke raises his Phantom Shield, increasing EVA by 20% for 2 turns. If he evades an attack while this buff is active, his next Skill 1 deals an additional 15% damage.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_3.webp",
        "title": "Skill 3: Thousandfold Pursuit",
        "description": "Clarke performs a rapid sequence of Phantom-Lancer strikes against one enemy, dealing 220% ATK as Electromagnetic damage in a single damage instance. If Phase Advantage is active, he gains 10% CritRate for this attack.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "DMG",
          "BUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/clarke_skill_4.webp",
        "title": "Ultimate: Eventide Impalement",
        "description": "Clarke pierces a single enemy with a devastating Phase-Lancer strike, dealing 300% ATK as Electromagnetic damage. If the target is below 40% HP, damage increases by 20%. Clarke gains 15% EVA for 2 turns after the attack.",
        "type": "active",
        "mpCost": 50,
        "cooldown": 6,
        "effects": [
          "DMG",
          "BUFF"
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
        "title": "Mirage Synchronization",
        "description": "Whenever Liezli successfully evades an enemy attack, she gains 10% CritRate for her next offensive skill. This effect cannot stack and expires after 2 turns or upon triggering.",
        "type": "passive",
        "effects": [
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_1.webp",
        "title": "Skill 1: Ghostlight Volley",
        "description": "Silhouette and Afterimage fire simultaneously at a single enemy, dealing 1.6× ATK as Anomaly damage and inflicting Bleeding for 2 turns. Bleeding deals Anomaly damage based on 0.15× the applier's ATK, calculated on application and ticked at the start of the affected unit's turns. It does not stack; reapplication refreshes its duration.",
        "type": "active",
        "mpCost": 15,
        "cooldown": 1,
        "effects": [
          "DMG",
          "DOT"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_2.webp",
        "title": "Skill 2: Phantom Refraction",
        "description": "Liezli disperses her constructs into a defensive mirage, increasing her EVA by 20% for 2 turns. Her next offensive skill deals 20% additional damage.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 3,
        "effects": [
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_3.webp",
        "title": "Skill 3: Silverpoint Barrage",
        "description": "Her two constructs sweep across the battlefield, firing at all enemies hit and dealing 1.0× ATK as Anomaly damage. Enemies hit suffer Bleeding for 2 turns and have their Accuracy reduced by 15% for 2 turns. Bleeding deals Anomaly damage based on 0.15× the applier's ATK, calculated on application and ticked at the start of the affected unit's turns. It does not stack; reapplication refreshes its duration.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DOT",
          "DEBUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/liezli_skill_4.webp",
        "title": "Ultimate: Last Light, No Witnesses",
        "description": "Both constructs lock onto a single enemy and unleash a converging shot, dealing 300% ATK as Anomaly damage. If the target is below 30% HP, the attack deals 25% additional damage.",
        "type": "active",
        "mpCost": 55,
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
        "ATK": 65,
        "Mpow": 160,
        "DEF": 72,
        "RES": 100,
        "SPD": 88,
        "EVA": 5,
        "CritRate": 12
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_passive.webp",
        "title": "Toxicology Prodigy",
        "description": "Verra's Poison deals damage equal to 25% of her Mpow as Toxic damage at the start of the afflicted enemy's turn for 2 turns. Poison does not stack; reapplication refreshes its duration. Whenever Verra heals an ally, that ally gains Toxic Resistance +10% for 2 turns.",
        "type": "passive",
        "effects": [
          "DOT",
          "BUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_1.webp",
        "title": "Skill 1: Caustic Injection",
        "description": "Verra switches her ammunition based on the selected target. Enemy: Deals 110% Mpow Toxic damage and inflicts Poison for 2 turns; Verra's Poison ticks for 25% of her Mpow. Ally: Restores HP equal to 130% Mpow, removes 1 debuff, and applies a HoT equal to 5% of target Max HP for 3 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 1,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF",
          "DOT"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_2.webp",
        "title": "Skill 2: Chemical Catastrophe",
        "description": "Launches a volatile vial at all enemies, dealing 85% Mpow Toxic damage and inflicting Poison for 2 turns. Enemies already afflicted with Poison receive an additional 20% Mpow damage on impact. Verra's Poison ticks for 25% of her Mpow.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DOT"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_3.webp",
        "title": "Skill 3: Unstable Remedy",
        "description": "Switches between two vial types. Ally: Restores 160% Mpow HP, increased to 200% Mpow if the target is below 50% HP, removes 1 debuff, and applies a HoT equal to 5% of target Max HP for 3 turns. Enemy: Deals 100% Mpow Toxic damage and inflicts Poison for 2 turns; Verra's Poison ticks for 25% of her Mpow.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 2,
        "effects": [
          "DMG",
          "HEAL",
          "DEBUFF",
          "DOT"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/verra_skill_4.webp",
        "title": "Ultimate: Pandemic Protocol",
        "description": "Verra unleashes a barrage of perfected chemical payloads. All enemies take 145% Mpow Toxic damage and are inflicted with Poison for 2 turns; Verra's Poison ticks for 25% of her Mpow. All allies recover HP equal to 100% Mpow and gain Toxic Resistance +15% for 2 turns.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "HEAL",
          "BUFF",
          "DOT"
        ]
      }
    },
    "kane": {
      "stats": {
        "HP": 1080,
        "MP": 135,
        "ATK": 65,
        "Mpow": 150,
        "DEF": 68,
        "RES": 78,
        "SPD": 112,
        "EVA": 14,
        "CritRate": 18
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_passive.webp",
        "title": "Serpent's Instinct",
        "description": "Kane deals 10% increased Toxic damage to enemies afflicted with Poison. This bonus does not stack.",
        "type": "passive",
        "effects": [
          "BUFF",
          "DMG"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_1.webp",
        "title": "Skill 1: Twin Fang",
        "description": "Kane strikes a single enemy twice with his Venom Crescents, each hit dealing 60% Mpow as Toxic damage. Inflicts Poison for 2 turns. Poison deals 20% of Kane's Mpow as Toxic damage at the start of the afflicted enemy's turn for 2 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 1,
        "effects": [
          "DMG",
          "DOT"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_2.webp",
        "title": "Skill 2: Venomous Pursuit",
        "description": "Kane launches his levitating blades at a single enemy, dealing 85% Mpow as Toxic damage and inflicting Poison for 2 turns. Kane gains SPD +10 and EVA +8 for 2 turns. These buffs do not stack; subsequent applications refresh their duration. Poison deals 20% of Kane's Mpow as Toxic damage per tick for 2 turns.",
        "type": "active",
        "mpCost": 28,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DOT",
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_3.webp",
        "title": "Skill 3: Phantom Orbit",
        "description": "Kane commands his levitating blades to strike a single enemy three times, each hit dealing 50% Mpow as Toxic damage. If the target is already afflicted with Poison before this skill is used, the final hit deals an additional 30% Mpow as Toxic damage. Inflicts Poison for 2 turns. Poison deals 20% of Kane's Mpow as Toxic damage per tick for 2 turns.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG",
          "DOT"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/kane_skill_4.webp",
        "title": "Ultimate: Deadly Convergence",
        "description": "Kane converges both Venom Crescents on a single target, dealing 250% Mpow as Toxic damage. If the target is already afflicted with Poison before the attack, deals an additional 50% Mpow as Toxic damage. Inflicts Poison for 2 turns. This skill does not consume Poison. Poison deals 20% of Kane's Mpow as Toxic damage per tick for 2 turns.",
        "type": "active",
        "mpCost": 65,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DOT"
        ]
      }
    },
    "galloz": {
      "stats": {
        "HP": 1950,
        "MP": 110,
        "ATK": 115,
        "Mpow": 0,
        "DEF": 120,
        "RES": 95,
        "SPD": 42,
        "EVA": 0,
        "CritRate": 8
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_passive.webp",
        "title": "Catalyst Husk",
        "description": "Galloz's cybernetic armor passively reduces incoming damage by 8%. Whenever he is hit by an enemy skill, he gains 1 Reinforcement stack, increasing his DEF by 5% per stack. Maximum 2 stacks. At 2 stacks, his next damaging skill deals an additional 15% ATK as Kinetic damage and consumes both stacks. Reinforcement stacks last 3 turns.",
        "type": "passive",
        "effects": [
          "BUFF",
          "DMG"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_1.webp",
        "title": "Skill 1: Ironclad Impact",
        "description": "Galloz drives his reinforced mechanical arm into a single enemy, dealing 125% ATK as Kinetic damage. After attacking, Galloz gains a shield equal to 8% of his maximum HP for 2 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 1,
        "effects": [
          "DMG",
          "SHIELD"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_2.webp",
        "title": "Skill 2: Tyrant's Guard",
        "description": "Galloz activates his reinforced plating, gaining a shield equal to 18% of his maximum HP, RES +10%, and Taunt for 2 turns. All active allies also receive 12% damage reduction for 2 turns.",
        "type": "active",
        "mpCost": 30,
        "cooldown": 3,
        "effects": [
          "SHIELD",
          "BUFF"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_3.webp",
        "title": "Skill 3: Reactor Quake",
        "description": "Galloz drives his mechanical arm into the ground, releasing a catalyst-powered shockwave that deals 90% ATK as Kinetic damage to all enemies. Galloz gains DEF +10% for 2 turns. If he has 2 Reinforcement stacks, the attack deals an additional 30% ATK as Kinetic damage and consumes both stacks.",
        "type": "active",
        "mpCost": 40,
        "cooldown": 4,
        "effects": [
          "DMG",
          "BUFF"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/galloz_skill_4.webp",
        "title": "Ultimate: Catalyst Overlord",
        "description": "Galloz releases the full output of his Catalyst Reactor, dealing 190% ATK as Kinetic damage to all enemies and restoring HP equal to 10% of his maximum HP. He gains 20% damage reduction for 2 turns. His next damaging skill used within those 2 turns deals an additional 20% ATK as Kinetic damage.",
        "type": "active",
        "mpCost": 65,
        "cooldown": 6,
        "effects": [
          "DMG",
          "HEAL",
          "BUFF"
        ]
      }
    },
    "claude": {
      "stats": {
        "HP": 1200,
        "MP": 155,
        "ATK": 65,
        "Mpow": 145,
        "DEF": 80,
        "RES": 100,
        "SPD": 100,
        "EVA": 5,
        "CritRate": 12
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_passive.webp",
        "title": "Unstable Formulation",
        "description": "Whenever Claude uses an active skill, he has a 100% chance to inflict Fracture on the primary enemy hit, reducing their DEF by 8% for 2 turns. Fracture does not stack; subsequent applications refresh its duration.",
        "type": "passive",
        "effects": [
          "DEBUFF"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_1.webp",
        "title": "Skill 1: Rallying Catalyst",
        "description": "Claude throws a supportive vial at one ally, increasing their ATK by 20% and SPD by 10% for 2 turns.",
        "type": "active",
        "mpCost": 20,
        "cooldown": 2,
        "effects": [
          "BUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_2.webp",
        "title": "Skill 2: Rupture Flask",
        "description": "Claude throws an explosive vial at one enemy, dealing 130% Mpow as Toxic damage and inflicting Poison for 2 turns. Reduces the target's DEF by 15% for 2 turns. Poison deals 20% of Claude's Mpow as Toxic damage per tick for 2 turns.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 2,
        "effects": [
          "DMG",
          "DEBUFF",
          "DOT"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_3.webp",
        "title": "Skill 3: Sabotage Cocktail",
        "description": "Claude throws a volatile mixture that explodes across all enemies, dealing 75% Mpow as Toxic damage, inflicting Poison for 2 turns, and reducing their ATK by 15% for 2 turns. Poison deals 20% of Claude's Mpow as Toxic damage per tick for 2 turns.",
        "type": "active",
        "mpCost": 35,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DEBUFF",
          "DOT"
        ]
      },
      "ultimate": {
        "icon": "assets/images/character-presets/skill-icons/terra/claude_skill_4.webp",
        "title": "Ultimate: Masterpiece in Mayhem",
        "description": "Claude unleashes a perfected chain of volatile concoctions against all enemies, dealing 150% Mpow as Toxic damage and inflicting Poison for 2 turns. All allies gain ATK +15% and SPD +10% for 2 turns. Reduces all enemies' DEF by 20% for 2 turns. Poison deals 20% of Claude's Mpow as Toxic damage per tick for 2 turns.",
        "type": "active",
        "mpCost": 65,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF",
          "BUFF",
          "DOT"
        ]
      }
    },
    "tekushiki": {
      "stats": {
        "HP": 1200,
        "MP": 125,
        "ATK": 115,
        "Mpow": 0,
        "DEF": 85,
        "RES": 90,
        "SPD": 95,
        "EVA": 8,
        "CritRate": 14
      },
      "passiveSkill": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_passive.webp",
        "title": "Tether Snare",
        "description": "Tekushiki's attacks apply 1 Tether Mark to enemies hit. Each enemy can hold a maximum of 2 Tether Marks, lasting 2 turns each. At 2 Marks, the target becomes Snared, reducing SPD by 15% for 2 turns. Snared enemies cannot gain additional Tether Marks while Snared.",
        "type": "passive",
        "effects": [
          "DEBUFF",
          "CONTROL"
        ]
      },
      "skill1": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_1.webp",
        "title": "Ruin Reversal",
        "description": "Tekushiki strikes one enemy with the Tether of Ruin, dealing 100% ATK as Kinetic damage and applying 1 Tether Mark. If the target is already Snared, this attack deals an additional 35% ATK as Kinetic damage.",
        "type": "active",
        "mpCost": 18,
        "cooldown": 1,
        "effects": [
          "DMG",
          "DEBUFF"
        ]
      },
      "skill2": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_2.webp",
        "title": "Null Knot",
        "description": "Tekushiki creates a tether trap that strikes all enemies, dealing 70% ATK as Kinetic damage, reducing their SPD by 10% for 2 turns, and applying 1 Tether Mark to each enemy hit.",
        "type": "active",
        "mpCost": 25,
        "cooldown": 3,
        "effects": [
          "DMG",
          "DEBUFF",
          "CONTROL"
        ]
      },
      "skill3": {
        "icon": "assets/images/character-presets/skill-icons/terra/tekushiki_skill_3.webp",
        "title": "Last Thread",
        "description": "Tekushiki lashes one enemy with the Tether of Ruin, dealing 150% ATK as Kinetic damage. If the target has 2 Tether Marks, consumes both Marks to inflict Bind for 1 turn.",
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
        "title": "Ruin's Embrace",
        "description": "Tekushiki unleashes the Tether of Ruin across all enemies, dealing 120% ATK as Kinetic damage, applying 1 Tether Mark, and reducing their SPD by 20% for 2 turns. Enemies already Snared are additionally Bound for 1 turn.",
        "type": "active",
        "mpCost": 60,
        "cooldown": 6,
        "effects": [
          "DMG",
          "DEBUFF",
          "CONTROL"
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
