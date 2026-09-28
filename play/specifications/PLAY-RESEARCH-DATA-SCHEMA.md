# PLAY-RESEARCH-DATA-SCHEMA

**Document ID:** PLAY-RESEARCH-DATA-SCHEMA  
**Status:** DRAFT — Research Data Architecture Baseline  
**Scope:** PLAY Season data for behavioral research, Season analysis, whitepaper/paper/book production  
**Relationship:** Extends existing PLAY runtime data without changing verified Economic/Property/Batch engines

---

# 1. Purpose

PLAY의 최종 가치는 단순히 경제 시뮬레이션을 실행하는 것에 있지 않다.

PLAY는 동일하거나 통제된 경제환경에 참여자를 노출하고,

```text
Economic Environment
        ↓
Information Exposure
        ↓
Participant State
        ↓
Intention / Decision
        ↓
Action
        ↓
Validation
        ↓
Transaction
        ↓
Outcome
        ↓
Longitudinal Behavior
```

의 전체 흐름을 기록하여 Season별 경제 행동 데이터를 축적하는 것을 목표로 한다.

이 문서는 기존 PLAY 실행 데이터 구조 위에 **연구용 데이터 계층(Research Data Layer)** 을 정의한다.

핵심 질문:

> 어떤 환경에서, 어떤 정보를 본 참여자가, 어떤 상태에서, 어떤 결정을 내렸고, 그 결정이 어떤 결과로 이어졌는가?

---

# 2. Design Principles

## 2.1 Runtime과 Research Data를 분리한다

```text
PLAY Runtime
    ↓
Operational / RAW Data
    ↓
Research Data Layer
    ↓
Season Dataset
    ↓
Analysis
```

연구용 분석 로직은 PLAY Runtime의 경제 계산이나 거래 결과를 변경해서는 안 된다.

## 2.2 Decision과 Transaction을 분리한다

```text
Decision ≠ Transaction
```

예:

```text
BUY_REQUEST
    ↓
Validation
    ↓
BUY_SUCCESS
```

또는

```text
BUY_REQUEST
    ↓
Validation
    ↓
BUY_REJECTED
```

실패한 행동도 연구 데이터다.

## 2.3 실제 행동과 자기보고 이유를 분리한다

```text
Observed Action = Primary Data
Reason Tag       = Auxiliary Data
```

Reason Tag는 행동을 설명하는 보조 변수로 취급한다.

## 2.4 모든 중요한 행동에는 당시 Context가 있어야 한다

```text
Player State
Market State
Economic State
Property State
Decision
Action
Outcome
```

## 2.5 Deterministic Replay가 가능해야 한다

최소한 다음으로 당시 상황을 재구성할 수 있어야 한다.

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
simulation_period
player_id
state_snapshot_id
```

---

# 3. Research Data Architecture

```text
                    PLAY
                     │
              ┌──────┴──────┐
              │             │
       Economic Engine   Market Engine
              │             │
              └──────┬──────┘
                     ↓
                 RAW DATA
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
 Participant     Exposure       Decision
   Context        Context        Context
       └─────────────┼─────────────┘
                     ↓
               Action / Event
                     ↓
              Validation Result
                     ↓
                Transaction
                     ↓
                  Outcome
                     ↓
             Trajectory / Snapshot
                     ↓
              Season Dataset
                     ↓
         Season Analysis / Research
```

---

# 4. Existing Runtime Data Boundary

기존 PLAY 설계에서 다음 데이터는 Runtime Source of Truth로 유지한다.

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_ASSET
PLAY_PLAYER_STATE
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_ORDER
PLAY_TRANSACTION
PLAY_ECONOMIC_STATE
PLAY_DECISION_LOG
PLAY_SEASON_RESULT
```

추가 시장 구조:

```text
PLAY_RENT_CONTRACT
PLAY_JEONSE_CONTRACT
PLAY_LOAN
```

Firestore는 현재 상태와 실시간 거래 처리에 집중하고, 장기 History 및 Season Analysis는 BigQuery를 사용한다.

**본 문서는 기존 컬렉션을 재설계하지 않는다.**

---

# 5. Research Dataset Core Entities

