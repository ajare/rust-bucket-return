# Capability supply and crisis demand rebalance

Historical 12-capability/18-system rebalance, subsequently amended by
[Capability simplification](capability-simplification.md). The tables and matched-seed results
below describe that earlier engine, not the current ten-capability game. The goal is to stop Power/Engineering from dominating crisis checks
and give Signal, Detection, Cooling and Navigation recurring work across the journey,
including the long transit. This is a demand/supply change, not a new injury preset or a
recalibration to any target win rate.

## Requirement distribution

A mention counts a card once if a capability appears in any requirement arm. Unavoidable
means every arm requires it for successful resolution. Counts cover 72 ordinary crisis
cards; route burns and final Re-entry are separate, unchanged checks.

| Capability | Previous mentions | New mentions | Previous unavoidable | New unavoidable | New phase I / II / III mentions |
|---|---:|---:|---:|---:|---|
| Power | 32 | **12** | 8 | 6 | 6 / 5 / 1 |
| Engineering | 31 | **14** | 10 | 5 | 10 / 3 / 1 |
| Signal | 6 | **15** | 3 | 5 | 9 / 3 / 3 |
| Detection | 6 | **17** | 3 | 5 | 11 / 4 / 2 |
| Cooling | 5 | **16** | 3 | 6 | 9 / 3 / 4 |
| Navigation | 3 | **13** | 2 | 4 | 6 / 3 / 4 |

This also increases unavoidable demand, not just bypassable early OR alternatives.
Thrust/Control/Life Support/Medical/Protection counts remain 7/10/8/8/8. Compute moves
7→6 because Navigation Drift now needs Navigation rather than Compute.

The complete card-by-card thresholds, system outputs and reverse index are in
[Capability demand](capability-demand.md), generated with:

```sh
node tools/capability-demand.cjs --write
```

Examples of themed replacements:
- Ephemeris Update: **CON 3 OR NAV 3**; Star Sighting: **NAV 3 OR SIG 4**.
- Sensor Glint: **DET 2 OR SIG 3**; Static Storm: **SIG 2 OR DET 3**.
- Smoke in the Wiring Loom: **ENG 3 OR CLG 3**.
- Electrical Short: **POW 4 AND SIG 2** to supply/isolate the circuit remotely.
- Cabin Pressure Drop: **LFS 4 AND DET 2** to sustain air and locate the leak.
- Battery Degradation: **POW 4 AND CLG 3**; Oxygen Scrubber Failure: **LFS 4 AND CLG 2**.
- Thruster Misfire: **CON 4 AND NAV 3**; Navigation Drift: **NAV 4 AND CON 4**.
- Shield Hotspot: **PRO 3 OR (CLG 3 AND NAV 2)**.
- Bus Load Shed: **POW 5 OR (SIG 3 AND NAV 2)**.
- Final Power Shunt: **POW 5 AND CLG 3**; Chute & Recovery Deploy: **ENG 5 AND SIG 3**.

Descriptions now explain the alternative method instead of describing an obsolete power boost
or mechanical repair. Iconic electrical/mechanical emergencies still require those capabilities:
Reactor Trip, Battery Surge, Fuel Line Blockage and Coolant Loop Rupture remain intact.

All 72 identities/titles, placements and OR-versus-strict tiers remain. Pools still have
33/3/2 OR cards in phases I/II/III. Return has 12 AND and 4 single-capability cards because
Final Power Shunt is now compound. Cheapest-arm mean loads are **2.86 / 5.72 / 7.56**,
versus 2.86 / 5.78 / 7.56 before. These sums are only a proxy; capability availability matters.

## Coordinated system supply

Keep each of the four promoted capabilities' primary producers at **3 / 6 / 8** output. Add modest secondary outputs rather than
requiring a lone specific blueprint to be drawn repeatedly. A mode produces its whole vector
simultaneously; no new selector or separate action is needed.

| System | Added secondary capability | Normal / Redline / Sacrifice |
|---|---|---|
| Main Engine | Navigation | +1 / +2 / +3 |
| Manoeuvring Thrusters | Navigation | +1 / +2 / +3 |
| Main Computer | Signal | +1 / +2 / +3 |
| Sensors | Signal | +1 / +2 / +3 |
| Navigation Computer | Detection | +1 / +2 / +3 |
| Communications | Detection | +1 / +2 / +3 |
| Auxiliary Reactor | Cooling | +1 / +2 / +3 |
| Service Module | Cooling | +1 / +2 / none |

Service Module Engineering becomes **1 / 4 / none** instead of 2 / 5 / none;
its sacrifice still yields components only. Fuel Cells Power becomes **1 / 3 / 5** instead
of 2 / 4 / 6. These reduce redundant Power/Engineering output while retaining their identity.
The Fabricator still supplies **ENG 2 / 5 / 5** or constructs a system with no output.

| Capability | Previous Normal producers/output | Current Normal producers/output |
|---|---|---|
| Power | 4 / 9 | 4 / **8** |
| Engineering | 2 / 4 | 2 / **3** |
| Signal | 1 / 3 | **3 / 5** |
| Detection | 1 / 3 | **3 / 5** |
| Cooling | 1 / 3 | **3 / 5** |
| Navigation | 1 / 3 | **3 / 5** |

