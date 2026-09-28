# PLAY_05_BACKEND_INFRASTRUCTURE_RELIABILITY_SPEC

## 1. 문서 목적

본 문서는 PLAY의 Backend Infrastructure를 설계할 때 단순한 기능 구현을 넘어 **장애가 발생하더라도 경제 세계의 정합성과 데이터가 훼손되지 않도록 하는 Reliability / Disaster Recovery 기준**을 정의한다.

PLAY에서 인프라의 목표는 "장애가 전혀 발생하지 않는 시스템"이 아니다.

목표는 다음과 같다.

> **일부 인프라 장애가 발생하더라도 PLAY의 경제 상태, 거래 정합성, Season 진행 상태 및 History가 손상되지 않는다.**

특히 PLAY는 경제 행동 실험 플랫폼이므로 서버 장애가 단순한 서비스 장애에 그치지 않고 실험 데이터의 왜곡으로 이어질 수 있다.

따라서 Reliability는 부가 기능이 아니라 PLAY의 핵심 설계 요소다.

---

# 2. Reliability 핵심 원칙

## 2.1 Server Authority

핵심 경제 상태는 Server만 변경한다.

```text
Client
  ↓
Intent
  ↓
Cloud Functions / Backend
  ↓
Validation
  ↓
Atomic State Change
  ↓
Firestore
```

Client가 다음 상태를 직접 변경할 수 없어야 한다.

```text
cash
debt
property ownership
locked asset
order status
transaction
economic state
season clock
contract status
```

---

# 3. Failure를 전제로 한 설계

다음 구성요소는 언제든 일시적인 실패가 발생할 수 있다고 가정한다.

```text
Client
Cloud Functions
Firestore
Cloud Tasks
Pub/Sub
Scheduler
BigQuery
External Data Pipeline
Network
```

각 장애가 발생해도 경제 상태가 비정상적으로 변경되지 않아야 한다.

---

# 4. 장애의 3단계

PLAY는 장애 상태를 다음과 같이 구분한다.

## NORMAL

정상적인 경제 활동.

```text
BUY
SELL
MATCHING
BATCH
CONTRACT
SEASON CLOCK
```

모두 정상 작동한다.

## DEGRADED

일부 비핵심 기능에 문제가 있으나 경제 상태는 안전하게 유지된다.

예:

```text
BigQuery Export 장애
History 적재 지연
Analytics 장애
```

이 경우:

```text
Economic Engine
Transaction
Asset State
```

는 계속 동작할 수 있다.

## TRANSACTION PAUSED

경제 정합성이 위험하다고 판단되면 거래를 일시 중지한다.

예:

```text
BUY  → BLOCK
SELL → BLOCK
MATCHING → BLOCK
SETTLEMENT → BLOCK
```

반면 가능한 범위에서:

```text
Read
Season Status
Existing History
Player State
```

는 유지한다.

중요:

**Emergency Stop은 데이터 삭제나 시스템 종료가 아니라 안전한 상태 동결이다.**

---

# 5. 핵심 Reliability Priority

PLAY의 우선순위는 다음과 같다.

```text
1. Economic State Integrity
2. Transaction Integrity
3. Data Durability
4. Season Consistency
5. Recovery Capability
6. Service Availability
7. UI Convenience
```

즉 UI 편의보다 경제 상태 정합성이 우선이다.

---

# 6. 핵심 상태의 Atomicity

다음 상태 변경은 가능한 경우 하나의 Firestore Transaction으로 처리한다.

```text
BUY Lock
SELL Lock
Order Cancel
Transaction Settlement
Primary Purchase
Loan Update
Cash Settlement
Ownership Transfer
Contract State Change
```

특히 `PLAY_PLAYER_ASSET`을 기준으로 모든 Cash mutation의 정합성을 보호한다.

---

# 7. Asset Invariants

다음 불변조건을 항상 유지한다.

```text
cash.total
=
cash.available + cash.locked
```

```text
property.total
=
property.available + property.locked
```

그리고:

```text
cash.available >= 0
cash.locked >= 0
property.available >= 0
property.locked >= 0
```