Research Data Layer는 다음 논리적 Entity를 가진다.

```text
R_SEASON
R_PARTICIPANT
R_PARTICIPANT_BASELINE
R_EXPOSURE
R_STATE_SNAPSHOT
R_DECISION
R_ACTION
R_VALIDATION
R_TRANSACTION
R_OUTCOME
R_TRAJECTORY
R_EXPERIMENT
R_EXPERIMENT_EXPOSURE
R_PROVENANCE
R_SEASON_RESULT
```

물리적인 Firestore Collection 이름을 즉시 의미하지 않는다.

---

# 6. R_SEASON

```yaml
season_id
season_name
scenario_id
scenario_version
rule_version
economic_rule_version
market_rule_version
transaction_rule_version
configuration_version
random_seed
simulation_years
total_periods
initial_cash
participant_count
property_master_snapshot_id
start_at
end_at
season_status
research_status
created_at
closed_at
```

Research Metadata:

```yaml
research_question
hypothesis
experimental_condition
control_variables
treatment_variables
population_definition
```

---

# 7. R_PARTICIPANT

```yaml
participant_id
season_id
participant_type
# HUMAN / AI / TEST
anonymous_id
joined_at
left_at
status
```

연구 데이터셋에는 불필요한 개인정보를 저장하지 않는다.

```text
Real User Identity
        ↓
Internal Account
        ↓
Anonymous Research ID
        ↓
Research Dataset
```

---

# 8. R_PARTICIPANT_BASELINE

Season 시작 시점의 참여자 조건.

```yaml
participant_id
season_id
initial_cash
initial_debt
initial_property_count
initial_net_worth
income_profile
expense_profile
risk_profile
experience_group
age_group
household_group
baseline_version
captured_at
```

Human Season의 개인정보/설문 항목은 별도의 동의·개인정보 정책에서 승인한다.

---

# 9. R_EXPOSURE

참여자가 의사결정 시점에 **실제로 제공받은 정보**를 기록한다.

```yaml
exposure_id
season_id
participant_id
simulation_period
timestamp
feature_context
screen_context
property_id
displayed_price
displayed_gli
displayed_rent
displayed_supply
interest_rate
inflation
economic_phase
information_version
experiment_id
experiment_group_id
```

핵심 질문:

> 참여자가 무엇을 알고 있었는가?

---

# 10. R_STATE_SNAPSHOT

특정 시점의 참여자 상태를 고정한다.

```yaml
snapshot_id
season_id
participant_id
simulation_period
cash
cash_available
cash_locked
income
expense
cash_flow
debt
net_worth
property_count
financial_asset_total
ltv
dsr
economic_freedom_rate
market_snapshot_id
property_snapshot_id
economic_snapshot_id
created_at
```

---

# 11. R_DECISION

```yaml
decision_id
season_id
participant_id
simulation_period
timestamp
snapshot_id
exposure_id
action_intent
target_property_id
amount
loan_amount
holding_period
reason_tag
decision_status
```

예:

```text
BUY
SELL
HOLD
CANCEL
RENT
JEONSE
LOAN
```

Decision은 Transaction 성공 여부와 독립적으로 존재할 수 있다.

---

# 12. R_ACTION

```yaml
action_id
decision_id
season_id
participant_id
simulation_period
action_type
request_amount
target_property_id
request_id
idempotency_key
requested_at
```

관계:

```text
Decision → Action
```

---

# 13. R_VALIDATION

```yaml
validation_id
action_id
validation_status
cash_check
ownership_check
supply_check
loan_check
ltv_check
dsr_check
market_rule_check
season_rule_check
error_code
rejection_reason
validated_at
```

```text
Rejected Action ≠ Lost Data
```

거절된 행동도 연구 데이터로 보존한다.

---

# 14. R_TRANSACTION

기존 `PLAY_TRANSACTION`을 Research Layer에서 정규화한다.

```yaml
transaction_id
action_id
season_id
participant_id
property_id
buyer_id
seller_id
market_type
# PRIMARY / SECONDARY
transaction_price
transaction_fee
loan_amount
executed_at
transaction_status
```

Primary와 Secondary는 반드시 구분한다.

