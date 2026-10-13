# BUG: Route-decision softlock — closing Help or the difficulty dialog strands the run

**Status: FIXED** — user-facing Close/Cancel now goes through `dismissModal()`, which
restores the Trajectory Decision when closed over it; internal callers keep the plain
`closeModal()`. The stale Resolve button in route step is also disabled (was M4 in
[005](005-minor-issues.md)). Regression test in `tools/test-missions.cjs` ("A trajectory
decision is a blocking state"); all 18 suites pass.

**Severity:** Medium (UI softlock; the run cannot continue without Restart/New Game)
**File:** `index.html` — `closeModal()`, `showHelp()`, `requestDifficulty()`,
`showRouteModal()`, `render()`

## Summary

At a phase boundary the game enters `step === "route"` and shows the Trajectory Decision
modal. That modal has no Cancel/Close button — the player must pick a route. However,
while it is open the player can click **Help / Rules** (or change the **Difficulty**
selector) in the header. That replaces the modal's content, and closing it
(`data-act="closemodal"` → `closeModal()`) merely hides the overlay. Nothing re-renders,
so the route modal never comes back.

In `step === "route"` every other control is inert:

- `setMode`, `crewClick`, `cardClick`, `reqClick` all return early (no `G.crisis`).
- `cannibalise`, `repair`, `patch` return early (`G.step !== "respond"`), and the
  Tableau renders no action buttons in route step anyway.
- `resolveCrisis` no-ops (`!G.crisis`); the Resolve button is even left enabled
  (see below) but does nothing.
- The DEBUG toggle only calls `renderFitness()`, not `render()`.

Result: the route choice is unreachable. The only escape is Restart Game or New Game —
the run is effectively lost.

`showRouteModal` is only ever called from `render()`, and no code path in route step
calls `render()`.

## Reproduction (in browser)

1. Play until the Phase I → II trajectory decision modal appears.
2. Click **Help / Rules**, then **Close**.
3. The modal disappears; no route choice is available anywhere; all buttons are dead.

## Recommended fix

Make `closeModal` restore the blocking modal for blocking game states:

```js
function closeModal(){
  $("modalOverlay").classList.remove("show");
  if(G)G.missionKeep=[];
  if(G&&G.step==="route"&&!G.over)showRouteModal();
}
```

(Do **not** symmetrically re-open the game-over modal — "View the wreckage" must stay
dismissed; the Post-mortem button re-opens it.)

Alternative/complementary hardening:

- Disable the Help and Difficulty controls while `G.step === "route"`, or open Help in a
  stacked/secondary overlay instead of replacing the route modal.
- Also fix the stale Resolve button: `renderDrawn()` early-returns in route step without
  setting `$("resolveBtn").disabled = true`, leaving it visually enabled from the
  previous crisis.
- Add a UI test (`tools/test-missions.cjs` style, using the click dispatcher): enter
  route step, dispatch `help`, dispatch `closemodal`, assert the overlay is showing and
  contains the route options.
