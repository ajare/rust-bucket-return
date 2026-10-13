# Bug reports — game logic review

Findings from a code review of `index.html` (the single-file game engine), verified
headlessly against the real engine via the same `vm` harness the `tools/test-*.cjs`
suites use. All 18 existing test suites pass; none pin the buggy behaviors.

| # | Issue | Severity |
|---|-------|----------|
| [001](001-route-burn-mode-consequences.md) | Route-burn crises skip Redline/Sacrifice consequences — free escalation on Direct burns; published balance sims affected | High — **FIXED** |
| [002](002-forecast-hidden-off-by-one.md) | `forecastHidden` ticks down before it is observed — 1-turn penalties are no-ops, 2-turn hide only one forecast | Medium — **FIXED** |
| [003](003-all-systems-destroyed-no-gameover.md) | "SHIP REDUCED TO A HULK" game-over only fires from `damageRandomSystems`; all other destruction paths leave a zombie run | Medium — **FIXED** |
| [004](004-route-modal-softlock.md) | Opening Help/difficulty during a Trajectory Decision and closing it softlocks the run | Medium — **FIXED** |
| [005](005-minor-issues.md) | Cargo Bay sacrifice trap, uncancellable Commander/Engineer abilities, surplus-Cooling display mismatch, stale Resolve button, log attribution, dead code | Low — **FIXED** (M4 with bug 004) |

Each file contains a reproduction (headless, using the real inline engine), the root
cause, and a recommended fix with regression-test guidance.
