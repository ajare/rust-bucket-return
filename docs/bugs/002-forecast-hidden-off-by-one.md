# BUG: `forecastHidden` decrements before it ever hides anything (off-by-one)

**Status: FIXED** — the tick moved from `consume()` to the resolution of the crisis whose
forecast was hidden (before that resolution's own failure effects; route burns returned
earlier never tick). Regression tests in `tools/test-missions.cjs` ("Sensor blinding hides
exactly the next N forecasts"); all 18 suites pass.

**Severity:** Medium (a whole class of failure penalties is weaker than designed;
1-turn penalties are complete no-ops)
**File:** `index.html` — `consume()` and `renderCrisis()`

## Summary

`G.flags.forecastHidden` is decremented in `consume()`, which runs at the **start** of
the next crisis (inside `beginCrisis(true)`), *before* the forecast for that crisis is
rendered. The penalty therefore expires one turn too early:

- `forecastHidden: 1` (SENSOR GLINT, PATCHED FIRMWARE, STATIC STORM, DISTANT HAIL) hides
  **zero** forecasts — the penalty does nothing at all.
- `forecastHidden: 2` (SENSOR FAULT ALARM, SIGNAL INTERFERENCE) hides **one** forecast,
  not two.

The card text ("forecast lost for N turns", `fxText`) and the log message promise N
hidden forecasts.

## Reproduction (headless)

```js
a.newGame();
a.G.crisis={id:'t',cat:'ELECTRICAL',title:'T',flavor:'',req:{POW:1},fail:{forecastHidden:1},win:{}};
a.G.drawn=[];                 // force failure
a.resolveCrisis();            // fail effects apply, then beginCrisis(true) consumes
a.G.flags.forecastHidden      // => 0 — the next forecast is fully visible
```

## Root cause

```js
function beginCrisis(doConsume=true){
  ...
  if(doConsume)consume();if(G.over)return;   // consume() decrements forecastHidden HERE
  G.crisis=G.deck.shift();
  ...
  render();                                   // forecast rendered AFTER the decrement
}
```

```js
function consume(){
  ...
  if(G.flags.forecastHidden>0)G.flags.forecastHidden--;   // ticks before it is ever observed
}
```

Sequence for a 1-turn penalty: fail at turn N sets flag to 1 → the immediately following
`beginCrisis(true)` calls `consume()` (flag 1→0) → crisis N+1 renders with the forecast
visible.

## Recommended fix

Decrement at end of turn instead of start: move
`if(G.flags.forecastHidden>0)G.flags.forecastHidden--;` from `consume()` into
`resolveCrisis()` (after the outcome is applied, alongside the per-crisis cleanup), or
equivalently decrement it in `beginCrisis` *after* the new crisis has been rendered.
Either makes `forecastHidden: 1` hide exactly the next crisis's forecast.

Check interactions when fixing:

- Dr. Nasser's one-card reveal (`revealedNext`) deliberately bypasses blinding via
  `oneReveal` — unaffected by where the counter ticks.
- Dr. Chen's `exactForecast` is intentionally still suppressed while the flag is > 0
  ("Sensor-blinding penalties still temporarily hide forecasts") — also unaffected.
- Route decisions don't call `consume()`; with the decrement in `resolveCrisis` the
  counter behaves identically across phase boundaries.
- `tools/test-missions.cjs` sets the flag directly and only asserts render behavior, so
  no existing test pins the buggy timing — but add one: fail a `forecastHidden: 1`
  crisis and assert the *next* crisis renders "SENSORS BLIND", and the one after does
  not.
