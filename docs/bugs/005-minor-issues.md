# Minor issues and inconsistencies (game logic / UI)

**Status: ALL FIXED** — M1 (Cargo Bay `s:null`), M2 (cancellable Commander/Engineer,
with a "Cancel targeting" label), M3 (totals bar mirrors the cheapest-arm surplus rule),
M5 (redline log credits crisis damage), M6 (dead code removed: unused computeTotals in
`contribText`, `flags.routeTarget`, `flags.reentrySuccess`, shadowed `names.damageSystem2`).
One tooling fix: `tools/capability-demand.cjs` guards `format(s.s)` for the now-`null`
sacrifice. Regression tests in `tools/test-game.cjs`; the three archived-engine fidelity
suites codify the intentional Cargo Bay change instead of touching the frozen snapshots.
All 18 suites pass.

Lower-severity findings from the same review, kept for the record. Each was small; they
were grouped here so the higher-severity bugs got their own files.

---

## M1. Cargo Bay can be "Sacrificed" despite "Has no use modes" — and it's a trap

`SYSTEM_DEFS` gives Cargo Bay `s:{}` (empty object) with `sfx:{components:3}`.
`setMode`/`canS` only reject Sacrifice when `s.def.s == null`, and `{}` is not null, so
the Sacrifice button is enabled. The effect: destroy the Cargo Bay (losing Mission Data
via `destroySys`) for **3 random** components (`applyEffects` → `gainRandomComponents`).

Cannibalising the same card yields **3 Wiring** (`yield3: true`) — typed, not random —
for the same destruction and the same Mission Data loss. Sacrifice is therefore strictly
worse than Cannibalise, costs a crisis commitment, and contradicts the blueprint's own
"Has no use modes" text.

**Fix:** set `s:null` on Cargo Bay (and drop the now-dead `sfx`), or, if a sacrificial
"strip the cargo pods" option is intended, change the description/tooltip to say so and
consider making the yield typed like cannibalisation.

## M2. Systems Engineer / Commander abilities cannot be cancelled once armed

`crewClick('syseng')` and `crewClick('cmdr')` set `c.used = true` immediately and wait
for a target (`pendingSE` / `pendingCmdr`). Clicking the crew button again does nothing
(`c.used` early-return), so a misclick — or arming the Engineer with no Damaged drawn
system in play — burns the ability for the crisis. System Specialists, by contrast, can
toggle off (`G.pendingSpecialist===id?null:id`).

**Fix:** allow toggling: if `pendingSE` and the player clicks the Systems Engineer
again, clear `pendingSE` and refund `c.used=false` (same for `pendingCmdr`). Optionally
also disable the Engineer's button when no Damaged system is in the current draw.

## M3. Totals bar understates surplus Cooling for OR cards with CLG in the primary arm

Resolution computes surplus cooling against the **cheapest** arm
(`clgMin = Math.min(...arms.map(a=>a.CLG||0))`), but the display in `renderDrawn` uses
only the primary arm: `Math.max(0,(t.CLG||0)-(C.req.CLG||0))`. For WARM BUS
(req `CLG 2`, alt `NAV 3`) the resolution correctly treats all Cooling as surplus
(cheapest arm needs 0), while the totals line shows `COOLING −(total−2) HEAT`. Cosmetic
only — resolution is right, the hint is wrong.

**Fix:** mirror the resolution formula in `renderDrawn`:
`const arms=[C.req,...(C.alt?[C.alt]:[])]; const surplus=Math.max(0,(t.CLG||0)-Math.min(...arms.map(a=>a.CLG||0)))`.

## M4. Resolve button left enabled during the Trajectory Decision — FIXED with bug 004

`renderDrawn()` early-returns when `G.step==="route"` before reaching
`$("resolveBtn").disabled = G.step!=="respond"`, so the button keeps its previous
(enabled) state behind the modal. It is harmless (`resolveCrisis` no-ops without a
crisis) but confusing, and it contributed to the softlock in
[004-route-modal-softlock.md](004-route-modal-softlock.md).

**Fix (applied with bug 004):** the route-step early return now sets
`$("resolveBtn").disabled=true` before returning.

## M5. Mid-resolution destruction produces misleading log attributions

If a crisis's failure effect Damages a system that the player is Redlining, the later
mode-consequence loop destroys it and logs `"X is DESTROYED by redlining"` — technically
the second damage step, but the log reads as if Redlining alone destroyed an Operational
system. Similarly a system destroyed by `damageRandom` after being Sacrificed is fine
(`destroySys` clears `mode`), but the ordering (failure effects → mode consequences)
means one crisis can both damage *and* destroy the same redlined system, which deserves
a clearer combined log line.

**Fix:** in the mode-consequence loop, include the system's prior state in the message,
e.g. `"X, already damaged by the crisis, is DESTROYED by redlining."` This is a clarity
fix; the mechanics are self-consistent.

## M7. Route-burn crises hid their Success/Failure consequences — FIXED

`renderCrisis()` suppressed the entire `✗ Failure / ✓ Success` block for route crises
(`c.route ? "" : ...`), so committing to a Direct burn showed only the requirement chips.
The consequences exist and matter (fix 001 made Redline/Sacrifice consequences real on
burns, and the failure removes only 1 journey card).

**Fix (applied):** route crises now render their own consequence line: "✗ Failure: an
engine system is damaged and only 1 journey card is removed." / "✓ Success: 2 journey
cards are removed." plus the standard surplus-Components note. Regression test in
`tools/test-surplus-rewards.cjs`; all 18 suites pass.

## M6. Dead code / dead state (no behavior change)

- `contribText()` computes `const t=computeTotals();` and never uses it (an inline
  comment even acknowledges it). Remove it.
- `G.flags.routeTarget` is initialised and reset but never read — the route target lives
  on the crisis object (`C.target`). Remove it.
- `G.flags.reentrySuccess` is written in `endGame` but never read anywhere.
- `fxText`'s `names` map carries a `damageSystem2` entry that is unreachable (the key is
  handled by an early return above).
