# AG EXECUTION PROMPT
# AI Season 1 — Property Universe Baseline Lock & Execution

## 0. 반드시 먼저 읽을 문서

다음 문서를 먼저 읽어라.

```text
PLAY-AI-SEASON-01_EXECUTION_SPEC.md
PLAY-AI-SEASON-01_PROPERTY_UNIVERSE_SCOPE.md
PLAY-07.4_VERIFIED_AREA_LOCK_PROTOCOL.md
PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1.md
```

이번 작업에서는 특히 `PLAY-AI-SEASON-01_PROPERTY_UNIVERSE_SCOPE.md`를 Property 범위의 기준 문서로 사용한다.

---

# 1. 이번 작업의 핵심

AI Season 1의 Property Universe를 **검증 완료된 수지구 209개 Property Master로 고정**하고, 그 범위에서 AI Season 1 테스트를 실행하라.

현재 기준:

```text
Total Property Master = 209
NORMAL = 200
INCOMPLETE = 9
```

거래 가능한 Property는 200 NORMAL이다.

9 INCOMPLETE Property는 Master에는 존재하지만 거래 대상이 아니다.

---

# 2. 매우 중요한 범위 제한

AI Season 1은 전국 부동산 시장 테스트가 아니다.

다음 해석을 하지 마라.

```text
전국 Property Engine 검증
전국 시장 대표성 검증
전국 아파트 데이터 완전성 검증
```

이번 테스트의 정확한 의미는:

> **수지구 209개 Property Universe에서 대규모 AI Participant가 동시에 거래할 때 PLAY Engine의 무결성, 동시성, 추적성, 병목을 검증하는 것**

이다.

---

# 3. 실행 전 Baseline 확인

먼저 실제 Firestore / PLAY 환경의 Property Master를 읽고 다음을 확인하라.

```text
Property Master Total
NORMAL Count
INCOMPLETE Count
Property ID
tradable
initial_price
```

Expected:

```text
209
200
9
```

그리고 실제 Region / Source File이 수지구 기준인지 확인하라.

---

# 4. Baseline이 다를 경우

Expected와 Actual이 다르면 AI Season을 실행하지 마라.

예:

```text
Expected 209
Actual 208
```

이면:

```text
STOP
```

한다.

추측해서 수정하지 마라.

다음 파일에 문제를 기록하라.

```text
PLAY-AI-SEASON-01_PROPERTY_BASELINE_VERIFICATION.md
```

---

# 5. 기흥구 처리

다음 파일이 존재하더라도 자동으로 추가하지 마라.

```text
경기도 용인시 기흥구_202609_Data_sum_202609_Valuated_202609.csv
```

기흥구는 현재 AI Season 1 VERIFIED Property Universe가 아니다.

기흥구를 추가하려면 별도 승인과 별도 Property Data Verification이 필요하다.

이번 작업에서는 추가하지 않는다.

---

# 6. 전국 데이터 처리

전국 데이터를 추가하지 마라.

다음 행동 금지:

```text
전국 CSV merge
서울 추가
경기 타 지역 추가
인천 추가
광역시 추가
지방 추가
```

AI Season 1은 수지구 Property Universe로만 실행한다.

---

# 7. AI Season 1 실행

Property baseline이 PASS한 경우에만 AI Season 1을 실행한다.

경제환경:

```text
30 simulated years
360 periods
현재 PLAY-07.x에서 검증된 경제 parameter
```

Property:

```text
209 Master
200 NORMAL tradable
9 INCOMPLETE non-tradable
```

AI population:

```text
10
↓
100
↓
1,000
↓
10,000
```

---

# 8. Scale 진행 규칙

절대로 처음부터 10,000 AI를 실행하지 마라.

순서:

```text
10 AI
  ↓ PASS
100 AI
  ↓ PASS
1,000 AI
  ↓ PASS
10,000 AI
```

어느 단계에서든 Integrity Failure가 발생하면 즉시 STOP한다.

다음 Scale로 넘어가지 않는다.

---

# 9. AI의 역할

AI는 경제적 Action을 생성한다.

그러나 다음을 AI가 직접 계산하지 않는다.

```text
price
cash
fee
ownership
debt
net worth
economic state
transaction result
```

이 모든 최종 상태 계산은 PLAY Engine이 담당한다.

AI:

```text
Decision
```

PLAY:

```text
Validation
→ Transaction
→ State Mutation
→ Log
```

구조를 유지한다.

---

# 10. 반드시 검증할 Property 무결성

각 Scale에서 다음을 검증한다.

## A. Ownership

```text
Property 1개
=
동시에 허용된 ownership 수
```

중복 ownership 금지.

## B. Cash

Property transaction에 따른 cash mutation이 정확히 한 번만 반영되어야 한다.

## C. Supply

Primary transaction에서 공급량보다 많은 거래가 성공해서는 안 된다.

## D. Secondary

동일 주문이 두 번 체결되어서는 안 된다.

## E. Log

모든 실제 성공 transaction이 Decision Log / transaction evidence와 연결되어야 한다.

