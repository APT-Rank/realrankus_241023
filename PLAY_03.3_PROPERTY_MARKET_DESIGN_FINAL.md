# PLAY_03.3_PROPERTY_MARKET_DESIGN_FINAL

## 1. 문서 목적

본 문서는 `PLAY_03.2_PROPERTY_MARKET_DESIGN_FINAL.md` 및 Antigravity 검토 결과를 반영하여 PLAY 부동산 시장 설계를 최종 확정하기 위한 문서다.

핵심 원칙은 다음과 같다.

- Season 시작 시 모든 플레이어는 동일하게 7억원 현금에서 시작한다.
- 초기 매물 부족 문제는 NPC나 Market Maker가 아니라 **Season Initialization Supply Market**으로 해결한다.
- 초기 공급 이후의 가격 발견은 실제 플레이어 간 Secondary Market 거래를 통해 형성한다.
- Primary Market의 초기 가격은 Season 시작 시점의 실제 거래가격 스냅샷을 사용한다.
- Primary Market과 Secondary Market의 거래 데이터는 명확히 분리한다.
- 모든 주문 및 거래의 최종 권한은 서버에 둔다.
- 수량은 1개로 제한하며 Partial Fill은 사용하지 않는다.
- 현금 및 부동산은 주문 시 Lock하여 이중 사용을 방지한다.
- 전세/월세의 미납 및 강제퇴거는 경제 엔진과 연결한다.
- 음수 현금은 허용하지 않으며, 현금 버퍼 → 유예 → 강제매각 구조를 사용한다.

---

## 2. Antigravity 검토에서 남은 3개 의사결정

Antigravity 검토 결과 03.2 설계는 기술적·논리적으로 강한 상태이며, 구현 전 아래 3개 경제 규칙의 확정이 필요하다.

1. Primary Market 공급량 및 종료 조건
2. 전세 Default 발생 시 Penalty Loan 금리
3. 월세 강제퇴거 이후 주거 상태 및 비용

본 문서는 위 3개를 확정한다.

---

# 3. Primary Market 최종 설계

## 3.1 명칭

기존 `Primary Market`이라는 명칭은 실제 한국 부동산의 신규분양/1차 시장과 혼동될 수 있다.

PLAY 내부 개념상 다음 명칭을 사용한다.

**Season Initialization Supply Market**

단, 데이터 필드와 API에서는 기존 호환성을 위해 `market_type = PRIMARY`를 사용할 수 있다.

---

## 3.2 목적

Season 시작 직후 모든 플레이어가 부동산을 보유하지 않은 상태에서 Secondary Market을 시작하면 매도자가 존재하지 않는 문제가 발생한다.

Season Initialization Supply Market은 이 문제를 해결하기 위한 **시장 초기화용 공급 메커니즘**이다.

이는 NPC, Market Maker 또는 지속적인 시스템 매물이 아니다.

---

## 3.3 초기 공급량

### 최종 결정

**유한 공급(Finite Supply)을 사용한다.**

초기 공급량은 실제 해당 단지의 가구 수를 기준으로 Season별 공급비율을 적용한다.

개념식:

```text
Primary Supply Quantity
= Complex Household Count × PRIMARY_SUPPLY_RATIO
```

수량은 정수 단위로 처리한다.

최소 공급량은 시스템상 1개 이상이 되도록 별도 규칙을 둔다.

예:

```yaml
primary_market:
  supply_mode: FINITE
  primary_supply_ratio: 0.10
```

위 `0.10`은 Season 1의 예시값이며 영구적인 고정값이 아니다.

Season별로 변경 가능한 Configuration으로 관리한다.

---

## 3.4 Primary Market 운영 기간

Primary Market은 무기한으로 열지 않는다.

### 최종 결정

**Season 시작 후 일정 기간만 운영하고 자동 종료한다.**

예:

```yaml
primary_market:
  duration_days: 3
```

위 3일은 Season 1의 예시 Configuration이다.

운영 종료 조건:

```text
Primary Supply Exhausted
OR
Primary Market Duration Expired
```

둘 중 하나가 먼저 충족되면 해당 단지의 Primary Market은 종료된다.

---

## 3.5 Primary Market 가격

Primary Market 최초 가격은 Season 시작 시점의 실제 거래가격 Snapshot을 사용한다.

```text
PRIMARY_INITIAL_PRICE
=
RealRankers Real Transaction Snapshot
```

이 가격은 초기 공급가격으로만 사용한다.

Primary Market 가격이 이후 Secondary Market 가격을 직접 결정하지 않는다.

---

## 3.6 Primary → Secondary 전환

플레이어가 Primary Market에서 부동산을 매수하면 해당 부동산의 소유권이 플레이어에게 귀속된다.

