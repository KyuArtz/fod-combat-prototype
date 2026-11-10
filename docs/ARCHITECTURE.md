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
        ├─ wires action resolver, skills, enemy AI, terminal menu, controllers
        └─ core/turnEngine.js
             ├─ asks scheduler for next actor
             ├─ applies actor turn-start effects
             ├─ core/turnRunner.js: view -> controller decision -> validate -> execute
             │    (controller = terminal menu | enemy AI | summon auto | scripted | random | GUI)
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
| `core/turnEngine.js` | Readiness/action loop, turn-start resource/effect ticks, round bookkeeping; delegates each turn to the turn runner |
| `core/turnView.js` | Builds the plain-data turn view (units, legal actions, targets, usability); view ids; controller kind per actor |
| `core/decisions.js` | `validateDecision(view, decision)`: legality check for every decision type |
| `core/turnRunner.js` | Runs a turn: view, controller, validation, execution, retry/reject; executes basic, skill, enemy skill, switch, summon, pass |
| `core/controllers.js` | Headless controllers: scripted (replay), basic-attack, random (own seeded RNG); decision recorder |
| `core/actionResolver.js` | Shared physical/mastery action calculations and hit application |
| `characters/actorFactory.js` | Normalizes actor construction and initializes runtime fields |
| `characters/falcon.js` | Five Falcon playable-agent definitions and F.O.D. mastery types |
| `characters/enemies.js` | Five training enemy definitions |
| `characters/skills.js` | Falcon skills, declarative: each declares `targeting` (and `modes`) plus a `run(actor, { target, mode })` that executes an already-validated choice; costs, cooldowns, summon and ultimate effects |
| `ai/enemyAI.js` | Enemy AI: `decide(actor)` chooses (and rolls skill chances), `useSkill` / `basicAttack` execute; `controller` is the built-in enemy controller |
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
| `ui/battleMenu.js` | Terminal player controller: prints the menu, prompts with readline, returns decisions; never changes the battle itself |
| `ui/deploymentSelection.js` | Player roster ordering and active/reserve selection |
| `ui/statusDisplay.js` | Actor, status, cooldown, formation display |
| `ui/battleLog.js` | State-backed battle logging; `say()` emits `Log` events, terminal printer subscribes |
| `test/thresholdCombatReadiness.test.js` | Scheduler and scheduler-adjacent regression tests (18) |
| `test/rng.test.js` | Seeded RNG: reproducibility, golden values, clone safety, seed validation (8) |
| `test/eventBus.test.js` | Event bus: delivery order, unsubscribe, history, error handling (7) |
| `test/determinism.test.js` | Full scripted 5v5 battle replays identically per seed; log/event consistency (7) |
| `test/openingInitiative.test.js` | Player-first opening: roster, ties, legacy, summons, full battles, option validation (12) |
| `test/goldenTranscripts.test.js` | 5 full terminal battles (valid and invalid input, switching, all skill types) reproduced byte for byte (5) |
| `test/turnViewAndDecisions.test.js` | Decision validation, view ids, declarative skill registry, terminal controller prompts (14) |
| `test/controllers.test.js` | Headless play, fuzz, replay, rejection/retry, interchangeable enemy controller, option validation (13) |
| `tools/compareSchedulers.js` | Dev tool: legacy vs threshold, with and without the opening rule |
| `tools/updateGolden.js` | Regenerates `test/fixtures/golden/*.txt.gz` (only after an intentional output change) |
| `tools/lib/headless.js` | `playHeadless(...)`: full battle with controllers and no terminal; used by tests and tools |
| `tools/lib/transcript.js` | Records a full terminal battle (prompts, answers, output) from seeded "chaos" answers; golden scenarios |

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
- Events today: `Log { message, round }`, `OpeningInitiative { applied, side, deltaTime, opener }`, `FormationSelected { ids }`, `ActionChosen { actorId, kind, round, decision }`, `DecisionRejected { actorId, kind, reason, decision }`.
- Planned typed events: `TurnStarted`, `SkillUsed`, `DamageDealt`, `Healed`, `ShieldGained`, `StatusApplied`/`StatusExpired`, `ActorDied`, `ActorSummoned`, `PartySwitched`, `RoundEnded`, `BattleEnded`.
- Keep payloads structured-clone friendly (ids, numbers, strings; no functions or actor objects).

## Turns, controllers and decisions

Who decides is separate from what happens. For every turn `core/turnRunner.js` does:

1. Pick the controller by actor kind (`controllerKindOf`): non-summon allies are **player**, enemy-side units are **enemy**, summons are **summon**.
2. Build a **view** (`core/turnView.js`): plain data with the acting unit, living allies and enemies, and the legal actions (`basic`, `skill` with `usable`, cost, cooldown, `targeting`, `targets`, optional `modes`; `switch` with reserves and active slots; for enemies `enemySkill` and `pass`; for summons `summonAuto`). Target sides are absolute ("ally" = Falcon side, "enemy" = enemy side). Ids are actor ids, with `#n` appended only when several living units share one id.
3. Call `controller.chooseAction(view, { actor, rejection })` (sync or async). UI controllers should use `view` only; built-in AI also gets the engine-owned `actor`.
4. **Validate** the decision (`core/decisions.js`). An illegal decision emits `DecisionRejected` with a reason and the controller is asked again; after 10 failed attempts the battle stops with an error naming the controller and the last problem.
5. Emit `ActionChosen`, then **execute**. An execution that reports failure is also rejected and retried.

Decision shapes: `{ type: "basic", targetId }`, `{ type: "skill", skillKey, targetId?, mode? }`, `{ type: "enemySkill", skillKey, targetId? }`, `{ type: "switch", reserveId, activeId }`, `{ type: "summonAuto" }`, `{ type: "pass" }`.

Plugging in a controller: `createBattle({ controllers: { player, enemy, summon } })`; each is a function or an object with `chooseAction`. Defaults are the terminal menu, the enemy AI (`enemyAI.controller`) and automatic summon behaviour. `partyOrder: [ids]` (a permutation of the Falcon roster) skips the formation prompts; `createBattle` never opens stdin unless a prompt is actually needed.

Recording and replay: `createDecisionRecorder(battle.events)` collects `FormationSelected` and each accepted player decision; replaying with `seed`, `partyOrder` and `createScriptedController(decisions)` reproduces the battle exactly (same final unit states, same random-number state). The scripted controller names the decision where a replay drifts.

Known limits: the player and enemy `basic` attacks still resolve through different code (`actionResolver.basicAttack` vs `enemyAI.basicAttack`); summon behaviour is a single automatic decision (`summonAuto`); the terminal controller records two menu-only messages ("No valid target selected.", "Invalid formation slot.") in `state.log`, as the original menu did, so replays exclude them.

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
