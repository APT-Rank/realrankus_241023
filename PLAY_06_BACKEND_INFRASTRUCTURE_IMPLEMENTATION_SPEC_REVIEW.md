# PLAY_06_BACKEND_INFRASTRUCTURE_IMPLEMENTATION_SPEC 검토 결과

본 문서는 PLAY-06 Backend Infrastructure 구현 명세에 대한 기술 검토 결과입니다. 
지시하신 바와 같이 코드를 구현하지 않고 설계의 타당성, 기존 코드베이스와의 호환성, Firebase/GCP 환경에서의 제약 사항을 중심으로 냉정하게 검증했습니다.

---

## 1. Executive Summary
PLAY-06 명세는 PLAY 경제 세계의 뼈대(Backend Infrastructure)를 안전하고 확장 가능하게 구축하기 위한 훌륭한 설계입니다. 특히 기존 RealRankers 프로젝트가 백엔드 코드(Cloud Functions) 없이 정적 웹(Static Web) 중심으로 구성되어 있음을 확인했으며, 완전한 Server Authority 모델을 백지 상태에서 새로 구축할 수 있어 레거시 코드와의 충돌 위험이 전혀 없다는 점이 매우 고무적입니다. 이 인프라는 PLAY-07 경제 엔진과 향후 모든 기능들의 탄탄한 토대가 될 것입니다.

## 2. Existing RealRankers Compatibility
- **현재 코드베이스 상태 (Q4 답변)**: `d:\APT-Rank_Git` 내부를 확인한 결과, `package.json`, `firebase.json`, `firestore.rules`, `functions/` 폴더가 존재하지 않습니다. 즉, 기존 서비스는 Firebase Client SDK를 HTML/JS에 직접 포함시켜 프론트엔드에서 데이터베이스와 직접 통신하는 구조로 파악됩니다.
- **분리 가능성**: 매우 완벽하게 분리할 수 있습니다. `firebase init functions` 명령어를 통해 완전히 새로운 Node.js/TypeScript 환경을 구성하게 되며, 기존 레거시 백엔드 코드와의 패키지 충돌이나 Namespace 충돌(`PLAY_`)은 원천적으로 존재하지 않습니다.

## 3. Firebase/GCP Architecture Review
- 설계된 Cloud Functions 2nd Gen, Firestore, Cloud Tasks 구조는 완벽하게 적합합니다.
- **Q2 답변 (빠진 리소스)**: 설계상에 직접적으로 명시되지 않았지만 실제 구현 시 **"Cloud Tasks Queue"** 사전 생성과 Cloud Functions가 Task를 큐에 넣고 실행할 수 있는 **"Service Account 권한 (Cloud Tasks Enqueuer)"** 부여 작업이 인프라 세팅(Phase 1) 단계에 필수적으로 포함되어야 합니다.

## 4. Firestore Data Model Review
- 제안된 컬렉션 계층 구조(`PLAY_SEASON`, `PLAY_PLAYER`, `PLAY_PLAYER_ASSET` 등)는 논리적으로 완벽하며, 향후 확장(PLAY-07)에 충분히 대비되어 있습니다.
- **Q1 답변 (데이터 구조 재작업 가능성)**: 분산 환경을 고려해 Batch와 Chunk, Player 단위를 나누었으므로 나중에 대규모로 데이터를 뜯어고칠 가능성은 극히 낮습니다.
- **Hotspot 회피**: Player별로 개별 문서를 트랜잭션 처리하므로 단일 문서 병목(Hotspot)이 발생하지 않습니다.
- **Index 필요성**: `PLAY_BATCH_CHUNKS` 컬렉션에서 Aggregator가 특정 `batch_id`로 필터링하고 `status`를 조회해야 하므로, Firestore **복합 인덱스(Composite Index: `batch_id` ASC, `status` ASC)** 선언이 반드시 필요합니다.

## 5. Player Idempotency Review
- `SEASON_ID + SIMULATION_PERIOD + BATCH_TYPE + PLAYER_ID` 멱등성 키와 `last_processed_period` 검증 조합은 Firestore Transaction 내에서 사용될 때 **완벽한 원자성과 멱등성을 보장**합니다.
- 동일 Player를 Worker A와 Worker B가 동시에 처리하려 할 때, Firestore Transaction의 낙관적 동시성 제어(OCC) 기법에 의해 하나의 트랜잭션만 커밋되고 나머지 하나는 Abort 후 Retry 됩니다. Retry 된 트랜잭션은 갱신된 `last_processed_period`를 읽고 NO-OP 처리되므로 완벽히 안전합니다.

## 6. Batch/Chunk Review
- Chunk 사이즈 100~200은 Cloud Functions 2nd Gen의 기본 타임아웃(9분) 내에 처리하기에 매우 넉넉하고 안정적인 수치입니다. (문서 명시대로 Configurable Parameter로 빼는 것이 바람직합니다.)

