# PLAY 대출 Funding Check 정상화 구현 명세서 v1.0

## 1. 문서 목적

현재 PLAY Human BUY 과정의 `자금 확인 및 대출 (Funding Check)` 화면은 대출 계산 및 UI 연동이 정상적으로 동작하지 않는다.

본 명세서는 기존 PLAY의 대출 정책을 유지하면서 다음 기능을 정상화하는 것을 목적으로 한다.

1. 최대 가능 대출금액을 LTV와 DSR 계산 결과로 명확하게 표시
2. 대출 신청금액 슬라이더를 유지하면서 4단계 인덱스 표시
3. 대출 신청금액 변경 시 예상 월 상환액을 실시간 재계산
4. 상환기간을 최대 시즌 잔여기간으로 표시
5. 월 상환액을 `0.0억/월`과 같은 약식 표기가 아닌 실제 원화 금액으로 표시
6. 자금 부족/충분 상태를 신청금액에 따라 실시간 반영
7. 최종 BUY 실행 시 서버가 동일한 조건을 재검증
8. 기존 IA-03C BUY의 원자성·멱등성·Research Logging을 유지

---

## 2. 현재 화면

기존 화면 구조는 유지한다.

```text
┌────────────────────────────────────┐
│ ■ 자금 확인 및 대출 (Funding Check) │
├────────────────────────────────────┤
│ 매물 가격                    10.9억 │
│                                    │
│ 최대 가능 대출             5.6억   │
│                           (LTV 70%  │
│                            DSR 50%) │
│                                    │
│ 대출 신청 금액              5.6억   │
│             ───────────────●       │
│                                    │
│ 예상 월 상환액              0.0억/월│
│                         (금리 4.70%)│
│                                    │
│ 보유 현금                    2.3억  │
│                                    │
│ 필요 자금(비용 포함)        11.3억  │
│                                    │
│ 자금 상태                  자금 부족 │
│                                    │
│ 비용 확인 (Transaction Cost)       │
│ 취소                               │
└────────────────────────────────────┘
```

---

## 3. 기존 정책 유지

### 3.1 LTV

```text
LTV 한도 = 매물 가격 × LTV 비율
```

실제 LTV는 Season의 권위 있는 Loan Configuration을 사용한다.

### 3.2 DSR

기존 PLAY 정책:

```text
DSR 최대 한도 = 50%
```

```text
DSR = 연간 부채 원리금 상환액 / 연간 소득
```

기존 부채가 있는 경우 기존 부채의 연간 상환액도 포함한다.

### 3.3 최대 가능 대출

```text
최대 가능 대출
= MIN(LTV 한도, DSR 한도, 필요 자금)
```

DSR 한도는 해당 금리와 상환기간을 기준으로 허용 가능한 원리금 상환액을 역산하여 대출원금으로 환산한다.

---

## 4. 최대 가능 대출 UI

기존:

```text
최대 가능 대출       5.6억 (LTV 70% DSR 50%)
```

변경:

```text
최대 가능 대출       5.6억
LTV·DSR 계산 결과 중 낮은 금액 적용
LTV 70% · DSR 50% 기준
```

보조 문구는 작게 표시한다.

목적은 사용자가 최대 가능 대출금액이 LTV와 DSR 계산 결과임을 즉시 이해하도록 하는 것이다.

---

## 5. 대출 신청금액 슬라이더

현재 슬라이더를 유지한다.

슬라이더 아래에 4단계 인덱스를 표시한다.

```text
대출 신청 금액                       5.6억

───────────────●──────────────────
       │        │        │        │
      25%      50%      75%      100%
```

### 4단계 기준

`MAX_LOAN`을 최대값으로 한다.

```text
1단계 = MAX_LOAN × 25%
2단계 = MAX_LOAN × 50%
3단계 = MAX_LOAN × 75%
4단계 = MAX_LOAN × 100%
```

슬라이더 자체는 4단계로 고정하지 않는다. 기존처럼 연속적으로 이동 가능해야 한다.

### 최소/최대

```text
min = 0
max = MAX_LOAN
step = 시스템에서 정의한 원화 단위
```

화면 표시와 내부 계산을 분리한다.

```text
화면: 5.6억
내부: 560,000,000
```

---

## 6. 예상 월 상환액

현재의 `0.0억/월` 표현은 제거한다.

### 금지

