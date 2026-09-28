# PLAY-07.1.1 ECONOMIC PARAMETER FINALIZATION

## 1. 목적
PLAY-07.1 Income & Expense Engine 구현을 위한 Season 1 경제 파라미터를 최종 확정한다. 본 문서의 값과 규칙은 구현 기준값(Baseline)으로 사용한다. 기존 설계와 충돌하면 임의로 수정하지 않고 BLOCK 후 확인한다.

## 2. 최종 확정
| ID | 항목 | 최종값 |
|---|---|---|
| EP-01 | Simulation Period | 1개월 |
| EP-02 | Season Length | 30년 = 360 Periods |
| EP-03 | Income Model | 현실 변동형 |
| EP-04 | Inflation Model | 경기순환형 |
| EP-05 | Economic Shock | Season당 1회 |
| EP-06 | Income-Inflation | Income Growth = Inflation - 0.5%p |
| EP-07 | Income Payment | 월 지급 |
| EP-08 | Living Expense | 월 차감 |
| EP-09 | Season 1 | 모든 Player 동일 |
| EP-10 | Starting Annual Income | 50,000,000 KRW |
| EP-11 | Starting Cash | 700,000,000 KRW |
| EP-12 | Starting Debt | 0 KRW |
| EP-13 | Starting Property | 0 |
| EP-14 | Starting Financial Assets | 0 |

## 3. Simulation Period
- 1 Period = 1 simulated month
- 30 years = 360 periods
- 1 real day ≈ 4 simulated months
- Season 전체는 약 90 real days 기준

## 4. Season 1 Starting Condition
모든 Player는 동일하게 다음에서 시작한다.
- Cash: 700,000,000 KRW
- Debt: 0
- Property: 0
- Financial Asset: 0
- Annual Income: 50,000,000 KRW

## 5. Income Engine
Income은 Inflation에 완전 연동하지 않는다.

`annual_income_growth = annual_inflation - 0.005`

초기 월소득은 `50,000,000 / 12`이다. 원화 정수 처리 및 누적 반올림 규칙은 구현 시 오차가 누적되지 않도록 한다.

## 6. Inflation Engine
Season 1 기본 연간 Inflation:

| Economic Phase | Years | Annual Inflation |
|---|---:|---:|
| Recovery | 1–5 | 2.0% |
| Boom / Overheating | 6–10 | 3.5% |
| Tightening | 11–15 | 2.5% |
| Recession | 16–20 | 1.0% |
| Recovery | 21–25 | 2.0% |
| Growth / Polarization | 26–30 | 2.5% |

월간 Inflation:
`monthly_inflation = (1 + annual_inflation)^(1/12) - 1`

## 7. Income과 Inflation 관계
| Inflation | Income Growth |
|---:|---:|
| 2.0% | 1.5% |
| 3.5% | 3.0% |
| 2.5% | 2.0% |
| 1.0% | 0.5% |

Season 1에서는 물가보다 소득이 0.5%p 낮게 증가하여 실질 구매력이 완만하게 감소하는 구조를 사용한다.

## 8. Living Expense
기존 설계값 유지:
- Basic Living Expense = 3,000,000 KRW/month
- = 36,000,000 KRW/year

생활비는 매 Period 차감하며 Inflation에 따라 조정한다.

`Current Living Expense = Base Living Expense × Cumulative Inflation Factor`

## 9. Monthly Economic Update
기본 순서는:
1. Economic Phase 확인
2. Annual Inflation 확인
3. Monthly Inflation 계산
4. Income Growth 계산
5. Income 업데이트
6. Monthly Income 지급
7. Living Expense 업데이트
8. Monthly Living Expense 차감
9. Cash / Debt / Net Worth 계산
10. last_processed_period 갱신
11. Decision/Event Log 기록
12. Reconciliation

향후 Loan / Property / Financial Asset Engine 추가 시 세부 순서는 해당 명세에서 확정한다.

## 10. Economic Shock
- Season당 정확히 1회
- Player별로 다르게 발생시키지 않음
- 모든 Player에게 동일한 시점/동일한 Shock 적용
- 정확한 발생 Period, 종류, 크기, 지속기간, 계산식은 별도 Scenario Parameter에서 확정

## 11. Season 1 실험 원칙
모든 Player는 동일한:
- Starting Cash
- Starting Debt
- Starting Income
- Income Curve
- Inflation Curve
- Economic Phase
- Economic Shock
- Rule Version
- Scenario Version

을 공유한다.

따라서 차이는 Player의 경제적 행동에서 발생하도록 한다.

## 12. 구현 금지사항
다음은 구현자가 임의 변경하지 않는다.
1. 1 Period = 1개월
2. Season = 360 Periods
3. Starting Cash = 700M KRW
4. Starting Annual Income = 50M KRW
5. Basic Living Expense = 3M KRW/month
6. Inflation Curve
7. Income Growth = Inflation - 0.5%p
8. Monthly Income Payment
9. Monthly Living Expense
10. Season 1 동일 경제환경
11. Season당 1회 Shock 원칙

충돌 발견 시 BLOCK 보고 후 확인한다.

## 13. 미확정 사항
- Shock 발생 정확한 Period
- Shock 종류/크기/지속기간
- Shock의 Inflation 계산식
- Income Shock 여부
- Tax
- Loan Interest
- LTV / DSR
- Property Price
- Rent / Jeonse
- Financial Asset
- Economic Freedom
- Reward
- Season Ranking

## 14. PLAY-07.1 구현 범위
### IN
1개월 Period, 360 Period Season Clock, Starting Income, Income Growth, Monthly Income, Inflation, Monthly Inflation, Basic Living Expense, Monthly Expense, Cash/Net Worth Update, Player/Batch Idempotency, Decision/Event Log, Reconciliation, Failure Recovery.

### OUT
Property Market, Primary/Secondary Market, Buy/Sell, Rent/Jeonse, Loan/LTV/DSR, Tax, GLI, Financial Asset, Reward, Ranking, Hall of Fame, Season Analysis, AI Economic Calculation.

## 15. Final Decision
`① A / ② B / ③ B+D(Season당 1회) / ④ Inflation-0.5%p / ⑤ A / ⑥ A / ⑦ A`

본 문서를 PLAY-07.1 구현의 경제 파라미터 기준문서로 사용한다.
