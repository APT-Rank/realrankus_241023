# PLAY-07.5 RESEARCH LOGGING IMPLEMENTATION SPEC

## 0. 문서 목적

본 문서는 `PLAY-RESEARCH-DATA-SCHEMA.md`의 연구 데이터 공백(G2)을 실제 PLAY 서비스의 로깅 계층으로 보완하기 위한 구현 명세다.

현재 Research Data Schema Review 결과는 `APPROVED WITH GAPS`이며, Human Season 이전에 다음 데이터가 반드시 확보되어야 한다.

- R_EXPOSURE
- R_DECISION
- R_ACTION
- R_VALIDATION

핵심 목적은 기존 PLAY Engine의 경제 계산/거래 무결성을 변경하는 것이 아니라,

> Environment → Exposure → Decision → Action → Validation → Transaction → Outcome

이라는 연구 가능한 행동 경로를 새롭게 관측·기록하는 것이다.

---

# 1. 현재 프로젝트 위치

## 1.1 완료된 영역

- PLAY Architecture
- Economic Engine
- Property Market
- Reliability / Fault Tolerance
- Backend Infrastructure / Security
- Batch / Worker / Season Clock
- Reconciliation
- GATE 4 — 30 Period PASS
- GATE 5 — 360 Period PASS
- GATE 6 — Final Audit / Residual PASS
- PLAY-07.4 Operational Readiness
- AI Season 1 L10 PASS
- AI Season 1 L100 PASS
- PLAY Research Data Schema Review

## 1.2 현재 상태

Research Data Schema:

`APPROVED WITH GAPS`

현재 L100 데이터는 다음을 보존한다.

- AI Population: 100
- Periods: 360
- Property Master: 209
- NORMAL: 200
- Decision Logs: 36,104
- Transaction Count: 약 104
- Reconciliation / Traceability: PASS

그러나 현재 데이터로는 다음을 복원할 수 없다.

1. 사용자가 정확히 무엇을 보았는가?
2. 사용자가 어떤 의도로 행동했는가?
3. 실제 어떤 Action Request를 보냈는가?
4. 왜 Validation에서 거절되었는가?

특히 L100에서 발생한 `Insufficient cash`, `Insufficient supply` 등의 실패가 현재 영속 Research Data로 남지 않는다.

---

# 2. 절대 변경 금지 영역

다음 Verified Area는 본 단계에서 수정하지 않는다.

- Economic Engine
- Economic Batch Processing
- Season Clock
- Reconciliation
- Idempotency
- Primary Market Transaction Atomicity
- Secondary Market Matching
- Property Master
- 기존 `PLAY_DECISION_LOG`의 의미와 기존 기록 방식
- GATE 4/5/6 검증 결과
- AI L10/L100 검증 결과

특히 다음과 같은 변경은 금지한다.

- transaction validation 로직 변경
- 경제 계산식 변경
- cash/debt/net worth 계산 변경
- transaction atomicity 변경
- idempotency key 변경
- batch/chunk 처리 구조 변경
- reconciliation 기준 변경
- 기존 테스트의 assertion 완화
- 기존 실패를 성공으로 처리하는 workaround
- 기존 verified test 재실행을 위한 코드 수정

---

# 3. 구현 원칙

## 3.1 Critical Path 보호

Research Logging은 기존 transaction critical path를 느리게 하거나 실패시키면 안 된다.

기본 원칙:

`PLAY Engine → Transaction → Commit`

과

`Research Logging`

을 논리적으로 분리한다.

가능하면:

`Transaction/Event 발생`
→ `Research Event 생성`
→ `Async Queue/Event`
→ `Research Log 저장`

구조를 사용한다.

Research logging 장애가 발생해도 정상적인 경제 거래 자체가 rollback되거나 실패해서는 안 된다.

단, Research Logging이 Human Season의 필수 연구 데이터이므로 "조용히 유실"되어서는 안 된다.

따라서 다음 상태를 구분한다.

- ACCEPTED
- QUEUED
- PERSISTED
- FAILED
- DEAD_LETTER

필수 Research Event가 실패하면 별도의 monitoring/reconciliation 대상이 된다.

---

# 4. Research Event 공통 구조

모든 Research Event는 최소 다음 식별자를 가진다.

```text
research_event_id
event_type
season_id
participant_id
simulation_period
simulation_time
request_id
trace_id
correlation_id
event_timestamp
rule_version
scenario_id
scenario_version
source
schema_version
created_at
```

## 4.1 ID 의미

### research_event_id
Research Event의 전역 고유 ID.

### request_id
사용자의 하나의 Action Request를 식별.

