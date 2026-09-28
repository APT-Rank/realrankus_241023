# PLAY Season Supply Policy & Property Asset Model Specification v1.1

**Status:** EXECUTION SPECIFICATION  
**Phase:** Property Asset Model Conflict Resolution  
**Scope:** Property Asset ↔ Season Supply Policy  
**Simulation:** NOT INCLUDED  
**Human Season:** NOT INCLUDED

---

## 1. Objective

The previous verification identified a conflict in `createSeason.ts`:

```text
household_count
→ primary_supply_ratio
→ total_supply
```

This calculation is valid as a **future scalable supply model**, but it must not be the mandatory supply rule for Season 1.

Therefore:

> Do NOT delete the existing household-based supply calculation.

Instead, introduce an explicit **Season Supply Policy**.

This separates:

1. the real-world Property Master data,
2. the PLAY Property Asset,
3. the quantity of that asset exposed in a specific Season.

---

# 2. Core Product Decision

## 2.1 Property Asset

The fundamental PLAY property asset remains:

> **ONE APARTMENT COMPLEX = ONE PLAY PROPERTY ASSET**

Identity:

```text
property_id = complex_id = source 검색코드
```

The Property Asset itself is not multiplied by household count.

---

## 2.2 Season Supply

Supply quantity is a **Season-level simulation parameter**, not an intrinsic Property Master attribute.

Therefore:

```text
Property Master
    ↓
PLAY Property Asset
    ↓
Season Supply Policy
    ↓
Season-specific supply quantity
```

This is the key architectural distinction.

---

# 3. Season Supply Policy

Introduce:

```text
supply_policy
```

with the following supported values.

## 3.1 FIXED_ONE

Purpose:

- Season 1
- early prototype
- low participant count
- controlled experimentation

Rule:

```text
total_supply = 1
```

`household_count` does not participate in the calculation.

---

## 3.2 HOUSEHOLD_BASED

Purpose:

- future large-scale Seasons
- participant population expansion
- more realistic property liquidity

Rule:

```text
raw_supply = household_count × primary_supply_ratio
total_supply = max(1, floor(raw_supply))
```

This preserves the existing supply calculation concept.

---

# 4. Season 1 Fixed Policy

Season 1 MUST use:

```text
supply_policy = FIXED_ONE
```

Therefore every eligible NORMAL Property Asset has:

```text
total_supply = 1
remaining_supply = 1
```

before its first successful Primary purchase.

After successful Primary purchase:

```text
total_supply = 1
remaining_supply = 0
```

The asset is then owned by a participant.

---

# 5. Future Large-Scale Policy

When the product reaches a participant population where a single unit per complex is too restrictive, a future Season may use:

```text
supply_policy = HOUSEHOLD_BASED
```

Example:

```text
household_count = 1,000
primary_supply_ratio = 0.10

raw_supply = 1000 × 0.10
total_supply = 100
```

This does NOT mean the Property Master creates 100 different properties.

It means:

```text
1 Property Asset
+
Season supply quantity = 100
```

The asset identity remains the same.

---

# 6. Why This Separation Is Required

Do not model:

```text
Complex
 ├─ Unit 001
 ├─ Unit 002
 ├─ Unit 003
 ...
```

inside Property Master merely because a Season exposes multiple units.

Instead:

```text
Property Asset
    property_id = complex_id
        │
        └── Season A supply = 1
        └── Season B supply = 100
        └── Season C supply = 250
```

The Season determines market availability.

---

# 7. Required Data Model

## 7.1 PLAY_SEASON

Add or verify:

```text
supply_policy
```

Example:

```json
{
  "season_id": "SEASON_001",
  "supply_policy": "FIXED_ONE"
}
```

Do not hard-code Season 1 behavior directly into property data.

---

## 7.2 PLAY_PRIMARY_SUPPLY

Supply must be Season-specific.

Minimum conceptual fields:

```text
season_id
property_id
supply_policy
household_count_snapshot
primary_supply_ratio
total_supply
remaining_supply
created_at
updated_at
```

### Important

`household_count_snapshot` may be stored for auditability when available.

For `FIXED_ONE`:

```text
household_count_snapshot = source household_count
primary_supply_ratio = configured value or null
total_supply = 1
```

For `HOUSEHOLD_BASED`:

```text
household_count_snapshot = source household_count
primary_supply_ratio = configured ratio
total_supply = max(1, floor(household_count_snapshot × primary_supply_ratio))
```

Do not silently recalculate an existing Season's supply after initialization.

---

# 8. Snapshot Rule

At Season initialization:

```text
Property Master
       ↓
Season snapshot
       ↓
Supply calculation
       ↓
PLAY_PRIMARY_SUPPLY
```

Once initialized, the Season's supply must remain deterministic.

Later changes to Property Master must not retroactively change:

```text
total_supply
remaining_supply
```

for an existing Season.

---

# 9. Season 1 Example

Suppose:

```text
Complex A
household_count = 1,500
```

Season 1:

```text
supply_policy = FIXED_ONE

total_supply = 1
remaining_supply = 1
```

After purchase:

```text
remaining_supply = 0
```

No second Primary purchase is allowed for that Season.

This is intentional.

---

# 10. Future Season Example

Same complex:

```text
Complex A
household_count = 1,500
primary_supply_ratio = 0.10
```

Future Season:

