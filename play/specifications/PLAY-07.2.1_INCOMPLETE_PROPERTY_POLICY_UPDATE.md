# PLAY-07.2.1 INCOMPLETE PROPERTY POLICY UPDATE

## 1. Decision

The implementation conflict identified in `PLAY-07.2_IMPLEMENTATION_CONFLICT_REPORT.md` is resolved as follows:

> Any Complex for which the representative area cannot be paired with a valid initial price from the corresponding `sales_info[index]` is classified as `INCOMPLETE`.

No price fallback is permitted.

Therefore, the validated Suji dataset is expected to contain:

- 200 NORMAL
- 9 INCOMPLETE
- 209 Property Master records total

The exact 9 INCOMPLETE records are:
- gMQ0a
- gHwaa
- fa8da
- 14367
- 15015
- 152738
- 25898
- 113435
- 13424

## 2. Reason

The original `206 NORMAL + 3 INCOMPLETE` expectation was based on representative-area availability only. The actual PLAY-07.2 implementation correctly revealed an additional required condition: a NORMAL Property must have a valid initial price.

A Property cannot be NORMAL if its representative area's corresponding `sales_info[index]` is `거래 정보 없음`.

This is not a reason to use:
- 0 KRW
- estimated price
- another area's price
- `last_sales`
- synthetic price

## 3. NORMAL Definition

A Property is NORMAL only when all of the following are true:

1. X exists
2. Y exists
3. representative area can be determined
4. representative area index exists
5. corresponding `sales_info[representative_area_index]` exists
6. corresponding sales price can be parsed
7. initial price date can be parsed when required by the snapshot schema

Otherwise, if the Complex is not excluded by the explicit X/Y rule, it remains in Property Master as INCOMPLETE.

## 4. INCOMPLETE Definition

INCOMPLETE is a data-state classification, not a deletion rule.

INCOMPLETE properties remain in `PLAY_PROPERTY_MASTER`.

For INCOMPLETE:
- property_status = INCOMPLETE
- tradable = false
- representative_area_sqm may be numeric or null
- representative_area_pyeong may be numeric or null
- representative_area_index may be numeric or null
- initial_price = null
- initial_price_date = null when unavailable
- area_info_raw preserved
- sales_info_raw preserved

For the original 3 records with no area:
- representative area fields remain null.

For the additional 6 records:
- representative area fields may remain valid numeric values
- initial_price remains null because the corresponding representative-area transaction price is unavailable.

## 5. Property Master Count

Property Master must preserve all 209 valid Complex records in the validated Suji sample.

Expected:

```text
Total = 209
NORMAL = 200
INCOMPLETE = 9
Excluded by X/Y = 0
```

No record may disappear merely because economic data is incomplete.

## 6. Primary Market Eligibility

Only:

```text
property_status == NORMAL
AND tradable == true
AND initial_price != null
```

may enter Primary Supply.

All 9 INCOMPLETE records must have:

```text
Primary Supply = none
Tradable = false
```

## 7. No Price Fallback

The following remain prohibited:

- last_sales fallback
- another area's sales_info
- average price
- estimated price
- inferred price
- 0 KRW
- synthetic initial price

The reason is data integrity: PLAY should observe economic behavior under known inputs, not manufacture unknown market values.

## 8. Property ID

Property ID remains immutable:

```text
property_id = complex_id
```

This applies to both NORMAL and INCOMPLETE properties.

## 9. Required Reconciliation

The ingestion validation must report:

```text
CSV Complex Count
Property Master Count
NORMAL Count
INCOMPLETE Count
Excluded Count
Excluded IDs
INCOMPLETE IDs
```

For the validated Suji sample:

```text
CSV = 209
Property Master = 209
NORMAL = 200
INCOMPLETE = 9
Excluded = 0
```

## 10. Implementation Consequence

The current implementation must not force the original `206/3` distribution.

The `206/3` figure is superseded by the stronger data-integrity rule:

> NORMAL requires a valid representative-area initial price.

The implementation should classify records based on actual validated data, not on a predetermined count.

## 11. Final Decision

Status:

**RESOLVED**

Proceed with PLAY-07.2 implementation using:

**200 NORMAL + 9 INCOMPLETE = 209 Property Master records**

No price fallback is allowed.
