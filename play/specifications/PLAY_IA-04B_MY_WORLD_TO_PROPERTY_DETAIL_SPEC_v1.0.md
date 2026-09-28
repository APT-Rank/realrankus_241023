# PLAY IA-04B MY WORLD → PROPERTY DETAIL SPEC v1.0

Status: EXECUTION SPEC
Phase: Human Product / Functional Build
Stage: IA-04B
Precondition: IA-04A READY FOR IA-04B

---

# 1. Purpose

IA-04B의 목적은 사용자가 MY WORLD에서 자신이 보유한 부동산을 선택하고, 해당 자산의 실제 단지/Property 정보와 자신의 ownership context를 함께 확인할 수 있도록 하는 것이다.

핵심 흐름:

MY WORLD
→ OWNED PROPERTY SELECT
→ PROPERTY DETAIL
→ MY WORLD / WORLD

IA-04B에서는 새로운 경제 transaction을 만들지 않는다.

---

# 2. Current Verified State

IA-03C Actual Buy는 Firebase Emulator에서 검증되었다.

IA-04A에서는:

- BUY RESULT
- authoritative Player State refresh
- Cash
- Property Count
- Net Worth
- Owned Property
- MY WORLD

가 구현되어 READY FOR IA-04B 상태다.

IA-04B는 이 상태를 기반으로 보유 자산의 상세 정보로 확장한다.

---

# 3. Product Principle

사용자가 구매한 뒤 단순히 "내 부동산 1개 보유"로 끝나는 것이 아니라:

> 내가 무엇을 소유하고 있는가?
> → 그것은 어떤 단지인가?
> → 어떤 시장에 위치하는가?
> → 내가 얼마에 취득했는가?
> → 지금 무엇을 더 탐색할 수 있는가?

를 이해할 수 있어야 한다.

단, 현재 제공되지 않는 정보는 추정하지 않는다.

---

# 4. Scope

## IN SCOPE

1. MY WORLD owned property card selection
2. selected owned property state
3. PROPERTY DETAIL
4. ownership summary
5. Property Master / complex summary
6. market/reference information when authoritative data exists
7. map context when existing data/state supports it
8. MY WORLD return
9. WORLD return
10. Research Exposure hook
11. IA-04A regression
12. IA-03C regression

## OUT OF SCOPE

- SELL
- SELL listing/order
- Secondary Market transaction
- New transaction architecture
- Price prediction
- Artificial current market value
- New economic rules
- People
- Season
- Ranking
- Notification
- Rewards
- Visual refinement

---

# 5. Object Definition

IA-04B에서는 다음 객체를 명확히 구분한다.

## Ownership

사용자가 실제로 보유하고 있는 자산 기록.

Authoritative source:
`getPlayerState` ownership data.

주요 정보:
- ownership_id
- season_id
- property_id
- player_id
- acquisition_price
- acquired_at

## Property / Complex

해당 property의 시장/단지 정보.

Authoritative source:
Property Master 및 현재 repository에서 실제 제공되는 property data.

주요 정보는 실제 schema에 존재하는 필드만 사용한다.

---

# 6. Identity Rule

Property Detail의 대상은 반드시:

`ownership.property_id`

를 기준으로 결정한다.

다음은 금지한다.

- property name으로 추정 매칭
- address로 임의 매칭
- index 순서로 매칭
- 다른 property_id로 fallback
- 비슷한 이름의 complex 선택

관계:

```text
MY WORLD
  ↓
OWNERSHIP
  ↓
property_id
  ↓
PROPERTY MASTER
  ↓
PROPERTY DETAIL
```

---

# 7. Property Detail Information Architecture

## A. Ownership Summary

표시 가능한 경우:

- 보유 상태
- 취득 가격
- 취득 일자
- ownership_id

예:

```text
보유 중

취득가격
₩XXX

취득일
YYYY-MM-DD
```

Ownership 데이터가 authoritative source다.

---

## B. Complex Summary

Property Master에서 실제 제공되는 값만 표시한다.

가능한 정보 예:

- 단지명
- property_id / complex_id
- 대표면적
- 세대수
- 법정동 주소
- 도로명 주소
- 좌표
- source information

실제 schema에 없는 값은 만들지 않는다.

---

## C. Market Context

현재 시스템에서 authoritative하게 제공되는 경우에만 표시한다.

예:

- initial/reference price
- recent sales
- available market information

현재 market value가 authoritative하게 제공되지 않는 경우:

`현재 가치 정보 없음`

으로 표시한다.

다음은 금지한다.

- 임의 상승률 적용
- last_sales를 current value로 오인
- 평균가격 추정
- 인근 단지 가격으로 추정
- AI 예측가격
- synthetic market value

---

# 8. Map Context

기존 WORLD map / property coordinate가 실제 사용 가능하다면 Property Detail에서 해당 위치를 보여줄 수 있다.

가능한 경우:

```text
PROPERTY DETAIL
      ↓
MAP CONTEXT
      ↓
WORLD
```

좌표가 없거나 map context 연결이 현재 구조상 불가능하면:

`지도 정보 없음`

으로 처리한다.

새로운 지도 backend를 만들지 않는다.

---

# 9. Navigation

Property Detail에서 최소 다음을 제공한다.

### Button 1
`내 세계`

→ MY WORLD

### Button 2
`세계로 돌아가기`

→ WORLD

현재 단계에서:

`매도`

또는

`판매 등록`

버튼의 실제 action을 구현하지 않는다.

SELL은 별도 단계에서 설계한다.

---

# 10. State Flow

