# RealRankus PLAY — Property Market & Housing Transaction Implementation Specification v1.0

## 0. 목적

PLAY의 주택시장을 실제 사용자 행동 기반 시장으로 구현한다.

핵심 원칙:

**RealRankus 실제 아파트 데이터 → Season 시작 Snapshot → PLAY 독립시장 → 사용자 주문 → Matching → 실제 거래/임대차 계약 → 가격·임대료 형성 → 사용자 자산/현금흐름 변화 → 행동 데이터 → Forecast**

가격은 경제엔진이 직접 정하는 입력값이 아니라 **사용자 거래의 결과**다.

---

## 1. 주거시장 구조

PLAY 주거시장은 3개 시장으로 구성한다.

1. 매매
2. 전세
3. 월세

세 시장 모두 기본적으로 **사용자 ↔ 사용자** 시장이다.

- 매매: 사용자 매도 ↔ 사용자 매수
- 전세: 사용자 임대인 ↔ 사용자 임차인
- 월세: 사용자 임대인 ↔ 사용자 임차인

가상 NPC나 Market Maker를 사용해 유동성을 인위적으로 만들지 않는다.

**거래가 없으면 거래가 없는 그대로 기록한다.**

---

## 2. Property 정의

기본 단위는 **아파트 단지 + 대표 면적**이다.

필수 개념 필드:

- complex_id
- complex_name
- representative_area
- location
- region_id

전국 Property Master를 유지하고 Season별로 활성화한다.

---

## 3. Season 시작 데이터 Source Boundary

Season 시작 시 아파트 단지·위치·초기 가격 설정에만 다음 데이터를 사용한다.

`D:\real_estate_data\91_Complex_Valuation`

Season Snapshot 항목:

- complex_id
- complex_name
- location
- representative_area
- initial_price
- initial_price_date

Snapshot 이후에는 위 폴더를 PLAY 가격 업데이트 source로 사용하지 않는다.

본 구현에서 신규 국토부 실거래 API/전월세 실거래 API를 추가하지 않는다.

---

## 4. Real Price와 PLAY Price

### Real Price
Season 시작 시점의 실제 시장가격. 현실적인 초기값 제공용.

### PLAY Price
Season 진행 중 사용자 거래를 통해 형성되는 가격.

둘을 동일한 개념으로 취급하지 않는다.

---

# 5. 매매시장

## 5.1 Order Book

`PLAY_SALE_ORDER`

필수 개념 필드:

- order_id
- season_id
- player_id
- property_id
- order_type: BUY / SELL
- order_price
- quantity
- remaining_quantity
- status
- created_at
- expires_at
- simulation_time
- rule_version

상태:

- OPEN
- PARTIAL_FILLED
- FILLED
- CANCELLED
- EXPIRED

## 5.2 Matching

**가격 우선 + 시간 우선**

- BUY: 높은 가격 우선
- SELL: 낮은 가격 우선
- 동일 가격: 먼저 주문한 주문 우선

최고 BUY 가격 >= 최저 SELL 가격이면 체결 가능.

## 5.3 체결가격

**먼저 들어온 주문의 가격**을 사용한다.

예:

먼저 SELL 8.4억 → 이후 BUY 8.6억 → 8.4억 체결.

반대 순서라면 먼저 들어온 BUY 가격을 적용한다.

## 5.4 부분 체결

부분 체결을 허용한다.

다만 대표 면적 주택 단위이므로 MVP에서는 quantity=1 중심으로 단순화할 수 있다.

---

# 6. 매매 거래

`PLAY_SALE_TRANSACTION`

필수 개념 필드:

- transaction_id
- season_id
- property_id
- buyer_id
- seller_id
- transaction_price
- quantity
- gross_amount
- buyer_fee
- seller_fee
- buyer_total_cost
- seller_net_proceeds
- simulation_time
- market_phase
- rule_version
- scenario_version

체결 후:

### Buyer
- cash 감소
- debt 증가 가능
- ownership 증가
- transaction cost 반영
- net worth 재계산

### Seller
- ownership 감소
- cash 증가
- debt 상환 반영
- transaction cost 반영
- net worth 재계산

---

# 7. 전세시장

전세가격도 시스템이 직접 지정하지 않는다.

사용자가 임대인/임차인으로 주문하고 거래를 통해 가격이 형성된다.

`PLAY_JEONSE_ORDER`

필수 개념 필드:

