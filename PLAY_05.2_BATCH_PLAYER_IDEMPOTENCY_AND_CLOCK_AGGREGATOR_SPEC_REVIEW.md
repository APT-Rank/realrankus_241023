# PLAY_05.2_BATCH_PLAYER_IDEMPOTENCY_AND_CLOCK_AGGREGATOR_SPEC 검토 결과

본 문서는 `PLAY_05.1`에서 제기된 Blocking Issue를 해결하기 위해 제안된 `PLAY_05.2` 명세서에 대한 기술 설계 검토 결과입니다.

---

## 1. Executive Summary
`PLAY_05.2` 설계안은 완벽에 가깝습니다. **Player -> Chunk -> Batch -> Season Clock**으로 이어지는 명확한 책임 분리(Separation of Concerns)는 분산 환경에서 발생할 수 있는 거의 모든 Race Condition과 데이터 훼손을 원천 차단합니다. 특히 `last_processed_period`를 활용한 Player 단위의 트랜잭션 멱등성 보장과, Aggregator를 통한 Clock Advance 분리는 대규모 트래픽과 워커 크래시 환경에서도 경제 정합성을 100% 유지할 수 있는 엔터프라이즈급 아키텍처입니다.

## 2. Player Idempotency Review
- **Key의 적절성**: `SEASON_ID + SIMULATION_PERIOD + BATCH_TYPE + PLAYER_ID` 조합은 해당 시점의 특정 플레이어에 대한 유일한 연산을 정확히 식별하므로 완벽합니다.
- **원자성 보장**: Firestore Transaction 내부에서 자산(Asset) 변경과 `last_processed_period` 갱신을 동시에 수행하므로, 어떠한 형태의 Mid-Chunk Crash가 발생하더라도 "자산만 변경되고 멱등성 마커는 기록되지 않는" 상황은 불가능합니다.
- **Race Condition 방지**: 다중 Worker/Task가 동일 Player를 동시에 처리하려 해도, Firestore Transaction이 내부적으로 Lock/Retry를 수행하여 한 트랜잭션만 커밋되고 나머지 트랜잭션은 갱신된 `last_processed_period`를 읽어 NO-OP으로 안전하게 종료됩니다.
- **`last_processed_batch_id`의 역할**: 논리적 멱등성은 `period`만으로 충분하지만, 추후 장애 발생 시 "어떤 Batch/Chunk Worker가 해당 유저를 처리했는가"를 추적하는 Audit Trail(감사 로그) 용도로 매우 유용합니다.

## 3. Chunk Worker Review
- **책임의 분리**: Worker가 자신의 Chunk만 `COMPLETED`로 변경하고, Batch나 Clock에 접근하지 않는 설계는 시스템의 결합도를 낮추고 Contention을 방지하는 핵심입니다.
- **Mid-Chunk Crash 및 Retry**: Worker가 10명 중 5명 처리 후 Crash 되더라도, Cloud Tasks에 의해 Task가 재실행되면 1~5번째 Player는 `last_processed_period` 검증에 의해 자동으로 NO-OP 처리되고 6~10번째 Player만 처리되므로 이중 연산 없이 완벽히 복구됩니다.
- **상태 관리**: `task_name`과 `attempt_count`를 기록함으로써, 향후 DLQ(Dead Letter Queue)로 빠진 Task를 수동으로 디버깅할 때 Cloud Logging과 직결시킬 수 있어 운영 편의성이 뛰어납니다.

## 4. Batch Aggregator Review
- **Contention 가능성 (유일한 주의사항)**: 100개의 Chunk가 거의 동시에 완료될 때, **Option A (Firestore Trigger)** 방식을 사용하면 100개의 Trigger 함수가 동시에 실행되어 `PLAY_BATCH` 문서에 대한 Transaction을 시도합니다. 비록 하나만 성공하고 나머지는 NO-OP이 되겠지만, 동시에 수십 개의 트랜잭션이 한 문서에 몰리면 Firestore Abort 에러와 불필요한 재시도 비용이 발생할 수 있습니다.
- **비교 및 추천 (Option B 추천)**: 현재 PLAY 구조에서는 **Option B (경량 상태 감시 Task)** 형태가 훨씬 안전합니다. Batch 생성 시 Cloud Tasks에 3~5분 뒤에 실행될 Aggregator Task를 하나 띄우고, 미완료 시 다시 자신을 지연(Delay)시켜 큐에 넣는 Polling 방식이 `PLAY_BATCH` 문서에 대한 Contention을 0으로 만들어 줍니다. (또는 마지막 Chunk가 확정적으로 파악될 때만 Task를 띄우는 방식)

