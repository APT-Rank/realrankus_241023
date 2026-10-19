# PLAY-07.1 FINAL VERIFICATION SPEC

## 1. 목적
PLAY-07.1 Income & Basic Expense Engine의 실제 Firebase/GCP 환경 최종 검증 명세다. 새 기능 개발이 아니라 실제 동작과 데이터 무결성을 증명하는 것이 목적이다. PLAY-07.2는 본 검증 완료 후 진행한다.

## 2. 기준 문서
- `PLAY-07.1.1_ECONOMIC_PARAMETER_FINALIZATION.md`
- `PLAY_07.1_IMPLEMENTATION_REPORT.md`
- PLAY-06.1 Security / Idempotency 구조

충돌 발견 시 임의 수정 금지. 다음 형식으로 BLOCK 보고:
`[BLOCKING CONFLICT] / File / Section / Existing Implementation / Expected Specification / Conflict / Required Decision`

## 3. 고정 파라미터
- 1 Period = 1 simulated month
- Season = 30 years = 360 periods
- Starting Cash = 700,000,000 KRW
- Starting Annual Income = 50,000,000 KRW
- Basic Living Expense = 3,000,000 KRW/month
- Income Growth = Inflation - 0.5%p
- Monthly Inflation = `(1 + annual_inflation)^(1/12) - 1`

Inflation:
- Years 1–5 Recovery: 2.0%
- Years 6–10 Boom / Overheating: 3.5%
- Years 11–15 Tightening: 2.5%
- Years 16–20 Recession: 1.0%
- Years 21–25 Recovery: 2.0%
- Years 26–30 Growth / Polarization: 2.5%

## 4. 검증 원칙
실제 Firebase/GCP 실행 증거가 없으면 PASS가 아니라 BLOCKED다. 핵심 Evidence에는 Firestore before/after, HTTP status, Function response, Cloud Tasks, Logging, Security Rules, Player Asset, Decision Log, Batch/Chunk 상태를 활용한다.

## V01 — 360 Period / Phase Boundary
검증 Period: 0, 59, 60, 119, 120, 179, 180, 239, 240, 299, 300, 359.
Expected:
- 0–59 Recovery
- 60–119 Boom
- 120–179 Tightening
- 180–239 Recession
- 240–299 Recovery
- 300–359 Growth / Polarization
각 경계의 period/year/phase/annual_inflation을 Evidence로 남긴다.

## V02 — Income Engine
Starting Annual Income = 50M.
Growth = Inflation - 0.005.
검증 Period: 0, 59, 60, 119, 120, 179, 180, 239, 240, 299, 300, 359.
각각 annual income before/growth/after/monthly income을 기록한다.

## V03 — Inflation Engine
월간 Inflation이 `(1 + annual)^(1/12)-1`인지 검증한다. annual/12를 사용하지 않는지 확인한다. 각 Phase에서 최소 1회 실제 결과를 기록한다.

## V04 — Living Expense
Base = 3M/month.
`Current Expense = Base Expense × Cumulative Inflation Factor`.
주요 경계 Period에서 base/cumulative factor/expected/actual/difference를 기록한다.

## V05 — Cash / Net Worth
`cash = before_cash + income - living_expense`
현재 Property=0, Financial Asset=0, Debt=0이므로 `net_worth = cash`.
Before/Income/Expense/After를 기록한다.

## V06 — Player Idempotency
동일 Player/Period/Batch 요청을 5회 이상 동시에 실행한다.
Expected:
- Economic state change = 1
- Income payment = 1
- Expense deduction = 1
Before/after cash, last_processed_period, last_processed_batch_id 및 각 response를 기록한다.

## V07 — Decision Log Idempotency
V06과 동일한 동시 요청에서 Monthly Economic Update Log가 정확히 1개인지 확인한다. 중복 Log=0.

## V08 — Mid-Chunk Failure Recovery
Chunk 예: 100명. Player 50 처리 후 Worker를 의도적으로 실패시킨다. Retry 후 Player 1–50은 NO-OP, 51–100만 처리되어야 한다.
검증:
- Duplicate Income=0
- Duplicate Expense=0
- Duplicate Decision Log=0
- Missing Player Update=0
실패 시점과 Retry 이후 Firestore 상태를 기록한다.

## V09 — Reconciliation Normal
정상 상태에서:
- cash >= 0
- cash_total = cash_available + cash_locked
- net_worth = cash + property + financial_asset - debt
Expected: `SUCCESS`, errors=0.

