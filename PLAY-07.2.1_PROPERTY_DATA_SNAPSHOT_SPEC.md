# PLAY-07.2.1 PROPERTY DATA SNAPSHOT SPECIFICATION

## 1. 목적

본 문서는 PLAY-07.2 Property Market Engine에서 사용하는 **Season Property Master Snapshot**의 생성 규칙을 확정한다.

핵심 목적은:

> RealRankers의 지역구별 `...Valuated_202609.csv` 데이터를 Season 시작 시점에 Snapshot하고, PLAY 내부에서 거래 가능한 `Complex + Representative Area` 단위의 Property Master를 생성하는 것.

이 Snapshot 이후 PLAY의 Property 시장은 RealRankers의 실제 시장가격 데이터를 실시간으로 참조하지 않는다.

---

# 2. Source of Truth

## 2.1 Snapshot 대상 파일

Season 1의 Property Snapshot 원본은 각 지역구의:

```text
...Valuated_202609.csv
```

파일이다.

파일명에는 지역구가 직접 포함된다.

예:

```text
경기도 용인시 기흥구_202609_Data_sum_202609_Valuated_202609.csv
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
```

각 파일은 해당 지역구에 포함되는 전체 아파트 정보를 포함한다.

## 2.2 전국 단일 CSV 생성 여부

원본 지역구 파일을 반드시 하나의 전국 CSV로 병합할 필요는 없다.

구현 시 다음 중 하나를 사용할 수 있다.

```text
지역구별 Snapshot 파일
        ↓
Season Initialization
        ↓
PLAY Property Master
```

또는 내부 처리 편의를 위해 임시로 병합할 수 있다.

중요한 것은 **원본 파일을 하나로 만드는 것이 아니라 PLAY 내부에서 전국 Property를 고유하게 식별하고 조회할 수 있는 Property Master를 생성하는 것**이다.

원본 지역구 파일의 지역구 정보는 Property Master에 보존한다.

---

# 3. Snapshot Timing

Property Snapshot은 Season Initialization 시 1회 생성한다.

```text
Season DRAFT
   ↓
Property Snapshot
   ↓
Season READY
   ↓
Season ACTIVE
```

Season ACTIVE 이후에는 RealRankers 원본 CSV를 다시 읽어 Property의 가격이나 상태를 변경하지 않는다.

---

# 4. Property Identity

## 4.1 Complex ID

원본:

```text
검색코드
```

를 Complex ID로 사용한다.

단, 숫자로만 구성된 값이 대부분이므로 **반드시 String으로 저장한다.**

예:

```text
검색코드 = 123456
```

→

```text
complex_id = "123456"
```

숫자형으로 변환하여 앞자리 0이 사라지는 문제가 발생하지 않도록 한다.

## 4.2 Property ID

PLAY 거래 단위는:

```text
Complex + Representative Area
```

이다.

따라서 Complex ID와 Area를 결합한 별도의 `property_id`가 필요하다.

권장 구조:

```text
property_id
=
complex_id + ":" + representative_area_sqm
```

예:

```text
complex_id = "123456"
representative_area_sqm = 84.96

property_id = "123456:84.96"
```

단, 최종 Property ID 생성 규칙은 구현 시 기존 Schema Naming Convention과 충돌 여부를 확인한다.

Complex ID 자체는 반드시 String으로 보존한다.

---

# 5. 기본 Complex Fields

Property Master는 최소 다음 Complex 정보를 보존한다.

```text
complex_id
complex_name
household_count
legal_dong_address
road_name_address
x
y
district
source_file
snapshot_version
```

## Mapping

```text
검색코드 → complex_id
아파트명 → complex_name
세대수 → household_count
법정동주소 → legal_dong_address
도로명주소 → road_name_address
X → x
Y → y
```

지역구는 파일명에서 추출할 수 있다.

예:

```text
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
```

→

```text
district = 경기도 용인시 수지구
```

원본 파일명도 `source_file`에 보존한다.

