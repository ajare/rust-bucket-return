# Successful-resolution component rewards: impact study

**Historical analysis-only study, not the current reward rule.** Fixed authored success grants
were subsequently replaced by [Surplus Components](surplus-components.md). Labels such as
“current” below refer to the original study's archived control, not today's live game.
Targeted +2 specialists remain shipped; the standalone-specialist experiment is not enabled.

## Scope and method

At the time of this study, only **10 of 72 ordinary crises** granted success components: five Phase-I cards, four
Phase-II cards and one Phase-III card. Nine grant **1** random typed component; Fabricator Jam
grants **2**. Successful nonreward cards still have their authored effects, such as oxygen,
healing, course correction or named repair.

Tested two distinct changes:

1. **Quantity only:** on those same ten cards, replace the component award with a fixed integer
   0, 1, 2, 3 or 4. Zero removes the component effect, not other success rewards. This is not
   multiplying authored rewards: fixed 2 leaves Fabricator Jam at 2 while raising the other nine.
2. **Frequency and quantity:** grant a fixed 1 or 2 on **every ordinary successful crisis**,
   including cards that previously gave none. Route burns and final Re-entry are excluded.

Components remain independently random Electronics/Wiring/Power Cell tokens. Starting bank,
Mission grants, cannibalisation, sacrifice side effects, failure losses, costs, crew rules and
fitness weights are unchanged. In particular, these experiments do **not** remove all component
income when crisis-success rewards are disabled.

Eight profiles, **10,000 matched games each**, seed indices starting at **2,100,000**, salvage
policy / commitment cost **0.5**. The actual engine resolves actions and validates solver totals.
Each profile uses temporary copies, removed afterwards. The control exactly reproduces the
shipped 10,000-game profile's outcomes, durations, failures, triggers and every fitness row.

Fitness is sampled before actions on ordinary playable crisis turns, including opening/Re-entry,
not route burns or terminal snapshots. Per-game means receive equal weight. Turns ≤0.6 measure
degraded asset states, **not** low recovery probability or inevitable loss. Matching initial seeds
does not freeze later hands: different reward amounts consume different RNG draws, and changed
resources affect subsequent decisions.

## Main results

| Success reward rule | Mean awarded parts/game | Mean fitness ↓ | Ordinary turns ↑ | Turns ≤0.6 | Wins |
|---|---:|---:|---:|---:|---:|
| Current authored 1–2 on ten cards | **1.71** | **0.66092** | **22.0617** | **7.290** | **33.66%** |
| Zero on those cards | 0.00 | **0.65445** | 22.0701 | 7.544 | 33.86% |
| Fixed 1 on those cards | 1.63 | 0.66063 | 22.0635 | 7.306 | 33.81% |
| Fixed 2 on those cards | 3.25 | 0.66696 | 22.0978 | 7.095 | 34.94% |
| Fixed 3 on those cards | 4.86 | 0.67297 | 22.0673 | 6.853 | 34.95% |
| Fixed 4 on those cards | 6.55 | 0.67876 | 22.1034 | 6.612 | 35.07% |
| Fixed 1 on every ordinary success | 9.65 | 0.69109 | 22.1295 | 6.215 | 36.32% |
| Fixed 2 on every ordinary success | 19.32 | 0.71756 | 22.1665 | 5.199 | 37.51% |

Existing reward cards successfully award parts only **~1.63 times per game**. That scarcity
explains why changing the quantity has limited reach. Paying on every ordinary success produces
~9.65–9.66 awards/game, a much larger distribution change.

**Quantity alone is a weak duration lever.** Even fixed 4 adds only **0.0417** mean turns. The
broadest tested rule, two on every success, adds **0.1048 turns (+0.48%)** but raises fitness
**0.05664 (+8.57%)**, increases wins **3.85 percentage points**, and reduces low-fitness time
**28.69%**. It preserves resources/condition rather than producing prolonged crippled play.

Disabling success components lowers fitness **0.00648 (~0.98%)**, with no detectable duration
change in this sample. Its +0.20-point observed win difference is not evidence that removing
rewards improves survival.

### Paired approximate 95% changes versus current

| Rule | Fitness change | Ordinary-turn change | Win-rate change (percentage points) |
|---|---|---|---|
| Zero | −0.00648 [−0.00717, −0.00578] | +0.0084 [−0.0243, +0.0411] | +0.20 [−0.80, +1.20] |
| Fixed 2, existing cards | +0.00603 [+0.00531, +0.00675] | +0.0361 [+0.0041, +0.0681] | +1.28 [+0.29, +2.27] |
| Fixed 4, existing cards | +0.01784 [+0.01704, +0.01864] | +0.0417 [+0.0088, +0.0746] | +1.41 [+0.40, +2.42] |
| Every success, 1 | +0.03016 [+0.02919, +0.03114] | +0.0678 [+0.0256, +0.1100] | +2.66 [+1.50, +3.82] |
| Every success, 2 | +0.05664 [+0.05564, +0.05764] | +0.1048 [+0.0608, +0.1488] | +3.85 [+2.66, +5.04] |

These exploratory intervals characterize this fixed policy/sample, not human performance or
multiple-comparison-adjusted claims of an optimal setting. Small nonmonotonic point estimates
are unsurprising under finite matched samples, changing RNG paths and contingent heuristics.

## Direct score inflation versus condition changes

More inventory directly raises fitness's **10% component channel**, even without repairing a
single system. Reserves saturate at four of each type in the score; excess still remains spendable.
The fitness evaluator is not recalibrated in this experiment.

