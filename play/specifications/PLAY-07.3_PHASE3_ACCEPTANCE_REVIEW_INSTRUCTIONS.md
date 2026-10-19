# PLAY-07.3 PHASE 3 — ACCEPTANCE REVIEW & ADDITIONAL VERIFICATION INSTRUCTIONS

## 0. 목적

본 문서는 PLAY-07.3 Phase 3 Player Worker Processing의 **추가 검증(Acceptance Review)**을 위한 지시사항이다.

기존 Phase 3 구현을 다시 만드는 것이 목적이 아니다.

목적은 다음 질문에 답하는 것이다.

> **기존 Phase 3 보고서의 "Phase 3 is fully validated"라는 결론을 실제 증거로 독립적으로 검증할 수 있는가?**

기존 보고서의 PASS 문구 자체를 증거로 인정하지 않는다.

검증 순서는 다음과 같다.

```text
기존 구현
↓
기존 테스트
↓
실제 Firebase/GCP 상태
↓
추가 반례 테스트
↓
Regression
↓
Acceptance 판단
```

이번 Review에서 버그가 발견되는 것은 실패가 아니다. 문제를 재현하고, 최소 수정하고, Regression으로 다시 검증하는 것이 성공이다.

---

# 1. Review Scope

다음 5개 영역을 집중 검증한다.

```text
A. Golden Scenario
B. Deterministic Replay
C. Regression
D. Player Resolution / Chunk Membership Stability
E. Idempotency Identity Correctness
```

추가로 기존 Crash / Retry 핵심 테스트의 실제 상태도 재확인한다.

---

# 2. A — Golden Scenario 검증

최소 3명의 고정 Player:

```text
PLAYER_A
PLAYER_B
PLAYER_C
```

최소 3개 Period:

```text
Period 0
Period 1
Period 2
```

고정:

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
initial_state
```

각 Player / Period별로 다음을 기록한다.

```text
player_id
simulation_period
initial_cash
income
expense
ending_cash
net_worth
economic_freedom_rate
last_processed_period
decision_log_count
```

Expected와 Actual을 직접 비교한다.

허용되는 rounding difference가 기존 Economic Engine에 정의되어 있다면 그 규칙을 명시한다. 임의 tolerance를 새로 만들지 않는다.

---

# 3. B — Deterministic Replay 검증

동일한 입력:

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
player_id
simulation_period
initial_state
```

을 다시 실행한다.

Production Player State에 추가 Side Effect를 발생시키지 않는다.

가능하면 isolated test state / replay context / dry-run 등 기존 구조를 사용한다.

최소 비교:

```text
income
expense
ending_cash
net_worth
economic_freedom_rate
```

반드시:

```text
Run #1
Run #2
Difference
```

형태로 Evidence를 남긴다.

동일 입력이면 동일 결과여야 한다.

---

# 4. C — Regression

## C-01 PLAY-07.2

최소:

- Primary Purchase
- Secondary BUY
- Secondary SELL
- Lock / Unlock
- Atomic Matching
- Price-Time Priority
- Concurrent Matching
- Reconciliation
- Idempotency

Test ID별 실제 결과를 기록한다.

## C-02 PLAY-07.3 Phase 1

- Batch Creation
- Batch Idempotency
- expected_player_count
- chunk_count
- 0-player boundary

## C-03 PLAY-07.3 Phase 2

- Chunk Dispatch
- Chunk Idempotency
- Duplicate Task Creation
- Boundary 0/1/99/100/101/199/200/201/1000
- Mid-Failure Recovery
- Batch RUNNING invariant

단순히 "Regression PASS"라고 쓰지 않는다.

---

# 5. D — Player Resolution / Chunk Membership Stability

현재 Worker가 다음과 유사한 방식으로 Player를 다시 조회한다면 집중 검증한다.

```text
PLAY_PLAYER
WHERE status == ACTIVE
ORDER BY __name__
OFFSET chunk_index * CHUNK_SIZE
LIMIT player_count
```

## D-01 Player Set Mutation

초기 Player Set을 만든 뒤 Worker 실행 과정 중 Player의 ACTIVE 상태가 변하는 상황을 의도적으로 발생시킨다.

예:

```text
Player 0 → ACTIVE → INACTIVE
```

재실행 시:

```text
duplicate player
missing player
changed chunk membership
```

이 발생하는지 확인한다.

## D-02 Multi-Chunk Stability

최소 201 Player를 사용한다.

기대:

```text
Chunk 0 = 100
Chunk 1 = 100
Chunk 2 = 1
```

Worker 실행 도중 Player Set 변화 및 재실행을 발생시킨다.

최종:

```text
각 Player 처리 횟수 = 정확히 1회
Player duplication = 0
Player omission = 0
Unexpected membership change = 0
```

이어야 한다.

문제가 발생하면 임의 수정하지 말고:

1. 재현
2. 원인
3. 영향
4. 해결안
5. Regression 계획

을 먼저 기록한다.

---

# 6. E — Idempotency Identity Correctness

현재 구현이:

```text
last_processed_period >= simulation_period
```

조건만으로 NO-OP을 판단한다면 이것이 canonical identity와 논리적으로 동일한지 검증한다.

Canonical identity:

```text
season_id
simulation_period
batch_type
player_id
```

## E-01 Batch Type Isolation

가능하면 동일 Player / 동일 Period에 서로 다른 Batch Type을 사용한다.

```text
BATCH_TYPE_A
BATCH_TYPE_B
```

현재 설계상 서로 독립된 처리가 가능하다면 A 처리 후 B가 A 때문에 잘못 NO-OP되지 않아야 한다.

단일 Batch Type이 시스템 설계상 영구 고정이라 테스트가 의미 없다면 그 사실을 명시한다.