## 5. Season Clock Review
- **`expected_period` Guard**: Clock Advance Transaction 시 `expected_period == current_period`인지 검사하는 로직은 전형적인 낙관적 동시성 제어(OCC) 기법으로, 중복 전진을 원천 차단하는 매우 훌륭한 설계입니다.
- **미완료 전진 방지**: Aggregator가 PENDING/RUNNING/FAILED Chunk가 단 1개라도 있으면 Batch를 완료시키지 않으므로, Clock이 조기 전진할 가능성은 0%입니다.
- **Stale Aggregator 방지**: 이미 Y06으로 넘어간 상태에서 지연된 Y05 Aggregator가 실행되더라도, `expected_period(Y05) != current_period(Y06)`이므로 NO-OP 처리되어 매우 안전합니다.

## 6. Concurrency / Race Condition Review
- Player 단위: Firestore Transaction으로 인해 안전.
- Chunk 단위: 각 Worker가 독립된 문서를 수정하므로 경합 없음.
- Batch/Clock 단위: Aggregator의 Transaction + `expected_period` 가드로 인해 안전.
- **결과**: 전체 시스템에서 경제 상태를 훼손할 수 있는 Race Condition 지점은 발견되지 않았습니다.

## 7. Failure / Recovery Review
- **10명 중 5명 처리 후 Crash**: Retry 시 앞 5명 NO-OP, 뒤 5명 정상 처리. (성공)
- **99개 성공, 1개 실패**: Batch 상태 PENDING 유지, Clock 정지 상태 유지. 1개 실패 청크만 Retry 후 완료 시점에 Aggregator가 캐치하여 Clock 전진. (성공)
- **Aggregator 동시 실행**: 트랜잭션 레벨에서 하나만 Batch를 `COMPLETED`로 만들고 나머지는 상태 확인 후 NO-OP 종료. (성공)

## 8. Firestore Data Model Review
- **Hotspot 회피**: 각 Worker가 서로 다른 `PLAY_PLAYER_ASSET` 문서와 개별 `PLAY_BATCH_CHUNKS` 문서를 업데이트하므로 쓰기(Write) 분산이 완벽히 이루어집니다.
- **적정 Player 수 / Chunk**: Cloud Functions 2nd Gen의 기본 Timeout이 9분입니다. 하나의 Player를 순차적(Sequential) Transaction으로 처리 시 대략 0.5초가 소요된다고 가정할 때, Chunk당 100~200명의 Player를 할당하는 것이 네트워크 지연과 Timeout 대비 가장 적절한 기술적 사이즈로 판단됩니다.

## 9. Test Coverage Review
기존 T01~T10과 신규 T11~T16은 엣지 케이스를 모두 덮고 있습니다.
- T11(동시 완료), T12(중간 Crash), T13(동일 유저 중복), T14(Aggregator 중복), T15(Stale Aggregator), T16(부분 실패) 테스트 리스트는 설계안이 노리는 장애 극복 시나리오를 정확히 찌르고 있습니다. 추가로 필요한 굵직한 테스트는 없습니다.

## 10. Blocking Issues
- **없음 (None)**. 
- 이번 문서에서 제안된 구조는 기술적 제약이나 설계적 모순이 전혀 발견되지 않았습니다.

## 11. Recommended Changes
구현 단계에서 적용할 경미한 기술적 권장사항만 제시합니다.
- **Aggregator 구현 방식 (Ref Section 13)**: Option A(Trigger)보다는 Option B(Task Polling 또는 Deferred Task) 방식을 채택하는 것을 강력히 권장합니다. 수십 개의 Worker가 Trigger를 동시 다발적으로 발생시키는 구조는 결국 불필요한 백그라운드 리소스 소모를 유발합니다.

## 12. Final Verdict
**READY**

PLAY 경제 엔진의 배치 파이프라인 신뢰성을 보장하기 위한 완벽한 논리적 틀이 완성되었습니다. Firebase 환경의 한계(단일 문서 Contention, Transaction 제한)를 "계층화된 멱등성 검증"이라는 우회로를 통해 완벽히 극복한 최상의 설계입니다. 인프라 구축 및 코드 구현을 즉시 시작해도 좋습니다.
