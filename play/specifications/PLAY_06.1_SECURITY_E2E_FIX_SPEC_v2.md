# PLAY-06.1 SECURITY & E2E FIX SPEC
## Cloud Tasks Internal Authentication / Server Authority / Evidence Re-Verification

### 1. 문서 목적

PLAY-06 실제 환경 검증 과정에서 Cloud Tasks → HTTP Callable Functions 호출 시 Firebase Auth Token이 존재하지 않아 `unauthenticated` 오류가 발생했고, 이를 해결하기 위해 `advanceSeasonClock`의 `!request.auth` 체크를 우회한 사실이 확인되었다.

현재 검증 리포트는 이 변경 이후 V01~V30을 PASS로 판정했으나, 해당 인증 우회는 PLAY-06의 Server Authority / Security 원칙과 충돌할 가능성이 있으므로 PLAY-07 진행 전에 반드시 재검증한다.

본 문서의 목표:

1. 인증 우회 코드 제거
2. Cloud Tasks 내부 호출을 안전하게 인증/인가
3. `processBatchChunk`와 `advanceSeasonClock`의 호출 권한 검증
4. 실제 동시성 Idempotency 검증
5. 기존 RealRankers 및 PLAY 기능 영향 확인
6. V01~V30을 개별 Evidence 기반으로 재검증

---

# 2. 현재 확인된 문제

AG의 실제 환경 검증 리포트에서 다음 사항이 보고되었다.

- Firebase Project `aptrank-cc61b`에서 E2E 테스트 수행
- Cloud Tasks API 및 IAM 문제를 수정
- Cloud Tasks → HTTP Callable Functions 호출 시 Firebase Auth Token 부재로 `unauthenticated`
- `advanceSeasonClock` 내부의 `!request.auth` 체크를 우회 적용 후 재배포
- Production에서는 `x-cloudtasks-queuename` 검증 등의 보완이 필요하다고 AG가 자체 명시

따라서 현재 `READY FOR PLAY-07` 판정은 보류한다.

---

# 3. 최우선 원칙

## 3.1 인증 우회 금지

다음과 같은 방식으로 문제를 해결해서는 안 된다.

```text
if (!request.auth) {
    // bypass
}
```

또는:

```text
if (!request.auth) return;
```

또는 인증 검사를 제거하는 방식.

Cloud Tasks 내부 호출이라고 해서 인증되지 않은 요청을 무조건 허용해서는 안 된다.

---

# 4. Internal Task Authentication 설계 요구사항

Cloud Tasks가 `processBatchChunk` / `advanceSeasonClock`를 호출할 때 Firebase End User Auth Token이 없는 것은 정상적인 내부 서버 호출 구조일 수 있다.

따라서 다음 두 가지 인증을 분리한다.

## A. User Authentication

사용자 호출:

```text
Firebase Auth
→ request.auth
```

## B. Internal Service Authentication

Cloud Tasks / Backend 호출:

```text
Cloud Tasks
→ Google-authenticated internal request
→ Function
→ Internal Caller Verification
```

내부 호출은 사용자 인증과 별개의 서버 간 인증으로 처리한다.

---

# 5. 구현 전 설계 확인

AG는 실제 코드 수정 전에 다음을 먼저 확인하고 보고한다.

1. 현재 `processBatchChunk`가 Callable인지 HTTP Trigger인지
2. 현재 `advanceSeasonClock`가 Callable인지 HTTP Trigger인지
3. Cloud Tasks가 실제 어떤 URL을 호출하는지
4. 현재 Task 생성 시 어떤 Authentication 정보를 포함하는지
5. Function이 현재 어떤 방식으로 Caller를 인증하는지
6. Firebase Auth와 Cloud IAM 인증이 어떻게 분리되어 있는지

현재 구조와 다른 경우 문서대로 억지로 변경하지 말고 실제 구조를 우선한다.

---

# 6. 권장 Internal Authentication 방향

가능하면 Google Cloud의 서비스 간 인증 방식을 사용한다.

예:

```text
Cloud Tasks
    ↓
Authenticated OIDC token
    ↓
Target Function
    ↓
Token verification
    ↓
Allowed Service Account 확인
    ↓
Business Logic
```

검증 시 다음을 확인한다.

- Token 존재
- Token issuer
- Audience
- Expiration
- Service Account identity
- Expected Cloud Function / endpoint
- 호출 Service Account가 허용된 내부 호출자인지

단순 Header 존재 여부만으로 인증하지 않는다.

---

# 7. Queue Identity 검증

