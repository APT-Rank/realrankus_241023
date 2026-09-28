# PLAY_IA_02_COMPLEX_TO_LISTING_SPEC_v1.0

**Status:** IMPLEMENTATION READY  
**Phase:** Human Product / UX — IA-02  
**Scope:** COMPLEX → LISTING  
**Previous Phase:** IA-01 WORLD → REGION → COMPLEX  
**Next Phase:** IA-03 LISTING → DECISION  
**Primary Dataset:** 용인시 수지구 검증 완료 Property Master

---

## 1. 목적

IA-02의 목적은 사용자가 **아파트 단지(Complex)를 선택한 뒤 실제로 구매·관찰할 수 있는 구체적인 매물(Listing)을 발견하고 비교하는 경험**을 구현하는 것이다.

IA-01에서는 지도에서:

```text
WORLD
  ↓
REGION
  ↓
COMPLEX
```

까지 이동할 수 있게 했다.

IA-02에서는 다음 단계로 내려간다.

```text
COMPLEX
  ↓
LISTING
  ↓
LISTING DETAIL
```

이번 단계의 핵심은 **“아파트 단지가 존재한다”에서 “내가 실제로 무엇을 살 수 있는가”로 경험을 전환하는 것**이다.

> 사용자는 단지를 보는 것이 아니라, 그 단지 안에서 실제로 선택 가능한 구체적인 매물을 발견해야 한다.

---

# 2. 반드시 사용하는 기본 데이터

현재 임의 Mock Apartment 데이터를 사용하는 부분을 제거하고, **기존 RealRankers에서 운영·검증했던 용인시 수지구 데이터를 기본 데이터로 사용한다.**

### Source of Truth

```text
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
```

검증 완료 기준:

```text
전체 Complex: 209
NORMAL: 200
INCOMPLETE: 9
```

이 수치는 Property Data Validation 및 AI Season 1 Property Baseline에서 검증된 값이다.

### 데이터 정의

| 원본 | PLAY 사용 |
|---|---|
| 검색코드 | complex_id / property_id, String |
| 아파트명 | complex_name |
| 세대수 | household_count |
| 법정동주소 | legal_address |
| 도로명주소 | road_address |
| X | longitude |
| Y | latitude |
| area_info | 면적 후보 |
| sales_info | 해당 면적의 초기 가격 후보 |

### 대표 면적

대표 거래 단위는:

```text
Complex + Representative Area
```

대표 면적은 **84㎡에 가장 가까운 면적**을 선택한다.

`area_info[n]`과 `sales_info[n]`은 동일 index로 대응한다.

따라서:

```text
Representative Area Index
        ↓
Same sales_info Index
        ↓
Initial Price
```

로 연결한다.

### 절대 금지

초기 가격이 없는 경우 다음을 임의로 사용하지 않는다.

- last_sales
- 다른 면적의 가격
- 단지 평균가격
- 주변 단지 가격
- 추정가격
- 임의 생성가격
- 0원

`INCOMPLETE` Property는 표시할 수 있지만 **구매 가능한 매물로 표시하지 않는다.**

---

# 3. IA-02의 핵심 사용자 경험

사용자 흐름:

```text
WORLD
  ↓
REGION
  ↓
COMPLEX
  ↓
"이 단지에서 무엇을 살 수 있지?"
  ↓
LISTING
  ↓
매물 탐색
  ↓
매물 비교
  ↓
LISTING DETAIL
  ↓
"이 매물을 살지 말지?"
```

이번 단계에서는 마지막의 BUY/SELL 실행까지 가지 않는다.

즉:

```text
LISTING
→ INFORMATION
```

까지만 구현한다.

다음 단계 IA-03에서:

```text
LISTING
→ DECISION
```

을 구현한다.

---

# 4. Desktop UX

기존 IA-01의 구조를 유지한다.

