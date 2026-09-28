# PLAY_02_ECONOMIC_ENGINE.md

# RealRankus PLAY — Economic Engine Specification v1.0

## 0. Document Purpose

본 문서는 `PLAY_01_ARCHITECTURE.md`와 `PLAY_01_ARCHITECTURE_REVIEW.md`를 기반으로
RealRankus PLAY의 경제 세계가 어떻게 움직이는지를 정의한다.

목적은 다음과 같다.

1. PLAY의 30년 경제생활을 결정론적이고 재현 가능한 규칙으로 정의한다.
2. Season 1의 통제된 실험환경을 정의한다.
3. 초기 자산 7억원을 기준으로 소득, 지출, 대출, 주택, 금리, 물가, 현금흐름, 순자산의 관계를 정의한다.
4. 경제환경과 플레이어 의사결정의 순서를 정의한다.
5. 이후 Antigravity가 실제 Economic Engine을 구현할 수 있는 수준의 명세 기반을 만든다.
6. 단, 아직 제품/실험적으로 결정되지 않은 항목은 임의로 확정하지 않는다.

---

# 1. Source and Design Basis

본 문서는 다음 두 문서를 직접적인 설계 기준으로 한다.

- `PLAY_01_ARCHITECTURE.md`
- `PLAY_01_ARCHITECTURE_REVIEW.md`

현재 확인된 기존 RealRankus 구조는 Firebase 기반 인증/데이터를 공유할 수 있고,
PLAY 전용 데이터 및 핵심 로직을 분리하는 Hybrid 구조와 호환된다.

PLAY_01_REVIEW에서 확인된 핵심 제약:

- 기존 RealRankus는 클라이언트 중심 구조
- PLAY 핵심 경제 로직은 서버 권한이 필요
- PLAY 전용 데이터 분리가 필요
- Season Time과 Economic Engine의 실행 규모는 아직 미확정
- Firestore/Realtime DB의 복잡한 다중 상태 업데이트를 고려해야 함
- 실제 구현 서버 기술은 아직 최종 확정하지 않음

따라서 이 문서는 경제 규칙을 정의하고,
서버 기술 선택 자체는 후속 기술 결정사항으로 남긴다.

---

# 2. PLAY Economic Philosophy

PLAY는 실제 한국경제를 완벽하게 예측하는 모델이 아니다.

Season 1의 목적은 다음 질문을 관찰할 수 있는 통제된 경제환경을 만드는 것이다.

> 동일한 초기자산과 통제된 경제환경에 놓인 사람들이 왜 서로 다른 경제적 의사결정을 하고,
> 그 차이가 30년 후 어떤 결과의 차이로 나타나는가?

따라서 Season 1에서는 다음 원칙을 따른다.

1. 경제환경은 통제 가능해야 한다.
2. 주요 규칙은 명시적으로 정의되어야 한다.
3. 같은 입력에 같은 규칙을 적용하면 같은 결과를 재현할 수 있어야 한다.
4. Random 요소가 필요한 경우 Seed 또는 Rule Version으로 재현 가능해야 한다.
5. 경제 계산과 사용자 의사결정을 분리한다.
6. 실제 시장 데이터와 PLAY 내부 시뮬레이션 결과를 구분한다.
7. 미래의 실제 가격을 예측하는 시스템으로 표현하지 않는다.

---

# 3. Season 1 Core Configuration

Season 1의 기본 실험 조건:

```text
Real Season Duration = 3 months
Simulation Duration = 30 years
Initial Equity = 700,000,000 KRW
```

초기 7억원은 "정규화된 구매력"이 아니다.

즉:

```text
100억 주택 = PLAY에서도 초기 기준 약 100억원 가치의 자산
```

이며 7억원만으로 구매 가능한 자산이라는 의미가 아니다.

구매 가능 여부는:

```text
Initial Equity
+ Loan Capacity
+ Cash Flow
+ Transaction Rules
```

