# Smoother system capability distribution

The distribution remains shipped, but the balance measurements below precede the subsequent
[Surplus Component reward rule](surplus-components.md). The study is frozen to its archived
pre-surplus engines; those win rates do not describe the later reward change.

The current ten-capability/sixteen-system fleet redistributes output to remove the last
Normal single-source capability and improve Control/Engineering backup coverage. It does
**not** increase the original fleet's combined output for **any capability at any commitment**.
No crisis thresholds, crew powers (including Doctor), Life Support passive, component costs,
copy limits, heat costs, injury rules or fitness weights changed.

## Output changes

Values are Normal / Redline / Sacrifice; unlisted capabilities remain unchanged.

| System | Before | Current |
|---|---|---|
| Radiation Shielding | PRO 3 / 6 / 8 | **PRO 2 / 4 / 6** |
| Habitat | No capability output | **PRO 1 / 2 / 2** |
| Navigation Computer | CON 1 / none / none | **No Control output** |
| Batteries | No Control output | **CON 1 / 1 / none** |
| Manoeuvring Thrusters | CON 2 / 5 / 6 | **CON 2 / 4 / 6** |
| Fabricator | ENG 2 / 5 / 5 | **ENG 2 / 5 / 4** |
| Service Module | ENG 1 / 4 / none | **ENG 1 / 4 / 1** |

Habitat now has active Normal/Redline/Sacrifice modes. Normal/Redline Protection must be
committed; Crew Capacity is not a passive Protection bonus. Redline damages the Habitat;
Sacrifice destroys it and **still absorbs the next two injury hits**. It remains single-copy.

Batteries still generate no Heat and remain subject to power-system SCRAM restrictions.
Their Sacrifice is Power-only: a Pilot cannot boost a mode that produces no Control.
Navigation Computer retains Navigation/Detection, but is no longer a Pilot target.

Service Module Sacrifice now provides **ENG 1 plus three Components**, not Cooling or Life
Support. Normal/Redline Life Support and Cooling outputs are unchanged. Fabricator Sacrifice
still yields three Components and SIG 3, alongside ENG 4; construction still produces nothing.

## Coverage after smoothing

| Capability | Normal sources | Redline sources | Sacrifice sources | Fleet totals N / R / S |
|---|---:|---:|---:|---|
| Power | 4 | 4 | 4 | 8 / 19 / 27 |
| Thrust | 2 | 1 | 2 | 4 / 7 / 14 |
| Control | 2 | **2** | 1 | 3 / 5 / 6 |
| Engineering | 2 | 2 | **2** | 3 / 9 / 5 |
| Navigation | 3 | 3 | 3 | 5 / 10 / 14 |
| Signal | 3 | 3 | 3 | 5 / 10 / 14 |
| Detection | 3 | 3 | 3 | 5 / 10 / 14 |
| Life Support | 2 | 2 | 1 | 4 / 8 / 8 |
| Cooling | 3 | 3 | 2 | 5 / 10 / 11 |
| Protection | **2** | **2** | **2** | 3 / 6 / 8 |

All ten capabilities now have at least **two Normal producers**. Most have two or three;
Power retains four because those sources are the ship's reactor/reserve-power identity.
Coverage is smoother, not identical: specialist bonuses, draw constraints, damage rounding,
mode restrictions, side effects and crisis demand still differ.

Some concentrated emergency outputs remain deliberate. Thrusters retain **CON 6 at Sacrifice**
so Re-entry Vector Trim's CON 6 + THR 4 check is not forced to draw a second Control producer.
Main Engine alone supplies Redline Thrust; Life Support alone supplies Sacrifice LFS and the
oxygen passive. Cargo Bay remains the only system with no capability output.

## Matched-seed balance check

**10,000 games per difficulty per ruleset**, same seed indices starting at 2,100,000,
`salvage` policy and commitment cost 0.5. The exact pre-smoothing source was archived before
editing, and its 30,000 outcomes, durations, fitness rows and aggregate failure/loss metrics
exactly reproduced the preceding simplification study. Opening rosters, decks and system
draws are unchanged for a given seed; policy choices and later RNG paths can diverge.

| Difficulty | Before smoothing | After smoothing, before surplus | Change | Approx. paired 95% interval |
|---|---:|---:|---:|---|
| Easy | 60.33% | **59.44%** | −0.89 pp | −1.47 to −0.31 pp |
| Normal | 51.56% | **50.84%** | −0.72 pp | −1.34 to −0.10 pp |
| Hard | 14.34% | **13.69%** | −0.65 pp | −1.14 to −0.16 pp |

Ordinary playable-response means change by only **−0.006 / −0.008 / −0.0234** (Easy/Normal/Hard).
Normal ordinary crisis failure rate is essentially unchanged: **43.35% → 43.35%**
(excluding route burns and final Re-entry). This is a small but measurable overall tightening,
not a claim of exact balance neutrality or human/optimal win rates.

Normal card-level effects, conditional on encounter state:

- Wheel Speed Fault: **26.83% → 14.88%** failure.
- Valve Chatter: **25.00% → 14.70%**.
- Ephemeris Update: **25.29% → 15.04%**.
- Solar Weather Watch: **16.34% → 12.14%**.
- Radiation Storm: **57.79% → 60.94%** — peak Protection is more costly to concentrate.
- Chute & Recovery Deploy: **86.28% → 89.49%** — Engineering Sacrifice is less concentrated.
- Re-entry Vector Trim: **77.21% → 77.40%** — retaining CON 6 avoids the major late-check regression.
- Final Re-entry: **95.77% → 96.43%**. Emergency landing can still win; clean recovery remains rare.

Two earlier candidate splits were measured and rejected before settling this distribution.
Splitting Thrusters' Sacrifice Control to 4 + Batteries 2 drove Normal Vector Trim failures
to **93.27%** and Re-entry failures to **99.27%**. A 5 + 1 split still worsened those checks
substantially. Keeping full emergency CON 6 is a deliberate exception to mode-by-mode uniformity.
Candidate engines and summaries are preserved as `distribution-{first,second}-candidate-*`.

Equal fleet totals do not imply equal per-hand or single-card thresholds; this is why the
final choice preserves key primary outputs rather than chasing uniformity in every mode.
The earlier Doctor/Service Life Support buffs remain untouched, so smoothing does **not**
restore pre-simplification difficulty. This policy still does not plan fabrication.

## Verification and reproduction

All **18 regression suites** pass. `tools/test-distribution.cjs` locks conservation of every
per-capability/per-mode total, exact coverage, unchanged rules and openings, specialist targets
(including halved one-point outputs), invalid mode guards, SCRAM, Habitat's active UI/mode
consequences, shelter protection, Service Components and baseline study reproduction.

```sh
node tools/test-distribution.cjs
node tools/distribution-study.cjs --games 10000
```

Raw reports: `docs/simulations/distribution-{before,after}-{easy,normal,hard}.json`.
Paired summary and source lists: `docs/simulations/distribution-summary.json`.
Exact prior engine/simulator: `docs/simulations/distribution-before-{engine.html,simulator.cjs}.txt`.
Current full output catalogue: [Capability demand](capability-demand.md).

The smoothed engine is archived as `surplus-before-engine.html.txt`; this distribution study
now uses that source rather than the live surplus-reward engine.

The [earlier simplification balance study](simplification-balance.md) is now frozen to its
archived initial simplified engine, so rerunning it cannot silently measure these later changes.
