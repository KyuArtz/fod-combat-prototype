# P1.2.12 — Verra Rotation Failure Analysis

## Scope
Read-only investigation using the P1.2.11 package and experiment data. Production AI, combat, skill, healing, shield, and resistance logic were not changed.

## Method
- Reused P1.2.11's 20 seeds per matchup, both seats, baseline and experimental policy (160 battle runs).
- Captured Verra decision snapshots from the controller during a separate replay pass: HP ratio, incoming-pressure signal, eligible reserve, treatment action availability, and chosen action.
- Reconciled paired outcome changes against P1.2.11's existing experiment results.
- Ran the project's full test suite against the supplied archive.

## Main findings

### 1. Pressure is frequently detected before Verra is low HP

Among pressure-triggered decision snapshots:

| Matchup | Trigger snapshots | Verra at <=16% HP | Verra >16% and <=22% | Verra >22% HP |
|---|---:|---:|---:|---:|
| Phantom | 230 | 8 | 26 | 196 |
| Falcon | 448 | 10 | 10 | 428 |

This indicates the three-round pressure signal commonly activates while Verra is above the experimental 22% rotation threshold. Pressure alone does not imply immediate rotation.

### 2. Trigger frequency is not rotation frequency

| Matchup | Pressure triggers | Switch actions, baseline | Switch actions, experimental |
|---|---:|---:|---:|
| Phantom | 230 | 14 | 34 |
| Falcon | 448 | 22 | 24 |

The pressure policy added 20 switches against Phantom but only 2 against Falcon. The same signal behaves differently in practice because the action decision is still constrained by HP thresholds, reserve eligibility, and the rest of Verra's decision flow.

### 3. Treatment options often coexist with the pressure signal

At pressure-triggered Verra decisions, at least one treatment action was available in:
- Phantom: 212 of 230 snapshots
- Falcon: 214 of 448 snapshots

This records action availability only; it does not prove the available treatment was the best action or that Verra herself was a legal treatment target.

### 4. Matchup outcome changes were concentrated in two paired cases

- **Phantom, seed 20261115, both seats:** baseline won; pressure policy lost. Verra rotations changed 0→2, treatments 9→5, battle length 32→15 rounds. Verra remained KO'd. This is a strong observed association with policy change, but the current capture does not establish which individual switch caused the defeat.
- **Falcon, seed 20261118, both seats:** Serpent wins remained unchanged; Verra survived under pressure policy. Switch count remained 1 in each pair. Results were seat-sensitive for reserve turns and damage, so these runs should not be reduced to a single causal explanation.

## Failure interpretation

The experiment does **not** show that rotation is intrinsically bad. It shows that the pressure trigger is broad and can be active for many Verra decision opportunities without indicating imminent KO or an immediately useful switch. The trigger should not be treated as an automatic urgency score.

The most plausible investigation targets are:
1. Whether pressure is concentrated from one enemy or spread across multiple sources.
2. Whether pressure is followed by an actual HP-danger transition or just sustained manageable damage.
3. Whether the incoming reserve changes the field advantage after switching.
4. Whether switching sacrifices a treatment action or loses tempo.
5. Whether Verra's treatment-over-rotation choice is already adequate and pressure should only inform, not override, her decisions.

These are hypotheses for further instrumentation, not confirmed root causes.

## Decision
- Keep the default Verra rotation threshold at 16%.
- Reject the pressure-elevated 22% threshold as a default policy.
- Do not change healing, shield, resistance, or rotation policy during this audit.
- Next useful work: event-level switch follow-up capture for outgoing/incoming units, next-round damage, treatment opportunity lost, and post-switch team-state value.

## Validation
- Full suite: 377 passed.
- This phase added a report only; no production runtime files were modified.
- Decision capture was a separate temporary experiment and its large raw snapshot output was not included in the project archive to avoid test/report bloat.
