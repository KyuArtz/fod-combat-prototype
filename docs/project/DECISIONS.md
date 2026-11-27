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
**Trade-offs / current status:** The terminal controller retains two menu-only messages in `state.log` for output compatibility. Player and enemy basic attacks were later unified in `core/actionResolver.js` (Step 2). Summons still use one automatic `summonAuto` decision. Skills and enemy behavior have since migrated to shared data-driven registries (Steps 3 and 6–7).

## ADR-012 — Golden transcripts guard refactors of the turn flow

**Status:** Accepted (2026-11-07)  
**Decision:** Five full terminal battles (seeded RNG plus seeded random-digit input, including invalid choices, party switching, every skill type and the enemy AI) are stored as gzipped transcripts of every prompt, answer and output line. `test/goldenTranscripts.test.js` requires byte-identical reproduction. `node tools/updateGolden.js` regenerates them after an intentional change.  
**Reason:** A turn-flow refactor can silently change prompt order, messages or the order of random rolls. The transcripts were recorded from the pre-controller build; the controller refactor matched them on the first run. A deliberate swap in the order of two random rolls fails all five.  
**Trade-offs:** About 100 KB of fixtures. Any intentional output or balance change needs a regeneration and a review of the behavior diff.

## ADR-013 — Skills are data run by an interpreter, migrated one agent at a time

**Status:** Accepted; implementation scope completed and expanded in Steps 3 and 6  
**Decision:** A skill is plain data (cost, cooldown, tags, targeting, ordered effects, result message). `core/skillInterpreter.js` runs it and validates the data when loaded. Passives are data (`statMods`, `onSkillUsed` hooks). Summons are templates with data-defined behavior. All five Falcon skill sets and the currently implemented Training Drone/Rogue Automaton enemy skills now use this shared runtime.  
**Reason:** Finalizing and balancing a skill becomes one edit in one place, MP/cooldown/text can be generated or synced to the roster JSON later, and the same effect handlers serve every character.  
**Method:** Convert with identical behavior first (golden recordings must not change), then change behavior deliberately in a separate step with new tests and regenerated recordings.  
**Trade-offs:** Message text still duplicates some numeric values and is not generated from effect data. The interpreter has since been expanded for the Falcon roster and the initial enemy skill sets.

## ADR-014 — Elishia's roster-text gaps are filled with explicit prototype values

**Status:** Superseded by ADR-015 and ADR-016  
**Decision:** The roster text is the design intent; MP costs and cooldowns stay at the prototype's values. Where the text leaves a number open the prototype picks one and marks it in the data: stabilize returns an ally at 15% Max HP (once per deployment, automatic), the EMP is Electromagnetic at 100% of Meo-9's MPow to all enemies with SPD −15% for 1 turn, adaptive resistance lasts for the barrier's remaining turns even if the shield is used up, scan boosts all of Elishia's damage and does not stack, and all four skills carry the Nanotech tag.  
**Open issue:** Enemies cannot target summons, so Meo-9's EMP is dormant in normal play. Enabling it requires an enemy-targeting decision.



## ADR-015 — Owner-provided Falcon skills supersede prototype skill values (2026-11-16)

**Status:** Accepted; implementation constraints on omitted values were later updated by ADR-016.

**Decision:** The combat engine implementation and automated tests are canonical for actual combat behavior. `characterTerraData.json` is a separate website-facing guide/idea reference, not an engine dependency or source of truth. When engine mechanics change, update the relevant implementation/reference notes and provide the owner with the corresponding content to apply to the separate website-facing data. The earlier prototype values recorded in ADR-014 are historical and are no longer authoritative where they conflict with this source.

**Historical implementation rule:** at the time of this decision, source-omitted values were deferred and Zackry Accuracy was limited to basic attacks. ADR-016 later records the owner-approved additions and current skill-hit Accuracy behavior.

**Scope:** this ADR aligns skills/passives only. Falcon base stats in `characters/falcon.js` remain prototype values pending a separate owner-approved stat synchronization.


## ADR-016 — Finalize underspecified Falcon mechanics with explicit balance values (2026-11-17)

