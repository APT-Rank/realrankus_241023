# PLAY-07.3 PROP_FINAL_1 CLEANUP & POST-CLEANUP VERIFICATION

## 0. 목적

현재 PLAY-07.3 Phase 5~7은 BLOCKED 상태다.

조사 결과 `PLAY_PROPERTY_MASTER`에 존재하는 210번째 문서 `PROP_FINAL_1`이 정상 Property Master 데이터가 아니라 이전 E2E 테스트가 남긴 stale test data임이 확인되었다.

확인된 사실:

- PLAY-07.2 기준 Property Master: 209개
- 현재 Firestore: 210개
- 추가 문서: `PROP_FINAL_1`
- `PROP_FINAL_1`은 PLAY-07.2 기준 목록에 없음
- 원본 CSV에도 없음
- 정상 Property Master 필드가 없음
- `verify_market_e2e_final.ts`의 테스트용 식별자와 일치
- Root Cause: STALE TEST DATA
- 해당 문서가 현재 Reconciliation 실패의 직접 원인

## 이번 작업의 목적

**오염된 테스트 데이터 1건을 정확히 삭제하고, 삭제 후 Property Master 정상 상태를 읽기 전용으로 확인한다.**

이번 작업의 목적은 E2E 테스트를 다시 통과시키는 것이 아니다.

---

# 1. APPROVED ACTION

다음 문서 **1건의 삭제만 승인한다.**

```text
Collection: PLAY_PROPERTY_MASTER
Document ID: PROP_FINAL_1
```

삭제 대상은 정확히 다음 조건을 모두 만족해야 한다.

```text
document_id = PROP_FINAL_1
property_id = PROP_FINAL_1
season_id = S_FINAL_1790340397852
```

세 조건 중 하나라도 일치하지 않으면:

> **즉시 STOP**

하고 삭제하지 않는다.

---

# 2. ABSOLUTE SCOPE

이번 작업에서 허용되는 변경은 오직 다음 하나다.

> `PLAY_PROPERTY_MASTER/PROP_FINAL_1` 삭제

그 외 어떠한 변경도 하지 않는다.

금지:

- 다른 Property Master 문서 삭제
- 다른 Property Master 문서 수정
- Property Master 재생성
- Property Master 재수집
- Reconciliation 코드 수정
- `209 → 210` 변경
- Cloud Function 수정
- Cloud Function 배포
- Cloud Function 삭제
- Cloud Tasks 변경
- Queue 생성/삭제
- endpoint 변경
- authentication 변경
- 테스트 코드 수정
- 테스트 fixture 수정
- E2E 테스트 재실행
- 자동 cleanup 범위 확대
- 기타 stale data 삭제

---

# 3. PRE-DELETE VERIFICATION

삭제 직전에 실제 Firestore에서 대상 문서를 다시 읽는다.

확인할 필드:

- document_id
- property_id
- season_id
- initial_price
- complex_id
- complex_name
- status
- tradable
- source_file
- snapshot_version

그리고 삭제 전 전체 상태를 기록한다.

### Expected pre-delete state

```text
PLAY_PROPERTY_MASTER total = 210
```

추가 문서:

```text
PROP_FINAL_1
```

만을 대상으로 한다.

---

# 4. DELETE

PRE-DELETE 조건이 모두 충족되면 다음 문서만 삭제한다.

```text
PLAY_PROPERTY_MASTER/PROP_FINAL_1
```

삭제 방법은 기존 프로젝트의 정상적인 Firestore Admin SDK / 승인된 관리 방법을 사용한다.

삭제 전후에 다른 문서를 변경하지 않는다.

---

# 5. POST-DELETE VERIFICATION

삭제 직후 READ-ONLY 방식으로 다음을 확인한다.

## A. Property Master count

| Item | Expected |
|---|---:|
| Total | 209 |
| NORMAL | 200 |
| INCOMPLETE | 9 |

실제값을 조회하여 기록한다.

---

## B. Deleted document

다시 조회한다.

```text
PLAY_PROPERTY_MASTER/PROP_FINAL_1
```

Expected:

```text
NOT FOUND
```

---

## C. Existing data integrity

삭제 후 다음을 확인한다.

- 기존 209개 문서가 존재하는가?
- 기존 209개 중 임의의 문서가 추가로 삭제되지 않았는가?
- NORMAL = 200인가?
- INCOMPLETE = 9인가?
- 기존 문서의 count가 예상과 일치하는가?