Mean normalized channels over all sampled turns:

| Rule | Systems | Crew | Components |
|---|---:|---:|---:|
| Current | 0.6052 | 0.8358 | 0.3605 |
| Zero | 0.6006 | 0.8360 | 0.3193 |
| Fixed 2, existing | 0.6083 | 0.8374 | 0.3983 |
| Fixed 4, existing | 0.6157 | 0.8381 | 0.4744 |
| Every success, 2 | 0.6359 | 0.8411 | 0.7427 |

On this turn-weighted accounting, about **67%** of the every-two fitness increase comes from
component reserves directly, **30%** from better system condition, and **3%** from crew condition.
These are accounting contributions, not isolated causal experiments. Cohorts/paths and lengths
also change. System condition does improve, but the dramatic reward increase is not a comparable
increase in crew survival or playable duration.

## Policy sensitivity

Repeat selected rules at commitment cost **0.25** on the first 2,000 held-out indices:

| Rule | Mean fitness | Ordinary turns | Wins | Awarded parts/game |
|---|---:|---:|---:|---:|
| Current | 0.65982 | 22.008 | 33.30% | 1.683 |
| Zero | 0.65425 | 22.032 | 34.75% | 0.000 |
| Fixed 2, existing | 0.66615 | 22.105 | 36.85% | 3.146 |
| Every success, 1 | 0.68989 | 22.153 | 37.40% | 9.655 |

The fitness/duration direction is consistent: much more inventory, little extra duration.
These seeds overlap the main sample, so this is a policy check, not independent extra evidence.
Do not interpret the zero-reward point estimate as proof that fewer rewards cause more victories.

## Implications for the study's original goal

For **low mean fitness plus long games**, reward quantity is a minor tuning knob rather than
the primary solution. Removing grants trims fitness slightly without a measured duration penalty;
adding grants increases fitness far more than duration. No reward rule was changed by this original study.

If the desired goal instead becomes a stronger sense of reward or easier repair/rebuilding,
fixed 2 on existing reward cards is a modest intervention. One component on every successful
ordinary crisis is a more visible intervention, but changes frequency as well as quantity.
Neither is recommended as a way to extend games substantially on these results alone.

### Important limitations

- **No fabrication planning/use.** Extra parts can fund replacements/backups for a human;
  that potential is absent here. The effect with construction-aware play may be materially larger.
- Only selected critical systems receive heuristic repairs; patches, salvage, Mission timing and
  future planning are not globally optimal. The response objective does **not** explicitly value
  a larger success payout, so it does not deliberately chase rewards when choosing commitments.
- Medical Bay repairs and other human priorities may use resources differently. More rewards do
  not directly heal crew; surviving crew retain independent constraints.
- No recovery probes were run. Low-fitness time and later loss triggers do not establish whether
  a damaged run has meaningful recovery options.
- This is the **targeted-specialist** shipped compromise, not the unshipped standalone +2 variant.

## Tools, data and validation

```sh
node tools/reward-study.cjs --games 10000 --seed-start 2100000
node tools/reward-study.cjs --games 2000 --seed-start 2100000 --commitment-cost 0.25 --profiles none,two,every-one
node tools/test-reward-study.cjs
```

The tool now freezes its fixed-reward sweeps to `surplus-before-engine.html.txt`, the smoothed
sixteen-system engine immediately before surplus rewards. Those new sweeps do not reproduce
the older tables above; use the original archived engine/simulator described below for that.
It never combines fixed grants with the live surplus rule.

`tools/reward-study.cjs` inserts reward-only rules and a passive actual-award ledger into temporary
simulator copies. It preserves all other success effects, failures, Core/Mission/cannibalisation/
sacrifice income, routes and terminal behavior. The ledger tracks eligible successful resolves,
positive award events and actual component tokens by phase, without consuming RNG or modifying
`G`. Its control reproduces the original simulation exactly.

Raw files:
- `docs/simulations/success-rewards-study.json`: eight main profiles, per-game matched rows,
  reward ledgers, configured card lists/amounts, source hashes and complete generated simulators.
- `docs/simulations/success-rewards-summary.json`: compact findings/paired intervals.
- `docs/simulations/success-rewards-cost025.json`: policy check.
- `docs/simulations/success-rewards-engine.html.txt`: exact engine snapshot.

For historical reproduction, use the saved engine as `index.html`, extract the desired report's
`simulatorSource` into `tools/simulate.cjs`, retain `tools/recovery-summary.cjs`, and run the report's
seed/policy/cost/game-count arguments in a separate workspace. Each generated simulator's hash
is saved with its result. The simulator was not modified by that original study.

Engine SHA-256:
`16860121a82e6cbaecd6268ac2a330578f7af16f6a1af23a9e33aa3e957a2092`

Base simulator SHA-256:
`4d884f1042eaa0c03e2410c00abf52f81b7dce827e93fffc12434ea0bd398ed8`

Study tool SHA-256:
`27181e345c4f742f1b8d1fe56903e3af779fe44e9689479f747d1a944f015816`

Validation reconciles baseline replay, source hashes, rows/samples, loss/trigger totals and
ledger tokens/events/phase totals; fixed N satisfies tokens=N×award events. Fixtures cover
existing/all eligibility, preservation of other effects, zero/integer rules, route/terminal
exemption and baseline RNG/outcome invariance. No production engine/simulator changes.
