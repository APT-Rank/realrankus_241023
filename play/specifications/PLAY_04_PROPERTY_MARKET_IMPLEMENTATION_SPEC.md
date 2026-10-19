# PLAY_04_PROPERTY_MARKET_IMPLEMENTATION_SPEC

## 1. 문서 목적

본 문서는 `PLAY_03.3_PROPERTY_MARKET_DESIGN_FINAL.md` 및 Antigravity 기술 검토 결과를 기반으로 PLAY 부동산 시장을 실제 구현하기 위한 Implementation Specification이다.

이번 단계의 목적은 경제 규칙을 새로 설계하는 것이 아니라, 확정된 경제 규칙을 **안전하고 재현 가능하며 확장 가능한 서버 구조로 구현하는 것**이다.

03.3에 대한 Antigravity 검토 결과는 `READY AFTER MINOR FIXES`였으며, 핵심적으로 다음 기술 위험이 확인되었다.

- 전국 Primary Supply 초기화 시 대량 Document 생성 문제
- Order Book Firestore Transaction 경합
- Economic Batch와 사용자 주문 간 Race Condition
- 대규모 Scheduler / Batch 처리 문제

따라서 본 문서는 위 문제를 구현 단계에서 방지하는 것을 우선한다.

---

# 2. 확정된 Product / Economic Rules

다음 항목은 Implementation 과정에서 임의 변경하지 않는다.

## 2.1 Player Initial State

Season 시작 시:

```yaml
cash: 700000000
debt: 0
property: 0
```

모든 Player가 동일한 초기 현금과 자산 조건을 갖는다.

---

## 2.2 Property Unit

Property는 다음 단위로 관리한다.

```text
Complex + Representative Area
```

개별 세대의 실제 주소나 동 단위까지 구현하지 않는다.

---

## 2.3 Initial Property Source

Season 시작 시 Property Master와 Initial Price는 기존 RealRankers의 다음 데이터를 사용한다.

```text
D:eal_estate_data\91_Complex_Valuation
```

이 데이터는 **Season 시작 Snapshot용**으로만 사용한다.

Season 진행 중 PLAY 가격을 갱신하는 원천 데이터로 사용하지 않는다.

---

# 3. Market Architecture

PLAY Property Market은 두 단계로 구성한다.

```text
Season Initialization Supply Market
                ↓
        Player Ownership
                ↓
        Secondary Market
                ↓
      Player-to-Player Trading
```

## 3.1 Initialization Supply

초기 공급은 NPC 또는 Market Maker가 아니다.

목적은 모든 Player가 Property 0개로 시작하는 상태에서 Secondary Market을 시작할 수 있도록 하는 것이다.

---

# 4. Primary Supply 구현

## 4.1 Supply Calculation

단지별 초기 공급량:

```text
floor(Household Count × PRIMARY_SUPPLY_RATIO)
```

결과가 0이면 최소 1개로 설정한다.

```text
if calculated_quantity < 1:
    calculated_quantity = 1
```

### 중요

`PRIMARY_SUPPLY_RATIO`는 Season Configuration이다.

Code에 영구적으로 하드코딩하지 않는다.

예:

```yaml
primary_market:
  supply_mode: FINITE
  primary_supply_ratio: 0.10
  duration_days: 3
```

---

## 4.2 Primary Supply Storage

Primary Supply를 세대별/매물별 개별 Document로 생성하지 않는다.

단지별 Counter Document를 사용한다.

Collection:

```text
PLAY_PRIMARY_SUPPLY
```

예:

```yaml
{
  season_id: "...",
  property_id: "...",
  initial_price: 700000000,
  available_quantity: 123,
  total_quantity: 123,
  status: "OPEN",
  opened_at: "...",
  expires_at: "..."
}
```

### Invariants

```text
0 <= available_quantity <= total_quantity
```

Primary Purchase가 체결될 때:

```text
available_quantity -= 1
```

단, 반드시 Firestore Transaction 내부에서 검증한다.

---

# 5. Primary Supply Concurrency

예:

```text
available_quantity = 1

Player A BUY
Player B BUY
Player C BUY
```

동시 요청이 발생해도 한 명만 체결되어야 한다.

Transaction 내부에서:

1. Supply Document Read
2. `available_quantity >= 1` 검증
3. Player Asset Read
4. Cash Availability 검증
5. Cash Lock / Deduction
6. Ownership 생성
7. Supply Counter -1
8. Transaction Record 생성
9. Decision Log 기록

을 원자적으로 처리한다.

