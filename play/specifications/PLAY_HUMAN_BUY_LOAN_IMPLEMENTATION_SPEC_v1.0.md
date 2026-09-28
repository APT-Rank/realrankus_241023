# PLAY_HUMAN_BUY_LOAN_IMPLEMENTATION_SPEC_v1.0

## Status
READY FOR IMPLEMENTATION

## Goal
Human BUY 기능을 실제 사용 가능한 수준으로 완성한다.

현재 발견된 오류:
`Firebase: firebase.functions-compat() takes either no argument or a Firebase App instance. (app-compat/invalid-app-argument)`

추가 요구사항:
- 현금만으로 BUY 가능
- 현금 부족 시 Loan 사용 가능
- LTV / DSR / 금리 / 30년 / 원리금균등상환
- Loan + BUY atomic transaction
- 월별 원리금 상환
- 내 자산 실시간 반영

## 1. Firebase BUY 오류

실제 코드에서 다음 호출 경로를 조사한다.

Browser
→ PLAY Firebase App
→ Auth
→ Firebase Functions
→ purchasePrimaryProperty
→ Backend

반드시 확인:
- initializeApp 호출 횟수
- Firebase App instance
- firebase.app()
- firebase.functions()
- firebase.functions(app)
- compat / modular 혼용
- PLAY와 RealRankers App 충돌
- Functions region
- deployed Function 이름
- Auth token 전달

오류를 숨기거나 try/catch로 우회하지 않는다.

### Acceptance
- PLAY Firebase App 정상 초기화
- 중복 initializeApp 없음
- Functions instance 정상 생성
- 올바른 project/region
- Auth token 전달
- purchasePrimaryProperty 호출 성공

## 2. 기존 BUY 보호

기존 IA-03C의 검증된 구조를 유지한다.
- server validation
- transaction fee
- Firestore transaction
- primary supply
- player asset
- ownership
- transaction record
- decision log
- idempotency
- research logging

기존 BUY Engine을 재작성하지 않고 Funding/Loan layer를 연결한다.

## 3. Cash-only BUY

먼저 실제 브라우저에서:
Property → Listing → 구매진행 → BUY → Result → 내 자산
을 성공시킨다.

7억원으로 구매 가능한 실제 Property를 사용한다.

이 단계가 PASS하기 전에는 Loan으로 넘어가지 않는다.

## 4. Loan

현재 PLAY 정책:
- DSR MAX 50%
- Loan Term 30 years
- Repayment 원리금균등
- Loan Rate = Base Rate + 1.50% + Risk Spread
- LOW 0%, NORMAL 0.20%, HIGH 0.50%

LTV는 Season의 authoritative Loan Configuration을 사용한다.

Eligible Loan:
min(LTV limit, DSR limit, funding requirement)

## 5. Funding

Total Funding Requirement =
Property Price + calculateTransactionFee(property)

BUY 가능:
Cash + Eligible Loan >= Total Funding Requirement

불가:
Cash + Eligible Loan < Total Funding Requirement

## 6. DSR

DSR =
Annual Debt Service / Annual Income

신규 대출:
Existing Annual Debt Service + New Annual Debt Service
<= Annual Income × 50%

기존 부채를 반드시 포함한다.

## 7. UI

구매 화면에:
- 매수가
- 거래비용
- 총 필요자금
- 보유 현금
- 최대 대출 가능액
- 신청 대출금
- LTV
- DSR
- 금리
- 기간
- 월 상환액
- 구매 후 현금
- 구매 후 부채
- 구매 가능 여부

대출금 변경 시 Preview를 즉시 갱신하되 최종 검증은 Backend가 한다.

## 8. Loan + BUY Atomicity

하나의 Firestore Transaction에서:
- Loan 생성
- Debt 증가
- Cash/funding
- Property ownership
- Primary supply
- Property transaction
- Idempotency

를 처리한다.

중간 실패 시 전체 rollback.

Loan만 생성되거나 BUY만 성공하는 partial state를 허용하지 않는다.

## 9. PLAY_LOAN

필드:
- loan_id
- season_id
- participant_id
- transaction_id
- property_id
- principal
- outstanding_principal
- interest_rate
- term_months
- remaining_months
- monthly_payment
- annual_debt_service
- status
- created_at
- updated_at

Status:
ACTIVE / PAID_OFF / DEFAULTED

## 10. Repayment

Economic Period = 1 simulated month.

매월:
Interest + Principal = Monthly Payment

Cash 감소 / Debt 감소.

cash_total = cash_available + locked_cash invariant 유지.

## 11. Research

기존 구조:
Exposure → Decision → Action → Validation → Loan Decision → Transaction → Outcome

LOAN_REQUESTED / APPROVED / REJECTED를 추적한다.

기존 Research durability/idempotency 구조는 변경하지 않는다.

## 12. Error UX

내부 Firebase 오류를 사용자에게 직접 보여주지 않는다.

사용자:
`구매 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.`

Test Mode에서는 원본 error code/message를 Diagnostic Panel에 표시한다.

## 13. Idempotency

동일 요청 반복 시:
- Loan duplicate 금지
- Property duplicate 금지
- Cash duplicate deduction 금지
- Transaction duplicate 금지

기존 결과를 반환한다.

## 14. 테스트 순서

T01 Firebase initialization
T02 Cash-only BUY
T03 Loan calculation
T04 LTV boundary
T05 DSR boundary
T06 Loan + BUY Emulator
T07 Insufficient cash + valid loan
T08 LTV rejection
T09 DSR rejection
T10 Cash + Loan insufficient
T11 Duplicate request
T12 Loan/BUY rollback
T13 1 simulated month repayment
T14 Browser Human E2E
T15 IA-03C regression

## 15. Browser E2E

1. PLAY 진입
2. HERO 확인
3. 수지구 지도
4. 구매 가능한 Property
5. Listing Detail
6. 구매진행
7. Cash-only BUY
8. Cash 부족 Property
9. Loan UI
10. Loan amount 변경
11. LTV/DSR/월상환액 확인
12. 구매
13. Loan 생성
14. BUY transaction
15. 내 자산 갱신
16. Debt 갱신
17. Ownership 갱신
18. Net Worth 갱신
19. 다음 simulated month repayment 확인

## 16. 변경 금지

임의 변경 금지:
- Economic Engine 핵심
- Property Master
- IA-04D
- FIXED_ONE Supply
- Transaction Atomicity
- Security Rules
- Research Logging durability
- Idempotency architecture
- Time-Slip architecture

## 17. Simulation 금지

이번 작업에서는 10P/11P/P360 Simulation을 실행하지 않는다.

## 18. Final Gate

모두 PASS:
- Firebase Functions Integration
- Cash-only BUY
- Loan Eligibility
- LTV
- DSR
- Interest
- Monthly Payment
- Loan + BUY Atomicity
- Player Asset
- Debt
- Repayment
- Idempotency
- Rollback
- Research Logging
- Browser Human E2E
- IA-03C Regression

최종 판정:
PASS / PASS WITH FINDINGS / BLOCKED

완료 기준:
READY FOR HUMAN BUY / LOAN E2E