---

# 6. Coordinate Rule

`X / Y`는 지도에서 사용할 수 있는 좌표로 간주한다.

Property Snapshot 생성 시:

```text
X != null
AND
Y != null
```

인 Property만 포함한다.

X 또는 Y가 없는 Complex는 **Property Master에서 제외한다.**

이것은 단순한 표시 문제뿐 아니라 향후 지역/지도 기반 분석의 데이터 무결성을 위한 필수 조건이다.

---

# 7. Special Complex Rule

다음과 같은 상태의 Complex도 Property Master에 포함한다.

- 재건축
- 리모델링
- 기타 특수 단지

이번 Snapshot 단계에서는 사업 상태를 근거로 임의 제외하지 않는다.

원본에 존재하고 X/Y가 존재하면 포함한다.

---

# 8. Area Data

원본:

```text
area_info
```

는 한 Complex에 존재하는 주택 면적 정보를 콤마로 구분하여 저장한다.

예:

```text
33평(111.95),34평(113.14),34평(114.43)
```

의 의미:

```text
Area[0] = 33평 / 111.95㎡
Area[1] = 34평 / 113.14㎡
Area[2] = 34평 / 114.43㎡
```

여기서 실제 Property Area 식별에는 **전용면적(㎡)**을 사용한다.

평형 표기는 표시용 정보로 보존한다.

---

# 9. Sales Data

원본:

```text
sales_info
```

는 `area_info`와 동일한 순서로 구성된다.

예:

```text
area_info:
33평(111.95),34평(113.14),34평(114.43)

sales_info:
15.5억 (2026-07-19),15.7억 (2026-07-17),15.5억 (2026-07-16)
```

정확한 Mapping:

```text
area_info[0]
↕
sales_info[0]

area_info[1]
↕
sales_info[1]

area_info[2]
↕
sales_info[2]
```

따라서:

```text
Area[0] = 111.95㎡
Initial Sale = 15.5억
Date = 2026-07-19

Area[1] = 113.14㎡
Initial Sale = 15.7억
Date = 2026-07-17

Area[2] = 114.43㎡
Initial Sale = 15.5억
Date = 2026-07-16
```

로 해석한다.

**Index Alignment는 반드시 보존해야 한다.**

area_info와 sales_info를 각각 정렬하거나 독립적으로 정렬하여 Index 관계를 깨뜨리면 안 된다.

---

# 10. Representative Area Rule

PLAY의 Property Unit은:

> Complex + Representative Area

이다.

Representative Area 선정 규칙:

### 1순위

전용면적 **84㎡에 가장 가까운 면적**

즉, 84㎡가 정확히 존재하면 선택한다.

### 2순위

84㎡가 정확히 존재하지 않는 경우에도:

```text
abs(area_sqm - 84.0)
```

가 가장 작은 면적을 선택한다.

예:

```text
59.97
84.96
101.23
```

→

```text
Representative Area = 84.96㎡
```

---

# 11. Representative Area Index

Representative Area를 선택한 뒤 반드시 원본 `area_info`의 Index를 보존한다.

예:

```text
area_info[0] = 59.97
area_info[1] = 84.96
area_info[2] = 101.23
```

이면:

```text
representative_area_index = 1
representative_area_sqm = 84.96
```

이다.

이 Index는 `sales_info`와 Initial Price를 연결하는 핵심 Key다.

---

# 12. Initial Price Rule

`last_sales`는 PLAY-07.2 Property Initial Price 산정에 사용하지 않는다.

Initial Price는:

```text
Representative Area
        ↓
area_info index
        ↓
same index in sales_info
        ↓
latest sale price
```

로 결정한다.

즉:

```text
representative_area_index = i
```

이면:

```text
initial_price = sales_info[i].price
initial_price_date = sales_info[i].date
```

이다.

---

# 13. Example

원본:

