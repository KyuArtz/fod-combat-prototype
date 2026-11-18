# Development Roadmap

This roadmap separates completed foundations from proposed future work. An unchecked item is not a commitment or permission to begin implementation.

## Completed foundations

- [x] Modular Node.js CLI combat loop and actor factory.
- [x] Physical/mastery damage, MP, cooldown, shield, and status systems.
- [x] Active/reserve formation, manual switching, and automatic replacement.
- [x] Legacy and threshold readiness schedulers; threshold is preferred.
- [x] Seeded RNG, typed event bus, controller-driven turns, decision validation, and deterministic replay.
- [x] Player-first PvE opening initiative.
- [x] Data-driven Falcon skills/passives and shared skill interpreter.
- [x] Shared player/enemy basic-attack resolver.
- [x] Full-battle regression coverage and golden transcript fixtures.
- [x] Typed combat event contracts.
- [x] Headless simulator and scheduler comparison tooling.
- [x] Data-driven enemy skills, enemy archetypes, AI policies, and encounter definitions.
- [x] Multi-wave encounter progression, per-instance stat overrides, defeat-count reinforcements, and completion/reward metadata hooks.
- [x] Falcon mechanics finalization with owner-approved implementation values documented separately from owner-authored values.
- [x] Documentation and codebase baseline audit/restructure: modular skill runtime, standard project metadata, ignore/formatting conventions, and reorganized documentation.

## Open technical decisions

- [ ] Decide whether and when runtime Falcon base stats should be synchronized with the owner-maintained stat sheet.
- [ ] Decide PvP and ambush opening-initiative policies.
- [ ] Decide whether to support encounter waves with fewer than five enemy entries.
- [ ] Expand enemy skill kits and AI policy vocabulary when encounter design requires them.
- [ ] Add source attribution to damage events if attacker-level damage analytics are required.
- [ ] Evaluate stage/level scaling and broader combat balance using multiple policies, encounters, and seed ranges.

## Next planned feature milestone — not started

**Reward System and Stage Progression Foundation**

Potential scope, subject to approval before implementation:

1. Define reward payloads for XP, currency, and items.
2. Award rewards only after successful encounter completion.
3. Define stage progression and encounter sequencing.
4. Separate persistent agent/progression data from battle runtime state.
5. Establish a versioned save-data schema and migration policy.

The encounter completion callback and reward metadata from Step 8 are integration points, not an existing reward system.

## Release / merge gate

Before merging a development change to `main`:

1. Run `npm test` and require all tests to pass.
2. Run targeted battle regressions for the changed systems.
3. Review any golden fixture changes and document intentional behavior changes.
4. Run relevant simulator samples and record configuration/seed ranges; do not treat small samples as balance proof.
5. Update the current reference, roadmap, and changelog only where their responsibilities require it.
6. Verify Git branch/status and review the final diff before committing or merging.