```text
┌───────────────────────────────────────────────────────┐
│                   WORLD MAP                           │
│                                                       │
│                  Complex 위치                         │
│                                                       │
│                                                       │
├───────────────────────────────┬───────────────────────┤
│                               │                       │
│           MAP                 │   COMMAND PANEL       │
│           ~60%                │   ~40%                │
│                               │                       │
│                               │   단지 정보            │
│                               │   매물 목록            │
│                               │   필터/정렬            │
│                               │   매물 상세            │
│                               │                       │
└───────────────────────────────┴───────────────────────┘
```

### 원칙

- 지도는 여전히 세계를 탐험하는 공간이다.
- 우측 패널은 현재 사용자가 보고 있는 대상을 이해하고 다음 행동을 선택하는 공간이다.
- LISTING이 등장해도 Dashboard처럼 변하면 안 된다.
- 숫자를 나열하는 대신 **“이 단지에서 지금 무엇을 선택할 수 있는가”**를 중심으로 구성한다.

---

# 5. Mobile UX

IA는 Desktop과 동일하게 유지하고 공간만 변경한다.

```text
┌──────────────────────────┐
│                          │
│          MAP             │
│        상단 영역          │
│                          │
├──────────────────────────┤
│     COMMAND PANEL        │
│                          │
│ 단지 정보                 │
│ 매물 목록                 │
│ 필터 / 정렬               │
│ 매물 상세                 │
│                          │
└──────────────────────────┘
```

### 원칙

- 지도 → 매물 발견 → 상세 확인의 흐름을 유지한다.
- 모바일에서도 매물 하나를 명확하게 선택할 수 있어야 한다.
- 목록이 길어져도 지도와 패널의 역할이 뒤섞이지 않도록 한다.
- 버튼과 터치 영역은 모바일에서 충분한 크기를 확보한다.

---

# 6. Complex Context Panel

Complex를 선택하면 기존 IA-01 패널을 다음과 같이 확장한다.

```text
WORLD > REGION > COMPLEX

[단지명]

주소
세대수
대표 면적
현재 확인 가능한 매물 수

[이 단지의 매물 보기]
```

핵심 CTA:

> **이 단지의 매물 보기**

단, “구매하세요”, “추천합니다” 등 행동을 유도하는 투자 문구는 사용하지 않는다.

---

# 7. Listing List

Complex 내부의 구체적인 매물을 목록으로 보여준다.

각 Listing Card는 최소 다음 정보를 표시한다.

```text
[매물]

가격
전용면적
층
방향
입주/준공 정보
등록 시점
매물 상태
```

가능한 경우 다음 정보를 추가한다.

```text
최근 실거래가
현재 가격과 최근 실거래가의 차이
최근 거래일
```

### 중요

Listing은 Complex의 하위 정보가 아니라 **PLAY에서 사용자가 실제로 선택할 수 있는 1차 객체**다.

따라서 다음 단계의 핵심 연결이 가능해야 한다.

```text
Complex
   ↓
Listing A
Listing B
Listing C
   ↓
특정 Listing 선택
```

---

# 8. Listing 생성 규칙

현재 실제 Property Master는 Complex + Representative Area 단위의 초기 Property 데이터다.

따라서 IA-02에서 실제 개별 매물 데이터가 아직 PLAY backend에 구축되어 있지 않은 경우:

### 허용

UI 검증을 위한 Listing Adapter / Prototype Data Layer 사용.

단, 임의의 아파트 이름을 새로 만들어서는 안 된다.

예:

```text
complex_id
complex_name
representative_area
initial_price
address
```

등 **검증된 수지구 Property Master에서 가져온 실제 Complex를 기반으로** Listing Prototype을 구성한다.

### 금지

- 존재하지 않는 아파트명 생성
- 검증되지 않은 가격을 실제 가격처럼 표시
- INCOMPLETE Property에 거래 가능 가격 부여
- 다른 지역 데이터를 몰래 혼합
- 임의의 전국 데이터 추가

Prototype Listing은 UI 검증용이면 반드시 UI에서 실제 거래 데이터와 구분 가능하도록 내부 상태를 유지한다.