**Status:** Historical; the current approved Falcon kit and combat rules in ADR-017 supersede the listed behavior where they differ.

**Decision:** The owner approved changing/adding values where the initial skill design omitted a numeric rule. Use the explicit tuning values in `../history/milestones/STEP9_SUPERSEDED_FALCON_MECHANICS.md`: Meo-v9 EMP 1.0x/0.5x Mpow; Singularity DoT 0.2x Mpow; Catalyst Wing 25% Evalete Max HP and 50% base DEF/RES; Zackry +10 next-attack Accuracy for basic and skill hits; Jazen Stagger 20 CR readiness pushback. These are implementation choices, not retroactive claims about what the original JSON specified.

**Architecture:** Keep effects declarative and route them through the existing shared interpreter, damage, status, targeting, summon and readiness systems. Keep base Falcon stats unchanged until a separate stat-sheet synchronization decision.


## ADR-017 — Falcon approved kit v1 and global effect rules (2026-11-21)

**Status:** Accepted by the project owner; implemented in the active prototype runtime.

**Falcon kit decisions:** Meo-9 is limited to cover fire and Emergency Field; its scan bonus, EMP destruction behavior, and Final Protocol are removed. Catalyst Wing grants no destruction fallback shield. Zackry's Overwatch Protocol only reduces Tactical Marked enemies' Evasion; Command Uplink and Full Spectrum Assault grant Mpow +15% and +20%, respectively. Jazen's Recoil Dampeners grants Mpow +10% per stack (maximum two) and no Stagger/action-delay immunity; his other skills no longer add Stagger or Taunt. Zenki's mastery is Energy; Unobserved only grants Evasion; Railshot has no conditional damage bonus; Cipher Tag only reduces RES; Ghost Protocol grants Untargetable plus a one-use +30% next damaging skill bonus; Zero Hour is a three-hit attack with a below-40%-HP final-shot override. Evalete's Catalyst Overdrive grants 25% direct-damage reflection for 3 turns.

**Global Combat Stacking v1:** Applies to all combat units. Different stats stack. Same-stat same-direction modifiers use strongest-value priority, with weaker active effects resuming when stronger effects expire. Opposing percentage modifiers offset. Same-effect reapplication refreshes duration without strengthening unless explicitly stackable. Different status types coexist; shields retain separate capacity/duration and absorb oldest-first.

**Global Effect Timing v1:** MP regeneration and cooldown decrement happen at actor turn start, followed by DOT, HOT/turn-start healing, passive checks, and the actor action. Statuses/shields tick after the affected actor completes their turn; new effects do not lose duration immediately. Owner-clocked fields/summons advance on owner turns. Meo-9 and Catalyst Wing are owner/passive summons, not independent scheduled actors. Direct-damage reflection uses post-mitigation damage before shields and cannot recursively trigger.

**Architecture:** Keep all character-specific skills declarative in `characters/skillData/`, interpreted through the shared `core/skillInterpreter.js` and reusable `systems/effects/`, `systems/passives/`, `systems/summons/`, damage, status, turn, and targeting systems. Base Falcon stats remain prototype values and are not synchronized to the owner website JSON by this ADR.


## ADR-018 — Agnostic effect and actor-capability architecture (B1 design)

**Status:** Proposed design; owner-approved for design exploration, not yet approved for runtime implementation.

**Decision direction:** Keep damage channels, status/effect tags, control effects, actor capabilities, faction affinities, and resistance resolution as distinct concepts. Actor capabilities should be non-exclusive data tags so organic/mechanical/synthetic/hybrid/construct actors can express mixed traits. Generic Resistance is described without a damage-family name; its payload may be universal or explicitly filtered. Damage resistance does not implicitly resist control-effect chance or duration. Unknown capability metadata uses neutral compatibility behavior.

**Constraints:** Existing Physical/mastery damage channels, typed mastery resistance, status stacking, and deterministic RNG behavior remain unchanged until implementation is separately approved. Faction baselines and values (including any Serpent Toxic resistance), weakness values, actor classification, control susceptibility, and Verra’s kit rework remain deferred. See [B1 design](../reference/AGNOSTIC_EFFECT_ACTOR_CAPABILITY_DESIGN.md) for the full proposal.