```text
PRIMARY
→ Market Initialization

SECONDARY
→ Price Discovery
→ Behavioral Data
→ Forecast Data
```

---

# 15. R_OUTCOME

## Immediate Outcome

```yaml
cash_change
debt_change
property_change
net_worth_change
transaction_result
```

## Longitudinal Outcome

```yaml
outcome_1y
outcome_3y
outcome_5y
outcome_10y
```

관측기간이 아직 도달하지 않은 결과는 임의로 채우지 않는다.

```text
Not Yet Observable
≠
Observed
```

---

# 16. R_TRAJECTORY

참여자의 장기 경제 행동 경로.

```yaml
participant_id
season_id
simulation_period
cash
income
expense
debt
net_worth
property_count
cash_flow
economic_freedom_rate
buy_count
sell_count
hold_count
loan_usage
property_exposure
decision_count
rejected_action_count
successful_transaction_count
```

---

# 17. R_EXPERIMENT

```yaml
experiment_id
experiment_name
research_question
hypothesis
experiment_version
control_group_id
treatment_group_id
treatment_variable
start_at
end_at
status
```

예:

```text
Experiment: GLI Visibility
Control: GLI Hidden
Treatment: GLI Visible
```

---

# 18. R_EXPERIMENT_EXPOSURE

```yaml
exposure_id
experiment_id
experiment_group_id
participant_id
season_id
feature_name
feature_value
exposed_at
exposure_version
```

중요:

```text
Assigned Group ≠ Actual Exposure
```

---

# 19. R_PROVENANCE

```yaml
season_id
instruction_document_id
instruction_version
execution_id
executing_agent
gcp_project
region
source_revision
git_revision
function_revisions
cloud_tasks_queues
property_master_snapshot_id
scenario_id
scenario_version
rule_version
economic_rule_version
market_rule_version
transaction_rule_version
random_seed
player_count
chunk_size
execution_started_at
execution_completed_at
```

목표:

> Exactly what system, data, rules, and instruction produced this result?

에 답할 수 있어야 한다.

---

# 20. R_SEASON_RESULT

```yaml
season_id
participant_count
completed_participant_count
total_decisions
total_actions
total_rejected_actions
total_transactions
primary_transaction_count
secondary_transaction_count
average_final_net_worth
median_final_net_worth
average_economic_freedom_rate
median_economic_freedom_rate
property_ownership_rate
loan_usage_rate
decision_distribution
action_distribution
transaction_distribution
season_integrity_status
reconciliation_status
analysis_version
calculated_at
```

분석 단계에서는 평균뿐 아니라 분포도 산출한다.

```text
mean
median
p10
p25
p50
p75
p90
standard deviation
```

---

# 21. Event Relationship

```text
Season
 │
 ├── Participant
 │       ├── Baseline
 │       ├── Exposure
 │       ├── State Snapshot
 │       └── Trajectory
 │
 └── Decision
         │
         └── Action
                │
                └── Validation
                       ├── Rejected
                       └── Accepted
                              │
                              └── Transaction
                                     │
                                     └── Outcome
```

---

# 22. Correlation / Traceability

모든 핵심 Event는 다음 관계를 역추적할 수 있어야 한다.

```text
season_id
simulation_period
participant_id
decision_id
action_id
validation_id
transaction_id
request_id
idempotency_key
snapshot_id
exposure_id
```

문제 발생 시:

```text
Season
 ↓
Period
 ↓
Participant
 ↓
Decision
 ↓
Action
 ↓
Validation
 ↓
Transaction
 ↓
Outcome
```

까지 추적 가능해야 한다.

---

# 23. Failed Action Policy

다음 데이터는 삭제하지 않는다.

```text
BUY_REJECTED
SELL_REJECTED
LOAN_REJECTED
INSUFFICIENT_CASH
INSUFFICIENT_SUPPLY
INVALID_ORDER
INVALID_OWNERSHIP
```

실패 이유는 연구적으로 중요한 변수일 수 있다.

---

# 24. Market Context

각 중요한 Decision에는 당시 Market Context를 연결한다.

```yaml
interest_rate
inflation
economic_phase
price_trend
supply_trend
demand_trend
property_price
property_reference_price
rent
supply
gli
```

