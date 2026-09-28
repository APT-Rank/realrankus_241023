# PLAY HUMAN BUY + LOAN — AG IMPLEMENTATION PROMPT v1.0

첨부된 `PLAY_HUMAN_BUY_LOAN_IMPLEMENTATION_SPEC_v1.0.md`를 기준으로 구현한다.

## 1. 목표

현재 Human Test에서 7억원으로 구매 가능한 Property의 `구매진행`을 누르면:

`firebase.functions-compat() takes either no argument or a Firebase App instance`

오류가 발생한다.

동시에 실제 대출 기능이 Human BUY Flow에 연결되어 있지 않다.

목표:
1. Firebase Functions root cause 수정
2. Cash-only BUY 정상화
3. LTV/DSR/금리/30년/원리금균등 Loan 구현
4. Loan + BUY atomic transaction
5. 월별 repayment
6. 내 자산 Cash/Debt/Property/Net Worth 반영
7. Browser Human E2E

## 2. 먼저 조사하고 수정

코드 수정 전에:
- PLAY Firebase initialization
- initializeApp 호출
- Firebase App instance
- firebase.app()
- firebase.functions()
- firebase.functions(app)
- compat/modular 혼용
- RealRankers와 PLAY App 충돌
- Functions region
- deployed Function 이름
- Auth token
- BUY 호출 endpoint

를 확인한다.

현재 오류를 숨기거나 임의 endpoint로 우회하지 않는다.

## 3. Firebase 수정

정상 경로:
Browser → PLAY Firebase App → Auth → Functions → purchasePrimaryProperty → Backend

검증:
- App 정상 초기화
- 중복 initializeApp 없음
- Functions 정상 생성
- project/region 일치
- Auth token 전달
- BUY Function 호출 성공

## 4. IA-03C 보호

기존 검증된 BUY path를 재작성하지 않는다.
유지:
- server validation
- fee
- Firestore transaction
- primary supply
- player asset
- ownership
- transaction
- decision log
- idempotency
- research logging

이번 작업은 Funding/Loan layer 연결이다.

## 5. Cash-only BUY 먼저

대출 전에 실제 브라우저에서:
Property → Listing → 구매진행 → BUY → Result → 내 자산

을 성공시킨다.

7억원으로 실제 구매 가능한 Property를 사용한다.

PASS 전 Loan 구현 진행 금지.

## 6. Loan 정책

- DSR MAX 50%
- Term 30 years
- Repayment 원리금균등
- Rate = Base Rate + 1.50% + Risk Spread
- LOW 0%, NORMAL 0.20%, HIGH 0.50%
- LTV = Season authoritative Loan Configuration

Eligible Loan:
min(LTV limit, DSR limit, funding requirement)

## 7. Funding

Total Requirement = Property Price + calculateTransactionFee(property)

BUY 가능:
Cash + Eligible Loan >= Total Requirement

불가:
Cash + Eligible Loan < Total Requirement

## 8. DSR

DSR = Annual Debt Service / Annual Income

Existing Annual Debt Service + New Annual Debt Service
<= Annual Income × 50%

기존 부채 포함.

## 9. UI

표시:
- 매수가
- 거래비용
- 총 필요자금
- 보유 현금
- 최대 대출
- 신청 대출
- LTV
- DSR
- 금리
- 기간
- 월 상환액
- 구매 후 현금
- 구매 후 부채
- 구매 가능 여부

Loan amount 변경 시 Preview 갱신.
최종 검증은 Backend.

## 10. Atomicity

하나의 Firestore transaction에서:
- Loan
- Debt
- Cash/funding
- Ownership
- Primary supply
- Property transaction
- Idempotency

를 처리한다.

partial state 금지.

## 11. PLAY_LOAN

필드:
loan_id, season_id, participant_id, transaction_id, property_id,
principal, outstanding_principal, interest_rate, term_months,
remaining_months, monthly_payment, annual_debt_service,
status, created_at, updated_at

Status:
ACTIVE / PAID_OFF / DEFAULTED

## 12. Repayment

Economic Period = 1 simulated month.

Interest + Principal = Monthly Payment

Cash 감소 / Debt 감소.
`cash_total = cash_available + locked_cash` 유지.

## 13. Research

기존:
Exposure → Decision → Action → Validation → Loan Decision → Transaction → Outcome

LOAN_REQUESTED / APPROVED / REJECTED 기록.

기존 durability/idempotency 변경 금지.

## 14. Error UX

사용자:
`구매 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.`

Test Mode Diagnostic Panel에는 원본 error code/message 표시.

## 15. Idempotency

동일 요청 반복 시 duplicate Loan/Property/Cash deduction/Transaction 금지.
기존 결과 반환.

## 16. 테스트

순서:
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
T12 Rollback
T13 1-month repayment
T14 Browser Human E2E
T15 IA-03C regression

## 17. Browser E2E

PLAY → HERO → 수지구 → 구매 가능한 Property → Listing → 구매진행 → Cash-only BUY

그 후 Cash 부족 Property:
Loan UI → Loan amount 변경 → LTV/DSR/monthly payment 확인 → 구매 → Loan 생성 → BUY transaction → 내 자산 → Debt → Ownership → Net Worth → 다음 simulated month repayment

## 18. 변경 금지

Economic Engine 핵심, Property Master, IA-04D, FIXED_ONE Supply, Transaction Atomicity, Security Rules, Research durability, Idempotency architecture, Time-Slip architecture를 임의 변경하지 않는다.

## 19. Simulation 금지

이번 작업 중 10P/11P/P360 Simulation을 실행하지 않는다.

## 20. 최종 보고서

반드시:
1. Firebase root cause
2. 수정 파일
3. App initialization 변경
4. BUY Function 결과
5. Cash-only BUY
6. Loan calculation
7. LTV
8. DSR
9. Loan + BUY atomicity
10. Repayment
11. Idempotency
12. Rollback
13. Research
14. Browser E2E
15. IA-03C regression
16. 추가 이슈
17. 최종 PASS / PASS WITH FINDINGS / BLOCKED

모든 필수 테스트가 PASS해야 `READY FOR HUMAN BUY / LOAN E2E`로 판정한다.
