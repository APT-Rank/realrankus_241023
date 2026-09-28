# PLAY_01_ARCHITECTURE.md

# RealRankus PLAY — System Architecture Specification v1.0

## 0. Document Purpose

본 문서는 기존 RealRankus 시스템 분석 결과(`PLAY_00_EXISTING_REALRANKUS_ANALYSIS.md`)를 기반으로,
RealRankus PLAY의 전체 시스템 경계와 핵심 아키텍처를 정의하기 위한 설계 문서다.

이 문서는 즉시 전체 PLAY를 구현하기 위한 코딩 지시서가 아니다.

목적은 다음과 같다.

1. 기존 RealRankus와 PLAY의 시스템 경계를 확정한다.
2. PLAY가 단순한 부동산 게임이 아니라 경제 행동 실험 플랫폼이라는 원칙을 시스템 구조에 반영한다.
3. 경제 엔진, 시장 엔진, 거래 엔진, 플레이어 상태, 의사결정 데이터의 책임 범위를 정의한다.
4. 기존 RealRankus의 데이터와 인증을 어디까지 재사용할지 정의한다.
5. PLAY의 핵심 로직을 클라이언트에 노출하지 않는 구조를 정의한다.
6. 이후 `PLAY_02`, `PLAY_03`, `PLAY_04`의 기준이 되는 아키텍처 계약서를 만든다.

---

# 1. Existing RealRankus Baseline

`PLAY_00` 분석 결과 현재 RealRankus는 다음 구조를 가진다.

- Frontend: HTML5, Vanilla JavaScript, jQuery, Bootstrap 5
- Visualization: Chart.js, Naver Map API
- Backend/Database: Firebase Firestore, Realtime Database, Authentication
- Data Pipeline: Python 기반 공공데이터/API 수집 및 JSON/CSV 생성
- 주요 비즈니스 로직: 클라이언트 JavaScript에 상당 부분 존재
- 인증: Firebase Authentication
- 기존 부동산 데이터 및 GLI 관련 데이터 보유
- 별도 테스트 프레임워크 구조는 확인되지 않음

PLAY_00에서는 기존 서비스와 PLAY를 논리적으로 분리하는 Hybrid 구조가 제안되었다.

따라서 본 문서에서는 다음 원칙을 채택한다.

> 기존 RealRankus는 가능한 한 현행 구조를 유지한다.
> PLAY는 독립적인 경제 시뮬레이션/행동 실험 모듈로 추가한다.

기존 시스템을 PLAY 때문에 전면 재작성하지 않는다.

---

# 2. PLAY Product Definition

PLAY의 시스템적 정의는 다음과 같다.

> PLAY는 사람들이 30년의 가상 경제생활을 경험하면서 동일하거나 통제된 경제환경에서 서로 다른 경제적 의사결정을 내리고, 그 결정과 결과를 구조화된 데이터로 축적하여 시즌별 분석과 RealRankus 개선에 활용하는 경제 행동 실험 플랫폼이다.

게임은 사용자 참여를 위한 인터페이스다.

핵심 자산은 게임 화면 자체가 아니라 다음의 연결이다.

```text
Economic Environment
        ↓
Human Decision
        ↓
Transaction / Behavior
        ↓
Economic Outcome
        ↓
Decision Data
        ↓
Season Analysis
        ↓
Insight
        ↓
Next Season / RealRankus Improvement
```

PLAY의 성공 여부를 단순 사용자 수나 게임 체류시간만으로 판단하지 않는다.

---

# 3. Core Architecture Principles

## 3.1 Existing Service Preservation

기존 RealRankus의 핵심 서비스와 PLAY를 논리적으로 분리한다.

PLAY 개발이 기존 RealRankus의 일반적인 부동산 검색/분석/리포트 기능을 훼손해서는 안 된다.

---

## 3.2 Shared Data, Separate Logic

다음은 재사용 가능성을 우선 검토한다.