또한:

```text
Property ownership is unique
```

```text
Filled Order cannot be filled again
```

```text
Cancelled Order cannot be filled
```

```text
Transaction cannot be duplicated
```

---

# 8. Idempotency

모든 외부 요청은 재전송될 수 있다고 가정한다.

대상:

```text
placeOrder
cancelOrder
primaryPurchase
rentPayment
loanPayment
batchSettlement
contractSettlement
```

모든 요청은 `idempotency_key`를 사용한다.

동일 요청이 재전송되면:

```text
Duplicate Order X
Duplicate Transaction X
Duplicate Cash Deduction X
Duplicate Ownership Transfer X
```

가 발생하면 안 된다.

---

# 9. Retry Safety

Worker는 실패할 수 있다.

예:

```text
Worker Start
   ↓
State Update
   ↓
Network Error
   ↓
Worker Retry
```

재시도 시 이미 처리된 작업을 다시 처리하지 않아야 한다.

따라서 Worker는:

```text
idempotent
retry-safe
```

해야 한다.

---

# 10. Cloud Tasks / Pub/Sub Reliability

대량 작업은 단일 Function에서 처리하지 않는다.

구조:

```text
Controller
   ↓
Task / Message
   ↓
Worker
   ↓
State Transaction
```

대상:

```text
Season Initialization
Economic Batch
Rent Scheduler
Jeonse Scheduler
Contract Settlement
History Export
```

---

# 11. Retry 정책

Worker 실패 시 자동 재시도를 사용한다.

개념:

```text
Attempt 1
↓
Failure
↓
Retry
↓
Failure
↓
Retry
↓
...
↓
Max Retry
↓
Dead Letter Queue
```

Retry 횟수와 Backoff는 Configuration으로 관리한다.

단, 재시도 전에 Idempotency를 반드시 검증한다.

---

# 12. Dead Letter Queue

반복적으로 실패하는 작업은 무한 재시도하지 않는다.

```text
Worker Failure
↓
Retry
↓
Retry
↓
Retry
↓
DLQ
```

DLQ에 들어간 작업은:

```text
Alert
↓
Diagnosis
↓
Manual / Automated Recovery
```

절차를 거친다.

DLQ를 조용히 삭제하지 않는다.

---

# 13. Season Initialization Reliability

전국 Property 초기화는 Fan-out 방식으로 처리한다.

```text
Season Start
↓
Initialization Controller
↓
Property Chunk
↓
Cloud Tasks / Pub/Sub
↓
Worker
↓
PLAY_PRIMARY_SUPPLY
```

각 Worker는:

```text
season_id
property_id
configuration_version
idempotency_key
```

를 사용한다.

동일 Property가 중복 초기화되어도 결과가 하나만 존재하도록 한다.

---

# 14. Primary Supply Reliability

Primary Supply는 단지별 Counter 구조다.

```text
PLAY_PRIMARY_SUPPLY
```

핵심:

```text
available_quantity
total_quantity
```

Invariant:

```text
0 <= available_quantity <= total_quantity
```

Primary Purchase는 Transaction으로 처리한다.

Supply가 1개 남은 상태에서 여러 명이 동시에 요청해도:

```text
Successful Purchase = 1
```

이어야 한다.

---

# 15. Order Matching Reliability

Secondary Market Matching은 우선 Firestore Transaction 기반으로 구현한다.

Matching 조건:

```text
Price Priority
+
Time Priority
```

Transaction 전에:

```text
BUY Order OPEN
SELL Order OPEN
Buyer Locked Cash valid
Seller Locked Property valid
```

를 재검증한다.

---

# 16. Order Contention

인기 Property에 주문이 집중될 수 있다.

MVP에서는 Firestore Transaction으로 시작한다.

동시성 문제가 실제 부하 테스트에서 확인될 경우:

```text
Order Event
↓
Property-specific Queue
↓
Single Matching Worker
```

방식으로 확장할 수 있도록 Matching Layer를 분리한다.

중요:

MVP에서 필요 이상의 Event Sourcing을 미리 도입하지 않는다.

