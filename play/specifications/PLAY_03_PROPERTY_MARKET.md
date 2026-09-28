# RealRankus PLAY — Property Market & Forecastability Specification v1.0

## 0. Document Purpose

본 문서는 `PLAY_01_ARCHITECTURE.md`와 `PLAY_02_ECONOMIC_ENGINE.md`를 기반으로
RealRankus PLAY의 주택시장(Property Market)과 주택 데이터의 책임 범위를 정의한다.

특히 다음 두 가지를 핵심 설계 원칙으로 한다.

1. `D:\real_estate_data\91_Complex_Valuation`의 데이터는 시즌 시작 시점의 실제 아파트 단지, 위치, 초기 주택가격을 설정하는 용도로만 사용한다.
2. 시즌 시작 이후 주택가격과 시장상태는 PLAY Economic Engine에 의해 독립적으로 변화하며,
   원천 RealRankus 데이터의 가격을 다시 참조하여 PLAY 가격을 갱신하지 않는다.

또한 본 문서는 단순한 주택가격 시뮬레이션을 위한 문서가 아니다.

PLAY의 최종 목적은 경제환경과 시장환경의 변화에 따라
사람과 집단의 행동 패턴 및 시장의 후속 변화를 분석하고,
축적된 Season 데이터를 기반으로 향후 행동과 시장 변화를 예측할 수 있는 구조를 만드는 것이다.

따라서 모든 Property Market 데이터는 다음을 만족해야 한다.

> "이 데이터가 시즌 종료 후 경제환경 변화 → 사람들의 행동 → 집단적 움직임 → 시장 결과 → 향후 예측으로 연결될 수 있는가?"

---

# 1. Property Market Philosophy

PLAY의 주택시장은 실제 시장의 미래를 복제하는 것이 아니다.

시즌 시작점은 현실적인 실제 아파트 시장에서 가져오지만,
시즌이 시작된 이후에는 PLAY 내부의 경제환경과 참가자 행동을 통해 독립적인 시장을 형성한다.

구조:

```text
RealRankus Existing Data
        ↓
Season Start Snapshot
        ↓
PLAY Property Initial State
        ↓
PLAY Economic Environment
        ↓
Player Decisions
        ↓
PLAY Market Changes
        ↓
Property Price / Rent / Liquidity
        ↓
Collective Behavior
        ↓
Season Analysis
        ↓
Forecast Model
```

핵심 원칙:

> RealRankus 데이터는 PLAY의 현실적인 출발점을 제공하고,
> PLAY 경제엔진은 그 이후의 30년 경제세계를 독립적으로 생성한다.

---

# 2. Source Boundary

## 2.1 Allowed Source at Season Start

다음 경로의 데이터는 시즌 초기값 설정에만 사용한다.

```text
D:\real_estate_data\91_Complex_Valuation
```

사용 목적은 정확히 다음 3가지로 제한한다.

```text
1. Apartment Complex
2. Location
3. Season Initial Housing Price / Value
```

즉:

```text
complex_id
complex_name
location
initial_price
initial_price_date
```

등의 시즌 초기값 생성에 사용할 수 있다.

---

## 2.2 Explicit Non-Use

다음 용도로는 사용하지 않는다.

- 시즌 중 PLAY 가격 재계산
- PLAY 가격의 지속적인 외부 데이터 연동
- 시즌 중 실제 거래가격 재조회
- 시즌 중 국토부 실거래 API 신규 연동
- 시즌 중 전월세 실거래 API 신규 연동
- PLAY 가격 업데이트를 위한 원천 폴더 재조회
- PLAY의 미래 가격을 실제 시장가격으로 보정

따라서 `91_Complex_Valuation`은 PLAY의 Runtime Market Data Source가 아니다.

---

# 3. Season Start Snapshot

Season이 시작될 때만 원천 데이터를 읽어 PLAY Property Snapshot을 생성한다.

개념:

```text
91_Complex_Valuation
        ↓
Season Initialization
        ↓
PLAY_PROPERTY
```

예:

```text
complex_id = C001
complex_name = Example Apartment
location = Region A
initial_price = 1,200,000,000
initial_price_date = 2026-09
```

Season 시작 이후:

```text
initial_price
      ↓
play_price
      ↓
PLAY Economic Engine
```

으로 연결된다.

---

