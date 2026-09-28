# RealRankus PLAY — Property Market Design Update v1.0
## PLAY_03.2_PROPERTY_MARKET_DESIGN_FINAL

> Status: Antigravity Review 반영 설계 업데이트
> Previous Spec: PLAY_03.1_PROPERTY_MARKET_IMPLEMENTATION_SPEC.md
> Review Source: PLAY_03.1_PROPERTY_MARKET_IMPLEMENTATION_SPEC_REVIEW.md
> Implementation Status: **구현 전 — 재검토 필요**

---

# 0. 문서 목적

본 문서는 `PLAY_03.1_PROPERTY_MARKET_IMPLEMENTATION_SPEC.md`에 대한 Antigravity Review 결과를 반영하여, Property Market의 설계를 수정·보완한 업데이트 명세다.

이 문서는 아직 구현 지시서가 아니다.

**Antigravity는 본 문서를 먼저 다시 Review하고, 기술적 문제·누락·충돌을 보고해야 한다. 최종 구현은 재검토 결과를 반영한 후 별도로 지시한다.**

핵심 목적은 다음과 같다.

> **모든 플레이어가 동일하게 7억원의 현금으로 시작하면서도 최초 주택 거래가 가능하도록 하고, 최초 공급 이후에는 실제 사용자 간 거래를 통해 가격이 형성되는 시장을 구축한다.**

---

# 1. 설계의 핵심 변경

Antigravity Review에서 가장 중요한 문제가 발견되었다.

기존 설계:

- 모든 플레이어 초기자산 = 현금 7억원
- 주택 보유 = 0
- 사용자 간 거래만 허용
- NPC / Market Maker 금지

이 경우 시작 시점에 주택을 매도할 사용자가 존재하지 않아 시장이 시작되지 않는다.

따라서 다음과 같이 변경한다.

## 1.1 Primary Market / Secondary Market 분리

### Primary Market

Season 시작 시 시스템이 초기 주택 공급 Pool을 제공한다.

- 시스템은 실제 시장 참여자가 아니다.
- NPC가 아니다.
- Market Maker가 아니다.
- 사용자의 행동을 대체하지 않는다.
- 초기 시장 진입을 위한 공급 메커니즘이다.

사용자는 Primary Market에서 초기 주택을 구매할 수 있다.

### Secondary Market

Primary Market에서 사용자가 주택을 취득한 이후부터는:

**사용자 ↔ 사용자**

거래만 허용한다.

```text
RealRankus Initial Data
        ↓
Season Snapshot
        ↓
Primary Market
Initial Supply Pool
        ↓
Player 최초 구매
        ↓
Ownership 생성
        ↓
Secondary Market
Player ↔ Player
        ↓
Actual Transaction
        ↓
PLAY Market Price
```

---

# 2. 초기자산은 변경하지 않는다

모든 Season 1 플레이어는 기존 설계를 유지한다.

```text
Initial Cash = 700,000,000 KRW
Initial Debt = 0
Initial Property = 0
Initial Financial Asset = 0
```

즉, 플레이어 간 초기조건을 동일하게 유지한다.

초기 주택을 일부 플레이어에게 배분하는 방식은 사용하지 않는다.

---

# 3. Primary Market의 역할

Primary Market은 **최초 시장 진입용 공급 장치**다.

## 3.1 Initial Supply Pool

Season 생성 시 활성화된 Property 중 일부 또는 정해진 물량을 Primary Market에 공급한다.

Primary Market 공급 데이터는 별도로 관리한다.

예:

`PLAY_PRIMARY_PROPERTY_SUPPLY`

필드 후보:

- supply_id
- season_id
- property_id
- initial_price
- available
- sold_to_player_id
- sold_at
- simulation_time
- rule_version
- scenario_version

## 3.2 Initial Price

Primary Market의 최초 가격은 Season 시작 시 Snapshot한 실제 가격을 기준으로 한다.

`initial_price`

단, Primary Market에서 사용자가 최초 구매한 가격은 **Secondary Market의 가격발견 데이터와 동일하게 취급하지 않는다.**

---

# 4. Primary Market 거래와 Secondary Market 거래의 분리

이 구분은 Forecast와 시장분석에서 매우 중요하다.

## Primary Market

```text
SYSTEM INITIAL SUPPLY
        ↓
PLAYER PURCHASE
```

목적:

- 시장 초기화
- 플레이어의 주택시장 진입