Property/Market 값은 **Decision 시점의 Snapshot**을 우선한다.

후일 변경된 현재값으로 과거 Context를 덮어쓰지 않는다.

---

# 25. Same-Condition Comparison Key

```text
season_id
scenario_id
scenario_version
rule_version
simulation_period
economic_state_version
market_state_version
property_master_snapshot_id
participant_baseline_version
experiment_group_id
exposure_version
```

필요하면 분석 단계에서 이 조합으로 cohort를 생성한다.

---

# 26. Counterfactual / Replay Support

동일한 경제환경과 동일한 초기 상태에서 다른 의사결정을 했을 경우를 분석할 수 있도록 다음을 보존한다.

```text
initial_state
state_snapshot
scenario_version
rule_version
random_seed
simulation_period
participant_baseline
market_context
property_context
```

실제 관측값과 Counterfactual 결과를 분리한다.

```text
Observed Outcome
≠
Simulated Counterfactual Outcome
```

---

# 27. Research Dataset Layers

## Layer 1 — RAW

실제 실행에서 발생한 원천 데이터.

```text
PLAY_*
Decision Log
Transaction
Batch
Chunk
State
```

수정하지 않는다.

## Layer 2 — RESEARCH

분석 가능한 형태로 정규화한 데이터.

```text
R_*
```

관계와 Context를 연결한다.

## Layer 3 — ANALYTICS

가설 검증과 Season 분석을 위한 파생 데이터.

```text
Behavior Cohort
Decision Pattern
Risk Profile
Property Preference
Timing Pattern
Outcome Distribution
Economic Freedom Trajectory
```

Analytics 결과는 RAW를 변경하지 않는다.

---

# 28. Season Dataset Minimum

논문/보고서 수준의 Season Dataset은 최소 다음을 포함해야 한다.

```text
1. Season Definition
2. Economic Environment
3. Participant Baseline
4. Information Exposure
5. State Snapshot
6. Decision
7. Action
8. Validation
9. Transaction
10. Outcome
11. Longitudinal Trajectory
12. Experiment Metadata
13. Provenance
14. Integrity / Reconciliation Result
```

---

# 29. Research Questions Enabled

### Descriptive
무슨 일이 일어났는가?

### Behavioral
사람들은 어떤 상황에서 무엇을 선택했는가?

### Comparative
같은 경제환경에서 사람들의 선택은 얼마나 달랐는가?

### Outcome
어떤 행동과 어떤 결과가 함께 나타났는가?

### Longitudinal
초기의 선택이 장기적인 경제 궤적과 어떤 관계를 보였는가?

### Experimental
특정 정보의 노출 여부에 따라 행동이 달라졌는가?

### Counterfactual
동일 조건에서 다른 선택을 했다면 결과가 어떻게 달라졌을 수 있는가?

관찰 데이터에서 인과관계를 자동으로 주장하지 않는다.

---

# 30. Research Integrity Rules

1. RAW 데이터는 덮어쓰지 않는다.
2. 과거 Context를 현재값으로 업데이트하지 않는다.
3. 실패한 Action을 삭제하지 않는다.
4. 실제 관측값과 추정값을 구분한다.
5. Observed Outcome과 Counterfactual Outcome을 구분한다.
6. Season별 Rule Version을 보존한다.
7. Random Seed가 필요한 시뮬레이션은 Seed를 보존한다.
8. 분석 결과는 원천 데이터를 수정하지 않는다.
9. 연구용 Participant ID는 익명화한다.
10. 결론은 데이터가 직접 지지하는 범위를 넘지 않는다.

---

# 31. Current PLAY Mapping

| Research Entity | Current Source |
|---|---|
| R_SEASON | PLAY_SEASON |
| R_PARTICIPANT | PLAY_PLAYER |
| R_PARTICIPANT_BASELINE | PLAY_PLAYER_ASSET + Season initialization |
| R_STATE_SNAPSHOT | PLAY_PLAYER_ASSET / Player State History |
| R_DECISION | PLAY_DECISION_LOG |
| R_ACTION | PLAY_DECISION_LOG / request context |
| R_VALIDATION | Transaction result / error context |
| R_TRANSACTION | PLAY_TRANSACTION |
| R_OUTCOME | PLAY_PLAYER_ASSET / Season Result / derived history |
| R_TRAJECTORY | Player State History + Decision History |
| R_EXPERIMENT | Future |
| R_EXPERIMENT_EXPOSURE | Future |
| R_PROVENANCE | Season/Gate execution evidence |
| R_SEASON_RESULT | PLAY_SEASON_RESULT + derived analytics |