# 4. Season Independence

각 Season은 독립적인 Property Market State를 가진다.

예:

```text
Season 1
Initial Snapshot
     ↓
PLAY Price Path A

Season 2
New Initial Snapshot
     ↓
PLAY Price Path B
```

Season 2는 Season 1의 PLAY 가격을 이어받지 않는다.

각 시즌은 시즌 시작 시점의 지정된 초기 데이터로 새로운 시장을 시작한다.

단, Season Analysis 결과나 과거 시즌의 통계/모델은
향후 Season의 실험 설계와 Forecast Model 개선에 활용할 수 있다.

즉:

```text
Past Season Market State
        X
Future Season Property Price

Past Season Analysis
        O
Future Season Model / Scenario Design
```

---

# 5. Property Identity

PLAY에서 주택은 실제 아파트 단지를 기반으로 하는 식별 가능한 Property Entity로 관리한다.

최소 식별 정보:

```text
property_id
complex_id
complex_name
location
```

`property_id`는 PLAY 내부에서 사용하는 고유 식별자다.

`complex_id`는 기존 RealRankus 아파트 단지 식별자와의 연결을 위해 사용할 수 있다.

단, 기존 RealRankus의 원본 레코드를 PLAY에서 직접 수정하지 않는다.

---

# 6. Initial Property State

Season 시작 시 각 Property는 최소 다음 상태를 가진다.

```text
property_id
complex_id
complex_name
location
initial_price
initial_price_date
play_price
play_price_updated_at
season_id
scenario_id
scenario_version
rule_version
```

초기 상태:

```text
play_price = initial_price
```

이후:

```text
play_price != initial_price
```

가 될 수 있다.

초기 가격은 기준점이며,
시즌 중 PLAY 가격은 Economic Engine이 관리한다.

---

# 7. Real Price vs PLAY Price

두 가격을 절대 혼용하지 않는다.

## Real Market Price

실제 현실에서 관측된 가격.

```text
real_price
```

## PLAY Price

PLAY 내부에서 경제환경과 시장규칙에 의해 생성되는 가격.

```text
play_price
```

예:

```text
Real Market Initial Price = 1,200,000,000
PLAY Year 10 Price = 1,650,000,000
```

이때 16.5억원은 실제 시장의 미래 가격 예측값이 아니다.

PLAY 내부 조건에서 생성된 시뮬레이션 결과다.

---

# 8. Property Market State

Property별 시장상태를 최소 다음 요소로 관리한다.

```text
play_price
price_change_rate
regional_market_index
rent
rent_change_rate
liquidity_state
supply_state
demand_state
market_phase
```

추후 필요한 경우 다음을 확장한다.

```text
transaction_volume
active_listing_count
buyer_pressure
seller_pressure
time_to_sell
price_discount
```

단, MVP에서 실제 사용자 간 거래 매칭을 구현하지 않는다.

---

# 9. Price Update Responsibility

주택가격은 `PLAY_02_ECONOMIC_ENGINE.md`에서 정의한 Economic Engine의
환경변수와 Property Market Engine을 통해 변화한다.

기본 개념:

```text
PLAY Price Change
=
Base Market Effect
+ Interest Effect
+ Demand Effect
+ Supply Effect
+ GLI Effect
+ Regional Effect
+ Random Shock
```

구체적인 계수와 계산식은 Economic Engine / Scenario Config에서 관리한다.

Property Market은 계산 결과를 저장하고 제공하는 역할을 담당한다.

---

# 10. GLI Usage Boundary

GLI는 PLAY 주택가격을 직접 결정하는 절대적인 가격결정식으로 사용하지 않는다.

기본 역할:

```text
High GLI
→ Downside Cushion
→ Faster Recovery

Low GLI
→ Greater Downside Sensitivity
→ Slower Recovery
```

따라서 GLI는 가격수준 자체보다
경제환경 변화에 대한 **시장 반응의 차이**를 만드는 변수로 취급한다.

이는 향후 중요한 분석 질문을 가능하게 한다.

```text
경제충격이 발생했을 때
GLI가 높은 지역과 낮은 지역의
사람들의 행동 및 시장결과가 어떻게 달라지는가?
```

---

# 11. Regional Market

PLAY는 전국의 모든 단지를 동일한 시장으로 취급하지 않는다.