---

# 17. Economic Batch Reliability

Economic Batch는 대량 Player를 Chunk 단위로 처리한다.

```text
Batch Controller
↓
Player Chunk
↓
Worker
↓
PLAY_PLAYER_ASSET
PLAY_PLAYER_STATE
```

각 Worker는 독립적으로 Retry 가능해야 한다.

한 Player의 실패가 전체 Batch를 중단시키지 않아야 한다.

---

# 18. Batch Checkpoint

Batch는 진행 상태를 기록한다.

예:

```yaml
batch_id
season_id
simulation_time
batch_type
total_players
processed_players
failed_players
status
started_at
completed_at
```

상태:

```text
PENDING
RUNNING
PARTIAL
COMPLETED
FAILED
PAUSED
```

이를 통해 Batch가 중간에 중단되어도 재개할 수 있어야 한다.

---

# 19. Economic Batch와 User Action

다음 작업이 동시에 실행될 수 있다.

```text
User BUY
User SELL
Tax
Living Cost
Interest
Rent
Loan Repayment
```

모든 Cash Mutation은 동일한 Asset 정합성 모델을 사용한다.

특히 `PLAY_PLAYER_ASSET`을 기준으로 Transaction 충돌을 감지하고 재시도한다.

---

# 20. Season Clock Reliability

Season Clock은 PLAY의 핵심 상태다.

다음 값이 필요하다.

```text
season_id
simulation_time
real_time
status
last_processed_time
rule_version
scenario_version
```

Season Clock을 Client 시간에 의존하지 않는다.

Client Clock은 신뢰하지 않는다.

---

# 21. Season Clock Recovery

Scheduler가 실패해도 Season 시간이 임의로 중복 진행되지 않아야 한다.

예:

```text
Batch for simulation_time = T
```

가 이미 완료되었다면 동일한 T를 다시 처리하지 않는다.

각 Batch에는:

```text
season_id
simulation_time
batch_type
```

기준의 Idempotency Key를 사용한다.

---

# 22. Economic Consistency

PLAY에서는 다음 상황을 허용하지 않는다.

```text
Player A
Year 5 Economic Batch processed

Player B
Year 4 Economic Batch processed
```

즉 동일 Season의 Player별 경제시간이 임의로 무한히 벌어지는 것을 방지해야 한다.

Batch Controller는 Season의 Simulation Time과 Player 처리 상태를 관리한다.

단, 실제 병렬 처리에서는 Player Chunk가 동시에 실행될 수 있으므로 최종 Batch Barrier / Completion 상태를 관리한다.

---

# 23. Transaction Recovery

Transaction 생성 과정에서 중간 실패가 발생해도:

```text
Cash
Property
Ownership
Order
Transaction
```

의 일부만 성공한 상태로 남지 않아야 한다.

Firestore Transaction이 보장하는 범위 밖의 작업은 별도의 상태 머신과 보상/재처리 구조를 사용한다.

---

# 24. External System Failure

BigQuery 또는 Analytics Pipeline이 장애를 일으켜도 PLAY 경제 엔진이 중단되어서는 안 된다.

```text
PLAY Economic State
        │
        ├── Firestore
        │       ↓
        │   Source of Truth
        │
        └── BigQuery
                ↓
             Analytics
```

BigQuery는 경제 상태의 Source of Truth가 아니다.

---

# 25. Source of Truth

각 데이터의 최종 권위를 명확하게 정의한다.

```text
Player Asset
→ PLAY_PLAYER_ASSET

Ownership
→ PLAY_PROPERTY_OWNERSHIP

Order
→ PLAY_ORDER

Transaction
→ PLAY_TRANSACTION

Loan
→ PLAY_LOAN

Contract
→ PLAY_*_CONTRACT

Season
→ PLAY_SEASON

Economic State
→ PLAY_ECONOMIC_STATE
```

BigQuery는 분석용 복제 데이터다.

---

# 26. Data Durability

핵심 데이터는 Firestore에 저장하고 History는 장기적으로 BigQuery에 적재한다.

