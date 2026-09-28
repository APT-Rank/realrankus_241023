# PLAY-07.4 NEXT PHASE EXECUTION SPEC
## Operational Readiness & Golden Scenario / Deterministic Replay

**Document Status:** EXECUTION READY  
**Previous Phase:** PLAY-07.3 / GATE 6 Residual Verification  
**Current Target:** PLAY-07.4  
**Purpose:** Move from “core engine and failure controls are verified” to “the system can be operated, audited, reproduced, and diagnosed in a controlled production-like environment.”

---

# 1. 현재 개발 위치

PLAY 개발은 현재 다음 위치에 있다.

```text
[01] Existing RealRankers 분석
      ↓
[02] PLAY Architecture
      ↓
[03] Economic Engine 설계
      ↓
[04] Property Market 설계/구현
      ↓
[05] Reliability / Fault Tolerance
      ↓
[06] Backend Infrastructure / Security
      ↓
[07] Economic Engine + Property Market 통합
      ↓
[07.3] Player Economic Worker / Clock / Reconciliation
      ↓
[GATE 4] 30 Period Verification ───────── PASS
      ↓
[GATE 5] 360 Period Verification ──────── PASS
      ↓
[GATE 6-A~D] Final Integrated Audit ───── Previously Verified PASS
      ↓
[GATE 6-E] Failure / Regression
      ├─ Original race condition 발견
      ├─ Change Control 최소 수정
      └─ Residual Verification ─────────── PASS
      ↓
>>> CURRENT POSITION <<<
[07.4] Operational Readiness
      + Golden Scenario
      + Deterministic Replay
      + Full Audit Trail
      + State Snapshot / Recovery Drill
      + Bug Investigation Drill
      ↓
[08] Season 0 / Controlled User Test
      ↓
[09] Season 1 Pilot
      ↓
[10] Production Operation
      ↓
[11] Season Analysis / Insight Engine
      ↓
[12] Commercialization / Scale
```

즉, **지금은 핵심 경제 계산과 거래/배치/복구 로직을 더 만드는 단계가 아니다.**

현재는 이미 검증된 PLAY-07.3 영역을 보호하면서,
**“문제가 발생했을 때 우리가 실제로 원인을 추적하고, 동일 상황을 재현하고, 상태를 복구하고, 수정 후 다시 검증할 수 있는가?”**
를 시스템 운영 관점에서 확인하는 단계다.

---

# 2. 이전 단계의 공식 상태

## 2.1 GATE 4

- 30 periods
- 150 players
- 30/30 batches
- 60/60 chunks
- 150/150 players per period
- missing/duplicate = 0
- Clock 1 → 31
- reconciliation 30/30
- double advance = 0
- checkpoint PASS

**Status: PASS**

---

## 2.2 GATE 5

- 총 360 simulation periods
- 150 players
- 44,400 player-period
- 296 periods + 64 periods resume
- 360/360 periods 완료
- reconciliation 정상
- Clock 1 → 361
- token expiration은 external test client 문제였으며 refresh 후 resume 성공

**Status: PASS**

---

## 2.3 GATE 6

### G6-A
Environment / deployment integrity

**Previously Verified: PASS**

### G6-B
End-to-end lifecycle

**Previously Verified: PASS**

### G6-C
Cross-component state integrity

**Previously Verified: PASS**

### G6-D
Security / server authority

**Previously Verified: PASS**

※ 인증된 비인가 요청에서 404 blind error가 발생한 것은 보안상 안전한 패턴으로 인정했으나, 향후 RBAC 응답 정책 표준화 대상이다.

### G6-E
Failure / concurrency / recovery

최초 검증에서는 `dispatchBatchChunks` race condition이 발견되었다.

문제:
`ALREADY_EXISTS` 처리 과정에서 이미 `COMPLETED`된 chunk가 다시 `DISPATCHED`로 덮어써져 aggregator가 정지할 수 있었다.

이후 Change Control을 통해 최소 수정했고,
새로운 controlled season에서 동일한 5-way concurrent dispatch 조건을 재현했다.

결과:

