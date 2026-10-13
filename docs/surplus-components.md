# Components from surplus responses

**Shipped rule:** success alone gives **zero Components**. A successful capability check grants
**one independently random typed Component per unused point in listed capabilities after
paying one satisfied requirement arm**. For OR checks, this includes output toward partially
fulfilled alternatives.
All ten fixed authored success grants (nine 1-part grants and Fabricator Jam's 2-part grant)
are removed. Other success benefits—Oxygen, healing, course correction, repair and clearing
penalties—remain unchanged.

## Counting rewards

Count output in the union of capabilities mentioned by either arm, once per capability.
For each complete satisfied requirement arm, subtract only that arm's requirements:

```text
listedOutput = sum(output[capability]) over distinct capabilities in either arm
surplus = listedOutput - sum(requirements of one satisfied arm)
reward = greatest surplus among satisfied arms, or zero if none are satisfied
```

For a single-arm check this remains ordinary excess above its requirements. For OR checks,
all unused output toward the other arm counts, even when that arm is incomplete.

- **Exact match:** ENG 5 against ENG 5 → **0 Components**.
- **Single capability:** ENG 7 against ENG 5 → **2 random Components**.
- **Compound:** ENG 6 + SIG 4 against ENG 4 AND SIG 3 → **3 random Components**.
- **Unrelated output:** additional Cooling in that compound check contributes **nothing**.
- **Partial OR alternative:** POW 2 + DET 2 against POW 3 OR DET 2 → **2 Components**:
  Detection resolves the check and both Power points are unused.
- **Both OR arms satisfied:** POW 5 + ENG 7 against POW 4 OR ENG 3 → **9 Components**:
  pay ENG 3 once, leaving POW 5 + ENG 4. Do not pay both arms.
- **Shared capability:** POW 3 + ENG 1 + DET 2 against (POW 3 AND ENG 2) OR
  (POW 2 AND DET 2) → **2 Components**, from unused POW 1 + ENG 1; Power is counted once.
- **Failure:** POW 2 + DET 1 against POW 3 OR DET 2 → **0 Components**. Partial output
  cannot resolve the check, regardless of the sum across capabilities.
- **Unrelated output:** additional Cooling in those OR checks contributes **nothing**.

There is no arbitrary payout cap and no payout for failure. Each Component independently draws
Electronics, Wiring or Power Cell from the seeded random generator; repeated types are allowed.
Zero surplus consumes no reward randomness. Reading the preview or calculating surplus does
not mutate state or consume randomness.

## Scope and timing

- Includes ordinary crises, successful **Direct-route burns**, and **final Re-entry**.
- Safe routes have no capability check and no reward.
- Uses the committed capability totals captured for resolution, including crew bonuses,
  damaged output after rounding, patches and Systems Engineer restoration.
- Awards once per response; Re-entry rewards enter inventory **before final scoring**.
- Surplus Cooling still offsets heat and surplus Navigation still corrects Course Error;
  the new reward does not spend or disable those effects.
- Mission grants, cannibalisation, Sacrifice yields, opening reserves, costs and failure losses
  remain independent and unchanged. An exact-match Service Sacrifice still yields its three
  Components even though it earns no surplus reward.

The crisis readiness indicator shows the **current surplus payout**, including zero. The
Success line explains the rule alongside any non-Component benefit; Help covers OR counting,
crew output and route/Re-entry scope.

## Implementation and validation

`crisisSuccessComponents(crisis, totals)` is the shared pure calculation used by the live
preview and `awardSurplusComponents`. Resolution awards once on the successful path before
route progression or final scoring. The effect interpreter's other component sources remain
unchanged.

All **18 regression suites** pass. `tools/test-surplus-rewards.cjs` covers authored-grant removal
on all difficulties, single/compound/overlapping OR checks, partial alternatives, ignored outputs, failed checks, an
exhaustive small OR oracle, uncapped surplus, exact RNG draws and independent types, pure
previews, crew/damage/patch totals, other success effects, other income, routes, scored Re-entry,
finished-game guards and same-seed replay.

The simulator reports `successComponentRewards`: successful checks, positive awards and
actual gained tokens, split into ordinary/route/Re-entry kinds. It verifies inventory changes
against returned rewards, excludes recovery probes from the ledger, and adds no game-state
fields or additional randomness. Archived engines without this rule report the ledger disabled.

A **500-game smoke run per difficulty** using the clarified partial-OR rule, seed indices starting at 2,100,000, `salvage` policy,
commitment cost 0.5, completed with:

| Difficulty | Surplus Components per game | Positive surplus awards per game |
|---|---:|---:|
| Easy | 9.944 | 5.410 |
| Normal | 9.936 | 5.474 |
| Hard | 8.692 | 4.878 |

These validate the implementation, not balance equivalence or human win rates. The heuristic
still chooses commitments primarily for survival/cost and **does not deliberately maximize
surplus payouts**, including unused crew bonuses. It also does not plan fabrication. Human
income from deliberately oversupplying requirements may be much higher. More random draws
change later decks/hands relative to older rules; same-seed replay is reproducible only within
the new ruleset, not promised against older runs.

```sh
node tools/test-surplus-rewards.cjs
node tools/simulate.cjs --games 500 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --difficulty normal --fitness-rows
```

Smoke data: `docs/simulations/surplus-smoke-{easy,normal,hard}.json`.
Exact pre-rule engine/simulator: `docs/simulations/surplus-before-{engine.html,simulator.cjs}.txt`.
Historical distribution/fixed-reward studies use frozen pre-surplus sources, not the live rule.