---

# 6. Primary Market 종료

종료 조건:

```text
available_quantity == 0
OR
current_time >= expires_at
```

둘 중 하나가 충족되면:

```text
status = CLOSED
```

종료는 Scheduler 또는 Lazy Close를 조합할 수 있다.

### Lazy Close

사용자가 종료된 Supply에 주문을 제출한 경우 서버가:

```text
current_time >= expires_at
```

를 검증하고 즉시 거부한다.

### Scheduler

운영 편의를 위해 만료된 Supply를 주기적으로 `CLOSED`로 변경한다.

Scheduler가 늦게 실행되어도 경제적 정합성이 깨지지 않아야 한다.

---

# 7. Primary Purchase

Primary Purchase가 체결되면:

```text
Player Cash
↓
Property Ownership
```

Ownership에는 다음을 기록한다.

```yaml
season_id
player_id
property_id
acquired_price
acquired_at
acquisition_market_type: PRIMARY
```

이후 해당 Property를 매도하면 Secondary SELL Order가 된다.

---

# 8. Secondary Order Book

## 8.1 Order

Collection:

```text
PLAY_ORDER
```

최소 필드:

```yaml
order_id
season_id
player_id
property_id
side
price
status
created_at
updated_at
market_type
idempotency_key
```

`side`:

```text
BUY
SELL
```

`market_type`:

```text
SECONDARY
```

Primary Purchase는 별도 Initialization Supply 처리로 기록한다.

---

# 9. Order State Machine

```text
OPEN
  ↓
FILLED

OPEN
  ↓
CANCELLED

OPEN
  ↓
EXPIRED
```

MVP에서는 Quantity=1이므로:

```text
PARTIALLY_FILLED
```

상태를 실제 거래 로직에서 사용하지 않는다.

---

# 10. Order Creation

Client는 직접 Firestore에 Order를 생성하지 않는다.

Client:

```text
placeOrder(...)
```

Cloud Function:

```text
authenticate
↓
validate season
↓
validate player state
↓
validate property / cash
↓
create order
↓
lock asset
↓
attempt matching
```

---

# 11. BUY Asset Lock

BUY Order 생성 시:

```text
available_cash
→ locked_cash
```

필요 현금은 최소한 다음을 포함한다.

```text
purchase_price
+ applicable_transaction_fee
```

Lock 후:

```text
cash.total = cash.available + cash.locked
```

Invariant를 유지한다.

---

# 12. SELL Asset Lock

SELL Order 생성 시:

```text
available_property
→ locked_property
```

서버는 반드시:

```text
player owns property
AND
property is not already locked
```

를 검증한다.

---

# 13. Order Cancellation

BUY Cancel:

```text
locked_cash
→ available_cash
```

SELL Cancel:

```text
locked_property
→ available_property
```

Cancel 역시 Server Authority 하에서 Transaction으로 처리한다.

이미 `FILLED`, `CANCELLED`, `EXPIRED` 상태인 Order는 다시 Cancel할 수 없다.

---

# 14. Matching Rule

Secondary Market Matching:

1. Price Priority
2. Time Priority

즉:

```text
가격 우선
→ 동일 가격이면 먼저 등록된 주문
```

Quantity=1이므로 한 주문은 하나의 Property 거래만 발생시킨다.

---

# 15. Transaction Price

체결가격은 먼저 등록된 체결 가능 Order의 가격을 사용한다.

예:

```text
SELL 700M at 09:00
BUY 720M at 09:05
```

체결:

```text
Transaction Price = 700M
```

---

# 16. Secondary Transaction Atomicity

Transaction 발생 시 다음 상태 변경을 하나의 논리적 Atomic Operation으로 처리한다.

```text
Buyer Asset
Seller Asset
Buyer Ownership
Seller Ownership
Order Status
Transaction Record
Transaction Fee
Loan / Debt if applicable
Decision Log
```

Firestore Transaction 범위 또는 이에 준하는 Server-side atomic workflow를 사용한다.

---

# 17. Secondary Transaction Flow

```text
BUY Order
      ↓
Matching
      ↓
Firestore Transaction
      ↓
Verify BUY still valid
      ↓
Verify SELL still valid
      ↓
Verify buyer locked cash
      ↓
Verify seller locked property
      ↓
Transfer cash
      ↓
Transfer ownership
      ↓
Unlock / settle assets
      ↓
Mark both orders FILLED
      ↓
Write transaction
      ↓
Write decision log
```

어느 검증 단계라도 실패하면 전체 거래가 성공으로 기록되어서는 안 된다.

