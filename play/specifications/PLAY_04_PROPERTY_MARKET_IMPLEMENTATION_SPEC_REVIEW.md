# PLAY_04_PROPERTY_MARKET_IMPLEMENTATION_SPEC 기술 검토 및 구현 계획

## 1. 목적
본 문서는 `PLAY_04_PROPERTY_MARKET_IMPLEMENTATION_SPEC.md`의 설계안을 기존 RealRankus 코드베이스(프론트엔드 및 데이터 구조)에 통합하기 위한 기술적 구현 가능성, 예상되는 병목 현상, 원천 데이터 매핑 가능성 및 구체적인 태스크 목록을 정리한 검토 보고서입니다.

---

## 2. 기존 시스템(RealRankus)과의 호환성 검토

### 2.1. Frontend Architecture
- **현황**: `index.html` 기반의 SPA 형태로, Vanilla JS와 jQuery를 주로 사용하여 지도(Naver Maps)와 UI 컴포넌트(모달, 오프캔버스)를 제어하고 있습니다.
- **적용 방안**: PLAY의 인터페이스는 기존 지도 뷰에 덧씌워지거나 별도의 거대한 컨테이너(또는 모달)로 작동해야 합니다. 기존 코드(`board.js`, `simulation.js` 등)와의 충돌을 피하기 위해 `PLAY_` 네임스페이스를 엄격히 분리하여 캡슐화된 컴포넌트로 UI를 구현해야 합니다.

### 2.2. Backend (Firebase) & Security
- **현황**: Client에서 Firestore를 직접 쿼리하여 아파트 정보를 노출하는 구조입니다.
- **적용 방안 (Server Authority)**: 설계 원칙(Server Authority)에 따라 PLAY의 핵심 데이터(현금, 자산, 주문, 거래)는 Client가 직접 수정할 수 없어야 합니다. 따라서 `PLAY_*` 컬렉션에 대한 Firestore Security Rules를 재작성하여 Client의 Write를 전면 차단하고, 주문 제출(Intent)은 Firebase Cloud Functions(Callable)를 통해서만 이루어지도록 백엔드 인프라를 확장해야 합니다.

---

## 3. 원천 데이터 매핑 검증

`D:\real_estate_data\91_Complex_Valuation`에 저장된 JSON 데이터 구조를 확인한 결과, **Season Initialization에 필요한 모든 데이터를 문제없이 확보할 수 있습니다.**

| PLAY Requirement | JSON Data Field | 비고 |
| :--- | :--- | :--- |
| **Property ID** | `검색코드` (예: "22124") | 고유 식별자로 사용 가능 |
| **Property Name** | `아파트명` | |
| **Total Supply** | `세대수` | `floor(세대수 * Ratio)` 계산 후 최소 1 적용 |
| **Initial Price** | `last_sales` 내부의 매매가<br>또는 `매매실거래가` | Reference Price로 활용 가능 |
| **Location** | `법정동주소` / `X`, `Y` | 좌표계산 및 지역 분류에 사용 |

---

## 4. 예상되는 기술적 문제 및 해결책 (Blockers & Risks)

### Risk 1. Season Initialization 시의 Firestore 할당량/타임아웃 문제
- **이슈**: 수만 개의 전국 아파트 단지에 대해 동시에 Primary Supply 문서를 초기화하면 Cloud Function의 Timeout(최대 9분) 초과 및 Firestore 쓰기 한계에 직면합니다.
- **해결책**: 명세(Spec 37)에 명시된 대로 **Cloud Tasks 또는 Pub/Sub을 이용한 청크(Chunk) 분산 처리 인프라** 구축이 구현 전 선행되어야 합니다.

### Risk 2. 인기 단지의 Transaction Contention (경합)
- **이슈**: 특정 아파트(대장 아파트 등)의 Primary Supply 1개를 두고 수백 명의 플레이어가 동시에 구매(BUY) 버튼을 누를 경우, Firestore Transaction Contention이 발생하여 수많은 재시도(Retry)와 실패 오류가 발생할 수 있습니다.
- **해결책**: MVP 단계에서는 Firestore Transaction을 활용하되 실패 시 Client에 명확한 `PRIMARY_SUPPLY_EXHAUSTED` 또는 `CONCURRENT_UPDATE` 에러를 반환해 UX 불만을 줄이고, 차후 Event Sourcing 기반의 Single Worker Matching으로 확장할 수 있게 코드를 모듈화해야 합니다.