## E-02 Season Isolation

동일 Player ID가 다른 Season에서 사용될 수 있다면:

```text
Season A / Period 1
Season B / Period 1
```

이 서로 영향을 주지 않는지 확인한다.

## E-03 Previous Period

현재 Period가 10일 때 Period 9 replay가 경제적 Side Effect를 발생시키지 않는지 확인한다.

---

# 7. F — Critical Crash / Retry Revalidation

## F-01 Concurrent Duplicate

동일 Player 또는 동일 Chunk에 10 concurrent requests.

기대:

```text
Economic Commit = 1
Decision Log = 1 per Player
```

## F-02 Crash Before Commit

Commit 전 Crash.

기대:

```text
Economic Effect = 0
```

Retry 후:

```text
Economic Effect = 1
```

## F-03 Crash After Commit

Commit 직후 Crash.

Retry 후:

```text
Additional Economic Effect = 0
```

## F-04 Mid-Chunk Crash

```text
Player A → success
Player B → success
Player C → crash
```

Retry:

```text
A → NO-OP
B → NO-OP
C → success
```

---

# 8. G — Decision Log / Audit Trail

하나의 실제 Economic Effect를 선택하여 다음 정보까지 역추적할 수 있는지 검증한다.

```text
season_id
simulation_period
batch_id
chunk_id
player_id
request_id
idempotency_key
scenario_id
scenario_version
rule_version
timestamp
```

질문:

> "이 Player의 Cash가 왜 이 값으로 변경되었는가?"

에 실제 DB와 로그를 이용해 답할 수 있어야 한다.

---

# 9. H — Evidence Quality

다음은 증거로 인정한다.

```text
Firestore document before/after
Firestore transaction result
Cloud Function execution log
Cloud Task metadata
Decision Log
Idempotency record
Test script output
```

다음은 단독 증거로 인정하지 않는다.

```text
"PASS"
"Successfully validated"
"Fully validated"
console.log("PASS")
테스트 함수가 throw하지 않았다는 사실
```

---

# 10. Evidence Reproducibility

각 테스트는 가능하면 다음을 기록한다.

```text
Test ID
Test Data ID
Season ID
Batch ID
Chunk ID
Player IDs
Request ID
Timestamp
Expected
Actual
```

동일 Test ID로 다시 실행할 수 있어야 한다.

---

# 11. STOP 조건

다음 중 하나라도 발견되면 READY 판정을 하지 않는다.

1. Golden Scenario Expected/Actual mismatch
2. Deterministic Replay 불일치
3. Player Chunk membership 변경으로 중복/누락 발생
4. 동일 Player Economic Effect 2회 발생
5. Decision Log 중복
6. Season 간 Idempotency 오염
7. Batch Type 간 Idempotency 오염
8. PLAY-07.2 Regression 실패
9. Phase 1/2 Regression 실패
10. 실제 Evidence 없이 PASS 주장
11. 테스트 결과 재현 불가
12. Production-equivalent 환경과 실제 테스트 환경의 차이가 결과에 영향을 줄 가능성

---

# 12. 수정이 필요한 경우

문제가 발견되면 대규모 리팩터링하지 않는다.

```text
Issue
↓
Reproduction
↓
Root Cause
↓
Minimal Fix
↓
Targeted Test
↓
Full Regression
```

순서로 진행한다.

Player Resolution 구조를 수정하면 PLAY-07.2 및 Phase 1/2 Regression을 다시 수행한다.

---

# 13. Final Acceptance Criteria

다음 모든 조건이 실제 Evidence로 확인되어야 한다.

```text
Golden Scenario                 PASS
Deterministic Replay            PASS
PLAY-07.2 Regression            PASS
Phase 1 Regression              PASS
Phase 2 Regression              PASS
Player Resolution Stability     PASS
Idempotency Identity            PASS
Concurrent Duplicate            PASS
Crash Before Commit             PASS
Crash After Commit              PASS
Mid-Chunk Recovery              PASS
Decision Audit Trail            PASS
```

그리고:

```text
No unresolved critical issue
+
All evidence reproducible
+
No unverified PASS claims
```

이어야 한다.

---

# 14. Final Verdict

아래 중 하나만 사용한다.

```text
VERIFIED
VERIFIED AFTER FIXES
PARTIALLY VERIFIED
NOT VERIFIED
BLOCKED
```

**"Phase 3 is fully validated"라는 문장을 결론으로 사용하지 않는다.**

이번 Review의 목적은 그 문장을 증명하는 것이다.

---

# 15. 최종 보고서 형식

## 1. Acceptance Review Summary
## 2. Claims Reviewed
## 3. Golden Scenario Evidence
## 4. Deterministic Replay Evidence
## 5. PLAY-07.2 Regression Evidence
## 6. Phase 1 Regression Evidence
## 7. Phase 2 Regression Evidence
## 8. Player Resolution Stability
## 9. Idempotency Identity Validation
## 10. Crash / Retry Revalidation
## 11. Decision Log / Audit Trail
## 12. Issues Found
## 13. Fixes Applied
## 14. Remaining Risks
## 15. Evidence Reproducibility
## 16. Final Verdict

---

# 16. 핵심 원칙

> **보고서를 믿는 것이 아니라 시스템 상태를 검증한다.**

> **PASS라는 결과보다 PASS를 재현할 수 있는 Evidence가 중요하다.**

최종적으로 확인해야 하는 것은:

> **"내일 동일한 테스트를 다시 실행했을 때도 같은 결과가 나오며, 문제가 생겼을 경우 어느 Player의 어느 경제 이벤트에서 왜 문제가 발생했는지 추적할 수 있는가?"**