---

# 18. Asset State Model

Collection:

```text
PLAY_PLAYER_ASSET
```

최소 구조:

```yaml
cash:
  total
  available
  locked

property:
  total
  available
  locked
```

Invariant:

```text
cash.total = cash.available + cash.locked
property.total = property.available + property.locked
```

또한:

```text
cash.available >= 0
cash.locked >= 0
property.available >= 0
property.locked >= 0
```

---

# 19. Critical Race Condition

다음 문제를 반드시 방지한다.

```text
Player Cash = 700M

BUY Order
→ 700M Lock

동시에

Economic Batch
→ 10M Tax Deduction
```

모든 Cash mutation은 동일한 Asset Document를 Transaction으로 보호해야 한다.

즉 다음 작업 모두:

```text
Buy Lock
Cancel Unlock
Transaction Settlement
Tax
Interest
Rent
Living Cost
Forced Sale
Loan Disbursement
Loan Repayment
```

은 `PLAY_PLAYER_ASSET`의 정합성을 깨지 않는 방식으로 처리한다.

---

# 20. Idempotency

모든 Client Action은 재전송될 수 있다고 가정한다.

예:

```text
placeOrder
cancelOrder
buy
sell
```

각 요청에는:

```text
idempotency_key
```

를 사용한다.

동일 Key의 동일 요청이 재전송되면:

```text
중복 Order 생성 금지
중복 Transaction 금지
중복 Cash 차감 금지
```

---

# 21. Real Price / PLAY Price Separation

반드시 다음 가격을 분리한다.

```text
REAL_MARKET_PRICE
PLAY_TRANSACTION_PRICE
PLAY_REFERENCE_PRICE
```

## 21.1 Real Market Price

Season 시작 Snapshot에서 가져오는 실제 시장가격.

## 21.2 PLAY Transaction Price

실제 PLAY 플레이어 거래로 체결된 가격.

## 21.3 PLAY Reference Price

사용자에게 시장 판단을 위한 참고가격.

---

# 22. Reference Price Fallback — 확정

Antigravity 추가 검토 항목을 반영하여 다음으로 확정한다.

```text
if last_transaction_price exists:
    reference_price = last_transaction_price
else:
    reference_price = PRIMARY_INITIAL_PRICE
```

단, 반드시 가격 출처를 기록한다.

```yaml
price_source:
  TRANSACTION
  INITIAL_REFERENCE
```

따라서 분석 단계에서 실제 거래가격과 초기 참고가격을 혼합하지 않는다.

---

# 23. Primary / Secondary Data Separation

거래 데이터에는 반드시:

```text
market_type
```

을 저장한다.

가능한 값:

```text
PRIMARY
SECONDARY
```

Primary는 시장 초기화 데이터다.

Secondary는 가격 발견 및 행동 분석의 핵심 데이터다.

Season Analysis Engine에서는 두 데이터를 분리하여 사용할 수 있어야 한다.

---

# 24. Reference Price History

최소 다음 필드를 고려한다.

```yaml
property_id
season_id
last_transaction_price
last_transaction_at
reference_price
price_source
```

거래가 발생하면:

```text
last_transaction_price
→ latest transaction price
```

거래가 없으면:

```text
PRIMARY_INITIAL_PRICE
```

를 fallback으로 사용한다.

추후 VWAP 등 고급 지표를 도입할 수 있으나 MVP에서 필수 구현하지 않는다.

---

# 25. Jeonse Contract

Collection:

```text
PLAY_JEONSE_CONTRACT
```

최소 필드:

```yaml
contract_id
season_id
property_id
landlord_id
tenant_id
deposit
start_date
end_date
status
next_action_date
```

---

# 26. Jeonse Default

계약 종료 시 반환해야 할 Deposit이 부족하면:

```text
DEFAULT
```

처리한다.

이후 자동 Penalty Loan을 생성한다.

```text
Penalty Loan Rate
=
Normal Loan Rate
+
Penalty Spread
```

Season 1 예시:

```yaml
penalty_spread: 0.10
```

Penalty Loan은 일반 Mortgage와 별도 `loan_type`으로 관리한다.

---

# 27. Rent Contract

Collection:

```text
PLAY_RENT_CONTRACT
```

최소 필드:

```yaml
contract_id
season_id
property_id
landlord_id
tenant_id
deposit
monthly_rent
contract_period
next_payment_date
arrears
grace_until
status
```

---

# 28. Rent Scheduler