- Firebase Authentication
- 기존 아파트 마스터 데이터
- 기존 부동산 가격 데이터
- 기존 GLI 관련 데이터
- 기존 경제 데이터

단, PLAY에서 사용하는 값은 원본 데이터를 직접 변형하지 않는다.

PLAY가 사용하는 시뮬레이션 상태와 가격은 별도로 관리한다.

---

## 3.3 Server-Side Authority

PLAY의 핵심 경제 규칙은 클라이언트가 최종 권한을 가지지 않는다.

다음 영역은 서버 측에서 검증/계산하는 것을 기본 원칙으로 한다.

- Player State
- Cash
- Income
- Expense
- Debt
- Loan
- Property Ownership
- PLAY Property Price
- Transaction
- Net Worth
- Season Time
- Economic Environment
- Decision Log

클라이언트는 명령을 요청하고 결과를 표시한다.

```text
Client
  ↓ request
PLAY Server / Backend
  ↓ validate
Economic / Transaction Engine
  ↓
PLAY Database
  ↓
response
Client
```

---

## 3.4 Real Market vs PLAY Market Separation

실제 부동산 시장 데이터와 PLAY 내부 시뮬레이션 데이터를 명확하게 분리한다.

### Real Market Data

실제 시장에서 관측된 데이터.

예:

- 실제 아파트 가격
- 실제 금리
- 실제 경제지표
- 실제 공급/수요 관련 데이터
- 실제 GLI 입력 데이터

### PLAY Market Data

PLAY 안에서 시뮬레이션되는 데이터.

예:

- PLAY Property Price
- PLAY Rent
- PLAY Market Trend
- PLAY Supply/Demand State
- PLAY Regional Environment
- PLAY Economic Phase

초기 시즌에서는 실제 가격을 시작점으로 사용할 수 있다.

그러나 이후 PLAY 내부에서 가격이 변하면 그것은 실제 미래 가격 예측값이 아니라 PLAY 시뮬레이션 결과다.

---

# 4. High-Level Architecture

```text
┌───────────────────────────────────────────────┐
│                 RealRankus                    │
│                                               │
│  Existing Frontend                            │
│  Existing Firebase Auth                       │
│  Property Master / Real Market Data           │
│  GLI / Existing Analytics                     │
│                                               │
└──────────────────────┬────────────────────────┘
                       │
                       │ Shared / Read Only
                       ▼
┌───────────────────────────────────────────────┐
│                    PLAY                       │
│                                               │
│  PLAY Frontend                                │
│        │                                      │
│        ▼                                      │
│  PLAY Backend / API                           │
│        │                                      │
│        ├── Season Engine                       │
│        ├── Economic Engine                     │
│        ├── Property Market Engine              │
│        ├── Income Engine                       │
│        ├── Expense Engine                      │
│        ├── Debt Engine                         │
│        ├── Transaction Engine                  │
│        ├── Player State Engine                 │
│        └── Decision Log                        │
│                                               │
│        ▼                                      │
│  PLAY Database                                │
│                                               │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
              Season Analysis Engine
                       │
                       ├── Behavioral Insight
                       ├── Outcome Analysis
                       ├── Hypothesis
                       └── Next Season Input
```

---

# 5. System Boundaries

## 5.1 Existing RealRankus Responsibilities

기존 RealRankus가 담당한다.

- 실제 부동산 정보
- 실제 아파트 마스터 데이터
- 실제 시장 데이터
- GLI 계산/표시
- 기존 사용자 인증
- 기존 일반 서비스
- 기존 리포트/커뮤니티 기능

단, 실제 코드의 정확한 책임 범위는 구현 단계에서 추가 확인한다.

---

## 5.2 PLAY Responsibilities

PLAY가 담당한다.

- Season
- Simulation Time
- Player State
- Income
- Expense
- Debt
- Cash
- Property Ownership
- PLAY Property Price
- Market Environment
- Transaction
- Decision Log
- Season Result
- Season Analysis용 데이터

