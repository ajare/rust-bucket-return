# BUG: "All systems destroyed" game-over only fires on `damageRandom` path

**Status: FIXED** — the hulk check moved into `destroySys()` so every destruction path
ends the run; the redundant per-loop check was removed from `damageRandomSystems()`.
Regression tests in `tools/test-game.cjs` ("Every destruction path ends a hulk"); all
18 suites pass.

**Severity:** Medium (edge case; produces an unwinnable zombie run instead of the
designed loss)
**File:** `index.html` — `damageRandomSystems()`, `destroyRandomSystems()`,
`destroySys()`, `damageStep()`, `scram()`, `damageEngine()`

## Summary

The "SHIP REDUCED TO A HULK" loss exists only inside `damageRandomSystems()`:

```js
if(G.systems.every(s=>s.state==="destroyed"))gameOver(false,"SHIP REDUCED TO A HULK",...);
```

Every other destruction path skips the check. If the **last** surviving System Instance
is destroyed any other way, the game continues with zero systems: every subsequent draw
is empty (`NO SYSTEMS REMAIN.`), every crisis auto-fails, and the run only ends when
Oxygen/Course Error grind it out — turns later, with a misleading loss cause.

Paths that bypass the check:

- `destroyRandomSystems()` — e.g. failing CHUTE & RECOVERY DEPLOY (`destroyRandom: 1`)
  with one system left; RE-ENTRY's `destroyRandom: 2` (harmless there only because
  `endGame` follows anyway).
- `damageStep()` taking a Damaged system to Destroyed — via scram, Redline consequences,
  `damageSystem`/`damageSystem2` failure effects, or a failed route burn
  (`damageEngine()`).
- `cannibalise()` — the player can cannibalise their final system (via the Ship Tableau,
  which offers Cannibalise for *any* operational system, drawn or not) and the run
  continues.
- `destroySys()` generally (also called by Sacrifice consequences).

## Reproduction (headless)

```js
a.newGame();
for(const s of a.G.systems.slice(0,-1)) s.state='destroyed';
a.destroyRandomSystems(1);   // or a.destroySys(last,'x') / a.cannibalise(last.id)
a.G.over                     // => null (expected: the SHIP REDUCED TO A HULK game over)
```

`a.damageRandomSystems(1)` in the same setup *does* end the game — inconsistent.

## Recommended fix

Centralise the check where destruction happens, not at one call site:

```js
function destroySys(s,cause="crisis destruction"){
  if(s.state==="destroyed")return;
  ...
  if(G.systems.every(x=>x.state==="destroyed"))
    gameOver(false,"SHIP REDUCED TO A HULK","Every system is gone. The hull drifts, dark and silent.");
}
```

Notes:

- `gameOver` is idempotent (`if(G.over)return`) and renders immediately, and
  `resolveCrisis` already re-checks `G.over` after effect application, so firing it
  from inside `destroySys` is safe. Mid-resolution destruction of the last system would
  then correctly short-circuit instead of continuing the response.
- `damageStep` destroying the last Damaged system funnels through `destroySys`, so the
  single check covers scram, Redline, named damage and failed route burns too.
- Keep (or remove as redundant) the existing check in `damageRandomSystems`; add the
  same central guarantee and remove duplication.
- Add a regression test covering: `destroyRandomSystems`, `cannibalise` of the final
  system, and `damageStep` on the final Damaged system — each must set `G.over` with the
  hulk title.