Season 1에서는 기존 설계에 따라 단순화된 지역군을 사용한다.

```text
R01 핵심 서울
R02 서울 일반
R03 경기 핵심
R04 경기 일반
R05 인천
R06 광역시 핵심
R07 광역시 일반
R08 지방 거점
R09 지방 일반
R10 기타
```

단, 이 지역군은 실제 행정구역을 대체하는 것이 아니다.

분석 및 시뮬레이션의 초기 분류를 단순화하기 위한
PLAY 내부 Region Group이다.

실제 단지 위치정보는 원천 단지 정보에서 보존한다.

---

# 12. Regional Behavior Data

Property Market은 가격만 저장해서는 안 된다.

지역별로 다음 행동과 연결 가능한 상태를 저장해야 한다.

```text
region_id
property_count
average_play_price
median_play_price
price_change
transaction_count
buy_request_count
buy_success_count
sell_request_count
sell_success_count
hold_population
buyer_population
seller_population
cash_preference
leverage_preference
average_ltv
average_dsr
```

이 값들은 원천 이벤트에서 집계 가능해야 하며,
가능하면 원천 Decision Log / Transaction Log를 기준으로 재생성할 수 있어야 한다.

---

# 13. Demand Representation

PLAY에서 수요는 단순한 가격변화가 아니다.

수요를 최소 다음 행동으로 관찰한다.

```text
BUY_REQUEST
BUY_SUCCESS
HOLD
SELL_REQUEST
SELL_SUCCESS
```

그리고 수요의 강도를 다음과 같이 분석할 수 있어야 한다.

```text
Buyer Rate
= Buy-active players / Eligible players
```

```text
Purchase Conversion
= Buy Success / Buy Request
```

```text
Regional Demand Share
= Region Buy Count / Total Buy Count
```

이를 통해:

```text
경제환경 변화
→ 수요 행동 변화
→ 지역별 수요 이동
```

을 분석할 수 있다.

---

# 14. Supply Representation

PLAY에서 공급은 초기에는 실제 신규 분양 공급을 정교하게 모델링하지 않는다.

대신 다음 요소를 통해 공급환경을 표현할 수 있도록 설계한다.

```text
supply_index
available_property_count
market_liquidity
seller_pressure
```

향후 필요할 경우:

```text
new_supply
completion
redevelopment
reconstruction
unsold_inventory
```

등으로 확장한다.

MVP에서는 공급 데이터가 가격과 행동에 미치는 영향을
Scenario Config로 조정 가능하도록 한다.

---

# 15. Liquidity

PLAY의 매도는 "현재 표시가격에 즉시 판매"를 보장하지 않는다.

시장상황에 따라 매도 가능성과 할인 정도가 달라질 수 있다.

개념:

```text
Normal Market
→ Short Sale Time
→ Low Discount

Slowdown
→ Longer Sale Time
→ Moderate Discount

Recession
→ Longer Sale Time
→ Higher Discount
```

따라서 최소한 다음을 기록한다.

```text
liquidity_state
sale_request_time
sale_execution_time
listed_price
executed_price
liquidity_discount
```

이 데이터는 향후 다음 질문에 사용한다.

> 경제환경이 악화되었을 때 사람들은 실제로 얼마나 빨리 현금화할 수 있는가?

---

# 16. Rental Market

Rental income은 Property Market의 보조 경제요소다.

초기 개념:

```text
Rent Change
=
Housing Market Change × 0.4
+ Rental Demand × 0.4
+ Supply × 0.2
```

이 계수는 MVP의 초기값이며,
실제 Season 결과를 통해 calibration할 수 있도록 구성한다.

Rental 관련 데이터:

```text
rent
rent_yield
rental_demand
rental_supply
rental_income
```

단, 전월세 실거래 API를 새로 연결하지 않는다.

PLAY 내부 Rental Market은 Economic Engine에 의해 생성된다.

---

# 17. Property State History

현재 상태만 저장해서는 안 된다.

시즌 중 중요한 Property 상태는 시계열로 보존한다.

예:

```text
PLAY_PROPERTY_STATE_HISTORY
```

최소:

```text
season_id
simulation_year
simulation_month
property_id
play_price
price_change_rate
rent
rent_change_rate
regional_market_index
supply_index
demand_index
liquidity_state
market_phase
scenario_id
scenario_version
rule_version
random_seed
```

