# PLAY-07.2 IMPLEMENTATION CONFLICT REPORT

## 1. Conflict Summary
PLAY-07.2 Phase 1 (Property Master 생성) 단계에서 스크립트를 구현하고 중간 검증(P01~P08)을 수행하던 중, **PLAY-07.2 Implementation Spec 문서의 지시사항과 실제 데이터의 상태가 논리적으로 충돌**하는 현상을 발견했습니다. 원칙에 따라 임의 구현을 즉시 중단하고 이 충돌 상황을 보고합니다.

## 2. Conflicting Rules (충돌하는 두 가지 지시사항)

1. **Rule A (명시적인 결과물 강제)**
   > "수지구 검증 데이터에서는 반드시: 209 Complex, 209 Property Master가 되어야 한다. 그리고 **206 NORMAL, 3 INCOMPLETE 이어야 한다.** INCOMPLETE: gMQ0a, gHwaa, fa8da 이 반드시 존재해야 한다."
2. **Rule B (NORMAL Property의 자격 요건)**
   > "For NORMAL properties, representative fields and **initial price are required.**"
   > "Initial Price는 sales_info[representative_area_index] 에서만 가져온다. last_sales는 사용하지 않는다."
   > "0원, 추정 가격, last_sales fallback을 절대 사용하지 마라."

## 3. Root Cause (원인)
이전 데이터 검증 단계(`validate_data.py`)에서는 209개 중 206개 단지가 유효한 Representative Area(면적 정보)를 보유하고 있다는 의미로 "Total generated: 206"이라는 결과를 산출했습니다.
그러나 실제 스펙에 따라 코드를 작성하여 "면적"뿐만 아니라 **"초기 가격(initial_price)"의 존재 여부까지 검사**해 본 결과, 위 206개의 단지 중 **6개의 단지는 대표 면적에 해당하는 `sales_info` 값이 "거래 정보 없음"**으로 기재되어 있었습니다. 

## 4. Affected Complexes (문제가 된 6개 단지)
다음 6개 단지는 X/Y 및 면적 정보가 있어 정상적으로 `representative_area`를 산출했으나, 해당 면적의 가격 정보가 없어 `initial_price`를 파싱할 수 없는 단지들입니다.
1. `14367`
2. `15015`
3. `152738`
4. `25898`
5. `113435`
6. `13424`

*(실제 파싱 결과 예시: 152738 단지의 경우, 여러 면적 중 84㎡와 가장 가까운 면적이 24평이었으나, 배열 상 해당 인덱스의 sales_info는 "거래 정보 없음"이었음)*

## 5. The Dilemma (임의 처리가 불가능한 이유)
현재의 스펙으로는 이 6개 단지의 상태를 확정지을 수 없습니다.

- **옵션 1: 6개 단지를 `NORMAL`로 편입**
  - **위반 사항**: `initial_price = null`이 되므로, "NORMAL은 initial price가 필수(required)"라는 Rule B를 위반하게 됩니다. Primary Market 트랜잭션 도중 가격이 null이 되어 치명적인 오류를 유발합니다.
- **옵션 2: 6개 단지를 `INCOMPLETE`로 강등**
  - **위반 사항**: 3(원래 미정) + 6(가격 없음) = 총 9개의 INCOMPLETE가 발생하여, "반드시 206 NORMAL, 3 INCOMPLETE 이어야 한다"는 Rule A를 정면으로 위반하게 됩니다.

## 6. Request for Decision
이 충돌은 코드 버그가 아니라 **스펙과 실제 데이터 간의 불일치(Data Issue)**입니다. 따라서 구현을 재개하기 위해 다음 중 하나로 스펙을 수정(또는 유권 해석)해 주시기를 요청합니다.

1. **[추천] INCOMPLETE 기준 확대 (Rule A 수정)**: "초기 가격이 없는 단지 6개"를 추가로 INCOMPLETE로 편입하여, 최종 결과를 **200 NORMAL / 9 INCOMPLETE**로 스펙을 조정합니다.
2. **Fallback Price 허용 (Rule B 예외 추가)**: 대표 면적의 가격이 "거래 정보 없음"일 경우에 한해, `last_sales`를 예외적으로 허용하거나 다른 면적의 가격으로 환산하는 로직을 허용합니다. (단, 이는 기존 스펙의 엄격함을 훼손할 수 있습니다.)

**지시가 내려지는 즉시 INGEST 코드에 반영하여 PLAY-07.2 구현을 재개하겠습니다.**