---

# 6. Data Ownership

## 6.1 Shared / Read-Only Source

PLAY가 참조할 수 있는 기존 데이터.

```text
PROPERTY_MASTER
REAL_PROPERTY_PRICE
GLI_DATA
ECONOMIC_SOURCE_DATA
USER_AUTH
```

PLAY가 원본 데이터를 임의 수정해서는 안 된다.

---

## 6.2 PLAY-Owned Data

PLAY가 직접 생성/관리한다.

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_STATE
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_TRANSACTION
PLAY_DECISION_LOG
PLAY_ECONOMIC_STATE
PLAY_SEASON_RESULT
```

실제 최종 컬렉션/테이블명은 `PLAY_03_DATABASE_SCHEMA.md`에서 확정한다.

---

# 7. Season Engine

## 7.1 Season Definition

초기 설계 기준:

- Real Time: 3개월
- Simulation Time: 30년
- Simulation ratio: 1 real day ≈ 4 simulated months

이 값은 Season 1의 기본 설정값으로 사용한다.

하드코딩하지 않고 Season Configuration으로 관리할 수 있는 구조를 우선 고려한다.

---

## 7.2 Season State

Season은 최소한 다음 상태를 가진다.

```text
DRAFT
READY
ACTIVE
PAUSED
CLOSED
ANALYZING
ARCHIVED
```

초기 MVP에서는 필요한 상태만 구현해도 된다.

---

## 7.3 Season Configuration

Season별로 다음 값을 설정할 수 있어야 한다.

```text
season_id
start_at
end_at
simulation_years
simulation_speed
initial_cash
income_profile
expense_profile
economic_environment
available_regions
available_properties
loan_rules
market_rules
reward_rules
```

실제 필드 확정은 `PLAY_03`에서 한다.

---

# 8. Time Engine

PLAY의 시간은 실제 시간과 시뮬레이션 시간을 분리한다.

```text
Real Clock
    ↓
Simulation Clock
```

Season 1 기본값:

```text
3 real months
=
30 simulated years
```

시간이 진행될 때 시스템은 다음 순서로 상태를 업데이트하는 것을 기본으로 한다.

```text
1. Simulation Time Advance
2. Economic Environment Update
3. Interest / Inflation Update
4. Property Market Update
5. Income Update
6. Expense Update
7. Debt Service
8. Player State Update
9. Decision Window
10. Transaction
11. Outcome Calculation
12. Decision Log
```

정확한 실행 주기와 순서는 `PLAY_02_ECONOMIC_ENGINE.md`에서 확정한다.

---

# 9. Economic Engine

Economic Engine은 PLAY의 핵심 시스템이다.

목표는 단순한 가격 변동이 아니라 플레이어의 경제생활 전체를 계산하는 것이다.

최소 구성:

```text
Economic Environment
├── Interest Rate
├── Inflation
├── Economic Phase
├── Supply
├── Demand
└── Regional Environment

Player Economy
├── Income
├── Expense
├── Cash
├── Debt
├── Property
└── Cash Flow
```

---

# 10. Economic Environment

초기 설계에서 고려할 변수:

- Interest Rate
- Inflation
- Economic Phase
- Housing Market Trend
- Supply
- Demand
- Regional Development
- Transportation
- Population
- Other RealRankus-derived environmental factors

모든 변수의 실제 공식은 아직 확정하지 않는다.

공식과 가중치는 `PLAY_02`에서 정의한다.

---

# 11. Income Engine

Season 1에서는 실험 통제를 위해 동일한 기본 소득 프로파일을 사용할 수 있다.

단, 소득을 30년 동안 고정된 숫자로 두지 않는다.

기본적인 lifecycle curve를 가진다.

```text
Income
  ↑
  │       ______
  │      /      \
  │     /        \
  │____/          \________
  │
  └──────────────────────→ Time
      Growth   Peak   Decline
                     Retirement
