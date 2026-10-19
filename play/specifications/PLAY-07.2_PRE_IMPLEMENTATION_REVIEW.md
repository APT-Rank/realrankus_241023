# PLAY-07.2 PRE-IMPLEMENTATION REVIEW

## 1. Review Summary
PLAY-07.2 Property Market Engine의 실제 코드 구현에 앞서, 기존 PLAY-06/06.1/07.1 인프라와의 충돌 여부를 확인하고 아키텍처 정합성을 점검했습니다. 
점검 결과, 제안된 PLAY-07.2 구현 스펙은 현재의 Server-Authoritative 구조 및 Idempotency 모델과 완벽하게 호환되며, 즉시 구현(READY)이 가능한 상태임을 확인했습니다.

## 2. Infrastructure & Implementation Mapping

### 1) 현재 Repository 구조
- `functions/src/play` 아래에 `admin`, `batch`, `common`, `reconciliation`, `season` 폴더가 존재합니다.
- Property Market을 위해 `property`(Master 생성/조회)와 `market`(Primary/Secondary 거래) 디렉터리를 추가하여 도메인을 분리하는 것이 적절합니다.

### 2) Firebase Project & Cloud Functions
- Firebase Auth 및 Firestore가 정상 연동되어 있습니다.
- 모든 로직이 Cloud Functions 환경에서 Admin SDK를 통해 동작하고 있어 Server Authority 원칙에 부합합니다.

### 3) Firestore Collections
- 기존: `PLAY_SEASON`, `PLAY_PLAYER`, `PLAY_PLAYER_ASSET`, `PLAY_BATCH`, `PLAY_BATCH_CHUNKS`, `PLAY_IDEMPOTENCY_LOG`, `PLAY_DECISION_LOG`
- **신규 추가 대상**: 
  - `PLAY_PROPERTY_MASTER`: 부동산 메타데이터 스냅샷 (209개)
  - `PLAY_PRIMARY_SUPPLY`: 시즌 시작 시 공급되는 신규 분양 물량
  - `PLAY_PROPERTY_OWNERSHIP`: 유저별 부동산 소유권 정보
  - `PLAY_SECONDARY_ORDER`: 2차 시장 호가(Order Book) 데이터
  - `PLAY_PROPERTY_TRANSACTION`: 거래 체결 이력 로그

### 4) Security Rules (firestore.rules)
- 현재 모든 `PLAY_` Prefix 컬렉션에 대해 `allow write: if false;`가 적용되어 있습니다.
- 클라이언트의 직접 쓰기를 원천 차단하는 이 규칙은 Secondary Market Order 생성 시에도 유지되어야 하며, 클라이언트는 반드시 API(Cloud Functions)를 통해서만 Order를 제출해야 합니다. (규칙 변경 불필요)

### 5) Cloud Tasks & Internal Auth
- 시즌 타이머(`advanceSeasonClock`) 및 배치 처리(`processBatchChunk`)가 OIDC 기반 Internal Auth로 보호되어 동작 중입니다.
- Property Market의 비동기 작업(예: 대규모 거래 정산 배치 등)이 필요해진다면 기존 토큰 발급/검증 모델을 그대로 재사용할 수 있습니다.

### 6) PLAY_PLAYER_ASSET & Reconciliation
- 현재 자산은 `cash`, `locked_cash`, `debt`, `property_count`, `net_worth` 등을 관리합니다.
- BUY Order 등록 시 `cash`를 감소시키지 않고 `locked_cash`를 증가시켜 안전하게 락(Lock)을 거는 로직이 기존 모델에 정확히 매핑됩니다.
- 기존 Reconciliation 로직(`total == available + locked`)이 훼손되지 않도록 트랜잭션을 엄격히 설계합니다.

### 7) PLAY-07.1 Economic Engine
- Basic Income/Expense 엔진은 Property 소유 여부와 무관하게 Cash 증감을 발생시킵니다.
- Property Market 거래(자산 매입/매각)는 Cash의 교환일 뿐이므로 기존 소득/지출 배치 엔진과 충돌하지 않고 독립적으로 병렬 동작할 수 있습니다.

## 3. Conflict Analysis (Spec vs Current Implementation)

**Q: PLAY-07.2 Spec과 현재 구현 사이에 충돌이 있는가?**
**A: 시스템 아키텍처 및 로직상의 충돌은 없습니다. 단, 스펙에 정의되지 않은 파라미터가 1개 존재하며 이는 Placeholder 설계로 회피(Resolve) 가능합니다.**

- **PRIMARY_SUPPLY_RATIO 미정 문제**: 스펙상 이 비율을 임의로 결정하지 말라고 명시되어 있습니다. 
  - **해결 방안**: 하드코딩하지 않고 Season 문서(`PLAY_SEASON`) 내 `config` 객체의 외부 설정값으로 분리합니다. API에서 값을 받지 못하면 Property Market Initialization을 중단(Throw Error)하거나 설정 대기 상태로 두도록 구현하여 임의의 값을 사용하는 것을 방지합니다.

## 4. INCOMPLETE Property 처리 전략 재확인
- 앞서 정의된 3건(`gMQ0a`, `gHwaa`, `fa8da`)은 `PLAY_PROPERTY_MASTER`에 `INCOMPLETE` 상태로 보존됩니다.
- Primary Supply 초기화(Season Initialization) 로직에서 `property_status == "NORMAL" && tradable == true` 인 경우만 쿼리하여 분양 물량을 생성하므로, INCOMPLETE 단지들은 시장에 공급되지 않아 안전합니다.

## 5. Final Verdict
**READY**
- 보안, 멱등성, 자산 락킹, 서버 권위 등 기존 아키텍처 원칙을 단 하나도 위반하지 않으며, Firestore 스키마 확장만으로 명세된 시스템을 완벽히 구현할 수 있습니다.
- 승인이 내려지는 즉시 `Property Master` 생성 스크립트부터 구현 및 검증을 시작할 수 있습니다.