에 의해 결정된다.

---

# 4. Initial Player State

Season 참가 시 모든 플레이어는 동일한 기본 경제상태에서 시작한다.

초기 상태:

```text
Cash = 700,000,000 KRW
Debt = 0
Property = 0
Financial Asset = 0
```

단, 초기 소득/지출/연령 등은 별도의 Season Configuration에서 정의한다.

중요:

> 7억원은 Season 1의 실험 통제를 위한 동일한 초기 자본이다.

향후 Season에서는 초기자산의 다양화를 검토할 수 있다.

---

# 5. Simulation Time

## 5.1 Basic Time Ratio

Season 1:

```text
3 real months = 30 simulated years
```

따라서:

```text
1 real day ≈ 4 simulated months
```

를 기본 맵핑으로 사용한다.

---

## 5.2 Time Representation

시뮬레이션 시간은 실제 서버시간과 별도로 관리한다.

권장 개념:

```text
real_timestamp
simulation_year
simulation_month
simulation_day_index
```

실제 DB 필드는 `PLAY_03_DATABASE_SCHEMA.md`에서 확정한다.

---

## 5.3 Time Progression

Season은 전역적으로 동일한 Simulation Clock을 사용한다.

즉 같은 Season의 플레이어는:

```text
Year 1
Year 2
...
Year 30
```

을 동일한 시간축으로 공유한다.

개인별 독립적인 경제시간은 Season 1에서 사용하지 않는다.

이 결정은 PLAY의 "동일 환경에서 행동 차이 관찰" 목적에 따른다.

---

# 6. Background Simulation

플레이어가 접속하지 않아도 Season Time은 진행된다.

즉:

```text
User Online
or
User Offline
```

와 관계없이 경제환경은 동일한 Season Clock에 따라 변화한다.

오프라인 동안에도 다음 항목은 반영될 수 있다.

- Income
- Living Expense
- Housing Expense
- Interest
- Debt Repayment
- Property Price
- Economic Environment

단, 플레이어의 새로운 Buy/Sell 의사결정은 명시적인 Decision Window에서만 발생한다.

---

# 7. Time Processing Model

Season 1은 실시간 Tick보다 **Batch 기반 진행**을 기본 모델로 한다.

기본 개념:

```text
Real Day
    ↓
Simulation Batch
    ↓
≈ 4 Simulated Months
```

이렇게 하는 이유:

- 초기 구현 복잡도 감소
- 경제 계산 재현성 향상
- 서버 비용 예측 용이
- 대규모 Tick 처리 부담 감소
- Season 결과 검증 용이

정확한 Batch 실행 시각과 스케줄러 구현은 기술 문서에서 결정한다.

---

# 8. Economic State

각 Simulation Batch마다 경제환경 상태를 계산한다.

최소 상태:

```text
Interest Rate
Inflation Rate
Economic Phase
Housing Market Trend
Supply Index
Demand Index
Regional Environment
```

Season 1에서는 경제환경을 미리 정의된 시나리오 또는 규칙에 따라 변화시키는 것을 기본으로 한다.

---

# 9. Economic Phase

초기 경제국면은 최소한 다음을 지원하도록 설계한다.

```text
NORMAL
BOOM
TIGHTENING
RECESSION
RECOVERY
```

경제국면은 직접적인 결과값이 아니라 다른 변수에 영향을 주는 환경상태다.

예:

```text
TIGHTENING
→ Interest ↑
→ Borrowing Capacity ↓
→ Housing Demand ↓
→ Price Pressure ↓
```

단, 실제 영향의 크기는 `Economic Parameter`로 관리한다.

---

# 10. Interest Rate Engine

금리는 플레이어의 대출비용과 경제환경에 영향을 준다.

기본 변수:

```text
base_interest_rate
player_loan_rate
rate_change
```

초기 단순 모델:

```text
Player Loan Rate
=
Base Rate
+
Loan Spread
```

