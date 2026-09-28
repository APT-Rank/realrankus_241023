# PLAY_05_BACKEND_INFRASTRUCTURE_RELIABILITY_SPEC 검토 결과

경제 상태와 데이터 정합성(Reliability & Integrity)을 최우선으로 하여, 기존 프론트엔드 중심의 아키텍처와 Firebase/GCP 환경에서 발생할 수 있는 장애 상황을 분석했습니다.

---

## 1. Executive Summary
PLAY 인프라 설계는 **“일부 장애가 발생해도 경제 세계의 정합성은 파괴되지 않는다”**는 목적을 달성하기에 논리적으로 타당하며 우수합니다. Firebase Security Rules를 통한 Client 차단과 Cloud Functions + Firestore Transaction 조합을 통한 Server Authority 확보는 경제 게임의 무결성을 유지하는 올바른 접근입니다. 다만, 단일 Document에 대한 트랜잭션 집중(Contention) 문제와 배치 프로세스의 중간 상태(Checkpointing) 복구 메커니즘을 실제 구현 시 좀 더 구체화해야만 설계한 수준의 장애 내성(Fault Tolerance)을 확보할 수 있습니다.

## 2. Architecture Reliability Review
- **Sever Authority 통제:** 기존 RealRankus의 Client 쿼리 방식을 배제하고 모든 Intent를 Cloud Functions로 넘겨 처리하는 구조는 완벽한 격리를 제공합니다.
- **비동기 큐 (Cloud Tasks / PubSub) 도입:** Season Initialization 및 대규모 Batch를 Chunk로 나누어 큐로 밀어넣는 설계는 Function Timeout(9분)을 우회하고 재시도를 보장하는 훌륭한 패턴입니다.
- **의존성 분리:** BigQuery Export나 외부 데이터 수집 파이프라인(기존 RealRankus Pipeline)을 비동기로 분리함으로써 분석 기능 장애가 핵심 경제 엔진에 영향을 미치지 않도록 설계한 점이 견고합니다.

## 3. Failure Mode Analysis

| ID | Component | Failure | Impact | Detection | Recovery | Data Loss Risk | Severity |
|---|---|---|---|---|---|---|---|
| F01 | Client-Network | BUY 요청 체결 후 Client Timeout | 서버 체결 성공, 클라이언트는 타임아웃 오류 노출 | Client 재접속 시 상태 확인 | Server 상태 기준 동기화 (Client 재시도 시 Idempotency 차단) | None | Low |
| F02 | Cloud Function | 로직 실행 중 Crash | 트랜잭션 처리 중단 | Error Rate Alert | Firestore Transaction 자동 롤백 및 에러 반환 | None | Low |
| F03 | Firestore | 초인기 단지에 수백 명 동시 BUY | Transaction Contention(경합) 발생 | Tx Retry Limit 초과 로그 | 엔진 차원 자동 재시도 (실패 시 유저에게 혼잡 에러 리턴) | None | Medium |
| F04 | Cloud Tasks | Batch Worker 중간 Crash | 특정 Chunk 처리 실패 | Task Retry Alert | Idempotency Key 확인 후 안전하게 재실행 | None | Medium |
| F05 | Cloud Tasks | Worker Max Retry 초과 | 경제 Batch 일부 영구 누락 | DLQ Alert | 알람 수신 후 DLQ의 Payload 확인하여 수동 복구 트리거 | Low | High |
| F06 | Cloud Scheduler | Season Clock 스케줄러 미실행 | 경제 시계 일시 정지 | Season Lag Alert | 스케줄러 재시작 또는 수동 진행 트리거 | None | High |
| F07 | Cloud Scheduler | Season Clock 스케줄러 중복(2번) 실행 | 시간 중복(건너뜀) 위험 | - | Batch/Clock 상태 검증(Idempotency)으로 두 번째 실행 자동차단 | None | Critical |
| F08 | Worker (Batch) | 1만명 중 8천명 처리 후 Worker 다운 | Batch 중단 | Checkpoint = FAILED | Checkpoint의 Chunk Index를 바탕으로 8001번째부터 재개 | None | High |
| F09 | Firestore Rule | 해커가 Client에서 Cash를 직접 변조 시도 | 데이터 훼손 시도 | Access Denied 로그 | Security Rules에 의해 원천 차단 | None | Critical |
| F10 | BigQuery Export | Sync 스트리밍 장애 | Analytics 차트 일시 멈춤 | Export Error 로그 | 메모리/큐에 버퍼링 후 Eventual Consistency 재전송 | None | Low |
| F11 | Firebase Auth | Auth 서비스 리전 일시 장애 | 로그인 및 신규 트랜잭션 불가 | GCP 인프라 Alert | 시스템 복구 대기 (기존 성립된 트랜잭션 및 상태는 유지) | None | Medium |
| F12 | Primary Init | 초기 공급 생성 Function Timeout | 전체 단지 생성 불완전 | Batch Error 로그 | 단지별 Chunking을 통해 실패한 단지들만 멱등성 재실행 | None | High |
| F13 | Reconciliation | 검증 스크립트 Asset 불일치 탐지 | 심각한 상태 붕괴 | Reconciliation Alert | 자동 Emergency Stop 발동 -> 로그 분석 후 수동 보정 | Low | Critical |
| F14 | Deployment | 버그 포함 Cloud Function 배포 | 경제 규칙을 깬 잘못된 체결 가능성 | Metric 이상 폭증 | 즉시 Emergency Stop, 코드 롤백 후 PITR 데이터 롤백 적용 | High | Critical |
| F15 | RealRankers DB | Season 시작 전 외부 DB 연동 실패 | Season Initialization 불가 | Init Error Alert | Season 상태를 PENDING 유지 후 수동 재시도 | None | Medium |