- P2 duplicate dispatch: PASS
- P2 정상 진행: PASS
- P3 subsequent processing: PASS
- R5 reconciliation fault injection: PASS
- transaction pause: PASS
- Season Clock advance 차단: PASS
- Attempt 1에서 PASS
- code modification 없음

**GATE 6 Residual: PASS**

따라서 현재 GATE 6-E는 **검증 완료 상태**로 간주한다.

---

# 3. 중요한 현재 원칙

이 시점부터 다음 원칙을 적용한다.

## 3.1 검증 완료 영역을 다시 흔들지 않는다

다음 영역은 기본적으로 Freeze한다.

- Economic Engine
- Property Market Engine
- Primary / Secondary transaction
- Player Economic Worker
- Batch / Chunk processing
- Season Clock
- Reconciliation
- Idempotency
- Server Authority
- Security Rules
- GATE 4 / GATE 5 verified logic

새 단계의 테스트 때문에 위 영역을 구조적으로 변경하지 않는다.

---

## 3.2 PASS는 “버그가 없다”는 뜻이 아니다

이번 단계에서 PASS의 의미는 다음과 같다.

> 정의된 시나리오와 범위 안에서 기대된 상태 변화가 발생했고,
> 실패 시 시스템이 정의된 안전 상태로 전환되며,
> 필요한 경우 동일한 상황을 재현할 수 있다.

절대로 다음 표현을 사용하지 않는다.

- bug-free
- flawless
- bulletproof
- 완벽
- 모든 버그가 제거됨

---

# 4. PLAY-07.4의 목적

이번 단계의 핵심 질문은 하나다.

> **“운영 중 문제가 발생했을 때, 우리는 그 문제를 재현하고 원인을 추적하고 상태를 복구할 수 있는가?”**

이를 위해 다음 6개 capability를 확인한다.

1. Golden Scenario
2. Deterministic Replay
3. Full Economic Audit Trail
4. State Snapshot
5. Incident / Bug Reproduction
6. Recovery / Resume Drill

---

# 5. Scope

## 포함

### 5.1 Golden Scenario
고정된 초기 상태에서 정해진 행동 sequence를 실행한다.

예:

```text
Initial
→ Income
→ Expense
→ Property BUY
→ Hold
→ Property Price Change
→ Property SELL
→ Loan / Cash state
→ Economic period advance
→ Reconciliation
→ Final State
```

같은 입력이면 같은 결과가 나와야 한다.

---

### 5.2 Deterministic Replay

동일한:

- season_id
- player_id
- initial state
- simulation period
- economic parameters
- property snapshot
- action sequence
- rule version

을 사용해 재실행했을 때 동일한 핵심 결과가 나오는지 확인한다.

Replay는 원본 데이터를 변경해서는 안 된다.

Replay 결과는 별도 namespace 또는 test season에 기록한다.

---

### 5.3 Full Economic Audit Trail

특정 player의 경제 상태가 변경되었을 때 다음 질문에 답할 수 있어야 한다.

> “왜 cash가 이 숫자로 변했는가?”

최소한 다음 연결이 추적되어야 한다.

```text
player
→ simulation_period
→ batch
→ chunk
→ action / event
→ state mutation
→ decision log
→ resulting state
```

---

### 5.4 State Snapshot

최소 다음 시점의 snapshot을 확보한다.

- Season Start
- Period 1
- Golden Scenario 종료
- Failure Injection 직전
- Failure Injection 직후
- Recovery 완료

Snapshot은 이후 bug reproduction의 기준점으로 사용한다.

---

### 5.5 Incident / Bug Reproduction Drill

의도적으로 작은 오류 상황을 만든다.

예:

```text
Known State
    ↓
Controlled Fault
    ↓
Detection
    ↓
Transaction Pause / Safe State
    ↓
Snapshot
    ↓
Root Cause Identification
    ↓
Replay
    ↓
Recovery
```

실제 운영 데이터는 훼손하지 않는다.

---

### 5.6 Recovery / Resume Drill

다음 상태에서 시스템이 재개 가능한지 확인한다.

