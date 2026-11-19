# Architecture & Design Decisions

## ADR-001 — Keep both readiness schedulers during experimentation

**Status:** Accepted  
**Decision:** Keep legacy and threshold schedulers selectable. Threshold is the preferred scheduler; legacy exists for A/B comparison and regression reference.  
**Reason:** The new implementation corrects SPD/time-order behavior while retaining a baseline for measuring impact.  
**Selection:** `FOD_SCHEDULER=threshold` (default) or `FOD_SCHEDULER=legacy`.

## ADR-002 — Threshold scheduler uses continuous readiness

**Status:** Accepted  
**Decision:** Actors accumulate readiness continuously according to effective SPD and become ready at CR 100.  
**Reason:** Fixed-step advancement caused incorrect selection order and skewed turn shares.  
**Trade-off:** Fast actors can legitimately act consecutively; this is not automatically a bug.

## ADR-003 — Scheduler state belongs to battle state

**Status:** Accepted  
**Decision:** Threshold scheduler bookkeeping (`time`, `tieCursor`, `readyQueue`) is stored in `state.scheduler`.  
**Reason:** State copies can support future GUI turn-order previews, replay, and save snapshots.  
**Constraint:** Use `structuredClone`; JSON round-tripping breaks ready-queue actor references.

## ADR-004 — Stable, rotating tie handling

**Status:** Accepted  
**Decision:** Simultaneous crossings use stable actor keys and a rotating tie cursor.  
**Reason:** Tie order should not be dictated by actor array/formation order or always favor one side.  
**Behavior:** One cursor is shared across tie groups within a battle state. Rotation is deterministic, but a tie's offset depends on previous tie groups; this is intentional and should remain documented.

## ADR-005 — Inject scheduler into battle engine

**Status:** Accepted  
**Decision:** `core/battle.js` chooses and injects the scheduler into `core/turnEngine.js`.  
**Reason:** Keeps the turn engine scheduler-agnostic and supports A/B testing.

## ADR-006 — Formation data separates roster, active, and reserve

**Status:** Accepted  
**Decision:** Party containers keep `roster`, `active`, `reserve`, and `maxActive`. `state.actors` contains deployed scheduler actors.  
**Reason:** Supports full-party selection now and reserve/stage management later.  
**Current test setup:** Five active Falcon agents vs five active enemies; reserves are empty at this roster/active-cap configuration.  
**Source note:** Resolved 2026-11-07: `maxActive` is 5 for both parties in source.

## ADR-007 — Overshoot carry-over deferred

**Status:** Deferred  
**Decision:** Do not add overshoot carry-over yet.  
**Reason:** It matters primarily once CR-boost/CR-pull skills are introduced; current behavior should remain simpler until those mechanics are tested.

## ADR-008 — Battle randomness is seeded and stored as plain data on state

**Status:** Accepted (2026-11-07)  
**Decision:** All engine randomness draws from `state.rng` (`{ seed, state }`, mulberry32) through the battle context's `random()`. Engine code must not call `Math.random()` directly. The seed is printed at battle start and can be set with `createBattle({ seed })` or `FOD_SEED`.  
**Reason:** Reproducible bugs, replays, simulations, and cloned-state previews. Plain-data state means `structuredClone(state)` carries the RNG forward with the rest of the battle.  
**Trade-off:** Replay requires the same seed *and* the same menu choices; choices are not recorded yet. Changing the RNG algorithm changes what every saved seed replays, so `test/rng.test.js` locks golden values.

## ADR-009 — Engine output flows through an event bus

**Status:** Accepted (incremental migration, 2026-11-07)  
**Decision:** `say()` emits `Log` events on a synchronous bus; the terminal printer is one subscriber. Typed events will be added alongside text logs rather than replacing them in one step.  
**Reason:** A GUI, headless simulator, or test must be able to observe battles without parsing console text.  
**Constraints:** Event payloads are plain, structured-clone-friendly data. Handler errors propagate to the emitter so a broken view fails loudly instead of desyncing from the engine.

## ADR-010 — Player-first opening initiative (PvE)