These are whole-original-fleet totals, not five-card hand output. Damage still floors each
capability separately: a one-point backup halves to zero. A matching healthy specialist
can nevertheless add +2 after halving, exactly as with the previous one-point Thrust output.
Specialists match capabilities, not blueprint names. Service sacrifice cannot receive a
Cooling bonus because that mode has no Cooling output. Secondary bonuses disappear on
uncommit and do not waive Redline damage/Sacrifice destruction.

Cooling retains its general surplus heat-offset role. Navigation retains three-surplus
Course correction on non-route responses. Secondary outputs participate in those rules,
so the supply change can affect outcomes even when a crisis does not require them.

## Preserved rules

No changes to difficulty injury additions, authored or scaled failure effects, success rewards,
track caps, ongoing penalties, phase/deck sizes, safe/direct burn checks, final Re-entry,
component costs/yields, copy limits, passives, crew selection/powers or fitness weights.
There are still 18 initial systems. Same seed and difficulty reproduce the new opening/run;
old-rule replay is not promised because changed decisions/RNG consumption alter later paths.

The demand tool and regression suite compare against the archived previous engine, including
all failure effects on all three difficulties, not just checking that current cards match themselves.

## Matched-seed simulation comparison

10,000 games **per difficulty**, indices starting at 2,100,000, same seeded six-person roster,
`salvage` heuristic policy, commitment cost 0.5. Seed formula:
`Math.imul(seedStart + index, 2654435761) >>> 0`. No experimental modifiers.

```sh
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows --difficulty normal
# Also run --difficulty easy and --difficulty hard.
```

| Difficulty | Previous wins | Current wins | Previous ordinary turns | Current ordinary turns | Previous fitness | Current fitness |
|---|---:|---:|---:|---:|---:|---:|
| Easy | 44.08% | **50.06%** | 22.3223 | **22.5236** | 0.659950 | **0.665478** |
| Normal | 33.66% | **40.84%** | 22.0617 | **22.2814** | 0.660925 | **0.665728** |
| Hard | 2.79% | **6.50%** | 17.7198 | **18.3759** | 0.679640 | **0.675444** |

Normal paired changes (approximate 95% intervals):
- Wins **+7.18 percentage points** [6.04, 8.32].
- Ordinary playable turns **+0.2197** [0.1806, 0.2588].
- Mean per-game fitness **+0.004803** [0.003912, 0.005695].
- Turns at fitness ≤0.6 **−0.2452** [−0.2952, −0.1952], from 7.2900 to 7.0448.

The new mix slightly extends games and increases wins. **It does not improve the earlier
low-fitness objective on Easy/Normal**: those fleets are slightly healthier on average, with
less low-fitness time. No hidden injury/damage retuning was applied to offset that trade-off.
Hard remains punishing; its lower fitness can reflect the longer attrition window rather
than inherently worse assets. These results do not establish human/optimal win rates,
inevitable death or recoverability. The policy does not plan/use fabrication, and repairs,
Mission timing and future-crisis planning remain heuristic. Definition counts also do not
measure actual per-capability commitment frequency.

Raw old results: `docs/simulations/difficulty-{easy,normal,hard}.json` (preserved).
Raw current results: `docs/simulations/capability-rebalance-{easy,normal,hard}.json`.
Counts, metrics and paired intervals: `docs/simulations/capability-rebalance-summary.json`.

Archived old sources:
- `docs/simulations/capability-rebalance-before-engine.html.txt`
- `docs/simulations/capability-rebalance-before-simulator.cjs.txt`

For historical reproduction, copy those to `index.html` and `tools/simulate.cjs` in a separate
workspace retaining `tools/recovery-summary.cjs`, and run the same command with the desired level.
Do not expect `--baseline` to undo the new requirements or system outputs.

Source hashes:
- Previous engine: `815eef7b68e3a2369ea61f6ea9e723190a147b5aba655c426513b9ae4c77559a`.
- Current engine: `3b017532c51605225210df93fd841bceb59567e8b500d407dd9049efc255478e`.
- Unchanged simulator: `eb53121d335df6ca2ae8234de4b0147189932096f7aec09fe2e5b2f6d7884db5`.

## Regression validation

All 14 suites pass. `tools/test-capability-rebalance.cjs` locks the new counts, increases in
strict demand, three producers per promoted capability, recurring Phase-II checks, valid
output/requirement vectors, and unchanged failure rules on every difficulty. It exercises
real specialist assignment to every backup output across its modes, damaged one-point output,
uncommit behavior and invalid salvage-only targets, and checks the generated catalogue.
Existing tests retain same-seed restart, fitness purity, fabrication, crew/Mission behavior,
post-mortems, headless simulation and explicit compound AND/OR readiness. Coolant fixtures
now use the unchanged Fabricator's ENG 5 Redline instead of the reduced Service Module.
Smoke-in-the-Loom tests require actual resolved log entries, not merely absent injury effects.
The final Help edits were rerun on all 30,000 games and reproduce the initial rebalance rows
and aggregates exactly.
