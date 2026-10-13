# Phase-scaled injuries: implementation and matched-seed follow-up

> Historical pre-cap study. Phase-scaled injuries remain in place, but immediate track
> penalties have since been capped; see [current failure track caps](failure-track-caps.md).
> Use `--uncapped-tracks` to reproduce the pre-cap phase-scaled profile below.

## Implemented change

Only recommendation #1 from `duration-analysis.md` was implemented: soften irreversible crew
injuries in Accident and concentrate injury pressure near Return. No healing action, lifeboat
rule, requirement, success bonus, route effect or starting resource was changed.

Additional injury hits on top of each crisis's original failure consequences:

| Phase | Major crises, before → after | Minor OR crises, before → after |
|---|---:|---:|
| I — Accident | 3 → **1** | 2 → **0** |
| II — Transit | 3 → **3** | 2 → **2** |
| III — Return | 3 → **5** | 2 → **4** |

Original printed injury effects remain: CO₂ BUILDUP, for example, still has its original injury
plus the new Phase-I addition (2 total). Minor failures with no injury effect now omit injuries
entirely in Phase I rather than showing a confusing zero. Environmental oxygen additions and
course-error additions remain unchanged. Synthetic route burns and final RE-ENTRY are unchanged.

`FAILURE_BALANCE.injuriesByPhase` in `index.html` defines this curve. The help panel describes it,
and each crisis displays its actual total consequences.

## Calibration and comparison method

A 1,500-game training sweep varied Return penalties after fixing Accident at 1/0 and Transit
at 3/2. Return 3/2, 4/3, 5/4, 6/5, 7/6 produced approximately 36.2%, 30.1%, 24.3%, 19.7%,
and 17.4% wins. **5/4** was selected to retain the original ~25% overall victory target.

Use the same strongest tested policy, `salvage` with commitment cost 0.5, and the same
10,000 deterministic seeds starting at 2,000,000 as the previous study. Counterfactual probes
again use 300 actual trajectories and 128 continuations per checkpoint, retaining the current
crisis/hand and forecast while resampling hidden futures. New study: 3,504 checkpoints and
448,512 probes; previous: 3,259 checkpoints and 417,152 probes.

`--flat-injuries` reconstructs the previous 3/2 additions in every phase. That control reproduces
the old wins, duration distributions, failed-crisis counts and loss triggers exactly on all
10,000 seeds. The simulator also prunes positive-cost modes that cannot contribute to any
requirement or utility; cooling, course correction and every sacrifice side effect remain.
This optimization reproduces the unpruned 10,000-game results exactly and reduces probe runtime.

Six policies were checked on a separate 3,000-seed holdout: wins 24.77% salvage, 24.77%
aggressive, 24.50% balanced, 24.80% conservative repairs, 24.50% always-solve, 1.13% safe routes.
The tiny differences among the direct-route policies are not evidence of meaningful superiority.
A new commitment-cost sweep had a slight training preference for 0.75 rather than 0.5, but final
win rates are effectively identical (24.15% vs 24.16%). The fixed 0.5 policy is retained for a
clean before/after comparison. These remain tested heuristics, not proven optimal full-game play.

## Game-length results: 10,000 matched seeds

| Metric | Flat injuries | Phase-scaled injuries |
|---|---:|---:|
| Victories | 2,465 / 24.65% | **2,416 / 24.16%** |
| Mean length, all runs | 11.04 stages | **11.70 stages** |
| Population SD, all runs | 2.39 | **1.77** |
| Mean length, defeats | 10.23 stages | **11.14 stages** |
| Population SD, defeats | 2.20 | **1.63** |
| Mean length, victories | 13.50 stages | **13.49 stages** |
| Phase-I defeats | 105 / 1.05% of all games | **0 / 0% observed** |
| Phase-II defeats | 3,470 | **1,862** |
| Phase-III defeats | 3,960 | **5,722** |

Journey stages include the opening crisis and fatal Consume steps; route burns add responses
but not stages. No wall-clock playtime is inferred. New victory-rate 95% Wilson interval:
**23.33–25.01%**. Zero observed early defeats does not prove early defeat is impossible.