## Secondary Market

```text
PLAYER SELL
      ↕
PLAYER BUY
      ↓
TRANSACTION
```

목적:

- 실제 인간 행동에 의한 가격 발견
- 시장 유동성
- 수요/공급 변화
- 행동 데이터 생성

따라서 Transaction에는 반드시 시장 유형을 저장한다.

예:

`market_type`

- PRIMARY
- SECONDARY

Forecast 및 Market Price 계산에서는 필요에 따라 SECONDARY 거래를 중심으로 분석한다.

---

# 5. PLAY Price 형성 원칙

핵심 원칙:

> **PLAY의 시장가격은 사용자 간 Secondary Market 거래 결과를 통해 형성된다.**

Primary Market 가격은 초기 진입가격이다.

Secondary Market에서 실제 사용자 간 거래가 발생하면:

- Last Transaction Price
- VWAP
- Median Transaction Price
- Transaction Count
- Transaction Volume

등을 계산한다.

Primary Market의 초기 거래를 Secondary Market 가격 형성 데이터와 동일하게 취급하지 않는다.

---

# 6. Property 단위

기존 결정 유지:

**아파트 단지 + 대표 면적**

Property 하나는 MVP에서 하나의 거래 가능한 주택 단위로 취급한다.

따라서:

```text
Quantity = 1
```

로 고정한다.

---

# 7. Partial Fill 제거

부동산은 주식과 달리 주택을 부분 단위로 거래하지 않는다.

따라서 MVP에서는:

- Partial Fill 금지
- Remaining Quantity 개념 제거
- Quantity = 1 고정

으로 한다.

주문은 하나의 대표면적 주택 단위를 대상으로 한다.

---

# 8. 매매 Order Book

## PLAY_SALE_ORDER

필수 개념 필드:

- order_id
- season_id
- player_id
- property_id
- order_type: BUY / SELL
- order_price
- quantity = 1
- status
- created_at
- expires_at
- simulation_time
- rule_version

상태:

- OPEN
- FILLED
- CANCELLED
- EXPIRED
- REJECTED

Partial Fill 상태는 사용하지 않는다.

---

# 9. Matching

기존 원칙 유지:

**가격 우선 + 시간 우선**

BUY:

- 높은 가격 우선

SELL:

- 낮은 가격 우선

동일 가격:

- 먼저 주문한 주문 우선

체결 조건:

`highest_buy_price >= lowest_sell_price`

---

# 10. 체결가격

기존 결정 유지:

**먼저 들어온 주문의 가격**

예:

먼저 SELL 8.4억
이후 BUY 8.6억

→ 8.4억 체결

반대 순서라면 먼저 들어온 BUY 가격을 적용한다.

---

# 11. locked_cash / available_cash

Antigravity Review를 반영하여 Player State에 주문 동결 자금을 추가한다.

## PLAY_PLAYER_STATE

개념 필드:

- cash
- available_cash
- locked_cash
- debt
- net_worth
- cash_flow

원칙:

```text
cash = available_cash + locked_cash
```

매수 주문 제출:

```text
available_cash
        ↓
locked_cash
```

주문 취소/만료:

```text
locked_cash
        ↓
available_cash
```

거래 체결:

```text
locked_cash
        ↓
purchase settlement
```

동일 자금을 여러 주문에 사용할 수 없도록 한다.

---

# 12. locked_property / available_property

매도 주문에도 동일한 개념을 적용한다.

## Ownership State

개념적으로:

- available_property
- locked_property

SELL 주문 제출:

```text
available_property
        ↓
locked_property
```

거래 체결:

```text
locked_property
        ↓
buyer ownership
```

주문 취소/만료:

```text
locked_property
        ↓
available_property
```

동일 주택의 중복 매도를 방지한다.

---

# 13. Server Authority

이 원칙을 강화한다.

Client는 직접 Player State나 Transaction을 변경하지 않는다.

Client:

```text
ORDER REQUEST
```

Server:

```text
Validation
→ Lock
→ Matching
→ Transaction
→ Settlement
→ Player State Update
→ Ownership Update
```

최종 권한은 Server에 있다.

Firestore Client Write는 가능한 범위에서 차단한다.

특히 다음은 Client가 직접 수정할 수 없어야 한다.

- cash
- available_cash
- locked_cash
- debt
- ownership
- locked_property
- transaction
- contract
- order status
- settlement result

---

# 14. Concurrency