```text
area_info:
33평(111.95),34평(113.14),34평(114.43)

sales_info:
15.5억 (2026-07-19),15.7억 (2026-07-17),15.5억 (2026-07-16)
```

Representative Area:

```text
84㎡와 가장 가까운 면적
```

을 적용하면 111.95 / 113.14 / 114.43 중:

```text
111.95㎡
```

가 84㎡에 가장 가깝다.

따라서:

```text
representative_area_index = 0
representative_area_pyeong = 33
representative_area_sqm = 111.95
initial_price = 15.5억
initial_price_date = 2026-07-19
```

이 된다.

**중요:** 단순히 가장 최근 날짜인 `sales_info` 값을 선택하는 것이 아니다.

먼저 Representative Area를 선택하고, 그 Index에 대응하는 sales_info를 선택한다.

---

# 14. Price Parsing

`sales_info`의 가격은 문자열에 `억` 단위가 포함될 수 있다.

예:

```text
15.5억
```

PLAY 내부 금액은 KRW 정수로 저장한다.

예:

```text
15.5억
=
1,550,000,000 KRW
```

표시용 원문 문자열과 내부 계산용 정수값을 필요에 따라 분리한다.

권장:

```text
initial_price
initial_price_raw
```

---

# 15. Date Parsing

`sales_info`의 거래일:

```text
2026-07-19
```

은 ISO Date 형태로 저장한다.

권장:

```text
initial_price_date
```

원본 문자열도 필요하면:

```text
initial_price_date_raw
```

로 보존할 수 있다.

---

# 16. Area Parsing

`area_info` 각 항목은:

```text
평형(전용면적)
```

형태로 해석한다.

예:

```text
34평(113.14)
```

→

```text
area_pyeong = 34
area_sqm = 113.14
```

Property 선택 기준은:

```text
area_sqm
```

이다.

---

# 17. Property Master Record

최소 Property Master Record:

```text
property_id

complex_id
complex_name
household_count

representative_area_index
representative_area_pyeong
representative_area_sqm

initial_price
initial_price_date

legal_dong_address
road_name_address

x
y

district

source_file
snapshot_version
created_at
```

---

# 18. Full Area Information

대표 면적만 Property Master에 저장하더라도 원본 Complex의 전체 Area 정보를 잃지 않도록 하는 것이 권장된다.

가능한 구조:

```text
areas: [
  {
    index: 0,
    pyeong: 33,
    sqm: 111.95,
    latest_sale_price: 1550000000,
    latest_sale_date: "2026-07-19"
  },
  ...
]
```

이를 통해 향후:

- 다른 평형 선택
- Property 확장
- 면적별 분석
- Representative Area 정책 변경

이 가능해진다.

단, 이번 PLAY-07.2의 거래 단위는 Representative Area 하나로 한다.

---

# 19. Data Validation

Snapshot 생성 시 최소 검증:

### V-DATA-01

`검색코드` 존재

### V-DATA-02

`검색코드` String 변환 성공

### V-DATA-03

`아파트명` 존재

### V-DATA-04

`세대수` 존재

### V-DATA-05

`X` 존재

### V-DATA-06

`Y` 존재

### V-DATA-07

`area_info` 파싱 가능

### V-DATA-08

`area_info`에 Representative Area 존재

### V-DATA-09

Representative Area Index에 대응하는 `sales_info` 존재

### V-DATA-10

Initial Price 파싱 가능

### V-DATA-11

Initial Price Date 파싱 가능

검증 실패 시:

```text
Property 제외
```

또는 구현을 중단해야 하는 수준의 데이터 구조 오류인지 구분하여 로그에 기록한다.

---

# 20. Area / Sales Length Validation

특히 중요한 검증:

```text
count(area_info)
=
count(sales_info)
```

를 기본적으로 확인한다.

예:

```text
area_info = 3개
sales_info = 3개
```

→ 정상

반면:

```text
area_info = 3개
sales_info = 2개
```

→ 해당 Complex의 Property Snapshot 처리를 보류하고 오류로 기록한다.