이 데이터가 있어야 시즌 종료 후:

```text
가격 변화
+
환경 변화
+
사람들의 행동 변화
```

를 시간축으로 결합할 수 있다.

---

# 18. Forecastability Principle

Property Market 데이터의 가장 중요한 추가 원칙이다.

> 모든 Property Market 데이터는 향후 시장과 사람들의 행동을 예측하는 데 필요한 설명변수와 결과변수를 연결할 수 있어야 한다.

예:

```text
Interest Rate
        ↓
Buy Request
        ↓
Buy Success
        ↓
Regional Demand
        ↓
Price Change
```

따라서 Property Market 데이터는
단순히 `현재 가격`만 저장하는 구조가 되어서는 안 된다.

---

# 19. Forecast Target Candidates

향후 Forecast Model이 예측할 수 있는 대표적인 Target은 다음과 같다.

## 19.1 Human Behavior Forecast

```text
Buy Probability
Sell Probability
Hold Probability
Leverage Increase Probability
Cash Increase Probability
Regional Migration Probability
```

## 19.2 Market Behavior Forecast

```text
Regional Demand Change
Price Band Demand Change
Transaction Activity Change
Liquidity Change
Buyer/Seller Pressure
```

## 19.3 Outcome Forecast

```text
1Y Net Worth
3Y Net Worth
5Y Net Worth
Economic Freedom Achievement
Forced Sale Probability
Debt Stress
Housing Mobility
```

MVP에서는 모든 Target을 구현하지 않는다.

단, 향후 계산 가능하도록 원천 데이터를 보존한다.

---

# 20. Behavioral Threshold

Season Analysis가 충분히 축적되면
단순 평균보다 중요한 "행동 임계점"을 찾을 수 있도록 한다.

예:

```text
Interest Rate > X
→ Buy Probability 급감
```

```text
Price Decline < -X%
→ Contrarian Buy 증가
```

```text
Cash Buffer < X months
→ Sell Probability 증가
```

이 X는 코드에 사전 입력하는 값이 아니다.

Season 데이터에서 분석을 통해 발견되는 후보값이다.

---

# 21. Collective Movement

PLAY의 핵심 분석 대상은 개별 플레이어만이 아니다.

다음 집단적 움직임을 관찰할 수 있어야 한다.

```text
Region Migration
Price Band Migration
Leverage Migration
Cash Preference Shift
Buy/Sell Concentration
Housing Type Preference
GLI Preference
```

예:

```text
금리 상승
↓
고가주택 매수 감소
↓
중가주택 이동
↓
특정 지역 수요 증가
↓
지역별 가격/거래 행동 차이
```

이러한 연결이 Season Report의 핵심이 된다.

---

# 22. Institutional Analysis

Season 종료 후 Property Market 데이터는 다음 관점으로 재해석할 수 있어야 한다.

## Government / Local Government

질문 예:

```text
금리 상승 시 주택수요는 어느 지역에서 먼저 감소하는가?
대출부담 증가 시 어떤 가격대가 영향을 받는가?
주택가격 하락 시 매수·매도 행동은 어떻게 변하는가?
어떤 조건에서 지역 이동이 증가하는가?
```

## Construction Company

질문 예:

```text
소득/금리 변화에 따라 선호 가격대가 어떻게 변하는가?
어떤 지역에서 수요가 유지되는가?
면적/가격/지역 조합별 수요가 어떻게 변하는가?
```

## Developer

질문 예:

```text
어떤 경제환경에서 특정 가격대 상품의 수요가 증가하는가?
어떤 지역에서 수요 이동이 발생하는가?
대출환경 변화가 상품 선택에 어떤 영향을 주는가?
```

## Financial Institution

질문 예:

```text
금리 상승 시 차입행동은 어떻게 변하는가?
DSR 상승이 매수행동에 미치는 영향은 무엇인가?
현금버퍼가 부족한 집단의 매도행동은 어떻게 변하는가?
```

---

# 23. Forecast Report Architecture

Season 종료 후 최종 보고서는 다음 구조를 기본으로 한다.

