# PLAY-07.3 PROPERTY MASTER EXTRA DOCUMENT INVESTIGATION

## 0. 목적

현재 PLAY-07.3 Phase 5~7은 BLOCKED 상태다.

최근 E2E 실패의 직접 원인은 `runReconciliation`이 `PROPERTY_MASTER` 문서 수를 209개로 하드코딩하여 검증하는 반면, 실제 Firestore에는 210개 문서가 존재하기 때문이다.

현재 확인된 사실:

- 기대값: 209
- 실제값: 210
- 차이: +1
- 이 차이로 인해 Reconciliation 실패
- Reconciliation 실패로 Season Clock이 진행되지 않음
- 현재 단계에서는 코드 수정이나 인프라 변경을 하지 않는다.

## 핵심 질문

**현재 존재하는 210번째 PROPERTY_MASTER 문서는 무엇이며, 왜 생성되었는가?**

이번 작업은 이 질문에 답하는 것만을 목적으로 한다.

---

# 1. ABSOLUTE READ-ONLY MODE

이번 작업에서는 다음을 절대 수행하지 않는다.

- 코드 수정
- 코드 커밋
- 함수 배포
- 함수 삭제
- 함수 재생성
- Cloud Tasks Queue 변경
- Queue 생성/삭제
- Firestore 문서 생성/삭제/수정
- Property Master 데이터 수정
- Reconciliation 로직 수정
- 테스트 assertion 수정
- `209 → 210` 변경
- `createTask()` → `taskQueue().enqueue()` 변경
- endpoint 변경
- workaround 적용
- 추가 E2E 실행
- 자동 cleanup
- 테스트 데이터 삭제

**읽기 전용 조사만 수행한다.**

경계가 불명확한 작업은 수행하지 말고 STOP한다.

---

# 2. INVESTIGATION SCOPE

다음 범위만 조사한다.

## A. PROPERTY_MASTER 전체 목록

현재 Firestore `PROPERTY_MASTER`의 210개 문서를 읽는다.

각 문서에 대해 최소 다음을 추출한다.

- document_id
- property_id
- complex_id
- complex_name
- household_count
- status
- tradable
- initial_price
- source_file
- snapshot_version
- created_at
- updated_at
- created_by 또는 생성 주체를 나타내는 필드
- 기타 생성 경로 추적에 유용한 필드

---

# 3. 209개 기준 목록과 비교

PLAY-07.2에서 확정된 Property Master 기준 목록을 사용한다.

기준:

- 전체 Property Master: 209
- NORMAL: 200
- INCOMPLETE: 9

현재 Firestore 210개와 기준 209개를 비교하여:

> **기준 목록에는 없지만 Firestore에만 존재하는 1개 문서**

를 정확히 특정한다.

단순히 count만 비교하지 않는다.

반드시 실제 `property_id` / `document_id`를 특정한다.

---

# 4. EXTRA DOCUMENT IDENTITY

추가된 1개 문서에 대해 다음을 확인한다.

### Identity

- property_id
- document_id
- complex_id
- complex_name
- address
- household_count
- x / y
- representative_area
- initial_price
- status
- tradable

### Source

- source_file
- snapshot_version
- 원본 CSV에 존재하는지 여부
- 원본 CSV의 검색코드와 일치하는지 여부
- PLAY-07.2 기준 목록에 존재했는지 여부

---

# 5. CREATION TRACE

가장 중요한 부분이다.

해당 문서가 **언제, 어떤 경로로 생성되었는지** 조사한다.

가능한 경우 다음을 확인한다.

- Firestore create/update timestamp
- Cloud Function logs
- 실행 함수명
- request_id
- batch_id
- season_id
- scenario_id
- deployment/revision
- 해당 문서를 생성했을 가능성이 있는 코드
- 초기 데이터 ingestion 로그
- Season initialization 로그
- 테스트 fixture / seed script
- E2E test script
- manual script 실행 기록

특히 다음 가능성을 각각 조사한다.

1. 정상적인 PLAY-07.2 Property Master 데이터
2. 신규 원본 데이터가 추가된 것
3. Season Initialization 과정에서 생성된 문서
4. 테스트 데이터
5. 이전 테스트의 잔여 문서
6. 중복/잘못 생성된 문서
7. 개발자가 수동으로 생성한 문서
8. 기타

확인되지 않은 경우 추측하지 말고 `UNKNOWN`으로 표시한다.

---

# 6. SOURCE DATA RECONCILIATION

추가 문서가 원본 Property Master 데이터에 실제 존재하는지 확인한다.

