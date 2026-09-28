# PLAY-07.3 Phase 5~7 Progress Report

## 1. 현재 진행 상황 (Current Status)

PLAY-07.3 Phase 5 (Batch Aggregator) ~ Phase 7 (Season Clock Advance)의 Cloud Tasks 큐 전환 작업을 진행 중입니다. 기존 HTTP `onRequest` 기반의 내부 서비스 통신 시 발생하던 401 Unauthorized (OIDC Token) 검증 문제를 우회하고, 재시도 안전성(Retry-ability)을 확보하기 위해 모든 백그라운드 작업을 Firebase v2 `onTaskDispatched`로 마이그레이션했습니다.

## 2. 발생한 이슈 및 원인 (Issues & Root Causes)

연속적으로 E2E 검증 스크립트(`verify_batch_phase5_to_7.ts`)가 타임아웃으로 실패한 원인은 다음과 같습니다.

1. **Firebase CLI의 큐 미생성 버그 (Queue Provisioning Bypass)**
   - 초기 배포 시 `--only functions:aggregateBatch` 등 개별 함수 필터를 사용해 배포했습니다.
   - Firebase CLI v13+ 에서는 개별 함수 배포 시, 해당 함수의 Cloud Tasks Queue 생성을 건너뛰는 현상이 발생했습니다.
   - 이로 인해 `getFunctions().taskQueue().enqueue()`가 에러 없이 호출되었음에도 큐가 존재하지 않아 작업이 유실되었습니다.
2. **수동 URL 생성 오류 (Cloud Run vs Cloud Functions Endpoint)**
   - 큐 미생성 문제를 우회하고자 `@google-cloud/tasks` 패키지의 `createTask`를 직접 사용하고, URL을 `https://asia-northeast3-[프로젝트명].cloudfunctions.net/...` 형태로 직접 조합했습니다.
   - 하지만 Firebase Functions v2 (`onTaskDispatched`)는 내부적으로 Cloud Run 인프라(`*.a.run.app`)에 직접 배포되기 때문에, 기존 `cloudfunctions.net` 도메인으로는 요청이 도달하지 않았습니다.

## 3. 해결 조치 (Resolutions)

1. **기존 함수 삭제 후 완전 재배포**
   - 충돌을 방지하기 위해 기존에 잘못 배포된 함수(`aggregateBatch`, `runReconciliation`, `advanceSeasonClock`)를 강제 삭제했습니다.
   - 필터 없이 전체 함수 배포(`firebase deploy --only functions`)를 수행했습니다.
2. **Native Queue 생성 확인**
   - 현재 `asia-northeast3` 리전에 Firebase가 자동으로 생성한 Native 큐(`advanceSeasonClock`, `aggregateBatch`, `runReconciliation`)가 정상적으로 프로비저닝된 것을 확인했습니다.

## 4. 다음 단계 (Next Steps)

현재 코드에 임시로 적용된 수동 `createTask()` 로직(실패한 하드코딩 URL 방식)을 다시 안전한 Firebase Admin SDK의 `getFunctions().taskQueue('함수명').enqueue()` 방식으로 롤백해야 합니다.

큐 인프라가 완벽히 구성되었으므로, 해당 롤백만 진행하면 E2E 검증(`verify_batch_phase5_to_7.ts`)이 정상 통과할 것으로 확신합니다. 승인해 주시면 즉시 롤백 후 최종 검증을 완료하겠습니다.
