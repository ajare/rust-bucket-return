# BUG: Route-burn crises skip Redline/Sacrifice consequences

**Status: FIXED** — mode consequences extracted to `applyModeConsequences()` and applied
on the route branch of `resolveCrisis` before the phase transition; regression tests in
`tools/test-phases.cjs` ("Route burns are real commitments"); all 18 suites pass.
Historical `docs/simulations/*.json` predate the fix and remain stale.

**Severity:** High (gameplay exploit; also invalidates published balance simulations)
**File:** `index.html` — `resolveCrisis()` (route branch)

## Summary

When resolving a Direct-route burn (`INNER SYSTEM SLINGSHOT` / `DIRECT RETURN`), the
`if(C.route){...}` branch returns early, **before** the "mode consequences" loop that
damages Redlined systems and destroys Sacrificed ones. Committing systems to the burn is
therefore free: Redline output without the system becoming Damaged, Sacrifice output
without the system being Destroyed.

Ordinary crises and the terminal RE-ENTRY both apply mode consequences; only route burns
skip them. Note the route branch *does* apply use-heat, sacrifice side-effects (`sfx`),
and surplus-reward Components — only the Redline-damage / Sacrifice-destruction
consequences are dropped. The committed modes are silently discarded when the next
`beginCrisis(true)` → `drawFive()` resets `s.mode` on all systems.

## Reproduction (headless)

```js
a.newGame(); a.G.deck=[]; a.beginCrisis(true); // step becomes "route"
a.routeDirect();                               // route crisis created
a.G.drawn=['engine'];
a.setMode('engine','r');                       // redline the Main Engine
a.resolveCrisis();
a.sys('engine').state                          // => "op"  (expected: "damaged")
```

Sacrifice variant: `a.setMode('engine','s')` leaves the engine `"op"` — expected
`"destroyed"`.

## Root cause

```js
if(C.route){
  ...
  G.crisis=null;beginCrisis(true);return;   // returns before mode consequences
}
...
// mode consequences (unreachable for route crises)
for(const id of G.drawn.slice()){
  if(s.mode==="r"){damageStep(s,"redlining");...}
  else if(s.mode==="s"){destroySys(s,"sacrificed for crisis output");...}
}
```

## Recommended fix

Run the mode-consequence loop for route crises too. The least invasive change is to
hoist the consequence loop above the route branch, e.g. restructure the tail of
`resolveCrisis` so the order for *all* crisis kinds is:

1. heat / sacrifice sfx / surplus Navigation / surplus Components (unchanged, already shared)
2. outcome effects — for route crises: `damageEngine()` on failure + `buildDeck(...)`
3. **mode consequences (Redline damage, Sacrifice destruction, patch/mode cleanup)**
4. `if(G.over)` guards, then phase transition / `beginCrisis(true)` / `endGame(...)`

Keep the existing `G.over` checks between steps. Care: the route branch currently does
`G.phase=target` and logs the phase banner before consequences would run — either order
is acceptable, but consequences should resolve against the pre-transition state for
clarity, and `G.crisis=null` + `beginCrisis(true)` must remain last.

## Impact beyond gameplay

`tools/simulate.cjs` commits Redline/Sacrifice modes during route burns (its option
generator prices them with a commitment cost, but the engine never applies the damage).
Every published result in `docs/simulations/*.json` and the balance documents derived
from them was therefore produced with free escalation on route burns. After fixing,
re-run the benchmark suites (`tools/simulate.cjs`, distribution/fitness studies) before
trusting prior win-rate claims.

Add a regression test (e.g. in `tools/test-game.cjs` or `test-phases.cjs`): commit a
Redline and a Sacrifice to a successful and to a failed Direct burn, and assert the
systems end up Damaged / Destroyed respectively.
