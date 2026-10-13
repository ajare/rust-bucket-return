# Rust Bucket Return

A solo survival card game in a single HTML file. Your ship is dying far from home; spend it,
system by system, to bring the crew back alive.

**Play:** open `index.html` in any browser. No build, no dependencies.

**GitHub Pages:** in the repository's **Settings → Pages → Build and deployment**, set
**Source** to **GitHub Actions**. Push to `main` (or run **Deploy GitHub Pages** manually
from the **Actions** tab) to publish the game at
https://ajare.github.io/rust-bucket-return/.
The workflow publishes only `index.html`; no build step is needed.

- Every crisis can be solved at Normal, **Redline** (damages the system), or **Sacrifice**
  (destroys it) commitment levels — plus cannibalisation, patching, repair, and crew abilities.
- Crisis progression: Phase I is mostly **either/or**; Phase II mostly **AND/single requirements**;
  Phase III mostly strict requirements with harder loads and late-return scenarios. Requirement
  chips explicitly show AND/OR, with a live indicator of whether resolving would succeed.
- Each run has three fixed crew, one seeded random **Mission Specialist** with a once-per-game
  power, and two random **System Specialists**, drawn from one role per capability. Their +2
  bonuses target drawn, committed systems.
- The drawn operational **Fabricator** can build a system for **4 matching components** instead
  of producing Engineering. New instances join future draws; modular systems allow backup copies.
- Victory and defeat screens include a **post-mortem**: itemised component damage bill, crew
  conditions, and each death's cause, crisis and timing. Reopen it from the header after the game.
- Seeded runs: the current seed is shown in the header; share/replay with `index.html?seed=12345`.
- **Difficulty** offers **Easy / Normal / Hard**, varying only added crisis injury hits.
  Normal preserves the previous injury preset. Changing level asks before starting the same seed;
  New Game and Restart preserve the chosen level. Share with `?seed=N&difficulty=easy|normal|hard`.
  See [Difficulty levels](docs/difficulty.md).
- **DEBUG** (after Restart Game) toggles a live **[0,1] asset fitness** score for the whole system
  pool, crew and component bank. It deliberately ignores draws and world state, and is not a win probability.
- **Simplified ship:** 10 capabilities and 16 initial systems. Compute/Main Computer and
  Medical/Medical Bay are removed; their checks and support roles are redistributed.
  See [Capability simplification](docs/capability-simplification.md) and its
  [measured balance impact](docs/simplification-balance.md).
- **Surplus rewards:** success alone gives no Components. Earn 1 random Component per
  unused point in listed capabilities after paying one satisfied arm; partial OR alternatives count.
  Live readiness previews the payout. See [Surplus Components](docs/surplus-components.md).
- **Smoother system coverage:** every capability has at least two Normal producers.
  Protection now has Habitat backup, Batteries supplies backup Control, and Service Module
  contributes Engineering when Sacrificed—with unchanged fleet output budgets.
  See [Capability distribution](docs/capability-distribution.md).
- **Rebalanced capabilities:** Signal, Detection, Cooling and Navigation get recurring crisis
  checks and two backup system sources each; Power/Engineering are no longer dominant requirements.
  See [Capability rebalance](docs/capability-rebalance.md).
- Rules are in the in-game **Help / Rules** panel.

**Docs:** source design `docs/crippled_spaceship_game_design.pdf` · glossary `CONTEXT.md` ·
decisions `docs/adr/` · [failure-balance results](docs/balance-report.md) ·
[game length and death spirals](docs/duration-analysis.md) ·
[phase-scaled injury study](docs/phase-scaled-injuries.md) ·
[failure track caps](docs/failure-track-caps.md) · [Fabrication and copy limits](docs/fabrication.md) ·
[crew roster and specialists](docs/crew-specialists.md) · [Mission Specialists](docs/mission-specialists.md) · [Post-mortem](docs/post-mortem.md) · [Crisis progression](docs/crisis-progression.md) ·
[original playability compromise](docs/playability-compromise.md) ·
[previous injury/air profile](docs/injury-air-rebalance-profile.md) ·
[first injury reduction](docs/reduced-injuries-profile.md) ·
[pre-reduction loss-cause analysis](docs/loss-cause-analysis.md) · [Asset fitness](docs/asset-fitness.md) ·
[Low-fitness / long-game study](docs/fitness-duration-study.md) ·
[Standalone specialist experiment (not shipped)](docs/standalone-specialists-impact.md) ·
[Historical fixed-reward study](docs/success-component-rewards.md) ·
[Surplus Component rules](docs/surplus-components.md) ·
[Capability rebalance](docs/capability-rebalance.md) ·
[Complete crisis/capability demand map](docs/capability-demand.md).

**Balance checks** (Node, no dependencies):

```sh
node tools/test-game.cjs
node tools/test-difficulty.cjs
node tools/test-fitness.cjs
node tools/test-phases.cjs
node tools/test-capability-rebalance.cjs
node tools/test-capability-simplification.cjs
node tools/test-simplification-study.cjs
node tools/test-distribution.cjs
node tools/test-surplus-rewards.cjs
node tools/test-crew.cjs
node tools/test-specialist-ui.cjs
node tools/test-requirements-ui.cjs
node tools/test-missions.cjs
node tools/test-postmortem.cjs
node tools/test-fabrication.cjs
node tools/test-simulation.cjs
node tools/test-standalone-experiment.cjs
node tools/test-reward-study.cjs
# Historical distribution smoothing comparison (frozen pre-surplus rules):
node tools/distribution-study.cjs --games 10000
# Historical before/after simplification study (frozen archived rules):
node tools/simplification-study.cjs --games 10000
node tools/simplification-study.cjs --ablations --games 10000
# Experimental sweeps add to CURRENT shipped rules; see the study for historical snapshots:
node tools/fitness-study.cjs --games 500
node tools/fitness-study.cjs --mode neighbors --games 500
node tools/fitness-study.cjs --mode lengths --games 500
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage --commitment-cost 0.5
```

The automated policy uses specialist bonuses and heuristic Mission powers, but does not yet plan fabrication;
earlier balance reports predate the current crew roster and phase placement and are historical.
# rust-bucket-return