---

# 11. Traceability Sample

각 Scale에서 실제 거래 sample을 추출하라.

최소:

```text
10 AI     → 3 samples
100 AI    → 10 samples
1,000 AI  → 30 samples
10,000 AI → 100 samples
```

각 sample에 대해:

```text
AI
→ Action
→ Request
→ Transaction
→ Property
→ Ownership
→ Cash Mutation
→ Decision Log
→ Final State
```

를 추적하라.

하나라도 추적 불가하면:

```text
TRACEABILITY FAILURE
```

이다.

---

# 12. Bottleneck 측정

가능한 범위에서 다음을 측정하라.

```text
Property transaction latency
Firestore transaction latency
Firestore abort / contention
Cloud Task queue depth
Chunk processing time
Aggregator delay
Decision Log write time
HTTP error
HTTP timeout
Retry count
```

관측할 수 없는 값은 추정하지 마라.

```text
NOT OBSERVABLE
```

로 기록한다.

---

# 13. Integrity Failure 정의

다음 중 하나라도 발생하면 해당 Scale은 FAIL이다.

```text
Property ownership duplication
Double cash deduction
Double cash credit
Missing transaction
Duplicate transaction
Missing Decision Log
Untraceable transaction
Property state corruption
Negative supply
State / Log mismatch
Reconciliation failure
Season Clock corruption
```

---

# 14. Bottleneck과 Integrity Failure를 구분하라

예:

```text
Firestore latency 증가
```

만으로 FAIL하지 않는다.

다음과 같이 분류한다.

```text
NORMAL
BOTTLENECK
INTEGRITY FAILURE
```

Bottleneck이 발생해도 데이터 무결성이 유지된다면 정확한 병목 위치와 수치를 기록한다.

---

# 15. v1.1 Test Control

모든 테스트는:

```text
Attempt 1 PASS
→ Evidence 저장
→ 종료

Attempt 1 FAIL
→ Root Cause
→ Minimal Fix
→ Attempt 2

Attempt 2 PASS
→ Evidence 저장
→ 종료

Attempt 2 FAIL
→ STOP
→ Human Review
```

규칙을 적용한다.

Attempt 3 금지.

---

# 16. Verified Area 보호

다음 영역은 임의 수정 금지다.

```text
Economic Engine
Reconciliation / Transaction
Idempotency
Primary Market
```

AI Season 테스트 중 위 영역의 수정이 필요해 보이면 즉시 STOP한다.

그 상태에서:

```text
Human Review Request
```

를 작성하고 승인 전에는 수정하지 마라.

---

# 17. 보고서

최소 다음 문서를 생성하라.

```text
PLAY-AI-SEASON-01_PROPERTY_BASELINE_VERIFICATION.md

PLAY-AI-SEASON-01_L10_REPORT.md
PLAY-AI-SEASON-01_L100_REPORT.md
PLAY-AI-SEASON-01_L1000_REPORT.md
PLAY-AI-SEASON-01_L10000_REPORT.md

PLAY-AI-SEASON-01_FINAL_RECONCILIATION.md
PLAY-AI-SEASON-01_ISSUES.md
PLAY-AI-SEASON-01_EXECUTION_REPORT.md
```

각 Level의 Raw Evidence도 보존하라.

---

# 18. 각 보고서에 반드시 포함할 것

```text
Timestamp
Environment
Season ID
AI population
Property Master count
NORMAL count
INCOMPLETE count
360 period result
Transaction count
Decision Log count
Missing count
Duplicate count
Ownership mismatch
State mismatch
Traceability result
Bottleneck metrics
Error count
Retry count
Reconciliation result
Raw evidence
Attempt count
Final result
```

---

# 19. Property Scope 문구

모든 결과 보고서에는 다음 문구와 동일한 의미가 들어가야 한다.

> AI Season 1은 현재 검증 완료된 경기도 용인시 수지구 209개 Property Master를 기준으로 실행하며, 이 중 200개 NORMAL Property만 거래 가능하다. 9개 INCOMPLETE Property는 거래 대상에서 제외한다. 전국 또는 추가 지역 Property Data는 본 Season의 범위에 포함하지 않는다.

---

# 20. 최종 STOP

10 → 100 → 1,000 → 10,000 테스트가 모두 완료되면 즉시 STOP한다.

AI Season 2를 실행하지 마라.

전국 Property Data를 추가하지 마라.

Property Engine을 확장하지 마라.

다음 단계는 별도 Human Review 후 결정한다.

---

# 최종 질문

AI Season 1의 최종 판단은 단순히:

> "10,000 AI가 완주했는가?"

가 아니다.

다음 질문에 evidence로 답해야 한다.

> **"수지구 209개 Property Universe에서 최대 10,000 AI가 동시에 경제행동을 수행했을 때, PLAY가 Transaction과 State Mutation을 누락·중복 없이 처리하고, 각 결과를 추적하며, 병목과 장애 발생 위치를 식별할 수 있었는가?"**

이 질문에 대한 답을 최종 보고서의 핵심 결론으로 작성하라.
