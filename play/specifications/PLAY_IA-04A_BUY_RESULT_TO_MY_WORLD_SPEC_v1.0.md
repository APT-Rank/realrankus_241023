# PLAY IA-04A BUY RESULT → MY WORLD SPEC v1.0

Status: EXECUTION SPEC
Phase: Human Product / Functional Build
Stage: IA-04A
Precondition: IA-03C Emulator Verification PASS

## 1. Purpose
실제 BUY transaction 성공 직후 사용자가 자신의 경제 상태 변화를 확인하고 MY WORLD로 이동할 수 있도록 한다.
IA-04A에서는 새로운 경제 transaction을 만들지 않는다.

핵심:
ACTUAL BUY → AUTHORITATIVE RESULT → MY WORLD → NEXT DISCOVERY

## 2. Current Verified State
IA-03C에서 실제 BUY, transaction cost, cash mutation, supply mutation, ownership, transaction record, idempotency, concurrency, failure handling, research trace가 Firebase Emulator에서 검증되었다.
IA-04A는 IA-03C transaction logic을 재구현하지 않는다.

## 3. Scope
### IN SCOPE
- BUY RESULT
- authoritative Player State refresh
- MY WORLD entry
- Cash / Property / Net Worth
- acquisition price / transaction cost
- purchased property basic detail
- WORLD navigation
- Research Exposure hooks

### OUT OF SCOPE
- SELL / SELL Transaction
- Secondary Market
- People / Season Ranking / Notification / Rewards
- Advanced portfolio analytics
- AI
- Visual refinement
- New economic rules
- New transaction architecture

## 4. Product Principle
구매 결과는 단순한 “거래 완료”가 아니라 “내 경제 세계가 어떻게 바뀌었는가?”를 이해하게 해야 한다.

BUY → WHAT HAPPENED? → WHAT CHANGED? → WHAT DO I OWN NOW? → WHAT CAN I EXPLORE NEXT?

## 5. BUY RESULT
성공 직후 표시:
- transaction_id
- property_id
- property / complex name
- acquisition price
- transaction cost
- total cash outflow
- acquisition timestamp
- cash available
- property count
- net worth
- ownership confirmation

## 6. Authoritative Data Rule
`getPlayerState`를 호출해 authoritative state를 가져온다.
Transaction result는 실제 transaction response 또는 authoritative backend result를 사용한다.
Client의 stale state나 임의 계산을 authoritative 값으로 사용하지 않는다.

## 7. MY WORLD
최소:
- Cash
- Properties
- Net Worth
- 구매한 property card

Property card:
- complex name
- property_id
- representative area
- acquisition price
- acquisition date
- current/reference value (authoritative data가 존재할 때만)

## 8. Current Property Value
authoritative market value가 없으면 추정·계산·fake value를 사용하지 않는다.
`현재 가치 정보 없음` 또는 `시장가치 산정 전`으로 표시한다.

## 9. Net Worth
backend authoritative state를 우선한다.
client가 `cash + property price` 등으로 계산한 값을 authoritative net worth처럼 표시하지 않는다.

## 10. State Flow
BUY CONFIRMATION → ACTUAL BUY → BUY SUCCESS → GET PLAYER STATE → MY WORLD
실패: BUY → ERROR → BUY DECISION
기존 IA-03C transaction은 수정하지 않는다.

## 11. UI States
기능 우선 단계이므로 기본 UI를 사용한다.
- Loading: `내 경제 상태를 불러오는 중...`
- Success: `구매 완료`
- Refresh: `내 자산을 업데이트하는 중...`
- Empty
- Error

## 12. User Interaction
성공 후:
1. `내 세계 보기` → MY WORLD
2. `구매한 아파트 보기` → purchased property detail/context
3. `세계로 돌아가기` → WORLD
새로운 BUY를 자동 실행하지 않는다.

## 13. Research Logging
새로운 경제 transaction을 기록하지 않는다.
필요 시 BUY RESULT / MY WORLD / PROPERTY DETAIL exposure hooks만 준비한다.
기존 Research Logging infrastructure를 사용하며 새 architecture를 만들지 않는다.

## 14. Backend Boundary
필요한 backend read는 `getPlayerState` 중심으로 한다.
새로운 economic mutation function을 만들지 않는다.

## 15. Security
Client direct Firestore write 금지.
Player asset, ownership, transaction은 client가 직접 수정하지 않는다.

## 16. Protected Areas
다음을 불필요하게 수정하지 않는다:
- Economic Engine
- Season Clock
- Batch Engine
- Reliability Engine
- Property Market transaction core
- `purchasePrimaryProperty`
- Security Rules
- Research Logging core / DLQ
- Property Master
- RealRankers core
- `app_main_lang.js`
필요한 변경이 있으면 STOP하고 보고한다.

## 17. Functional Tests
- IA04A-01 BUY 성공 후 BUY RESULT
- IA04A-02 transaction_id
- IA04A-03 acquisition price
- IA04A-04 transaction cost
- IA04A-05 total cash outflow
- IA04A-06 getPlayerState 호출
- IA04A-07 cash updated correctly
- IA04A-08 ownership updated correctly
- IA04A-09 property count
- IA04A-10 authoritative net worth
- IA04A-11 MY WORLD 진입
- IA04A-12 purchased property display
- IA04A-13 WORLD return
- IA04A-14 player state read failure handling
- IA04A-15 IA-03C regression

## 18. No Fake Data
UI dummy/basic objects는 허용한다.
다음은 fake data 금지:
cash, ownership, acquisition price, transaction cost, transaction_id, property_id, net worth, market value.
없으면 `정보 없음`.

## 19. Completion Criteria
BUY Result, authoritative Player State refresh, purchased property, cash/property count/net worth, transaction information, MY WORLD, WORLD return, read failure handling, IA-03C regression, protected architecture 유지, mock economic data 없음.

## 20. Progression Rule
IA-04A 완료 후 다음은 IA-04B `MY WORLD → PROPERTY DETAIL`.
IA-04A 검증 전 IA-04B를 구현하지 않는다.
SELL은 IA-04B 이후 별도 단계에서 설계한다.

## 21. Final Report
`PLAY_IA-04A_IMPLEMENTATION_REPORT.md`
포함:
- implemented files
- state flow
- backend calls
- UI states
- test results
- IA-03C regression
- protected area diff
- remaining gaps
- final status

Final status:
`READY FOR IA-04B` 또는 `BLOCKED`