```text
MY WORLD
   ↓
SELECT OWNED PROPERTY
   ↓
PROPERTY DETAIL
   ├── OWNERSHIP
   ├── PROPERTY MASTER
   ├── MARKET CONTEXT
   └── MAP CONTEXT
   ↓
MY WORLD / WORLD
```

Invalid state:

```text
MY WORLD
   ↓
INVALID property_id
   ↓
PROPERTY NOT FOUND
```

Ownership가 없거나 property master와 연결되지 않는 경우도 정상적인 error/empty state로 처리한다.

---

# 11. Data Source Priority

## Ownership Data

1. `getPlayerState`
2. authoritative backend response

## Property Data

1. existing Property Master
2. existing `/play` property data derived from Property Master

## Market Data

1. existing authoritative market data
2. 없으면 표시하지 않음

Client-side estimation은 authoritative source가 아니다.

---

# 12. No Fake Data Rule

다음 데이터는 fake로 만들지 않는다.

- ownership
- acquisition price
- acquisition date
- property_id
- complex name
- household count
- representative area
- address
- market value
- recent sales

데이터가 없으면:

`정보 없음`

또는:

`현재 정보 없음`

으로 처리한다.

---

# 13. Research Logging

IA-04B에서는 경제 transaction을 생성하지 않는다.

다음 Exposure hook만 준비한다.

- MY WORLD exposure
- OWNED PROPERTY selection
- PROPERTY DETAIL exposure

기존 Research Logging infrastructure를 재사용한다.

새 collection/schema/architecture를 만들지 않는다.

새 Research schema가 필요하면 STOP하고 보고한다.

---

# 14. Security

Client direct Firestore write 금지.

IA-04B는 read/display 기능이다.

Client가 다음을 변경해서는 안 된다.

- ownership
- acquisition price
- player asset
- transaction
- property master

---

# 15. Protected Areas

불필요하게 다음을 수정하지 않는다.

- Economic Engine
- Season Clock
- Batch Processing
- Reliability
- `purchasePrimaryProperty`
- Security Rules
- Research Logging core
- Research DLQ
- Property Master source
- RealRankers core
- `app_main_lang.js`

필수 변경이 발견되면 STOP하고 보고한다.

---

# 16. Functional Tests

## IA04B-01
MY WORLD에서 owned property card를 선택할 수 있다.

## IA04B-02
선택된 property_id가 ownership의 property_id와 정확히 일치한다.

## IA04B-03
Property Master와 정확하게 join된다.

## IA04B-04
ownership acquisition price가 정확히 표시된다.

## IA04B-05
ownership acquisition date가 정확히 표시된다.

## IA04B-06
complex name이 실제 Property Master 값과 일치한다.

## IA04B-07
representative area가 실제 데이터와 일치한다.

## IA04B-08
household count/address 등 실제 제공 필드가 정확히 표시된다.

## IA04B-09
market information이 존재할 때 실제 값을 표시한다.

## IA04B-10
market information이 없을 때 fake value를 만들지 않는다.

## IA04B-11
invalid property_id를 안전하게 처리한다.

## IA04B-12
ownership/property join 실패를 안전하게 처리한다.

## IA04B-13
MY WORLD로 정상 복귀한다.

## IA04B-14
WORLD로 정상 복귀한다.

## IA04B-15
Research Exposure hook이 연결된다.

## IA04B-16
IA-04A regression PASS.

## IA04B-17
IA-03C regression PASS.

## IA04B-18
IA-04B에서 경제 상태 mutation이 발생하지 않는다.

---

# 17. Failure Handling

다음 상태를 구분한다.

### Ownership 없음

`보유 자산 정보를 찾을 수 없습니다.`

### Property 없음

`부동산 정보를 찾을 수 없습니다.`

### Market 정보 없음

`현재 시장 정보 없음`

### Backend read failure

`정보를 불러오지 못했습니다.`

어떤 경우에도 임의의 데이터를 표시하지 않는다.

---

# 18. UI Principle

현재 개발 단계는 Functional Build다.

따라서:

- 기본 카드
- 기본 버튼
- 기본 command panel
- 기존 map component

를 사용한다.

다음은 이번 단계의 목표가 아니다.

- pixel-perfect design
- animation
- advanced chart
- visual QA
- final color system
- final typography
- decorative effects

---

# 19. Completion Criteria

다음 모두 PASS해야 한다.

- owned property selection
- property_id identity
- ownership → Property Master join
- ownership data
- complex data
- market data availability handling
- invalid data handling
- MY WORLD navigation
- WORLD navigation
- Research Exposure hook
- IA-04A regression
- IA-03C regression
- no economic mutation
- no fake data
- protected architecture intact

---

# 20. Progression Rule

IA-04B가 완료되면 다음 단계는 별도 Product Owner 승인 후 정의한다.

예상 다음 단계:

`SELL / PROPERTY DISPOSITION`

단, IA-04B 완료 전에 SELL을 구현하지 않는다.

---

# 21. Final Report

생성 파일:

`PLAY_IA-04B_IMPLEMENTATION_REPORT.md`

반드시 포함:

1. Current State
2. Files Changed
3. State Flow
4. Data Source Mapping
5. Property Identity Mapping
6. Ownership Mapping
7. Market Data Handling
8. Tests
9. IA-04A Regression
10. IA-03C Regression
11. Protected Area Diff
12. Failure / Fix / Re-test History
13. Remaining Issues
14. Final Status

Final status:

`READY FOR NEXT STEP`

또는

`BLOCKED`