정확한 Spread는 Season Configuration에서 관리한다.

실제 한국의 현재 금리 규칙을 그대로 복제하는 것을 Season 1의 필수요건으로 두지 않는다.

---

# 11. Inflation Engine

물가는 생활비와 자산가치의 장기 변화에 영향을 준다.

기본 개념:

```text
Nominal Cost(t)
=
Base Cost
×
Cumulative Inflation Factor
```

누적 물가상승률은 월/연 단위 계산 중 하나를 선택할 수 있으나,
초기 구현에서는 연 단위 경제환경 계산을 우선 고려한다.

실제 구현 시 계산 주기는 `PLAY_02` 구현 검토 단계에서 검증한다.

---

# 12. Income Engine

## 12.1 Principle

소득을 30년 동안 일정한 숫자로 유지하지 않는다.

Season 1에서도 생애주기형 소득곡선을 사용한다.

개념:

```text
Career Growth
      ↓
Income Peak
      ↓
Income Plateau
      ↓
Income Decline
      ↓
Retirement / Pension
```

---

## 12.2 Season 1 Control

모든 플레이어는 동일한 기본 Income Profile을 사용한다.

이는 다음을 통제하기 위함이다.

> 소득 차이보다 경제적 의사결정 차이가 결과에 미치는 영향을 관찰한다.

---

## 12.3 Income Components

최소 개념:

```text
Labor Income
Financial Income
Rental Income
Pension / Retirement Income
```

초기 MVP에서는 Labor Income 중심으로 시작할 수 있다.

Rental/Financial/Pension Income은 Player State 구조에는 포함할 수 있으나
실제 계산 시점은 MVP 범위에 따라 단계적으로 구현한다.

---

# 13. Income Curve

Season 1에서는 정확한 실제 연봉 통계보다 실험용 표준 곡선을 우선한다.

개념적 구간:

```text
Year 0–5     Growth
Year 6–15    Strong Growth
Year 16–22   Peak / Plateau
Year 23–27   Decline
Year 28–30   Retirement / Pension Transition
```

위 구간은 초기 모델의 후보 구간이며,
실제 소득 배율은 구현 전에 확정해야 한다.

예:

```text
Income Index
Year 0 = 100
...
Peak
...
Retirement
```

정확한 배율을 임의로 하드코딩하지 않는다.

---

# 14. Expense Engine

필수 비용을 계산한다.

최소 항목:

```text
Living Cost
Housing Cost
Education
Insurance
Tax
Maintenance
Interest
Principal
Transaction Cost
```

MVP에서는 다음부터 시작한다.

```text
Living Cost
Interest
Principal
Property Maintenance
Transaction Cost
```

나머지는 후속 확장한다.

---

# 15. Living Cost

기본 생활비는 경제환경과 물가에 따라 증가한다.

개념:

```text
Living Cost(t)
=
Base Living Cost
×
Inflation Factor(t)
```

Season 1에서는 모든 플레이어에게 동일한 기본 생활비 Profile을 적용한다.

향후에는 가구 규모, 자녀, 지역, 생활수준 등에 따른 다양화를 검토한다.

---

# 16. Housing Cost

주택 보유 시 다음 비용을 고려한다.

```text
Interest
Principal
Maintenance
Tax
```

전세/월세 등 임대 구조는 초기 MVP에서 단순화할 수 있다.

단, 실제 구매/보유비용과 순자산 계산에서 중복 차감되지 않도록 한다.

---

# 17. Cash Flow Engine

PLAY의 핵심 상태변수다.

```text
Cash Flow
=
Total Income
-
Living Cost
-
Housing Cost
-
Interest
-
Principal
-
Tax
-
Maintenance
-
Other Expense
```

현금흐름이 음수인 상태가 지속될 수 있어야 한다.

이 경우:

```text
Cash ↓
Debt ↑ or Forced Sale
```

