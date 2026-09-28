# PLAY-07.2.1 INCOMPLETE PROPERTY DESIGN REVIEW

## 1. Problem Definition
앞선 PLAY-07.2.1 검증 과정에서 `area_info`가 "미정(미정)", `sales_info`가 "거래 정보 없음"으로 되어 있어 파싱이 불가능한 3개의 단지가 발견되었습니다. 경제 시뮬레이션에서는 "모르는 값을 모르는 값으로 둔다"는 원칙이 매우 중요합니다. 본 문서는 해당 단지들을 임의 배제하거나 변조(0㎡, 0원 등)하지 않고 Property Master에 안전하게 보존(INCOMPLETE 상태)하면서 Primary Market 등에서 오동작을 일으키지 않도록 처리하는 구조를 설계 및 검토합니다.

## 2. Affected Complexes
해당 구조가 적용되는 특수 Complex는 아래 3건입니다.
- `gMQ0a` (용인상현서희스타힐스)
- `gHwaa` (수지자이에디시온)
- `fa8da` (용인신봉2구역)

모두 X/Y 좌표와 세대수는 존재하지만, 실거래/면적 정보가 확정되지 않은 상태입니다.

## 3. Proposed Data Model
다음을 만족하도록 `PLAY_PROPERTY_MASTER` (또는 해당 문서) 스키마를 구성합니다.

- **property_status**: `NORMAL` 또는 `INCOMPLETE`
- **representative_area_sqm**: (numeric) 또는 `null`
- **representative_area_pyeong**: (numeric) 또는 `null`
- **representative_area_index**: (integer) 또는 `null`
- **initial_price**: (numeric) 또는 `null`
- **initial_price_date**: (string/date) 또는 `null`
- **tradable**: `true` 또는 `false`
- **area_info_raw**: (원본 문자열 유지, 예: "미정(미정)")
- **sales_info_raw**: (원본 문자열 유지, 예: "거래 정보 없음")

**10가지 핵심 질문에 대한 답변:**
1. **3개 Complex를 Property Master에서 보존해야 하는가?** 
   - **YES**. X, Y 위치와 기본 정보가 존재하는 실제 자산이므로 원본 데이터를 유지하고 Master에 보존해야 합니다.
2. **`0㎡`를 사용하는 것이 적절한가?** 
   - **NO**. 0은 실제 수학적 크기가 0임을 의미하므로, 미래 가격 모델이나 세금(평당 계산 등)에서 치명적인 런타임 에러나 왜곡을 유발합니다.
3. **`0원`을 사용하는 것이 적절한가?** 
   - **NO**. 0원은 공짜를 의미하며, 만약 시스템 오류로 거래가 허용되면 0원에 소유권이 넘어가는 경제 붕괴를 초래합니다.
4. **`null`을 사용하는 것이 적절한가?** 
   - **YES**. `null`은 데이터가 '없음(Unknown)'을 정확히 표현하므로 경제 산식에서 걸러낼 수 있는 가장 안전한 타입입니다.
5. **`property_status = INCOMPLETE`가 필요한가?** 
   - **YES**. 데이터의 무결성 수준을 나타내는 명시적 플래그로, 데이터 보완 파이프라인과 게임 엔진이 이 자산을 어떻게 다룰지 명확하게 구분해 줍니다.
6. **`tradable = false`를 두는 것이 필요한가?** 
   - **YES**. `property_status`가 데이터의 상태라면 `tradable`은 경제 엔진에서의 '거래 가능 여부'를 직관적으로 나타내는 스위치입니다. 거래 로직에서 이중 안전장치 역할을 합니다.
7. **Property ID는 어떤 구조가 가장 안전한가?** (아래 4항에서 상세히 분석)
8. **향후 NORMAL로 승격할 수 있는 구조인가?** 
   - **YES**. 데이터가 채워지면 `property_status = NORMAL`, `tradable = true`로 업데이트하기만 하면 됩니다.
9. **Firestore schema에서 이 구조가 기존 PLAY-06/07.1과 충돌하지 않는가?** 
   - **NO**. 기존 06/07.1은 Batch 단위의 Idempotency와 Cash Lock 중심으로 설계되었습니다. Property Schema가 추가되더라도 기존 Cash 모델과 충돌하지 않습니다.
10. **Primary Market / Ownership / Transaction에서 INCOMPLETE Property가 실수로 거래되는 것을 막을 수 있는가?** 
    - **YES**. Market API(Buy/Sell) Cloud Functions의 첫 번째 Validation 단계에서 `tradable == true` 및 `property_status == NORMAL` 여부를 확인하도록 강제하면 완벽히 차단됩니다.