```text
PLAY SEASON FORECAST REPORT

1. Executive Summary

2. Economic Environment
   - Interest
   - Inflation
   - Economic Phase
   - Housing Market

3. Human Behavior
   - Buy
   - Sell
   - Hold
   - Leverage
   - Cash
   - Regional Movement

4. Collective Behavior
   - Cohort
   - Region
   - Price Band
   - Housing Type

5. Market Response
   - Price
   - Demand
   - Liquidity
   - Transaction

6. Behavioral Threshold
   - Rate Threshold
   - Price Threshold
   - Cash Buffer Threshold
   - Debt Stress Threshold

7. Forecast Model
   - Target
   - Input Variables
   - Prediction
   - Confidence / Uncertainty
   - Validation Result

8. Institutional Insight
   - Government
   - Construction
   - Development
   - Finance

9. RealRankus Model Feedback

10. Next Season Hypotheses
```

---

# 24. Prediction vs Explanation

PLAY는 설명과 예측을 구분해야 한다.

### Explanation

```text
금리가 상승한 뒤 매수가 감소했다.
```

### Prediction

```text
향후 유사한 금리 상승 환경이 발생할 경우
매수행동 감소가 나타날 가능성이 높다고 예측한다.
```

단순 상관관계를 인과관계로 표현하지 않는다.

또한 예측 결과에는 가능하면:

```text
sample_size
historical_cases
prediction_interval / uncertainty
model_version
training_seasons
validation_seasons
```

을 포함한다.

---

# 25. Forecast Model Data Contract

향후 Forecast Engine을 위해 최소 다음 메타데이터를 보존한다.

```text
forecast_id
forecast_target
forecast_time_horizon
input_variables
model_version
training_seasons
validation_seasons
scenario_id
prediction
uncertainty
sample_size
created_at
```

Forecast는 원천 데이터와 분리된 파생 데이터다.

원천 데이터가 변경되면 Forecast를 다시 생성할 수 있어야 한다.

---

# 26. No Data Destruction Principle

원천 데이터를 분석 편의를 위해 덮어쓰거나 변환하여 원본을 잃어서는 안 된다.

원칙:

```text
RAW EVENT
   ↓
NORMALIZED DATA
   ↓
AGGREGATED DATA
   ↓
ANALYSIS
   ↓
FORECAST
```

각 단계는 이전 단계에서 재생성 가능해야 한다.

특히:

```text
Forecast
```

를 저장했다고 해서 원천 Decision / Transaction / Market State를 삭제하지 않는다.

---

# 27. Versioning and Reproducibility

Property Market 결과는 다음 정보를 함께 기록한다.

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
```

필요한 경우:

```text
model_version
```

도 기록한다.

같은:

```text
Input
+
Scenario
+
Rule
+
Seed
```

를 사용하면 동일한 Property Market 결과를 재현할 수 있어야 한다.

---

# 28. Property Market Core Tables / Collections

최종 DB 명칭은 기술 구현 단계에서 확정할 수 있으나,
논리적으로 다음 영역이 필요하다.

## PLAY_PROPERTY

현재 시즌의 Property 기본 상태.

## PLAY_PROPERTY_STATE_HISTORY

시즌 중 Property 상태의 시계열.

## PLAY_MARKET_STATE

전역/지역별 시장상태.

## PLAY_MARKET_STATE_HISTORY

시장상태 시계열.

## PLAY_PROPERTY_DEMAND

Property/Region별 수요 집계.

## PLAY_PROPERTY_LIQUIDITY

매도 요청/실행/소요시간/할인 데이터.

## PLAY_FORECAST

Forecast 결과.

단, 집계 데이터는 원천 이벤트에서 재생성 가능하도록 설계한다.

---

# 29. Required Relationships

핵심 관계:

```text
SEASON
  ↓
SCENARIO
  ↓
ECONOMIC_STATE
  ↓
REGIONAL_MARKET_STATE
  ↓
PROPERTY_STATE
  ↓
PLAYER_STATE
  ↓
DECISION
  ↓
TRANSACTION
  ↓
OUTCOME
```

분석:

```text
ECONOMIC_STATE
      +
PROPERTY_STATE
      +
PLAYER_STATE
      +
DECISION
      +
TRANSACTION
      ↓
SEASON ANALYSIS
      ↓
