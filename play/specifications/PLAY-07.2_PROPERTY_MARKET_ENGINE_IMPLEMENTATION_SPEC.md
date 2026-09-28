# PLAY-07.2 PROPERTY MARKET ENGINE IMPLEMENTATION SPEC

## 0. Document Purpose

This document is the implementation-level specification for PLAY-07.2 Property Market Engine.

It follows and must not contradict:
- PLAY-07.2.1_PROPERTY_DATA_SNAPSHOT_SPEC.md
- PLAY-07.2.1_DATA_VALIDATION_REPORT.md
- PLAY-07.2.1_PROPERTY_EXCLUSION_ROOT_CAUSE_REPORT.md
- PLAY-07.2.1_INCOMPLETE_PROPERTY_DESIGN_REVIEW.md
- PLAY-07.1.1 economic parameter finalization
- PLAY-07.1 final verification
- PLAY-06 / PLAY-06.1 backend, security, idempotency and reliability design

## 1. Objective

Implement the property layer of PLAY while preserving the existing economic engine and server-authoritative architecture.

The implementation must:
1. Build a PLAY Property Master snapshot from the region-specific Valuated_202609 CSV files.
2. Preserve all valid Complex records, including INCOMPLETE records.
3. Initialize Season property supply from the Property Master.
4. Support Primary Market supply and purchase with finite inventory.
5. Support Property Ownership.
6. Support Secondary Market player-to-player trading through an Order Book.
7. Enforce cash/property locking and atomic transactions.
8. Record property-related Decision Logs and Transactions.
9. Provide reconciliation and failure recovery.
10. Preserve PLAY-06.1 security and PLAY-07.1 idempotency.

## 2. Property Master Source

Source directory:
`D:\real_estate_data\91_Complex_Valuation`

Source files:
region-specific files matching:
`..._Valuated_202609.csv`

The region is encoded in the filename. Do not require or create a nationwide merged CSV.

The source snapshot is used for Season initialization only. PLAY must not continuously update property state from RealRankers after Season initialization.

Required source fields:
- 검색코드
- 아파트명
- 세대수
- 법정동주소
- 도로명주소
- X
- Y
- area_info
- sales_info

Mapping:
- 검색코드 -> complex_id, stored as String
- 아파트명 -> complex_name, as-is
- 세대수 -> household_count
- 법정동주소 -> legal_dong_address
- 도로명주소 -> road_name_address
- X/Y -> coordinates
- region -> filename-derived region
- source_file -> original filename

X and Y:
- If X or Y is missing, exclude the Complex from Property Master.
- No other data imperfection is an automatic exclusion condition.

## 3. Property Unit

Property unit = Complex + representative area.

Representative area:
- Select the area in area_info whose sqm value is closest to 84.0 sqm.
- If exactly 84.0 exists, select it.
- area_info and sales_info are ordered and index-aligned.
- Never independently sort the two arrays.

Initial price:
- Use sales_info at the same index as the selected representative area.
- Parse price such as `15.5억` as 1,550,000,000 KRW.
- Preserve initial_price_date.
- Do NOT use last_sales for PLAY initial price.

## 4. INCOMPLETE Property

The actual validation found three Complexes with:
- area_info = `미정(미정)`
- sales_info = `거래 정보 없음`

IDs:
- gMQ0a
- gHwaa
- fa8da

These must NOT be dropped.

For these:
- property_status = `INCOMPLETE`
- representative_area_sqm = null
- representative_area_pyeong = null
- representative_area_index = null
- initial_price = null
- initial_price_date = null
- tradable = false
- preserve area_info_raw and sales_info_raw

Do NOT use:
- 0 sqm
- 0 KRW
- guessed area
- guessed price
- another area's price
- last_sales as a fallback

INCOMPLETE properties:
- remain in Property Master
- are not Primary Supply
- are not tradable
- cannot enter Secondary Market
- may later be promoted to NORMAL when authoritative data becomes available; promotion is out of scope for this implementation.

## 5. Property ID

Property ID must be immutable.

For the current MVP, because one Complex has one representative Property:
- property_id = complex_id

Do not encode representative area into the ID.

This prevents historical asset/log/ownership breaks if area data is later updated.

The schema must remain extensible for a future multi-area-per-Complex model.

## 6. Property Master Schema

Minimum fields:
- property_id
- complex_id
- complex_name
- property_status
- tradable
- household_count
- representative_area_sqm
- representative_area_pyeong
- representative_area_index
- initial_price
- initial_price_date
- legal_dong_address
- road_name_address
- x
- y
- region
- source_file
- snapshot_version
- area_info_raw
- sales_info_raw
- areas[] (full parsed area list where available)
- sales[] (full parsed sales list where available)
- created_at
- updated_at