## 4. Single Point of Failure
1. **`PLAY_SEASON` Firestore Document:**
   - **Why it is SPOF:** 시간(Simulation Time)과 Emergency Stop 상태(`TRANSACTION_PAUSED`)를 관리하는 유일한 관문입니다. 이 문서에 장애(Read 불가 등)가 생기면 모든 Transaction이 멈춥니다.
   - **Failure Impact:** 전체 시스템 마비(All BUY/SELL Fail).
   - **Current Mitigation / Improvement:** Firestore 99.999% SLA에 의존. 읽기 부하를 줄이기 위해 Client는 실시간 Listener(Snapshot)로 가져오고, 트랜잭션 내부에서만 Read를 수행하도록 구조화.
2. **Cloud Scheduler for Season Clock:**
   - **Why it is SPOF:** 경제 시간을 움직이는 유일한 틱(Tick) 발생기입니다.
   - **Failure Impact:** 경제 정지(시간이 흐르지 않아 Rent, Tax, Interest 등 발생 불가).
   - **Current Mitigation / Improvement:** 헬스체크(Season Lag Monitoring)를 통해 마지막 실행 시간이 N시간 지연되면 Alert 발생 후 수동 트리거 스크립트 준비.

## 5. Data Integrity Review
- `cash.total = cash.available + cash.locked` 및 `cash >= 0` 검증은 Firestore Transaction 내부에서 반드시 읽기(Get) 직후 유효성 검사 로직을 통과할 때만 쓰기(Update)를 허용하게 함으로써 완벽한 무결성을 달성할 수 있습니다.
- "Transaction이 생성되었으나 Cash가 미차감"되는 경우는 Firestore Transaction의 Atomic 연산을 사용하면 불가능하므로, 아키텍처적으로 안전합니다.

## 6. Transaction / Idempotency Review
- 모든 변경 요청 시 `idempotency_key`(예: UUID, 또는 `Order_ID + action`)를 받아 Firestore Transaction 안에 `PLAY_IDEMPOTENCY_LOG` 등의 형태로 락을 기록하는 패턴(Atomic Create)을 권장합니다.
- 이를 통해 클라이언트 재접속(F01) 및 태스크 큐 재시도(F04) 시 Duplicate Transaction이 원천 차단됩니다.

## 7. Batch / Season Clock Recovery
- 단순히 "처리된 인원수(processed_players)"만 기록해서는 병렬 Worker 장애 복구가 어렵습니다.
- **[DESIGN DECISION REQUIRED] 개선 제안**: Batch Controller는 전체 Player를 N명 단위의 Document 덩어리(Chunk)로 나눈 `Chunk ID` 배열을 만들고, Worker는 성공 시 해당 `Chunk ID = COMPLETED`로 마킹하는 구조여야 합니다. 그래야 중간 실패 시 미완료 Chunk만 멱등성 있게 재처리(Resume)할 수 있습니다.

## 8. Queue / Worker / DLQ Review
- Cloud Tasks는 Max Retry 및 DLQ를 완벽히 지원합니다. 단, 수동 개입이 필요한 DLQ의 특성상 DLQ에 떨어지는 Task는 즉시 Slack이나 PagerDuty 등으로 알람을 쏘도록 Cloud Logging -> Log Router 설정을 구축해야 합니다.

