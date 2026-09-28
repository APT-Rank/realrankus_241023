# PLAY IA-02 AG IMPLEMENTATION PROMPT

너는 PLAY Human Product / UX 구현 담당 AG다.

반드시 다음 문서를 먼저 읽는다.

1. `PLAY_IA_02_COMPLEX_TO_LISTING_SPEC_v1.0.md`
2. `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
3. `PLAY-IA-01_IMPLEMENTATION_REPORT.md`
4. 기존 Property Snapshot / Validation 문서
5. 기존 Research Logging 관련 문서
6. `PLAY_AG_WORK_CONTROL_PROTOCOL.md`

---

## 1. 이번 작업의 범위

이번 작업은 오직:

```text
IA-02
COMPLEX → LISTING
```

이다.

IA-01에서 구현된:

```text
WORLD → REGION → COMPLEX
```

을 유지하고,

```text
COMPLEX → LISTING → LISTING DETAIL
```

을 추가한다.

BUY / SELL 실행은 구현하지 않는다.

---

## 2. 가장 중요한 변경

현재 임의 Mock Apartment 데이터를 사용하고 있다면 제거한다.

기본 데이터는 반드시 기존에 검증한:

```text
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
```

기반의 Property Master를 사용한다.

검증된 기준:

```text
전체 Complex = 209
NORMAL = 200
INCOMPLETE = 9
```

임의의 서울/부산/전국 아파트 데이터를 추가하지 않는다.

기흥구 데이터도 이번 작업에서 추가하지 않는다.

---

## 3. Property Data Rule

다음 규칙을 변경하지 않는다.

```text
검색코드 → complex_id / property_id
아파트명 → complex_name
세대수 → household_count
법정동주소 → legal_address
도로명주소 → road_address
X/Y → 지도 좌표
area_info → 면적 후보
sales_info → 해당 면적의 가격
```

대표 면적:

```text
84㎡에 가장 가까운 면적
```

가격:

```text
대표 면적 index
        ↓
동일 index sales_info
        ↓
initial_price
```

절대 금지:

- last_sales fallback
- 다른 면적 가격 사용
- 평균가격 추정
- 주변 단지 가격 사용
- 임의 가격 생성
- 0원 처리 후 거래 가능으로 표시

INCOMPLETE는 거래 가능한 Listing으로 표시하지 않는다.

---

## 4. 구현할 UX

### Complex Context

Complex를 선택하면:

```text
WORLD > 지역 > 아파트 단지

단지명
주소
세대수
대표 면적
현재 매물 수

[매물 보기]
```

사용자가 `[매물 보기]`를 누르면:

```text
LISTING
```

으로 이동한다.

---

## 5. Listing 화면

각 매물은 Card 형태로 보여준다.

최소:

```text
가격
전용면적
층
방향
입주/준공 정보
등록 시점
매물 상태
```

가능하면:

```text
최근 실거래가
최근 거래일
현재 가격과 최근 실거래가 차이
```

를 표시한다.

매물을 클릭하면:

```text
LISTING DETAIL
```

로 이동한다.

---

## 6. Listing Detail

다음 정보를 보여준다.

```text
매물 정보
가격
전용면적
층
방향
입주/준공
등록일

시장 정보
현재 매물 가격
최근 실거래가
최근 거래일
가격 차이
```

이번 작업에서는 BUY / SELL을 실행하지 않는다.

---

## 7. Filter / Sort

Filter:

```text
가격
면적
층
방향
매물 상태
```

Sort:

```text
낮은 가격순
높은 가격순
최근 등록순
면적 작은 순
면적 큰 순
```

---

## 8. Desktop

IA-01의 공간 구조를 절대 깨지 않는다.

```text
LEFT  ≈ 60% : MAP
RIGHT ≈ 40% : COMMAND PANEL
```

지도는 탐험 공간이고,
우측 패널은 현재 대상에 대한 정보와 다음 선택을 위한 공간이다.

---

## 9. Mobile

다음 구조를 유지한다.

```text
TOP    : MAP
BOTTOM : COMMAND PANEL
```

터치 영역과 목록 스크롤을 확인한다.

---

## 10. 한글화

사용자에게 보이는 영어 UI를 한글로 변경한다.

예:

```text
WORLD → 세계
REGION → 지역
COMPLEX → 아파트 단지
LISTING → 매물
LISTING DETAIL → 매물 상세
COMMAND PANEL → 상황 패널
BACK TO REGION → 지역으로 돌아가기
BACK TO WORLD → 세계로 돌아가기
VIEW LISTINGS → 매물 보기
PRICE → 가격
AREA → 면적
FLOOR → 층
DIRECTION → 방향
RECENT TRANSACTION → 최근 실거래
CURRENT PRICE → 현재 가격
FILTER → 필터
SORT → 정렬
DETAILS → 상세 정보
AVAILABLE → 거래 가능
UNAVAILABLE → 거래 불가
```

내부 코드의 State 이름:

```javascript
WORLD
REGION
COMPLEX
LISTING
```

은 기존 구조를 유지해도 된다.

중요한 것은 **사용자 화면에 보이는 텍스트**다.

---

## 11. Research Logging

Research Logging infrastructure를 변경하지 않는다.

다음 지점에 향후 연구 이벤트 Hook을 연결할 수 있도록 구조를 유지한다.

```text
Complex 선택
Listing 노출
Listing 선택
Filter 사용
Sort 사용
```

기존 Research Logging의 durability/idempotency 구조를 재작성하지 않는다.

---

## 12. Protected Areas

다음 파일/기능은 수정하지 않는다.

```text
Economic Engine
Property Market Engine
Transaction Engine
Season Clock
Batch / Aggregator
Reconciliation
Security Rules
Cloud Functions
Research Logging durability
app_main_lang.js
기존 RealRankers 핵심 로직
```

UX 구현 때문에 backend를 변경하지 않는다.

---

## 13. 구현 파일

가능하면:

```text
play.html
js/play_app.js
js/play_*.js
css/play_*.css
```

범위에서 해결한다.

`app_main_lang.js`에는 기능을 추가하지 않는다.

---

## 14. Verification

다음 테스트를 반드시 수행한다.

```text
TEST-IA02-01
Complex → Listing

