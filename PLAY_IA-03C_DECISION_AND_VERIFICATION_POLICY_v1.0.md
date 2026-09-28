# PLAY IA-03C Decision and Verification Policy v1.0

**문서 상태: PRODUCT OWNER APPROVED / EXECUTION POLICY**  
**버전:** 1.0  
**범위:** PLAY IA-03C Actual Buy 및 그 검증 완료까지

## 1. 목적과 진행 원칙

이 문서는 Product Owner가 확정한 정책과 IA-03C 실행·검증 기준을 고정한다. 목표는 사용자가 매수를 확정한 뒤 실제 경제 상태가 원자적으로 변경되는 IA-03C Actual Buy를 끝까지 구현하고 검증하는 것이다. 검증 완료 전에는 다음 단계로 진행하지 않는다.

각 Gate는 증거를 확인해 PASS 또는 FAIL로 기록한다. 하나라도 FAIL, 미실행, 증거 부족이면 다음 Gate 및 후속 기능으로 진행하지 않는다. 코드가 존재한다는 사실, 테스트가 실행됐다는 사실, 운영 배포가 됐다는 사실은 각각 별개로 기록한다.

## 2. 근거 보고서와 현재 기준선

필수 근거 보고서:

- `PLAY_BACKEND_INTEGRATION_AND_IA03C_REPORT.md`
- `PLAY_BACKEND_INTEGRATION_PHASE1_2_REPORT.md`

두 보고서는 서로 다른 단계의 상태를 기록한다. Phase 1/2 보고서는 당시 `purchasePrimaryProperty`가 `supply_id` 입력과 고정 2.0% 수수료를 사용했고, `/play`가 정적 UI이며 배포·live 사실을 가정할 수 없다고 기록하고 승인 Gate에서 중단했다. 후속 통합 보고서는 다음 코드 변경이 이뤄졌다고 기록한다: Firebase anonymous auth(테스트 용도), `getPlayerState`, `/play`의 callable 호출, `property_id`로부터 season별 supply를 서버에서 해석하는 로직, IA-03B.1 면적 기반 서버 수수료, 그리고 transaction 내 idempotency 확인.

따라서 실행 기준선은 다음과 같다.

- **코드 보고 상태:** Backend integration code 및 IA-03C 연결 코드가 존재한다고 후속 보고서가 기술한다. `getPlayerState`, `purchasePrimaryProperty`, `property_id → PLAY_PRIMARY_SUPPLY` 해석, 서버 측 거래비용 계산이 포함된다.
- **검증 상태:** 보고서는 emulator E2E 준비/조정 사실을 기술하지만, 이 문서가 이용 가능한 보고 내용만으로 실제 전체 emulator E2E의 raw evidence와 모든 검증 결과를 확인할 수는 없다. Gate별 증거를 다시 확보한다.
- **배포/live 상태:** **NOT DEPLOYED / NOT VERIFIED**. Production 배포 및 live cloud 검증 완료로 간주하지 않는다.
- **실제 사용자 경제 변경:** Production에서 실제 사용자 경제 데이터 mutation은 허용하지 않는다. 사전 승인 없는 Production mutation은 금지한다.

어느 보고서의 과거 상태가 현재 repository와 다르면 repository의 실제 코드·실행 증거를 확인하고 차이를 기록한다. 문서의 주장을 코드나 raw evidence로 대체하지 않는다.

## 3. Product Owner 확정 정책

### DEC-01 — Starting Capital

- 구조: Season/Scenario configuration 기반.
- Season 1 실제 설정값: **700,000,000 KRW**.
- 참가자 join 시 해당 Season/Scenario의 서버 권위 설정값으로 초기화한다. 클라이언트 상수나 화면 표시값을 경제 상태의 근거로 사용하지 않는다.

### DEC-02 — Market Semantics

- 최초 구매 대상은 `property_id → 해당 season의 PLAY_PRIMARY_SUPPLY`로 서버에서 resolve한다.
- **Listing**은 사용자가 보는 시장의 거래 대상이다.
- **Primary Supply**는 해당 거래 대상에 연결된, 구매 가능한 Backend 경제 객체다.
- 두 개념은 동일하지 않다. UI Listing을 Backend supply record 자체로 취급하지 않는다.
- 요청한 season/property에 대응하는 supply가 없거나 유일하게 해석되지 않으면 거래를 실패 처리한다.

### DEC-03 — Research Data Policy

90일 retention은 지금 확정하지 않는다. Human Season 전에 데이터 종류, 각 수집 목적, 사용자 고지·동의, 연구 활용 범위, 철회 절차 및 보관기간을 별도 정책으로 수립하고 승인한다. 해당 정책 Gate 전에는 실제 Human Season 연구 데이터 수집·활용을 시작하지 않는다.

### DEC-04 — Participant Identity

