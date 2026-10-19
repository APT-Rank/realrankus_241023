# PLAY-07.1 INCOME & BASIC EXPENSE ENGINE 사전 검토(Pre-Review) 리포트

## 1. 현재 구현 상태 점검

* **Season Clock (`current_simulation_period`, `last_successful_period`)**: `createSeason` 등을 통해 생성 시 초기화되며, `advanceSeasonClock`에서 Batch 완료 상태를 검증 후 1씩 증가시키는 구조를 갖추고 있습니다.
* **PLAY_BATCH / PLAY_BATCH_CHUNKS**: `createEconomicBatch`와 `dispatchBatchChunks`에서 상태 갱신 및 Cloud Tasks 분할을 지원합니다.
* **PLAY_PLAYER_ASSET**: `types.ts` 및 `joinSeason.ts`에 초기 상태(현금 7억, 부채 0, 순자산 7억)가 선언되어 있으며, Client Write는 Firestore Security Rules로 차단된 상태입니다.
* **Cloud Tasks & OIDC/Internal Authentication**: `internalAuth.ts`를 통해 허용된 Service Account 토큰만 허용(2-Tier Security)하도록 PLAY-06.1에서 보안 경계가 성공적으로 안착되었습니다. (`processBatchChunk`, `aggregateBatch`, `advanceSeasonClock` 모두 `onRequest`로 보호 중)
* **Idempotency 구조**: `processBatchChunk` 트랜잭션 내부에서 `asset.last_processed_period === simulation_period` 검사를 통해 중복 처리를 방지(NO-OP)하고 있습니다.
* **runReconciliation**: 현재 구현되어 있지 않습니다.

---

## 2. 구분 요약 보고

### [A] 기존 구현과 명세가 일치하는 부분 (유지)
* **Server Authority 및 보안 경계**: OIDC 인증, Security Rules, `!request.auth` 제거 등 엄격한 보안 통제.
* **Idempotency**: Firestore Transaction 내 `last_processed_period` 검사 로직 및 `batch_id` 구조.
* **Batch Flow**: Cloud Tasks 큐잉 및 `createBatch` -> `dispatchChunks` -> `processChunk` -> `aggregateBatch` -> `advanceClock`로 이어지는 분산 처리 흐름.
* **초기 자산 설정**: `joinSeason.ts`에서 `Cash = 700M`, `Debt = 0`, `Property = 0`, `Financial Asset = 0`, `Net Worth = 700M`가 정확히 설정됨.

### [B] 기존 구현과 명세가 다른 부분
* 현재 `processBatchChunk`는 소득, 지출, 물가 상승률(Inflation) 등을 전혀 계산하지 않고 단지 `last_processed_period`만 갱신하는 뼈대(Skeleton) 코드 상태입니다. 현금 및 순자산의 실질적인 변동 로직이 비어 있습니다.
* `runReconciliation` 모듈이 존재하지 않습니다.
* 상태 변경을 추적할 수 있는 기본 Decision Log(또는 Event Log) 기록 기능이 없습니다.

### [C] PLAY-07.1 구현을 위해 새로 필요한 부분
* **Income Engine**: 5,000만 원(Starting) 기반 Simulation Period 단위 소득 계산 로직.
* **Basic Living Expense Engine**: 월 300만 원(연 3,600만 원) 기반 지출 차감 로직.
* **Inflation Engine**: 물가 상승률(Inflation Curve) 적용.
* **Decision Log Collection (`PLAY_DECISION_LOG`)**: 이벤트 타입, 이전 상태, 처리 후 상태를 기록하는 로직 및 스키마.
* **Reconciliation 로직**: Batch 상태와 Chunk/Player 처리 일관성을 검사하여 비상 정지(`TRANSACTION_PAUSED`)를 유발하는 기능.

---

## 3. 🚨 CONFLICT FOUND (구현 중단 및 확인 요청)

지시하신 원칙 "기존 코드와 문서의 값이 서로 다르면 임의로 선택하지 말고: CONFLICT FOUND 로 보고한 후 구현을 멈추고 확인을 요청하라"에 따라 다음 항목의 충돌/누락을 보고합니다.

1. **Inflation Curve 파라미터 누락**
   * 명세 11항: *"기존 PLAY-02 Scenario의 Inflation Curve를 그대로 사용한다."*
   * **충돌 원인**: `PLAY_02_ECONOMIC_ENGINE.md` 문서를 확인한 결과, **구체적인 물가상승률(Inflation rate) % 수치가 정의되어 있지 않습니다.**
2. **Income Curve 배율(Multiplier) 파라미터 누락**
   * 명세 9항: *"기존 PLAY-02에서 확정된 Career lifecycle, Income curve 파라미터를 그대로 사용한다."*
   * **충돌 원인**: PLAY-02의 13항(Income Curve)에는 성장/정체/감소의 "구간(Year 0~5 등)" 개념만 제시되어 있으며, *"실제 소득 배율은 구현 전에 확정해야 한다. 정확한 배율을 임의로 하드코딩하지 않는다."*라고 명시되어 있어 구체적인 소득 상승 배율 값이 없습니다.
3. **Simulation Period 단위 불명확**
   * 명세 6항: *"구체적인 period 단위와 Scenario 정의가 기존 PLAY-02 문서에 있다면 그 정의를 우선한다. 새로운 시간 단위를 임의로 추가하지 않는다."*
   * **충돌 원인**: PLAY-02에는 "1 real day ≈ 4 simulated months"라는 실시간-가상시간 맵핑만 존재할 뿐, Engine이 구동되는 1회의 `simulation_period` Tick이 '1개월'인지 '1년'인지에 대한 명시적 단위 정의가 없습니다 (T01 테스트에서는 Period 0 -> Period 1로 넘어갈 때 연봉과 연간 지출을 분할 차감할지 일시 차감할지 결정할 수 없음).

**지시 사항에 따라 구현을 멈추고 대기합니다. 위 누락된 수치(물가 상승률, 소득 곡선 배율)와 Period 시간 단위(1 Period = 1개월 or 1년?)에 대한 명확한 규칙 제공을 요청합니다.**