다음 History는 손실되지 않아야 한다.

```text
Transaction
Order
Decision
Player State
Economic State
Property State
Loan
Contract
Season Result
```

---

# 27. Backup / Recovery

인프라 설계 단계에서 다음을 정의한다.

```text
Backup
Retention
Restore
Recovery Point
Recovery Procedure
```

특히 핵심 Firestore 데이터가 손상되었을 경우 복구 절차가 존재해야 한다.

실제 Backup Retention 값은 운영 환경 및 비용 검토 후 Configuration으로 결정한다.

---

# 28. Point-in-Time Recovery

가능한 경우 데이터베이스의 과거 시점 복구를 활용할 수 있도록 설계한다.

목표:

```text
Data Corruption
↓
Identify Last Good State
↓
Restore / Recover
↓
Reconciliation
```

단순히 백업 파일 하나를 보관하는 것만으로 끝내지 않는다.

---

# 29. Reconciliation Engine

PLAY에는 경제 상태와 거래 History의 정합성을 검사하는 별도 검증 작업이 필요하다.

검사 예:

```text
Asset
↔ Ownership

Order
↔ Transaction

Transaction
↔ Cash

Transaction
↔ Property

Loan
↔ Debt

Contract
↔ Housing Status
```

예를 들어:

```text
Property Ownership exists
BUT
Acquisition Transaction does not exist
```

와 같은 상태를 탐지한다.

---

# 30. Reconciliation 실행

최소:

```text
Season Start
Daily
Major Deployment
Season End
```

시점에 수행할 수 있도록 설계한다.

치명적 불일치가 발견되면:

```text
Alert
↓
Transaction Pause
↓
Diagnosis
↓
Recovery
```

절차를 사용할 수 있다.

---

# 31. Emergency Stop

Emergency Stop은 최후의 보호장치다.

상태:

```text
NORMAL
DEGRADED
TRANSACTION_PAUSED
```

TRANSACTION_PAUSED에서는:

```text
BUY = BLOCK
SELL = BLOCK
MATCHING = BLOCK
SETTLEMENT = BLOCK
```

을 기본으로 한다.

가능한 범위에서:

```text
READ
PLAYER STATE
SEASON STATUS
HISTORY
```

는 유지한다.

---

# 32. Emergency Stop 조건

예시:

```text
Critical Data Corruption
Duplicate Transaction Detected
Asset Invariant Violation
Ownership Inconsistency
Season Clock Corruption
Uncontrolled Batch Retry
Security Breach
```

조건은 운영 단계에서 구체화한다.

---

# 33. Recovery Procedure

Emergency Stop 이후:

```text
1. Stop new transactions
2. Preserve current state
3. Identify failed component
4. Identify affected Players
5. Reconcile state
6. Recover failed jobs
7. Verify invariants
8. Resume transaction
```

복구 전에 경제 상태를 임의 수정하지 않는다.

---

# 34. Monitoring

최소 Monitoring 대상:

```text
Cloud Function Error Rate
Function Latency
Firestore Transaction Failure
Firestore Read/Write Errors
Cloud Tasks Retry Count
Pub/Sub Retry Count
DLQ Count
Batch Failure
Order Matching Failure
Transaction Failure
Invariant Violation
Season Clock Lag
```

---

# 35. Alerting

다음 상황은 즉시 Alert 대상이 될 수 있다.

```text
Repeated Transaction Failure
DLQ > 0
Asset Invariant Violation
Duplicate Transaction
Ownership Inconsistency
Season Clock Lag
Batch Failure
Security Rule Violation
```

Alert는 단순 로그와 구분한다.

---

# 36. Observability Event

중요 Event에는 다음 정보를 포함한다.

```text
event_id
event_type
season_id
player_id
property_id
request_id
idempotency_key
timestamp
rule_version
scenario_version
```

이를 통해 장애 상황을 재구성할 수 있어야 한다.

---

# 37. Audit Trail

핵심 상태 변경은 추적 가능해야 한다.

예:

```text
Cash 700M
↓
BUY Lock
↓
Transaction
↓
Cash Settlement
```