이후 해당 플레이어가 매도 주문을 제출하면 Secondary Market의 SELL Order가 된다.

```text
Season Start
    ↓
Initialization Supply
    ↓
Player Purchase
    ↓
Player Ownership
    ↓
Secondary SELL Order
    ↓
Player-to-Player Transaction
```

따라서 초기 공급은 시장을 시작시키는 장치이며, 이후 가격 발견은 플레이어 간 거래에 의해 이루어진다.

---

# 4. Secondary Market 최종 설계

## 4.1 시장 구조

Secondary Market은 실제 플레이어 간 주문으로만 구성한다.

```text
Player A → SELL
Player B → BUY
       ↓
Order Matching
       ↓
Transaction
```

NPC 매도/매수 또는 Market Maker는 사용하지 않는다.

---

## 4.2 주문 단위

### 최종 결정

**Quantity = 1**

Partial Fill은 사용하지 않는다.

한 주문은 하나의 대표 면적 단위 부동산에 대한 거래 의사로 정의한다.

---

## 4.3 Matching Rule

매칭 우선순위:

1. Price Priority
2. Time Priority

즉,

```text
가격 우선
→ 동일 가격이면 시간 우선
```

거래 가격은 먼저 등록된 체결 가능 주문의 가격을 사용한다.

---

## 4.4 주문 상태

Order는 다음 상태를 가질 수 있다.

```text
OPEN
PARTIALLY_FILLED  # 현재 Quantity=1이므로 실질적으로 사용하지 않음
FILLED
CANCELLED
EXPIRED
```

MVP에서는 `PARTIALLY_FILLED` 상태를 실제 로직에서 사용하지 않는다.

---

# 5. Asset Lock

주문 제출과 동시에 거래 가능 자산을 Lock한다.

## 5.1 BUY Order

BUY 주문:

```text
available_cash
→ locked_cash
```

체결:

```text
locked_cash
→ purchase
```

취소:

```text
locked_cash
→ available_cash
```

---

## 5.2 SELL Order

SELL 주문:

```text
available_property
→ locked_property
```

체결:

```text
locked_property
→ buyer ownership
```

취소:

```text
locked_property
→ available_property
```

---

## 5.3 데이터 필드

Player Asset State에는 최소한 다음을 둔다.

```yaml
cash:
  total: 0
  available: 0
  locked: 0

property:
  total: 0
  available: 0
  locked: 0
```

정합성 규칙:

```text
total = available + locked
```

---

# 6. Transaction Price와 Reference Price 분리

PLAY에서는 실제 체결가격과 참고가격을 분리한다.

## 6.1 Transaction Price

실제 거래가 체결된 가격.

```text
last_transaction_price
```

---

## 6.2 Reference Price

최근 거래가 없을 때 사용자가 시장 상황을 판단할 수 있도록 제공하는 참고가격.

```text
market_reference_price
```

Reference Price는 실제 거래가격과 동일하다고 간주하지 않는다.

---

## 6.3 중요 원칙

다음 세 값을 혼동하지 않는다.

```text
Real Market Price
PLAY Transaction Price
PLAY Reference Price
```

각각의 의미와 데이터 소스를 분리한다.

---

# 7. Price Discovery

PLAY의 핵심 가격 발견 원리는 다음과 같다.

```text
Initial Real Price
       ↓
Initialization Supply
       ↓
Player Ownership
       ↓
Player Orders
       ↓
Player-to-Player Transactions
       ↓
Observed PLAY Transaction Price
       ↓
Regional / Property Market Statistics
```

따라서 Regional Index는 가격을 결정하는 입력값이 아니라 **관측된 거래 결과를 집계한 결과값**으로 취급한다.

---

# 8. 전세 시장

전세도 동일한 Order Book 구조를 사용한다.

```text
JEONSE BUY / DEMAND
JEONSE SELL / SUPPLY
        ↓
Matching
        ↓
JEONSE CONTRACT
```

전세 계약에서는 보증금과 계약기간을 관리한다.

---

## 8.1 전세 Default

플레이어가 계약 종료 시점에 전세보증금을 반환하지 못하면 Default 상태로 전환한다.

### 최종 결정

**자동 Penalty Loan을 발생시킨다.**

전세보증금 반환을 위해 시스템이 플레이어에게 Penalty Loan을 부여한다.

---

## 8.2 Penalty Loan 금리

Penalty Loan 금리는 일반 주택담보대출보다 높게 설정한다.

개념식:

```text
Penalty Loan Rate
=
Normal Loan Rate
+
PENALTY_SPREAD
```

Season 1 예시:

```yaml
jeonse_default:
  penalty_spread: 0.10
```

즉 +10%p를 예시로 사용한다.

이는 영구 고정값이 아니라 Season Configuration으로 관리한다.

---

## 8.3 Penalty Loan 특징