- transaction paused
- incomplete batch
- failed chunk
- reconciliation failure
- worker retry
- controlled interruption

단, 이미 GATE 6에서 검증한 failure logic을 다시 대규모로 반복하지 않는다.

---

# 6. 반드시 만들어야 할 증적

AG는 최소 다음 파일을 생성한다.

```text
PLAY-07.4_GOLDEN_SCENARIO_SPEC.md
PLAY-07.4_GOLDEN_SCENARIO_EXECUTION_REPORT.md

PLAY-07.4_DETERMINISTIC_REPLAY_SPEC.md
PLAY-07.4_DETERMINISTIC_REPLAY_REPORT.md

PLAY-07.4_AUDIT_TRAIL_VERIFICATION.md

PLAY-07.4_STATE_SNAPSHOT_RECOVERY_REPORT.md

PLAY-07.4_INCIDENT_REPRODUCTION_REPORT.md

PLAY-07.4_FINAL_OPERATIONAL_READINESS_REPORT.md
```

각 보고서에는 가능한 경우 반드시 다음을 포함한다.

- test ID
- timestamp
- environment
- season_id
- player_id
- input state
- expected state
- actual state
- raw log
- decision log count
- state diff
- PASS / FAIL
- attempt count

---

# 7. Test Control Protocol

`PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1.md`를 그대로 적용한다.

## 동일 테스트

최대 2회.

### Attempt 1 PASS

→ Raw Evidence 저장  
→ PASS 확정  
→ 종료

### Attempt 1 FAIL

→ 원인 진단  
→ 최소 수정 1회  
→ Attempt 2

### Attempt 2 PASS

→ Raw Evidence 저장  
→ PASS 확정  
→ 종료

### Attempt 2 FAIL

→ 즉시 STOP  
→ 추가 수정 금지  
→ Human Review

### 절대 금지

- Attempt 3
- 테스트 반복으로 PASS를 찾는 행위
- assertion 완화
- expected value 변경으로 PASS 만들기
- failure skip
- mock으로 실제 infrastructure 결과 대체
- 기존 검증 영역의 구조 변경
- GATE 4/5 재실행
- 전체 GATE 6 재실행

---

# 8. 실행 순서

## STEP 1 — Freeze & Baseline

먼저 현재 배포 상태를 읽고 기록한다.

확인 대상:

- deployed function version
- Firestore structure
- Cloud Tasks queues
- Security Rules
- current Season state
- current code revision
- previous verified reports

이 단계에서는 코드를 수정하지 않는다.

---

## STEP 2 — Golden Scenario

3~5명의 controlled player로 시작한다.

동일한 초기 상태에서 사전에 정의한 action sequence를 실행한다.

목표:

```text
Expected Final State
        =
Actual Final State
```

검증 대상:

- cash
- locked_cash
- debt
- property ownership
- property count
- net worth
- decision logs
- transaction logs

---

## STEP 3 — Deterministic Replay

STEP 2의 Golden Scenario를 동일 조건으로 replay한다.

비교:

```text
Original Result
        VS
Replay Result
```

핵심 state가 동일해야 한다.

차이가 있다면 즉시 STOP한다.

---

## STEP 4 — Audit Trail Drill

임의의 player 한 명을 선택한다.

예:

```text
Player P001
Period 17
Cash = X
```

에서 시작해,

> “왜 X가 되었는가?”

를 역추적한다.

최소한:

```text
P001
→ P17
→ Batch
→ Chunk
→ Income/Expense/Transaction
→ Decision Log
→ Cash Mutation
```

까지 연결되어야 한다.

---

## STEP 5 — State Snapshot Drill

다음 상태를 저장한다.

```text
S0 = Season Start
S1 = Golden Scenario Start
S2 = Failure Injection Before
S3 = Failure Injection After
S4 = Recovery Complete
```

각 snapshot 간 state diff를 기록한다.

---

## STEP 6 — Incident Reproduction

통제된 fault 하나를 선택한다.

예:

```text
Cash invariant mismatch
```

실행:

```text
Snapshot
→ Fault
→ Reconciliation
→ Detection
→ Pause
→ Evidence
→ Replay
```

