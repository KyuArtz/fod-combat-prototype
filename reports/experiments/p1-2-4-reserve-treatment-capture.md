# P1.2.4 — Reserve Eligibility & Treatment Value Capture

**Status:** Decision-context capture completed; no combat/AI behavior changes.

## Protocol
- 10 seeded Serpent vs Phantom matchups, both seat orientations: **20 battles**, seeds 20261633–20261642.
- Captured Verra decision snapshots, actor HP/MP/MPow, active/reserve health, legal treatment modes/targets, selected decision, and healing/cleanse events.
- Candidate eligibility calculated using current thresholds (Verra 16%, standard 20%, poison 32%) and reserve safety rule (at least max(65%, outgoing HP + 25 percentage points).

## Findings
- **160 decisions**; **148 treatments/remedies**; **106 self-targeted (71.6%).** Ally treatment targets: galloz: 22, kane: 20.
- At HP ≤30%: **46 treatment decisions**, including **44 self-treatments**.
- **48 decision snapshots at ≤30% HP**. At ≤16% HP: **8 decisions, none with a safe reserve**. In these critical windows, Claude was the reserve at roughly **1.33% HP**, so rotation could not meet the reserve safety rule.
- In the **16–30% HP band**, a healthy reserve was present in **38 of 40 snapshots**. Verra herself is not switch-eligible under the 16% threshold in this band, absent another active teammate triggering rotation. This is a policy window to investigate, not a proven defect.
- Healing output: **148 events**, **34,066 actual HP** from **36,768 requested**, with **2,702 overheal (7.35% of requested)**. Average actual healing per event: **230.2 HP**. Also recorded **140 StatusCleansed events**.

## Interpretation
Reserve availability explains the critical-low-HP cases in this sample: once Verra reached the current switch threshold, the reserve was too injured to qualify. In the 16–30% band, healthy reserves were usually present but Verra's own 16% threshold prevented her from becoming a switch candidate. Treatment value is measurable and not trivial: substantial healing was delivered, and overheal was limited relative to requested healing.

The next evidence-based step is an isolated **rotation-threshold policy experiment** (current 16% versus a modest higher threshold) with matched seeds and seat orientations. This audit alone does not justify a default change.

## Verification
- Test suite: **370 passed, 0 failed, 0 skipped**.
- JavaScript syntax: **156 files** checked, all passed.
- Combat behavior unchanged.
- Raw capture: `p1-2-4-reserve-treatment-capture.json`; summary: `p1-2-4-reserve-treatment-capture.summary.json`.