Cloud Tasks Queue 이름만 Header에 넣고 그것만 믿는 방식은 충분한 인증 수단으로 취급하지 않는다.

예:

```text
x-cloudtasks-queuename
```

은 보조적인 방어 수단으로 사용할 수 있지만,

**인증 자체를 이 Header 존재 여부에만 의존하지 않는다.**

실제 Google-authenticated identity를 검증한다.

---

# 8. Function별 권한

## processBatchChunk

허용:

```text
Cloud Tasks Worker
```

사용자 Client 직접 호출:

```text
DENY
```

## advanceSeasonClock

허용:

```text
Authorized internal scheduler/task
```

사용자 Client 직접 호출:

```text
DENY
```

## createEconomicBatch

사용자/관리자 호출 구조는 기존 PLAY-06 설계에 따라 유지하되 transaction status와 authorization을 확인한다.

## pauseTransactions / resumeTransactions

관리자 권한을 반드시 확인한다.

---

# 9. Security Boundary

다음 구조를 만족해야 한다.

```text
Internet / Client
        │
        ├── User Auth
        │       ↓
        │   Allowed Callable
        │
        └── Direct call to Worker
                ↓
              DENY

Cloud Tasks
        │
        ↓
Authenticated Service Request
        │
        ↓
Worker Function
        │
        ↓
Server Authority
        │
        ↓
Firestore Transaction
```

---

# 10. 인증 실패 테스트

실제 환경에서 다음을 모두 테스트한다.

## S01. No Auth

인증 정보 없이 Worker Function 호출.

Expected:

```text
DENY
```

## S02. Invalid Token

잘못된 OIDC Token.

Expected:

```text
DENY
```

## S03. Wrong Service Account

유효하지만 허용되지 않은 Service Account Token.

Expected:

```text
DENY
```

## S04. Wrong Audience

Audience가 다른 Token.

Expected:

```text
DENY
```

## S05. Expired Token

만료된 Token.

Expected:

```text
DENY
```

## S06. Valid Internal Task

정상 Cloud Tasks가 생성한 올바른 OIDC 인증 요청.

Expected:

```text
ALLOW
```

---

# 11. User Auth Regression

일반 사용자 호출은 기존 PLAY-06 설계대로 동작해야 한다.

확인:

```text
Authenticated User
→ allowed user function
```

그리고:

```text
Unauthenticated User
→ DENY
```

---

# 12. Player Idempotency 실제 동시성 테스트

코드상 Transaction 검증만 하지 않는다.

실제 Firebase 환경에서 동일:

```text
season_id
simulation_period
batch_type
player_id
```

에 대해 최소 2개의 동시 처리를 발생시킨다.

예:

```text
Worker A ─────┐
              ├── same Player / same Period
Worker B ─────┘
```

Expected:

```text
A → COMMIT
B → ABORT / RETRY → NO-OP
```

최종적으로:

- Player 상태 1회 변경
- last_processed_period 1회 적용
- last_processed_batch_id 정상
- 중복 경제 상태 변경 없음

을 실제 Firestore에서 증명한다.

---

# 13. Duplicate Task Test

동일 Chunk Task를 실제로 중복 실행한다.

Expected:

```text
첫 번째 → PROCESS
두 번째 → NO-OP
```

Chunk / Player 상태가 중복 변경되지 않아야 한다.

---

# 14. Mid-Chunk Failure Test

실제 Chunk 처리 중 일부 Player만 처리한 뒤 Worker Failure를 발생시킨다.

예:

```text
Player 1~N → COMMIT
Worker Failure
```

Retry:

```text
Player 1~N → NO-OP
Remaining Players → PROCESS
```

실제 Firestore 상태로 증명한다.

---

# 15. Season Clock Security

`advanceSeasonClock`에 대해 다음을 테스트한다.

### 일반 Client 직접 호출

DENY

### No Token 내부 호출

DENY

### Wrong Service Account

DENY

### Wrong Audience

DENY

### Valid Cloud Task / Authorized Internal Caller

ALLOW

### Duplicate Clock Request

한 번만 Period Advance

### Stale Batch

DENY

---

# 16. Emergency Stop Security

`pauseTransactions` 이후 다음을 테스트한다.

- createEconomicBatch → DENY
- dispatchBatchChunks → DENY
- processBatchChunk → DENY
- advanceSeasonClock → DENY

Resume 후 정상 동작을 다시 확인한다.

---

# 17. 기존 RealRankers 보호

PLAY-06.1 수정 이후에도 기존 RealRankers를 테스트한다.

최소:

- Login
- Main Page
- Property Data
- Existing RealRankers Data
- Existing User Flow

기존 서비스 장애가 발생하면 Blocking Issue다.

---

# 18. Evidence Requirement

이번 재검증은 기존 리포트와 달리 **개별 Evidence를 필수로 한다.**

각 테스트는 다음 형식으로 기록한다.

```text
Test ID:
Result:
Timestamp:
Environment:
Function:
Execution ID:
Request ID:
Task Name:
Firestore Path:
State Before:
State After:
Expected:
Actual:
Evidence:
```

Evidence 없는 PASS는 인정하지 않는다.

---

# 19. V01~V30 재검증

기존 PLAY-06 Verification Plan의 V01~V30을 다시 수행한다.

특히 다음 항목은 반드시 실제 실행한다.

- V02 Client Write Block
- V05 Unauthenticated Access
- V09 Duplicate Batch
- V12 Player Idempotency
- V13 Mid-Chunk Recovery
- V14 Duplicate Task
- V15 Task Retry
- V18 Aggregator Timeout
- V20 Duplicate Clock
- V21 Stale Batch
- V23 Corruption Detection
- V24 Emergency Stop
- V25 Resume
- V29 Existing RealRankers Regression
- V30 Recovery

---

# 20. PASS 기준

다음 조건을 모두 만족해야 한다.

1. 인증 우회 코드 없음
2. Internal Task Authentication 실제 검증
3. Unauthorized Worker 호출 차단
4. Valid Internal Task 정상 실행
5. 실제 Idempotency 동시성 검증 PASS
6. Duplicate Task PASS
7. Mid-Chunk Recovery PASS
8. Duplicate Clock 방어 PASS
9. Emergency Stop PASS
10. Existing RealRankers Regression PASS
11. V01~V30 개별 Evidence 확보
12. Blocking Issue 없음

---

# 21. Blocking Issue

다음 중 하나라도 있으면 `NOT READY`.

- 인증 우회 존재
- Worker Endpoint 직접 호출 가능
- Wrong Service Account 허용
- Wrong Audience 허용
- Expired Token 허용
- Duplicate Player Processing
- Duplicate Clock Advance
- Batch inconsistency
- Emergency Stop bypass
- 기존 RealRankers 장애
- Evidence 없는 핵심 PASS
- 실제 환경에서 재현되지 않는 PASS

---

# 22. 코드 수정 원칙

이번 수정은 PLAY-06.1 범위에 한정한다.

허용:

- Internal authentication
- Cloud Tasks authentication
- IAM
- Worker endpoint security
- Verification utilities
- 테스트 코드
- Logging / Evidence 개선

금지:

- Economic Engine
- Property Market
- BUY / SELL
- Rent / Jeonse
- Tax
- Loan
- GLI
- Reward
- Season Analysis
- 기존 RealRankers 리팩터링

---

# 23. 최종 보고서

새 파일:

`PLAY_06.1_SECURITY_E2E_VERIFICATION_REPORT.md`

를 생성한다.

다음 구조를 사용한다.

```text
1. Executive Summary
2. Root Cause of Previous Authentication Bypass
3. Authentication Architecture
4. Code Changes
5. IAM / Service Account
6. Worker Endpoint Security
7. S01~S06 Authentication Test
8. Player Concurrency Test
9. Duplicate Task Test
10. Mid-Chunk Recovery
11. Season Clock Security
12. Emergency Stop Security
13. Existing RealRankers Regression
14. V01~V30 Result
15. Evidence
16. Blocking Issues
17. Non-Blocking Issues
18. Remaining Risks
19. PLAY-07 Readiness
20. Final Verdict
```

Final Verdict:

```text
READY FOR PLAY-07
READY AFTER FIXES
NOT READY
```

중 하나만 사용한다.

---

# 24. 최종 원칙

이번 단계에서 중요한 것은 "테스트가 통과했다"는 결론이 아니다.

중요한 것은:

> **PLAY의 핵심 상태 변경 함수가 허가되지 않은 호출자에 의해 실행될 수 없는가?**

이다.

특히 `advanceSeasonClock`과 `processBatchChunk`는 이후 경제 엔진의 핵심 상태를 변경하게 되므로 보안 경계가 확실히 닫혀 있어야 한다.

인증 우회를 통해 테스트를 통과시키지 마라.

문제가 있으면 문제를 그대로 보고한다.

**PLAY-06.1 보안 검증이 실제 환경에서 PASS되기 전에는 PLAY-07 구현을 시작하지 않는다.**