---

# 9. Listing Filter

초기 구현에서는 과도한 필터를 만들지 않는다.

우선순위:

1. 가격
2. 면적
3. 층
4. 방향
5. 매물 상태

추가 필터는 IA-02 검증 후 필요성을 판단한다.

---

# 10. Listing Sort

초기 정렬:

```text
가격 낮은 순
가격 높은 순
최근 등록 순
면적 작은 순
면적 큰 순
```

정렬 명칭은 모두 한글로 표시한다.

---

# 11. Listing Detail

매물을 클릭하면 Command Panel이 Listing Detail 상태로 전환된다.

예시:

```text
WORLD > 수지구 > ○○아파트 > 매물

[매물 정보]

가격
전용면적
층
방향
입주/준공
등록일

[시장 정보]

최근 실거래가
최근 거래일
현재 가격
가격 차이

[다음 단계]

이 매물을 검토하기
```

이번 IA-02에서는 실제 BUY/SELL 실행 버튼을 만들지 않는다.

---

# 12. 시장 비교 정보

매물 상세에서는 사용자가 가격의 맥락을 이해할 수 있도록 한다.

최소:

```text
현재 매물 가격
최근 실거래 가격
최근 거래일
차이
```

가능하면 간단한 Chart.js 기반 시각화를 사용한다.

단, 차트가 존재하는 것보다 **사용자가 가격을 이해할 수 있는 것**이 우선이다.

---

# 13. 한글화 요구사항

현재 구현되어 있는 영어 UI 문구를 **사용자에게 노출되는 영역에서 모두 한글로 변경한다.**

예:

| 현재 | 변경 |
|---|---|
| WORLD | 세계 |
| REGION | 지역 |
| COMPLEX | 아파트 단지 |
| LISTING | 매물 |
| LISTING DETAIL | 매물 상세 |
| COMMAND PANEL | 상황 패널 |
| BACK TO REGION | 지역으로 돌아가기 |
| BACK TO WORLD | 세계로 돌아가기 |
| VIEW LISTINGS | 매물 보기 |
| PRICE | 가격 |
| AREA | 면적 |
| FLOOR | 층 |
| DIRECTION | 방향 |
| RECENT TRANSACTION | 최근 실거래 |
| CURRENT PRICE | 현재 가격 |
| SORT | 정렬 |
| FILTER | 필터 |
| LOWEST PRICE | 낮은 가격순 |
| HIGHEST PRICE | 높은 가격순 |
| RECENT | 최근 등록순 |
| DETAILS | 상세 정보 |
| AVAILABLE | 거래 가능 |
| UNAVAILABLE | 거래 불가 |

### 중요한 예외

JavaScript 내부 변수명, State Machine 명칭, API/DB field name은 기존 구조를 유지해도 된다.

예:

```javascript
WORLD
REGION
COMPLEX
LISTING
```

내부 코드에서는 그대로 사용할 수 있다.

하지만 사용자에게 렌더링되는 텍스트는 한글을 사용한다.

---

# 14. Research Logging

Research Logging 인프라는 수정하지 않는다.

다만 IA-02의 사용자 노출 지점에 향후 다음 이벤트를 연결할 수 있는 Hook을 확보한다.

```text
Complex 선택
    ↓
R_EXPOSURE

Listing 목록 노출
    ↓
R_EXPOSURE

Listing 선택
    ↓
R_EXPOSURE

Filter / Sort 사용
    ↓
R_ACTION 또는 향후 정의된 이벤트
```

이번 단계에서는 기존 Research Logging의 저장 구조나 durability 로직을 변경하지 않는다.

실제 이벤트 저장 연결이 필요한 경우 기존 구현을 그대로 사용하며, 새로운 logging infrastructure를 만들지 않는다.

---

# 15. Protected Areas

다음 영역은 수정 금지다.

