# AG 실행 프롬프트 — PLAY IA-03C Actual Buy 및 검증

아래 지시를 순서대로 수행하라. 이 작업의 목적은 **IA-03C Actual Buy를 실제 경제 상태 변경까지 포함해 검증 완료하는 것**이다. 구현 완료·테스트 실행·배포 완료를 서로 혼동하지 말고, 증거 없는 PASS를 선언하지 않는다.

## 먼저 읽을 문서와 고정 정책

1. 가장 먼저 `PLAY_IA-03C_DECISION_AND_VERIFICATION_POLICY_v1.0.md`를 읽고, 이를 Product Owner approved fixed constraints / execution policy로 취급한다.
2. 다음 두 감사 보고서를 읽고 현재 상태의 근거로 사용한다.
   - `PLAY_BACKEND_INTEGRATION_AND_IA03C_REPORT.md`
   - `PLAY_BACKEND_INTEGRATION_PHASE1_2_REPORT.md`
3. 두 보고서는 다른 시점의 상태를 담고 있다. 전자는 `getPlayerState`, backend callable 통합, `property_id` 기반 supply resolve 및 IA-03B.1 server-side fee 적용 코드를 보고한다. 후자는 이전 contract 상태, 당시 고정 2.0% fee, Phase 1/2 승인 Gate STOP, NOT DEPLOYED / NOT VERIFIED를 기록한다. 현재 repository를 확인하고 실제 코드와 실행 evidence로 차이를 해소하라. 보고서 주장만으로 현재 구현/검증 상태를 가정하지 말라.

## 승인된 정책 — 변경 금지

- Starting Capital은 Season/Scenario config 구조이며 Season 1은 **700,000,000 KRW**.
- `property_id → season-specific PLAY_PRIMARY_SUPPLY` resolve는 서버에서 수행한다.
- Listing은 사용자가 보는 거래 대상이고 Primary Supply는 공급 가능한 Backend 경제 객체다. 두 개념을 섞지 않는다.
- Research Data Policy는 지금 90일 retention을 고정하지 않는다. 데이터 종류, 수집 목적, 고지·동의, 연구 활용 범위, 철회, 보관기간 정책은 Human Season 전에 별도 확정해야 한다.
- Participant Identity도 Human Season 전에 별도 정책으로 확정한다. anonymous auth는 현재 테스트 용도다.
- IA-03B.1 transaction cost를 서버 권위로 적용한다.
- Production 배포/실제 사용자 경제 mutation은 이 작업 승인에 포함되지 않는다. 실제 Production mutation은 명시적 별도 승인 전 금지한다.

## 실행 절차

### 1. 현재 상태와 보호 영역 확인

현재 codebase, 관련 문서, 기존 engine/reliability/security/research logging 인프라를 확인한다. 이미 구현된 부분을 보존하고 재사용한다. 중복 backend나 새 architecture를 만들지 않는다. `purchasePrimaryProperty`, `getPlayerState`, Firestore rules, season join/config, UI flow, transaction/research logging 경로와 관련 테스트를 확인한다.

변경 전 git status 및 관련 diff를 기록한다. 핵심 engine, reliability, security rules, transaction 및 research logging을 보호 영역으로 취급한다. 보호 영역 변경이 필수라면 정확한 파일·이유·전후 계약·영향·검증 계획을 먼저 기록하고, 고정 정책과 충돌하면 즉시 hard stop한다.

### 2. Contract Gate

인증·권한, least-privilege `getPlayerState`, `purchasePrimaryProperty` 입력/출력, `season_id`/`property_id`에서 Primary Supply로의 유일한 서버 해석, 가격·면적·수수료 계산, state schema, 오류계약을 확인하고 테스트한다. 미인증 및 타 사용자 state read는 거부되어야 한다.

`getPlayerState`는 호출자의 자기 Season 상태만 필요한 필드로 반환해야 한다. `purchasePrimaryProperty`는 클라이언트가 보낸 가격·면적·fee를 신뢰하면 안 된다. 공급이 없거나 모호하면 fail closed한다.

### 3. Emulator E2E Gate

실제 `/play` UI의 전체 흐름을 실행한다:

`LISTING → LISTING DETAIL → BUY INTENT → FUNDING CHECK → COST CHECK → EXPECTED RESULT → BUY CONFIRMATION → ACTUAL BUY → BUY RESULT → MY WORLD`

emulator의 실제 backend 및 경제 상태를 사용해 매수 전후 `cash_available`, `cash_total`, `locked_cash`, ownership, Primary Supply, transaction을 확인한다. mock economic state나 mock transaction으로 PASS시키지 않는다. BUY RESULT 성공은 commit 확인 이후에만 표시되고 MY WORLD는 서버 상태 재조회 결과와 일치해야 한다.