### trace_id
하나의 실행 흐름 전체를 추적.

### correlation_id
Decision → Action → Validation → Transaction → Outcome을 하나의 연구 사건으로 연결.

중요:

`transaction_id`와 `research_event_id`를 동일시하지 않는다.

실패한 Action에는 transaction_id가 없을 수 있기 때문이다.

---

# 5. R_EXPOSURE

## 5.1 목적

참여자가 행동을 결정하는 순간 실제로 노출된 정보를 보존한다.

Exposure는 사후 복구가 어렵기 때문에 Human Season 전에 반드시 구현한다.

## 5.2 최소 필드

```text
exposure_id
season_id
participant_id
simulation_period
simulation_time

exposure_timestamp
screen_context
information_version

property_id
region

displayed_price
reference_price
available_supply
interest_rate
inflation_rate
economic_phase

gli
rent
jeonse

cash_visible
debt_visible
net_worth_visible

source
schema_version
trace_id
correlation_id
```

## 5.3 원칙

- 실제 사용자에게 노출된 값과 서버의 최신 값을 혼동하지 않는다.
- 가능한 한 UI/API 응답 시점의 값을 기록한다.
- 모든 UI 데이터를 무차별 저장하지 않는다.
- 연구 가설에 필요한 정보만 명시적으로 정의한다.
- 개인정보는 수집하지 않는다.
- Exposure는 "무엇을 볼 수 있었는가"를 기록하는 것이지 "무엇을 보았는가"를 과장해서 해석하지 않는다.

---

# 6. R_DECISION

## 6.1 목적

사용자가 행동을 선택한 연구상의 의사결정 사건을 기록한다.

현재 PLAY_DECISION_LOG는 상태 변화와 성공한 transaction 중심이므로 이를 대체하지 않는다.

## 6.2 최소 필드

```text
decision_id
season_id
participant_id
simulation_period
simulation_time

decision_type
decision_context

target_property_id
target_region

intended_action
intended_price
intended_quantity
intended_loan_amount

exposure_id

request_id
trace_id
correlation_id

created_at
schema_version
```

## 6.3 실패 Decision도 기록

예:

```text
decision_type = PROPERTY_PURCHASE
intended_action = BUY
target_property_id = P123
intended_price = 800000000
```

이후 validation에서 실패할 수 있다.

Decision과 Transaction을 동일시하지 않는다.

---

# 7. R_ACTION

## 7.1 목적

실제로 Engine에 전달된 Action Request를 기록한다.

Decision과 Action은 다를 수 있다.

예:

```text
Decision:
"아파트 A를 사고 싶다"

Action:
purchasePrimaryProperty(P123)
```

## 7.2 최소 필드

```text
action_id
decision_id

season_id
participant_id
simulation_period

action_type
endpoint_or_command
request_payload_hash

target_property_id
requested_price
requested_quantity
requested_loan_amount

request_id
trace_id
correlation_id

submitted_at
schema_version
```

## 7.3 Payload 원문 정책

민감정보가 포함될 수 있는 request payload 전체를 무조건 저장하지 않는다.

가능하면:

- 구조화된 연구 필드 저장
- payload hash 저장
- 필요한 경우 sanitized payload 저장

---

# 8. R_VALIDATION

## 8.1 목적

Action이 왜 성공/실패했는지를 연구 데이터로 보존한다.

가장 중요한 신규 영역 중 하나다.

## 8.2 최소 필드

```text
validation_id
action_id
decision_id

season_id
participant_id
simulation_period

validation_status
validation_code
validation_reason

requested_state
observed_state

cash_required
cash_available
supply_required
supply_available

failure_category

request_id
trace_id
correlation_id

validated_at
schema_version
```

## 8.3 실패 예

```text
validation_status = REJECTED
validation_code = INSUFFICIENT_CASH
failure_category = FINANCIAL_CONSTRAINT
```

또는

```text
validation_status = REJECTED
validation_code = INSUFFICIENT_SUPPLY
failure_category = MARKET_CONSTRAINT
```

## 8.4 중요 원칙

HTTP 400은 연구 데이터가 아니다.

HTTP Response를 그대로 보존하는 것이 목적이 아니라,

> "어떤 행동이 어떤 조건에서 왜 거절되었는가"

를 구조화해서 남기는 것이 목적이다.

---

# 9. Event Relationship

연구 데이터의 기본 연결 구조:

```text
R_EXPOSURE
      │
      ▼
R_DECISION
      │
      ▼
R_ACTION
      │
      ▼
R_VALIDATION
      │
 ┌────┴────┐
 ▼         ▼
SUCCESS   REJECTED
 │
 ▼
R_TRANSACTION
 │
 ▼
R_OUTCOME
 │
 ▼
R_TRAJECTORY
```

