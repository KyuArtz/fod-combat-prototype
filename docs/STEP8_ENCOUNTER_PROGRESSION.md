# Step 8 — Encounter Progression, Waves and Reinforcements

## Goal

Extend Step 7's data-defined encounters with multi-wave progression, defeat-triggered reinforcements, per-instance enemy stat overrides, structured completion events and a reward integration hook. Existing one-wave encounters remain behavior-compatible.

## Encounter data

Encounter definitions remain under `data/encounters/`. Existing definitions using `enemies: [...]` are treated as a single `main` wave for backwards compatibility. New definitions may use:

```js
module.exports = {
  id: "exampleEncounter",
  name: "Example Encounter",
  waves: [
    {
      id: "opening-wave",
      name: "Opening Wave",
      enemies: ["training-drone", "rogue-automaton", "siege-turret", "recon-drone", "toxic-stalker"],
    },
    {
      id: "boss-wave",
      name: "Boss Wave",
      enemies: [
        { enemy: "training-drone", instanceId: "boss-drone", stats: { HP: 900, ATK: 80 } },
        "rogue-automaton",
        "siege-turret",
        "recon-drone",
        "toxic-stalker",
      ],
    },
  ],
  reinforcements: [
    {
      id: "support-team",
      trigger: { type: "enemyDefeatedCount", atLeast: 2 },
      enemies: [{ enemy: "recon-drone", instanceId: "support-recon" }],
    },
  ],
  rewards: { encounterClear: "exampleEncounterClear" },
};
```

Each wave currently requires at least five enemy entries because the active formation cap remains five. Repeated archetypes are allowed. Use `instanceId` when an entry needs a stable unique actor ID. Per-instance `stats` overrides are merged over the archetype's base stats and do not mutate the registered definition. Supported numeric overrides are HP, MP, ATK, MPow, DEF, RES, SPD, CritRate and Evasion; values must be finite and non-negative.

## Reinforcements

The currently supported trigger is `enemyDefeatedCount`, with a positive integer `atLeast`. A trigger fires once per encounter. Reinforcement actors are appended to the enemy reserve and use the existing automatic reserve deployment path when an active enemy is defeated. They therefore do not create a second deployment/replacement system.

## Runtime progression

- The first wave is deployed when the battle starts.
- When the enemy side has no living deployed or reserve combatants, the engine emits `EncounterWaveCleared`.
- If another wave exists, it is created and deployed, then `EncounterWaveStarted` is emitted. The battle continues without reporting an intermediate victory.
- When the final wave is cleared, the engine emits `EncounterCompleted` once and calls the optional `onEncounterComplete` callback with `{ encounterId, result, round, rewards }`.
- Reward data is metadata only. This prototype does not yet award currency, experience, items or persistent progression.

Typed event additions in `core/combatEvents.js`:

- `EncounterStarted`: encounter ID and wave count.
- `EncounterWaveStarted`: encounter ID, one-based wave index, wave ID and display name.
- `EncounterWaveCleared`: encounter ID, one-based wave index and wave ID.
- `ReinforcementsQueued`: encounter ID, reinforcement ID, unit count and triggering defeated actor ID.
- `EncounterCompleted`: encounter ID, result, round and reward metadata.

## New example encounter

`data/encounters/siegeBreakthrough.js` demonstrates two waves, stat overrides in the second wave, a reinforcement squad triggered after two enemy defeats, and a reward metadata token. Training Ground and Drone Calibration remain single-wave encounters.

## Simulator

```bash
node tools/simulate.js --battles 100 --seed 42 --encounter siegeBreakthrough
```

The simulator reports waves started/cleared, reinforcement groups/units and completed encounters in table, JSON and CSV outputs.

## Validation

`test/encounterProgression.test.js` validates encounter structures, stat overrides, reinforcement triggers, wave transitions, event emission and the completion callback. `test/simulator.test.js` checks progression metrics. The full test suite is run with:

```bash
node --test
```

## Current limitations

- Each wave requires at least five enemy entries; smaller formations are not supported yet.
- Only the `enemyDefeatedCount` reinforcement trigger exists. HP thresholds, round triggers, timers and scripted phase conditions are future extensions.
- Reinforcements join the reserve and deploy through ordinary defeated-slot replacement; immediate mid-formation insertion is not supported.
- Reward metadata and the callback are integration hooks only; there is no player inventory, XP, currency or save system yet.
- Encounter progression is in-memory battle state; saving/resuming a partially completed multi-wave encounter is not implemented.