매일 전체 Contract를 Scan하지 않는다.

다음 필드를 사용한다.

```text
next_action_date
```

인덱스를 생성하고 만기/납부일이 도래한 Contract만 조회한다.

---

# 29. Rent Default Flow

```text
Payment Due
↓
Payment Attempt
↓
Cash 부족
↓
Arrears
↓
Grace Period
↓
Payment / Recovery
OR
Eviction
```

중복 연체 이벤트가 발생하지 않도록 Contract 상태와 `next_action_date`를 Transaction으로 관리한다.

---

# 30. HOMELESS

강제퇴거 후:

```text
housing_status = HOMELESS
```

HOMELESS는 Game Over가 아니다.

플레이어는 경제활동을 계속하고 다시 주택시장에 진입할 수 있다.

---

# 31. Minimum Housing Expense

HOMELESS 상태에서도:

```text
minimum_housing_expense
```

를 발생시킨다.

금액은 Season Configuration으로 관리한다.

Code에 영구 하드코딩하지 않는다.

---

# 32. Negative Cash

다음 조건을 유지한다.

```text
cash >= 0
```

현금흐름 부족 시:

```text
Cash Buffer
↓
Grace Period
↓
Forced Sale
```

순으로 처리한다.

---

# 33. Forced Sale

Forced Sale은 Synthetic Buyer를 생성하지 않는다.

즉:

```text
Forced SELL
+
No BUYER
```

상태를 허용해야 한다.

강제매각 대상 Property는 시장에 SELL Order로 등록할 수 있으며 실제 Buyer가 존재할 때 체결된다.

구체적인 강제매각 우선순위는 별도 Economic Engine 규칙과 연결하여 구현한다.

이번 문서에서는 새로운 매각 우선순위를 임의로 정의하지 않는다.

---

# 34. Primary / Secondary Market Integrity

다음 조건을 반드시 유지한다.

```text
Primary Supply
→ 초기 공급용

Secondary Market
→ Player-to-Player

Synthetic Liquidity
→ 금지

NPC Buyer
→ 금지

NPC Seller
→ 금지

Market Maker
→ 금지
```

---

# 35. Server Authority

Client가 직접 변경할 수 없는 데이터:

```text
cash
debt
property ownership
locked asset
order status
transaction
market price
economic state
season clock
contract status
```

Client는 Intent만 전달한다.

예:

```text
placeOrder
cancelOrder
requestPurchase
requestSale
```

---

# 36. Firebase Security Rules

PLAY Collections의 직접 Client Write를 기본적으로 차단한다.

개념:

```text
PLAY_* write
→ Server only
```

Client는 필요한 범위에서 Read만 허용한다.

단, 개인정보 및 타 Player의 민감한 자산정보가 노출되지 않도록 Read Scope도 별도로 설계한다.

---

# 37. Season Initialization Architecture

전국 Property를 한 번의 Cloud Function으로 초기화하지 않는다.

구조:

```text
Season Start
      ↓
Initialization Controller
      ↓
Property Batch Chunk
      ↓
Cloud Tasks / Pub/Sub
      ↓
Worker
      ↓
PLAY_PRIMARY_SUPPLY
```

Chunk 단위는 실제 부하 테스트 후 결정한다.

---

# 38. Initialization Idempotency

Initialization Worker가 재시도되어도 중복 Supply가 생성되지 않아야 한다.

Key:

```text
season_id + property_id
```

또는 동등한 Unique Idempotency 구조를 사용한다.

---

# 39. Economic Batch Architecture

Economic Engine Batch 역시 대량 Player를 단일 Function에서 처리하지 않는다.

```text
Season Clock
↓
Batch Controller
↓
Player Chunk
↓
Cloud Tasks / Pub/Sub
↓
Worker
↓
PLAY_PLAYER_ASSET
PLAY_PLAYER_STATE
```

각 Worker는 재시도 가능해야 한다.

---

# 40. Economic Batch와 User Action 동시성

Batch와 User Action이 같은 Player Asset을 수정할 수 있으므로 모든 Cash mutation은 동일한 정합성 모델을 사용한다.

예:

```text
Batch Tax
Batch Interest
Batch Rent
Batch Living Cost
BUY Lock
SELL Settlement
Loan Repayment
```

모두 `PLAY_PLAYER_ASSET`을 기준으로 Transaction-safe하게 처리한다.

---

# 41. Order Book Contention

인기 Property에 주문이 집중될 수 있다.

MVP에서는 우선 Firestore Transaction 기반 Matching으로 구현한다.

