# Standalone specialist +2: impact experiment

**Analysis only; not shipped.** The live rule still requires a drawn, committed system whose
raw mode produces the specialist's capability.

## Interpreted rule

A healthy, unused capability specialist may contribute **+2 directly to the response totals**,
once per crisis, with **no system card or commitment required**, even if every matching system
is absent or destroyed. The bonus resets on the next true draw. Only the two capability
specialists change; Core/Mission abilities, injury/death guards, roster, and healthy Engineer
cannibalisation passive stay unchanged.

This interpretation makes +2 standalone on every response, not merely an emergency exception
when no producer is drawn. Requiring assignment to an arbitrary committed card, or allowing the
fallback only when matching cards are absent, would be different rules with potentially different
results.

## Matched 10,000-game comparison

Same shipped compromise, indices starting at 2,100,000, salvage policy, commitment cost 0.5,
ordinary pre-response fitness sampling and unchanged fitness weights. Engine totals/resolution
assertions ran throughout both simulations.

| Metric | Targeted (shipped) | Standalone prototype | Change |
|---|---:|---:|---:|
| Win rate | 33.66% | **36.55%** | **+2.89 percentage points** |
| Mean ordinary playable turns | 22.0617 | **22.1837** | **+0.1220 (+0.55%)** |
| Mean per-game fitness | 0.660925 | **0.669100** | **+0.008175 (+1.24%)** |
| Mean turns at fitness ≤0.6 | 7.2900 | **6.9346** | **−0.3554 (−4.88%)** |
| Crisis-injury defeats | 2,605 | 2,532 | −73 |
| Suffocation defeats | 2,702 | 2,470 | −232 |
| Trajectory defeats | 1,309 | 1,328 | +19 |
| Ship-hulk defeats | 18 | 15 | −3 |

There are **289 net additional victories**, not a claim that exactly those 289 games were
individually rescued. Changed action choices and RNG calls can alter later paths.

Paired approximate 95% intervals for changes: wins **+2.18 to +3.60 percentage points**;
fitness **+0.00768 to +0.00867**; ordinary turns **+0.1012 to +0.1428**; turns ≤0.6
**−0.3844 to −0.3264**. Win Wilson intervals: shipped 32.74–34.59%, prototype 35.61–37.50%.

## Gameplay consequences

- Removes the matching-card availability gate. Specialists can cover small requirements or
  close gaps without committing, patching, redlining or sacrificing a producer.
- A specialist's +2 plus the Commander can meet a three-point check without a matching system.
  The Medical Technician can supply MED independently; it is not an automatic healing action.
- Rare capabilities become more dependable, and losing their unique producer no longer removes
  *all* response output of that type while its specialist remains healthy. But +2 alone does not
  satisfy most demanding compound/late checks, explaining the modest aggregate effect.
- Free CLG/NAV can help with surplus cooling/navigation when enough surplus is available. Crew
  LFS output **does not** replace the Life Support system's passive oxygen protection; destroyed
  Life Support still drains two Oxygen per Consume. Healthy crew remain essential.
- Avoiding some failures/use wear conserves assets: Phase-III sampled system quality rises
  **0.272 → 0.291**, crew **0.484 → 0.503**, and overall fitness **0.340 → 0.359**.
- Fitness for an identical asset state is unchanged: it deliberately ignores draws, commitments
  and per-response availability. Only the subsequent asset trajectory changes. The formula was
  not recalibrated to give the stronger crew rule extra credit.

For the stated **low-fitness / long-game** goal, this is a mild trade-off rather than an improvement
in both objectives: it adds very little duration, raises average fitness and reduces degraded
playtime. Its main benefit is less draw frustration and slightly better victory prospects,
not longer operation of a crippled fleet. Recovery rollouts were not run, so actual recovery
probabilities and death-spiral inevitability are not established by these counts.

These are heuristic-policy results, **not optimal/human win rates**. The solver explores response
combinations, but future decisions/repairs/Mission timing remain heuristic and fabrication is not
planned or used. Free NAV+Commander surplus choices are not fully future-optimized by this policy.

## Reproduction and validation

Raw result: `docs/simulations/standalone-specialists-profile.json`.
Control: `docs/simulations/playability-compromise-profile.json`.

Preserved snapshots:
- `standalone-specialists-baseline-engine.html.txt`: current targeted engine.
- `standalone-specialists-engine.html.txt`: experimental engine. Only capability-specialist
  activation changes to direct `G.crewBonus` +2, with active/healthy/unused guards. Its UI text
  remains the old targeted text because this is a **headless prototype, not a UI implementation**.
- `standalone-specialists-simulator.cjs.txt`: solver credits both healthy unused specialists
  independent of mode/producer and activates them once. Other policy decisions are unchanged.

Copy the experimental engine/simulator snapshots to `index.html` and `tools/simulate.cjs` in a
separate workspace, keep `tools/recovery-summary.cjs`, then run:

```sh
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows
node tools/test-standalone-experiment.cjs # in the original workspace
```

Baseline engine SHA-256:
`16860121a82e6cbaecd6268ac2a330578f7af16f6a1af23a9e33aa3e957a2092`

Experimental engine SHA-256:
`ea2da6acb4ec5d7b0e2317f00bbbd9b74eebea74b37f71a48475f181b19cfe91`

Experimental simulator SHA-256:
`45485d659d68ff5d08c38c0e8e04acb3bc0d69dbe0c9bb2b76964bdced8160bb`

Regression fixtures exercise all 12 capabilities with no drawn cards/commitments, compare baseline
nonactivation, enforce once/health/reset/end guards, verify unchanged same-state fitness and that
standalone LFS does not restore its system passive. Raw source hashes, rows/sample counts and
loss/trigger totals reconcile. The live engine and simulator are unchanged.
