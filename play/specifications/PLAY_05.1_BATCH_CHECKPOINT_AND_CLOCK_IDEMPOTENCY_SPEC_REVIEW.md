# PLAY_05.1_BATCH_CHECKPOINT_AND_CLOCK_IDEMPOTENCY_SPEC 검토 결과

본 문서는 `PLAY_05.1` 설계안에 대한 기술 검토 결과입니다. 
지시된 두 가지 핵심 사항("동일 Simulation Period는 경제적으로 정확히 한 번만 확정된다", "Worker가 언제든 죽을 수 있어도 이미 반영된 경제 상태가 다시 반영되지 않는다")을 중심으로 검증을 수행했습니다.

---

## 1. Executive Summary
제안된 Chunk 기반의 Batch Checkpoint와 Season Clock 전진(Advance) 제어 로직은 분산 환경의 실패(Crash, Timeout)를 안전하게 다루기 위한 훌륭한 아키텍처입니다. 특히 Clock Advance Atomicity(모든 청크 완료 시에만 시간 전진)는 경제 게임의 정합성을 보장하는 강력한 규칙입니다. 
그러나 **Chunk 내 다수의 Player를 처리할 때의 개별 멱등성(Per-Player Idempotency)** 부분과 **Batch 완료를 판단하기 위한 Worker 간의 트랜잭션 경합(Contention)** 부분에서 치명적인 누락이 발견되어 보완이 필요합니다.

## 2. Architecture Compatibility
- Firebase Cloud Functions, Firestore Transactions, Cloud Tasks 기반의 인프라와 매우 잘 호환됩니다.
- Scheduler의 엣지 케이스(중복 호출, 미호출)를 Server Authority 관점에서 차단한 설계는 GCP 인프라 철학에 완벽히 부합합니다.

## 3. Batch Checkpoint Review
- **Chunk 상태 전이**: `PENDING` -> `RUNNING` -> `COMPLETED` / `FAILED` 모델은 안전합니다.
- **Resume 상황**: Cloud Tasks는 Timeout 설정값을 넘기면 해당 Task를 자동으로 실패 처리하고 큐에 다시 넣으므로, 재시도(Retry) 워커는 단순히 이전에 처리하던 Chunk를 다시 들고 오게 됩니다. 이 때 Chunk의 `FAILED` 상태를 다시 `RUNNING`으로 바꾸며 재개하는 흐름은 문제없습니다.

## 4. Idempotency Review (Critical Finding)
**[BLOCKING ISSUE]**
- **문제점**: 6.2 항목에서 Batch의 `idempotency_key`를 `SEASON_ID + SIMULATION_PERIOD + BATCH_TYPE`으로 정의했습니다. 그러나 5. Chunk Worker Idempotency 항목을 보면 하나의 Chunk 워커가 다수의 Player(예: 500명)를 처리하다가 중간에 Crash가 날 수 있다고 가정합니다.
- Firestore는 한 트랜잭션 내에서 최대 500건의 작업만 허용하며, 500명의 유저 데이터를 단일 트랜잭션으로 묶는 것은 락(Lock) 경합 등 심각한 성능 저하를 유발합니다. 따라서 워커는 유저별로(또는 소규모 묶음으로) 별도의 트랜잭션을 실행하게 됩니다.
- 워커가 100번째 유저까지 처리 후 죽었을 때, `idempotency_key`가 전체 Batch 단위 하나뿐이라면, 1번째~100번째 유저가 이미 처리되었는지 개별적으로 판별할 수 없습니다. (이중 차감/지급 발생 위험)
- **결론**: Player 경제 상태 반영 시의 멱등성 키는 반드시 **Player 단위**여야 합니다.

## 5. Season Clock Review
- **Atomicity 보장**: 10번 항목의 규칙(모든 Chunk COMPLETED 시에만 Current Period 변경)은 "경제 시간이 엇갈리는 현상(Player A는 5년차, B는 4년차)"을 근본적으로 차단하는 완벽한 2-Phase Commit 모델입니다.
- 스케줄러가 두 번 호출되어도, 첫 번째로 생성된 `batch_id`가 멱등성 로그에 기록되어 두 번째 호출은 NO-OP 처리되므로 안전합니다.

