# Step 4 — Typed combat events

**Status:** implemented 2026-11-16  
**Purpose:** expose structured combat facts alongside the existing readable `Log` stream, without making the UI parse prose or allowing event consumers to mutate battle state.

## Contract

`core/combatEvents.js` is the event vocabulary and validation boundary. Use `emitCombatEvent(events, type, payload)` for known engine events. It verifies required fields and checks that payloads can be `structuredClone`d before dispatch. The bus receives an isolated clone, so a subscriber cannot mutate a live controller decision through a nested event payload. The shared event bus assigns one monotonically increasing `seq` across every event type.

Payloads use stable actor IDs, strings, booleans, numbers, arrays and plain decision objects. They never contain live actor references, functions, Maps, or engine state objects. Event objects and nested payloads are deeply frozen during dispatch. Event handlers remain synchronous; a throwing handler propagates to the emitter, matching the existing event-bus contract.

## Event catalogue

| Event | Required fields | Meaning |
|---|---|---|
| `Log` | `message`, `round` | Human-readable combat line; retained for terminal output and existing consumers |
| `FormationSelected` | `ids` | Player formation chosen at battle setup |
| `OpeningInitiative` | `applied`, `side`, `deltaTime`, `opener` | Opening initiative calculation (emitted when the battle applies it) |
| `BattleStarted` | `seed` | Battle setup is complete and battle execution is beginning |
| `RoundStarted` / `RoundEnded` | `round` | Round lifecycle boundaries |
| `TurnStarted` | `actorId`, `side`, `round`, `staggered` | Actor turn begins; `staggered` indicates whether the action is skipped |
| `ActionChosen` | `actorId`, `kind`, `round`, `decision` | Controller's validated decision |
| `DecisionRejected` | `actorId`, `kind`, `reason`, `decision` | Controller decision failed validation or execution |
| `SkillUsed` | `actorId`, `skillKey`, `round`, `mpBefore`, `mpAfter` | Skill successfully executed |
| `BasicAttackUsed` | `actorId`, `targetId`, `round` | Basic attack successfully resolved |
| `DamageApplied` | `targetId`, `requestedAmount`, `hpLoss`, `absorbedAmount`, `damageType` | Damage application after shield absorption; `hpLoss` is actual HP removed |
| `Healed` | `targetId`, `requestedAmount`, `healed` | Healing request and actual HP restored |
| `ShieldGained` | `targetId`, `amount`, `turns` | A shield is added or refreshed as a new shield instance |
| `ShieldExpired` | `actorId`, `count` | One or more shields expired at an actor-turn boundary |
| `StatusApplied` | `targetId`, `statusId`, `turns` | Status applied or refreshed; `turns` is `null` for effects without a finite duration |
| `StatusExpired` | `actorId`, `statusIds` | Statuses removed by duration ticking at the actor-turn boundary |
| `ActorDied` | `actorId`, `side`, `round` | Actor is incapacitated (not necessarily permanently dead in game fiction) |
| `ActorSummoned` | `actorId`, `ownerId`, `side`, `round` | Summon enters the battle, including battle-start summons |
| `ActorSummonExpired` | `actorId`, `ownerId`, `round` | Summon's deployment duration ends |
| `PartySwitched` | `incomingId`, `outgoingId`, `round` | Player manually switches an active member with a reserve |
| `ReserveDeployed` | `incomingId`, `defeatedId`, `side`, `slot`, `round` | Living reserve automatically replaces an incapacitated active member; `slot` is zero-based |
| `TurnEnded` | `actorId`, `side`, `round` | Actor turn processing is complete |
| `BattleEnded` | `result`, `round` | Battle loop returns a terminal result |

`ActionChosen` and `DecisionRejected` are part of the event contract too; their nested `decision` is plain serializable data. Existing consumers can continue subscribing to `Log` only.

## Ordering notes

- The bus's `seq` is global across all event types; consumers should sort/consume in delivered order, not group by event type.
- `TurnStarted` is emitted before passive turn-start hooks and turn resource recovery.
- `SkillUsed` and `BasicAttackUsed` are emitted only after the action successfully resolves.
- `DamageApplied` is emitted after shield absorption and HP mutation. `absorbedAmount` and `hpLoss` are actual values, not requested values.
- `StatusExpired` and `ShieldExpired` describe duration expiration at the affected actor's turn boundary. A status removed by cleanse or a shield depleted by damage is not mislabeled as a duration expiry.
- `BattleEnded` is emitted after the battle loop has produced its final result.

## Validation and regression

- `test/eventBus.test.js` covers required-field validation, unknown event rejection and structured-clone safety.
- `test/fullBattleRegression.test.js` verifies lifecycle, action, damage, status, shield, healing and skill events in complete battles.
- `test/determinism.test.js` continues to verify that adding event consumers does not alter seeded battle output or RNG progression.
- Event observers are read-only. Do not implement game mechanics by mutating state from an event subscriber; use engine hooks and resolvers instead.

## Current limits

- Some events identify only the affected actor/target, not the causal source. For example, passive damage-over-time and retaliation use the same `DamageApplied` contract without a `sourceActorId`.
- `ShieldGained` reports shield creation/refresh; shield depletion by incoming damage does not yet have a separate `ShieldBroken` event.
- Status removals caused by cleanse are not currently emitted as `StatusExpired`; a future `StatusRemoved` reasoned event can cover non-duration removal.
- The event stream is not yet persisted as a battle-save format. `createEventBus({ record: true })` retains in-memory history for tests and tooling.