- order_id
- season_id
- player_id
- property_id
- order_type: OFFER / SEEK
- deposit
- quantity
- remaining_quantity
- status
- created_at
- expires_at
- simulation_time
- rule_version

체결 후 `PLAY_JEONSE_TRANSACTION` 및 `PLAY_HOUSING_CONTRACT`에 기록한다.

계약 최소 필드:

- contract_id
- season_id
- property_id
- landlord_id
- tenant_id
- deposit
- contract_start
- contract_end
- simulation_time
- rule_version
- status

전세보증금은 순수 소득이 아니라 **반환의무가 있는 자금**으로 취급한다.

---

# 8. 월세시장

월세는 보증금과 월 임대료를 함께 주문한다.

예:

- deposit = 50,000,000
- monthly_rent = 2,500,000

`PLAY_RENT_ORDER`

필수 개념 필드:

- order_id
- season_id
- player_id
- property_id
- order_type: OFFER / SEEK
- deposit
- monthly_rent
- quantity
- remaining_quantity
- status
- created_at
- expires_at
- simulation_time
- rule_version

체결 후 `PLAY_RENT_TRANSACTION` 및 `PLAY_HOUSING_CONTRACT`에 기록한다.

---

# 9. 주거 선택

거래 이전의 선택도 기록한다.

`PLAY_HOUSING_CHOICE`

예:

- BUY
- JEONSE
- MONTHLY_RENT
- HOLD
- MOVE_TO_BUY
- MOVE_TO_JEONSE
- MOVE_TO_RENT
- SELL_TO_RENT
- SELL_TO_JEONSE

Context:

- cash
- income
- essential_expense
- debt
- LTV
- DSR
- net_worth
- property context
- market context
- interest_rate
- inflation
- market_phase
- regional market state

목적은 **왜 거래했는지뿐 아니라 왜 거래하지 않았는지도 분석하는 것**이다.

---

# 10. 수수료

Season 1 매매 MVP:

- 매수 2%
- 매도 1.5%

전세/월세 계약 수수료는 별도 configuration으로 관리한다.

수수료는 하드코딩하지 않는다.

`PLAY_TRANSACTION_FEE_CONFIG`

- season_id
- transaction_type
- buyer_fee_rate
- seller_fee_rate
- effective_from
- effective_to
- rule_version

---

# 11. 거래가격과 Reference Price

거래가 없을 수 있다.

따라서 다음을 분리한다.

### Last Transaction Price
실제 마지막 체결가격.

### Market Reference Price
거래가 부족할 때 화면/의사결정을 위한 참고가격.

**Forecast와 행동분석에서는 실제 거래가격과 Reference Price를 구분한다.**

Reference Price는 실제 거래가격을 대체하는 가격 생성기가 되어서는 안 된다.

---

# 12. 대표 시장가격

동일 Property에 여러 거래가 있으면 Primary 지표는 **VWAP**로 한다.

함께 저장:

- vwap
- last_transaction_price
- median_transaction_price
- transaction_count
- transaction_volume
- reference_price

`PLAY_PROPERTY_MARKET_STATE`

---

# 13. 유동성

Season 1에서는 가상 Market Maker를 사용하지 않는다.

다음은 모두 유효한 시장 데이터다.

- 매수만 존재
- 매도만 존재
- 가격 불일치
- 주문 취소
- 거래 없음

Liquidity 지표 후보:

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

# 14. 이상 주문 방어

MVP에서:

1. 가격 범위 제한
2. 경제능력 검증

을 적용한다.

### BUY
- 현금/대출 가능 여부
- LTV
- DSR
- cash flow
- 최소 cash buffer

검증.

### SELL
- 실제 소유 여부
- 중복 매도 여부
- 이미 처리된 자산인지 확인

### 가격
Reference Price 대비 허용 범위를 벗어난 주문은 거부한다.

허용 범위는 Configuration으로 관리하고 테스트 후 확정한다.

---

# 15. 매매·전세·월세 상호작용

세 시장은 독립된 게임이 아니다.

예:

금리 상승
→ 매수 부담 증가
→ 매수 주문 변화
→ 전세/월세 수요 변화

매매가격 상승
→ 주택 구매 부담 증가
→ 전세/월세 선택 변화

전세보증금 상승
→ 전세 진입비용 증가
→ 월세 선택 증가 가능

따라서 시장별 상태와 사용자 주거 선택을 연결한다.

---

# 16. 계약과 점유

### 매매
Ownership 변경.

### 전세/월세
Ownership 변경 없음. Occupancy/Contract relationship 생성.

Property 상태:

- OWNER_OCCUPIED
- JEONSE_OCCUPIED
- RENT_OCCUPIED
- VACANT

MVP에서는 복잡한 다중 임차 구조를 구현하지 않는다.

---

# 17. 임대인의 경제상태

임대인은 실제 PLAY 사용자다.

### 전세
- 보증금 수령
- 현금 증가
- 계약 종료 시 반환 의무

### 월세
- 보증금 수령
- 매월 월세 수입

전세보증금은 **소득이 아니라 반환의무가 있는 자금**으로 처리한다.

---

# 18. 임차인의 경제상태

### 전세
- 보증금 지급
- 현금 감소
- 주거 확보
- 계약 종료 시 보증금 반환받을 권리

### 월세
- 보증금 지급
- 매월 월세 지출
- 주거 확보

모두 Player Cash Flow와 연결한다.

---

# 19. Contract Lifecycle

MVP 상태:

1. OFFER
2. MATCHED
3. ACTIVE
4. EXPIRING
5. EXPIRED
6. TERMINATED

갱신·복잡한 중도해지·보증보험 등은 후속 기능으로 분리한다.

---

# 20. Decision / Order / Transaction / Contract 분리

반드시 분리한다.

- Decision: 사용자가 어떤 선택을 고민/결정했는가
- Order: 시장에 어떤 주문을 제출했는가
- Transaction: 실제로 거래가 체결되었는가
- Contract: 전세/월세 계약이 성립되었는가
- Ownership/Occupancy: 결과적으로 자산/주거상태가 어떻게 되었는가

실패한 주문도 분석할 수 있어야 한다.

---

# 21. Forecast 데이터

향후 Forecast Engine이 다음을 예측할 수 있도록 context를 보존한다.

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
- JEONSE selection probability
- RENT selection probability
- leverage increase probability
- cash retention probability
- regional migration probability

### Outcome Forecast
- future net worth
- economic freedom
- forced sale probability
- debt stress
- housing mobility
- liquidity stress

예측 결과에는 반드시:

- model_version
- training_seasons
- validation_seasons
- sample_size
- confidence/uncertainty
- forecast_horizon

을 저장한다.

---

# 22. History

최소 보존 대상:

- PLAY_PROPERTY_STATE_HISTORY
- PLAY_MARKET_STATE_HISTORY
- PLAY_SALE_TRANSACTION
- PLAY_JEONSE_TRANSACTION
- PLAY_RENT_TRANSACTION
- PLAY_HOUSING_CONTRACT
- PLAY_HOUSING_CHOICE
- PLAY_DECISION_LOG

과거 가격·거래·계약 데이터를 삭제하거나 덮어쓰지 않는다.

---

# 23. DB 방향

MVP 방향:

**Firestore + BigQuery**

Firestore:
- 현재 Season state
- Player state
- 현재 Order Book
- 현재 Property state
- 실시간 UI

BigQuery:
- Transaction history
- Decision history
- Property history
- Market history
- Forecast training dataset
- Season analysis

최종 DB 구성은 기존 RealRankus 인프라와 기술 검토 결과를 반영한다.

---

# 24. Server Authority

거래/경제상태의 최종 권한은 서버에 둔다.

Client → 요청  
Server → 검증  
Server → matching  
Server → transaction/contract 확정  
Server → Player State 갱신  
Client → 결과 표시

Client가 임의로 거래가격, 현금, 부채, 소유권, 계약, 거래결과를 변경할 수 없어야 한다.

---

# 25. Concurrency

동시 이벤트를 고려한다.

- Player BUY
- Player SELL
- 계약 만료
- 경제엔진 Batch
- 이자 계산
- 강제매도

필요 기술:

- optimistic locking 또는 transaction lock
- idempotency
- duplicate transaction prevention

---

# 26. 금액 정밀도

JavaScript Number의 부동소수점 오류를 방지한다.

후보:

- BigInt 기반 정수 KRW
- decimal.js / big.js

최종 선택은 Antigravity 기술 검토 후 결정한다.

---

# 27. 구현 순서

### Phase 1
Property Master / Season Snapshot

### Phase 2
Sale Order Book

### Phase 3
Sale Matching / Transaction

### Phase 4
Ownership / Player State 반영

### Phase 5
Jeonse Order / Matching / Contract

### Phase 6
Monthly Rent Order / Matching / Contract

### Phase 7
Housing Choice / Decision Log

### Phase 8
Market State / Liquidity / VWAP

### Phase 9
History / BigQuery integration