Season 1 join/초기화가 이 흐름에 해당되면 config에서 700,000,000 KRW가 서버 권위로 적용되는 것도 확인한다.

### 4. Failure/Recovery Gate

잔액 부족, 권한 오류, 잘못된 입력, supply 미존재/소진, transaction 실패, timeout, 재시도 및 research logging 장애를 다룬다. 실패 전후 snapshot에서 허용되지 않은 경제 mutation이 없음을 확인한다. rollback/retry 결과, durability/DLQ 경로 및 오류 응답을 검증한다. partial commit을 감추지 않는다.

### 5. Concurrency/Idempotency Gate

동일 idempotency key 재시도 및 동일 supply 동시 구매를 실제 emulator에서 실행한다. 중복 현금 차감, ownership, supply 감소, transaction이 없어야 한다. 경쟁 조건에서도 정확히 허용된 수만큼만 성공해야 한다. 응답이 timeout된 뒤 재시도해도 결과가 한 번만 반영되는지 확인한다.

### 6. Research Traceability Gate

신규 로깅 체계를 재작성하지 말고 기존 verified research logging infrastructure를 사용한다. decision/research event와 trace/participant/Season/transaction 연결을 확인하고, 실패 시 durability와 DLQ/recovery를 검증한다. 이는 향후 Human Season의 고지·동의·보관기간·identity 정책 승인을 대신하지 않는다.

### 7. Regression Gate

변경 관련 기존 engine, market, reliability, security, research logging 검증을 실행한다. 코드 변경 전/후 diff와 보호 영역 영향도 기록한다. 회귀 실패가 있으면 아래 반복 절차를 따른다.

### 8. Deployment/Live Verification Gate

이 Gate는 별도 승인 후에만 진행할 수 있다. 가능한 경우 배포 준비 상태와 live verification 계획·설정을 정리하되, 명시적 별도 승인 없이는 deploy하지 말고 Production 경제 데이터를 mutate하지 않는다. 현재 결론은 실제 증거가 없는 한 **NOT DEPLOYED / NOT VERIFIED**로 유지한다. Live gate가 승인/실행되지 않았다면 전체 Production 완료를 선언하지 않는다.

## 실패 반복 원칙

테스트 실패 시 반드시 다음 순서로 반복한다:

`원인 분석 → 최소 수정 → 동일 테스트 재실행 → 관련 regression 재실행 → PASS까지 반복`

테스트를 제거·완화·건너뛰거나 mock으로 대체해 PASS 처리하지 않는다. 재현 불가능한 실패도 기록한다. 안전한 해결이 불가능하거나 사실 확인이 막히면 그 지점에서 hard stop하고 증거와 blocker를 보고한다.

## 진행 금지 조건

- 어느 Verification Gate든 FAIL, 미실행 또는 raw evidence 부족이면 다음 Gate로 진행하지 않는다.
- 모든 Gate PASS 전에는 IA-04, SELL, People, Season, visual refinement 등 후속 기능을 구현하지 않는다.
- Human Season에 필요한 Research Data/Participant Identity 정책은 별도 사전 Gate이며 본 IA-03C 통과와 합쳐서 승인하지 않는다.
- Production mutation은 명시적 별도 승인 전 금지다.
- mock economic state/transaction, client-side authority, 임의의 비용 산식, 기존 verified engine/logging 재작성으로 검증을 우회하지 않는다.

## 증거 및 최종 보고서

각 테스트의 raw evidence를 보존하고 쉽게 찾아볼 수 있는 경로를 기록한다. Gate별로 `PASS` 또는 `FAIL`만 명확히 쓰고, 미실행은 미실행이라고 표시한다. 최종 보고서에는 아래 항목만 간결하고 빠짐없이 포함한다.

1. 현재 상태: 코드 존재, emulator 검증, 배포, live 검증 상태를 각각 분리.
2. 변경 파일 및 변경 전/후 diff 요약, 보호 영역 검토.
3. 테스트 결과와 raw evidence 위치.
4. 실패/원인/수정/동일 테스트 재실행/회귀 이력.
5. 각 Gate의 PASS/FAIL/미실행 상태.
6. 남은 blocker와 별도 승인이 필요한 항목.
7. 허용된 다음 단계.

모든 Gate PASS를 입증하지 못했다면 IA-03C 검증 완료라고 주장하지 말라. 이 실행 정책 자체는 Production 배포나 Production mutation 승인이 아니다.