등의 결과가 발생할 수 있다.

정확한 강제매각 규칙은 별도 정책으로 확정한다.

---

# 18. Asset Model

최소 자산:

```text
Cash
Real Estate
Financial Assets
Other Assets
```

MVP:

```text
Cash
Real Estate
```

부터 시작한다.

---

# 19. Net Worth

순자산은 다음과 같이 계산한다.

```text
Net Worth
=
Total Assets
-
Total Liabilities
```

예:

```text
Cash             300M
Property       1,500M
--------------------
Assets         1,800M

Debt             800M
--------------------
Net Worth      1,000M
```

순자산은 매 Batch 종료 시 재계산한다.

---

# 20. Debt Engine

Debt는 별도 상태로 관리한다.

최소:

```text
Principal
Interest Rate
Remaining Principal
Monthly / Periodic Payment
Maturity
```

MVP에서는 단순 원리금상환 모델부터 시작할 수 있다.

정확한 상환 방식은 구현 전 확정한다.

---

# 21. Borrowing Capacity

PLAY에서는 다음을 분리한다.

```text
Collateral Capacity
Income Capacity
Cash Flow Capacity
Actual Loan
```

개념적으로:

```text
Maximum Borrowing
=
min(
    Collateral Limit,
    Income Limit,
    Cash Flow Limit
)
```

이는 "은행이 빌려주는 금액"과 "플레이어가 감당할 수 있는 금액"을 구분하기 위한 것이다.

---

# 22. LTV

개념:

```text
LTV
=
Loan Amount
/
Property Value
× 100
```

Season 1에서는 LTV를 configurable parameter로 관리한다.

실제 한국의 최신 규정을 하드코딩하지 않는다.

---

# 23. DSR

개념:

```text
DSR
=
Annual Debt Service
/
Annual Income
× 100
```

Season 1에서는 DSR 역시 configurable parameter로 관리한다.

정확한 금융규제 복제는 후속 시즌에서 필요성을 검토한다.

---

# 24. Affordability

PLAY에서는 다음을 별도 판단한다.

### Purchase Possible

규칙상 구매가 허용되는가?

### Purchase Affordable

구매 후 현금흐름이 지속 가능한가?

예:

```text
Property Price = 1,000M
Cash = 700M
Loan = 300M
```

구매 가능할 수 있다.

그러나:

```text
Income
-
Living Cost
-
Interest
-
Principal
```

이 지속적으로 음수라면 감당 가능한 구매가 아닐 수 있다.

이 차이를 Decision Log에 기록한다.

---

# 25. Property Model

각 PLAY Property는 최소 다음 속성을 가진다.

```text
property_id
region
real_price_reference
play_price
gli
rent
supply
demand
development_factor
```

실제 최종 필드는 `PLAY_03`에서 정의한다.

---

# 26. Initial Property Price

Season 시작 시:

```text
PLAY Property Price
=
Real Market Reference Price
```

를 기본으로 한다.

단, 이것은 PLAY 내부 가격의 초기값이다.

이후:

```text
PLAY Price(t+1)
≠
Guaranteed Real Market Price(t+1)
```

이다.

---

# 27. Property Price Engine

개념적 가격 변화:

```text
Price Change
=
Base Market Change
+
Interest Effect
+
Supply Effect
+
Demand Effect
+
GLI Effect
+
Regional Environment Effect
+
Random Shock
```

초기 MVP에서는 이 중 일부만 사용할 수 있다.

가격 변화 공식은 반드시 Versioned Rule로 관리한다.

---

# 28. GLI Effect

GLI는 PLAY에서 환경변수 또는 정보변수로 활용할 수 있다.

개념적으로:

```text
GLI
↓
Property Attractiveness
↓
Market Behavior
↓
Price / Demand
```

단, GLI의 실제 가격 영향력을 임의로 확정하지 않는다.

Season 1에서는 다음을 분리할 수 있다.