다음 결과 중 하나로 분류한다.

### CASE A
원본 CSV에도 존재하며 PLAY-07.2 기준 목록에 포함되어 있어야 하는 정상 문서.

### CASE B
원본 CSV에는 존재하지만 PLAY-07.2 기준 목록에는 없는 문서.

### CASE C
원본 CSV에는 존재하지 않으며 테스트/시스템 과정에서 생성된 것으로 보이는 문서.

### CASE D
원본과 기준을 모두 확인할 수 없어 판단 불가.

---

# 7. 209 VS 210의 의미를 판단하지 말 것

이번 단계에서는 다음을 결정하지 않는다.

- 209가 맞다.
- 210이 맞다.
- 210번째 문서를 삭제해야 한다.
- Reconciliation을 210으로 바꿔야 한다.
- Property Master를 다시 생성해야 한다.

이번 단계의 목적은 **사실 확인**뿐이다.

판단이 필요한 경우:

> `DECISION REQUIRED`

로 표시하고 사용자 승인을 기다린다.

---

# 8. NO FIX

이번 작업에서는 어떠한 수정도 하지 않는다.

특히 다음을 하지 않는다.

- `PROPERTY_MASTER` 문서 삭제
- 문서 수정
- 209 → 210 수정
- Reconciliation 수정
- 기대값 변경
- 데이터 재수집
- Property Master 재생성
- E2E 재실행
- Season 재생성

---

# 9. REPORT FORMAT

다음 형식으로 보고서를 작성한다.

# PLAY-07.3 PROPERTY MASTER EXTRA DOCUMENT INVESTIGATION REPORT

## 1. Investigation Status

- READ-ONLY
- BLOCKED
- NO MODIFICATION PERFORMED

## 2. Property Master Count

| Item | Count |
|---|---:|
| PLAY-07.2 기준 | 209 |
| 현재 Firestore | 210 |
| Difference | +1 |

## 3. Extra Document

| Field | Value |
|---|---|
| document_id | |
| property_id | |
| complex_id | |
| complex_name | |
| status | |
| tradable | |
| initial_price | |
| source_file | |
| snapshot_version | |
| created_at | |
| updated_at | |

## 4. Baseline Comparison

- Baseline에 존재: YES / NO / UNKNOWN
- Firestore에만 존재: YES / NO
- 원본 CSV에 존재: YES / NO / UNKNOWN

## 5. Creation Trace

| Evidence | Result |
|---|---|
| Firestore timestamp | |
| Creating function | |
| Request ID | |
| Season ID | |
| Batch ID | |
| Test script | |
| Seed/fixture | |
| Manual creation | |
| Other | |

## 6. Root Cause Classification

다음 중 하나:

- NORMAL DATA
- NEW SOURCE DATA
- TEST DATA
- STALE TEST DATA
- DUPLICATE DATA
- MANUAL DATA
- SYSTEM-GENERATED DATA
- UNKNOWN

근거를 반드시 함께 작성한다.

## 7. Evidence

실제 Firestore / GCP 로그 / source data / code evidence를 기록한다.

단순한 추측이나 PASS 문구는 Evidence로 인정하지 않는다.

## 8. Impact

현재 Reconciliation 실패와의 관계를 설명한다.

## 9. Decision Required

결정이 필요한 사항만 작성한다.

예:

- 추가 문서를 유지할 것인지
- 제거할 것인지
- Property Master 기준을 재정의할 것인지
- Reconciliation 기준을 데이터 기반으로 변경할 것인지

결정하지 말고 질문 형태로 남긴다.

## 10. FINAL STATUS

반드시 다음 중 하나:

- INVESTIGATION COMPLETE — DECISION REQUIRED
- INVESTIGATION INCOMPLETE
- BLOCKED

---

# 10. STOP CONDITION

보고서 작성이 끝나면 즉시 STOP한다.

다음 작업을 수행하지 않는다.

- 수정
- 배포
- 삭제
- 재생성
- Queue 변경
- E2E 재실행
- 추가적인 Phase 진행

**사용자 승인 전에는 어떤 Fix도 수행하지 않는다.**

---

# 핵심 원칙

이번 단계에서는:

> **"209가 맞는가, 210이 맞는가"를 결정하는 것이 아니라 "210번째가 무엇인지"를 밝힌다.**

그리고:

> **원인을 모른 채 숫자를 맞추지 않는다.**

마지막으로:

> **읽기 → 비교 → 추적 → 보고 → STOP**

의 순서를 지킨다.