Participant Identity 정책은 별도 정의해 Human Season 전에 확정한다. 현재 anonymous auth는 emulator/local 테스트 용도로만 취급하며 지속적인 인간 참가자 식별 정책의 승인이나 구현으로 간주하지 않는다.

## 4. IA-03C 사용자 흐름

구현 및 검증 대상 전체 흐름:

`LISTING → LISTING DETAIL → BUY INTENT → FUNDING CHECK → COST CHECK → EXPECTED RESULT → BUY CONFIRMATION → ACTUAL BUY → BUY RESULT → MY WORLD`

`EXPECTED RESULT`는 예상값이고 거래 완료가 아니다. `BUY RESULT`에서 성공을 표시하는 시점은 서버 commit이 확인된 뒤뿐이다. 이후 `MY WORLD`는 권위 있는 서버 상태를 다시 읽어 소유권과 현금을 반영해야 한다.

## 5. Server Authority 및 보존 원칙

- 클라이언트 입력은 인증된 호출자, `season_id`, `property_id`, idempotency key 및 필요한 연구 trace/context의 최소 식별자에 한정한다.
- 서버가 사용자 권한, Season 설정, listing/supply 연결, 가격, 면적, IA-03B.1 비용, 잔액, 공급 가능성, 소유권, 거래 기록을 검증하고 결정한다.
- `getPlayerState`는 인증된 사용자 자신의 해당 Season 상태만 최소 권한으로 반환한다. 미인증·타 사용자 조회는 거부한다.
- `purchasePrimaryProperty`는 서버 권위 transaction이어야 한다. 경제 상태 변경은 원자적이어야 한다.
- 이미 검증된 engine, reliability, security, research logging 구현을 조사하고 재사용한다. 불필요하게 재작성하거나 중복 backend/architecture를 만들지 않는다.
- transaction cost는 IA-03B.1의 확정 규칙을 서버에서 적용한다. UI 계산은 설명용일 뿐 권위값이 아니다.

## 6. 성공·실패 상태 검증

### 성공 거래

매수 성공 전후 snapshot 및 연결된 기록으로 아래를 입증한다.

- `cash_available` 및 `cash_total`의 정확한 변화와 불변식.
- `locked_cash`가 규칙에 맞게 유지·해제·변경됨.
- 해당 참가자/Season의 property ownership이 정확히 한 번 생성됨.
- 매칭된 `PLAY_PRIMARY_SUPPLY` 수량/상태가 정확히 변경됨.
- 거래 transaction이 정확히 한 건 기록되고 가격·면적·수수료·총액이 서버 규칙과 일치함.
- decision/research events가 기존 verified infrastructure를 통해 요구된 trace/context와 연결되어 durable하게 기록됨.
- 같은 idempotency key 재시도는 중복 차감·소유권·거래를 만들지 않고 동일 결과를 반환함.
- 동시 요청에서 잔액·공급·소유권 및 거래의 원자성/일관성이 보장됨.
- 후속 읽기인 `getPlayerState`와 MY WORLD가 commit된 결과와 일치함.

### 실패 거래

잔액 부족, supply 없음/소진, 권한 오류, 잘못된 입력, transaction 중 오류, 연구 로깅 장애, timeout/재시도 각각에 대해 다음을 확인한다.

- 허용되지 않은 경우 경제 mutation이 전혀 없고 현금·locked cash·ownership·supply·transaction이 commit 전 상태와 일치한다.
- 실패 응답은 안전하고 분류 가능하며 내부 정보나 타 사용자 데이터를 노출하지 않는다.
- 재시도 시 중복 mutation이 없고 최종 상태가 한 번 성공 또는 온전히 실패 중 하나로 수렴한다.
- 연구 기록 실패 시 기존 durability/DLQ 경로가 요구대로 작동하며, 로그 유실 또는 불일치가 숨겨지지 않는다.
- partial commit, rollback, retry 경로의 결과와 관측 가능한 evidence가 있다.

## 7. 순차 Verification Gates

각 Gate 기록에는 실행 환경, commit/revision, 명령·시나리오, 기대 결과, 실제 결과, raw evidence 위치, PASS/FAIL, blocker를 포함한다. **Gate를 순서대로 통과**해야 하며 FAIL/미실행/증거 누락 시 정지한다.

