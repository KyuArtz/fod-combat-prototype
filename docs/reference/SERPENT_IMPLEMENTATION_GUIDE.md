# Serpent Syndicate Implementation Guide

This guide describes the live Serpent Syndicate skill data and runtime behavior. Executable skill definitions in `characters/skillData/`, shared handlers, and tests are authoritative.

## Roster integration

`characters/serpent.js` creates the five Serpent actors. Each actor retains the source roster's core stats, primary mastery, role, Serpent faction metadata, and matching `skillSet` key. The factory normalizes `Mpow` to the runtime `MPow` field and `EVA` to `Evasion`; each character receives a +15 bonus to their primary mastery.

| Character | Runtime role | Mastery | HP | MP | ATK | MPow | DEF | RES | SPD | EVA | Crit |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Verra Sable | Field Medic / Demolitionist | Toxic | 1125 | 150 | 65 | 160 | 72 | 100 | 88 | 5 | 12 |
| Kane Virell | Stalker | Toxic | 1080 | 135 | 65 | 150 | 68 | 78 | 112 | 14 | 18 |
| Galloz Brakk | Juggernaut | Kinetic | 1950 | 110 | 115 | 0 | 120 | 95 | 42 | 0 | 8 |
| Claude Mercer | Tactician / Demolitionist | Toxic | 1200 | 155 | 65 | 145 | 80 | 100 | 100 | 5 | 12 |
| Tekushiki | Vanguard / Demolitionist | Kinetic | 1200 | 125 | 115 | 0 | 85 | 90 | 95 | 8 | 14 |

Tekushiki is an official/canon Serpent Syndicate operative by owner authorization on 2026-11-23. The current website-facing biography establishes him as a former scientist turned rogue operative who carries the Tether of Ruin and operates with the Syndicate. The tether's origin and much of his past remain unresolved; the migration does not invent answers to those mysteries. Other Serpent character backstories retain their existing source status and were not silently canonized.

## Shared status: Poison

Poison is a reusable source-attributed Toxic damage-over-time status. It resolves at the affected enemy's turn start, does not stack by default, and reapplication refreshes its duration. Each application captures the applier's calculated tick damage and source ID.

| Applier | Tick magnitude | Damage type | Duration |
|---|---:|---|---:|
| Verra | 0.25× her Mpow | Toxic | 2 affected-unit turns |
| Kane | 0.20× his Mpow | Toxic | 2 affected-unit turns |
| Claude | 0.20× his Mpow | Toxic | 2 affected-unit turns |

These Poison values are distinct from Phantom's Bleeding baseline (0.15× applier ATK as Anomaly damage for 2 affected-unit turns), which remains separately documented in the Phantom guide.

## Verra Sable — Toxic Field Medic / Demolitionist

**Passive — Toxicology Prodigy**

- Verra's Poison uses 0.25× her Mpow as a Toxic tick for 2 turns.
- Poison does not stack; reapplication refreshes its duration.
- Whenever Verra heals an ally, that ally receives Toxic Resistance +10% for 2 turns.

| Ability | Cost / cooldown | Runtime behavior |
|---|---:|---|
| Caustic Injection | 20 MP / 1 turn | Mode: Caustic Shot deals 1.10× Mpow Toxic damage and applies Poison; Catalyst Treatment heals one ally for 1.30× Mpow, cleanses one debuff, and grants Toxic Resistance +10%. |
| Chemical Catastrophe | 35 MP / 3 turns | Deals 0.85× Mpow Toxic damage to all enemies and applies Poison. Enemies already Poisoned receive an additional 0.20× Mpow impact damage. |
| Unstable Remedy | 30 MP / 2 turns | Mode: Unstable Remedy heals one ally for 1.60× Mpow (2.00× if the ally is below 50% HP), cleanses one debuff, and grants Toxic Resistance +10%. Corrosive Flask deals 1.00× Mpow Toxic damage and applies Poison. |
| Pandemic Protocol | 60 MP / 6 turns | Deals 1.45× Mpow Toxic damage to all enemies and applies Poison; heals allies for 1.00× Verra's Mpow and grants Toxic Resistance +15% for 2 turns. |

Verra's two mode-based skills expose both mode names, target types, and descriptions in the unified roster preview. Her passive's heal-triggered resistance is a declarative passive registry subscription; the skill modes also apply their explicitly described resistance effect.

## Kane Virell — Toxic Stalker

**Passive — Serpent's Instinct**

Kane deals +10% Toxic damage to targets already afflicted with Poison. This modifier does not stack with itself.

| Ability | Cost / cooldown | Runtime behavior |
|---|---:|---|
| Twin Fang | 20 MP / 1 turn | Two Toxic hits, each 0.60× Mpow, then applies Poison. |
| Venomous Pursuit | 28 MP / 3 turns | Deals 0.85× Mpow Toxic damage, applies Poison, and grants Kane SPD +10 and Evasion +8 for 2 turns. |
| Phantom Orbit | 40 MP / 4 turns | Three Toxic hits at 0.50× Mpow each. If the target was already Poisoned before the skill's hit sequence, the final hit gains +0.30× Mpow. Applies/refreshes Poison. |
| Deadly Convergence | 65 MP / 6 turns | Deals 2.50× Mpow Toxic damage; if the target was already Poisoned before impact, adds +0.50× Mpow. Applies/refreshes Poison and does not consume it. |