모든 사건을 연결하는 핵심 키:

`correlation_id`

---

# 10. 성공 / 실패 모두 보존

## 성공

```text
Exposure
→ Decision
→ Action
→ Validation SUCCESS
→ Transaction
→ Outcome
```

## 실패

```text
Exposure
→ Decision
→ Action
→ Validation REJECTED
```

실패 Action은 Transaction이 없어도 정상적인 Research Dataset이다.

이 데이터가 향후 다음 연구를 가능하게 한다.

- 실패를 반복하는 행동 패턴
- 유동성 부족 상태에서의 무리한 매수
- 공급 부족 상황에서의 반복 시도
- 동일 환경에서의 행동 차이
- 경제 충격 전후 행동 변화

---

# 11. Async Logging Architecture

권장 구조:

```text
                ┌──────────────────┐
                │   PLAY Engine    │
                └────────┬─────────┘
                         │
                  Research Event
                         │
                         ▼
                ┌──────────────────┐
                │ Async Queue/Event│
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Research Writer │
                └────────┬─────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        Research RAW          Failure/DLQ
```

구체적인 GCP 서비스 선택은 현재 PLAY 인프라와 충돌하지 않는지 먼저 검토한 후 결정한다.

Cloud Tasks/PubSub를 무조건 추가하지 않는다.

기존 인프라에 가장 작은 변경으로 구현 가능한 방식을 우선한다.

---

# 12. Research Logging Idempotency

Research Event도 중복 기록을 방지해야 한다.

권장 key:

```text
season_id
+
simulation_period
+
participant_id
+
event_type
+
request_id
```

단, Decision과 Validation처럼 하나의 Request에 여러 이벤트가 정상적으로 발생할 수 있는 경우 event_type과 sequence를 포함한다.

Research Logging의 idempotency는 기존 PLAY transaction idempotency와 별도 개념으로 관리한다.

기존 transaction idempotency key를 변경하지 않는다.

---

# 13. Research Data Storage

현재 구조를 우선 활용한다.

권장 1단계:

```text
PLAY RAW
   ↓
BigQuery
   ↓
Research Tables / Views
   ↓
Season Dataset
```

가능하면 운영 트랜잭션 DB에 대규모 연구 분석 쿼리를 직접 수행하지 않는다.

초기 Research Table 예:

```text
research_exposure
research_decision
research_action
research_validation
research_transaction
research_state_snapshot
research_outcome
research_trajectory
research_provenance
```

---

# 14. Human Season 필수 조건

Human Season 시작 전 다음 조건을 모두 충족해야 한다.

### Mandatory

- [ ] R_EXPOSURE 실제 저장
- [ ] R_DECISION 실제 저장
- [ ] R_ACTION 실제 저장
- [ ] R_VALIDATION 실제 저장
- [ ] 성공 Action → Transaction 연결
- [ ] 실패 Action → Validation 연결
- [ ] correlation_id 추적 가능
- [ ] request_id 추적 가능
- [ ] trace_id 추적 가능
- [ ] Research Logging 장애가 transaction을 깨뜨리지 않음
- [ ] 중복 Research Event 방지
- [ ] Research Event 실패 감지 가능
- [ ] BigQuery 적재 경로 검증
- [ ] L100 기존 데이터와의 의미 충돌 없음

### Not Mandatory Before Human Season

다음은 사후 분석 단계에서 구현 가능하다.

- R_OUTCOME 고도화
- R_TRAJECTORY Data Mart
- 1/3/5/10년 Outcome View
- 논문용 통계 View
- Season Comparison Dashboard
- 고급 Causal Analysis
- Experiment Analysis UI

---

# 15. 테스트 전략

본 단계는 기존 GATE 4/5/6을 재검증하는 단계가 아니다.

## Test 1 — Successful Action

```text
Exposure
→ Decision
→ Action
→ Validation SUCCESS
→ Transaction
```

검증:

- 모든 event 존재
- 동일 correlation_id
- transaction_id 연결
- 기존 transaction 결과와 동일
- cash/net worth 기존 결과와 동일

## Test 2 — Rejected Action

예:

`Insufficient cash`

검증:

- Exposure 존재
- Decision 존재
- Action 존재
- Validation REJECTED 존재
- transaction 없음
- economic state 변경 없음

## Test 3 — Duplicate Request

동일 request_id 반복.

검증:

- Research Event 중복 정책이 정상 작동
- Transaction idempotency에 영향 없음

