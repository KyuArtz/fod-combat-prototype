# Architecture Reference

## High-level flow

```text
index.js
  └─ chooses readiness scheduler (FOD_SCHEDULER)
     └─ core/battle.js (composition root)
        ├─ creates battle state (seeded RNG), event bus and terminal I/O
        ├─ builds Falcon/enemy rosters
        ├─ runs formation selection and setup
        ├─ applies opening initiative (player-first) once, before the first turn
        ├─ wires action resolver, skills, menu, enemy AI
        └─ core/turnEngine.js
             ├─ asks scheduler for next actor
             ├─ applies actor turn-start effects
             ├─ runs player / enemy / summon action
             ├─ resets actor CR
             ├─ removes expired summons
             └─ checks round and battle result
```

## Module responsibilities

| Path | Responsibility |
|---|---|
| `index.js` | CLI entry point; selects `legacy` or `threshold` scheduler |
| `core/battle.js` | Composition root; constructs state, dependencies, and battle loop |
| `core/battleState.js` | Creates battle-state object, seeded RNG state, party containers, round and scheduler fields |
| `core/rng.js` | Seeded RNG (mulberry32). State is plain data `{ seed, state }`; `nextFloat`, `rollPercent`, `createRngState` |
| `core/eventBus.js` | Synchronous event bus (`on`, `onAny`, `emit`); events are plain data `{ type, seq, ...payload }` |
| `core/turnEngine.js` | Readiness/action loop, turn-start resource/effect ticks, round bookkeeping |
| `core/actionResolver.js` | Shared physical/mastery action calculations and hit application |
| `characters/actorFactory.js` | Normalizes actor construction and initializes runtime fields |
| `characters/falcon.js` | Five Falcon playable-agent definitions and F.O.D. mastery types |
| `characters/enemies.js` | Five training enemy definitions |
| `characters/skills.js` | Falcon skill actions, costs, cooldowns, summon and ultimate effects |
| `ai/enemyAI.js` | Enemy action selection and enemy skill behavior |
| `ai/targeting.js` | Enemy target-selection rules |
| `systems/combatReadiness.js` | Legacy CR scheduler and shared CR helpers |
| `systems/thresholdCombatReadiness.js` | Continuous-time threshold scheduler |
| `systems/openingInitiative.js` | One-time opening rule: gives a side a uniform time head start so it acts first |
| `systems/formation.js` | Formation setup, active/reserve management, replacement, battle result |
| `systems/damage.js` | Physical/mastery damage formula |
| `systems/damageApplication.js` | Applies damage, shields, HP and down-state behavior |
| `systems/cooldowns.js` | Skill readiness, MP payment, cooldown ticking |
| `systems/shields.js` | Shield creation, expiry, absorption |
| `systems/statusEffects.js` | Status application, effective stats, duration ticking |
| `ui/battleMenu.js` | Player action menu, target selection, party switch |
| `ui/deploymentSelection.js` | Player roster ordering and active/reserve selection |
| `ui/statusDisplay.js` | Actor, status, cooldown, formation display |
| `ui/battleLog.js` | State-backed battle logging; `say()` emits `Log` events, terminal printer subscribes |
| `test/thresholdCombatReadiness.test.js` | Scheduler and scheduler-adjacent regression tests (18) |
| `test/rng.test.js` | Seeded RNG: reproducibility, golden values, clone safety, seed validation (8) |
| `test/eventBus.test.js` | Event bus: delivery order, unsubscribe, history, error handling (7) |
| `test/determinism.test.js` | Full scripted 5v5 battle replays identically per seed; log/event consistency (7) |
| `test/openingInitiative.test.js` | Player-first opening: roster, ties, legacy, summons, full battles, option validation (12) |
| `tools/compareSchedulers.js` | Dev tool: legacy vs threshold, with and without the opening rule |

## Dependency/injection pattern

`core/battle.js` is the composition root. It injects functions and shared state into:

- `createActionResolver`
- `createSkills`
- `createBattleMenu`
- `createEnemyAI`
- `createTurnEngine`

The readiness scheduler is injected into the turn engine. This keeps the engine from hardcoding one scheduler and allows controlled A/B tests.

## Battle state (conceptual)

```js
{
  rng: { seed, state },       // seeded RNG, plain data (clones with the state)
  actors: [],                 // deployed actors currently participating in scheduling
  round: 1,
  schedulerTicks: 0,
  scheduler: null,            // lazily created threshold scheduler data
  singularityTurns: 0,
  log: [],
  party: {
    roster: [],
    active: [],
    reserve: [],
    maxActive: 5             // 5v5 development setting (confirmed in source 2026-11-07)
  },
  enemyParty: {
    roster: [],
    active: [],
    reserve: [],
    maxActive: 5
  }
}
```

`actors` is the scheduler/action-loop collection. Party containers retain roster and formation bookkeeping. Summons are inserted into `actors` and are not ordinary roster members.

## Opening initiative

- `core/battle.js` calls `applyOpeningInitiative(state, effectiveStat, { firstSide: "ally" })` once, after both formations exist and before `turnEngine.runRounds()`, unless `openingInitiative` is `"speed"`.
- It compares each side's fastest time-to-ready (`(100 - CR) / SPD`, living non-summon units). If the enemy would be ready first or tied, all allies get `CR += SPD * delta` so the fastest ally is ready strictly (by 1e-6) before the fastest enemy.
- It only edits starting CR, so it works with either scheduler and adds no scheduler state. When it applies, battle emits `OpeningInitiative { applied, side, deltaTime, opener }` and logs one line.

## Randomness

- `state.rng` holds `{ seed, state }`. `core/battle.js` exposes `random()` (a float in [0, 1) from `state.rng`) on the shared context.
- `core/actionResolver.js` passes `random` into `systems/damage.js` (crits); `ai/enemyAI.js` uses it for enemy skill chances and the evasion check.
- Every roll consumes exactly one number, so a battle is reproducible from its seed plus the sequence of menu choices.
- The RNG state is plain data so `structuredClone(state)` previews continue the identical sequence.

## Events

- `core/battle.js` creates (or accepts) an event bus and returns it as `events`.
- `ui/battleLog.js` subscribes the terminal printer to `Log` events. `say(message)` appends to `state.log` and emits `Log { message, round }`.
- Only `Log` events exist today. Planned typed events: `TurnStarted`, `SkillUsed`, `DamageDealt`, `Healed`, `ShieldGained`, `StatusApplied`/`StatusExpired`, `ActorDied`, `ActorSummoned`, `PartySwitched`, `RoundEnded`, `BattleEnded`.
- Keep payloads structured-clone friendly (ids, numbers, strings; no functions or actor objects).

## Actor lifecycle

1. `makeActor` constructs an actor with runtime state (HP/MP, CR, cooldowns, statuses, shields, alive state).
2. Formation setup stores roster, slices active/reserve, and adds active actors to `state.actors`.
3. A downed active non-summon may be replaced by the first living reserve.
4. A manual player switch swaps an active and reserve actor and resets both CR values.
5. Summons are temporary scheduler actors; expired/dead summons are removed by `removeInactiveSummons`.

## Scheduler lifecycle

- Scheduler API: `nextActor(state, effectiveStat)`, `advanceCR(state, effectiveStat)`, `resetCR(actor)`, `adjustCR(actor, amount)`.
- CR threshold: `100`.
- The threshold scheduler stores `{ time, tieCursor, readyQueue }` in `state.scheduler`.
- State cloning for preview must use `structuredClone(state)`; JSON serialization breaks actor object references inside the ready queue.
- Scheduler instances are isolated; their state belongs to each battle state, not a shared module-level queue.