임의로 Index를 보정하거나 다른 가격을 대입하지 않는다.

---

# 21. Encoding

현재 AG Pre-Review에서 한글 컬럼명이 깨져 식별할 수 없는 문제가 보고되었다.

따라서 구현 시 특정 Encoding을 임의로 가정하지 않는다.

우선 실제 파일의 Encoding을 탐색하고:

1. UTF-8
2. UTF-8 BOM
3. CP949 / EUC-KR
4. 기타 실제 파일 Encoding

순으로 확인한다.

그러나 Encoding을 바꾸어도 한글 Header가 복원되지 않는다면:

```text
DATA SOURCE PARSING ERROR
```

로 보고하고 임의 컬럼 매핑을 하지 않는다.

---

# 22. Region File Processing

각 지역구 파일은 파일명에서 지역구를 식별한다.

예:

```text
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
```

에서:

```text
district = 경기도 용인시 수지구
```

를 추출한다.

원본 파일명을 반드시 보존한다.

---

# 23. National Property Master

전국 데이터를 하나의 원본 CSV로 만들 필요는 없다.

다만 Season Initialization 완료 후 PLAY 내부에는 전국 Property를 조회할 수 있는 구조가 필요하다.

즉:

```text
지역구 CSV 1
지역구 CSV 2
지역구 CSV 3
...
        ↓
Season Property Initialization
        ↓
PLAY Property Master
```

이다.

---

# 24. Duplicate Detection

전국 지역구 파일을 처리할 때:

```text
complex_id
```

중복 여부를 검사한다.

동일 `complex_id`가 여러 지역구 파일에서 발견되면:

1. 중복을 오류로 기록
2. 임의로 하나를 선택하지 않음
3. 원본 파일 목록과 함께 보고

한다.

단, 실제 데이터 구조상 동일 Complex가 여러 파일에 존재하는 것이 정상이라면 그 원인을 먼저 확인한다.

---

# 25. Snapshot Version

Season Property Snapshot은 다음 식별정보를 가져야 한다.

```text
season_id
snapshot_version
snapshot_date
source_dataset_version
source_file
```

Season 1 기준:

```text
source_dataset_version = 202609
```

을 사용할 수 있다.

---

# 26. Property Market Independence

Snapshot 이후:

```text
RealRankers Actual Market
        X
PLAY Property Market
```

이다.

PLAY의 거래가격은 PLAY Player 간 거래로 결정된다.

RealRankers의 실제 시장가격을 Season 진행 중 자동 반영하지 않는다.

---

# 27. Primary Market Input

PLAY-07.2 Primary Market이 사용할 Property Snapshot 정보:

```text
property_id
complex_id
complex_name
household_count
representative_area_sqm
initial_price
initial_price_date
location
coordinates
```

Primary Supply 계산에는:

```text
household_count
```

가 사용된다.

현재:

```text
PRIMARY_SUPPLY_RATIO
```

의 숫자값은 미정이다.

**Property Master 분석 후 결정한다.**

따라서 코드에 임의의 숫자를 하드코딩하지 않는다.

---

# 28. Primary Market Duration

Primary Market은:

> Season 시작 후 12개월

동안 활성화한다.

즉:

```text
simulation_period = 0
~
simulation_period = 11
```

동안 Primary Market이 열린다.

12개월 이후에는 Primary Market을 종료한다.

단, 공급량이 먼저 소진된 Property는 그 이전에 종료한다.

---

# 29. Participant Count

Season 참가자 수는 현재 제한하지 않는다.

따라서 Property Supply는 참가자 수를 기준으로 임의로 제한하지 않는다.

`PRIMARY_SUPPLY_RATIO`는 향후 Property Master 규모 분석 후 결정한다.

---

# 30. Do Not Invent

다음은 현재 문서에서 확정되지 않았으므로 임의 결정하지 않는다.