For NORMAL properties, representative fields and initial price are required.
For INCOMPLETE properties, the relevant unknown fields are null.

## 7. Season Initialization

At Season initialization:
- read the Property Master snapshot
- create only eligible NORMAL/tradable properties in Primary Supply
- preserve INCOMPLETE properties in Property Master
- do not create Primary Supply entries for INCOMPLETE properties

The initial Property Master count must reconcile to the number of Complexes that pass the explicit Property Master inclusion rules.

For the validated Suji sample:
For the validated Suji sample:
- 209 Complexes were read
- Correct target after this specification: 209 Property Master records
- NORMAL: Valid representative area + valid corresponding initial price
- INCOMPLETE: Property Master inclusion condition is satisfied, but required economic property data is incomplete.
- In the sample, this results in exactly 200 NORMAL and 9 INCOMPLETE.

## 8. Primary Market

Primary Market is the Season Initialization Supply Market.

Supply:
- finite
- based on household_count × PRIMARY_SUPPLY_RATIO
- floor the result
- minimum 1 for an eligible NORMAL Property
- PRIMARY_SUPPLY_RATIO is NOT fixed in this document and must NOT be invented
- store the ratio in Season configuration when it is finalized
- duration = first 12 simulated months after Season start
- simulation periods 0 through 11
- supply closes when exhausted or expired

Initial price:
- Property Master initial_price
- no synthetic price
- no appreciation applied at initialization

Primary purchase:
- player buys from finite primary supply
- player pays initial price plus purchase fee
- cash must be sufficient
- no negative cash
- ownership is created atomically
- supply counter decremented atomically
- transaction recorded
- decision log recorded
- duplicate requests are idempotent

Concurrency:
- if one unit remains and multiple players purchase concurrently, exactly one succeeds
- others fail with a deterministic insufficient-supply result
- no overselling

## 9. Property Ownership

Ownership must be represented separately from Property Master.

Minimum ownership fields:
- ownership_id
- season_id
- property_id
- player_id
- acquisition_type
- acquisition_price
- acquired_at
- acquisition_transaction_id
- status
- locked_for_sale
- created_at
- updated_at

A player may own multiple properties subject to economic constraints defined elsewhere.

Do not implement LTV/DSR/loan in PLAY-07.2.

## 10. Secondary Market

Secondary Market is player-to-player only.

No NPC market maker.
No synthetic liquidity.

Order Book:
- price priority first
- time priority second
- quantity = 1
- no partial fill
- order remains until filled or cancelled

Minimum order fields:
- order_id
- season_id
- property_id
- seller_player_id / buyer_player_id where applicable
- side
- price
- quantity
- status
- created_at
- updated_at
- matched_transaction_id

Asset locks:
- SELL order locks the property
- BUY order locks the required cash
- cancellation releases the corresponding lock
- successful match consumes both locks atomically

Transaction fees:
- purchase fee = 2.0%
- sale fee = 1.5%

Seller receives:
sale price - sale fee

Buyer pays:
sale price + purchase fee

No negative cash.

## 11. Reference Price

Keep transaction price separate from reference price.

If a property has no secondary transaction:
- reference price = PRIMARY_INITIAL_PRICE
- price_source = INITIAL_REFERENCE

If a secondary transaction exists:
- reference price may use the latest valid transaction according to the finalized market rule
- price_source = TRANSACTION

Do not invent synthetic price movements.

## 12. Transaction Records

Minimum transaction fields:
- transaction_id
- season_id
- property_id
- transaction_type
- buyer_player_id
- seller_player_id
- price
- buyer_fee
- seller_fee
- total_buyer_cash_change
- total_seller_cash_change
- status
- idempotency_key
- created_at

Primary and Secondary transactions must remain distinguishable in analytics.

## 13. Decision Log

Property actions must be recorded in PLAY_DECISION_LOG or the existing compatible decision-log structure.

At minimum:
- season_id
- player_id
- simulation_period
- action_type
- property_id
- transaction_id if applicable
- cash_before
- cash_after
- property_count_before
- property_count_after
- result
- reason
- request_id
- created_at

Decision log must be idempotent.

## 14. Server Authority and Security

Preserve PLAY-06.1 security.

Client:
- may request actions through authorized API
- may read permitted state
- must NOT directly write PLAY economic/property collections

Server:
- validates authentication
- validates Cloud Task/internal authentication
- performs all economic/property state changes
- uses Firestore transactions where atomicity is required

