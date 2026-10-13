# Balance impact of removing Compute and Medical

This measures the initial ten-capability/sixteen-system simplification **before** subsequent
[distribution smoothing](capability-distribution.md). The study is frozen to that archived
engine; the figures below do not include the later redistribution.

## Verdict

The ten-capability/sixteen-system simplification **makes the game substantially easier** under
its existing automated policy. It is not balance-neutral. Normal moves from roughly two wins
in five to one in two; Hard more than doubles its win rate but remains punishing. The easing
cannot be attributed to vocabulary reduction alone: the crew/oxygen support buffs are major levers.
No gameplay retuning was applied during this study.

## Matched-seed comparison

**10,000 games per difficulty per ruleset: 60,000 games total.** Same seed indices starting at
2,100,000, `salvage` policy, commitment cost 0.5, shipped phase lengths, reserves and injury
presets. Paired intervals use per-seed differences, approximately 95% confidence.

| Difficulty | Before wins | After wins | Change | Approx. 95% interval for change | Mean ordinary responses, before → after |
|---|---:|---:|---:|---|---:|
| Easy | 50.06% | **60.33%** | **+10.27 pp** | +8.90 to +11.64 pp | 22.524 → 22.710 |
| Normal | 40.84% | **51.56%** | **+10.72 pp** | +9.34 to +12.10 pp | 22.281 → 22.510 |
| Hard | 6.50% | **14.34%** | **+7.84 pp** | +7.00 to +8.68 pp | 18.376 → 19.458 |

Normal duration increases **0.229 responses** [0.180, 0.277]; Hard increases **1.083**
[0.995, 1.170]. Ordinary-response counts include final Re-entry but exclude route burns.
The principal change is survival probability, not dramatically longer Easy/Normal games.

### Failure pressure

Ordinary crisis failure rates below exclude both route burns and final Re-entry. They count
**all seen cards**, including cards that never failed, rather than only the failure list.

| Difficulty | Before failure rate | After failure rate |
|---|---:|---:|
| Easy | 52.00% | **43.39%** |
| Normal | 51.91% | **43.35%** |
| Hard | 50.00% | **42.37%** |

Normal outcomes per 10,000 runs:

| Loss cause | Before | After |
|---|---:|---:|
| All crew lost | 4,784 | **3,850** |
| Of those, suffocation-triggered losses | 2,392 | **1,930** |
| Trajectory missed | 1,115 | **978** |
| Ship reduced to a hulk | 17 | **16** |
| Defeat in Transit | 832 | **572** |

Suffocation is a subset of crew losses, not an additional category. On Hard, Transit defeats
fall from 6,313 to 4,723; more runs reach Return, so late losses can increase even while overall
survival improves. Longer survival changes which crises are encountered and in what condition.

## What changed the pressure

### 1. Free Life Support from the Doctor removes early oxygen decisions

The Doctor's healthy/no-injury fallback changed from +2 Medical to **+2 Life Support**.
Scrubber Overdrive needs LFS 2, so that fallback alone resolves it. Scrubber Saturation needs
LFS 3, so Doctor plus Commander can resolve it without committing a system. These are unchanged
crises benefiting from the new general-purpose bonus:

| Normal crisis | Before failure rate | After failure rate |
|---|---:|---:|
| Scrubber Overdrive | 20.98% | **0.14%** |
| Scrubber Saturation | 29.02% | **0.15%** |
| Oxygen Scrubber Failure | 78.80% | **60.34%** |
| Cabin Pressure Drop | 76.33% | **61.59%** |

Thus the support buff reduces recurring oxygen penalties as well as resolving formerly
Medical checks. This is broader than a vocabulary substitution.

### 2. Service Module supplies a second Life Support source

The added LFS 1/2 backup, together with merging crew-support checks into the already-protected
Life Support system, improves crew and oxygen outcomes. Crew Illness failures fall **74.84%
→ 52.21%**, Zero-G Adaptation Sickness **75.61% → 47.78%**, and Crew Fatigue **95.95%
→ 67.22%**. The backup has no oxygen passive, but preventing failures still preserves Oxygen.

### 3. Computing bottlenecks become more flexible

Precision Navigation changes from NAV/CMP to NAV/DET; its Normal failure rate falls **91.67%
→ 58.28%**. Fabricator Jam changes from ENG/CMP to ENG/SIG, while Fabricator now supplies
both Engineering and Signal; failures fall **90.66% → 62.34%**. Equal total thresholds do not
imply equal difficulty when one commitment can satisfy multiple requirements.

### 4. Fewer systems and specialists concentrate draws

For an intact original fleet, a particular system's chance of appearing in a five-card hand
rises from **5/18 = 27.78%** to **5/16 = 31.25%**. A particular capability specialist's chance
of joining the two-person selection rises from **2/12 = 16.67%** to **2/10 = 20%**.
These are opening-pool probabilities, not measured late-run draw frequencies or isolated
causal effects. Destruction, backups and changed RNG paths affect later exposure.

