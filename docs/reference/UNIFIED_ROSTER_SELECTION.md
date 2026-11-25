# Unified Character Selection

## Purpose

The interactive prototype can build a player formation from the combined playable roster instead of requiring one faction to be selected as a complete team. Roster construction is centralized so future factions can be registered without changing the selector's selection logic.

## Current playable roster

`characters/roster.js` is the player-selectable faction registry. It currently registers:

- Falcon Company — five operatives.
- Phantom Rebellion — five operatives, including the neutral-display `Unknown` operative.
- Serpent Syndicate — five operatives, including the now-canon Tekushiki.

`createPlayableRoster({ side })` asks each registered faction factory for actors on the requested side, merges the results, and rejects duplicate actor IDs. Each actor retains its original `faction`, `role`, `mastery`, `skillSet`, stats, passive data, and runtime identity.

The `elishia_p` operative remains player-facing as **Unknown**. The selector does not display or index internal actor IDs in its public roster listing or search. Character preview uses the display name and neutral skill/passive descriptions.

## Interactive flow

The default CLI entry point enables `selectPartyCharacters` and uses three active slots. The selector allows the player to choose between three and five unique operatives from the combined roster.

1. Browse the combined roster.
2. Narrow the roster with a faction, mastery, or role filter; search by public-facing name/profile fields.
3. Inspect an operative's faction, primary/secondary roles, mastery, combat stats, passive description, skill names/descriptions/MP costs/cooldowns, and any selectable skill-mode descriptions.
4. Select three to five unique operatives. Selection order is preserved until formation ordering.
5. Choose the three active slots in order.
6. Arrange any remaining selected operatives as the reserve queue.
7. Confirm the active formation, reserve queue, and faction mix before battle setup.

Available roster commands:

| Command | Purpose |
|---|---|
| `1` … `N` | Select or deselect the numbered operative in the current filtered list |
| `info N` | Show the selected candidate's character preview |
| `filter faction phantom` | Filter by faction ID or label |
| `filter mastery anomaly` | Filter by mastery |
| `filter role stalker` | Filter by primary or secondary combat role |
| `search <text>` | Search public-facing name, faction label, role, or mastery |
| `all` | Clear the current filter/search |
| `selected` | Show the selected roster |
| `done` | Finish selection when at least the active slot count is selected |
| `help` | Show command guidance |

The maximum selected party size is five. The minimum is the configured active slot count. With the default CLI configuration, the player chooses three to five operatives; the first three are assigned to active slots only after the separate active-order step, and any remaining choices become reserves.

## Battle integration

`core/battle.js` exposes the opt-in `selectPartyCharacters` option. When enabled, it creates the unified roster on the player side and delegates selection/order to `createDeploymentSelector().selectMixedFormation()`. Only selected operatives are included in the player's party roster and battle-start passive initialization. Headless tools and tests can continue to supply an explicit `partyFactory` and `partyOrder`; the legacy `selectPartyFaction` option remains available for older terminal flows and tests.

`index.js` enables the unified selector for normal interactive play. The current opponent remains the configured PvE encounter. Faction-versus-faction battles continue to use the dedicated headless faction-duel tools.

## Extending the registry

To add another playable faction:

1. Implement its actor factory and complete skill data through the shared skill registry.
2. Add one `{ id, label, factory }` entry to `PLAYABLE_FACTIONS` in `characters/roster.js`.
3. Ensure actors expose a unique internal ID plus public `name`, `faction`, `role`, `mastery`, `skillSet`, and combat stats.
4. Add roster, preview, selector, and real-battle integration tests.
5. Update this reference and the project's current status.

The selector does not contain faction-specific branches. Faction targeting rules remain in the skill definitions and shared battle runtime.

## Current limitations

- This is a terminal selector, not a graphical roster screen.
- The current registry contains Falcon Company, Phantom Rebellion, and Serpent Syndicate (15 operatives total).
- The player may choose three to five characters; persistent saved formations/loadout slots are not implemented.
- Character previews use explicit passive descriptions and declarative skill copy from the live skill data. Keep those descriptions neutral for any hidden or unrevealed character.