Penalty Loan은 일반 주택담보대출과 구분한다.

```yaml
loan_type:
  MORTGAGE
  JEONSE_DEFAULT_PENALTY
```

Penalty Loan에는 별도의 상환 우선순위와 금리 조건을 적용할 수 있도록 설계한다.

---

# 9. 월세 시장

월세 역시 플레이어 간 시장을 사용한다.

```text
MONTHLY_RENT ORDER
       ↓
Matching
       ↓
RENT CONTRACT
       ↓
Monthly Payment
```

월세는 다음 정보를 관리한다.

```text
deposit
monthly_rent
contract_period
payment_due
arrears
grace_period
eviction_status
```

---

# 10. 월세 미납 및 강제퇴거

월세를 납부하지 못하면 즉시 퇴거시키지 않는다.

### 처리 순서

```text
Payment Due
   ↓
Missed Payment
   ↓
Arrears
   ↓
Grace Period
   ↓
Eviction
```

Grace Period 동안 플레이어는 현금 확보, 자산 매각, 주거 이전 등의 행동을 할 수 있다.

---

# 11. 강제퇴거 이후 주거 상태

### 최종 결정

강제퇴거 이후 플레이어는 `HOMELESS` 상태가 될 수 있다.

```yaml
housing_status:
  OWNER
  JEONSE
  RENT
  HOMELESS
```

이는 게임오버가 아니다.

HOMELESS 상태에서도 플레이어는 경제활동을 계속할 수 있으며 다시 주택시장에 진입할 수 있다.

---

# 12. Minimum Housing Expense

HOMELESS 상태가 되면 주거비가 0원이 되도록 하지 않는다.

### 최종 결정

**Minimum Housing Expense를 자동 발생시킨다.**

이는 최소한의 주거를 유지하기 위해 필요한 경제적 비용을 추상화한 것이다.

예:

```yaml
homeless:
  minimum_housing_expense: 0
```

실제 금액은 Season Configuration에서 결정한다.

중요한 점은 `HOMELESS = Housing Cost 0`으로 만들지 않는 것이다.

---

# 13. HOMELESS 상태의 경제적 의미

HOMELESS는 단순한 게임 상태가 아니라 경제적 의사결정 결과로 취급한다.

예를 들어 다음과 같은 분석이 가능하다.

```text
과도한 레버리지
→ 현금흐름 악화
→ 주택비용 미납
→ 강제퇴거
→ HOMELESS
→ 최소 주거비 발생
→ 재진입 또는 장기 생존
```

이를 통해 주거 안정성, 레버리지, 현금흐름, 위험관리 행동을 분석할 수 있다.

---

# 14. Negative Cash 정책

PLAY에서는 현금이 음수가 되는 것을 허용하지 않는다.

```text
cash >= 0
```

현금 부족 시 처리 순서:

```text
Cash Buffer
   ↓
Grace Period
   ↓
Forced Sale
   ↓
HOMELESS / Other State
```

강제매각은 충분한 유동성 확보가 어려운 경우의 최후 수단으로 사용한다.

---

# 15. Primary Market와 Secondary Market 데이터 분리

모든 거래에는 반드시 `market_type`을 기록한다.

```yaml
market_type:
  PRIMARY
  SECONDARY
```

Primary 거래는 초기 시장 형성용 거래이고, Secondary 거래는 실제 플레이어 간 가격 발견 거래다.

Season Analysis Engine은 두 시장을 별도로 분석할 수 있어야 한다.

---

# 16. Forecast Data 원칙

가격 예측 및 행동 분석에서는 Secondary Market 거래를 핵심 학습 데이터로 사용한다.

Primary 거래는 초기화 거래이므로 Secondary 거래와 섞어서 가격발견 데이터를 만들지 않는다.

분석 구조:

```text
Primary Transaction
→ Market Initialization Data

Secondary Transaction
→ Price Discovery Data
→ Behavioral Data
→ Forecast Data
```

---

# 17. Reason Tag

사용자가 주문 또는 거래 시 선택할 수 있는 `Reason Tag`를 제공할 수 있다.

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

단, MVP에서는 필수 입력으로 만들지 않는다.

실제 행동 데이터가 우선이며 Reason Tag는 보조적인 설명 변수로 취급한다.

---

# 18. Server Authority

모든 핵심 거래 로직은 서버에서 검증한다.

Client는 다음만 요청한다.

```text
BUY
SELL
CANCEL
```

서버가 다음을 최종 판단한다.

```text
Cash Availability
Property Ownership
Locked Asset
Loan Eligibility
LTV
DSR
Order Validity
Matching
Transaction
Fee
Ownership Transfer
Debt Update
```

Client가 직접 핵심 자산 상태를 수정할 수 없어야 한다.

---