```text
0.0억/월
2.3억/월
0.23억/월
```

### 허용

```text
234,567원/월
1,234,567원/월
12,345,678원/월
```

예:

```text
예상 월 상환액       2,345,678원/월
금리 4.70%
```

월 상환액은 반드시 실제 원화 정수값을 천 단위 콤마로 표시한다.

---

## 7. 상환기간

화면에 상환기간을 추가한다.

예:

```text
예상 월 상환액       2,345,678원/월
금리 4.70% · 상환기간 60개월
```

### 계산

```text
상환기간
= MIN(Loan Configuration 최대 상환기간, Season 잔여 시뮬레이션 기간)
```

기본 Loan Configuration 최대 상환기간은 360개월이다.

예:

| 현재 시뮬레이션 기간 | Season 잔여기간 | 적용 상환기간 |
|---:|---:|---:|
| P001 | 359개월 | 359개월 |
| P060 | 300개월 | 300개월 |
| P180 | 180개월 | 180개월 |
| P300 | 60개월 | 60개월 |
| P350 | 10개월 | 10개월 |

---

## 8. 월 상환액 계산

PLAY 기본 상환방식은 원리금균등상환이다.

대출 신청금액 `P`, 월 이자율 `r`, 상환개월 `n`일 때:

```text
M = P × r × (1+r)^n / ((1+r)^n - 1)
```

```text
P = 대출 신청금액
r = 연이율 / 12
n = 적용 상환기간(개월)
```

금리가 0%인 경우:

```text
M = P / n
```

---

## 9. 실시간 계산

슬라이더를 움직이는 순간 다음 값이 모두 재계산되어야 한다.

```text
대출 신청금액
      ↓
월 상환액
      ↓
연간 부채상환액
      ↓
DSR
      ↓
자금 상태
```

즉:

```text
REQUESTED_LOAN 변경
      ↓
calculateMonthlyPayment()
      ↓
calculateDSR()
      ↓
calculateFundingStatus()
      ↓
renderFundingCheck()
```

페이지 새로고침이나 서버 호출을 기다릴 필요가 없다.

단, 최종 BUY 실행 시 서버가 동일한 조건을 재계산하여 검증한다.

---

## 10. Funding 계산

```text
필요 자금 = 매물 가격 + 거래비용
```

실제 자금 상태는:

```text
보유 현금 + 대출 신청금액 >= 필요 자금
```

이면 `자금 충분`, 아니면 `자금 부족`이다.

---

## 11. 최대 가능 대출과 신청금액 구분

### 최대 가능 대출

```text
MAX_LOAN
```

시스템이 계산한 최대치.

### 대출 신청금액

```text
REQUESTED_LOAN
```

사용자가 실제로 선택한 금액.

반드시:

```text
REQUESTED_LOAN <= MAX_LOAN
```

이어야 한다.

---

## 12. 슬라이더 변경 시 검증

매 input 이벤트마다 다음을 확인한다.

```text
REQUESTED_LOAN >= 0
REQUESTED_LOAN <= MAX_LOAN
CALCULATED_DSR <= 50%
CASH + REQUESTED_LOAN >= REQUIRED_FUNDING
```

자금 부족이어도 슬라이더 탐색은 허용한다. 단, MAX_LOAN 초과 선택은 허용하지 않는다.

---

## 13. BUY 진행 활성화 조건

다음 조건을 모두 만족해야 최종 BUY를 실행할 수 있다.

```text
1. 매물 상태 정상
2. 매물 구매 가능
3. REQUESTED_LOAN <= MAX_LOAN
4. DSR 조건 충족
5. LTV 조건 충족
6. 보유 현금 + 대출 >= 필요 자금
7. Season ACTIVE
8. participant 상태 정상
9. Property 공급 가능
```

하나라도 충족하지 못하면 BUY 실행을 서버에 요청하지 않는다.

---

## 14. 서버 재검증

브라우저 계산값은 권위 있는 값으로 취급하지 않는다.

최종 BUY 요청 시 서버에서 다시 계산한다.

```text
Client requestedLoan
        ↓
Server
        ↓
Season Loan Config
        ↓
Property Price
        ↓
Transaction Fee
        ↓
Player Income
        ↓
Existing Debt
        ↓
LTV
        ↓
DSR
        ↓
Funding
        ↓
Loan + BUY
```