누가, 언제, 어떤 요청으로 상태를 변경했는지 추적할 수 있어야 한다.

---

# 38. Graceful Degradation

다음 기능은 핵심 경제 엔진과 분리한다.

```text
Analytics
BigQuery Export
Advanced Forecast
Recommendation
Report Generation
```

이 기능이 장애가 나더라도:

```text
Player Asset
Transaction
Season
Economic State
```

는 계속 유지될 수 있어야 한다.

---

# 39. Infrastructure Isolation

PLAY는 기존 RealRankers와 논리적으로 분리한다.

```text
Existing RealRankers
        │
        └── Shared Read-only Data
                    ↓
                  PLAY
                    │
              PLAY Backend
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
      Firestore          Task / Queue
          │                   │
          └─────────┬─────────┘
                    ↓
                Workers
```

기존 서비스 장애가 PLAY 경제 엔진 전체에 직접 전파되지 않도록 경계를 둔다.

---

# 40. Deployment Strategy

배포 시 경제 시스템에 직접 영향을 주지 않도록 단계적으로 배포한다.

권장 개념:

```text
Development
↓
Test
↓
Staging
↓
Limited Production
↓
Full Production
```

특히 Transaction / Batch 관련 변경은 Production 전체에 한 번에 적용하지 않는다.

---

# 41. Rule Versioning

경제 계산에 사용된 규칙을 추적할 수 있어야 한다.

```text
rule_version
scenario_version
configuration_version
```

Transaction / Batch / Decision Log에 필요한 경우 기록한다.

---

# 42. Rollback Principle

코드 Rollback과 경제 데이터 Rollback은 다르게 취급한다.

```text
Code Rollback
→ 이전 코드 버전 배포

Economic Data
→ 임의 Rollback 금지
```

이미 발생한 거래를 코드 버전 변경만으로 되돌리지 않는다.

데이터 복구가 필요한 경우 Reconciliation / Recovery 절차를 따른다.

---

# 43. Load / Failure Testing

Production 전에 다음 테스트를 수행한다.

## Concurrent Purchase

```text
1 Supply
5 / 50 / 100 concurrent BUY
```

Expected:

```text
1 successful
remaining requests rejected or safely retried
```

## Concurrent Orders

동일 Property에 대량 주문.

## Batch Collision

```text
Tax
+
BUY
+
Interest
+
Rent
```

동시 실행.

## Worker Failure

```text
Worker
↓
Failure
↓
Retry
```

중복 처리 여부 확인.

## Network Retry

동일 Request를 여러 번 전송.

## DLQ

의도적으로 Worker를 실패시키고 DLQ 및 Recovery 확인.

---

# 44. Disaster Recovery Test

실제 장애 상황을 가정한다.

예:

```text
Cloud Function Failure
Firestore Transaction Failure
Task Queue Failure
Worker Failure
BigQuery Failure
Scheduler Failure
```

각 상황에서:

```text
Detection
Isolation
Recovery
Reconciliation
Resume
```

가 가능한지 테스트한다.

---

# 45. Definition of Infrastructure Reliability

PLAY Infrastructure는 다음 조건을 만족해야 한다.

- 핵심 경제 상태의 Source of Truth가 명확하다.
- Client가 핵심 상태를 직접 변경할 수 없다.
- Asset Invariant가 유지된다.
- Transaction 중복이 방지된다.
- Worker Retry가 안전하다.
- DLQ가 존재한다.
- Batch가 중간 실패 후 재개 가능하다.
- Season Clock이 중복 진행되지 않는다.
- BigQuery 장애가 경제 엔진 장애로 전파되지 않는다.
- 핵심 상태를 Reconciliation할 수 있다.
- Emergency Stop이 가능하다.
- Emergency Stop 후 복구 절차가 존재한다.
- Monitoring과 Alerting이 존재한다.
- Backup / Recovery 전략이 존재한다.
- Disaster Recovery Test가 가능하다.

---

# 46. Infrastructure Non-Goals

이번 단계에서 다음을 과도하게 구현하지 않는다.