## V10 — Reconciliation Corruption
Cash 또는 Net Worth를 의도적으로 불일치시킨다.
Expected:
- status=FAILED
- errors>0
- action=TRANSACTION_PAUSED
- Season Clock 정지
Corruption 전/후와 결과를 기록한다.

## V11 — Security: Unauthenticated
인증 없는 `processBatchChunk`, `advanceSeasonClock` 호출.
Expected: 401.
PLAY-06.1의 auth bypass가 없어야 한다.

## V12 — Security: Wrong Service Account
허용되지 않은 Service Account OIDC Token 호출.
Expected: 403.

## V13 — Security: Valid Cloud Task
정상 Cloud Tasks OIDC 호출.
Expected: 200 및 정상 처리.

## V14 — Client Direct Write
Client 권한으로 PLAY_PLAYER, PLAY_PLAYER_ASSET, PLAY_BATCH, PLAY_BATCH_CHUNKS, PLAY_DECISION_LOG 등에 직접 Write 시도.
Expected: DENIED.

## V15 — Rounding Accumulation Analysis
현재 구현의 즉시 원화 정수 처리 방식은 변경하지 않는다.
Method A: 현재 방식.
Method B: 내부 소수 유지 후 최종 저장 시 정수 처리.
360개월 기준:
- Total Income Difference
- Total Expense Difference
- Final Cash Difference
- Final Net Worth Difference
를 계산하고 수치를 보고한다.

## V16 — Full 360 Period Deterministic Simulation
Period 0→359 전체 deterministic 계산.
확인:
- NaN=0
- Infinity=0
- Negative Cash=0
- Missing Income=0
- Missing Expense=0
- Phase Mapping Error=0
최종 Period 359의 Annual Income, Monthly Income, Monthly Expense, Cash, Net Worth 기록.

## V17 — PLAY-06.1 Regression
다음 정상 여부 확인:
internalAuth, Cloud Tasks OIDC, Client Write Denied, Player Idempotency, Batch Idempotency, Season Clock, Reconciliation, Emergency Stop/Resume.
하나라도 깨지면 NOT READY.

## Economic Shock 범위
Shock의 발생 Period/종류/크기는 아직 별도 확정하지 않았으므로 이번 검증에서 임의 구현/검증하지 않는다. 필요한 미확정값이 발견되면 BLOCK 보고한다.

## 결과표
| Test | Description | Result | Evidence |
|---|---|---|---|
| V01 | 360 Period / Phase | | |
| V02 | Income | | |
| V03 | Inflation | | |
| V04 | Living Expense | | |
| V05 | Cash / Net Worth | | |
| V06 | Player Idempotency | | |
| V07 | Decision Log Idempotency | | |
| V08 | Mid-Chunk Recovery | | |
| V09 | Reconciliation Normal | | |
| V10 | Reconciliation Corruption | | |
| V11 | Unauthenticated | | |
| V12 | Wrong Service Account | | |
| V13 | Valid Cloud Task | | |
| V14 | Client Direct Write | | |
| V15 | Rounding Analysis | | |
| V16 | Full 360 Period | | |
| V17 | PLAY-06.1 Regression | | |

Result는 PASS / FAIL / BLOCKED 중 하나만 사용한다.

## 최종 판정
### READY FOR PLAY-07.2
V01~V14, V16, V17이 PASS이고 V15가 정량적으로 허용 가능하며 Blocking Issue=0.

### READY AFTER FIXES
Minor Issue만 존재하고 PLAY-07.2 진행을 막지 않는 경우.

### NOT READY
경제 계산 오류, 중복 지급/차감/로그, Mid-Chunk 실패, Reconciliation 실패, Security Regression, Client Write 가능, Season Clock 오류, 360 Period 오류, 확정 파라미터 불일치 또는 핵심 Evidence 부족.

## 최종 보고서
`PLAY_07.1_FINAL_VERIFICATION_REPORT.md`로 작성한다.
구성:
1. Verification Summary
2. Environment
3. Test Result Table
4. V01~V17 Detailed Results
5. Evidence
6. Rounding Analysis
7. Known Issues
8. Blocking Issues
9. Recommended Fixes
10. Final Verdict

"코드상 정상", "논리상 정상", "테스트 가능"만으로 PASS하지 않는다.