가능하면 삭제 전 209개 기준 ID 목록과 삭제 후 ID 목록을 비교하여:

> 삭제된 ID가 `PROP_FINAL_1` 하나뿐인지

확인한다.

---

# 6. TEST-LIKE DATA READ-ONLY SCAN

삭제 후 현재 `PLAY_PROPERTY_MASTER`에 명백한 테스트 패턴이 추가로 존재하는지만 READ-ONLY로 조사한다.

다음 패턴을 조회한다.

- `PROP_*`
- `S_FINAL_*`
- `TEST_*`
- `E2E_*`

### 중요

이 단계에서는 **발견된 문서를 삭제하지 않는다.**

다른 테스트 데이터가 발견되면 목록만 작성한다.

정상 데이터인지 여부가 불명확한 문서는 반드시 보존하고 `REVIEW REQUIRED`로 표시한다.

---

# 7. E2E TEST 금지

이번 작업에서는 E2E를 재실행하지 않는다.

특히 다음을 실행하지 않는다.

```text
verify_batch_phase5_to_7.ts
verify_market_e2e_final.ts
```

또한 Season을 다시 생성하거나 Batch를 실행하지 않는다.

이번 단계에서는:

> 삭제 → 상태 검증 → 보고 → STOP

까지만 수행한다.

---

# 8. NO CODE CHANGE

이번 작업에서는 코드 변경이 필요하지 않다.

따라서 다음 파일을 수정하지 않는다.

- runReconciliation.ts
- aggregateBatch.ts
- runReconciliation 관련 코드
- advanceSeasonClock.ts
- dispatchBatchChunks.ts
- processBatchChunk.ts
- 기타 PLAY 코드

현재 Reconciliation의 209개 기준은 이번 단계에서 수정하지 않는다.

---

# 9. AUDIT EVIDENCE

다음 증거를 보고서에 남긴다.

### Before

- 삭제 대상 document ID
- 삭제 대상 전체 데이터
- Property Master total
- NORMAL count
- INCOMPLETE count

### Action

- 삭제 시각
- 삭제 대상
- 실행 방법
- 실행 주체

### After

- Property Master total
- NORMAL count
- INCOMPLETE count
- `PROP_FINAL_1` 조회 결과
- 기존 209개 ID 보존 여부
- 추가 삭제 여부

---

# 10. FINAL REPORT

다음 형식으로 보고한다.

# PLAY-07.3 PROP_FINAL_1 CLEANUP REPORT

## 1. Status

- CLEANUP EXECUTED / NOT EXECUTED
- NO CODE CHANGE
- NO INFRASTRUCTURE CHANGE
- NO E2E EXECUTION

## 2. Pre-Delete Evidence

## 3. Delete Action

## 4. Post-Delete Verification

| Item | Expected | Actual | Result |
|---|---:|---:|---|
| Total | 209 | | |
| NORMAL | 200 | | |
| INCOMPLETE | 9 | | |
| PROP_FINAL_1 | NOT FOUND | | |

## 5. Existing Data Integrity

- Existing 209 documents preserved: YES / NO / UNKNOWN
- Additional document deleted: YES / NO
- Other documents changed: YES / NO / UNKNOWN

## 6. Remaining Test-Like Data

| Pattern | Document | Action |
|---|---|---|
| | | READ-ONLY / REVIEW REQUIRED |

## 7. Evidence

실제 Firestore 조회 결과와 실행 결과를 기록한다.

## 8. Issues

문제가 있으면 기록한다.

## 9. FINAL STATUS

다음 중 하나만 선택한다.

- CLEANUP COMPLETE — WAITING FOR E2E APPROVAL
- BLOCKED
- CLEANUP FAILED

---

# 11. ABSOLUTE STOP AFTER COMPLETION

보고서 작성이 끝나면 즉시 STOP한다.

다음 작업은 사용자 승인 없이는 수행하지 않는다.

- E2E 재실행
- Reconciliation 수정
- Queue 정리
- Function 변경
- 코드 수정
- 추가 데이터 삭제
- Phase 5~7 진행

---

# 핵심 원칙

이번 작업에서는:

> **오염된 데이터만 제거한다.**

그리고:

> **정상 데이터 기준을 변경하지 않는다.**

그리고:

> **삭제 후 정상 상태를 확인하지만 E2E 테스트는 실행하지 않는다.**

최종 순서는 반드시 다음과 같다.

> PRE-CHECK → DELETE 1건 → POST-CHECK → REPORT → STOP
