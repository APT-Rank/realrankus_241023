# PLAY IA-04B MY WORLD → PROPERTY DETAIL
# AG EXECUTION PROMPT v1.0

## ROLE

IA-04B만 구현하고 검증한다.

반드시 먼저:

`PLAY_IA-04B_MY_WORLD_TO_PROPERTY_DETAIL_SPEC_v1.0.md`

를 읽는다.

이 문서를 Product Owner 승인 Execution Spec으로 취급한다.

---

# 1. SOURCE DOCUMENTS

작업 시작 전에 반드시 읽는다.

1. `PLAY_IA-04B_MY_WORLD_TO_PROPERTY_DETAIL_SPEC_v1.0.md`
2. `PLAY_IA-04A_IMPLEMENTATION_REPORT.md`
3. `PLAY_IA-04A_BUY_RESULT_TO_MY_WORLD_SPEC_v1.0.md`
4. `PLAY_IA-03C_VERIFICATION_FINAL_REPORT.md`

그리고 실제 repository code를 확인한다.

---

# 2. CURRENT STATE

IA-03C:
Firebase Emulator verification PASS.

IA-04A:
BUY RESULT → authoritative Player State → MY WORLD 구현 완료.
Status: READY FOR IA-04B.

IA-04B의 목적은 MY WORLD에서 실제 보유 자산을 선택하여 PROPERTY DETAIL로 연결하는 것이다.

---

# 3. PRIMARY FLOW

구현:

`MY WORLD → OWNED PROPERTY SELECT → PROPERTY DETAIL`

PROPERTY DETAIL에서:

`MY WORLD`
또는
`WORLD`

로 돌아갈 수 있어야 한다.

---

# 4. FIRST ACTION — SCHEMA INSPECTION

코딩 전에 반드시 실제 schema를 확인한다.

확인:

- `getPlayerState` response
- ownership fields
- property_id
- ownership_id
- acquisition_price
- acquired_at
- Property Master fields
- representative area
- household count
- address
- coordinates
- initial/reference price
- recent sales fields

필드명을 추정하지 않는다.

---

# 5. IDENTITY RULE

Property Detail의 대상은 반드시:

`ownership.property_id`

이다.

이 값을 Property Master의 property_id/complex_id와 정확히 매칭한다.

금지:

- 이름 기반 추정
- 주소 기반 추정
- index 기반 추정
- 유사 단지 fallback
- 다른 property_id 사용

---

# 6. DATA SEPARATION

다음 데이터를 섞지 않는다.

### Ownership

사용자가 실제 보유한 상태:

- ownership_id
- property_id
- acquisition_price
- acquired_at

### Property Master

부동산/단지 정보:

- complex name
- representative area
- household count
- address
- coordinates
- 실제 존재하는 metadata

### Market

실제로 제공되는 authoritative market information.

각 source를 코드상에서도 명확히 구분한다.

---

# 7. PROPERTY DETAIL

최소 표시:

## Ownership

- 보유 중
- 취득가격
- 취득일
- ownership_id (필요 시)

## Complex

- 단지명
- property_id
- 대표면적
- 세대수
- 주소
- 실제 존재하는 기타 metadata

## Market

실제로 제공되는 경우에만:

- initial/reference price
- recent sales

없으면:

`현재 정보 없음`

---

# 8. CURRENT MARKET VALUE

현재 시장가치가 authoritative하게 제공되지 않는다면:

절대 계산하지 않는다.

금지:

- appreciation %
- last_sales fallback
- nearby complex average
- arbitrary estimate
- AI prediction
- synthetic value

표시:

`현재 가치 정보 없음`

---

# 9. MAP

Property Master에 좌표가 있고 기존 map infrastructure로 연결할 수 있으면 해당 위치를 보여준다.

새로운 map backend를 만들지 않는다.

연결이 어렵거나 데이터가 없으면:

`지도 정보 없음`

---

# 10. SELL

절대 구현하지 않는다.

SELL button의 실제 action을 만들지 않는다.

SELL은 별도 단계에서 Product Owner 승인 후 설계한다.

---

# 11. RESEARCH LOGGING

기존 Research Logging을 재사용한다.

가능한 Exposure:

- MY WORLD
- OWNED PROPERTY SELECT
- PROPERTY DETAIL

새 collection/schema/architecture를 만들지 않는다.

새 Research schema가 필요하면:

STOP

하고 보고한다.

---

# 12. SECURITY

IA-04B는 read/display 기능이다.

절대 client write를 추가하지 않는다.

변경 금지:

- ownership
- cash
- transaction
- player asset
- property master

---

# 13. PROTECTED AREAS

다음은 수정하지 않는다.

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

필수 변경이면 즉시 STOP.

---

# 14. FUNCTIONAL TESTS

실행:

### IA04B-01
owned property card 선택.

### IA04B-02
property_id 정확성.

### IA04B-03
Property Master join.

### IA04B-04
acquisition price 정확성.

### IA04B-05
acquisition date 정확성.

### IA04B-06
complex name 정확성.

### IA04B-07
representative area 정확성.

### IA04B-08
household/address 정확성.

### IA04B-09
market data 존재 시 실제 값.

### IA04B-10
market data 없음 시 fake value 없음.

### IA04B-11
invalid property_id 처리.

### IA04B-12
ownership/property join failure 처리.

### IA04B-13
MY WORLD return.

### IA04B-14
WORLD return.

### IA04B-15
Research Exposure hook.

### IA04B-16
IA-04A regression.

### IA04B-17
IA-03C regression.

### IA04B-18
no economic mutation.

---

# 15. NO FAKE DATA

UI dummy object는 허용한다.

Business/economic data는 허용하지 않는다.

Fake 금지:

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

없으면 정보 없음.

---

# 16. TESTING PRINCIPLE

DOM이 존재하는지만 확인하지 않는다.

다음 실제 data flow를 검증한다.

`getPlayerState`
→ ownership
→ property_id
→ Property Master
→ PROPERTY DETAIL

그리고 Property Detail의 표시값이 source data와 일치하는지 확인한다.

---

# 17. FAILURE LOOP

FAIL:

Root Cause
→ Minimum Fix
→ Failed Test 재실행
→ Regression
→ PASS

Assertion을 약화하지 않는다.

Fake data로 대체하지 않는다.

---

# 18. NO PROGRESSION

IA-04B 검증 완료 전:

- SELL
- Secondary Market
- People
- Season
- Ranking
- Notification
- Visual Refinement

을 구현하지 않는다.

---

# 19. FINAL REPORT

다음 파일을 생성한다.

`PLAY_IA-04B_IMPLEMENTATION_REPORT.md`

포함:

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

---

# 20. STOP CONDITION

다음이 필요하면 즉시 STOP:

- new economic rules
- new transaction architecture
- new Firestore schema
- new security rule
- new Player State architecture
- modification of verified IA-03C transaction
- new market valuation algorithm
- new Secondary Market logic

보고:

1. conflict
2. why required
3. affected area
4. possible options
5. recommendation

Product Owner approval 전에는 진행하지 않는다.
