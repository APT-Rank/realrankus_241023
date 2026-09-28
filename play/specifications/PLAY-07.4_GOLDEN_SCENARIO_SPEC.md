# PLAY-07.4 GOLDEN SCENARIO SPEC

## 1. 개요
본 문서는 APT-Rank 게임 엔진의 검증된 모듈들이 실제 운영 환경에서 연속적으로 동작할 때 예상되는 "가장 이상적이고 완전한 기준 실행 흐름(Golden Scenario)"을 정의한다. 이 시나리오는 향후 시스템 변경 시 회귀 테스트의 절대 기준으로 사용된다.

## 2. 시나리오 목적
- 개별적으로 검증된 모듈(Economic Engine, Batch, Market, Reconciliation)의 통합 연동 확인
- `TRANSACTION_NORMAL` 상태 유지 증명
- 결정론적 상태 전이(Deterministic State Transition)의 기준 데이터(Baseline) 확보

## 3. 시나리오 구성 (SCENARIO_3 기준)

### 3.1. 초기 상태 (Initial State)
- **Season**: `S_GOLDEN_{timestamp}`
- **Player**: 1명 (`admin_user`, 초기 자본금 100M)
- **Primary Supply**: 공급량 1개 (Property: `PROP_1`, 가격 10M)

### 3.2. 실행 순서 (Execution Sequence)
1. **Period 0 → 1 전이 (Economic Period)**
   - `createEconomicBatch(MONTHLY)` 호출
   - `dispatchBatchChunks` 실행
   - **예상 결과**: 플레이어에게 Period 0의 수입/지출 적용. Cash 변동 발생.
2. **Player Action (Property BUY)**
   - 플레이어가 Period 1 중에 `purchasePrimaryProperty` 호출하여 10M짜리 부동산 매수 (수수료 2% 포함 10.2M 지출)
   - **예상 결과**: Cash 잔고 10.2M 감소, Property 수량 1 증가, Net Worth 재계산. `PLAY_DECISION_LOG`에 거래 기록.
3. **Period 1 → 2 전이 (Reconciliation)**
   - `createEconomicBatch(MONTHLY)` 호출
   - `dispatchBatchChunks` 실행
   - **예상 결과**: Period 1의 수입/지출 적용 및 **Reconciliation** 정상 통과 (Season 상태 `TRANSACTION_PAUSED` 방지).

## 4. 검증 결과
- 테스트 스크립트(`play_07_4_test.ts`)를 통해 시나리오가 100% 성공적으로 실행됨을 증명하였다.
- 실행 중 어떠한 에러나 롤백, 트랜잭션 중단(`TRANSACTION_PAUSED`)도 발생하지 않고 `NORMAL` 상태를 완벽히 유지하였다.
