# P1.2.1 — Emergency Rotation Control-Flow Isolation

## Scope
Isolated Verra's P1.1 emergency-treatment rotation deferral with deterministic tests. No combat stats, switch thresholds, enemy target weights, or healing values were changed.

## Confirmed control-flow issue
`hasCriticalTreatmentOpportunity()` previously counted Verra herself as a critical treatment target. When Verra was below the 15% emergency threshold and her treatment mode could target herself, the override deferred rotation and the normal Verra decision tree could select self-treatment—even when no teammate was in emergency condition. This prevented the rotation path from running first.

## Correction
The emergency-treatment deferral now considers only living, non-summon teammates other than the acting Verra. If Verra alone is critical, rotation remains eligible. If a teammate is also critically injured and a treatment mode is usable/targetable, the deferral still allows Verra to treat that teammate.

## Isolation coverage
- Teammate critical: treatment precedes rotation.
- Treatment unavailable: rotation is not deferred.
- Critical teammate not targetable: rotation is not deferred.
- Verra alone critical: rotation selected when a healthy reserve is available.
- Verra and teammate both critical: teammate treatment is selected.
- Reserve too unhealthy to rotate safely: emergency treatment remains available.
- Emergency threshold behavior: existing threshold regression retained.

## Verification
- Focused Serpent tactics tests: 19 passed.
- Full suite: 370 passed, 0 failed, 0 skipped.
- No balance/stat changes.

