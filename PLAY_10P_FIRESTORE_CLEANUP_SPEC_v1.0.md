# PLAY 10P FIRESTORE CLEANUP SPECIFICATION v1.0

## 1. 목적

본 문서의 목적은 PLAY Property-Scale Simulation의 첫 번째 실제 참가자 규모 테스트인 **10 Participant Simulation**을 실행하기 전에, 기존 Firebase Firestore에 남아 있는 PLAY 테스트 실행 데이터를 안전하게 정리하고 테스트 가능한 Clean State를 확보하는 것이다.

본 Cleanup은 단순한 데이터 삭제 작업이 아니다.

다음 네 가지를 동시에 만족해야 한다.

1. 이전 테스트 실행 데이터 제거
2. RealRankers 및 Property Master 데이터 보호
3. PLAY의 코드/설정/스키마/보안 구조 보호
4. Cleanup 완료 후 10 Participant Simulation을 시작할 수 있는 상태임을 검증

---

# 2. 작업 원칙

## 2.1 가장 중요한 원칙

> **DELETE보다 SCOPE 검증이 먼저다.**

삭제 대상 Collection을 추정하여 일괄 삭제하지 않는다.

실제 Firestore Production-equivalent 환경에서 현재 존재하는 Collection 및 PLAY 관련 문서를 먼저 확인한다.

---

## 2.2 보호 원칙

다음 데이터는 본 Cleanup의 삭제 대상이 아니다.

### RealRankers 운영/원본 데이터

- 기존 RealRankers Property Master
- 실제 부동산 원본 데이터
- 기존 RealRankers 사용자 데이터
- 기존 RealRankers 서비스 데이터
- 기존 운영용 Firestore Collection

### PLAY 구조/설정

- Cloud Functions 코드
- Firebase Security Rules
- Season Policy 정의
- Property Master 원본
- Research Schema 정의
- 함수 설정
- 환경 설정
- 코드에 포함된 정적 데이터

### Firebase Auth

Firebase Authentication 사용자 계정 자체는 삭제하지 않는다.

---

# 3. Cleanup 대상

실제 Firestore에 존재하고 PLAY Simulation 실행으로 생성된 데이터 중 다음 범주를 Cleanup 대상으로 조사한다.

## 3.1 Season / Participant

- `PLAY_SEASON`
- `PLAY_PLAYER`
- `PLAY_PLAYER_STATE`
- `PLAY_PLAYER_ASSET`

## 3.2 Property / Market State

- `PLAY_PROPERTY_STATE`
- `PLAY_PROPERTY_OWNERSHIP`
- `PLAY_PRIMARY_SUPPLY`
- `PLAY_SECONDARY_LISTING`

## 3.3 Transaction / Decision

- `PLAY_PROPERTY_TRANSACTION`
- `PLAY_TRANSACTION`
- `PLAY_DECISION_LOG`

## 3.4 Batch / Simulation State

실제 구현에서 존재하는 경우에 한하여:

- `PLAY_BATCH`
- `PLAY_BATCH_CHUNKS`
- `PLAY_BATCH_CHECKPOINT`
- `PLAY_SEASON_CLOCK`
- 기타 PLAY Simulation 실행 상태 Collection

단, 실제 Collection 이름을 코드와 Firestore에서 확인한 후 확정한다.

## 3.5 Idempotency

실제 구현에서 존재하는 경우:

- `PLAY_IDEMPOTENCY_LOGS`

이 데이터는 이전 테스트의 request/batch/chunk/player idempotency 상태가 새 테스트에 영향을 주지 않도록 Cleanup 대상에 포함한다.

## 3.6 Research Runtime Data

실제 구현에서 존재하는 경우:

- `RESEARCH_EVENTS`
- `RESEARCH_EVENTS_DLQ`

이전 테스트의 Research Event가 10 Participant Simulation의 연구 데이터와 섞이지 않도록 정리한다.

---

# 4. 절대 삭제 금지

다음 항목은 Cleanup 과정에서 삭제하지 않는다.

### 4.1 Property Master

Season Simulation의 원본으로 사용하는 Property Master는 보존한다.

현재 검증된 Property Master 기준:

- Total: 209
- NORMAL: 200
- INCOMPLETE: 9

Property Master 자체를 삭제하거나 수정하지 않는다.

### 4.2 RealRankers 기존 데이터

PLAY 테스트 데이터 Cleanup을 이유로 RealRankers Collection을 삭제하거나 변경하지 않는다.

### 4.3 Firebase Auth