## ADR-019 — Actor capability metadata contract (B2)

**Status:** Accepted and implemented; inert metadata only.

**Decision:** Actors expose a `capabilities` array, defaulting to `[]`. Tags are checked against a central whitelist, malformed metadata and unknown tags throw, and duplicates are removed while preserving author order. The four clearly mechanical enemy archetypes declare `mechanical` and `electronic-systems`; ambiguous enemy definitions and playable actors remain undeclared/neutral.

**Constraints:** Capability metadata remains inert. B3 adds generic damage resistance but does not consume actor capabilities; weakness, control, effect susceptibility, AI, and RNG behavior remain outside B2. See [B2 metadata contract](../reference/ACTOR_CAPABILITY_METADATA.md).


## ADR-020 — Generic damage resistance contract (B3)

**Status:** Accepted and implemented.

**Decision:** A status with numeric `resistancePercent` and no filters is universal damage resistance. Optional `damageTypes` filters exact damage channels; legacy `resistanceType` remains as a single-channel compatibility filter. When both filters are present, both must match. Applicable resistance sources use strongest-value stacking, clamped to 0–100%; Adaptive Barrier remains a separate channel-specific source and joins the same strongest-value selection. The shared resolver is used for Physical, mastery, and reflected damage.

**Constraints:** The damage floor remains 1, so 100% resistance is not immunity. No effect/control resistance, capability-based susceptibility, weakness, faction resistance baseline, skill tuning, or actor classification changes were introduced. See [B3 contract](../reference/GENERIC_RESISTANCE_RESOLUTION_B3.md).


## ADR-021 — Opt-in susceptibility integration and representative migration (B5)

**Status:** Accepted and implemented for selected effects.

**Decision:** Live declarative effect handlers may opt into the B4 susceptibility resolver through a `susceptibility` metadata block. Untagged legacy effects bypass the resolver and preserve their existing application path. The initial migrations are shared Serpent Poison (`biological-toxin`) and Lucaz's two Stagger payloads (`control:stagger`). Tags are not actor capability requirements; no unknown roster profiles are classified, and neutral actors remain neutral. The injected battle RNG is used only when the resolver needs a probabilistic roll.

**Constraints:** Migration is limited to `status`, `statusEnemies`, and `damageOverTime`. Other status routes remain legacy. Damage components are independent of rejected status applications. No skill tuning, capability assignment, new effects, AI changes, or golden transcript edits. See [B5 reference](../reference/SUSCEPTIBILITY_INTEGRATION_B5.md).

## ADR-022 — Inert faction affinity schema and actor overrides (B6.2)

**Decision:** Define validated affinity profile fields for damage resistance, effect resistance, control resistance, and control-duration reduction. Faction defaults are keyed to Falcon, Phantom, and Serpent and currently empty. Actor `affinityOverrides` is a validated partial profile, defaulting to `{}`.

**Future proposal:** actor override categories replace matching faction categories/entries; unspecified fields inherit. This merge behavior is not implemented.

**Constraints:** B6.2 is schema-only. No combat code reads faction profiles or actor affinity overrides; no values, classifications, weaknesses, skill changes, AI, RNG, or golden transcripts change. See [B6.2 schema](../reference/FACTION_AFFINITY_SCHEMA_B6.2.md).

## ADR-023 — B6.3 approved playable actor classification

**Decision:** The current playable roster is organic by canon. Armor, shields, and equipment do not alter composition. Galloz remains organic and additionally carries `electronic-systems` to represent cybernetic components and EMP susceptibility. Future fully android characters require lore-grounded classifications.

**Constraints:** Capability metadata remains inert. No faction affinity values, runtime capability effects, skill/balance, AI, RNG, or golden transcript changes. Full-Serpent Toxic resistance is a deferred concept. See [B6.3 reference](../reference/ACTOR_CLASSIFICATION_B6.3.md).
