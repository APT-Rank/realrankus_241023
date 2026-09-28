# PLAY — Season Supply Policy Implementation
## AG Execution Prompt v1.1

Execute this stage only.

The purpose is to resolve the Property Model STOP without deleting the future household-based supply model.

---

## 1. Read First

Read:

- `PLAY_PROPERTY_ASSET_MODEL_AND_IA-04D_VERIFICATION_SPEC_v1.0.md`
- `PLAY_PROPERTY_ASSET_MODEL_VERIFICATION_REPORT.md`
- `PLAY_IA-04D_IMPLEMENTATION_REPORT.md`
- current IA-03C / IA-04A / IA-04B verification reports
- Property Master validation
- Research Logging/DLQ verification
- Reliability specification

Then inspect the actual repository.

Do not rely solely on reports.

---

# 2. Critical Product Decision

The Property Asset model is:

> ONE APARTMENT COMPLEX = ONE PLAY PROPERTY ASSET

Identity:

```text
property_id = complex_id = 검색코드
```

DO NOT create multiple Property Assets from household_count.

---

# 3. Critical Supply Decision

Do NOT delete the existing household-based supply calculation.

Instead introduce:

```text
supply_policy
```

Supported values:

```text
FIXED_ONE
HOUSEHOLD_BASED
```

---

# 4. Season 1

Season 1 MUST use:

```text
supply_policy = FIXED_ONE
```

For every eligible NORMAL Property Asset:

```text
total_supply = 1
remaining_supply = 1
```

After a successful Primary purchase:

```text
remaining_supply = 0
```

---

# 5. Future Scalable Model

Preserve the current calculation concept:

```text
household_count × primary_supply_ratio
```

as:

```text
HOUSEHOLD_BASED
```

Example:

```text
household_count = 1,000
ratio = 0.10
→ total_supply = 100
```

Do not execute this policy in Season 1.

---

# 6. Important Architecture Rule

Separate:

```text
Property Asset
```

from:

```text
Season Supply Quantity
```

Property Asset answers:

> What is the economic object?

Supply Policy answers:

> How many instances of that object enter this Season?

Ownership answers:

> Who owns an acquired instance?

Do not collapse these concepts.

---

# 7. PLAY_SEASON

Add/verify:

```text
supply_policy
```

Season 1 example:

```json
{
  "supply_policy": "FIXED_ONE"
}
```

Do not hard-code Season 1 by checking `season_id`.

Use policy configuration.

---

# 8. PLAY_PRIMARY_SUPPLY

Verify/implement Season-specific fields:

```text
season_id
property_id
supply_policy
household_count_snapshot
primary_supply_ratio
total_supply
remaining_supply
```

For FIXED_ONE:

```text
total_supply = 1
```

For HOUSEHOLD_BASED:

```text
total_supply =
  max(1, floor(household_count_snapshot * primary_supply_ratio))
```

Do not retroactively recalculate existing Seasons.

---

# 9. Existing createSeason.ts Conflict

You have already identified logic equivalent to:

```typescript
const household = prop.household_count || 0;
let supply = Math.floor(household * primary_supply_ratio);
if (supply < 1) supply = 1;
```

Do not delete this.

Refactor it into the `HOUSEHOLD_BASED` branch of a single authoritative supply-policy resolver.

Do not duplicate the formula elsewhere.

---

# 10. Suggested Resolver

Implement the equivalent of:

```typescript
resolveSeasonSupply({
  supplyPolicy,
  householdCount,
  primarySupplyRatio
})
```

Expected:

```text
FIXED_ONE
→ 1

HOUSEHOLD_BASED
→ max(1, floor(householdCount × primarySupplyRatio))
```

Unknown policy:

```text
FAIL CLOSED
```

Do not silently fall back.

---

# 11. Primary Market

Primary purchase checks:

```text
PLAY_PRIMARY_SUPPLY.remaining_supply > 0
```

It must NOT directly calculate from:

```text
household_count
```

on every purchase.

Successful Primary purchase atomically:

```text
remaining_supply -= 1
```

Never allow negative remaining supply.

---

# 12. Secondary Market

Secondary Market transfers existing ownership.

It must NOT:

- decrement Primary supply
- increment Primary supply
- recalculate household-based supply
- reference household_count for matching

Required:

```text
Seller ownership
→ Buyer ownership
```

---

# 13. Season Snapshot

At Season initialization:

```text
Property Master
→ snapshot
→ supply policy
→ PLAY_PRIMARY_SUPPLY
```

Once initialized, do not recalculate the Season's total supply because Property Master changed later.

---

# 14. UI

Do not redesign the UI.

Season 1 users should NOT see:

- household_count
- primary_supply_ratio
- FIXED_ONE
- HOUSEHOLD_BASED
- internal supply calculation

Admin/debug verification may expose them.

---

# 15. Tests

Implement/run at minimum:

### S01
FIXED_ONE + household_count 100 → supply 1

### S02
FIXED_ONE + household_count 10,000 → supply 1

### S03
HOUSEHOLD_BASED + 1,000 × 0.10 → supply 100

### S04
HOUSEHOLD_BASED + household_count 0 → supply 1

### S05
Supply policy cannot mutate after Season initialization.

### S06
Changing Property Master household_count does not change existing Season supply.

### S07
Concurrent Primary purchases never make remaining_supply < 0.

### S08
Secondary transaction does not change remaining_supply.

---

# 16. Regression

Run regression for:

- IA-03C BUY
- IA-04A Result
- IA-04B MY WORLD
- IA-04D Secondary Market
- Research Logging/DLQ
- Idempotency
- Reconciliation
- Season Clock
- Security
- Reliability

Do not modify protected economic/reliability semantics.

---

# 17. STOP Conditions

STOP and report if:

- ownership cannot represent the abstraction
- multiple Property IDs are generated from one complex
- Secondary Market depends on household_count
- Economic Engine must change
- a verified contract must be broken
- property_id semantics must change

Do not broad-refactor.

---

# 18. No Simulation

Do NOT run:

- 10 participant
- 100 participant
- L1000
- L10000
- Human Season

This stage is only the Supply Policy implementation and verification.

---

# 19. Required Report

Create:

`PLAY_SEASON_SUPPLY_POLICY_IMPLEMENTATION_REPORT.md`

Include:

- changed files
- policy model
- Season 1 result
- HOUSEHOLD_BASED preservation
- test evidence
- regression evidence
- any migration/compatibility issue
- final verdict

Final verdict must be exactly one:

`READY FOR IA-04D RE-VERIFICATION`

or

`BLOCKED — SUPPLY POLICY CONFLICT`

or

`BLOCKED — TECHNICAL DEPENDENCY`

STOP after the report.