### Phase 10
Forecast data contract

각 Phase 완료 후 테스트 결과를 확인하고 다음 Phase로 진행한다.

---

# 28. 필수 테스트

## 매매
- 정상 BUY/SELL
- 가격 불일치
- 부분 체결
- 동일 가격 시간 우선
- 중복 SELL
- 현금 부족
- 대출 한도 초과
- 가격 범위 초과
- 주문 취소
- 주문 만료

## 전세
- 정상 계약
- 보증금 부족
- 중복 임대
- 계약 종료
- 보증금 반환
- 거래 없음

## 월세
- 정상 계약
- 보증금 부족
- 월세 현금흐름 부족
- 계약 종료
- 임대료 수입
- 거래 없음

## 동시성
- 동일 Property 동시 BUY
- 동일 Property 동시 SELL
- 동일 주문 중복 체결
- Batch와 주문 동시 실행

---

# 29. Antigravity Implementation Boundary

Antigravity는 경제·시장 규칙을 임의로 변경하지 않는다.

구현 중 문제가 발견되면:

1. 문제 기록
2. 원인과 영향 설명
3. 대안 제시
4. 임의 확정 금지
5. 사용자/설계자 결정 후 반영

특히 다음은 임의 변경하지 않는다.

- Property 정의
- Season 시작가격 Source
- 가격 형성 철학
- 사용자 간 거래 원칙
- Order Book 원칙
- Matching 원칙
- 체결가격 원칙
- Reference Price / Transaction Price 분리
- 전세/월세 사용자 간 거래
- 거래 없는 시장을 인위적으로 채우지 않는 원칙
- Forecast용 데이터 보존

---

# 30. Anti-Goals

현재 구현하지 않는다.

- 신규 국토부 API 연동
- 가상 NPC 거래자
- 가상 Market Maker
- AI가 직접 가격 결정
- AI가 직접 거래
- 개별 동·호수 모델
- 복잡한 세금제도
- 복잡한 임대차 법률제도
- 전세보증보험
- 복잡한 중도해지/갱신
- 완전한 현실 한국 부동산 제도 복제
- 대규모 UI/그래픽 개발

---

# 31. Acceptance Criteria

다음이 모두 가능하면 Property Market MVP 핵심 구현 완료로 본다.

1. Season 시작 시 `D:\real_estate_data\91_Complex_Valuation`에서 Property 초기값을 Snapshot할 수 있다.
2. Snapshot 이후 가격은 해당 폴더에서 가져오지 않는다.
3. 사용자가 매수/매도 주문을 제출할 수 있다.
4. Order Book이 존재한다.
5. 가격 우선 + 시간 우선 Matching이 작동한다.
6. 먼저 들어온 주문 가격으로 거래가격이 결정된다.
7. 실제 사용자 간 거래가 발생한다.
8. 거래가 없으면 인위적 거래를 생성하지 않는다.
9. Transaction Price와 Reference Price가 분리된다.
10. VWAP를 계산할 수 있다.
11. 전세 주문과 계약이 가능하다.
12. 월세 주문과 계약이 가능하다.
13. 매매/전세/월세가 Player Cash Flow에 반영된다.
14. 매매는 Ownership, 전세/월세는 Occupancy/Contract 상태를 변경한다.
15. Decision / Order / Transaction / Contract가 분리 저장된다.
16. 거래 이력과 시장 상태 이력이 보존된다.
17. Forecast에 필요한 Context Data가 저장된다.
18. Client가 거래 결과나 Player State를 임의 조작할 수 없다.
19. 동시 거래에 대한 중복 체결이 방지된다.
20. 핵심 테스트 케이스가 재현 가능한 방식으로 검증된다.

---

# 32. 최종 설계 원칙

**PLAY의 시장은 시스템이 가격을 정하는 시장이 아니다.**

사람들이 주문하고, 사람들이 거래하고, 그 결과로 가격이 만들어지는 시장이다.

RealRankus는 현실적인 시작점을 제공한다.

PLAY는 그 이후의 경제세계를 독립적으로 생성한다.

PLAY가 축적하는 핵심 데이터는:

**경제환경 × 인간의 선택 × 거래 × 결과**

이다.

Season별로 이 데이터를 축적하여,

> 이런 환경에서는 사람들이 어떻게 움직이는가?

를 발견하고,

> 다음에 이런 환경이 오면 사람들이 어떻게 움직일 가능성이 있는가?

를 예측하는 것이 PLAY의 최종 목적이다.