```text
GLI as Environment Variable
GLI as User Information
```

이 구분은 향후 실험 설계에서 중요하다.

---

# 29. Supply / Demand

초기 모델은 Index 기반으로 단순화할 수 있다.

```text
Supply Index
Demand Index
```

예:

```text
Demand ↑
+
Supply ↓
=
Positive Price Pressure
```

정확한 가격 탄력성은 `Economic Parameter`로 관리한다.

---

# 30. Regional Environment

지역별로 경제환경이 다르게 움직일 수 있어야 한다.

예:

```text
Transportation
Population
Development
Supply
Demand
GLI
Employment
Education
```

초기 MVP에서는 복잡한 지역별 동학을 모두 구현하지 않고
간단한 Regional Factor부터 시작할 수 있다.

---

# 31. Rent

임대수익은 부동산 보유에 따른 Non-Labor Income 후보로 관리한다.

개념:

```text
Rental Income
=
Property Rent
×
Occupancy
```

초기 MVP에서는 Rental Income을 생략하거나 단순화할 수 있다.

그러나 Player State 구조에서는 향후 확장을 고려한다.

---

# 32. Transaction Cost

매수/매도 시 비용이 발생한다.

최소:

```text
Buy Transaction Cost
Sell Transaction Cost
```

정확한 세율/비용률은 Season Configuration에서 관리한다.

실제 한국 세법을 완전히 복제하는 것은 Season 1 필수사항이 아니다.

---

# 33. Tax

Tax는 향후 확장 대상으로 둔다.

MVP에서는 단순화할 수 있다.

중요 원칙:

> Tax를 나중에 추가해도 기존 Net Worth 및 Cash Flow 구조를 깨지 않도록 별도 비용 항목으로 설계한다.

---

# 34. Economic Cycle

Season 1은 경제환경이 한 가지 상태로 고정되지 않는다.

예시:

```text
NORMAL
  ↓
BOOM
  ↓
TIGHTENING
  ↓
RECESSION
  ↓
RECOVERY
  ↓
NORMAL
```

정확한 기간과 전환규칙은 Season Configuration에서 관리한다.

---

# 35. Economic Shock

향후 경제적 충격을 추가할 수 있도록 설계한다.

예:

```text
Interest Shock
Housing Shock
Employment Shock
Regional Shock
```

초기 MVP에서는 Random Shock를 필수로 넣지 않는다.

Random 요소가 추가되면 반드시 Seed를 기록하여 결과 재현성을 확보한다.

---

# 36. Decision Window

경제환경과 Player State는 자동으로 변화하지만
플레이어 의사결정은 명시적인 Decision Window에서 발생한다.

예:

```text
Batch Start
↓
Economic Update
↓
Player State Update
↓
Decision Window
↓
BUY / SELL / HOLD
↓
Transaction Validation
↓
State Update
↓
Decision Log
```

정확한 사용자 행동 빈도는 UX 설계에서 확정한다.

---

# 37. Buy Rule

BUY 요청 시 최소 검증:

```text
1. Property exists
2. Property is available
3. Purchase price valid
4. Cash requirement valid
5. Loan eligibility valid
6. LTV valid
7. DSR valid
8. Cash Flow affordability valid
9. Transaction Cost valid
10. Season Rule valid
```

모든 검증을 서버 권한으로 수행한다.

---

# 38. Sell Rule

SELL 요청 시:

```text
1. Player owns property
2. Property can be sold
3. Market is available
4. Sale price valid
5. Transaction Cost calculated
6. Debt settlement calculated
7. Net cash proceeds calculated
```

Sale proceeds:

```text
Net Sale Proceeds
=
Sale Price
-
Transaction Cost
-
Outstanding Debt Settlement
```

---

# 39. Forced Sale

강제매각은 Season 1에서 즉시 필수 기능으로 구현하지 않는다.

가능한 향후 조건:

```text
Cash < 0
AND
Debt Service Failure
```