목표는 “오류가 발생하지 않는 것”이 아니다.

목표는:

> 오류가 발생했을 때 시스템이 오류를 숨기지 않고,
> 안전 상태로 전환하며,
> 나중에 동일한 상황을 다시 재현할 수 있는 것.

---

## STEP 7 — Recovery / Resume

fault 상태에서 정상 상태로 복구한다.

검증:

- corrupted state가 정상적으로 차단되었는가
- transaction pause가 유지되었는가
- recovery 이후 정상 처리가 가능한가
- Decision Log가 중복되지 않는가
- Season Clock이 중복 advance되지 않는가

---

# 9. PASS 기준

PLAY-07.4는 다음 조건을 모두 만족할 때 PASS한다.

### A. Golden Scenario

- expected = actual
- financial invariants 유지
- decision log count 일치

### B. Deterministic Replay

- 동일 입력 → 동일 핵심 결과
- 원본 state 변경 없음

### C. Audit Trail

- state mutation의 원인을 추적 가능
- batch/chunk/player/period correlation 가능

### D. Snapshot

- 기준 시점 state 저장 가능
- state diff 생성 가능

### E. Incident Reproduction

- controlled fault 재현 가능
- detection 확인
- safe state 확인
- raw evidence 확보

### F. Recovery

- recovery 후 정상 흐름 재개 가능
- duplicate economic effect 없음

---

# 10. FAIL / BLOCKED 기준

다음 중 하나라도 발생하면 해당 테스트를 FAIL 또는 BLOCKED 처리한다.

- 동일 입력인데 결과가 달라짐
- 원인을 추적할 수 없음
- state mutation의 source가 끊김
- snapshot 복구 불가
- failure가 감지되지 않음
- transaction pause가 작동하지 않음
- recovery 과정에서 duplicate effect 발생
- Decision Log와 실제 state가 불일치
- Clock이 예상보다 많이 증가
- 기존 verified area를 수정해야만 테스트가 가능함

---

# 11. 이번 단계에서 하지 않는 것

PLAY-07.4에서는 다음을 하지 않는다.

- nationwide property expansion
- tax system
- full LTV/DSR implementation
- GLI price engine
- AI prediction
- ranking system
- reward system
- large-scale UI
- monetization
- production user acquisition
- nationwide load test

이것들은 이후 단계다.

---

# 12. 다음 단계 연결

PLAY-07.4 PASS 이후:

```text
PLAY-07.4
Operational Readiness
        ↓
PLAY-08
Season 0 Controlled Test
        ↓
PLAY-09
Season 1 Pilot
        ↓
PLAY-10
Production Operation
        ↓
PLAY-11
Season Analysis / Insight Engine
        ↓
PLAY-12
Commercialization
```

---

# 13. AG에게 요구하는 최종 보고

최종 보고서는 반드시 다음 형식으로 작성한다.

```text
PLAY-07.4 FINAL OPERATIONAL READINESS REPORT

1. Environment Baseline
2. Golden Scenario
3. Deterministic Replay
4. Audit Trail
5. State Snapshot
6. Incident Reproduction
7. Recovery / Resume
8. Attempt History
9. Raw Evidence
10. Issues
11. Evidence Classification
12. Final Decision
```

Evidence Classification은 반드시 다음 중 하나를 사용한다.

- VERIFIED
- PREVIOUSLY VERIFIED
- NOT VERIFIED
- BLOCKED
- FUTURE SCOPE

추정해서 VERIFIED로 바꾸지 않는다.

---

# 14. 최종 원칙

PLAY는 이제 “더 많은 기능을 만드는 것”보다

> **실패했을 때 통제할 수 있는 시스템**

이 되는 것이 더 중요하다.

따라서 PLAY-07.4의 성공 기준은 기능 수가 아니다.

```text
Can we reproduce it?
Can we trace it?
Can we explain it?
Can we snapshot it?
Can we recover it?
Can we prove the fix?
```

이 질문에 실제 evidence로 답할 수 있으면 PLAY는 다음 단계인 **Season 0**으로 이동한다.

