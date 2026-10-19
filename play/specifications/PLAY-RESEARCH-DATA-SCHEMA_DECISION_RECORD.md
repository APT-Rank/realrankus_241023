# PLAY-RESEARCH-DATA-SCHEMA_DECISION_RECORD

## 1. Decision Status
**RESEARCH DATA SCHEMA REVIEW VERDICT: APPROVED WITH GAPS**

## 2. Rationale
현재 PLAY Engine의 RAW 데이터 구조(L100 검증 완료)는 경제 시뮬레이션의 무결성(Integrity)과 상태 변화(Trajectory)를 완벽하게 보존하고 있습니다. 그러나 **행동주의 연구(Behavioral Research) 관점에서 원인(Cause)과 의도(Intent)를 분석하기 위한 핵심 데이터가 누락**되어 있습니다. 

이를 보완하지 않고 Human Season을 진행할 경우, "결과적으로 누가 얼마를 벌었는가"는 알 수 있지만 "왜 그런 결정을 내렸고 어떤 정보에 영향을 받았는가"라는 핵심 연구 가설을 입증할 수 없습니다.

## 3. Required Action Plan

### Must Fix Before Human Season (Blockers)
1. **R_EXPOSURE 로깅 구현:** 참여자가 거래를 결심하는 화면(UI)에서 노출된 정보(가격, 호가, GLI, 거시경제 지표)의 시점 Snapshot을 기록하는 로직 추가.
2. **R_VALIDATION 실패 로깅 구현:** `Insufficient cash`, `Insufficient supply` 등 유효성 검사 실패 시 HTTP 에러만 리턴하지 않고 비동기(Background)로 시도 내역(의도)을 로그 DB에 적재하는 파이프라인 추가.

### Can Defer (Post Human Season / Analysis Phase)
1. **R_OUTCOME / R_TRAJECTORY 계산 뷰(View):** BigQuery에서 R_STATE_SNAPSHOT(현재 `PLAY_DECISION_LOG`)을 기반으로 1년/3년/10년 단위의 변화량을 계산해 내는 Data Mart 구축은 사전 구현할 필요 없이 사후 분석 시점에 진행 가능합니다.

## 4. Verified Area Protection
* 위 "Must Fix" 사항은 기존 트랜잭션 트리의 크리티컬 경로(`purchasePrimaryProperty` 등)에 병목을 주지 않는 **비동기 로깅(Async/Event-driven) 형태**로만 결합되어야 합니다. 기존 Verified Area(Economic Engine, Batch Processing, Idempotency)의 내부 구조 수정은 일절 불필요합니다.