Never reintroduce an auth bypass.

## 15. Idempotency

Preserve:
- request idempotency
- batch idempotency
- chunk idempotency
- player idempotency

Property actions must also have an idempotency key.

Duplicate purchase/order/transaction requests must not create duplicate ownership, duplicate cash movement, duplicate supply consumption, or duplicate transaction logs.

## 16. Reconciliation

Add property-specific reconciliation.

At minimum check:
1. Property Master count
2. NORMAL/INCOMPLETE counts
3. Primary Supply remaining counts
4. Primary Supply consumed count
5. Ownership ↔ transaction consistency
6. Locked cash consistency
7. Locked property consistency
8. No property has multiple active owners
9. No property sold while locked inconsistently
10. No negative cash
11. Transaction totals match ownership/acquisition records
12. INCOMPLETE properties are never tradable

Mismatch must trigger the existing safety mechanism:
- TRANSACTION_PAUSED
- clock pause where appropriate
- explicit error record

## 17. Failure Recovery

Property transactions must survive:
- duplicate request
- client timeout after server success
- function crash
- Firestore transaction retry
- Cloud Task retry
- mid-operation failure

No partial state such as:
- cash deducted but ownership missing
- ownership created but supply not reduced
- property locked without corresponding order
- cash locked without corresponding order

is acceptable.

## 18. Scope Exclusions

Do NOT implement:
- LTV
- DSR
- loans
- tax
- GLI price modeling
- rent
- jeonse
- financial assets
- economic freedom
- rewards
- rankings
- Hall of Fame
- Season Analysis
- AI
- property appreciation model
- macro-driven property price changes

## 19. Required Tests

At minimum:

P01 Property Master ingestion
P02 209 -> 209 reconciliation
P03 NORMAL / INCOMPLETE count validation
P04 area/sales index alignment
P05 representative area selection
P06 initial price mapping
P07 last_sales is not used
P08 INCOMPLETE has null economic fields
P09 INCOMPLETE never enters Primary Supply
P10 Primary Supply creation
P11 primary purchase success
P12 insufficient cash
P13 concurrent primary purchase with supply=1
P14 duplicate primary purchase request
P15 ownership creation atomicity
P16 secondary sell order
P17 property lock
P18 buy cash lock
P19 order cancellation releases lock
P20 secondary match atomicity
P21 transaction fee calculation
P22 reference price fallback
P23 duplicate secondary transaction request
P24 negative cash prevention
P25 reconciliation normal
P26 reconciliation corruption detection
P27 unauthorized direct write denied
P28 unauthenticated API denied
P29 invalid internal service account denied
P30 Cloud Task valid authentication
P31 mid-operation failure recovery
P32 client timeout / retry recovery

## 20. Implementation Rules

Before coding:
1. Read all referenced PLAY-06/06.1/07.1/07.2.1 documents.
2. Inspect the actual existing repository and current PLAY implementation.
3. Perform a Pre-Implementation Review.
4. If a specification conflict is found, STOP and report it before changing code.
5. Do not invent PRIMARY_SUPPLY_RATIO.
6. Do not change PLAY-07.1 economic parameters.
7. Do not modify existing RealRankers frontend unnecessarily.
8. Keep PLAY server-authoritative.
9. Preserve existing security and idempotency.
10. Do not silently change schema or business rules.

## 21. Definition of Done

PLAY-07.2 is READY only when:

- Property Master is actually built from the source files.
- 209 validated Suji Complexes reconcile to 209 Property Master records.
- 200 are NORMAL and 9 are INCOMPLETE.
- No INCOMPLETE record is silently dropped.
- Representative area and initial price are correctly mapped for NORMAL records.
- last_sales is not used.
- Primary Supply excludes INCOMPLETE.
- Primary purchase is atomic and idempotent.
- Concurrent supply=1 test allows exactly one success.
- Ownership is consistent with transactions.
- Secondary Order Book works with price/time priority.
- Cash/property locks work and release correctly.
- Fees are correct.
- Reconciliation detects corruption.
- Security regression passes.
- Existing PLAY-06.1 and PLAY-07.1 tests/regressions pass.
- Actual Firebase/GCP integration tests are executed.
- No evidence-free PASS claims are made.

## 22. Required Reports

Create:
1. `PLAY-07.2_PRE_IMPLEMENTATION_REVIEW.md`
2. `PLAY-07.2_IMPLEMENTATION_REPORT.md`
3. `PLAY-07.2_VERIFICATION_REPORT.md`

Do not declare READY based only on code inspection. Actual Firebase/GCP evidence is required.