### Risk 3. 경제엔진 Batch와 유저 액션 간 동시성 충돌
- **이슈**: 이자 차감, 월세 차감 등의 스케줄러(Batch) 동작 중 유저가 주문을 넣을 경우 자산 정합성이 깨질 우려가 있습니다.
- **해결책**: 모든 자산 변동(Asset Lock, 차감, 거래)은 `PLAY_PLAYER_ASSET` 문서 1개를 기준으로 엄격한 Firestore Transaction 내에서 이루어지도록 강제해야 합니다.

---

## 5. 단계별 구현 계획 및 태스크 리스트 (Implementation Order)

아래 태스크는 코딩(구현) 착수 시 따라야 할 작업 명세서입니다.

### Phase 1: 인프라 및 데이터 모델 구성 (Backend Base)
- [ ] **TASK-001**: PLAY 전용 Firebase Cloud Functions(Node.js) 프로젝트 세팅 및 Admin SDK 연동.
- [ ] **TASK-002**: Firebase Security Rules 업데이트 (PLAY 컬렉션의 Client Write 완전 차단).
- [ ] **TASK-003**: Firestore에 `PLAY_SEASON`, `PLAY_PLAYER`, `PLAY_PLAYER_ASSET` 구조 뼈대 설계.

### Phase 2: Season Initialization & Primary Supply
- [ ] **TASK-004**: `91_Complex_Valuation` 데이터를 Cloud Functions가 읽을 수 있도록 Cloud Storage 배치 또는 초기화 스크립트 작성.
- [ ] **TASK-005**: Cloud Tasks / Pub-Sub 기반의 Initial Supply 데이터 분산(Chunk) 생성 워커 개발.
- [ ] **TASK-006**: 단지별 카운터(Counter) 방식을 적용한 `PLAY_PRIMARY_SUPPLY` 문서 트랜잭션 로직 구현 (Idempotency 보장).

### Phase 3: Player 초기화 및 Primary Market
- [ ] **TASK-007**: Player 계정 생성 시 서버 단에서 현금 7억원 초기화 (Debt 0, Property 0).
- [ ] **TASK-008**: Primary Market 구매 API (Callable) 개발 (잔고 검증, Asset Lock, 소유권 이전 트랜잭션).

### Phase 4: Secondary Market Order Book
- [ ] **TASK-009**: BUY/SELL Order 생성 및 취소 API 개발 (Asset Lock 적용, 수수료 검증 로직 포함).
- [ ] **TASK-010**: 매칭 엔진 개발 (Price/Time Priority 기반, Partial Fill 없이 Quantity=1 단위 체결).

### Phase 5: Contracts (Rent/Jeonse) 및 경제 페널티
- [ ] **TASK-011**: 매일 동작하는 Rent Scheduler 구현 (인덱싱된 `next_action_date` 활용).
- [ ] **TASK-012**: Arrears (체납), Eviction (퇴거) 로직 및 `HOMELESS` 상태 반영 트랜잭션 구현.
- [ ] **TASK-013**: Jeonse Default 시 Penalty Loan 자동 실행 로직 구현.

### Phase 6: Economic Integration & Forced Sale
- [ ] **TASK-014**: 세금(Tax), 생활비 등 Economic Batch 분산 처리 워커 개발.
- [ ] **TASK-015**: Negative Cash 방어 로직 (Cash Buffer -> Grace Period -> Forced Sale) 구현.

### Phase 7: History, Analysis & Frontend
- [ ] **TASK-016**: 거래 성립 시 History 보관용 `Decision Log` 저장 로직 추가.
- [ ] **TASK-017**: 프론트엔드(Vanilla JS/jQuery) 상에 PLAY 모드 토글 컴포넌트 추가 및 팝업/오프캔버스 구현.
- [ ] **TASK-018**: 사용자 자산조회 패널, Order Book 실시간 현황판(Firestore Snapshot 리스너 활용) 뷰 개발.

---

## 6. 최종 검토 의견 (Go / No-Go)

**상태**: **READY AFTER INFRA SETUP** (인프라 준비 후 구현 개시 가능)

**결론**:
제공된 `PLAY_04` 설계서는 기존 프로젝트의 구조를 훼손하지 않으면서도 Server Authority 하에 독립된 모듈로 충분히 구현할 수 있습니다. 
단, 클라이언트 위주였던 기존 시스템에 대규모 서버 트랜잭션 로직이 신규 추가되는 만큼, **Cloud Functions 설정, Cloud Tasks 연동 등 서버 측 기본 인프라 세팅(Phase 1, Phase 2)을 먼저 완료한 후** 차례로 비즈니스 로직(Phase 3 이후)을 구현해야 합니다. 원칙에 맞게 모든 로직은 Backend(Server)에 위치해야 하며 프론트엔드는 UI 표출 및 Intent(요청) 전송 역할만 수행합니다.