다음 상황을 반드시 고려한다.

- 동일 Player의 동시 BUY
- 동일 Property의 동시 BUY
- 동일 Property의 동시 SELL
- 동일 주문 중복 체결
- Batch와 거래 동시 실행
- 계약 만료와 매매 동시 실행
- 강제매도와 사용자 매도 동시 실행

필수 방향:

- Firestore Transaction
- Optimistic Lock
- Idempotency
- Duplicate Transaction Prevention

최종 구현 방식은 Antigravity Review를 통해 검토한다.

---

# 15. 전세시장

전세도 사용자 ↔ 사용자 시장으로 유지한다.

## PLAY_JEONSE_ORDER

개념 필드:

- order_id
- season_id
- player_id
- property_id
- order_type: OFFER / SEEK
- deposit
- status
- created_at
- expires_at
- simulation_time
- rule_version

Quantity는 1로 고정한다.

---

# 16. 전세 계약

## PLAY_HOUSING_CONTRACT

전세 계약:

- contract_id
- season_id
- property_id
- landlord_id
- tenant_id
- contract_type = JEONSE
- deposit
- contract_start
- contract_end
- status
- simulation_time
- rule_version

전세보증금은 임대인의 소득이 아니다.

**계약 종료 시 반환해야 하는 의무가 있는 자금이다.**

---

# 17. 전세보증금 Default

Antigravity Review에서 지적된 Default 문제를 명시적으로 정의한다.

계약 만료:

```text
Contract Expiry
      ↓
Landlord Cash Check
      ↓
Cash sufficient?
   ├── YES → Normal Refund
   │
   └── NO
         ↓
   Penalty Loan
         ↓
   Tenant Deposit Refund
         ↓
   Landlord Debt Increase
         ↓
   Default / Penalty State
```

Season 1에서는 현실의 법적 경매·소송 절차를 구현하지 않는다.

목적은 경제적 행동 실험이므로 경제적 결과를 시스템적으로 추상화한다.

### 중요한 원칙

임대인의 보증금 반환 실패 때문에 임차인의 경제시뮬레이션이 중단되어서는 안 된다.

임차인의 보증금 반환은 시스템적으로 보호하고, 그 경제적 부담은 임대인의 Debt / Default로 이동시킨다.

---

# 18. 월세시장

월세도 사용자 ↔ 사용자 시장이다.

월세 주문은:

- deposit
- monthly_rent

두 가격을 가진다.

## PLAY_RENT_ORDER

개념 필드:

- order_id
- season_id
- player_id
- property_id
- order_type: OFFER / SEEK
- deposit
- monthly_rent
- status
- created_at
- expires_at
- simulation_time
- rule_version

Quantity = 1.

---

# 19. 월세 연체

Season 1 MVP에서는 다음과 같이 단순화한다.

```text
월세 납부일
     ↓
현금 충분?
 ├── YES → 정상 납부
 │
 └── NO
      ↓
보증금에서 차감
      ↓
보증금 충분?
 ├── YES → 계속 계약
 │
 └── NO
      ↓
Grace Period
      ↓
미납 지속
      ↓
강제 퇴거 / 계약 종료
```

정확한 Grace Period는 별도 Configuration으로 관리한다.

현실의 복잡한 임대차 법률 절차는 MVP에서 구현하지 않는다.

---

# 20. 음수 Cash 금지

Cash가 음수로 내려가는 장부 구조는 사용하지 않는다.

기존 PLAY_02 원칙을 유지한다.

```text
Cash Flow < 0
      ↓
Cash Buffer 감소
      ↓
Buffer 유지 가능?
 ├── YES → 계속 진행
 │
 └── NO
      ↓
Grace Period
      ↓
Forced Sale
      ↓
Debt / Default 처리
```

즉:

`cash < 0`

을 정상적인 Player State로 허용하지 않는다.

구체적인 Forced Sale 및 Default 순서는 기존 `PLAY_02_ECONOMIC_ENGINE` 규칙과 일치시킨다.

---

# 21. Reason Tag

행동 분석을 강화하기 위해 Reason Tag를 지원한다.

단, **필수 입력이 아니다.**

예시:

- RATE_EXPECTATION
- PRICE_EXPECTATION
- RESIDENCE
- INVESTMENT
- JEONSE_SUBSTITUTE
- RENT_SUBSTITUTE
- GLI_ATTRACTION
- DEVELOPMENT_EXPECTATION
- LIQUIDITY_PREFERENCE
- OTHER