FORECAST
```

---

# 30. Anti-Goals

본 문서에서 다음은 하지 않는다.

1. 시즌 중 `91_Complex_Valuation`을 가격 업데이트 원천으로 사용
2. 국토부 실거래 API를 PLAY 가격 업데이트용으로 신규 연동
3. 전월세 실거래 API를 PLAY 가격 업데이트용으로 신규 연동
4. 실제 미래 주택가격 예측값을 PLAY 가격으로 오인
5. 개별 플레이어의 결과만 분석
6. 단순 평균만으로 시장을 설명
7. 사전에 정한 투자자 유형을 실제 행동 대신 사용
8. Forecast 결과를 원천 데이터 대신 저장
9. 상관관계를 인과관계로 단정
10. 예측모델을 경제엔진 자체에 직접 하드코딩

---

# 31. Implementation Boundary for Antigravity

Antigravity는 본 문서를 읽고 다음을 수행할 수 있다.

### Review

- 기존 RealRankus Property 데이터에서 Season Start Snapshot에 필요한 필드 확인
- 기존 코드에서 Complex ID / Name / Location / Initial Price를 어떻게 가져올 수 있는지 확인
- PLAY Property 데이터 구조와 충돌 여부 확인
- 기존 데이터의 실제 필드명과 문서의 논리 필드명 매핑

### 구현 가능 범위

별도 구현 지시서가 내려진 경우:

- PLAY_PROPERTY 생성 구조
- Season Start Snapshot 처리
- PLAY Price 분리
- Property State History
- Market State 구조
- version / seed 저장

### 구현 금지

본 문서 리뷰 단계에서는 다음을 임의로 변경하지 않는다.

- 기존 RealRankus Property 데이터
- 기존 가격 계산 로직
- PLAY Economic Engine 규칙
- GLI 계산 규칙
- Scenario
- DB Security Rules
- 기존 서비스 코드
- 외부 실거래 API 추가

---

# 32. Acceptance Criteria

본 문서의 구현 결과는 최소 다음을 만족해야 한다.

### AC-01

Season 시작 시 지정된 `91_Complex_Valuation` 데이터에서
아파트 단지, 위치, 초기 가격을 읽어 PLAY Property Snapshot을 생성할 수 있다.

### AC-02

Season 시작 이후 PLAY 가격은 `91_Complex_Valuation`을 참조하지 않는다.

### AC-03

PLAY Price와 Real Market Price가 데이터상 분리된다.

### AC-04

Property 상태가 시간축으로 저장된다.

### AC-05

Property Market State와 Player Decision을 시간축으로 연결할 수 있다.

### AC-06

지역/가격대/집단별 수요 이동을 계산할 수 있는 원천 데이터가 존재한다.

### AC-07

매수/매도/보유 행동을 경제환경과 함께 분석할 수 있다.

### AC-08

시즌 종료 후 최소 다음 분석이 가능해야 한다.

```text
경제환경 변화
→ 행동 변화
→ 집단 이동
→ 시장 변화
```

### AC-09

향후 Forecast Model의 입력변수와 Target을 구성할 수 있는 데이터가 존재한다.

### AC-10

Forecast 결과가 원천 데이터와 독립적인 파생 결과로 관리된다.

### AC-11

Scenario / Rule / Seed Version을 통해 시뮬레이션 결과를 재현할 수 있다.

### AC-12

기존 RealRankus의 원천 Property 데이터는 변경되지 않는다.

---

# 33. Final Design Principle

PLAY Property Market의 궁극적인 목적은
"아파트 가격을 움직이는 게임"을 만드는 것이 아니다.

목적은 다음 관계를 관찰하는 것이다.

```text
경제환경
   ↓
시장환경
   ↓
사람의 인식/선택
   ↓
집단적 행동
   ↓
지역/상품별 수요 이동
   ↓
시장 결과
   ↓
다음 행동
```

그리고 충분한 시즌이 축적되면:

```text
과거 행동 데이터
      ↓
반복 패턴
      ↓
Behavioral Model
      ↓
Market / Human Forecast
      ↓
예측
      ↓
실제 Season 결과
      ↓
예측 오차
      ↓
Model 개선
```

이라는 폐쇄형 학습 구조를 만든다.

따라서 PLAY의 Property Market 데이터는
"가격을 저장하기 위한 데이터"가 아니라,

> **경제환경 변화에 대한 인간과 시장의 반응을 관찰하고,
> 그 반응을 미래 행동과 시장 변화의 예측에 사용할 수 있도록 하는 데이터**

로 설계한다.