## 9. Reconciliation Review
- **실행 빈도**: 매 Season Clock (예: 현실 시간 매일 자정)이 넘어가기 직전에 경량화된 배치로 총 통화량(Total Cash) 및 소유권 개수 무결성을 대조하는 것을 권장합니다.
- **불일치 발견 시**: 즉시 `Emergency Stop`(`TRANSACTION_PAUSED`) 상태로 변경하여 오염된 데이터가 추가로 양산되는 것을 막는 자동화(Circuit Breaker)가 가능합니다.

## 10. Emergency Stop Review
- 구조적 타당성: `PLAY_SEASON` 문서의 `status` 필드를 트랜잭션 함수 시작마다 확인하는 것만으로 완벽한 차단막이 형성됩니다.
- READ는 허용하되, `set`, `update` 등을 유발하는 모든 Callable Function 로직 상단에 `if (season.status === 'TRANSACTION_PAUSED') throw HttpsError;` 를 추가하면 됩니다. 매우 이상적이고 간단한 설계입니다.

## 11. Backup / Disaster Recovery
- **도입 권장 기술**: Firestore **Point-in-Time Recovery (PITR)**.
- PITR을 활성화하면 1분 단위로 과거 7일 이내의 특정 시점(마이크로초)으로 전체 데이터베이스를 즉시 복원할 수 있습니다.
- 치명적인 코드 버그 배포로 데이터가 훼손된 경우(F14), Emergency Stop 발동 직전의 타임스탬프로 PITR 롤백을 수행하는 가장 강력한 재해 복구(DR) 수단이 됩니다.

## 12. Security Review
- Firestore Security Rules를 다음과 같이 구성해야 합니다:
  ```text
  match /PLAY_{path=**} { 
      allow read: if request.auth != null && (user own data limits); 
      allow write: if false; 
  }
  ```
- 쓰기 권한은 오직 `firebase-admin` SDK를 사용하는 Cloud Functions에만 부여하므로, Client에서의 직접 조작 및 변조는 원천 불가능합니다.

## 13. Monitoring / Observability
- GCP Cloud Monitoring(Stackdriver)을 통해 Cloud Functions의 Error Rate, Execution Time 및 Firestore Transaction Abort 지표를 추적할 수 있습니다.
- 관측성 강화를 위해 모든 체결 로그(Decision Log)에는 Client Request 시점에 생성된 고유 `request_id` (또는 `trace_id`)를 심어 프론트엔드 버튼 클릭부터 백엔드 데이터 변경까지 한 줄기로 추적 가능하게 해야 합니다.

## 14. Blocking Issues
1. **Batch Checkpoint 스키마 명확화**: (Section 7 참고) 단순 Counter 방식의 Checkpoint로는 재처리(Resume) 중복 방지가 불가능하므로, Chunk/Cursor 기반의 상태 기록 모델로 수정해야 구현이 가능합니다.
2. **인프라 셋업 순서**: 기능 개발 전 Cloud Tasks 큐 생성, Firestore PITR 활성화, Log Alerts 생성 등 SRE(인프라 신뢰성) 기반 작업이 반드시 **Phase 1**에 위치해야 합니다.

## 15. Recommended Technical Changes
- **동시성 문제(Contention) 완화**: Primary Supply 단지별 생성이나 수백 명의 동시 주문 시, Firestore Transaction이 빈번하게 Abort될 수 있습니다. MVP 단계에서는 이를 에러로 유저에게 넘기되, 실패 에러 코드를 `CONCURRENT_UPDATE`로 내려보내 프론트엔드에서 자동으로 1~2초 후 Exponential Backoff 방식으로 재요청(Auto-Retry)하는 로직을 UI에 삽입하는 것을 권장합니다.
- **Idempotency 컬렉션 분리**: Idempotency Key 기록을 Transaction 내부에서 단일 `PLAY_IDEMPOTENCY_LOGS` 컬렉션에 문서를 쓰는 방식으로 구성하면 멱등성 검증의 표준화가 가능합니다.

## 16. Final Verdict
**READY AFTER FIXES**

설계는 대단히 원칙적이고 안전합니다. 경제 시스템 보호를 위해 가용성(Availability)이나 편의성보다 정합성(Integrity)을 우선한 철학은 Cloud Functions 트랜잭션 아키텍처에 정확히 부합합니다. 위에서 제안한 **Batch Chunk 단위의 Checkpoint 복구 방식**만 보완된다면 즉시 인프라 구축과 백엔드 데이터 모델링 작업에 착수해도 좋습니다.