사용자가 실제 의사결정 이유를 입력/선택할 수 있도록 하되, 선택하지 않아도 거래/의사결정은 가능해야 한다.

Reason Tag는 관측된 행동 데이터와 분리하여 분석한다.

**사용자가 입력한 Reason과 실제 행동을 동일한 사실로 취급하지 않는다.**

---

# 22. Decision / Order / Transaction / Contract

각 Entity는 계속 분리한다.

### Decision
사용자가 어떤 선택을 했는가.

### Order
시장에 어떤 주문을 제출했는가.

### Transaction
실제 거래가 체결되었는가.

### Contract
전세/월세 계약이 체결되었는가.

### Ownership / Occupancy
결과적으로 자산/주거 상태가 어떻게 되었는가.

---

# 23. Price Data

다음 값을 명확하게 분리한다.

## Initial Real Price
Season 시작 시 RealRankus에서 Snapshot한 실제 가격.

## Primary Transaction Price
Primary Market에서 최초 구매한 가격.

## Last Transaction Price
Secondary Market의 마지막 실제 사용자 간 거래가격.

## VWAP
Secondary Market 실제 거래를 기준으로 계산하는 거래량 가중 평균가격.

## Median Transaction Price
Secondary Market 거래가격의 중앙값.

## Market Reference Price
거래 부족 시 화면 및 의사결정 보조용 참고가격.

Forecast 및 시장분석에서 각각의 의미를 구분한다.

---

# 24. PLAY Price 정의

MVP에서 `PLAY_PRICE`의 의미를 다음과 같이 정의한다.

### Season 초기

`PLAY_PRICE = Initial Real Price`

단, 이는 초기 Reference/Entry Price다.

### Primary Market

초기 공급 거래는 시장가격 형성의 주요 학습 데이터에서 분리한다.

### Secondary Market 발생 이후

실제 사용자 간 거래 결과를 중심으로:

- Last Transaction Price
- VWAP
- Median
- Transaction Count
- Transaction Volume

을 사용하여 시장 상태를 표현한다.

**PLAY Price는 Secondary Market 거래 결과를 핵심으로 한다.**

---

# 25. Liquidity

가상 유동성을 만들지 않는다.

다음 상태를 그대로 데이터로 보존한다.

- 매수자만 존재
- 매도자만 존재
- 가격 불일치
- 주문 취소
- 장기간 미체결
- 거래 없음

지표:

- order_count
- bid_count
- ask_count
- bid_ask_spread
- transaction_count
- transaction_volume
- time_to_trade
- cancellation_rate
- unmatched_order_rate

---

# 26. Forecast Data

최종 목적은:

**경제환경 → 인간 행동 → 거래 → 시장 변화 → 인간 행동 변화**

를 예측하는 것이다.

따라서 다음 데이터를 유지한다.

### Market Forecast
- transaction volume
- demand
- supply
- liquidity
- bid/ask spread
- regional movement
- property activity
- price movement

### Human Behavior Forecast
- BUY probability
- SELL probability
- HOLD probability
- JEONSE probability
- RENT probability
- leverage behavior
- cash retention
- regional migration

### Outcome Forecast
- future net worth
- economic freedom
- forced sale probability
- debt stress
- housing mobility
- liquidity stress

Forecast에는:

- model_version
- training_seasons
- validation_seasons
- sample_size
- confidence/uncertainty
- forecast_horizon

을 저장한다.

---

# 27. History / BigQuery

기존 방향 유지.

Firestore:

- 현재 Player State
- 현재 Order Book
- 현재 Property State
- 현재 Contract State
- 실시간 UI

BigQuery:

- Transaction History
- Decision History
- Order History
- Property History
- Market History
- Contract History
- Forecast Dataset
- Season Analysis Dataset

History는 삭제하거나 덮어쓰지 않는다.

---

# 28. Firestore 동시성 / 성능

인기 Property에 주문이 집중될 수 있으므로 특정 Document에 모든 Order Book 상태를 집중시키지 않는다.

가능한 구조:

- Order 개별 Document
- Property/Market 단위 Sharding
- Server-side Matching
- Firestore Transaction
- Optimistic Lock
- Event-driven processing

최종 구조는 Antigravity Review를 통해 확정한다.

History 데이터는 장기적으로 BigQuery를 중심으로 관리한다.

---

