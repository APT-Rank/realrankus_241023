# PLAY-07.4 INCIDENT REPRODUCTION REPORT

## 1. 개요
운영 중 데이터 오염(Data Corruption)이나 해킹 등 논리적 오류가 발생했을 때, 시스템의 보호 체계(Reconciliation)가 이를 차단하고 스냅샷을 기반으로 장애를 재현할 수 있는지 검증한다.

## 2. 장애 주입 (Fault Injection) 시나리오
- **Season**: `S_INCIDENT_{timestamp}`
- **상황**: Period 1 도중 (P1 처리 직전)
- **주입된 오류**: `PLAY_PLAYER_ASSET`의 `cash_total` 필드를 외부에서 강제로 999,999,999로 변조 (비인가된 자산 수정)

## 3. 재현 및 시스템 방어 결과
1. **P2 진입 시도 (Reconciliation 트리거)**
   - `createEconomicBatch` 정상 실행 (배치 생성 성공)
   - `dispatchBatchChunks` 실행 -> Chunk 처리 중 Worker가 기존 Decision Log 합산 값(Audit Trail)과 현재의 강제 변경된 `cash_total`이 불일치함을 감지.
2. **방어 기제 작동 (Circuit Breaker)**
   - `runReconciliation` 단계에서 `cash_total` 불일치 에러 Throw.
   - `transaction_status`가 `TRANSACTION_PAUSED`로 안전하게 전이됨.
   - 추가적인 자산 변동 방지 및 게임 클럭 정지(`clock_status: PAUSED`).

## 4. 스냅샷 데이터의 재현 유효성
- 사전에 정의한 `STATE_SNAPSHOT_SPEC` 형태의 데이터만 있으면, 로컬에서 정확히 해당 데이터로 DB를 덮어씌워 동일한 Reconciliation 실패를 재현할 수 있음을 확인하였다.
- 스냅샷 데이터를 통해 문제의 원인(강제 주입된 자산 데이터)을 명확하게 파악할 수 있었다.

## 5. 결론
- **방어 성공 여부: PASS**
- 시스템은 정의되지 않은 비정상 데이터 변조를 Reconciliation 단계에서 완벽하게 감지하고 운영을 중단시켜 확산을 방지하였다.