사용자 계정 및 인증 데이터를 삭제하지 않는다.

### 4.4 코드 및 설정

- Cloud Functions source
- Firebase configuration
- Security Rules
- Research Logger
- Economic Engine
- Property Market Engine
- Reliability components
- IA-03C / IA-04A / IA-04B / IA-04D code

를 변경하지 않는다.

---

# 5. Cleanup 실행 전 Discovery

Cleanup 실행 전에 반드시 다음을 수행한다.

## C01. Collection Inventory

Firestore의 현재 Collection 목록을 조회한다.

결과를 다음 형태로 기록한다.

| Collection | PLAY 관련 | 예상 역할 | 문서 수 | Cleanup |
|---|---|---|---:|---|
| ... | YES/NO | ... | ... | YES/NO |

문서 수를 확인할 수 없는 경우 해당 사실을 명시한다.

---

## C02. Code Reference Verification

Repository에서 PLAY 관련 Collection 이름을 검색한다.

특히 다음 패턴을 확인한다.

```text
PLAY_
RESEARCH_
```

코드에서 실제 사용되는 Collection 이름과 Firestore 실제 Collection을 비교한다.

---

## C03. Dependency Check

삭제하려는 Collection이 다른 데이터의 참조 원본인지 확인한다.

예:

```text
PLAY_SEASON
    ↓
PLAY_PLAYER
    ↓
PLAY_PLAYER_ASSET
    ↓
PLAY_PROPERTY_OWNERSHIP
    ↓
PLAY_TRANSACTION
```

삭제 순서는 참조 구조를 고려한다.

---

# 6. Cleanup Plan 생성

실제 삭제 전에 다음 정보를 출력한다.

```text
CLEANUP TARGET PLAN

Environment:
Firebase Project:
Firestore Region:

Target Collections:
- ...
- ...

Protected Collections:
- ...
- ...

Estimated Documents:
- ...

Delete Order:
1. ...
2. ...
3. ...

NO DELETE:
- RealRankers Property Master
- RealRankers production data
- Firebase Auth
- PLAY code/configuration
```

이 단계에서는 아직 삭제하지 않는다.

---

# 7. 삭제 방식

## 7.1 One-Time Cleanup

Cleanup은 반복 운영 기능으로 만들지 않는다.

10 Participant Simulation을 위한 **one-time operational cleanup**으로 수행한다.

향후 일반 사용자용 API나 UI에 Cleanup 기능을 추가하지 않는다.

---

## 7.2 Server-side / Admin SDK

Cleanup은 승인된 운영 환경에서 Admin SDK 권한을 이용하여 수행한다.

브라우저 Client에서 Firestore 삭제를 수행하지 않는다.

---

## 7.3 Batch / Pagination

대량 문서를 한 번에 삭제하지 않는다.

다음 원칙을 따른다.

- pagination
- batch delete
- retry
- progress logging
- 실패 문서 기록

---

# 8. 삭제 전 안전장치

삭제 전에 반드시 다음 정보를 기록한다.

- Firebase Project ID
- 실행 timestamp
- 대상 Collection
- 문서 수
- 삭제 대상 범위
- 보호 대상
- cleanup execution ID

가능한 경우 삭제 전 snapshot/export 여부도 기록한다.

---

# 9. Cleanup 실행

각 Collection별로 다음을 기록한다.

```text
Collection:
Before Count:
Delete Attempt:
Deleted:
Failed:
Remaining:
```

삭제 실패가 발생하면 전체 작업을 성공으로 처리하지 않는다.

---

# 10. Cleanup 후 검증

Cleanup 완료 후 반드시 다음 검증을 수행한다.

## V01. Target Collection Empty

삭제 대상 Simulation Collection에 이전 테스트 데이터가 남아 있지 않아야 한다.

단, 시스템 구조상 빈 Collection 자체가 존재하지 않을 수 있으므로:

```text
document_count = 0
```

또는

```text
collection does not exist
```

둘 다 Clean State로 인정한다.

---

## V02. Property Master Integrity

Property Master가 Cleanup 전후 동일한지 확인한다.

검증 항목:

- 총 Property 수
- NORMAL 수
- INCOMPLETE 수
- Property ID
- representative area
- initial price
- household_count
- X/Y
- status

기준:

```text
209 total
200 NORMAL
9 INCOMPLETE
```

현재 검증된 기준과 다르면 자동으로 PASS 처리하지 않는다.

---

## V03. RealRankers Integrity

RealRankers 데이터가 변경되지 않았음을 확인한다.

