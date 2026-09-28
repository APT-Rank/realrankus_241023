# PLAY-07.2 PROPERTY MARKET ENGINE SPECIFICATION

## 1. 목적

PLAY-07.1에서 검증된 경제엔진 위에 Property Market Engine을 추가한다.

이번 단계의 핵심 목적은 다음이다.

> 동일한 경제환경과 동일한 시작자산을 가진 Player들이 서로 다른 부동산 선택·보유·매도·거래를 수행하고, 그 결과를 30년 동안 관찰할 수 있는 시장 기반을 구현한다.

PLAY-07.1의 Income / Inflation / Expense / Idempotency / Security 구조를 유지한다.

---

# 2. 기준 문서

최우선 기준:

- PLAY-07.1.1 ECONOMIC PARAMETER FINALIZATION
- PLAY-07.1 FINAL VERIFICATION REPORT
- PLAY-04 PROPERTY MARKET IMPLEMENTATION SPEC
- PLAY-05 / 05.1 / 05.2 Reliability & Idempotency
- PLAY-06 Backend Infrastructure Implementation
- PLAY-06.1 Security & E2E Fix

기존 RealRankers Property Master는 **읽기 전용 초기 데이터 원천**으로 사용한다.

---

# 3. Scope

## IN

1. Property Master Snapshot
2. Season Property Initialization
3. Primary Market
4. Property Ownership
5. Secondary Market
6. Player-to-Player transaction
7. Property state
8. Asset locking
9. Transaction fees
10. Reference Price
11. Property purchase
12. Property sale
13. Cash validation
14. Economic ability validation
15. Order Book
16. Transaction history
17. Property-related Decision Log
18. Property market idempotency
19. Atomic transaction
20. Reconciliation
21. Failure recovery
22. Security regression

## OUT

- Rent / Jeonse implementation
- Loan / LTV / DSR
- Tax
- GLI calculation
- Financial Assets
- Economic Freedom
- Reward
- Ranking
- Hall of Fame
- Season Analysis Engine
- AI calculation

Rent / Jeonse는 이후 단계에서 구현한다.

---

# 4. Core Market Principle

PLAY Property Market은 RealRankers 실제 부동산 시장을 실시간 복제하지 않는다.

Season 시작 시점에 실제 부동산 데이터를 Snapshot하고,
그 이후의 Property Price / Ownership / Transaction은 PLAY 내부 시장에서 독립적으로 운영한다.

구조:

RealRankers Property Master
        ↓
Season Initialization Snapshot
        ↓
PLAY Property Master / Property State
        ↓
Primary Market
        ↓
Secondary Market
        ↓
Player-to-Player Transactions

실제 시장 데이터는 Season 진행 중 가격을 직접 업데이트하는 원천으로 사용하지 않는다.

---

# 5. Property Initial Data

기존 RealRankers 데이터:

Path:

`D:\real_estate_data\91_Complex_Valuation`

사용 목적:

> Season 시작 시점의 Complex / Location / Initial Price Snapshot

사용하지 않는 목적:

- Season 중 실시간 가격 업데이트
- PLAY 내부 거래가격 대체
- NPC 가격 생성

## Mapping

Property ID:

`검색코드`

Property Name:

`아파트명`

Household Count:

`세대수`

Initial Price:

`last_sales` 또는 `매매실거래가`

Location:

`법정동주소`

Coordinates:

`X / Y`

---

# 6. Property Unit

PLAY의 거래 단위는:

> Complex + Representative Area

로 한다.

Property는 시즌별로 활성화된 PLAY Property State를 가진다.

---

# 7. Primary Market

Primary Market은 NPC Market Maker가 아니다.

## 목적

Season 시작 시 실제 RealRankers Snapshot 가격을 기준으로
Player가 최초로 Property를 취득할 수 있는 공급시장이다.

## Supply

Complex별 Primary Supply:

```text
floor(Household Count × PRIMARY_SUPPLY_RATIO)
```

최소 1.

공급량과 PRIMARY_SUPPLY_RATIO는 설정값으로 분리한다.

Primary Market은:

- 공급량 소진
- 또는 지정된 유효기간 종료

중 먼저 발생하는 조건으로 종료한다.

---

# 8. Starting Player Condition

모든 Player는 PLAY-07.1과 동일하게:

```text
Cash = 700,000,000 KRW
Debt = 0
Property = 0
Financial Asset = 0
```

에서 시작한다.

Primary Property를 구매하면:

```text
Cash ↓
Property Count ↑
Ownership 생성
```

이 동시에 Atomic Transaction으로 처리되어야 한다.

---

# 9. Transaction Cost

Purchase:

```text
Purchase Transaction Cost = 2.0%
```

Sale:

```text
Sale Transaction Cost = 1.5%
```

Sale에는 필요 시 Liquidity Discount를 적용할 수 있도록 구조를 분리한다.

