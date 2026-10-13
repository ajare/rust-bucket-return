# When defeats happen, and whether they drag on

> Historical flat-injury benchmark. Recommendation #1 has since been implemented;
> see [the phase-scaled follow-up](phase-scaled-injuries.md). Recommendations #2 and #3
> remain unimplemented. Use `--flat-injuries` to reproduce the historical profile below.

## Summary

Current failure-balanced game, strongest tested policy (`salvage`, commitment cost 0.5):
**10,000 games**, 2,465 victories, 7,535 defeats. No game rules were changed for this analysis.

Quick defeat is rare. Prolonged low-hope play is not: in a 300-game recovery study, **131 of
225 losses (58.2%)** entered a persistently <=5% estimated recovery-chance state at least two
journey stages before defeat. The average additional wait was **3.30 stages**.

## Length distribution

| Outcome | Journey stages, mean | Population SD | Crisis responses, mean | Population SD |
|---|---:|---:|---:|---:|
| All games | 11.04 | 2.39 | 12.52 | 2.91 |
| Victories | 13.50 | 0.60 | 15.50 | 0.60 |
| Defeats | 10.23 | 2.20 | 11.55 | 2.69 |

A journey stage is the engine's consume counter plus one for the opening crisis, which does not
consume oxygen. A fatal Consume counts as reaching that stage even if the player never gets to
respond. Route burns add crisis responses but not journey stages; route-choice clicks are not
counted as responses. These are gameplay-length units, **not wall-clock minutes**. Decision
speed and number of repair/crew actions are not measured.

Losing games: median stage **10**, middle 50% **9–12**, 10th–90th percentile **7–13**,
minimum **3**, maximum **14**. Winning games: median **14**, range **12–14**.

### Stage of defeat

| Journey stage reached | Defeats |
|---|---:|
| 3 | 1 |
| 4 | 17 |
| 5 | 87 |
| 6 | 263 |
| 7 | 589 |
| 8 | 814 |
| 9 | 997 |
| 10 | 1,180 |
| 11 | 1,227 |
| 12 | 1,054 |
| 13 | 846 |
| 14 | 460 |

### Phase of defeat

| Phase | Defeats | % of all games | % of defeats |
|---|---:|---:|---:|
| I — Accident | 105 | 1.05% | 1.39% |
| II — Transit | 3,470 | 34.70% | 46.05% |
| III — Return | 3,960 | 39.60% | 52.55% |

Only **one** run ended within the first three stages. **105** ended by stage five.
The game largely satisfies the goal of not ending abruptly early. However, the time at which
recovery becomes unlikely is substantially earlier than the actual ending.

## Recovery experiment

For the first 300 games in the same deterministic seed block, save every non-route crisis
checkpoint before responding. The sample contains 75 victories, 225 defeats and **3,259
checkpoints**. At each checkpoint, run **128 counterfactual continuations**, for a total of
**417,152** probes, using the same strongest tested policy.

Keep the current revealed crisis, hand, crew, components, damage, tracks and persistent effects.
Resample hidden remaining crisis cards without replacement, excluding already revealed cards;
preserve the displayed next-card category (or exact identity when the Specialist has revealed
it), and reshuffle future phase pools. Reseed future damage/draw randomness. The policy does not
get privileged knowledge of those futures. Probe results do not alter the real games or their
statistics.

A **sustained low-hope spiral** means:

1. Estimated recovery rate <=5% at two or more consecutive checkpoints.
2. It stays <=5% at **every later checkpoint** of that actual losing game.
3. At least two journey stages pass between onset and defeat.

Temporary dips followed by a recovery are excluded. This is a practical policy-based diagnostic,
**not proof that defeat was mathematically inevitable**. The solver optimizes current responses;
repairs, salvage and future planning remain heuristic. Different human play may rescue a state.

### Results

