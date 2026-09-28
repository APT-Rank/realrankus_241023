# PLAY-07.2.1 PROPERTY EXCLUSION ROOT CAUSE REPORT

## 1. Investigation Summary
이전 DATA VALIDATION 과정에서 209개의 Valid Complex 중 206개만 Property ID가 생성된 원인을 조사했습니다. 조사 결과, `area_info`가 "미정(미정)"으로 되어 있고 `sales_info`가 "거래 정보 없음"으로 표기된 3개의 단지가 파싱에 실패하여 Representative Area를 구할 수 없었고, 이로 인해 Property ID 생성 단계에서 누락(Exclude)되었음을 확인했습니다.

## 2. Reconciliation
- CSV Complex Count: 209
- Generated Property Count: 206
- Excluded Count: 3
- Unexpected Generated Count: 0

Excluded IDs:
1. gMQ0a
2. gHwaa
3. fa8da

## 3. Excluded Complex #1
Complex ID: gMQ0a
Complex Name: 용인상현서희스타힐스
Source File: 경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
X: 127.0718383
Y: 37.30125972
Household Count: 210
area_info: 미정(미정)
sales_info: 거래 정보 없음

Excluded At:
- Representative Area Calculation & Property ID Generation

Exclusion Condition:
- `area_info`에서 면적(숫자)을 파싱할 수 없어 `parsed_area` 배열이 비어 있게 되었고, 이로 인해 Representative Area(84㎡와의 차이 계산)를 찾지 못함. 이후 Property ID(`complex_id`:`representative_sqm`)를 생성할 때 참조할 면적이 없어 제외됨.

Actual Error:
- `area_info` 파싱 결과 빈 배열 반환 -> Representative Area 산출 불가(null) -> Property ID 생성 불가.

PLAY-07.2.1 기준상 제외가 정당한가?
- NO

Reason:
- 기준 문서에 따르면 "X 또는 Y가 없는 경우만 명시적인 Complex 제외 조건"이며, "imperfect/special data라고 해서 임의 제외하지 않는다"고 명시되어 있습니다. 해당 단지들은 X, Y 좌표가 존재하므로 필수 조건을 충족하지만, 면적/가격 정보 부재로 인해 검증 코드가 임의 누락시켰습니다.

## 4. Excluded Complex #2
Complex ID: gHwaa
Complex Name: 수지자이에디시온
Source File: 경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
X: 127.1022262
Y: 37.3298322
Household Count: 542
area_info: 미정(미정)
sales_info: 거래 정보 없음

Excluded At:
- Representative Area Calculation & Property ID Generation

Exclusion Condition:
- `area_info`에서 면적(숫자)을 파싱할 수 없어 Representative Area를 찾지 못함.

Actual Error:
- `area_info` 파싱 결과 빈 배열 반환 -> Representative Area 산출 불가(null) -> Property ID 생성 불가.

PLAY-07.2.1 기준상 제외가 정당한가?
- NO

Reason:
- X, Y 좌표가 존재하므로 명시적인 제외 조건에 해당하지 않으나, 현재의 검증 코드가 수치로 된 면적이 없을 경우 Property ID(면적 결합)를 만들지 못해 탈락시켰습니다.

## 5. Excluded Complex #3
Complex ID: fa8da
Complex Name: 용인신봉2구역
Source File: 경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
X: 127.0614321
Y: 37.3333738
Household Count: 648
area_info: 미정(미정)
sales_info: 거래 정보 없음

Excluded At:
- Representative Area Calculation & Property ID Generation

Exclusion Condition:
- `area_info`에서 면적(숫자)을 파싱할 수 없어 Representative Area를 찾지 못함.

Actual Error:
- `area_info` 파싱 결과 빈 배열 반환 -> Representative Area 산출 불가(null) -> Property ID 생성 불가.

PLAY-07.2.1 기준상 제외가 정당한가?
- NO

Reason:
- X, Y 좌표가 모두 유효하게 존재함에도 면적 정보가 "미정"이라는 이유로 검증 코드 단에서 탈락되었습니다. 스펙상 임의 제외가 금지되어 있으므로 이는 제외되어서는 안 됩니다.

## 6. Root Cause Classification

### Data Issue
- 데이터 상에 `area_info`가 "미정(미정)", `sales_info`가 "거래 정보 없음"으로 기재된 분양 예정 또는 미정산 단지가 존재합니다. (총 3건)

### Validation Logic Issue
- 현재 검증 코드는 정규식을 통해 `숫자평(숫자)` 형식만 추출하도록 작성되어 있으며, 매칭되지 않으면 빈 배열을 반환합니다.
- 빈 배열일 경우 Representative Area 산출 로직이 `null`을 반환합니다.

### Property ID Generation Issue
- Property ID는 `complex_id:representative_area_sqm` 조합으로 만들어지는데, `representative_area_sqm`이 `null`일 때 식별자를 생성하지 않고 무시하도록 짜여져 있었습니다. (코드상의 암묵적 제외)

### No Valid Exclusion Reason
- PLAY-07.2.1 기준에서 허용하는 명시적 제외 조건("X 또는 Y가 없는 경우")에 해당하지 않음에도 코드가 임의로 제외시켰습니다.

## 7. PLAY-07.2.1 Compliance Assessment
- **위반 사항**: "imperfect/special data라고 해서 임의 제외하지 않는다", "단, Representative Area에 대응하는 sales_info가 없거나 파싱할 수 없는 경우는 실제 데이터 규모를 확인한 뒤 처리 방안을 보고하라. 임의로 제외하지 마라."는 원칙을 위반했습니다. 검증 코드가 자체적으로 파싱 실패 시 Property ID를 생성하지 않고 누락시켜 버렸습니다.

## 8. Recommended Next Action
1. **Property ID Fallback 구조 마련**: `area_info`가 "미정(미정)"인 경우 Representative Area를 0 또는 문자열("미정")로 처리하여 `Property ID (예: gMQ0a:0 또는 gMQ0a:미정)`를 생성해야 합니다.
2. **Initial Price Fallback 결정**: `sales_info`가 "거래 정보 없음"일 때 Initial Price를 어떻게 취급할지(예: 0원 처리, 특정 기본값 부여, 거래 불가 상태로 마킹 등)에 대한 정책 결정이 필요합니다.
3. **Validation Code 수정**: 면적 및 가격 파싱 실패 시 해당 Row를 무시(Drop)하지 않고 특수한 상태로 남겨두어 Property Master에 편입되도록 로직을 수정해야 합니다.

## 9. Final Verdict
**IMPLEMENTATION ISSUE — 3 EXCLUSIONS SHOULD NOT OCCUR**
(데이터는 정상적으로 X/Y를 포함하고 있으나, 현재 validation/property generation 로직이 "면적/가격 미정" 케이스를 처리하지 못해 3개가 부당하게 제외되었습니다.)
