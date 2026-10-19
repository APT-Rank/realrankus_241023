# PLAY_03_PROPERTY_MARKET_REVIEW.md

## 1. 구현 가능 여부
현재 RealRankus 하이브리드(클라이언트-서버 분리) 아키텍처 환경에서 **구현 가능**합니다. `PLAY_03_PROPERTY_MARKET.md`의 핵심 원칙인 "시즌 초기 Snapshot 생성 후 원천 데이터와 분리" 정책은 기존 프론트엔드 중심의 실거래 데이터 조회 로직과 전혀 충돌하지 않으며, 서버 사이드(예: Cloud Functions)에서 완전히 독립적으로 구현할 수 있습니다.

## 2. 기존 시스템과의 연결 지점
*   **시즌 초기화 스크립트**: 시즌(Season)이 생성되는 시점에 단 한 번, `D:\real_estate_data\91_Complex_Valuation` 폴더 내의 `.json` 또는 `.csv` 파일들을 읽어들여 `PLAY_PROPERTY` DB 컬렉션에 초기값을 적재하는 "Season Initialization" 백엔드 모듈이 필요합니다.
*   **식별자 참조**: `complex_id`를 통해 기존 RealRankus 단지 정보의 상세 메타데이터(UI 표시용 등)를 참조할 수 있지만, 가격 업데이트 자체는 단절됩니다.

## 3. 실제 데이터 필드 매핑
`D:\real_estate_data\91_Complex_Valuation` 내의 JSON 파일 구조를 확인한 결과, 다음 필드들을 사용하여 매핑이 가능합니다.
*   **`complex_id`**: `검색코드` (예: "22124", "109379")
*   **`complex_name`**: `아파트명` 또는 `APT_Name_EN`
*   **`location`**: `법정동주소` 및 `도로명주소`
*   **`initial_price`**: `매매실거래가` (또는 `last_sales` 내부의 금액 파싱)
*   **`initial_price_date`**: `매매실거래년` (예: 20260814.0)

## 4. DB 구조상 필요한 사항
시즌 독립성과 예측(Forecast) 모델을 위한 방대한 히스토리 보존이 핵심입니다.
*   **초기 상태 테이블**: `PLAY_PROPERTY` (현재 상태 유지)
*   **시계열 이력 테이블**: `PLAY_PROPERTY_STATE_HISTORY`, `PLAY_MARKET_STATE_HISTORY` 등
*   **파생 테이블**: `PLAY_PROPERTY_DEMAND`, `PLAY_FORECAST`
*   **저장 한계 극복**: Firestore Document Size 한계(1MB)와 잦은 업데이트 시 발생하는 높은 비용 문제를 우려해야 합니다. `_HISTORY` 성격의 시계열 데이터는 Firestore보다는 Realtime Database(RTDB)나 BigQuery로 적재하는 하이브리드 DB 구조를 고려해야 합니다.

## 5. 기술적 충돌 / 위험
*   **쓰기(Write) 폭탄 발생 가능성**: 전국의 수많은 단지(수만 개)에 대해 매 Batch(현실 하루)마다 `play_price`, `rent`, `demand_index` 등을 업데이트하고, 그 이력을 `PLAY_PROPERTY_STATE_HISTORY`에 기록해야 합니다. 하루에만 수십~수백만 건의 Write가 발생할 수 있어, Firestore 할당량 초과 및 막대한 비용 발생의 심각한 기술적 위험(Risk)이 존재합니다.
*   **데이터 읽기 시점 충돌**: 시즌을 초기화하는 시점(Season Start)에 만약 기존의 데이터 수집 파이프라인(예: `Complex_valuation_V3.py`)이 JSON 데이터를 덮어쓰고 있다면 충돌이나 누락이 발생할 수 있습니다.

## 6. 확인이 필요한 사항
*   **전국 단위 vs 특정 지역 단위**: Season 1에서 대한민국의 모든 아파트 단지를 시뮬레이션할 것인지, 아니면 서울/수도권 등 특정 Region Group 단위로만 초기화할 것인지 확정이 필요합니다. (서버 비용 및 연산 속도와 직결됨)
*   **결측치(Missing Data) 처리 방식**: `91_Complex_Valuation` JSON 데이터 중 `매매실거래가` 필드가 null이거나 최신 거래 내역이 없는 아파트 단지의 경우, `initial_price`를 어떻게 산정할 것인지(예: 유사 단지 평단가 추정 또는 시뮬레이션 제외) 명확한 기준이 필요합니다.

## 7. 구현 전에 결정해야 할 사항
*   **DB 아키텍처 확정**: 비용과 속도 문제로 인해 상태(State)와 이력(History)을 분리 저장할 DB 아키텍처(Firestore + BigQuery 조합 등)를 사전에 결정해야 합니다.
*   **예측(Forecast) 모듈의 책임**: `PLAY_FORECAST` 데이터를 생성하는 주체(실시간 Rule Engine인지, 별도 ML 서버 스크립트인지)와 그 실행 주기를 명확히 해야 합니다.

## 8. PLAY_03 문서와 코드베이스 사이의 차이점
*   **데이터 쓰기 권한**: 기존의 RealRankus는 프론트엔드가 DB나 저장된 JSON에 강하게 의존하며 읽기/조회를 수행하는 구조라면, PLAY_03의 구조는 전적으로 "서버 스케줄러"가 방대한 시계열 데이터를 기계적으로 쏟아내는 **Write-Heavy(쓰기 중심)**의 폐쇄형 아키텍처라는 점이 가장 큰 차이입니다.
*   **가격 동기화의 단절**: 기존 시스템은 항상 최신 실거래가를 보여주려 하지만, PLAY는 고의적으로 시즌 시작 시점 이후의 실제 가격 업데이트를 무시한다는 철학적/구조적 차이가 있습니다.

## 9. 최종 구현 권고안
1.  **초기화 스크립트 분리**: Season 1을 위한 `Season_Initializer` 서버측 스크립트를 독립적으로 작성하여, JSON/CSV를 읽고 `PLAY_PROPERTY` 초기 DB를 세팅하는 과정만 먼저 구현/검증합니다.
2.  **시계열 데이터의 RDBMS 또는 BigQuery 활용 검토**: `PLAY_PROPERTY_STATE_HISTORY`와 같이 예측용으로 누적되는 대용량 데이터는 NoSQL(Firestore)이 아닌, 통계/집계 및 ML 모델 연동에 유리한 Data Warehouse(BigQuery 등) 또는 PostgreSQL 기반의 분리 저장소를 사용하는 것을 강력히 권고합니다.
3.  **데이터 클렌징 규칙 마련**: JSON 파싱 단계에서 발생할 수 있는 결측치(NaN, Null) 방어 로직을 먼저 마련해야 시뮬레이션이 중간에 멈추는 버그를 예방할 수 있습니다.