- PRIMARY_SUPPLY_RATIO 숫자
- Loan
- LTV
- DSR
- Tax
- Rent
- Jeonse
- Property Price Appreciation
- Liquidity Discount 계산식
- AI 가격 예측
- Real Market 실시간 가격 반영

---

# 31. Implementation Requirements for AG

AG는 구현 전에 실제 첨부된 지역구 CSV를 사용하여 다음을 확인해야 한다.

1. Header Encoding
2. 실제 Column Names
3. `검색코드`
4. `아파트명`
5. `세대수`
6. `법정동주소`
7. `도로명주소`
8. `X`
9. `Y`
10. `area_info`
11. `sales_info`
12. 실제 Area/Sales Index Alignment
13. 가격 Parsing
14. 날짜 Parsing
15. Representative Area 선정
16. Representative Area → sales_info Mapping
17. Duplicate Complex ID
18. Missing X/Y
19. Missing Representative Sale
20. 실제 Property Master 생성 가능 여부

실제 데이터 확인 없이 PASS하지 않는다.

---

# 32. Required Sample Output

AG는 최소 1개 지역구 파일을 실제로 읽은 후 다음과 같은 검증 결과를 제시해야 한다.

```text
Source File:
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv

Complex Count:
N

Valid Property Count:
N

Excluded Count:
N

Representative Area Rule:
Nearest to 84㎡

Initial Price Rule:
Representative Area index → same sales_info index

X/Y Missing:
N

Area/Sales Mismatch:
N

Duplicate Complex ID:
N
```

그리고 실제 Property 3개 이상에 대해:

```text
complex_id
complex_name
representative_area_sqm
representative_area_pyeong
initial_price
initial_price_date
```

를 출력하여 사람이 검증할 수 있도록 한다.

---

# 33. Completion Criteria

이 문서의 목적은 코드 구현 자체가 아니라 **Property Snapshot의 데이터 정의를 확정하는 것**이다.

다음이 확인되면 PLAY-07.2 Property Engine 구현으로 진행한다.

- Source file identified
- Encoding identified
- Required columns identified
- Complex ID verified
- Area parsing verified
- Sales parsing verified
- Area/Sales index alignment verified
- Representative Area rule verified
- Initial Price mapping verified
- X/Y validation verified
- Property ID rule verified
- Snapshot schema verified

검증되지 않은 항목은 임의로 PASS 처리하지 않는다.

---

# 34. 핵심 데이터 흐름

최종적으로 다음 구조를 따른다.

```text
지역구별
...Valuated_202609.csv
        │
        ▼
Complex Record
        │
        ├── 검색코드 → complex_id(String)
        ├── 아파트명
        ├── 세대수
        ├── 법정동주소
        ├── 도로명주소
        ├── X / Y
        │
        ├── area_info
        │      │
        │      ├── Area[0]
        │      ├── Area[1]
        │      └── Area[2]
        │
        └── sales_info
               │
               ├── Sale[0] ↔ Area[0]
               ├── Sale[1] ↔ Area[1]
               └── Sale[2] ↔ Area[2]

                       ↓

             Representative Area
             = 84㎡ nearest

                       ↓

             Representative Index

                       ↓

             Same Index Sales

                       ↓

             Initial Price
             Initial Price Date

                       ↓

              PLAY Property Master

                       ↓

                Primary Market
                       ↓
                Secondary Market
```

---

# 35. 최종 원칙

Property Snapshot은:

> **실제 부동산 시장을 복제하기 위한 데이터가 아니라, 모든 Player가 동일한 출발 조건에서 서로 다른 부동산 의사결정을 할 수 있도록 동일한 시장환경을 제공하기 위한 Season 초기조건이다.**

따라서 데이터 변환 과정에서 임의의 가격 보정, 가격 추정, 누락값 추정, 지역별 임의 선별을 하지 않는다.

**원본 데이터 → 명시된 파싱 규칙 → 동일한 Snapshot**

이라는 재현 가능한 구조를 유지한다.