실제 부하 테스트에서 문제가 확인되면:

```text
Event
↓
Pub/Sub
↓
Single Property Matching Worker
```

형태의 비동기 Matching Engine으로 확장할 수 있도록 인터페이스를 분리한다.

MVP에서 성급하게 Event Sourcing 전체를 도입하지 않는다.

---

# 42. Required Firestore Indexes

최소 다음 Query를 지원하도록 Index를 설계한다.

## PLAY_ORDER

```text
property_id
status
side
price
created_at
```

실제 Firestore 복합 Index는 구현 Query에 맞춰 생성한다.

## PLAY_RENT_CONTRACT

```text
status
next_action_date
```

## PLAY_JEONSE_CONTRACT

```text
status
next_action_date
```

## PLAY_PRIMARY_SUPPLY

```text
season_id
status
expires_at
```

---

# 43. Data History

Firestore는 Current State 중심으로 사용한다.

History는 장기적으로 BigQuery로 이동한다.

주요 History:

```text
Order History
Transaction History
Decision Log
Economic State
Property State
Player State Snapshot
Contract History
```

---

# 44. BigQuery Analysis Data

Season Analysis Engine이 다음 분석을 수행할 수 있도록 History를 보존한다.

```text
Player State
+
Property State
+
Market State
+
Decision
+
Transaction
+
Outcome
```

Primary와 Secondary를 반드시 구분한다.

---

# 45. Decision Log

거래가 발생했을 때 최소한 다음 Context를 저장한다.

```yaml
decision_id
season_id
player_id
simulation_time

player_state:
  cash
  income
  debt
  net_worth
  cash_flow
  ltv
  dsr

property_state:
  property_id
  price
  gli
  rent

market_state:
  interest_rate
  inflation
  market_phase

decision:
  action
  amount
  loan
  holding_period

transaction:
  transaction_id
  market_type
  price
```

---

# 46. Reason Tag

Reason Tag는 선택 입력이다.

예:

```text
PRICE_EXPECTATION
GLI
CASH_FLOW
LIFE_EVENT
INTEREST_RATE
LOCATION
PANIC
PROFIT_TAKING
OTHER
```

MVP에서는 거래 성립의 필수 조건으로 만들지 않는다.

---

# 47. Security / Anti-Cheat

Server에서 검증해야 하는 핵심 값:

```text
cash
income
debt
property ownership
order price
order status
transaction price
season time
market state
```

Client가 전달한 가격이나 자산 상태를 신뢰하지 않는다.

모든 핵심 계산은 Server-side State를 기준으로 한다.

---

# 48. Transaction Fees

Transaction Fee는 Season Configuration으로 관리한다.

BUY / SELL 처리 시 Fee를 정확히 계산하고 Asset Lock 단계에서 필요한 현금을 검증한다.

예:

```text
required_cash
=
purchase_price
+
purchase_fee
```

실제 Fee율은 Economic Engine의 확정 Configuration을 사용하며 이 문서에서 새 값을 정의하지 않는다.

---

# 49. Observability

MVP부터 다음 Log를 남긴다.

```text
Order Created
Order Cancelled
Order Matched
Transaction Created
Primary Purchase
Asset Lock
Asset Unlock
Loan Created
Contract Default
Eviction
Forced Sale
Batch Started
Batch Completed
Batch Failed
```

각 Event에는:

```text
season_id
player_id
property_id
timestamp
request_id / idempotency_key
rule_version
```

등을 포함할 수 있도록 한다.

---

# 50. Error Handling

모든 Server Action은 명확한 Error Code를 반환한다.

예:

```text
INSUFFICIENT_CASH
PROPERTY_NOT_OWNED
PROPERTY_LOCKED
ORDER_NOT_FOUND
ORDER_ALREADY_FILLED
ORDER_ALREADY_CANCELLED
PRIMARY_SUPPLY_EXHAUSTED
PRIMARY_MARKET_CLOSED
SEASON_NOT_ACTIVE
INVALID_PRICE
DUPLICATE_REQUEST
CONCURRENT_UPDATE
```

Client는 Error Code에 따라 사용자에게 이해 가능한 메시지를 표시한다.

---

# 51. Testing Requirements

## 51.1 Unit Test

- Supply Calculation
- Floor + Minimum 1
- Price Matching
- Fee Calculation
- Asset Lock
- Asset Unlock
- Reference Price Fallback
- Loan Rate Calculation
- Rent Arrears
- HOMELESS State

## 51.2 Transaction Test