```

초기 구현에서는 단순화할 수 있다.

예:

```text
Career Growth
Income Peak
Income Plateau
Retirement
Pension / Non-Labor Income
```

정확한 곡선은 `PLAY_02`에서 확정한다.

---

# 12. Expense Engine

PLAY에서는 비용을 반드시 계산한다.

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

초기 MVP에서는 핵심 항목만 구현하고 이후 확장한다.

중요한 것은 단순 순자산보다 현금흐름을 보존하는 것이다.

```text
Cash Flow
=
Income
- Living Expense
- Housing Expense
- Tax
- Interest
- Principal
- Other Expense
```

---

# 13. Debt Engine

대출은 PLAY의 핵심 행동 변수다.

최소한 다음 개념을 분리한다.

```text
Collateral Limit
Income Limit
Repayment Capacity
Actual Loan
```

개념적으로:

```text
Max Loan
=
min(
    LTV Limit,
    DSR / Income Limit,
    Affordability / Cash Flow Limit
)
```

이 식은 개념 정의이며 실제 계산식은 `PLAY_02`에서 확정한다.

중요:

> "구매 가능"과 "감당 가능"을 구분한다.

---

# 14. Property Market Engine

PLAY의 부동산 시장은 기존 RealRankus의 실제 데이터를 초기 상태로 활용할 수 있다.

예:

```text
Real Property Price
        ↓
PLAY Initial Property Price
        ↓
Simulation
        ↓
PLAY Property Price
```

가격 변화는 향후 다음 요소를 조합할 수 있다.

```text
Base Market Change
+ Interest Effect
+ Supply Effect
+ Demand Effect
+ GLI Effect
+ Regional Environment Effect
+ Random Shock
```

단, 이 공식은 아직 확정하지 않는다.

---

# 15. RealRankus / GLI Integration

GLI는 PLAY에서 단순한 화면 지표가 아니라 환경변수 또는 정보변수로 활용할 가능성이 있다.

가능한 구조:

```text
RealRankus GLI
       ↓
PLAY Property Attribute
       ↓
Market / Information
       ↓
Player Decision
       ↓
Outcome
```

중요한 원칙:

PLAY가 GLI를 사용한다고 해서 모든 사용자에게 동일한 방식으로 노출해야 한다는 의미는 아니다.

향후 실험 설계에 따라

- GLI 제공
- GLI 미제공
- 일부 정보 제공

등의 실험군을 고려할 수 있다.

단, 실제 실험군 설계는 별도의 Experiment Design 문서에서 정의한다.

---

# 16. Player State Engine

각 플레이어는 시뮬레이션 시점마다 상태를 가진다.

최소 상태:

```text
Player
├── Cash
├── Income
├── Expense
├── Debt
├── Net Worth
├── Cash Flow
├── LTV
├── DSR
├── Owned Properties
└── Other Assets
```

핵심 계산:

```text
Net Worth
=
Total Assets
-
Total Liabilities
```

그리고:

```text
Economic Freedom Rate
=
Non-Labor Income
/
Essential Living Cost
× 100
```

Economic Freedom Rate는 PLAY의 주요 결과지표 후보로 관리한다.

---

# 17. Transaction Engine

초기 Season에서는 사용자 간 직접 거래를 기본 구조로 사용하지 않는다.

기본 구조:

```text
Player
  ↓
PLAY Market
  ↓
BUY / SELL
  ↓
Transaction Validation
  ↓
Player State Update
  ↓
Property Ownership Update
```

거래 검증 항목:

```text
Cash Sufficiency
Loan Eligibility
Debt Capacity
Ownership
Market Availability
Transaction Rules
Season Rules
```

사용자가 브라우저에서 거래 결과를 직접 결정할 수 없어야 한다.

---

# 18. Decision Model

PLAY의 핵심 데이터는 거래 그 자체가 아니라 의사결정이다.

따라서 다음을 구분한다.

```text
Decision
≠
Transaction
```

예:

```text
Decision:
"서울 A지역 아파트를 10억에 매수하기로 결정"