브라우저와 서버 계산 결과가 다르면 서버 결과를 기준으로 처리한다.

---

## 15. Loan + BUY 원자성

대출 구매는 하나의 경제적 거래로 취급한다.

다음 작업은 하나의 Firestore Transaction에서 처리한다.

```text
1. Loan 생성
2. Player Debt 증가
3. Cash 변경
4. Property Ownership 변경
5. Primary Supply 변경
6. Property Transaction 기록
7. Decision Log 기록
8. Idempotency 기록
```

중간 하나라도 실패하면 전체 Rollback한다.

---

## 16. 월 상환 계산과 Season 시간

PLAY 시뮬레이션 기간은 월 단위다.

각 Simulation Period에서 대출 상환은 다음 구조를 사용한다.

```text
이자 = 잔여 원금 × 월 이자율
원금 = 월 상환액 - 이자
잔여 원금 = 기존 잔여 원금 - 원금
```

단, 본 명세의 UI 구현 단계에서는 실제 월 상환 실행 자체를 새로 구현하지 않는다. 현재 신청조건에 따른 예상 월 상환액을 정확히 계산하여 표시하는 것이 범위다.

---

## 17. 권장 UI 예시

```text
매물 가격                    10.9억

최대 가능 대출                5.6억
LTV·DSR 계산 결과 중 낮은 금액 적용
LTV 70% · DSR 50% 기준

대출 신청 금액                5.6억

───────────────●────────────
       │        │        │        │
      25%      50%      75%      100%

예상 월 상환액            2,345,678원/월
금리 4.70% · 상환기간 60개월

보유 현금                    2.3억

필요 자금(비용 포함)        11.3억

자금 상태                  자금 부족

[ 비용 확인 (Transaction Cost) ]
[             취소             ]
```

슬라이더를 절반으로 내리면 신청금액과 월 상환액이 동시에 즉시 변경되어야 한다.

---

## 18. 표시 포맷

### 큰 금액

기존 UX를 유지할 수 있다.

```text
10.9억
5.6억
2.3억
```

### 월 상환액

반드시 실제 숫자를 표시한다.

```text
2,345,678원/월
```

`0.0억/월` 등의 약식 표현은 금지한다.

### 반올림

내부 계산은 가능한 한 원화 단위의 정확한 숫자를 유지한다.

화면 표시 시:

```text
Math.round(monthlyPayment)
```

후 천 단위 콤마를 적용한다.

---

## 19. 데이터 흐름

```text
Season State
 ├─ current_period
 ├─ total_periods
 └─ remaining_periods
          ↓
Loan Configuration
 ├─ LTV
 ├─ DSR
 ├─ Base Rate
 ├─ Spread
 └─ Max Term
          ↓
Participant State
 ├─ Cash
 ├─ Income
 └─ Existing Debt
          ↓
Property
 ├─ Price
 └─ Transaction Cost
          ↓
Funding Calculator
          ↓
MAX_LOAN
REQUESTED_LOAN
RATE
TERM
MONTHLY_PAYMENT
DSR
REQUIRED_FUNDING
FUNDING_STATUS
          ↓
Funding Check UI
```

---

## 20. 기존 IA-03C와의 관계

본 작업은 새로운 BUY 경제엔진을 만드는 작업이 아니다.

기존 IA-03C에서 검증된 다음 요소는 그대로 유지한다.

- Server Authority
- 서버측 BUY 검증
- Transaction Fee 계산
- Primary Supply
- Player Asset
- Property Ownership
- Property Transaction
- Decision Log
- Idempotency
- Research Logging
- Atomic Firestore Transaction
- Rollback

이번 작업의 핵심은 **Funding Check UI와 Loan Calculation을 실제 BUY 실행 흐름에 정확하게 연결하는 것**이다.

---

## 21. 구현 단계

### STEP 1. 현재 오류 원인 확인

먼저 기존 구현을 조사한다.

```text
Firebase initialization
firebase.app()
firebase.functions()
Functions region
Auth state
Loan calculation function
Funding Check rendering
Slider event
BUY request payload
```

현재 계산값이 `0.0억/월`로 표시되는 직접적인 원인을 확인한다.

### STEP 2. Funding Calculator 분리

UI 코드에 계산식을 직접 흩어놓지 않는다.

권장 단위:

```text
calculateFunding()
calculateMaxLoan()
calculateDSRLoanLimit()
calculateMonthlyPayment()
calculateRemainingTerm()
calculateFundingStatus()
```

### STEP 3. Slider 연결

```text
slider input
      ↓
REQUESTED_LOAN 변경
      ↓
calculateMonthlyPayment()
      ↓
calculateDSR()
      ↓
calculateFundingStatus()
      ↓
renderFundingCheck()
```

### STEP 4. 실제 Season State 연결

다음 값들을 화면 코드에 하드코딩하지 않는다.

```text
700,000,000
50%
4.70%
360개월
```

실제 `PLAYER_STATE`, `SEASON_STATE`, `LOAN_CONFIG`, `PROPERTY`에서 가져온다.

### STEP 5. Browser Human E2E

```text
Property
 ↓
Listing
 ↓
Buy
 ↓
Funding Check
 ↓
Loan Slider
 ↓
Monthly Payment 변경 확인
 ↓
Funding Status 변경 확인
 ↓
BUY
 ↓
Result
 ↓
My World
```

---

## 22. 필수 테스트

### T01 — 최대 대출 계산

LTV와 DSR 중 작은 값이 최대 대출로 선택되는지 확인한다.

### T02 — 최대 대출 설명

화면에 LTV/DSR 산출 근거가 표시되는지 확인한다.

### T03 — Slider 4단계

25 / 50 / 75 / 100% 인덱스가 표시되는지 확인한다.

### T04 — Slider 연속 이동

4단계 사이에서도 자유롭게 이동되는지 확인한다.

### T05 — 월 상환액

대출 신청금액 변경 시 월 상환액이 즉시 변경되는지 확인한다.

### T06 — 월 상환액 실제 숫자

`1,234,567원/월` 형태인지 확인한다.

`0.0억/월`이 나오면 FAIL이다.

### T07 — 상환기간

현재 Season 잔여기간이 60개월이면 `상환기간 60개월`로 계산되는지 확인한다.

### T08 — 금리

실제 Loan Configuration의 금리가 표시되는지 확인한다.

### T09 — DSR

대출금액 변경 시 DSR이 재계산되는지 확인한다.

### T10 — Funding Status

대출금액 변경에 따라 `자금 부족 ↔ 자금 충분`이 실시간 변경되는지 확인한다.

### T11 — MAX 초과

슬라이더가 MAX_LOAN을 초과하지 않는지 확인한다.

### T12 — Cash-only BUY

대출 없이 구매 가능한 매물이 정상 구매되는지 확인한다.

### T13 — Loan BUY

대출 포함 구매가 정상적으로 실행되는지 확인한다.

### T14 — Loan + BUY Atomicity

Loan 생성과 BUY 중 하나가 실패하면 전체 Rollback 되는지 확인한다.

### T15 — Duplicate Request

동일 요청을 반복해도 Loan, Ownership, Transaction, Cash 변경이 중복되지 않는지 확인한다.

### T16 — IA-03C Regression

기존 현금 BUY 기능에 회귀가 없는지 확인한다.

---

## 23. 완료 조건

다음 조건을 모두 만족해야 본 작업을 완료한다.

```text
[ ] 최대 가능 대출이 LTV/DSR 계산으로 정상 산출
[ ] 최대 가능 대출의 산출 근거가 UI에 표시
[ ] 슬라이더 유지
[ ] 4단계 인덱스 표시
[ ] 슬라이더 연속 이동 가능
[ ] 신청금액 실시간 변경
[ ] 금리 정상 표시
[ ] Season 잔여기간 기반 상환기간 표시
[ ] 월 상환액 실시간 계산
[ ] 실제 원화 숫자 표시
[ ] 0.0억/월 제거
[ ] DSR 실시간 재계산
[ ] Funding Status 실시간 재계산
[ ] 서버 재검증
[ ] Loan + BUY 원자성 유지
[ ] Idempotency 유지
[ ] Research Logging 유지
[ ] 기존 IA-03C BUY 회귀 없음
[ ] 실제 Browser Human E2E PASS
```

최종 상태는 다음 중 하나로 판정한다.

```text
READY FOR HUMAN BUY E2E
```

또는

```text
BLOCKED — VERIFICATION FAILURE
```

또는

```text
BLOCKED — TECHNICAL DEPENDENCY
```

임의로 `PASS`를 선언하지 않는다.