| Diagnostic | Games | % of sampled defeats | Additional stages until defeat |
|---|---:|---:|---|
| Sustained <=5% recovery | 131 | 58.2% | Mean 3.30, SD 1.42, median 3, range 2–9 |
| Sustained zero observed wins in 128 probes | 77 | 34.2% | Mean 2.57, SD 0.92, median 2, range 2–6 |

Low-hope onset averages stage **6.34** (median 7), compared with the losing-game average
ending at stage 10.23. **39 of 225 sampled losses (17.3%)** entered a sustained low-hope state
by the end of Phase I, even though very few runs actually end in Phase I.

Zero observed recovery onset averages stage **7.56**; 15 such cases began by stage five.
Zero successes out of 128 continuations still permits a true win probability of roughly 2.3%
at a one-sided 95% bound. Do not auto-end a game just because this heuristic says zero.
Three actually winning games had a <=5% checkpoint; none had a zero-observed-win checkpoint.

The Doctor was unavailable at **89/131** low-hope onsets and **67/77** zero-recovery onsets.
That is an association, not a causal estimate: crew injury, oxygen and lost systems co-occur.

### What visible warning signs mean

Mean estimated win chance across sampled checkpoints (not independent games):

| Condition | Checkpoints | Mean recovery chance |
|---|---:|---:|
| Only 1–2 crew alive | 164 | 0.72% |
| Oxygen already zero | 377 | 11.5% |
| No healthy crew | 584 | 14.3% |
| Doctor injured/dead | 1,377 | 19.6% |
| Course Error 2 | 326 | 30.3% |

None except immediate game-over rules establishes certainty. In particular, Course Error 2 is
recoverable through navigation; oxygen depletion and loss of healing are stronger signs of a
long, low-hope slide. The current system can leave players nursing 1–2 survivors with almost no
chance of reaching Earth, without ending promptly.

## Design diagnosis and recommendations

**Early endings are not the main problem. Early loss of hope is.** The flat +3 injury hits on
major failures and +2 on minors apply from the opening hand onward. Injury disables abilities,
especially the only repeatable healer. Later restoration depends on rare crisis rewards or
sacrificing the Medical Bay. Environmental oxygen hits and ongoing penalties then extend the
collapse rather than reliably generating new choices.

Recommendations at the time of this study (#1 since implemented; see follow-up):

1. **Soften early irreversible crew penalties.** Use component loss, limited system damage,
   heat or temporary penalties in Phase I; ramp fatal crew/course consequences toward Return.
2. **Provide a costly but dependable recovery action.** Let resources, a functioning Medical Bay
   or an injured Doctor offer limited stabilization, instead of depending on a healing crisis
   randomly entering the journey subset.
3. **Shorten the final collapse.** At a verifiable severe state, offer a 1–2-crisis lifeboat /
   last-chance return decision. Do not substitute an opaque probability-based instant defeat.
4. Retune to ~25% overall wins using late-game pressure, while separately tracking early defeats
   and sustained low-recovery delay. Win rate alone concealed this problem.

Suggested acceptance targets for the next pass: Phase-I deaths below 2%; fewer than 20% of losses
spending >=2 stages at <=5% estimated recovery; and average zero-observed-recovery delay below
1–2 stages. These are proposed design goals, not achieved metrics.

## Reproduction and checks

```sh
node tools/test-game.cjs
node tools/test-simulation.cjs
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage \
  --commitment-cost 0.5 --flat-injuries --recovery-games 300 --recovery-rollouts 128 \
  > docs/simulations/duration-and-recovery.json
```

The recovery study takes several minutes. Raw distributions, state summaries, continuation
counts and engine hash are saved in that JSON. `tools/recovery-summary.cjs` calculates population
SD and classifies sustained tails separately from temporary low-hope episodes.
Simulation tests verify mean/SD calculations, exclude temporary dips and recovered winners,
and ensure counterfactual probes do not contaminate real-game durations or failure counts.