Transaction:
"검증 후 실제 PLAY 자산으로 매수 완료"
```

실패한 결정도 가능하면 기록 가치가 있다.

예:

```text
BUY_REQUEST
BUY_SUCCESS
BUY_REJECTED
SELL_REQUEST
SELL_SUCCESS
SELL_REJECTED
HOLD
```

정확한 상태값은 `PLAY_03`에서 정의한다.

---

# 19. Decision Log

PLAY의 핵심 데이터 자산이다.

Decision Log는 최소한 다음 범주의 정보를 함께 저장해야 한다.

## Player Context

```text
player_id
season_id
simulation_time
cash
income
expense
net_worth
debt
ltv
dsr
cash_flow
```

## Property Context

```text
property_id
region
play_price
real_price_reference
gli
rent
supply
```

## Market Context

```text
interest_rate
inflation
economic_phase
price_trend
supply_trend
```

## Decision

```text
action
amount
loan_amount
target_property
```

## Outcome

```text
transaction_result
future_1y_result
future_3y_result
future_5y_result
future_10y_result
```

향후 Outcome 저장 방식은 분석 엔진 요구사항에 따라 확정한다.

---

# 20. Decision Context Principle

모든 중요한 의사결정에는 당시의 환경을 함께 저장한다.

잘못된 구조:

```text
Player A bought Property B.
```

권장 구조:

```text
Player A
+
Cash at decision
+
Income
+
Debt
+
Interest Rate
+
Economic Phase
+
Property Price
+
GLI
+
Market Trend
+
Decision
+
Loan
+
Outcome
```

이 구조가 있어야 동일 조건 비교가 가능하다.

---

# 21. PLAY Database Separation

PLAY 관련 데이터는 기존 일반 서비스 데이터와 논리적으로 분리한다.

권장 초기 영역:

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_STATE
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_TRANSACTION
PLAY_DECISION_LOG
PLAY_ECONOMIC_STATE
PLAY_SEASON_RESULT
```

실제 Firebase 컬렉션 구조, 인덱스, Security Rules는 `PLAY_03_DATABASE_SCHEMA.md`에서 정의한다.

---

# 22. Security Architecture

PLAY 데이터는 사용자가 직접 수정할 수 없어야 한다.

특히 다음 데이터는 서버 권한을 기본으로 한다.

- Cash
- Debt
- Property Ownership
- Transaction Result
- Net Worth
- Season Time
- Economic Environment
- Decision Log

클라이언트가 보내는 값은 "요청"으로 취급한다.

예:

```json
{
  "action": "BUY",
  "propertyId": "P123",
  "amount": 1000000000
}
```

서버는 이 요청을 검증하고 실제 상태를 계산한다.

---

# 23. Frontend Architecture

초기 PLAY Frontend는 기존 RealRankus와 독립된 화면/모듈 구조를 우선한다.

기존 RealRankus의 모든 화면을 React/Vue로 즉시 전환하지 않는다.

초기 목표:

```text
PLAY
├── Dashboard
├── Market
├── My Assets
├── Buy / Sell
├── Economic Status
├── Timeline
└── Season Result
```

프론트엔드 기술 선택은 실제 MVP 복잡도와 개발 효율을 확인한 뒤 확정한다.

---

# 24. Backend Architecture Decision

본 문서에서는 Cloud Functions 또는 외부 API 서버 중 하나를 아직 최종 확정하지 않는다.

이유:

1. Economic Engine의 실제 계산량이 아직 확정되지 않았다.
2. Transaction Engine 요구사항이 아직 확정되지 않았다.
3. Season 운영 방식이 아직 확정되지 않았다.
4. 예상 사용자 규모가 아직 검증되지 않았다.
5. 비용/운영 복잡도를 실제 MVP 요구사항과 함께 판단해야 한다.

따라서:

> 아키텍처 원칙은 "서버 권한 경제 엔진"으로 확정하고, 구체적인 서버 기술은 후속 기술 결정 문서에서 확정한다.

---

# 25. Server vs Client Responsibility

## Client

```text
Display
Input
Navigation
Charts
Animation
User Request
```

## Server

```text
Authentication Verification
Season Time
Economic Environment
Economic Calculation
Transaction Validation
Asset Calculation
Debt Calculation
Net Worth
Decision Log
Anti-Abuse Validation
```

## Database

```text
Persistent State
Transaction History
Decision History
Season Data
Market State
Player State
```

---

# 26. Season Analysis Boundary

Season Analysis는 PLAY 실행 엔진과 분리한다.

```text
PLAY Runtime
    ↓
RAW Data
    ↓
Analysis Engine
    ↓
Insight
```

PLAY 실행 중 분석 때문에 경제 계산이 달라져서는 안 된다.

분석은 기록된 데이터를 대상으로 수행한다.

---

# 27. Analysis Data Flow

```text
Economic Environment
        ↓
Player State
        ↓
Decision
        ↓
Transaction
        ↓
Outcome
        ↓
Decision Log
        ↓
Season Data
        ↓
Analysis
```

분석의 기본 질문:

### Descriptive

무슨 일이 일어났는가?

### Behavioral

사람들은 어떻게 행동했는가?

### Outcome

어떤 행동과 결과가 함께 나타났는가?

### Hypothesis

반복되는 패턴은 무엇인가?

인과관계가 확인되지 않은 경우 상관관계로 표현한다.

---

# 28. RealRankus Feedback Loop

PLAY의 장기적인 목적은 다음 순환 구조를 만드는 것이다.

```text
Real Market
    ↓
RealRankus
    ↓
PLAY Environment
    ↓
Human Decisions
    ↓
PLAY Outcomes
    ↓
Season Analysis
    ↓
Insight
    ↓
Hypothesis
    ↓
Next Season
    ↓
RealRankus Improvement
```

PLAY는 RealRankus와 독립적인 별도 게임으로 끝나지 않는다.

---

# 29. MVP Boundary

초기 MVP에는 다음만 포함한다.

## Required

- Firebase Auth reuse
- PLAY Season
- Initial Cash = 7억원
- Basic Income
- Basic Living Expense
- Cash
- Property
- Property Price
- Loan
- Interest
- Buy
- Sell
- Property Ownership
- Net Worth
- Simulation Time
- Decision Log

## Deferred

- Complex tax
- Detailed education expense
- Detailed pension
- Business income
- Unemployment
- Complex rental market
- Complex supply/demand
- Advanced GLI experiment
- A/B experiment
- Advanced behavioral clustering
- Advanced rewards
- Sponsor system
- Full Hall of Fame
- Economic Decision Profile

MVP에서 모든 기능을 구현하지 않는다.

---

# 30. MVP Success Criteria

MVP의 성공 조건은 화면 완성도가 아니다.

다음 시나리오가 정상적으로 실행되어야 한다.

```text
1. User Login
2. Join Season
3. Receive 7억원 initial equity
4. Simulation Time advances
5. Income occurs
6. Expenses occur
7. Loan can be calculated
8. Property can be purchased
9. Property can be sold
10. Property price changes
11. Debt changes
12. Net worth changes
13. Decision is logged
14. Season result can be reconstructed
```

이 전체 흐름이 서버 검증을 거쳐 재현 가능해야 한다.

---

# 31. Anti-Goals

초기 개발에서 다음을 하지 않는다.

1. 기존 RealRankus 전체 리팩터링
2. 기존 UI 전체 React/Vue 전환
3. 대규모 게임 그래픽 개발
4. 복잡한 실시간 멀티플레이어 거래
5. 모든 한국 부동산을 처음부터 완전한 게임 자산으로 모델링
6. AI를 경제 계산의 핵심 엔진으로 사용
7. 처음부터 완벽한 세금/정책 모델 구현
8. 대규모 보상 시스템 구현
9. 분석 기능을 위해 실행 엔진을 복잡하게 만드는 것

