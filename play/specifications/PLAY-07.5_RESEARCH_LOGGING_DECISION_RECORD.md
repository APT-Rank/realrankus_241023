# PLAY-07.5 RESEARCH LOGGING DECISION RECORD

## 1. Issue: 트랜잭션과 무관한 이벤트(Exposure, Decision)의 로깅 위치

### Context
Research Schema 상에는 AI 또는 사용자가 시스템에 Action을 던지기 전에 인지한 환경 정보(`EXPOSURE`)와 의도(`DECISION`)를 남겨야 한다. 하지만 이 데이터는 Economic Engine의 무결성에 어떠한 영향도 주지 않아야 한다.

### Decision
- **결정**: `purchasePrimaryProperty.ts` 등 주요 트랜잭션 진입점에서 클라이언트로부터 `research_context` 파라미터를 추가로 수신하도록 허용하고, 해당 정보가 존재할 경우 트랜잭션 밖(함수 시작 부근)에서 비동기로 `RESEARCH_EVENTS`에 기록(Fire and Forget)한다.
- **이유**: 클라이언트/테스트 레이어의 변경을 최소화하고, 서버의 트랜잭션 록스(Idempotency Log 등)와 동일한 Request/Trace ID로 묶어 Traceability를 보장하기 위함. Transaction Engine의 속도와 무결성(Rollback)에 영향을 주지 않음.

## 2. Issue: 실패한 요청(Validation Failure)의 로깅

### Context
기존의 PLAY Engine은 자금 부족이나 공급 부족 등 유효성 검사 실패 시 `HttpsError`를 던지고 즉시 종료되었다. 이로 인해 DB에는 어떠한 로그도 남지 않아 연구 데이터 상으로는 '환경 노출'과 '결정'은 존재하나 '결과'가 비어버리는 GAP 현상이 발생했다.

### Decision
- **결정**: Cloud Function 내부 트랜잭션 처리부를 `try/catch`로 감싸고, 실패할 경우 `VALIDATION(REJECTED)` Event를 생성한 후 에러를 재발생(Re-throw)시키도록 수정.
- **이유**: 기존 에러 핸들링 로직(Client로 에러 전달 등)을 그대로 유지하면서, 실패 이벤트만 가로채어 로깅 가능.

## 3. Issue: 성공 이벤트 로깅 및 Idempotency 고려

### Context
성공 시 트랜잭션 내부에서 기록할 것인가, 트랜잭션 외부에서 기록할 것인가. 내부에서 기록 시 Firestore 재시도 시점에 동일 로깅 코드가 여러 번 실행될 우려가 있다.

### Decision
- **결정**: `db.runTransaction` 밖에서 `Validation(Success)`와 `Transaction(Completed)` 이벤트를 비동기로 기록한다.
- **이유**: Firestore의 `runTransaction` 재시도 메커니즘을 오염시키지 않으며, 트랜잭션이 최종 확정(Commit)된 후에만 TRANSACTION 이벤트를 1회 기록할 수 있기 때문이다. 멱등성으로 인해 `ALREADY_PROCESSED`가 반환되는 경우, 새로운 `TRANSACTION` 이벤트를 중복 발행하지 않도록 분기 처리하였다.