**Status:** Accepted (2026-11-07)  
**Decision:** At battle start the player's side acts first. If the enemy's fastest unit would be ready first or tied, every living ally gets a uniform time head start (`CR += SPD * delta`) just large enough that the fastest ally is ready strictly first. Selectable with `openingInitiative: "player-first" | "speed"` / `FOD_OPENING`; default `player-first`.  
**Reason:** Accurate SPD ordering exposed that the fastest unit in 5v5 is an enemy (Recon Drone 115 vs Zenki 110), so the enemy opened the battle. The legacy scheduler only avoided this by accident (clamped CR ties resolved by array order). In PvE the player should start.  
**Alternatives rejected:** a free extra opening turn for one ally (adds a turn to the player's share); per-ally flat CR bonuses (do not guarantee the fastest-vs-fastest outcome); forcing the first pick in the scheduler (violates time order and needs per-scheduler changes).  
**Trade-off:** Allies gain a small phase advantage (about 0.04 time units on the real roster), so a few early close calls can flip in the player's favor; long-run turn share is unchanged. `applyOpeningInitiative` supports `firstSide: "enemy"` for future ambush stages; PvP policy is undecided.

## ADR-011 — Turns are controller-driven: views in, decisions out

**Status:** Accepted (2026-11-07)  
**Decision:** Each turn builds a plain-data view of the legal actions, asks a controller for a decision, validates it, then executes it in the engine. The terminal menu, the enemy AI, summons, scripted replays and random/headless players are all controllers. Skills are declarative (`targeting`, `modes`, `run`) and never prompt.  
**Reason:** A GUI, a headless simulator and replays need to drive the battle without parsing console text or reading stdin, and enemy AI variants should be swappable. Validation means a buggy controller can never run an illegal action.  
**Alternatives rejected:** leaving prompts inside skills with a pluggable `ask` (a GUI would still be coupled to terminal-shaped prompts); a big-bang rewrite into data-driven skills (that is step 3, now safe to do against the golden transcripts).  
**Trade-offs:** The terminal controller still records two menu-only messages in `state.log` (kept so the original output is preserved exactly). Player and enemy `basic` attacks use different code. Summon behaviour is one `summonAuto` decision until skills become data.

## ADR-012 — Golden transcripts guard refactors of the turn flow

**Status:** Accepted (2026-11-07)  
**Decision:** Five full terminal battles (seeded RNG plus seeded random-digit input, including invalid choices, party switching, every skill type and the enemy AI) are stored as gzipped transcripts of every prompt, answer and output line. `test/goldenTranscripts.test.js` requires byte-identical reproduction. `node tools/updateGolden.js` regenerates them after an intentional change.  
**Reason:** A turn-flow refactor can silently change prompt order, messages or the order of random rolls. The transcripts were recorded from the pre-controller build; the controller refactor matched them on the first run. A deliberate swap in the order of two random rolls fails all five.  
**Trade-offs:** About 100 KB of fixtures. Any intentional output or balance change needs a regeneration and a review of the behavior diff.

## ADR-013 — Skills are data run by an interpreter, migrated one agent at a time

**Status:** Accepted (2026-11-09); Elishia migrated  
**Decision:** A skill is plain data (cost, cooldown, tags, targeting, ordered effects, result message). `core/skillInterpreter.js` runs it and validates the data when loaded. Passives are data (`statMods`, `onSkillUsed` hooks). Summons are templates with data-defined behavior. The other agents stay imperative until their turn.  
**Reason:** Finalizing and balancing a skill becomes one edit in one place, MP/cooldown/text can be generated or synced to the roster JSON later, and the same effect handlers serve every character.  
**Method:** Convert with identical behavior first (golden recordings must not change), then change behavior deliberately in a separate step with new tests and regenerated recordings.  
**Trade-offs:** Message text duplicates some numbers (for example "SPD -10% (2 turns)") and is not generated from the effect data yet. Effects not needed by Elishia (for example damage over time) will be added when another agent needs them.

## ADR-014 — Elishia's roster-text gaps are filled with explicit prototype values

**Status:** Accepted for balancing review (2026-11-09)  
**Decision:** The roster text is the design intent; MP costs and cooldowns stay at the prototype's values. Where the text leaves a number open the prototype picks one and marks it in the data: stabilize returns an ally at 15% Max HP (once per deployment, automatic), the EMP is Electromagnetic at 100% of Meo-9's MPow to all enemies with SPD −15% for 1 turn, adaptive resistance lasts for the barrier's remaining turns even if the shield is used up, scan boosts all of Elishia's damage and does not stack, and all four skills carry the Nanotech tag.  
**Open issue:** Enemies cannot target summons, so Meo-9's EMP is dormant in normal play. Enabling it requires an enemy-targeting decision.



## ADR-015 — Owner-provided Falcon skills supersede prototype skill values (2026-11-16)

**Decision:** The combat engine implementation and automated tests are canonical for actual combat behavior. `ref/characterTerraData.json` is a separate website-facing guide/idea reference, not an engine dependency or source of truth. When engine mechanics change, update the JSON skills and descriptions afterward so the site reference stays aligned. The earlier prototype values recorded in ADR-014 are historical and are no longer authoritative where they conflict with this source.

**Implementation rule:** implement mechanics only when the source provides enough values and triggers. Do not guess Meo-v9 Final Protocol EMP scaling, Nanotech Singularity DoT scaling, or Catalyst Wing HP/destruction trigger. Zackry's +10 Accuracy currently applies to the basic-attack accuracy check; a general skill-hit accuracy model remains future work.

**Scope:** this ADR aligns skills/passives only. Falcon base stats in `characters/falcon.js` remain prototype values pending a separate owner-approved stat synchronization.


## ADR-016 — Finalize underspecified Falcon mechanics with explicit balance values (2026-11-17)

**Status:** Accepted for prototype balancing by the project owner.

**Decision:** The owner approved changing/adding values where the initial skill design omitted a numeric rule. Use the explicit tuning values in `docs/FALCON_MECHANICS_FINALIZATION.md`: Meo-v9 EMP 1.0x/0.5x Mpow; Singularity DoT 0.2x Mpow; Catalyst Wing 25% Evalete Max HP and 50% base DEF/RES; Zackry +10 next-attack Accuracy for basic and skill hits; Jazen Stagger 20 CR readiness pushback. These are implementation choices, not retroactive claims about what the original JSON specified.

**Architecture:** Keep effects declarative and route them through the existing shared interpreter, damage, status, targeting, summon and readiness systems. Keep base Falcon stats unchanged until a separate stat-sheet synchronization decision.