핵심은 경제 엔진의 검증이다.

---

# 32. AI Usage Principle

PLAY의 경제 시뮬레이션 계산은 일반적인 결정론적 코드로 구현한다.

AI 호출을 경제 계산의 필수 경로에 넣지 않는다.

AI는 향후 다음 용도로 활용할 수 있다.

- 개발 지원
- 코드 리뷰
- 데이터 분석 지원
- 시즌 결과 설명
- 사용자 리포트 생성
- Insight 후보 생성

그러나 동일 입력에 대해 동일 결과가 필요한 핵심 경제 계산은 일반 코드가 담당한다.

---

# 33. Observability / Reproducibility

경제 시뮬레이션은 재현 가능해야 한다.

가능하면 다음을 저장한다.

```text
season_id
simulation_time
economic_state_version
market_rule_version
player_state_version
transaction_rule_version
```

향후 동일 Season 설정으로 결과를 재현할 수 있는 구조를 고려한다.

정확한 versioning 방식은 후속 문서에서 정의한다.

---

# 34. Versioning Principle

경제 규칙은 변경될 수 있다.

따라서 다음을 구분한다.

```text
Season Version
Economic Rule Version
Market Rule Version
Transaction Rule Version
```

Season 1에서 사용한 규칙이 Season 2에서 변경되더라도 Season 1의 결과를 해석할 수 있어야 한다.

---

# 35. Data Governance Principle

PLAY는 행동 데이터를 축적하는 시스템이므로 향후 실제 서비스 운영 단계에서는 다음 항목을 별도로 설계해야 한다.

- 개인정보 처리
- 행동 데이터 수집 범위
- 분석 목적 고지
- 데이터 보관 기간
- 익명화/가명화
- 외부 제공 여부
- 사용자에게 반환하는 분석 결과
- 연구/실험 목적의 데이터 활용 범위

본 문서에서는 법률/정책 세부사항을 확정하지 않는다.

---

# 36. Architecture Decision Summary

현재 확정:

1. 기존 RealRankus와 PLAY는 논리적으로 분리한다.
2. 기존 Firebase Auth를 우선 재사용한다.
3. 기존 부동산/GLI 데이터는 PLAY에서 읽기 전용 기반 데이터로 활용한다.
4. PLAY 전용 데이터 영역을 분리한다.
5. PLAY 핵심 경제 로직은 서버 권한으로 처리한다.
6. PLAY 가격과 실제 가격을 분리한다.
7. Player State를 서버에서 관리한다.
8. Decision과 Transaction을 구분한다.
9. Decision Context를 함께 기록한다.
10. Season Analysis는 Runtime Engine과 분리한다.
11. AI는 핵심 경제 계산 엔진이 아니다.
12. 기존 RealRankus 전체를 즉시 리팩터링하지 않는다.
13. MVP에서는 경제 엔진의 작동 여부를 우선 검증한다.
14. Cloud Functions vs 외부 API 서버는 후속 기술 결정으로 남긴다.

---

# 37. Architecture Questions to Resolve Next

다음 문서에서 반드시 결정해야 한다.

## Economic Rules

- 소득 곡선
- 생활비
- 인플레이션
- 금리
- 부동산 가격 변화
- 임대수익
- 세금
- 거래비용
- 대출 상환
- LTV
- DSR
- 현금흐름

## Player Rules

- 초기 자산 7억원의 의미
- 초기 소득
- 초기 나이/생애주기 모델
- 자산 종류
- 부채 종류

## Market Rules

- PLAY 부동산 가격
- 거래 가능 자산
- 매도 유동성
- 지역별 차이
- 공급/수요

## Time Rules

- 하루/월/연 단위 계산
- 이벤트 발생 시점
- 거래 가능 시점
- 가격 갱신 주기

## Data Rules

- Decision Log 구조
- Outcome 계산
- Season Result
- Data versioning