---

# 32. Current Gap Assessment

현재 PLAY에서 강하게 확보된 영역:

```text
Season
Economic Environment
Player State
Decision Log
Transaction
Reconciliation
Deterministic Replay
Provenance
```

추가 정의가 필요한 핵심 영역:

```text
Participant Baseline
Information Exposure
Explicit Decision → Action → Validation separation
Longitudinal State Snapshot
Experiment Exposure
Counterfactual Dataset
Formal Research Provenance
```

특히 **Information Exposure**는 Human Season 전에 설계해야 한다.

---

# 33. Implementation Boundary

본 문서 확정만으로 기존 검증 영역을 수정하지 않는다.

```text
Economic Engine
Property Market
Batch Processing
Idempotency
Reconciliation
Season Clock
Security / Server Authority
```

은 그대로 유지한다.

Research Data Layer는 우선:

```text
Existing RAW
      ↓
BigQuery
      ↓
Research Views / Tables
```

형태로 구현하는 것을 기본 방향으로 한다.

---

# 34. Recommended BigQuery Logical Tables

```text
research_season
research_participant
research_participant_baseline
research_exposure
research_state_snapshot
research_decision
research_action
research_validation
research_transaction
research_outcome
research_trajectory
research_experiment
research_experiment_exposure
research_provenance
research_season_result
```

물리적 테이블 분할은 실제 데이터량과 Query Pattern을 확인한 뒤 결정한다.

---

# 35. First Validation Dataset

첫 번째 검증 대상은 **AI Season 1 L100**으로 한다.

현재 확보된 L100 결과:

```text
AI Population: 100
Periods: 360
Property Master: 209
NORMAL: 200
Decision Logs: 36,104
Final Verdict: PASS
Reconciliation: PASS
Traceability: PASS
```

L100을 이용하여 Research Layer의 최소 변환 가능성을 검증한다.

단, L100의 AI 행동은 Human Behavioral Research와 동일하게 해석하지 않는다.

AI Season의 역할:

```text
Data Generation
System Stress
Traceability
Integrity
Schema Validation
```

---

# 36. Human Season Readiness Gate

Human Season 시작 전 최소한 다음이 PASS여야 한다.

```text
[ ] Participant anonymous ID
[ ] Participant baseline
[ ] Exposure logging
[ ] Decision logging
[ ] Action logging
[ ] Rejection logging
[ ] Transaction linkage
[ ] State snapshot
[ ] Outcome calculation
[ ] Provenance
[ ] Deterministic replay support
[ ] Research BigQuery pipeline
[ ] RAW / Research / Analytics separation
```

---

# 37. Final Principle

PLAY가 축적해야 하는 것은 단순한 거래 데이터가 아니다.

핵심 데이터는:

```text
Environment
    ×
Information
    ×
Human State
    ×
Decision
    ×
Action
    ×
Outcome
    ×
Time
```

이다.

Season이 반복될수록:

```text
Season 1
    ↓
Season 2
    ↓
Season 3
    ↓
...
```

동일하거나 의도적으로 변화시킨 환경에서 축적된 행동 데이터를 비교할 수 있어야 한다.

최종적으로 PLAY는:

```text
Game
 ↓
Experiment
 ↓
Behavioral Dataset
 ↓
Season Analysis
 ↓
Hypothesis
 ↓
Next Season
 ↓
Accumulated Knowledge
```

를 지향한다.

**PLAY-RESEARCH-DATA-SCHEMA의 목적은 게임을 더 복잡하게 만드는 것이 아니라, 지금부터 생성되는 모든 Season 데이터가 나중에 버려지지 않도록 관측 구조를 먼저 고정하는 것이다.**