이번 구현에서는 확정된 거래비용을 우선 적용하고,
미확정 Liquidity Discount의 구체적인 계산식은 임의로 만들지 않는다.

---

# 10. Primary Purchase

Player가 Primary Market에서 Property를 구매할 때:

```text
Required Cash
=
Purchase Price
+
Purchase Fee
```

검증:

```text
Available Cash >= Required Cash
```

성공 시 동일 Firestore Transaction에서:

1. Player Cash 감소
2. Property Supply 감소
3. Property Ownership 생성
4. Property State 업데이트
5. Transaction 기록
6. Decision Log 기록
7. Idempotency 기록

을 처리한다.

어느 하나라도 실패하면 전체 Rollback.

---

# 11. Secondary Market

Secondary Market은:

> Player ↔ Player

거래만 허용한다.

NPC / Market Maker / Synthetic Liquidity는 사용하지 않는다.

---

# 12. Secondary Order Book

Order Book 정렬:

1. Price Priority
2. Time Priority

동일 가격이면 먼저 등록된 Order가 우선 체결된다.

Order:

- Quantity = 1
- Partial Fill 금지
- Filled / Cancelled / Expired 상태 관리
- 체결 전 Cash / Property Lock

---

# 13. Asset Lock

Buyer가 Buy Order를 등록하면 필요한 Cash를 Lock한다.

Seller가 Sell Order를 등록하면 해당 Property를 Lock한다.

예:

```text
cash_total
=
cash_available
+
cash_locked
```

Property도:

```text
property_available
property_locked
```

상태를 명확히 분리한다.

---

# 14. Secondary Trade Atomicity

거래 체결은 하나의 Atomic Transaction으로 처리한다.

Buyer:

```text
Locked Cash ↓
Property Ownership ↑
```

Seller:

```text
Property Ownership ↓
Cash ↑
```

Transaction:

```text
BUYER
SELLER
PROPERTY
PRICE
FEE
STATUS
```

를 하나의 거래 단위로 기록한다.

중간 상태가 외부에 노출되면 안 된다.

---

# 15. Reference Price

실제 거래가격과 Reference Price를 분리한다.

## Transaction Price

실제 PLAY Secondary Market 체결가격.

## Reference Price

최근 PLAY 거래가가 없을 경우 사용할 기준가격.

Fallback:

```text
PRIMARY_INITIAL_PRICE
```

Price Source:

```text
TRANSACTION
INITIAL_REFERENCE
```

Synthetic Market Price를 생성하지 않는다.

---

# 16. Economic Ability Validation

Property 거래 시 Player의 경제적 능력을 검증한다.

이번 단계에서는 Loan / LTV / DSR을 구현하지 않는다.

따라서 기본적으로:

```text
Required Cash
<=
Available Cash
```

조건을 우선 적용한다.

Negative Cash를 허용하지 않는다.

---

# 17. Sale

Seller가 Property를 매도하면:

```text
Gross Sale Price
-
Sale Fee
-
Liquidity Discount(if defined)
=
Net Sale Proceeds
```

확정된 Sale Fee:

```text
1.5%
```

Liquidity Discount 계산식이 별도 확정되지 않았다면 임의 적용하지 않는다.

---

# 18. Primary / Secondary Separation

Analytics에서 반드시 Primary와 Secondary를 구분한다.

Transaction에는:

```text
market_type
```

을 기록한다.

값:

```text
PRIMARY
SECONDARY
```

Primary transaction을 Secondary market price statistics에 섞지 않는다.

---

# 19. Property Ownership

Ownership document에는 최소 다음을 포함한다.

```text
ownership_id
season_id
player_id
property_id
purchase_price
purchase_period
purchase_market_type
status
locked
created_at
updated_at
```

Property State에는 최소:

```text
property_id
season_id
reference_price
reference_price_source
primary_supply_total
primary_supply_remaining
primary_market_status
owner_count
updated_at
```

을 포함한다.

---

# 20. Transaction Schema

최소:

```text
transaction_id
season_id
market_type
transaction_type
property_id
buyer_player_id
seller_player_id
price
purchase_fee
sale_fee
liquidity_discount
net_amount
status
idempotency_key
simulation_period
created_at
completed_at
```

Primary에는 seller가 없을 수 있다.

Secondary에는 buyer / seller가 모두 존재한다.

---

# 21. Property Decision Log

Property 관련 행동을 PLAY_DECISION_LOG에 기록한다.

예:

```text
PROPERTY_PRIMARY_BUY
PROPERTY_SECONDARY_BUY_ORDER
PROPERTY_SECONDARY_SELL_ORDER
PROPERTY_SECONDARY_TRADE
PROPERTY_SELL
PROPERTY_ORDER_CANCEL
```

최소:

```text
player_id
season_id
simulation_period
property_id
event_type
price
fee
cash_before
cash_after
property_count_before
property_count_after
transaction_id
request_id
trace_id
```