## 4. Property ID Analysis
현재는 `complex_id:representative_area_sqm` 조합을 제안했으나, `INCOMPLETE` 자산은 `representative_area_sqm`이 `null`입니다.

- **Option A (`property_id = complex_id`)**: 현재 1단지 1대표면적 원칙하에서는 성립합니다. 하지만 향후 한 단지 내에서 대표 면적 2개 이상을 취급하게 될 경우 확장성에 제약이 있습니다.
- **Option B (`complex_id:INCOMPLETE`)**: 임시 방편으로 작동은 하지만, 향후 데이터가 보완되어 면적(예: 84.96)이 생길 경우 ID가 `complex_id:84.96`으로 변경되어야 합니다. ID가 변경되면 기존 로그(Decision Log 등)나 소유권(Ownership) 기록과 단절되는 치명적인 문제가 발생합니다.
- **Option C (Immutable ID + References)**: **가장 안전한 방식**입니다. Property ID 자체는 불변의 식별자(UUID 또는 Firestore Auto-ID)를 사용하거나, MVP에서는 단순하게 `property_id = complex_id`로 고정하고, `representative_area_sqm`을 식별자가 아닌 "속성 필드"로만 두는 것이 좋습니다. 즉, 면적 정보가 업데이트되어도 ID가 바뀌지 않아 자산 이력이 영구히 보존됩니다.

## 5. Property Master Treatment
- 이 3개의 Complex는 Property Master 컬렉션 내에 정상적으로 Document가 생성됩니다.
- `property_status: "INCOMPLETE"`
- `tradable: false`
- 원본 `area_info`, `sales_info` 문자열을 `_raw` 필드로 보존.

## 6. Primary Market Treatment
- Season 초기화 시, `PLAY_PRIMARY_SUPPLY`를 구성하는 Cloud Task 또는 스크립트는 Property Master를 순회할 때 `tradable == true`인 것만 필터링합니다.
- 따라서 INCOMPLETE 자산은 Primary Supply Document 자체가 생성되지 않으며, 공급량이 0이 됩니다.
- 유저는 이 부동산을 조회할 수는 있으나(추후 기능에 따라), 구매 버튼은 비활성화되거나 API 요청 시 차단됩니다.

## 7. Future Promotion Path
- RealRankers 원본 데이터베이스에서 면적/가격이 확정되어 재수집될 경우, Firestore Update를 통해 해당 필드(`representative_area_sqm`, `initial_price` 등)에 값을 채워넣습니다.
- 그와 동시에 `property_status = "NORMAL"`, `tradable = true`로 변경됩니다.
- 승격 이후 해당 자산에 대한 Primary Supply를 추가 오픈할지 여부는 경제 엔진의 정책적 판단(예: Season 도중 신규 분양 오픈)으로 매끄럽게 흡수 가능합니다.

## 8. Compatibility with PLAY-06 / PLAY-07.1
- 기존 `processBatchChunk` 등 Batch 인프라는 멱등성(Idempotency)과 플레이어 자산(Cash, Property Count) 변경의 원자성(Atomicity)을 보장합니다.
- INCOMPLETE Property는 애초에 거래(Transaction) 객체가 생성되지 않으므로, 기존 경제 결산 엔진에 어떠한 사이드 이펙트도 주지 않습니다.
- 완벽히 호환됩니다.

## 9. Risks
- 프론트엔드/클라이언트 측에서 `null` 값에 대한 렌더링 대비가 되어 있지 않을 경우 크래시 위험이 있습니다. (예: `price.toLocaleString()` 호출 시 `null` 방어 코드 필요)
- Market API 개발 시 `tradable` 검증 로직을 누락할 경우 런타임 에러(null 연산)가 발생할 수 있습니다. (반드시 서버단 `require(tradable === true)` 검증 필수)

## 10. Recommendation
1. Property ID는 변동성 속성(면적)을 포함하지 않는 Immutable ID(현재 1단지 1면적이므로 `complex_id`를 그대로 사용하거나 별도 식별자 사용)로 확정할 것을 권장합니다.
2. Property Master 생성 스크립트 작성 시, 위에서 설계한 `property_status`, `tradable` 및 `null` 필드 할당 로직을 적용합니다.

## 11. Final Verdict
**READY FOR IMPLEMENTATION**
현재 제시된 `INCOMPLETE` / `null` 기반의 데이터 모델 구조는 원본 데이터를 왜곡 없이 보존하면서도 경제 엔진의 안전을 지키는 가장 적절한 방안이므로, 이를 바탕으로 PLAY-07.2 구현을 시작할 수 있습니다.