# 19. 동시성 및 정합성

거래 체결 과정에서 다음 문제가 발생할 수 있다.

```text
Player A BUY
Player B SELL
Batch Economic Update
```

동시에 실행될 경우 이중 체결 또는 이중 자산 사용이 발생할 수 있다.

따라서 다음 기술을 사용한다.

- Firestore Transaction
- Optimistic Lock
- Idempotency Key
- Asset Lock
- Server-side validation

---

# 20. 데이터 구조

최소 핵심 Collection:

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_STATE
PLAY_PLAYER_ASSET
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_ORDER
PLAY_TRANSACTION
PLAY_RENT_CONTRACT
PLAY_JEONSE_CONTRACT
PLAY_LOAN
PLAY_DECISION_LOG
PLAY_ECONOMIC_STATE
PLAY_SEASON_RESULT
```

History/분석 데이터는 장기적으로 BigQuery를 사용한다.

Firestore는 현재 상태와 실시간 거래 처리에 집중하고, BigQuery는 대규모 History 및 Season Analysis에 사용한다.

---

# 21. 핵심 데이터 필드

Order:

```yaml
order_id
season_id
player_id
property_id
market_type
side
price
status
created_at
locked_asset
idempotency_key
```

Transaction:

```yaml
transaction_id
season_id
property_id
buyer_id
seller_id
market_type
transaction_price
transaction_fee
executed_at
```

Property Ownership:

```yaml
season_id
player_id
property_id
ownership_status
acquired_price
acquired_at
```

---

# 22. Season Configuration

이번 설계에서 확정한 값은 Code에 하드코딩하지 않는다.

예:

```yaml
primary_market:
  supply_mode: FINITE
  primary_supply_ratio: 0.10
  duration_days: 3

jeonse_default:
  penalty_spread: 0.10

homeless:
  minimum_housing_expense: configurable
```

각 Season은 다음 정보를 가진다.

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
configuration_version
```

이를 통해 Season 간 규칙 변경과 결과 비교가 가능하도록 한다.

---

# 23. Season 1 핵심 시장 흐름

```text
Season Start
      ↓
RealRankers Real Transaction Snapshot
      ↓
Season Initialization Supply Market
      ↓
Players Purchase Properties
      ↓
Primary Market Closed
      ↓
Secondary Order Book Open
      ↓
Player BUY / SELL
      ↓
Price-Time Matching
      ↓
Transaction
      ↓
Ownership / Cash / Debt Update
      ↓
PLAY Transaction Price Accumulation
      ↓
Market Statistics
      ↓
Season Analysis
```

---

# 24. 핵심 설계 원칙

PLAY 부동산 시장의 가장 중요한 원칙은 다음 세 문장으로 요약한다.

### 1.
**실제 가격은 시작점이다.**

### 2.
**플레이어의 거래가 PLAY 가격을 만든다.**

### 3.
**거래 결과가 다음 분석의 데이터가 된다.**

즉,

```text
REAL MARKET
     ↓
INITIAL CONDITION
     ↓
HUMAN DECISION
     ↓
TRANSACTION
     ↓
OBSERVED MARKET
     ↓
BEHAVIORAL DATA
     ↓
SEASON INSIGHT
```

이 구조가 PLAY의 핵심이다.

---

# 25. Implementation Boundary

본 문서는 설계 확정 문서다.

Antigravity는 본 문서를 기반으로 구현하기 전에 다음을 먼저 확인한다.

1. 기존 RealRankers 코드와 PLAY 코드의 논리적 분리
2. Firebase Security Rules
3. Cloud Functions Server Authority
4. Firestore Transaction 구조
5. Asset Lock 구조
6. Primary Supply 생성 및 종료 Scheduler
7. Secondary Order Book
8. BUY/SELL Matching
9. Jeonse Default Loan
10. Rent Arrears / Eviction
11. HOMELESS State
12. Transaction / Decision Log
13. BigQuery History 구조
14. 동시성 테스트
15. Idempotency 테스트

설계상 불명확한 문제가 발견되면 임의로 경제 규칙을 변경하지 않고 이슈를 기록하여 설계 문서 수정 후 구현한다.

---

# 26. 다음 단계

03.3 이후에는 바로 대규모 구현으로 가지 않는다.

권장 순서:

```text
03.3 Design Final
      ↓
Antigravity Technical Review
      ↓
04. Property Market Implementation Spec
      ↓
Antigravity Implementation
      ↓
Test
      ↓
Result Review
      ↓
Economic Engine Integration
      ↓
Season Simulation Test
```

PLAY의 핵심은 빠른 기능 추가가 아니라,

**경제 규칙 → 인간 의사결정 → 거래 → 결과 → 데이터 → 분석**

이라는 실험 구조가 처음부터 깨지지 않는 것이다.
