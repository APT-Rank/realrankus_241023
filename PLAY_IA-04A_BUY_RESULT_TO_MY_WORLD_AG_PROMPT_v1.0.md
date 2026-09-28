# PLAY IA-04A BUY RESULT → MY WORLD
# AG EXECUTION PROMPT v1.0

## ROLE
IA-04A만 구현한다.
반드시 `PLAY_IA-04A_BUY_RESULT_TO_MY_WORLD_SPEC_v1.0.md`를 먼저 읽고 고정된 기준으로 취급한다.

## 1. CURRENT STATE
IA-03C Actual Buy는 Firebase Emulator 검증을 통과했다.
검증된 것:
- actual BUY
- transaction cost
- cash mutation
- supply mutation
- ownership
- transaction
- idempotency
- concurrency
- failure handling
- research trace

이를 재구축하거나 불필요하게 수정하지 않는다.

## 2. OBJECTIVE
`ACTUAL BUY → BUY RESULT → AUTHORITATIVE PLAYER STATE REFRESH → MY WORLD`

## 3. FIRST ACTION
코딩 전에:
1. IA-04A spec 읽기
2. IA-03C implementation 확인
3. `getPlayerState` 확인
4. `/play/index.html` 확인
5. `/play/js/play_app.js` 확인
6. Player State schema 확인
7. ownership response schema 확인
8. transaction response schema 확인

필드명을 추정하지 않는다.

## 4. BACKEND REUSE
`getPlayerState`, `purchasePrimaryProperty`를 재사용한다.
새 Player State architecture, transaction architecture, ownership schema를 만들지 않는다.

## 5. BUY RESULT
성공 후 표시:
- transaction_id
- complex/property
- acquisition price
- transaction cost
- total cash outflow
- acquisition timestamp

없는 값은 `정보 없음`.
임의값 금지.

## 6. PLAYER STATE REFRESH
성공 직후 `getPlayerState` 호출.
반환된 authoritative state로:
- cash
- property count
- net worth
- ownership
을 갱신한다.
stale frontend state를 최종 source로 사용하지 않는다.

## 7. MY WORLD
기능적 MY WORLD 구현:
Cash / Properties / Net Worth
및 purchased property card:
Complex Name / Property ID / Representative Area / Acquisition Price / Acquisition Date

실제 backend 값을 사용한다.

## 8. CURRENT VALUE
authoritative current market value가 없으면:
`현재 가치 정보 없음`
을 표시한다.
fake price, last_sales fallback, 임의 appreciation, hardcoded market value 금지.

## 9. UI
Functional-first.
pixel-perfect styling, animation, elaborate graphics, visual QA, final typography, map polish는 하지 않는다.

우선순위:
Function → Interaction → State → Data correctness

## 10. USER INTERACTIONS
- `내 세계 보기` → MY WORLD
- `구매한 아파트 보기` → purchased property detail/context
- `세계로 돌아가기` → WORLD
새 transaction을 자동 실행하지 않는다.

## 11. ERROR STATES
Loading: `내 경제 상태를 불러오는 중...`
Success: MY WORLD
Failure: error state
fallback fake player state 금지.

## 12. RESEARCH LOGGING
BUY RESULT / MY WORLD / PROPERTY DETAIL exposure hooks만 준비.
기존 Research Logging 재사용.
새 collection/schema가 필요하면 STOP하고 보고한다.

## 13. SECURITY
client Firestore write, ownership write, cash write, transaction write를 추가하지 않는다.
경제 상태는 server authoritative.

## 14. PROTECTED AREAS
다음을 수정하지 않는다:
- Economic Engine
- Season Clock
- Batch Processing
- Reliability
- Security Rules
- `purchasePrimaryProperty`
- Research Logging core
- Research DLQ
- Property Master
- RealRankers core
- `app_main_lang.js`

필수 변경이면 STOP하고 정확한 이유를 보고한다.

## 15. TESTS
- IA04A-01 Successful BUY → BUY RESULT
- IA04A-02 Transaction ID
- IA04A-03 Price
- IA04A-04 Fee
- IA04A-05 Total cash outflow
- IA04A-06 `getPlayerState`
- IA04A-07 Cash authoritative
- IA04A-08 Ownership
- IA04A-09 Property count
- IA04A-10 Net worth authoritative
- IA04A-11 MY WORLD
- IA04A-12 Purchased property
- IA04A-13 WORLD navigation
- IA04A-14 Player State failure
- IA04A-15 IA-03C regression

## 16. TESTING PRINCIPLE
DOM만 검사하지 않는다.
실제 data flow:
`BUY → Callable → Transaction Result → getPlayerState → Frontend State → MY WORLD`
를 검증한다.
가능한 범위에서 emulator state를 확인한다.

## 17. FAILURE LOOP
FAIL → Root Cause → Minimal Fix → Failed Test 재실행 → Regression → PASS
assertion 약화, fake data 대체 금지.

## 18. NO PROGRESSION
IA-04B, SELL, Secondary Market, People, Season, Notification, Ranking, Visual refinement는 구현하지 않는다.

## 19. FINAL REPORT
`PLAY_IA-04A_IMPLEMENTATION_REPORT.md` 생성.
포함:
1. Current State
2. Files Changed
3. BUY Result Flow
4. Player State Flow
5. MY WORLD Flow
6. Backend Calls
7. Data Sources
8. Tests
9. IA-03C Regression
10. Protected Area Diff
11. Failure / Fix / Re-test history
12. Remaining Issues
13. Final Status

Final status는 `READY FOR IA-04B` 또는 `BLOCKED`.

## 20. STOP CONDITION
다음이 필요하면 즉시 STOP:
- new economic rules
- new transaction architecture
- new Firestore schema
- new security rules
- new Player State architecture
- verified IA-03C transaction logic 변경

보고:
1. conflict
2. why
3. affected area
4. options
5. recommendation

Product Owner approval 전에는 진행하지 않는다.