## 6. Failure / Recovery Scenarios
- **Scheduler 누락**: `last_successful_period`를 기준으로 Alert 발생 -> 수동 복구(또는 자동 캐치업 스크립트 실행). (안전함)
- **Worker Crash 중간 실패**: 재시도 시 이미 처리된 Player를 건너뛰어야 하지만, 앞서 지적한 Idempotency Key 문제가 해결되어야만 완벽한 Recovery가 가능합니다.
- **Reconciliation 실패**: `TRANSACTION_PAUSED` 전환 로직 정상 동작.

## 7. Race Condition / Concurrency Review (Critical Finding)
**[BLOCKING ISSUE]**
- **문제점**: 100개의 Chunk Worker가 동시에 자신의 작업을 마치고 "내가 마지막 Chunk인지 확인 후 Season Clock을 전진시킨다"는 로직을 수행하면, 100개의 Worker가 동시에 부모 `PLAY_BATCH` 문서를 읽고 쓰려 하면서 엄청난 Firestore Contention(경합)이 발생하여 다수가 실패(Abort)하게 됩니다.
- **결론**: Worker가 직접 Batch 상태를 확인하여 Clock을 올리는 구조는 안 됩니다.

## 8. Missing Fields / Missing States
- **`PLAY_PLAYER_ASSET` 문서**: 해당 플레이어가 마지막으로 처리된 경제 틱을 식별할 수 있는 `last_processed_period`(예: "Y05") 필드가 추가되어야 합니다.
- **Chunk 문서**: 재시도 추적을 위해 Cloud Tasks의 `task_name` 필드 기록이 필요합니다.

## 9. Test Coverage Review
제안된 T01~T10 테스트 항목은 매우 우수합니다. 다음 2가지 테스트를 추가로 권장합니다.
- **T11 (Contention Test)**: 수십 개의 Chunk가 1초 내에 동시에 `COMPLETED` 상태로 끝날 때, Season Clock이 정확히 한 번만 전진하는지 테스트.
- **T12 (Mid-Chunk Crash Test)**: Worker가 1개 Chunk 내 10명의 유저 중 5명을 처리한 직후 강제 크래시를 유발하고, 재개 시 정확히 나머지 5명만 처리되는지(앞선 5명이 중복 처리되지 않는지) 테스트.

## 10. Blocking Issues
1. **Player 단위 멱등성 키 부재**: Batch 단위 식별자만으로는 Chunk 내부에서 부분 실패한 Worker의 정확한 Resume을 보장할 수 없어 "이중 차감/지급(중복 경제 연산)" 데이터 손실 위험이 있습니다.
2. **Season Clock 전진 시의 트랜잭션 경합**: 다수의 Chunk Worker가 병렬 완료 시 단일 문서(`PLAY_BATCH` 또는 `PLAY_SEASON`)에 몰려 병목을 일으킬 구조입니다.

## 11. Recommended Changes

**[DESIGN DECISION REQUIRED]**
위 Blocking Issue 해결을 위해 설계 문서에 다음 2가지를 반영할 것을 제안합니다.

1. **Section 6.2 & 7수정 (Player 단위 멱등성 추가)**:
   - Worker가 Player의 자산을 변경할 때 사용하는 멱등성 키를 `SEASON_ID + SIMULATION_PERIOD + BATCH_TYPE + PLAYER_ID`로 정의합니다.
   - 트랜잭션 내에서 `PLAY_PLAYER_ASSET`을 업데이트할 때, 해당 문서 내부 필드로 `last_processed_period`를 같이 기록(비교 후 갱신)하여 이중 처리를 트랜잭션 레벨에서 원자적으로 차단해야 합니다.

2. **Section 10 수정 (Batch Aggregator 도입)**:
   - Chunk Worker는 자신의 Chunk 문서만 `COMPLETED`로 업데이트하고 쿨하게 종료합니다.
   - Firestore Trigger(`onUpdate` of Chunk Collection)를 사용하거나, 별도의 경량 상태 감시 Task를 두어, `남은 PENDING Chunk 수`가 0이 되는 시점에 단 한 번만 Season Clock을 전진시키도록 구조를 변경해야 합니다.

## 12. Final Verdict
**READY AFTER FIXES**

Chunk 단위의 쪼개기 및 Clock Advance 보류라는 거시적 설계는 분산 시스템의 실패를 잘 이해한 훌륭한 해법입니다. 다만, 미시적(Chunk 내부)인 관점에서 Firestore 제한 사항을 고려한 **Player-level Idempotency**와 **Batch Aggregation 방식**에 대한 구체화(Recommended Changes)가 설계서에 편입된다면 바로 구현에 착수할 수 있는 완벽한 신뢰성 명세서가 됩니다.