## 7. Cloud Tasks Review
- Cloud Tasks를 활용한 Chunk Dispatch 및 Retry 구조는 매우 강력합니다.
- **At-least-once delivery 방어**: Task가 중복(Duplicate) 전달되더라도 앞서 5번 항목에서 검증한 Player Idempotency 덕분에 경제 연산 중복은 절대 발생하지 않습니다.

## 8. Batch Aggregator Review
- **Deferred Cloud Task / Polling 방식**: 100개의 청크 완료 시 수많은 트랜잭션이 한 번에 몰리는 Firestore Trigger의 단점(Contention)을 완벽히 회피할 수 있는 훌륭한 선택입니다.
- **주의점**: Aggregator Task는 미완료 시 자신을 다시 큐에 넣어야 하므로 무한 루프를 방지할 Max Retry 횟수나 만료 시간(Timeout)을 둬야 합니다.

## 9. Season Clock Review
- `Batch.status == COMPLETED` 및 `Batch.simulation_period == Season.current_simulation_period`의 이중 검증 조건은 "동일 Period의 두 번 전진" 및 "Period 건너뛰기"를 기술적으로 철저히 차단합니다. 
- 스케줄러 중복 호출이나 Aggregator 동시 호출 시에도 문제없이 방어됩니다.

## 10. Security Review
- **Q5 답변 (Security Rules 충돌 가능성)**: "Client Write Block" 규칙(`allow write: if false;`)을 적용하고, Admin SDK로만 제어하는 구조는 Firebase의 보안 철학과 정확히 일치합니다.
- 기존 RealRankers 데이터 접근에 영향을 주지 않도록 `match /PLAY_{document=**}` 라우팅을 별도로 분리하여 작성하면 아무런 충돌 없이 Server Authority를 구현할 수 있습니다.

## 11. Reliability Review
- Emergency Stop(`TRANSACTION_PAUSED`) 방식은 강력합니다. 데이터를 변경하는 모든 Callable Function의 첫 줄에 `if (season.transaction_status === 'TRANSACTION_PAUSED') throw new HttpsError('unavailable', 'System paused');` 한 줄만 공통 유틸리티로 삽입하면 전체 시장과 경제 변경이 즉각 차단됩니다.

## 12. Deployment Review
- 코드 Rollback과 데이터 복구(PITR)를 분리한 개념은 실무적인 재해 복구 정책으로 매우 올바른 접근입니다. 
- 환경(DEV/STAGING/PROD) 분리는 Firebase CLI의 Multi-Project 기능을 통해 쉽게 달성할 수 있습니다.

## 13. Future PLAY-07 Compatibility
- **Q6 답변 (PLAY-07 연결 난이도)**: 전혀 어렵지 않습니다. PLAY-06은 빈 껍데기 형태의 `calculatePlayerPeriodEconomy()` 등 함수 경계(Interface)를 제공합니다. PLAY-07 단계에서는 이 인터페이스 내부에 수입/지출/세금 등의 비즈니스 로직만 주입하면 되므로 구조적 분리가 완벽히 되어 있습니다.

## 14. Blocking Issues
- **없음 (None)**.
- **Q3 답변 (예상치 못한 Race Condition)**: 식별되지 않았습니다. 현재 설계된 아키텍처는 Race Condition을 억제하기 위해 트랜잭션 경계와 책임 주체를 매우 잘 정의하고 있습니다.

## 15. Recommended Changes
구현 돌입 시 참고할 경미한 권고 사항입니다.
- **인프라 설정 코드화**: Firestore 복합 인덱스(`firestore.indexes.json`)와 보안 규칙(`firestore.rules`) 파일을 이번 단계에 코드베이스(`d:\APT-Rank_Git`) 내에 생성하여 버전 관리에 포함시킬 것을 권장합니다.
- **Aggregator Timeout 설정**: Aggregator Task가 Batch 완료를 너무 오래 기다릴 경우(예: Worker 영구 실패로 DLQ로 빠졌을 때), 무한 Polling을 하지 않도록 방어 코드(예: Batch Started_at 기준 N시간 경과 시 Alert 발생 후 Polling 종료)를 추가해야 합니다.

## 16. Implementation Readiness
- 이번 PLAY-06 단계에서 실제 Primary/Secondary 시장 거래나 복잡한 대출/세금(Economic Engine) 로직을 **제외(Out of Scope)**하고, 백엔드의 뼈대(인프라, 데이터 파이프라인, 멱등성 보장 로직)만 먼저 구축하는 것은 매우 훌륭하고 실무적인 애자일(Agile) 접근입니다.

## 17. Final Verdict
**READY**

기존 프로젝트 코드베이스와 독립적이면서도 견고한 분산 배치(Batch) 기반 백엔드 시스템을 구축할 수 있는 이상적인 상태입니다. 인프라 기반, 데이터 모델, 멱등성, 스케줄링 등의 아키텍처 설계가 완벽하므로 지체 없이 `firebase init functions`를 통해 인프라 구현(Phase 1)에 착수하셔도 좋습니다.