## Some bottlenecks remain or worsen

Signal mentions increase **15 → 20**, with unavoidable checks **5 → 9**, despite total Normal
Signal production staying at 5. Supply is redistributed, not universally improved.

| Normal crisis | Before failure rate | After failure rate |
|---|---:|---:|
| Communications Acquisition | 51.15% | **63.08%** |
| Recovery Beacon | 49.72% | **55.02%** |
| Wheel Speed Fault | 19.51% | **26.83%** |
| Valve Chatter | 18.77% | **25.00%** |

These observed rates also reflect changed fleet condition and policy decisions; they are not
standalone card-difficulty experiments. Main Computer's flexible Normal Control was moved
to Navigation Computer, which changes which combinations of capabilities are available.

GNC Final Alignment still fails **92.81%**, Life Support Contamination **91.70%**, and final
Re-entry **95.77%** under this policy. Failed Re-entry can still yield emergency-landing victory.
The headline win rate therefore does not imply frequent clean spacecraft recovery.

## One-at-a-time ablations: 30,000 additional Normal games

Each experiment removes **one added support effect** from the simplified rules. Same 10,000
seeds, policy and costs; all other simplified rules remain. These are analysis-only variants,
not shipped changes.

| Variant | Normal win rate | Difference from simplified 51.56% | Approx. 95% interval |
|---|---:|---:|---|
| Doctor heals only; no healthy free +2 LFS | **43.53%** | **−8.03 pp** | −8.84 to −7.22 pp |
| Remove Service Module's LFS output | **44.21%** | **−7.35 pp** | −8.07 to −6.63 pp |
| Remove Fabricator's secondary Signal | **50.61%** | **−0.95 pp** | −1.68 to −0.22 pp |

This establishes that the two support buffs are major levers. Their effects interact:
**do not add these drops together** as a decomposition of the total before/after change.
Removing Fabricator Signal substantially worsens Fabricator Jam (62.34% → 77.47% failure)
but has a comparatively small effect on overall victory in this policy.

### Recommendation

If the goal is simplification **without the large easing**, test **Doctor heals only** first.
It retains ten capabilities, sixteen systems, crisis healing, Mission healing and Service's
backup Life Support, while returning Normal to **43.53%**, nearer its earlier **40.84%**.
It also restores some early oxygen decisions: Scrubber Overdrive and Saturation failures
return to 15.77% and 16.84%, respectively, rather than being nearly automatic successes.

Removing Service's LFS output is another strong lever, but leaves the Doctor-driven automatic
early resolutions intact. Do not remove both at once without measuring the interaction.
The ablations above cover Normal only; a proposed retune still needs Easy/Hard validation.
No retune is implemented here.

## Method, provenance and limitations

The exact post-rebalance/pre-simplification source was not archived when simplification shipped.
The baseline was therefore reconstructed **in a temporary workspace** from the earlier archived
engine, restoring the documented post-rebalance output vectors and crisis requirements. Its
**every per-seed outcome, duration and fitness value** matched the preserved pre-simplification
benchmark for all 30,000 baseline games. Aggregate durations, losses, failure counts and
suffocation counts also matched exactly. The archived reconstructed source has different text
and a different SHA from the former live page; it is a verified rules reconstruction, not a
claim to have recovered the byte-identical original file.

Both rulesets use the **same simulator**, which derives vector dimensions from live
capabilities. Only exposure reporting was added during this study; gameplay is unchanged.
Matched seeds are **not fixed crews or decks**: reducing the specialist pool changes RNG
consumption. The experiment measures the whole shipped change, including those selection effects.

This is one heuristic policy, not optimal/human play. It does not plan fabrication, and repair,
Mission timing and future-crisis choices remain heuristic. Later-card failure rates are
conditional on survival and encounter state. Absolute asset fitness and low-fitness duration
are **not directly comparable** because removing two blueprints changes normalization and
weights in the fleet denominator. Winning scores also have changed available system/data points.
No claim of proven death-spiral recovery is made.

Reproduce:

```sh
node tools/simplification-study.cjs --games 10000
node tools/simplification-study.cjs --ablations --games 10000
node tools/test-simplification-study.cjs
```

The initial simplified engine is archived as `docs/simulations/distribution-before-engine.html.txt`.
The study and its ablations use this frozen source rather than the now-smoothed live page.

Raw reports and paired summaries: `docs/simulations/simplification-{before,after}-{easy,normal,hard}.json`,
`simplification-summary.json`, `simplification-ablation-*.json`.
Reconstructed baseline: `docs/simulations/simplification-before-engine.html.txt`.