## Test 4 — Research Writer Failure

Research Writer 또는 저장 단계의 일시적 실패를 통제된 방식으로 발생.

검증:

- Transaction integrity 유지
- Research Event는 retry/DLQ 대상
- silent loss 없음

## Test 5 — Traceability

하나의 성공 transaction에 대해:

```text
correlation_id
→ exposure
→ decision
→ action
→ validation
→ transaction
→ outcome
```

전체 조회 가능해야 한다.

## Test 6 — Failed Traceability

거절된 Action에 대해:

```text
correlation_id
→ exposure
→ decision
→ action
→ validation(REJECTED)
```

까지 조회 가능해야 한다.

---

# 16. 테스트 실행 규칙

PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1을 적용한다.

- 동일 테스트 최대 2회
- 1차 PASS → 종료
- 1차 FAIL → 원인 분석 + 최소 수정 → 2차
- 2차 PASS → 종료
- 2차 FAIL → 즉시 STOP
- 3차 실행 금지
- assertion 완화 금지
- 실패 skip 금지
- 테스트 결과를 PASS로 바꾸기 위한 script 수정 금지
- Verified Area 수정 필요 시 즉시 Human Review

---

# 17. Scope Lock

본 단계에서 하지 않는다.

- AI L1000
- AI L10000
- Human Season
- 전국 Property Master 확장
- 새로운 경제 규칙
- 새로운 부동산 거래 규칙
- Ranking
- Rewards
- AI 경제 의사결정 평가
- Season Analysis Engine 완성
- Commercialization
- 기존 GATE 재실행

---

# 18. 완료 산출물

AG는 구현 후 다음 문서를 생성한다.

### 1.
`PLAY-07.5_RESEARCH_LOGGING_IMPLEMENTATION_REPORT.md`

포함:

- 구현 범위
- 변경 파일
- 변경된 데이터 구조
- Async 구조
- 각 Research Entity 저장 방식
- Idempotency
- 실패 처리
- 테스트 결과
- 성능 영향
- 기존 Verified Area 영향 여부

### 2.
`PLAY-07.5_RESEARCH_LOGGING_TEST_REPORT.md`

각 테스트별:

- 목적
- 실행 조건
- 기대 결과
- 실제 결과
- Raw Evidence
- PASS/FAIL
- attempt number

### 3.
`PLAY-07.5_RESEARCH_LOGGING_DATA_DICTIONARY.md`

최종 실제 구현 필드:

- field
- type
- required
- meaning
- source
- example
- privacy classification
- retention

### 4.
`PLAY-07.5_RESEARCH_LOGGING_DECISION_RECORD.md`

최종 결정:

- APPROVED
- APPROVED WITH GAPS
- BLOCKED

Human Season 진입 가능 여부를 명확히 기록한다.

---

# 19. 완료 판정

## PASS

다음을 모두 만족:

1. R_EXPOSURE 저장 가능
2. R_DECISION 저장 가능
3. R_ACTION 저장 가능
4. R_VALIDATION 저장 가능
5. 성공/실패 모두 trace 가능
6. 기존 transaction 결과 동일
7. Research Logging 실패가 transaction을 손상시키지 않음
8. 중복 기록 방지
9. BigQuery 또는 Research Storage 적재 검증
10. Raw Evidence 확보
11. 기존 Verified Area 변경 없음

## APPROVED WITH GAPS

구조는 정상이나 Human Season 전에 해결해야 할 명확한 제한이 존재.

## BLOCKED

다음 중 하나:

- Verified Area 변경 필요
- Transaction integrity 영향
- Research Event 유실
- 실패 Action 추적 불가
- Traceability 단절
- 테스트 2회 실패
- 데이터 의미 불명확

---

# 20. 핵심 원칙

PLAY의 장기적인 가치는 단순히

> "누가 돈을 벌었는가"

를 기록하는 데 있지 않다.

핵심은:

> "같은 경제환경에서 사람들이 무엇을 보고, 무엇을 선택하고, 무엇을 시도하고, 왜 실패하고, 그 결과 어떤 경제적 경로를 만들어 갔는가"

를 장기간 축적하는 것이다.

따라서 Research Logging은 부가 기능이 아니라 Human Season의 연구 데이터 기반이다.

다만 이 계층은 기존 PLAY Engine의 경제적 무결성을 수정하는 방식으로 만들어서는 안 된다.

**PLAY Engine은 경제적 진실의 원천(Source of Truth)으로 유지하고, Research Logging은 그 경제적 사건과 인간 행동을 관찰하는 별도의 연구 관측 계층으로 둔다.**
