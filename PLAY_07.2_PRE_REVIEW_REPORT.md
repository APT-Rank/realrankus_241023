# PLAY-07.2 PROPERTY MARKET ENGINE 사전 검토(Pre-Review) 리포트

## A. 현재 코드 구조

* **현재 Property 관련 파일**: 없음 (신규 생성 필요).
* **현재 Firestore Collections**: `PLAY_PLAYER_ASSET`, `PLAY_DECISION_LOG`, `PLAY_SEASON`, `PLAY_BATCH`, `PLAY_BATCH_CHUNKS`가 존재함. 부동산 시장을 위한 `PLAY_PRIMARY_SUPPLY`, `PLAY_PROPERTY_OWNERSHIP`, `PLAY_PROPERTY_STATE`, `PLAY_ORDER`, `PLAY_TRANSACTION` 컬렉션이 신규로 필요함.
* **현재 Functions**: `joinSeason`, `advanceSeasonClock`, `processBatchChunk`, `runReconciliation`이 OIDC 및 Security Rules 기반으로 동작 중. 클라이언트가 API를 통해 Buy/Sell/Cancel Order를 넣을 수 있도록 Property 전용 HTTPS(또는 Callable) Functions 신규 필요.
* **현재 Security Rules**: `match /{collection}/{document=**} { allow write: if false; }`로 클라이언트 쓰기 원천 차단 상태.
* **현재 PLAY-07.1 구조**: Server Authority 및 Cloud Tasks를 통한 분산 처리, Idempotency(멱등성) 방어가 완벽하게 동작 중.

## B. PLAY-04와 비교

* **PLAY-04 요구사항**: Primary Supply는 단지별 Counter(유한 공급)로 관리하며, Order Book 체결(Price/Time 우선순위) 및 Asset Lock 메커니즘을 명시함.
* **현재 구현상태**: Property Market 자체가 아직 존재하지 않음 (뼈대 상태).
* **차이점**: PLAY-07.2 스펙에서는 Primary Transaction Idempotency, Concurrency(동시 구매 시 Negative Supply 방지), Reference Price(초기 가격 fallback) 등 트랜잭션 충돌 및 장애 복구(Failure Recovery) 시나리오를 훨씬 더 엄격하게 강제하고 있음.

## C. PLAY-07.2와 비교

* **구현 가능**: Primary/Secondary 분리, Asset Lock (현금/부동산), Order Book 관리, Atomic Secondary Trade, Idempotency 보장, Security Rule 준수 등 대부분의 코어 시스템.
* **수정 필요**: 
  - `PLAY_DECISION_LOG` 스키마(types.ts)에 Property 행동(Buy, Sell 등)을 담을 수 있도록 이벤트 타입과 필드 확장 필요.
  - `runReconciliation.ts` 내부에 부동산 자산 정합성(Cash Lock 일치, Ownership 수량 일치) 검사 로직 추가 필요.
* **Blocking Conflict**: 
  1. `PRIMARY_SUPPLY_RATIO` 등 시장 설정값의 저장소 및 파라미터가 구체적으로 지정되지 않음. (하드코딩 금지 규칙 위반 가능성)
  2. 원본 Property Master Dataset(`91_Complex_Valuation`)의 파일 구조 및 컬럼명 식별 불가. (자세한 내용은 아래 D항목 참고)

## D. 데이터 확인 (🚨 BLOCKING ISSUE / DATA SOURCE UNKNOWN)

`D:\real_estate_data\91_Complex_Valuation` 디렉토리에 위치한 실제 데이터를 조회한 결과, 다음과 같은 치명적인 문제가 확인되었습니다.

1. **단일 Snapshot 파일 부재**: 해당 디렉토리에는 약 300개 이상의 개별 `.csv` 파일(예: `...Valuated_202609.csv`, `...add_info.csv`)이 파편화되어 존재합니다. Season Initialization 시 **어느 파일들을 어떤 기준으로 병합하여 Snapshot으로 삼아야 하는지** 명시되어 있지 않습니다.
2. **컬럼명 인코딩 깨짐 및 식별 불가**: Python(UTF-8 및 CP949 인코딩 테스트)으로 데이터를 읽은 결과, `last_sales`, `X`, `Y` 등 영문 컬럼은 존재를 확인했으나 스펙에서 명시한 **'검색코드', '아파트명', '세대수', '매매실거래가', '법정동주소' 등의 한글 컬럼이 모두 인코딩 손상 문자로 표기되어 정확한 매핑이 불가능**합니다. (예: `Ʈ`, `ŸŸ` 등으로 출력됨)

## E. 구현 계획

* **CREATE**: 
  - `functions/src/play/property/primaryMarket.ts` (공급 및 초기 구매 로직)
  - `functions/src/play/property/secondaryMarket.ts` (Order Book 및 P2P 체결 로직)
  - `functions/src/play/common/types_property.ts` (부동산 전용 스키마)
* **MODIFY**:
  - `functions/src/play/batch/runReconciliation.ts` (부동산 자산 정합성 검사 추가)
  - `functions/src/play/common/types.ts` (`PLAY_DECISION_LOG` 구조 확장)
* **DO NOT TOUCH**:
  - `functions/src/play/batch/economicEngine.ts` (PLAY-07.1 경제 산식 완벽 보존)
  - `functions/src/play/batch/processBatchChunk.ts` (PLAY-07.1 Idempotency 구조 보존)
  - `firestore.rules` (클라이언트 쓰기 금지 정책 유지)

---

# 🚨 최종 Pre-Review 결과: DATA SOURCE UNKNOWN / BLOCKED

**지시하신 33. Pre-Review 종료 조건에 따라, 현재 데이터 원천 식별 불가 및 설정 파라미터 누락으로 인해 실제 코드 구현을 진행하지 않고 중단합니다.**

### 필요한 의사결정 및 제안:
1. `D:\real_estate_data\91_Complex_Valuation` 내 수많은 파일 중 **Season Snapshot에 사용할 정확한 파일명 규칙이나 병합 대상 리스트**를 지정해 주십시오.
2. 한글 인코딩 문제로 인해 '검색코드', '아파트명' 등의 정확한 원본 컬럼명을 매핑할 수 없으므로, **정확한 CSV 컬럼 헤더명(영문이거나 호환 가능한 형태) 리스트**를 제공해 주십시오.
3. `PRIMARY_SUPPLY_RATIO` 등의 설정값을 Firestore의 특정 Document(예: `PLAY_CONFIG`)에서 읽어올지, 아니면 Season 생성 시나리오(Scenario) 파라미터로 주입할지 결정해 주십시오.