1. **Contract Gate** — 현재 코드와 callable 계약을 확인한다. auth/권한, 입력·출력, season/property/supply 해석, fee formula, state schema 및 보안 경계가 결정과 일치해야 PASS.
2. **Emulator E2E Gate** — 실제 `/play` UI 흐름에서 emulator backend를 호출하고 실제 emulator 경제 상태를 변경·재조회한다. mock economic state/transaction으로 대체하지 않는다.
3. **Failure/Recovery Gate** — 실패 전후 상태 불변식, timeout, retry, rollback 및 로깅 실패/DLQ durability를 확인한다.
4. **Concurrency/Idempotency Gate** — 동일 요청 재시도 및 동일 supply 경쟁을 실행해 중복 거래가 없고 원자적 결과가 유지됨을 입증한다.
5. **Research Traceability Gate** — decision/research event가 참가자·Season·trace·transaction과 연결되고 기존 durability 경로에서 추적 가능함을 확인한다. 실제 Human Season 정책 승인을 대신하지 않는다.
6. **Regression Gate** — 변경 영향 범위의 기존 engine/market/reliability/security/research 검증을 재실행하고 회귀가 없음을 확인한다.
7. **Deployment/Live Verification Gate** — 배포는 별도 승인을 받은 뒤 수행한다. 배포 상태, 설정, auth/rules, 실제 endpoint와 관측 결과를 증거로 확인한다. 실제 사용자 경제 상태 mutation은 명시적 별도 승인이 있기 전 금지하며, 필요 시 격리된 승인 테스트 주체·대상으로 제한한다.

모든 Gate PASS는 IA-03C 검증 완료의 필요조건이다. Gate PASS는 Human Season 승인이나 후속 제품 정책 승인과 동일하지 않다.

## 8. 반복 실행 원칙

실패하면 **원인 분석 → 최소 수정 → 동일 테스트 재실행 → 관련 회귀 테스트 재실행 → PASS까지 반복**한다. 실패한 테스트를 삭제·완화·건너뛰거나 mock으로 바꾸어 PASS로 표시하지 않는다. 해결할 수 없는 blocker는 정확한 증거와 함께 기록하고 hard stop한다.

## 9. 범위 제한과 Hard Stop

- Production 이전에는 실제 사용자 경제 데이터에 mutation하지 않는다. Production mutation은 명시적 승인 전 금지한다.
- 모든 Verification Gate PASS 전에는 IA-04 및 SELL, People, Season, visual refinement 등 후속 기능으로 진행하지 않는다.
- Research Data Policy와 Participant Identity 정책은 Human Season 전에 별도 승인 Gate로 완료한다.
- 기존 검증된 engine/reliability/security/research logging을 불필요하게 재작성하지 않는다.
- 코드 변경 전·후 diff와 보호 영역(핵심 transaction, rules, engine, reliability, logging)의 영향을 확인하고 보고한다.
- 권위 상태·비용·소유권·공급을 client/mock으로 대체해야만 진행 가능한 경우, 감사/증거가 부족한 경우, 보안 경계가 약화되는 경우, 미승인 Production mutation이 필요한 경우 즉시 중단한다.
- 본 승인 문서는 명시된 구현 및 emulator 검증을 수행할 실행 정책이다. Production 배포나 실제 경제 mutation에 대한 승인은 포함하지 않는다.

## 10. Definition of Done

- 네 가지 DEC 정책이 config/서버/UI 흐름에 일관되게 반영되어 있다.
- 지정된 전체 IA-03C 흐름이 실제 UI와 권위 backend로 연결된다.
- 성공·실패 경제 불변식과 비용 규칙이 raw evidence로 입증된다.
- idempotency, concurrency, atomicity, retry, rollback 및 research traceability가 검증된다.
- 7개 Verification Gate가 모두 PASS이며 각 PASS를 재현 가능한 evidence로 뒷받침한다.
- 관련 regression이 PASS이고 변경 전/후 diff와 보호 영역 검토가 기록되어 있다.
- Production/live 상태는 별도 승인 및 실제 검증 전까지 NOT DEPLOYED / NOT VERIFIED로 표시한다.
- Human Season 전용 데이터/identity 정책 Gate와 Production 승인 조건을 완료된 IA-03C 검증과 혼동하지 않는다.

## 11. Change Control 및 최종 승인 체크리스트

정책·계약·보호 architecture 변경이 필요하면 기존 정책에 조용히 반영하지 말고 변경 이유, 영향 파일, 전후 계약, migration/호환성, 위험 및 검증 계획을 기록한다. 이 문서의 DEC 정책 변경은 Product Owner 승인을 받아 새 버전으로 남긴다. Production 배포 및 Production mutation은 각각 별도 승인을 받는다.

최종 보고 전 다음 항목을 체크한다.

- [ ] 현재 repository 코드와 두 근거 보고서 간 차이를 설명했다.
- [ ] 변경 파일 및 변경 전/후 diff, 보호 영역 검토를 기록했다.
- [ ] 각 Gate 결과가 증거 링크와 함께 PASS/FAIL로 명시됐다.
- [ ] 실패, 수정, 동일 테스트 재실행 및 회귀 결과 이력이 있다.
- [ ] 경제 상태 성공/실패 snapshot과 transaction/research evidence가 있다.
- [ ] 미해결 blocker와 Production/live 상태를 정확히 표시했다.
- [ ] Gate 미통과 상태에서 후속 기능을 진행하지 않았다.
- [ ] Human Season 정책과 Production 실행 승인을 별도로 남겼다.