## Galloz Brakk — Kinetic Juggernaut

**Passive — Catalyst Husk**

- Reduces incoming damage by 8%.
- When hit by an enemy skill, gains one Reinforcement stack, up to two. Each stack grants DEF +5% for 3 turns.
- At two stacks, his next damaging skill consumes both stacks and gains the skill's defined Reinforcement payoff: normally +0.15× ATK as Kinetic power; Reactor Quake instead uses its explicit 1.20× ATK total power.

| Ability | Cost / cooldown | Runtime behavior |
|---|---:|---|
| Ironclad Impact | 20 MP / 1 turn | Deals 1.25× ATK Kinetic damage to one enemy and grants Galloz a shield equal to 6% Max HP for 2 turns. |
| Tyrant's Guard | 30 MP / 3 turns | Grants Galloz a 15% Max HP shield and all active allies 12% damage reduction for 2 turns. |
| Reactor Quake | 40 MP / 4 turns | Deals 0.90× ATK Kinetic damage to all enemies and grants DEF +10% for 2 turns. At two Reinforcement stacks, total damage power becomes 1.20× ATK and both stacks are consumed; the generic +0.15× charge is not added again. |
| Catalyst Overlord | 65 MP / 6 turns | Deals 1.90× ATK Kinetic damage to all enemies, heals Galloz for 10% Max HP, grants 20% damage reduction for 2 turns, and empowers his next damaging Kinetic skill within that window with an additional 0.20× ATK. |

## Claude Mercer — Toxic Tactician / Demolitionist

**Passive — Unstable Formulation**

When Claude uses an active skill that successfully hits an enemy, the primary enemy hit receives Fracture: DEF -8% for 2 turns. Reapplication refreshes the status; it does not stack.

| Ability | Cost / cooldown | Runtime behavior |
|---|---:|---|
| Rallying Catalyst | 20 MP / 2 turns | Grants one ally ATK +20% and SPD +10% for 2 turns. |
| Rupture Flask | 25 MP / 2 turns | Deals 1.30× Mpow Toxic damage, applies Poison, and reduces target DEF by 15% for 2 turns. |
| Sabotage Cocktail | 35 MP / 3 turns | Deals 0.75× Mpow Toxic damage to all enemies, applies Poison, and reduces enemy ATK by 15% for 2 turns. |
| Masterpiece in Mayhem | 65 MP / 6 turns | Deals 1.50× Mpow Toxic damage to all enemies, applies Poison, grants allies ATK +15% and SPD +10% for 2 turns, and reduces hit enemies' DEF by 20% for 2 turns. |

## Tekushiki — Kinetic Vanguard / Demolitionist

**Passive — Tether Snare**

- Damaging skills and basic attacks apply one Tether Mark to each enemy hit.
- Each target can hold up to two independently timed marks; each lasts 2 turns.
- Reaching two marks applies Snared: SPD -15% for 2 turns.
- Snared targets cannot receive additional Tether Marks while Snared.

| Ability | Cost / cooldown | Runtime behavior |
|---|---:|---|
| Ruin Reversal | 18 MP / 1 turn | Deals 1.00× ATK Kinetic damage. Against a target already Snared, adds +0.35× ATK. |
| Null Knot | 25 MP / 3 turns | Deals 0.70× ATK Kinetic damage to all enemies hit, applies one Tether Mark to each hit enemy, and reduces their SPD by 10% for 2 turns. |
| Last Thread | 40 MP / 4 turns | Deals 1.50× ATK Kinetic damage. If the target has two Tether Marks, consumes them, removes Snared, and applies Bind for 1 turn (skips the bound target's next action). |
| Ruin's Embrace | 60 MP / 6 turns | Deals 1.20× ATK Kinetic damage to all hit enemies, applies one Tether Mark, and reduces SPD by 20% for 2 turns. Enemies already Snared are also Bound for 1 turn. |

The passive skips mark reapplication on Last Thread when that skill consumed the marks, so its own control payoff is not immediately undone by the passive's post-skill hook.

## Tactical AI and faction matchups

`ai/serpentTactics.js` provides Serpent-specific tactical decisions. It values enemy support/medic roles, prioritizes Poison synergy, uses Verra's ally modes when sustain or cleansing is needed, protects Verra with reserve rotation, builds/consumes Galloz Reinforcement, and converts Tekushiki's Tether Marks into Snare/Bind control. The controller works on either battle side.

`tools/factionDuel.js` supports any distinct pair of Falcon, Phantom, and Serpent. Example:

```bash
npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3
npm run simulate:factions -- --player serpent --opponent phantom --battles 100 --active 3
```

The harness alternates which faction occupies each side and uses symmetric Evasion rules. Small smoke batches confirm execution only; larger seed ranges are required before making balance claims.

## Data authority and canon notes

- Executable skill behavior is in `characters/skillData/`; actor stats and factory metadata are in `characters/serpent.js`.
- The compact owner reference is `references/characterTerraData.js`; the separate website-facing roster JSON is maintained outside the engine and should be updated from the separate delivered `characterTerraData-serpent-updated.json` file.
- Tekushiki is canon as an official Serpent operative by explicit owner authorization. His current history and the Tether of Ruin's origin remain partially unresolved.
- Verra, Kane, Galloz, and Claude's pre-existing backstory status was not changed by this migration.