그 경우:

```text
Forced Sale
or
Additional Borrowing
or
Bankruptcy-like State
```

중 하나를 적용할 수 있다.

정책 결정 전에는 임의 구현하지 않는다.

---

# 40. Economic Freedom

PLAY의 핵심 결과지표 후보.

개념:

```text
Economic Freedom Rate
=
Non-Labor Income
/
Essential Living Cost
× 100
```

해석:

```text
0%   = 노동 외 소득 없음
50%  = 필수생활비의 절반 충당
100% = 필수생활비 전액 충당
```

단, 이것은 PLAY 내부 지표이며 현실의 경제적 자유를 보장하는 지표가 아니다.

---

# 41. Risk Metrics

초기 후보:

```text
Debt Ratio
LTV
DSR
Cash Buffer
Housing Cost Burden
Cash Flow
Leverage
```

특히:

```text
Cash Buffer
=
Available Cash
/
Essential Monthly Expense
```

같은 형태로 유동성 위험을 관찰할 수 있다.

정확한 사용자 표시 방식은 UX 문서에서 정의한다.

---

# 42. Simulation Batch Execution Order

각 Batch의 기본 실행 순서:

```text
1. Read Season State
2. Advance Simulation Time
3. Update Economic Phase
4. Update Interest Rate
5. Update Inflation
6. Update Supply / Demand
7. Update Regional Environment
8. Update Property Prices
9. Calculate Income
10. Calculate Living Expense
11. Calculate Housing Expense
12. Calculate Interest
13. Calculate Principal
14. Update Cash Flow
15. Update Debt
16. Update Player State
17. Open Decision Window
18. Receive Player Decisions
19. Validate Transactions
20. Execute Transactions
21. Recalculate Assets
22. Recalculate Liabilities
23. Recalculate Net Worth
24. Save Decision Context
25. Save Transaction
26. Save Batch Result
27. Close Batch
```

이 순서는 초기 설계안이다.

구현 중 데이터 정합성 문제가 발견되면 `PLAY_02`를 수정하고 다시 승인받는다.

---

# 43. Determinism

같은 조건에서는 가능한 한 동일한 결과를 재현할 수 있어야 한다.

필수 기록 후보:

```text
season_id
season_version
economic_rule_version
market_rule_version
transaction_rule_version
random_seed
simulation_time
```

Random Seed가 없는 랜덤값을 핵심 경제 결과에 사용하지 않는다.

---

# 44. Rule Versioning

경제 계산은 버전 관리한다.

예:

```text
Economic Rule v1.0
Market Rule v1.0
Transaction Rule v1.0
```

Season 1이 종료된 후 규칙이 변경되어도
Season 1의 결과를 재현할 수 있어야 한다.

---

# 45. Data Logging Requirements

각 중요한 의사결정에는 당시 상태를 저장한다.

최소:

```text
player_id
season_id
simulation_time

cash
income
expense
debt
net_worth
cash_flow
ltv
dsr

property_id
property_price
gli

interest_rate
inflation_rate
economic_phase
supply_index
demand_index

action
amount
loan_amount

transaction_result
```

정확한 DB schema는 `PLAY_03_DATABASE_SCHEMA.md`에서 확정한다.

---

# 46. Decision vs Outcome

Decision Log와 Outcome은 분리해서 생각한다.

예:

```text
Decision:
BUY

Context:
Rate = 4%
GLI = 72
Price Trend = +8%
Cash Buffer = 18 months

Outcome:
1Y
3Y
5Y
10Y
```

이 구조를 사용하면 향후

> "어떤 상황에서 어떤 선택을 했고 그 선택 이후 어떤 결과가 발생했는가?"

를 분석할 수 있다.

---

# 47. Season 1 Experimental Control

Season 1에서 통제하는 주요 변수:

```text
Initial Equity
Income Profile
Basic Living Cost Profile
Season Duration
Economic Scenario
Available Market
Core Loan Rules
```