변경이 발견되면 Cleanup PASS가 아니다.

---

## V04. Security Integrity

Cleanup 과정에서 Security Rules를 변경하지 않았는지 확인한다.

---

## V05. Function Integrity

PLAY backend functions의 source 또는 deployment configuration을 변경하지 않았는지 확인한다.

---

# 11. 10 Participant Simulation Readiness

Cleanup이 완료되었다고 해서 자동으로 Simulation을 실행하지 않는다.

다음 조건을 모두 만족해야 한다.

```text
[ ] Cleanup Scope Verified
[ ] Target Simulation Data Removed
[ ] No Protected Data Changed
[ ] Property Master Integrity PASS
[ ] RealRankers Integrity PASS
[ ] Idempotency State Clean
[ ] Research Runtime Data Clean
[ ] No Orphan PLAY State
[ ] No Cleanup Errors
[ ] Runtime Environment Healthy
```

모든 항목이 PASS일 경우:

```text
STATUS: READY FOR 10-PARTICIPANT SIMULATION
```

하나라도 실패하면:

```text
STATUS: BLOCKED
```

로 판정한다.

Simulation은 Cleanup PASS 이후에만 실행한다.

---

# 12. Orphan Detection

Cleanup 후 다음과 같은 고아 상태를 검색한다.

예:

```text
PLAYER → 없는 SEASON
OWNERSHIP → 없는 PLAYER
TRANSACTION → 없는 PLAYER
TRANSACTION → 없는 PROPERTY
LISTING → 없는 OWNER
IDEMPOTENCY → 없는 TRANSACTION
RESEARCH_EVENT → 없는 PARTICIPANT
```

Orphan이 발견되면 원인을 확인하고 자동 삭제하지 않는다.

---

# 13. Simulation Baseline

10 Participant Simulation은 Cleanup 완료 상태를 새로운 Baseline으로 사용한다.

Baseline에는 다음을 기록한다.

```text
BASELINE_ID
PROJECT_ID
CLEANUP_EXECUTION_ID
PROPERTY_MASTER_VERSION
PROPERTY_COUNT
NORMAL_COUNT
INCOMPLETE_COUNT
SEASON_SUPPLY_POLICY
CODE_VERSION
FUNCTION_VERSION
TIMESTAMP
```

Season 1의 공급 정책은 현재 결정된:

```text
FIXED_ONE
```

을 사용한다.

즉:

```text
Property Asset = Complex 1개
Season 1 Primary Supply = 1
```

이며 household_count를 Season 1의 공급 수량으로 사용하지 않는다.

---

# 14. 금지 사항

이번 Cleanup 단계에서는 다음 작업을 하지 않는다.

- 10 Participant Simulation 실행
- 100 Participant Simulation 실행
- Property Master 수정
- household_count 수정
- supply_policy 변경
- Economic Engine 변경
- Property Market Engine 변경
- Secondary Market 로직 변경
- Research Schema 변경
- Research Logger 변경
- UI 변경
- Season Policy 변경
- Security Rules 변경

Cleanup은 Cleanup만 수행한다.

---

# 15. Evidence

다음 결과물을 반드시 남긴다.

```text
cleanup/
├── cleanup_plan.json
├── cleanup_execution.json
├── cleanup_summary.json
├── collection_inventory.json
├── protected_data_verification.json
├── property_master_integrity.json
├── orphan_check.json
└── baseline_10p.json
```

가능한 경우 실행 로그에도 다음을 포함한다.

- cleanup_execution_id
- collection
- document_id
- timestamp
- action
- result
- error
- trace_id

---

# 16. Final Verdict

### PASS

다음 조건을 모두 만족할 경우:

```text
STATUS: READY FOR 10-PARTICIPANT SIMULATION
```

### BLOCKED

다음 중 하나라도 발생하면:

- 삭제 범위 불명확
- 보호 데이터 변경
- Property Master 변경
- 삭제 실패
- orphan 존재
- 기존 Simulation state 잔존
- idempotency state 잔존
- Research runtime data 잔존
- 환경 무결성 확인 실패

```text
STATUS: BLOCKED
```

Simulation은 Cleanup PASS 이후에만 실행한다.

---

# 17. 핵심 원칙

> **10 Participant Simulation의 첫 번째 실행은 이전 테스트의 연장이 아니라 새로운 실험의 시작이다.**

따라서 Cleanup 완료 상태를 명확한 Baseline으로 정의하고, 이후 생성되는 모든 Season / Participant / Decision / Transaction / Research Event를 새로운 실험 데이터로 취급한다.
