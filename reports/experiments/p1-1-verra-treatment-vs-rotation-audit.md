# P1.1 — Verra Emergency Treatment vs Rotation Audit

## Scope
- Investigate the reported treatment opportunity being overridden by reserve rotation.
- Keep combat stats, skill data, damage rules, and engine behavior unchanged.
- Reproduce decisions using the real Serpent controller and synthetic turn-view states.

## Confirmed cause
`chooseAction()` previously called `reserveSwitch()` before the Verra treatment decision tree. Any qualifying rotation therefore returned immediately, preventing Verra from considering a treatment action that could help a critically injured ally.

## Fix
Added `hasCriticalTreatmentOpportunity()` to the faction tactical controller. When Verra is the acting character and a living non-summon ally is at or below the emergency threshold (default 15% HP), and an available Remedy or Caustic Injection mode can target that ally, the controller defers rotation and continues to Verra's existing decision tree. The threshold is configurable through `criticalTreatmentThreshold`.

Rotation remains in force when the treatment skill is unavailable, the critical ally is not targetable by a treatment mode, or the ally is above the emergency threshold. No skills, character stats, or engine rules were changed.

## Regression coverage
Four focused tests cover:
1. Critical ally is treated instead of rotated out.
2. Rotation is not deferred if treatment is unavailable.
3. Rotation is not deferred if treatment modes cannot target the critical ally.
4. The emergency override respects the configurable HP threshold (20% remains eligible for rotation under the default 15% cutoff).

## Packaging hygiene correction
The prior audit ZIP included the same project twice: the project at archive root and a second copy under `fod-clean-commit/`. Node's recursive test discovery counted both suites (726 tests before this change). The duplicate nested project was removed from this deliverable. The authoritative root project now runs one suite.

## Verification
- `npm test`: **367 passed, 0 failed, 0 skipped**.
- Package layout: single project root; no nested `fod-clean-commit/` copy.
- Full archive integrity check passed after packaging.
- No battle simulation or faction balance batch was run for this tactical fix.

## Verdict
**P1.1 fix applied and regression-tested.** The intervention is narrow and faction-specific. Follow-up matchup validation should determine whether the change improves outcomes without creating excessive treatment turns or avoidable rotation delays.