- Concurrent BUY
- Concurrent SELL
- BUY + Tax
- BUY + Interest
- Cancel + Batch
- Double Submit
- Retry
- Duplicate Transaction

## 51.3 Supply Test

```text
available_quantity = 1
5 concurrent BUY
```

Expected:

```text
1 successful
4 rejected
```

## 51.4 Asset Test

```text
cash = 700M
BUY lock = 700M
Tax = 10M
```

Expected:

```text
Negative cash prohibited
No double spend
```

## 51.5 Scale Test

Minimum scenario:

```text
10 players
100 players
1,000 players
10,000 players
```

---

# 52. Implementation Order

구현 순서는 다음을 권장한다.

## Phase 1 — Data Model

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_ASSET
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_PRIMARY_SUPPLY
```

## Phase 2 — Primary Supply

```text
Snapshot
Supply Calculation
Counter
Purchase
Ownership
Expiration
```

## Phase 3 — Secondary Order Book

```text
Order
Asset Lock
Matching
Cancel
Transaction
```

## Phase 4 — Contracts

```text
Jeonse
Jeonse Default
Penalty Loan
Rent
Arrears
Eviction
HOMELESS
```

## Phase 5 — Economic Integration

```text
Tax
Interest
Living Cost
Cash Flow
Forced Sale
```

## Phase 6 — History / Analysis

```text
Decision Log
Transaction History
BigQuery
Season Analysis Input
```

## Phase 7 — Scale / Reliability

```text
Cloud Tasks
Pub/Sub
Retry
Idempotency
Load Test
Monitoring
```

---

# 53. Implementation Restrictions

Antigravity는 다음을 임의로 변경하지 않는다.

1. 경제 규칙
2. 7억원 초기자산
3. Primary / Secondary 구조
4. Primary Supply 유한성
5. Quantity=1
6. Partial Fill 금지
7. Player-to-Player Secondary Market
8. Synthetic Liquidity 금지
9. HOMELESS 구조
10. Negative Cash 금지
11. Penalty Loan 구조
12. Server Authority

기술적 문제가 발견되면:

```text
Problem
→ Impact
→ Technical Option
→ Required Design Decision
```

형태로 보고하고 구현을 중단한다.

---

# 54. Definition of Done

Property Market MVP는 다음 조건을 모두 만족해야 한다.

- Player가 7억원으로 시작한다.
- Season Snapshot에서 Property가 생성된다.
- Primary Supply가 단지별 Counter로 생성된다.
- Primary Supply가 유한하다.
- Primary Market이 기간 종료된다.
- Player가 Primary에서 Property를 취득할 수 있다.
- Player가 Property를 Secondary에 매도할 수 있다.
- BUY / SELL Order가 생성된다.
- Asset Lock이 동작한다.
- Price / Time Priority가 동작한다.
- Transaction이 정확히 한 번만 발생한다.
- Cash / Property 정합성이 유지된다.
- Primary / Secondary가 데이터상 분리된다.
- Reference Price Fallback이 동작한다.
- Jeonse Default가 Penalty Loan으로 연결된다.
- Rent Arrears가 동작한다.
- Eviction이 동작한다.
- HOMELESS가 동작한다.
- Negative Cash가 발생하지 않는다.
- Client가 핵심 자산을 직접 수정할 수 없다.
- Duplicate Request가 중복 거래를 만들지 않는다.
- Concurrent Transaction 테스트를 통과한다.
- Batch와 User Action 동시성 테스트를 통과한다.
- History가 Season Analysis Engine에서 사용할 수 있는 형태로 저장된다.

---

# 55. Final Implementation Principle

PLAY 부동산 시장의 구현에서 가장 중요한 것은 기능의 수가 아니다.

다음 불변 구조를 지키는 것이 핵심이다.

```text
Economic Rule
      ↓
Server State
      ↓
Human Decision
      ↓
Order
      ↓
Matching
      ↓
Transaction
      ↓
Asset / Ownership Update
      ↓
Decision Log
      ↓
Observed Outcome
      ↓
Season Analysis
```

이 흐름에서 Client는 **의사결정의 입력자**이고, Server는 **경제 상태의 최종 권위자**다.

구현 편의를 위해 Client에서 경제 상태를 계산하거나 수정하지 않는다.

또한 경제적 의미가 달라지는 기술적 우회책을 임의로 도입하지 않는다.

본 문서를 기반으로 Antigravity는 먼저 구현 계획과 기술적 위험을 검토하고, 이후 실제 코드 구현에 들어간다.