Among defeats, 75.4% now end during Return, versus 52.6% previously. Defeats are later and less
variable without simply raising the victory rate. Victory length is essentially unchanged.

## Death-spiral results

A sustained low-hope state means estimated recovery <=5%, staying below that threshold at every
subsequent checkpoint, with at least two checkpoints and at least two journey stages before
actual defeat. Temporary dips that recover are excluded. Zero recovery means no observed
victories in 128 continuations, not mathematically proven inevitability.

The 300-game sample had 225 defeats previously and 223 now.

| Metric | Flat injuries | Phase-scaled injuries |
|---|---:|---:|
| Sustained <=5% recovery, among defeats | 131/225 = 58.2% | **100/223 = 44.8%** |
| Mean onset stage | 6.34 | **7.74** |
| Mean stages from low-hope onset to defeat | 3.30 | **3.16** |
| SD of that delay | 1.42 | **1.48** |
| Low-hope onset by end of Phase I | 39 cases | **9 cases** |
| Sustained zero-observed recovery | 77/225 = 34.2% | **61/223 = 27.4%** |
| Mean zero-recovery delay | 2.57 | **2.33 stages** |
| SD of zero-recovery delay | 0.92 | **0.62** |
| Zero-recovery onset by end of Phase I | 15 cases | **1 case** |

This is a **13.4 percentage-point reduction** in the share of defeats involving sustained
low hope (about 23% relative reduction). On the exact same 300 seeds, 60 former spiral cases
are avoided, while 29 new spiral cases appear; 71 occur under both profiles. Net reduction:
31/300 games = 10.3 percentage points; approximate paired 95% interval for the reduction is
4.3–16.4 points. It improves the aggregate result, not every individual run.

The incidence and onset improve more than the delay. Typical low-hope runs still drag on for
about **three stages**. Worst observed low-hope delay is 11 stages rather than 9, despite the
lower average and fewer cases; the stricter zero-observed-recovery maximum improves from 6 to
5. Do not interpret the average improvement as elimination of all long-tail collapses.

## Remaining defeat causes

| Final cause | Before | After |
|---|---:|---:|
| Crew wiped out by crisis injuries | 4,773 | **4,955** |
| Crew wiped out by suffocation | 1,453 | **1,134** |
| Missed trajectory | 1,309 | **1,495** |

More crew casualties now happen late, while oxygen-depletion losses decrease. Injury pressure
remains the dominant source of defeat, but it no longer disables the whole crew as readily
in the opening phase. Moving penalties does not provide new healing options, so loss of the
Doctor can still produce a long, nearly hopeless tail.

## Conclusion

**Recommendation #1 helps.** It removes observed quick defeats, markedly reduces early loss
of hope, and shifts defeats to Return while keeping victories near 25%. It does **not** meet
the proposed goal of fewer than 20% of defeats having prolonged low recovery: 44.8% still do.
The recovery/stabilization and short last-chance/lifeboat recommendations remain unimplemented.

The main recommendation is to keep this curve and address recovery next rather than further
softening early injuries or making Return even more lethal. Merely moving damage later cannot
fully solve the lack of recovery decisions once critical crew abilities are gone.

## Reproduce

```sh
node tools/test-game.cjs
node tools/test-simulation.cjs
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage \
  --commitment-cost 0.5 --uncapped-tracks --recovery-games 300 --recovery-rollouts 128 \
  > docs/simulations/phase-scaled-duration-and-recovery.json
# Restore the former flat failure profile for a matched-seed control:
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage \
  --commitment-cost 0.5 --flat-injuries
```

Raw comparison: `docs/simulations/phase-scaled-comparison.json`. Full after trajectories:
`phase-scaled-duration-and-recovery.json`. Additional policy/cost sweeps are saved beside them.
Tests verify Phase-I softening, preservation of original injury effects, stronger Return hits,
zero-effect omission, OR resolution, excess-injury defeat checks and counterfactual-stat isolation.