```text
Multi-region Active-Active
복잡한 Kubernetes Cluster
대규모 Microservice 분해
과도한 Event Sourcing
AI 기반 운영 자동화
```

MVP 단계에서는 Firebase / Google Cloud 기반으로 단순하고 관리 가능한 구조를 우선한다.

단, 향후 규모가 커질 경우 확장할 수 있도록 경계를 명확히 한다.

---

# 47. Implementation Phase

PLAY_05 이후 실제 구현 순서는 다음과 같다.

```text
PLAY_05 Reliability Review
        ↓
Infrastructure Setup
        ↓
Security Rules
        ↓
PLAY Collections
        ↓
Cloud Functions
        ↓
Cloud Tasks / Pub/Sub
        ↓
Initialization Worker
        ↓
Primary Supply
        ↓
Reliability Test
        ↓
Primary Market
        ↓
Secondary Market
        ↓
Economic Integration
```

Reliability 테스트를 통과하지 못하면 다음 경제 기능으로 넘어가지 않는다.

---

# 48. Antigravity Review Request

Antigravity는 본 문서를 먼저 기술 검토한다.

특히 다음을 집중적으로 검토한다.

1. Single Point of Failure
2. Data Loss 가능성
3. Duplicate Transaction
4. Race Condition
5. Worker Retry
6. DLQ
7. Season Clock Recovery
8. Batch Recovery
9. Reconciliation
10. Emergency Stop
11. Backup / Restore
12. Disaster Recovery
13. Firebase Security Rules
14. Cloud Tasks / Pub/Sub
15. Firestore Transaction Limits
16. 기존 RealRankers와의 장애 전파

---

# 49. Antigravity 출력 요구

검토 결과는 다음 형식으로 작성한다.

## 1. Reliability Verdict

다음 중 하나:

```text
READY
READY AFTER FIXES
NOT READY
```

## 2. Failure Mode Analysis

| ID | Component | Failure | Impact | Detection | Recovery | Data Loss Risk | Severity |
|---|---|---|---|---|---|---|---|

## 3. Single Point of Failure

현재 구조에서 단일 장애점이 무엇인지 구체적으로 제시한다.

## 4. Data Integrity Review

Asset / Order / Transaction / Ownership / Loan / Contract / Season Clock 정합성을 검토한다.

## 5. Recovery Review

Worker / Batch / Season Clock / Transaction / Scheduler 각각의 Recovery 가능 여부를 평가한다.

## 6. Disaster Recovery Review

Backup / Restore / Point-in-Time Recovery / Reconciliation을 검토한다.

## 7. Blocking Issues

구현 전에 반드시 해결해야 하는 문제만 제시한다.

## 8. Recommended Changes

경제 규칙을 변경하지 않는 범위에서 기술적 개선안을 제시한다.

## 9. Final Verdict

5줄 이내로 최종 판단한다.

---

# 50. 절대 변경하지 말아야 할 것

Antigravity는 본 문서를 검토하면서 다음을 임의 변경하지 않는다.

- 7억원 초기자산
- Primary / Secondary 구조
- Quantity=1
- Partial Fill 금지
- Player-to-Player Market
- Synthetic Liquidity 금지
- HOMELESS
- Negative Cash 금지
- Penalty Loan
- Server Authority
- Transaction Price / Reference Price 분리

기술적으로 충돌하는 부분이 발견되면 Product Owner Decision Required로 분리한다.

---

# 51. 최종 원칙

PLAY 인프라의 목표는 다음 문장으로 정의한다.

> **"서버가 죽지 않는 시스템"이 아니라 "일부 서버가 죽어도 경제 세계가 망가지지 않는 시스템"을 만든다.**

따라서 장애는 예외 상황이 아니라 설계의 기본 입력값으로 취급한다.

최우선 목표는:

```text
Economic State Integrity
+
Transaction Integrity
+
Data Durability
+
Recoverability
```

이다.

이 원칙을 만족하지 못하는 구현은 기능적으로 동작하더라도 PLAY Infrastructure의 완료로 간주하지 않는다.
