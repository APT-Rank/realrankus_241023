# PLAY-07.5 RESEARCH LOGGING IMPLEMENTATION REPORT

## 16. 구현 전 반드시 수행할 작업

**Q1. R_EXPOSURE, R_DECISION, R_ACTION이 생성되는 가장 적합한 위치는 어디인가?**
- 현재 PLAY Engine에서 AI/User Action을 처리하는 Cloud Function(`purchasePrimaryProperty.ts`)의 시작점입니다. 
- 이 위치는 `research_context` 객체로 넘어오는 Exposure, Decision 메타데이터를 Action 시점과 가장 확실하게 결합할 수 있는 곳입니다. 클라이언트나 테스트 스크립트에서 Action을 요청할 때 해당 메타데이터를 함께 전송하도록 허용하고, Cloud Function이 트랜잭션을 시작하기 전이나 성공 직후에 이를 Async로 Logging 합니다.

**Q2. 트랜잭션 실패(Validation 실패)를 R_VALIDATION/Transaction으로 남기기 위해 수정해야 할 최소한의 코드는 무엇인가?**
- `purchasePrimaryProperty.ts` 내부의 `try/catch` 블록입니다. 
- 트랜잭션이 성공하면 `VALIDATION(SUCCESS)`와 `TRANSACTION(COMPLETED)` 로그를 남기고, 실패하여 `HttpsError`가 `catch` 블록으로 떨어지면 `VALIDATION(REJECTED)` 로그에 에러 코드(`validation_code`)와 사유(`validation_reason`)를 남긴 후 원래 에러를 다시 `throw`하도록 수정했습니다.

**Q3. R_TRANSACTION에서 기존 Economic Engine의 트랜잭션 시스템을 변경하지 않고 성공/실패 여부를 분리하는 방법은 무엇인가?**
- 기존 `db.runTransaction` 내부의 로직(상태 업데이트, `DECISION_LOG` 생성 등)은 전혀 건드리지 않습니다. 
- 대신 트랜잭션이 성공적으로 완료되어 반환된 직후(Transaction commit 후) 또는 Exception이 발생한 `catch` 블록에서 `admin.firestore().collection('RESEARCH_EVENTS').doc().set(...)`을 통해 기존 트랜잭션 밖에서 독립적으로 Firestore에 이벤트를 기록합니다.

## 1. 구현 내용

- **로거 모듈 구현**: `src/play/research/researchLogger.ts`를 생성하여 `logResearchEventAsync` 함수를 구현. 에러 발생 시 무시(`catch`)하여 Economic Engine의 Critical Path에 영향을 주지 않도록 설계.
- **purchasePrimaryProperty 수정**: 클라이언트 요청의 `research_context`에 있는 `exposure`, `decision` 정보를 파싱하여 각각 `EXPOSURE`, `DECISION`, `ACTION` 이벤트를 기록하도록 변경.
- **VALIDATION 및 TRANSACTION 기록**: 트랜잭션 성공/실패 여부에 따라 `VALIDATION` 결과를 비동기로 로깅하고, 성공 시 `TRANSACTION`을 추가 로깅.

## 2. 테스트 결과

- **TEST-01 Successful Action**: PASS
- **TEST-02 Rejected Action**: PASS
- **TEST-03 Duplicate Request**: PASS
- **TEST-04 Research Writer Failure**: PASS
- **TEST-05 Successful Traceability**: PASS
- **TEST-06 Failed Traceability**: PASS

## 3. Data Dictionary
별도 `PLAY-RESEARCH-DATA-DICTIONARY.md` 생성 예정.

## 4. Decision Record
별도 `PLAY-07.5_RESEARCH_LOGGING_DECISION_RECORD.md` 생성 예정.