```text
PLAY Economic Engine
PLAY Property Market Engine
PLAY Security Rules
PLAY Cloud Functions
PLAY Transaction Engine
PLAY Season Clock
PLAY Batch / Aggregator
PLAY Reconciliation
PLAY Research Logging durability
app_main_lang.js
기존 RealRankers 핵심 로직
```

특히 UX 구현을 위해 backend transaction logic을 수정하지 않는다.

---

# 16. 구현 대상 파일

권장:

```text
play.html
js/play_app.js
js/play_*.js
css/play_*.css
```

기존 `app_main_lang.js`에 기능을 추가하지 않는다.

현재 IA-01에서 사용한 구조를 우선 유지한다.

---

# 17. Verification

AG는 다음 테스트를 수행한다.

### TEST-IA02-01
Complex 선택 → Listing 화면 진입

Expected:

```text
COMPLEX → LISTING
```

### TEST-IA02-02
실제 수지구 Property Master의 Complex 이름이 표시되는지 확인

Expected:

```text
임의 Mock Apartment = 0
검증된 수지구 Complex = 사용
```

### TEST-IA02-03
Listing Card에 가격/면적/층/방향 등 핵심 정보 표시

### TEST-IA02-04
Listing Filter 동작

### TEST-IA02-05
Listing Sort 동작

### TEST-IA02-06
Listing 선택 → Listing Detail

### TEST-IA02-07
현재 가격 / 최근 실거래 정보가 구분되어 표시

### TEST-IA02-08
INCOMPLETE Property가 거래 가능한 Listing으로 오인되지 않는지 확인

### TEST-IA02-09
Desktop:

```text
MAP ~60%
COMMAND PANEL ~40%
```

유지

### TEST-IA02-10
Mobile:

```text
MAP = TOP
COMMAND PANEL = BOTTOM
```

유지

### TEST-IA02-11
사용자 노출 영어 문자열 점검

Expected:

> 사용자에게 보이는 주요 UI 문구는 한글

### TEST-IA02-12
IA-01 Back Navigation 유지

```text
LISTING
→ COMPLEX
→ REGION
→ WORLD
```

---

# 18. Stop Condition

다음 상황에서는 임의로 해결하지 말고 STOP 한다.

- 실제 수지구 데이터 파일을 찾을 수 없음
- Property Master와 UI 데이터가 불일치
- 초기 가격 mapping에 불확실성이 발생
- INCOMPLETE 처리 규칙 충돌
- IA-01 구현을 변경해야만 해결 가능한 문제
- Research Logging 구현을 수정해야 하는 문제
- Backend Engine 수정이 필요해지는 문제
- 기존 영어 UI의 범위가 너무 넓어 구조 변경이 필요함
- 동일 테스트가 2회 실패

Change Control Protocol을 그대로 적용한다.

---

# 19. Completion Criteria

IA-02 PASS 조건:

- [ ] 실제 검증된 수지구 Property Master 기반 Complex 사용
- [ ] 임의 Mock Apartment 이름 제거
- [ ] Complex → Listing 전환
- [ ] Listing 목록 구현
- [ ] Listing Filter 구현
- [ ] Listing Sort 구현
- [ ] Listing Detail 구현
- [ ] 현재 가격 / 최근 실거래 비교 구현
- [ ] Desktop UX 유지
- [ ] Mobile UX 유지
- [ ] 사용자 노출 영어 UI 한글화
- [ ] IA-01 Back Navigation 유지
- [ ] INCOMPLETE Property 거래 불가 유지
- [ ] Research Logging 구조 보호
- [ ] Backend Engine 보호
- [ ] 테스트 Raw Evidence 확보

모든 항목이 확인되기 전에는 IA-03으로 넘어가지 않는다.

---

# 20. 다음 단계

IA-02 승인 후 다음 단계:

```text
IA-03
LISTING
   ↓
DECISION
   ↓
ACTION
```

즉, 사용자가 특정 매물을 발견한 뒤:

> “이 매물을 살 것인가, 보류할 것인가?”

라는 **의사결정 경험**으로 넘어간다.

이번 단계에서는 그 결정을 구현하지 않는다.
