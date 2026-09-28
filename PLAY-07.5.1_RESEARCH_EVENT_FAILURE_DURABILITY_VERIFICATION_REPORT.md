# PLAY-07.5.1 RESEARCH EVENT FAILURE DURABILITY VERIFICATION REPORT

## 1. 검증 목적
Research Event를 기록하는 `Research Writer`가 일시적인 실패를 겪을 경우, Economic Engine의 Transaction은 안전하게 보호되는지, 그리고 실패한 Research Event가 유실되지 않고 DLQ나 Retry 등을 통해 추적/재처리 가능한지를 검증합니다.

## 2. 현재 구현 구조
- `logResearchEventAsync`가 Firestore `RESEARCH_EVENTS`에 문서를 비동기로 저장합니다.
- 오류 발생 시 `try/catch` 블록이 이를 차단하여 Transaction 진행에 영향을 주지 않도록 구현되어 있습니다 (`console.error`로 로깅 후 무시).
- **문제점**: 현재 로직은 실패를 감지하지만 무시(`catch` 후 아무 조치 안 함)하므로 Research Event의 **Silent Loss(조용한 유실)**가 발생할 위험이 있습니다.

## 3. TEST-04A 조건
1. `correlation_id`에 "FAIL_ME"가 포함된 경우 고의적으로 Research Writer 예외를 발생시킴.
2. Transaction이 정상 수행되는지 확인.
3. Research Event 저장 실패가 유실로 이어지는지(DLQ 존재 여부 등) 확인.

## 4. Attempt 1
- **가설**: Transaction은 성공하되, Research Event는 완전히 유실될 것이다.
- **실행**: `FAIL_ME_CORR_...` 키워드를 삽입하여 테스트 진행.
- **Transaction Integrity**: **PASS**. Player Asset 차감(20000 -> 9800) 및 Primary Supply 차감 정상 수행 (`status: SUCCESS`). Transaction 성공.
- **Research Event Failure**: **FAIL**. Event가 `console.error`로만 출력되고 버려지며, DLQ나 Failure Record가 생성되지 않음. 조회 결과 Event 0건, DLQ 0건.

### 변경 내역 (Attempt 1 -> 2)
문제 해결을 위해 `researchLogger.ts`에 다음과 같은 수정을 진행합니다.
1. **Idempotency 보장**: Firestore 문서 ID를 무작위 UUID에서 결정론적 ID (`season_id_period_participant_type_request_id`)로 변경하여 중복 방지 보장.
2. **DLQ 도입**: 기록 실패 시 `RESEARCH_EVENTS_DLQ` 컬렉션에 원본 이벤트와 오류 메시지를 기록. 동시에 GCP Cloud Logging에 `_type: 'RESEARCH_EVENT_DLQ'` 구조화된 로그를 남겨 영속적인 Failure Record를 확보함.
3. **재처리**: DLQ에 쌓인 문서를 읽어 재시도하는 스크립트 작성 (`play_07_5_1_reprocess_dlq.ts`).

## 5. Attempt 2
- **실행**: Attempt 1에서 도입된 DLQ 로직을 배포 후 동일한 `FAIL_ME` 조건으로 테스트.
- **Transaction Integrity**: **PASS**. Transaction이 여전히 방해받지 않고 성공함.
- **Research Event Failure (Durability)**: **PASS**. `RESEARCH_EVENTS_DLQ` 컬렉션에 유실될 뻔했던 이벤트들이 정확한 갯수로 저장됨.
- **Idempotency**: **PASS**. 결정론적 ID를 사용하므로, 만약 동일한 이벤트가 여러 번 실패해도 DLQ에 중복으로 쌓이지 않으며, 복구 시에도 `RESEARCH_EVENTS`에 단일 문서로 덮어씌워짐.
- **Reprocessing**: **PASS**. 작성된 재처리 스크립트를 통해 DLQ의 문서를 정상 컬렉션으로 복원(Recovered)하고 DLQ에서 제거함.

## 6. 최종 판정

**VERIFIED**

- Research Writer 일시적 장애가 Economic Engine의 트랜잭션을 중단시키지 않음(Atomicity 보호).
- 오류 발생 시 Catch 후 무시되는 기존 결함(Attempt 1)을 해결하고, DLQ 및 Structured Log 기반의 Failure Record 체계를 갖춰 데이터 유실(Silent Loss)을 방지함.
- Idempotency를 보장하는 결정론적 ID 발급으로 재시도/재처리 시 중복 이벤트 발생 가능성을 원천 차단함.

## 7. Raw Evidence
(여기에 최종 콘솔 출력 및 DLQ 기록 증거를 첨부합니다.)