참가자마다 다르게 허용하는 주요 변수:

```text
Property Selection
Buy / Sell / Hold
Loan Utilization
Timing
Location Choice
Cash Retention
```

즉,

> 경제환경은 최대한 통제하고 의사결정은 사용자에게 맡긴다.

---

# 48. A/B Experiment Policy

Season 1에서는 A/B 실험을 필수 기능으로 구현하지 않는다.

향후 예:

```text
Group A:
GLI visible

Group B:
GLI hidden
```

같은 실험이 가능하다.

이 기능은 추후:

```text
Experiment
Experiment Group
Feature Flag
Exposure Log
Outcome
```

구조로 확장한다.

실험군을 임의로 사용자에게 적용하기 전에 별도의 실험 설계 및 데이터 거버넌스 검토가 필요하다.

---

# 49. What Season 1 Must Not Pretend to Measure

Season 1 결과는 다음을 직접 증명하지 않는다.

- 현실에서 실제 투자성과가 어떨지
- 특정 지역의 미래 가격이 실제로 상승할지
- 특정 전략이 현실에서도 항상 우월한지
- 사용자가 현실에서도 같은 행동을 할지
- 상관관계가 인과관계인지

Season 1은 우선:

> 통제된 가상 경제환경에서 관찰된 의사결정과 결과

를 측정한다.

---

# 50. MVP Economic Scope

## Required

```text
Initial Cash = 7억원
Simulation Time
Basic Income
Basic Living Expense
Cash
Property
PLAY Property Price
Loan
Interest
Buy
Sell
Debt
Net Worth
Decision Log
```

## Optional / Deferred

```text
Rental Income
Financial Assets
Detailed Tax
Detailed Education
Business Income
Unemployment
Detailed Pension
Complex Supply/Demand
Advanced GLI
Economic Shock
Forced Sale
Bankruptcy
A/B Experiment
Advanced Risk Model
```

---

# 51. MVP Validation Scenario

Antigravity는 실제 코드 구현 전에 최소 다음 시나리오를 시뮬레이션할 수 있어야 한다.

```text
Player starts with 700M cash.

↓
Income occurs.

↓
Living cost occurs.

↓
Player observes property.

↓
Player buys a property using cash + loan.

↓
Interest and principal are calculated.

↓
Property price changes.

↓
Income and expenses continue.

↓
Player sells or holds.

↓
Net worth changes.

↓
Decision context is recorded.
```

30년 전체 Season을 실행했을 때:

```text
Cash
Debt
Property
Net Worth
Cash Flow
Decision History
```

를 재구성할 수 있어야 한다.

---

# 52. Economic Engine Testing

테스트는 최소 다음 유형을 지원해야 한다.

## Unit Test

각 계산식 검증.

예:

```text
LTV
DSR
Interest
Net Worth
Cash Flow
Transaction Cost
```

## Scenario Test

경제 상황 변화 검증.

예:

```text
Rate Rise
Rate Fall
Property Boom
Property Decline
Income Growth
Income Decline
```

## Edge Case

예:

```text
Cash = 0
Debt = 0
Property Price = 0
Negative Cash Flow
Loan Limit Exceeded
Sell Without Ownership
Buy Without Sufficient Cash
```

## Reproducibility Test

같은:

```text
Season Version
Rule Version
Random Seed
Player Decisions
```

를 입력하면 동일 결과가 나오는지 검증한다.

---

# 53. Implementation Guardrails

Antigravity는 다음을 임의로 결정하지 않는다.

- 경제 수식의 임의 변경
- 소득 배율
- 생활비 배율
- 금리 시나리오
- 부동산 가격 탄력성
- GLI 가격 영향력
- 세금률
- 거래비용률
- 강제매각 규칙
- 파산 규칙
- A/B 실험군

위 항목에 대한 제안이 필요한 경우:

```text
[QUESTION]
[OPTION]
[IMPACT]
[RECOMMENDATION]
```

형식으로 보고한다.

---

# 54. Technical Implementation Principle

Economic Engine은 가능한 한 순수한 계산 모듈로 분리한다.

개념:

```text
Input State
+
Economic Parameters
+
Player Decision
↓
Economic Engine
↓
Output State
```

UI 코드가 경제 계산을 직접 수행하지 않는다.

예:

```text
UI
↓
API Request
↓
Economic Engine
↓
Result
↓
UI
```

---

# 55. AI Boundary

AI를 다음 계산에 직접 사용하지 않는다.

- Interest
- Inflation
- Loan
- LTV
- DSR
- Property Price
- Income
- Expense
- Net Worth

이 계산은 결정론적 코드가 담당한다.

AI는 향후 다음에 활용할 수 있다.

- 개발 지원
- 코드 리뷰
- 분석 보조
- Season Report 생성
- Insight 후보 생성
- 자연어 설명

---

# 56. Economic Engine Completion Criteria

Economic Engine v1.0은 다음 조건을 만족해야 한다.

- [ ] 30년 Simulation Time 실행 가능
- [ ] Global Season Clock
- [ ] Background Simulation
- [ ] Batch-based Time Progression
- [ ] Initial 7억원
- [ ] Income
- [ ] Expense
- [ ] Interest
- [ ] Debt
- [ ] Property
- [ ] Property Price Change
- [ ] Buy
- [ ] Sell
- [ ] Cash Flow
- [ ] Net Worth
- [ ] Decision Context Logging
- [ ] Rule Version
- [ ] Random Seed support
- [ ] Reproducibility
- [ ] Basic test scenarios

---

# 57. Open Decisions Before Coding

다음 값은 아직 제품/실험적으로 확정되지 않았으므로
Antigravity가 임의로 채우지 않는다.

## Income

- Base annual income
- Income growth rate
- Peak income
- Retirement income

## Expense

- Base living cost
- Inflation rate
- Property maintenance rate

## Debt

- LTV
- DSR
- Interest spread
- Loan maturity
- Repayment method

## Property

- Price update frequency
- Regional price sensitivity
- Supply/Demand elasticity
- GLI effect coefficient
- Rent model

## Transaction

- Buy cost
- Sell cost
- Tax

## Economic Scenario

- Phase duration
- Rate path
- Inflation path
- Market shock

이 값들은 다음 설계/검증 과정에서 결정한다.

---

# 58. Next Document

다음 문서:

`PLAY_03_DATABASE_SCHEMA.md`

목적:

> Economic Engine과 Season Engine에서 생성되는 상태와 행동 데이터를 안정적으로 저장할 데이터 구조를 정의한다.

특히 다음을 설계한다.

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_STATE
PLAY_ECONOMIC_STATE
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_TRANSACTION
PLAY_DECISION_LOG
PLAY_SEASON_RESULT
```

그리고:

- document/key 구조
- field types
- indexes
- references
- immutable fields
- server-only fields
- client-readable fields
- security rules boundary
- batch/transaction strategy

를 정의한다.

---

# 59. Final Principle

PLAY Economic Engine의 핵심은 복잡함이 아니다.

핵심은:

> **같은 경제환경에서 사람이 다른 선택을 하고, 그 선택이 다른 결과를 만드는 구조를 재현 가능하게 만드는 것**

이다.

따라서 Season 1은 완벽한 한국경제 복제가 아니라
통제 가능하고 설명 가능하며 재현 가능한 경제환경을 우선한다.

개발 순서는:

```text
Economic Rules
      ↓
State Model
      ↓
Simulation
      ↓
Decision
      ↓
Transaction
      ↓
Logging
      ↓
Analysis
```

로 유지한다.

경제 규칙이 확정되기 전에는 UI를 통해 경제 규칙을 임의로 결정하지 않는다.
