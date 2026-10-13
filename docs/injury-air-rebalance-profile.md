# Second injury reduction and slightly stronger air failures

**Archived balance snapshot:** superseded by the [shipped playability compromise](playability-compromise.md).
The rules/results below describe the preceding release, not the current engine.

## Shipped rules

| Phase | Previous added injuries, major/minor | Current additions |
|---|---|---|
| I | 1 / 0 | 1 / 0 (unchanged) |
| II | 2 / 1 | **1 / 0** |
| III | 4 / 3 | **3 / 2** |

Every normal Phase-II/III failure has one fewer added hit. Original injury hits are preserved:
Crew Illness now has 3 total, Crew Fatigue/Radiation Storm 5, and Coolant Loop Rupture 1.
Final Re-entry remains 2; route rules, requirements, rewards, phase placement and track caps
are unchanged.

**Oxygen Scrubber Failure** and **CO₂ Accumulation** each lose **one extra Oxygen on their first
Consume only**. Their original recurring rates (−2 and −1 per turn respectively) and three-turn
durations remain unchanged. Early air failures receive no extra drain. This is an ongoing-effect
modifier, separate from the immediate failure track caps. New failure tooltips show the one-shot
extra −1 Oxygen and duration. A successful response never starts the penalty.

`FAILURE_BALANCE.ongoingInitialDrainByPhase` is `{1:0,2:1,3:1}`. Balance clones the affected
ongoing definitions, leaving `BASE_FAILURES` untouched. Consume spends `initialDrain` once on
runtime penalty instances, never on card definitions. Stacked penalties each spend their own
initial drain. Tests verify the extra first loss, subsequent original rates, normal expiry and
unchanged early/base definitions.

## Main matched profile: 10,000 games

Same seed-index range, salvage policy and commitment cost 0.5 as the previous profile.

| Metric | Previous profile | Current profile |
|---|---:|---:|
| Wins | 2,162 | **5,032** |
| Win rate | 21.62% | **50.32%** |
| Win-rate 95% Wilson interval | 20.82–22.44% | **49.34–51.30%** |
| Losses | 7,838 | **4,968** |
| Crisis-injury defeats | 5,569 (71.05% of defeats) | **2,655 (53.44%)** |
| Suffocation defeats | 1,057 (13.49%) | **780 (15.70%)** |
| Trajectory defeats | 1,212 (15.46%) | **1,533 (30.86%)** |
| Ship-hulk defeats | 0 | 0 |
| Mean losing journey stage | 12.072 | 12.635 |

There are **2,870 net additional wins (+28.70 percentage points)**. This small integer reduction
has a large aggregate effect; no further tuning was performed to force a target win rate.
Crisis injuries remain the largest terminal-loss category, with trajectory now second.

**Absolute suffocation defeats fall compared with the previous profile**, despite stronger air
failures, because the simultaneous injury reduction changes crew survival and subsequent play.
Their share of defeats rises from 13.49% to 15.70%. To assess the air modifier separately, use
the fixed-injury control below rather than attributing the combined totals to air changes alone.

Loss phases: I **2**, II **4**, III **4,962**. More defeats shift to the late game. No recovery
rollouts were run, so later loss timing does not establish improvement or worsening of sustained
death spirals.

Most frequent terminal triggers:

| Trigger | Defeats |
|---|---:|
| Re-entry | 1,110 |
| Oxygen depletion during Consume | 780 |
| Precision Navigation | 391 |
| GNC Final Alignment | 372 |
| Debris Field | 370 |
| Navigation Drift | 326 |
| Re-entry Vector Trim | 296 |
| Crew Fatigue | 225 |

These are final triggers, not counterfactual root causes. GNC/navigation counts can mix crew
and trajectory losses. The suffocation field counts terminal **games**, not individual deaths.
Surviving failed Re-entry still counts as a victory.

## Air-only control

Use the new injury settings and unchanged simulator, but disable the initial air drain:

| 10,000-game profile | Wins | Crisis losses | Suffocation losses | Trajectory losses |
|---|---:|---:|---:|---:|
| New injuries, no extra initial drain | 5,115 (51.15%) | 2,612 | **723** | 1,550 |
| New injuries, extra initial drain | 5,032 (50.32%) | 2,655 | **780** | 1,533 |

At fixed injury settings, the air modifier produces **57 more suffocation defeats (+7.88%)**
and a **0.83-percentage-point lower win rate** in this matched sample. These are aggregate
changes; they do not assert that the same 57 individual games merely changed labels. Policy
responses and later random draws can change after a different injury or Oxygen outcome.

The control engine differs only in `ongoingInitialDrainByPhase:{1:0,2:0,3:0}`. Its hash is distinct
from the shipped engine and the control is not the version players receive.

## Rejected duration-only experiment

Initially, the air adjustment extended those two penalties from three to four turns instead.
A 10,000-game control showed this had negligible aggregate effect: **51.13% wins with longer
penalties vs 51.15% without**, and 721 vs 723 suffocation defeats. Extra duration often arrives
after Oxygen has already reached zero; expiry does not refill it. This motivated replacing
duration extension with the small first-Consume drain. The four-turn experiment is **not shipped**.

Those experimental results remain in `injury-air-duration-experiment*.json` and
`injury-air-control-shorter-penalties.json` for auditability.

## Alternative-policy checks

Repeat the previous checks on the same first 2,000 seed indices:

| Policy | Previous wins | Current wins | Current crisis-injury share of defeats |
|---|---:|---:|---:|
| Salvage / cost 0.25 | 445 (22.25%) | **1,018 (50.90%)** | 53.16% |
| Safe / cost 0.5 | 4 (0.20%) | **32 (1.60%)** | 63.26% |

These overlap the main seed sample. Safe differs beyond route choice, so the difference is not
an isolated experiment on safe routes. The automated policy does not plan/use fabrication and
uses heuristic mission timing, repairs and future planning; these are not optimal/human win rates.

## Reproduction and validation

```sh
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage --commitment-cost 0.5
node tools/simulate.cjs --games 2000 --seed-start 2000000 --policy salvage --commitment-cost 0.25
node tools/simulate.cjs --games 2000 --seed-start 2000000 --policy safe --commitment-cost 0.5
```

Actual run seeds: `Math.imul(2000000 + index, 2654435761) >>> 0`. No baseline, uncapped-track,
experimental-profile or recovery flags were used. To reproduce the air-only control, use a
separate copy of `index.html` with only the initial-drain phase map set to zero, and the same
`tools/simulate.cjs` and `tools/recovery-summary.cjs`.

Current raw results in `docs/simulations/`:
- `injury-air-rebalance-loss-causes.json`
- `injury-air-rebalance-loss-causes-cost-025.json`
- `injury-air-rebalance-loss-causes-safe.json`
- `injury-air-control-no-initial-drain.json` (unshipped control)

Prior profile: `reduced-injuries-loss-causes*.json`, preserved unchanged.

Current `index.html` SHA-256:
`aabc5474a688f0fd3d3b57ec45228e3537d059425255d6c732eb779f63326843`

Air-only control SHA-256:
`5ed7eecd777601b2d4ccdc17fd54d53bf69dbfe0980d0d81eacf1b61ee499135`

Previous shipped engine SHA-256:
`1603ea5cfe005b57ccac8fe5ebbf75d5c6749ef9deafaacdfc2e8c91d7c699ab`

Simulator remains unchanged, SHA-256:
`a6e234e408dce47f3aa93e593a006b562f48b5dd584d9e0d1a02505849bae0c7`

All nine regression suites pass, including one-hit reduction checks, AND/OR outcomes, first-only
air loss, early penalties and base-definition preservation, normal expiry, mission actions,
post-mortems, construction and seeded restart. Simulation response assertions agree with the
engine; result totals and engine hashes reconcile. Historical control flags are not full game
rollbacks: baseline restores original card failure definitions; injury/track-only controls keep
other current modifiers. Fictional death descriptions do not classify losses.