---

# 38. Next Document

다음 문서는:

`PLAY_02_ECONOMIC_ENGINE.md`

로 한다.

목적:

> PLAY의 경제 세계가 실제로 어떻게 움직이는지를 수식과 규칙 수준에서 정의한다.

`PLAY_02`에서는 특히 다음을 확정한다.

```text
Initial Economy
Income Engine
Expense Engine
Cash Flow
Debt Engine
Interest
Inflation
Property Price Engine
Rent
Transaction Cost
Tax
Economic Cycle
Lifecycle
Net Worth
Economic Freedom
Risk Metrics
Simulation Time Step
```

`PLAY_02`가 확정되기 전에는 실제 경제 엔진 코딩을 시작하지 않는다.

---

# 39. Antigravity Instruction

현재 단계에서는 이 문서를 구현하지 않는다.

다음 작업만 수행한다.

1. 본 문서를 읽는다.
2. 기존 `PLAY_00_EXISTING_REALRANKUS_ANALYSIS.md`와 비교한다.
3. 현재 코드베이스에서 본 문서의 아키텍처를 구현하는 데 충돌하는 기존 구조가 있는지 확인한다.
4. 구현상 제약사항을 발견하면 보고한다.
5. 아직 확정되지 않은 경제 규칙을 임의로 결정하지 않는다.
6. 기존 RealRankus 코드를 수정하지 않는다.
7. PLAY 코드를 작성하지 않는다.
8. 새로운 DB 컬렉션을 생성하지 않는다.
9. Security Rules를 변경하지 않는다.
10. 서버 환경을 임의로 선택하지 않는다.

출력 파일:

`PLAY_01_ARCHITECTURE_REVIEW.md`

다음 내용을 포함한다.

- Architecture compatibility
- Existing code conflicts
- Technical constraints
- Unknowns
- Security concerns
- Deployment concerns
- Recommended technical decisions
- Questions requiring product/business decisions

중요:

> 기술적으로 가능한 것과 제품적으로 결정해야 하는 것을 구분해서 작성한다.

경제 규칙, 보상 규칙, 실험군, 사용자 행동 유도 방식 등 제품/실험 설계에 관한 사항은 임의로 결정하지 않는다.

---

# 40. Completion Checklist

- [ ] Existing RealRankus boundary defined
- [ ] PLAY boundary defined
- [ ] Shared data defined
- [ ] PLAY-owned data defined
- [ ] Server authority defined
- [ ] Real Market / PLAY Market separated
- [ ] Season Engine defined
- [ ] Economic Engine boundary defined
- [ ] Player State defined
- [ ] Transaction Engine defined
- [ ] Decision / Transaction separated
- [ ] Decision Context principle defined
- [ ] Decision Log boundary defined
- [ ] Analysis Engine separated
- [ ] MVP boundary defined
- [ ] Anti-goals defined
- [ ] AI usage principle defined
- [ ] Versioning principle defined
- [ ] Data governance principle defined
- [ ] No code changes made
- [ ] No DB changes made
- [ ] No deployment changes made

---

# 41. Final Principle

PLAY를 "부동산 게임"으로 설계하지 않는다.

PLAY는

> **경제 환경을 만들고, 그 환경 속에서 사람이 내리는 선택을 기록하고, 그 선택의 결과를 분석하는 시스템**

이다.

게임은 참여를 유도하는 인터페이스이고,

경제 엔진은 실험 환경이며,

Decision Log는 핵심 데이터 자산이고,

Season Analysis는 PLAY가 축적한 데이터를 지식으로 전환하는 엔진이다.

따라서 개발 우선순위는 다음과 같다.

```text
Economic Model
      ↓
Data Model
      ↓
Server Authority
      ↓
Simulation
      ↓
Decision Logging
      ↓
User Interface
      ↓
Gameification
```

화려한 게임보다 먼저 경제 시스템과 데이터 구조가 정확해야 한다.