# 29. 구현 전 추가 검토 항목

다음은 아직 구현하지 않는다.

Antigravity는 본 문서를 기준으로 다음을 다시 Review한다.

1. Primary Market Initial Supply 구조가 기존 RealRankus/PLAY 구조와 충돌하지 않는가?
2. Primary Market을 NPC/Market Maker와 명확하게 분리할 수 있는가?
3. Primary → Secondary 전환 시 Ownership 처리에 문제가 없는가?
4. Quantity=1 구조가 현재 Property 모델과 일치하는가?
5. locked_cash / locked_property 구현이 가능한가?
6. 전세 Penalty Loan이 PLAY_02 Debt Engine과 충돌하지 않는가?
7. 월세 Grace Period / Eviction이 Economic Engine과 충돌하지 않는가?
8. 음수 Cash 금지 규칙이 기존 Forced Sale 규칙과 일치하는가?
9. Firestore Transaction / Optimistic Lock 구조가 충분한가?
10. BigQuery History 구조가 Forecast에 충분한가?
11. 추가적으로 결정해야 할 경제/시장 규칙이 있는가?

---

# 30. Implementation Boundary

**현재 구현 금지.**

이번 단계에서 Antigravity가 수행할 일은:

- 기존 코드 검토
- 현재 데이터 구조 검토
- 본 문서의 논리적 일관성 검토
- 기술적 구현 가능성 검토
- 누락사항 검토
- 충돌사항 검토
- 필요한 추가 의사결정 도출

이다.

경제 규칙을 임의로 변경하지 않는다.

문제가 발견되면:

1. Problem
2. Current Design
3. Why It Matters
4. Options
5. Recommendation
6. Required Decision

형태로 보고한다.

최종 설계 확정 이후 별도 구현 지시를 받는다.

---

# 31. Acceptance Criteria — Design Review 단계

다음 질문에 모두 답할 수 있어야 최종 구현 명세로 넘어간다.

1. 모든 플레이어가 7억원 현금으로 동일하게 시작한다.
2. 초기 주택은 Primary Market을 통해 공급된다.
3. 일부 플레이어에게 주택을 사전 배분하지 않는다.
4. NPC와 Market Maker는 사용하지 않는다.
5. Primary Market과 Secondary Market을 구분한다.
6. Secondary Market은 사용자 ↔ 사용자 거래다.
7. Property는 단지 + 대표 면적이다.
8. Quantity는 1이다.
9. Partial Fill은 없다.
10. locked_cash가 존재한다.
11. locked_property가 존재한다.
12. 매매는 Order Book + 가격우선/시간우선 Matching이다.
13. 체결가격은 먼저 들어온 주문 가격이다.
14. 전세와 월세도 사용자 ↔ 사용자 시장이다.
15. 전세보증금 반환 실패는 Penalty Loan으로 추상화한다.
16. 월세 연체는 보증금 → Grace Period → 강제퇴거 구조다.
17. 음수 Cash를 정상 상태로 허용하지 않는다.
18. 기존 Cash Buffer → Forced Sale 규칙과 연결한다.
19. Reason Tag는 선택 입력이다.
20. Server Authority를 적용한다.
21. 동시성 제어를 적용한다.
22. History는 BigQuery 방향으로 확장 가능하다.
23. Forecast에 필요한 Context Data가 보존된다.

---

# 32. 최종 설계 철학

PLAY의 주택시장은 **시스템이 가격을 정해주는 게임**이 아니다.

처음에는 RealRankus의 실제 데이터를 통해 현실적인 시장에 진입한다.

그 이후에는:

**사람들이 주문하고 → 사람들이 거래하고 → 그 결과 가격이 형성되고 → 가격 변화가 다시 사람들의 행동을 변화시키는 시장**

을 만든다.

따라서:

> **Primary Market은 시장을 시작하기 위한 장치이고, Secondary Market은 인간 행동으로 시장을 만드는 장치다.**

최종적으로 PLAY가 축적하는 핵심 데이터는:

**경제환경 × 인간의 선택 × 거래 × 가격 × 결과**

이며, 이를 여러 Season에 걸쳐 축적하여

> **어떤 경제환경에서 사람들이 어떻게 움직이는가?**

그리고

> **다음에 유사한 환경이 발생하면 시장과 사람들이 어떻게 움직일 가능성이 있는가?**

를 예측하는 것이 PLAY의 최종 목적이다.
