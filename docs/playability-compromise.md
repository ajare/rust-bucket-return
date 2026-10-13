# Shipped playability compromise

**Current status:** its deck lengths and failure rules still form the **Normal** injury preset
in [three difficulty levels](difficulty.md). The later [capability rebalance](capability-rebalance.md)
changes requirements/system outputs. Results below are historical, pre-rebalance results; new
Normal runs no longer reproduce them. Use archived sources for that comparison.

Implemented the approved [low-fitness / long-game study](fitness-duration-study.md) compromise.
The goal is longer play with a more degraded fleet, without the near-zero victory rates of the
study's extreme frontier settings.

## Rules shipped by the original compromise

- Nominal phase lengths **5 / 16 / 4**, plus final Re-entry. Direct burns still remove two cards
  on success or one on failure; safe routes add two. Actual Phase-II decks are therefore 14,
  15 or 18 unique crises, respectively.
- Added major/minor injury hits: **I 1/0, II 0/0, III 1/0**. Authored injury hits remain intact:
  Crew Illness 2, Crew Fatigue/Radiation Storm 3, Sensor Fault Alarm 1. Coolant Loop Rupture
  adds no crew hits but still fails when its full AND requirement is unmet.
- **One additional random system damage hit on every normal major failure**, stacking with
  authored random and named damage. Most OR cards are minor; explicitly major Fuel Line
  Blockage also receives this wear. Damaged targets can be destroyed by a further damage hit.
- Route burns and final Re-entry are outside this modifier. Re-entry remains two injury hits
  and two random destructions on failure.
- At that release, unchanged requirements/rewards, phase placements/pools, track caps, three-turn air penalties
  and extra first-Consume Oxygen loss, starting two parts/type, repair cost two, crew/fabrication
  rules, and DEBUG fitness formula. `BASE_FAILURES` remains the unmodified authored baseline.

`FAILURE_BALANCE.extraMajorDamage` applies during normal crisis balancing, next to the injury
additions. The UI's failure text shows the final damage/injury totals. Help explains the long
transit, reduced crew pressure and increased fleet wear.

## Verified against the experiment

Ran the **actual shipped engine with no experimental balance modifiers**:

```sh
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows
```

Results exactly match `fitness-duration-heldout-balanced.json`: all 10,000 per-game fitness rows,
win/loss counts, triggers, failed-crisis counts, durations and fitness aggregates.

| Metric | Shipped result |
|---|---:|
| Wins | **3,366 / 10,000 (33.66%)** |
| Mean ordinary playable turns | **22.0617** |
| Mean per-game fitness | **0.6609249** |
| Mean turns at fitness ≤0.6 | **7.290** |

These are fixed heuristic-policy results, not optimal/human win rates. Fabrication planning is
still absent. Low-fitness turns do not establish inevitable death or quantify recovery chances.

Raw shipped results: `docs/simulations/playability-compromise-profile.json`.

Engine SHA-256:
`16860121a82e6cbaecd6268ac2a330578f7af16f6a1af23a9e33aa3e957a2092`

Simulator SHA-256:
`4d884f1042eaa0c03e2410c00abf52f81b7dce827e93fffc12434ea0bd398ed8`

## Regression coverage

All ten suites pass. Tests explicitly check every card's authored-plus-added injury/damage
values, major OR handling, absence of extra wear on Re-entry/burns, actual safe/successful/failed
route deck sizes, preserved original requirements/rewards/BASE_FAILURES, AND/OR readiness,
crew/actions/fabrication/post-mortems, air expiry, fitness/RNG independence and seeded restart.

Existing experimental simulation flags remain **additions to the current shipped rules**;
do not reuse the archived study's `--damage 1 --late-injury-reduction 2` command against this
engine, since the compromise is now already present. For historical reproduction, copy the
study's hash-verified engine/simulator snapshots to `index.html` and `tools/simulate.cjs` in a
separate workspace, retaining `tools/recovery-summary.cjs`.