```text
supply_policy = HOUSEHOLD_BASED

total_supply = 150
remaining_supply = 150
```

The Property Asset identity remains:

```text
property_id = Complex A
```

The difference is only the Season-specific supply quantity.

---

# 11. Existing Calculation Must Be Preserved

The existing household-based calculation found in `createSeason.ts` must not simply be deleted.

Existing conceptual logic:

```typescript
const household = prop.household_count || 0;
let supply = Math.floor(household * primary_supply_ratio);
if (supply < 1) supply = 1;
```

must be preserved as the `HOUSEHOLD_BASED` policy implementation.

It must no longer execute unconditionally for every Season.

---

# 12. Required Policy Resolver

Implement a single authoritative policy resolver.

Conceptually:

```typescript
switch (season.supply_policy) {
  case "FIXED_ONE":
    totalSupply = 1;
    break;

  case "HOUSEHOLD_BASED":
    totalSupply = Math.max(
      1,
      Math.floor(
        householdCount * primarySupplyRatio
      )
    );
    break;

  default:
    throw new Error("Unsupported supply policy");
}
```

Do not duplicate this calculation across multiple functions.

---

# 13. Primary Market Semantics

Primary purchase must operate against:

```text
PLAY_PRIMARY_SUPPLY
```

not directly against:

```text
household_count
```

Required:

```text
remaining_supply > 0
```

for Primary purchase eligibility.

Successful purchase:

```text
remaining_supply -= 1
```

Atomicity must be preserved.

Concurrent purchase requests must never reduce:

```text
remaining_supply
```

below zero.

---

# 14. Secondary Market Semantics

Secondary Market represents transfer of an already acquired PLAY Property Asset.

Therefore Secondary Market does NOT consume:

```text
remaining_supply
```

Secondary transaction:

```text
Seller ownership
        ↓
Buyer ownership
```

No new Primary supply is created.

No household_count calculation occurs during Secondary matching.

---

# 15. Property Asset vs Supply Quantity

This distinction must remain explicit in code and documentation.

### Property Asset

Answers:

> What is the economic object?

```text
property_id = complex_id
```

### Season Supply

Answers:

> How many instances of this economic object may enter this Season's Primary Market?

```text
total_supply
```

### Ownership

Answers:

> Who currently owns one acquired instance?

```text
PLAY_PROPERTY_OWNERSHIP
```

This separation is required for future scaling.

---

# 16. Season 1 UI

Season 1 UI must NOT expose:

- household_count
- supply ratio
- supply policy technical code
- internal supply calculation

Users should experience the complex as a PLAY asset.

Internal admin/debug tools may display supply policy for verification.

---

# 17. Backward Compatibility

Audit all current code paths using:

- `household_count`
- `primary_supply_ratio`
- `total_supply`
- `remaining_supply`

Classify each use:

```text
VALID — Property metadata
VALID — HOUSEHOLD_BASED policy
VALID — Season audit/snapshot
INVALID — unconditional Season 1 supply calculation
INVALID — creation of multiple Property Assets
INVALID — secondary market supply mutation
```

Do not delete valid future-scaling logic.

---

# 18. Required Tests

## Policy Tests

### S01
Season 1 + FIXED_ONE:

```text
household_count = 100
→ total_supply = 1
```

### S02
Season 1 + FIXED_ONE:

```text
household_count = 10,000
→ total_supply = 1
```

### S03
HOUSEHOLD_BASED:

```text
household_count = 1,000
ratio = 0.10
→ total_supply = 100
```

### S04
HOUSEHOLD_BASED:

```text
household_count = 0
ratio = 0.10
→ total_supply = 1
```

### S05
Policy is immutable after Season initialization.

### S06
Property Master household_count change does not retroactively change existing Season supply.

### S07
Concurrent Primary purchases never make remaining_supply negative.

### S08
Secondary transaction does not modify remaining_supply.

---

# 19. Regression Requirements

Verify that this change does not break:

- IA-03C BUY
- IA-04A Result
- IA-04B MY WORLD
- IA-04D Secondary Market
- Research Logging
- Idempotency
- Reconciliation
- Season Clock
- Security Rules
- Reliability mechanisms

---

# 20. STOP Rules

STOP immediately if:

1. existing code assumes one property can have multiple Property IDs,
2. ownership schema cannot represent the new supply abstraction,
3. Secondary Market depends on household_count,
4. changing supply policy requires changing Economic Engine semantics,
5. an existing verified contract must be broken,
6. the meaning of `property_id` must change.

Report the conflict before making broad changes.

---

# 21. Explicit Non-Goals

Do NOT implement in this stage:

- 10 participant simulation
- 100 participant simulation
- L1000/L10000
- Human Season
- new economic rules
- new property valuation model
- tax model
- rent/jeonse model
- GLI changes
- nationwide property expansion
- UI redesign
- visual QA

---

# 22. Completion Criteria

This stage passes only when:

- Property Asset = one complex is preserved
- Season Supply Policy exists
- Season 1 = FIXED_ONE
- household-based formula remains available
- Primary Market consumes Season supply
- Secondary Market does not consume Season supply
- existing verified BUY/SELL contracts remain valid
- all required tests pass
- no protected system is broken

Final status:

`READY FOR IA-04D RE-VERIFICATION`

or

`BLOCKED — SUPPLY POLICY CONFLICT`

or

`BLOCKED — TECHNICAL DEPENDENCY`