TEST-IA02-02
실제 수지구 Complex 데이터 사용 여부

TEST-IA02-03
Listing 핵심 정보 표시

TEST-IA02-04
Filter

TEST-IA02-05
Sort

TEST-IA02-06
Listing → Listing Detail

TEST-IA02-07
현재 가격 / 최근 실거래 비교

TEST-IA02-08
INCOMPLETE 거래 불가 처리

TEST-IA02-09
Desktop Map ~60% / Panel ~40%

TEST-IA02-10
Mobile Map TOP / Panel BOTTOM

TEST-IA02-11
사용자 노출 영어 문자열 한글화

TEST-IA02-12
Listing → Complex → Region → World Back Navigation
```

각 테스트는 PASS/FAIL만 쓰지 말고 실제 결과와 화면/콘솔 등 Raw Evidence를 남긴다.

---

## 15. 데이터 검증 Evidence

최소 3개 이상의 실제 수지구 Complex를 출력하여 확인한다.

```text
complex_id
complex_name
representative_area_sqm
representative_area_pyeong
initial_price
initial_price_date
```

또한 다음을 확인한다.

```text
209 total
200 NORMAL
9 INCOMPLETE
```

임의 Mock Apartment가 남아 있다면 PASS 처리하지 않는다.

---

## 16. Stop Rule

다음 상황이면 즉시 STOP한다.

- 실제 수지구 Property 데이터를 찾지 못함
- Property Master와 UI 데이터가 다름
- 가격 mapping이 불명확함
- INCOMPLETE 처리 규칙 충돌
- IA-01을 변경해야 함
- Research Logging infrastructure를 변경해야 함
- Backend Engine을 변경해야 함
- 동일 테스트 2회 실패

세 번째 시도는 하지 않는다.

Workaround로 PASS를 만들지 않는다.

---

## 17. 작업 종료 보고서

구현 후 다음 형식으로 보고한다.

```text
# PLAY-IA-02 IMPLEMENTATION REPORT

## 1. Implemented

## 2. Property Data Source

## 3. Property Data Verification

## 4. Complex → Listing Flow

## 5. Listing UI

## 6. Listing Detail

## 7. Filter / Sort

## 8. Korean Localization

## 9. Desktop Verification

## 10. Mobile Verification

## 11. Research Logging Hook

## 12. Protected Areas

## 13. Test Results

## 14. Raw Evidence

## 15. Issues

## 16. Final Verdict
```

Final Verdict는 실제 증거를 기준으로:

```text
READY
```

또는

```text
READY AFTER FIXES
```

또는

```text
STOP — HUMAN REVIEW REQUIRED
```

중 하나로 판단한다.

검증되지 않은 항목을 임의로 PASS 처리하지 않는다.

---

## 18. 마지막 원칙

이번 IA-02의 목표는 단순히 “매물 목록을 하나 추가하는 것”이 아니다.

사용자가:

```text
아파트 단지를 발견하고
      ↓
그 안의 실제 선택지를 발견하고
      ↓
여러 매물을 비교하고
      ↓
특정 매물에 관심을 갖고
      ↓
다음 의사결정을 준비하는 것
```

까지 자연스럽게 연결되는 경험을 만드는 것이다.

따라서 **화면 수보다 탐험의 질과 실제 데이터의 신뢰성**을 우선한다.

이번 단계가 끝나면 즉시 IA-03을 구현하지 말고,
먼저 구현 결과와 Raw Evidence를 보고하고 STOP한다.