---

# 22. Idempotency

모든 거래 명령은 idempotent해야 한다.

Idempotency Key 예:

```text
season_id
+
player_id
+
operation_type
+
client_request_id
```

동일 요청이 재전송되어도:

- Cash 중복 차감 금지
- Property 중복 지급 금지
- Transaction 중복 생성 금지
- Decision Log 중복 생성 금지

를 보장한다.

---

# 23. Reconciliation

Property Market 추가 후 Reconciliation 범위를 확장한다.

최소 확인:

```text
cash_total
=
cash_available + cash_locked
```

Ownership:

```text
Property ownership count
=
Player property count
```

Primary:

```text
primary_supply_remaining
>= 0
```

Transaction:

```text
completed transaction
↔
ownership / cash state
```

불일치 발생 시:

```text
TRANSACTION_PAUSED
```

및 Season Clock 정지를 유지한다.

---

# 24. Failure Recovery

다음 장애를 고려한다.

- Client timeout
- Worker crash
- Firestore transaction retry
- Duplicate Cloud Task
- Duplicate transaction request
- Mid-transaction failure
- Concurrent purchase
- Concurrent order fill
- Seller cancellation race
- Buyer cancellation race
- Primary supply race

경제 세계가 부분적으로 변경되는 상태를 허용하지 않는다.

---

# 25. Concurrency

특히 Primary Market에서 공급량이 1개 남았을 때:

```text
Player A → Buy
Player B → Buy
```

가 동시에 발생해도 둘 중 하나만 성공해야 한다.

Expected:

```text
Supply decrement = 1
Successful purchase = 1
Rejected purchase = 1
```

Negative supply:

```text
0
```

이어야 한다.

---

# 26. Secondary Concurrency

동일 Property에 대해:

```text
Buyer A
Buyer B
```

가 동시에 가장 좋은 Sell Order를 체결하려는 경우,
하나만 성공해야 한다.

이미 체결된 Order는 다시 체결되면 안 된다.

Expected:

```text
Completed Trade = 1
Duplicate Trade = 0
Ownership corruption = 0
```

---

# 27. Security

PLAY-06.1의 Security 구조를 그대로 유지한다.

- Client PLAY write denied
- Admin SDK only
- Cloud Tasks OIDC
- internalAuth
- Wrong Service Account rejected
- Unauthenticated rejected

Property 거래 API를 추가하더라도 보안 우회는 허용하지 않는다.

---

# 28. 테스트 요구사항

최소 다음 테스트를 실제 Firebase/GCP에서 수행한다.

### P01
Property Master Snapshot

### P02
Season Property Initialization

### P03
Primary Supply Calculation

### P04
Primary Purchase Success

### P05
Insufficient Cash Rejection

### P06
Primary Supply Exhaustion

### P07
Concurrent Primary Purchase

### P08
Primary Transaction Idempotency

### P09
Secondary Sell Order

### P10
Secondary Buy Order

### P11
Order Book Price Priority

### P12
Order Book Time Priority

### P13
Asset Lock

### P14
Atomic Secondary Trade

### P15
Concurrent Secondary Trade

### P16
Order Cancellation

### P17
Reference Price Fallback

### P18
Transaction / Ownership Reconciliation

### P19
Mid-Transaction Failure Recovery

### P20
Duplicate Cloud Task / Request

### P21
Security Regression

### P22
PLAY-07.1 Regression

---

# 29. Anti-goals

이번 단계에서 다음을 하지 않는다.

- 실시간 MOLIT API
- 실제 시장가격 자동 업데이트
- AI 가격예측
- NPC Market Maker
- Synthetic Liquidity
- Full Tax Model
- Loan Engine
- LTV / DSR
- Rent / Jeonse
- Full Season Analysis
- Ranking / Reward
- Frontend framework migration

---

# 30. Implementation Principle

PLAY-07.1에서 검증한 다음 원칙을 그대로 유지한다.

```text
Server Authority
>
Atomicity
>
Idempotency
>
Data Integrity
>
Reproducibility
>
Availability
```

목표는 빠른 거래가 아니라:

> **부동산 거래가 실패하거나 재시도되어도 경제 세계가 망가지지 않는 것**

이다.

---

# 31. 완료 조건

PLAY-07.2는 다음 조건을 만족해야 완료로 본다.

- Property Master Snapshot 정상
- Primary Supply 정상
- Primary Purchase 정상
- Secondary Order Book 정상
- Ownership 정상
- Cash Lock 정상
- Atomic Trade 정상
- Transaction History 정상
- Reference Price 정상
- Idempotency 정상
- Concurrency 정상
- Reconciliation 정상
- Failure Recovery 정상
- Security Regression 없음
- PLAY-07.1 Regression 없음

검증 결과가 불충분하면 PLAY-07.3으로 넘어가지 않는다.
