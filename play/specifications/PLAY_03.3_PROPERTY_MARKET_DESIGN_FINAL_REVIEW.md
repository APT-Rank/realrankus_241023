# PLAY_03.3_PROPERTY_MARKET_DESIGN_FINAL_REVIEW.md

## 1. Executive Summary

*   **전체 판단**: 현재의 `PLAY_03.3` 설계는 논리적 모순을 대부분 제거했으며, 서버 권한 중심의 상태 관리 철학이 매우 명확합니다. MVP 수준의 구현 지시서 작성을 위한 경제적/논리적 기반이 완벽히 갖춰졌습니다.
*   **구현 가능 여부**: Firebase 아키텍처(Firestore + Cloud Functions + Cloud Tasks/Scheduler) 상에서 완벽히 구현 가능합니다. 단, 기존 RealRankers의 클라이언트 직접 쓰기 방식과는 완전히 단절된 백엔드 파이프라인 구축이 필수적입니다.
*   **가장 중요한 기술 위험 3가지**:
    1.  **Season Initialization 부하**: 전국의 아파트 단지(수만 개)에 대해 Primary Supply를 한 번에 생성할 경우 Firestore 일일 할당량 초과 및 Cloud Functions 타임아웃이 발생할 수 있습니다.
    2.  **Order Book 매칭 트랜잭션 경합(Contention)**: 인기 있는 단지에 주문이 집중될 때 다수의 유저가 동시에 Firestore Transaction을 시도하면 낙관적 락(Optimistic Lock) 충돌로 인해 지연이 발생할 수 있습니다.
    3.  **경제 엔진 Batch와 사용자 Action 간의 Race Condition**: 현금 차감(월세, 세금 등)을 수행하는 스케줄러와 사용자의 매수 주문(Asset Lock)이 1밀리초 단위로 동시에 발생할 경우 이중 차감 위험이 있습니다.

---

## 2. Architecture Compatibility

*   **기존 RealRankers와의 충돌 여부**: 충돌하지 않습니다. 기존 시스템은 Vanilla JS, jQuery 중심의 프론트엔드 상태 관리를 수행하지만, PLAY는 Firestore의 `PLAY_` 네임스페이스를 사용하여 완전히 분리된 데이터 계층을 갖습니다. 기존 코드를 리팩토링할 필요 없이, PLAY용 신규 API 및 UI 뷰만 추가하면 됩니다.
*   **Firebase / Cloud Functions / Firestore 구조**: 상태 관리는 Firestore, 핵심 로직은 Cloud Functions(HTTPS Callable), 이력 보존은 BigQuery Export 확장 프로그램으로 구성하는 것이 가장 이상적입니다.
*   **Server Authority**: 클라이언트(JS)는 Firestore에 직접 쓰기(Write) 권한을 가지지 않으며, 오직 `placeOrder`, `cancelOrder` 등의 Cloud Functions 엔드포인트만 호출해야 합니다. Security Rules 적용 시 100% 보장 가능합니다.

---

## 3. Detailed Findings

| ID | Severity | 영역 | 문제 | 영향 | 권장 기술 해결안 | 설계 변경 필요 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Critical | Scale | Primary Supply를 개별 도큐먼트로 생성 시 비용/시간 한계 | 수백만 개의 도큐먼트가 순간 생성되어 Timeout 발생 | 개별 도큐먼트 대신 단지별 1개의 Supply 도큐먼트 내 `available_quantity` 정수 카운터 사용 | 불필요 |
| 2 | High | Concurrency | Batch와 Order의 동시 실행 | Cash 이중 차감 및 무결성 파괴 | 모든 Cash 조작(Batch 포함)은 반드시 `PLAY_PLAYER_ASSET` 단위의 트랜잭션 사용 | 불필요 |
| 3 | Medium | Rent | 만기/연체 체크 스케줄러 부하 | 매일 수만 개의 Contract 도큐먼트를 전체 스캔 시 DB 비용 폭증 | Contract 도큐먼트에 `next_action_date` 인덱스를 추가하여 만기도래 건만 쿼리 | 불필요 |
| 4 | Low | Order | 단일가 주문 집중 시 Lock Contention | 인기 단지의 주문 체결 지연 | 매칭 엔진을 Event Sourcing(Pub/Sub) 비동기 큐로 분리 처리 | 불필요 |

---

## 4. Critical Race Conditions

### 시나리오 1: Batch와 Order 간의 현금 이중 차감 (Double Spend)
*   **A 주문**: Player가 가용현금 7억 원 중 7억 원으로 매수(BUY) 주문 제출.
*   **B 주문 (Batch)**: 동시에 경제 엔진 스케줄러가 세금 1천만 원 차감 로직 실행.
*   **동시 Transaction**: 두 스레드가 동시에 `available_cash` 7억 원을 Read.
*   **예상 결과**: Order가 7억을 Lock하고, Batch는 잔액 부족으로 Grace Period로 넘겨야 함.
*   **실제 위험**: 순차적 Lock이 없으면 Order는 7억을 Lock하고, Batch는 잔고에서 1천만 원을 빼버려 `cash.total`이 -1천만 원(Negative Cash)이 됨 (데이터 무결성 붕괴).
*   **해결 방법**: Firestore Transaction을 통해 `PLAY_PLAYER_ASSET` 도큐먼트 자체에 버전을 매겨 읽고 쓰기를 원자적(Atomic)으로 묶어야 합니다.

### 시나리오 2: Primary Supply 매수 경합 (Over-selling)
*   **상황**: Primary Supply 남은 수량이 1개. 5명의 플레이어가 동시에 BUY 요청.
*   **실제 위험**: Cloud Functions가 5건 모두 가용 수량 1개로 판단하여 5명 모두에게 소유권을 부여함(총량 불변의 법칙 붕괴).
*   **해결 방법**: Firestore `FieldValue.increment(-1)`을 사용하고, Security Rules 혹은 트랜잭션 검증에서 `available_quantity >= 0`을 엄격히 강제해야 합니다.

---

## 5. Data Model Review

*   **`PLAY_ORDER`**
    *   **목적**: 호가창 데이터 관리.
    *   **핵심 필드**: `property_id`, `price`, `status`, `side`.
    *   **Index**: `(property_id, status, price, created_at)` 복합 인덱스 필수 (매칭 및 호가창 조회용).
*   **`PLAY_PRIMARY_SUPPLY`**
    *   **목적**: 시즌 초기 공급.
    *   **핵심 필드**: `property_id`, `initial_price`, `available_quantity`.
    *   **예상 문제**: 가구당 1개의 개별 도큐먼트를 만들면 DB 비용이 기하급수적입니다. 카운터(Counter) 모델로 관리해야 합니다.
*   **`PLAY_PLAYER_ASSET`**
    *   **목적**: 유저 지갑 및 Lock 상태 관리.
    *   **핵심 필드**: `cash.available`, `cash.locked`, `property.available`.
    *   **예상 문제**: 거래가 잦은 유저의 핫 도큐먼트가 될 수 있으나 부동산 특성상 초당 1회 제한에는 걸리지 않습니다.

---

## 6. Security Review

| 조작 대상 | Client Access (Vanilla JS) | Server Authority (Cloud Functions) |
| :--- | :--- | :--- |
| **Cash / Debt** | Read Only (조작 불가) | Update (Batch, Settlement) |
| **Order 생성** | Write 불가 (`placeOrder` API만 호출) | Validate & Write |
| **Transaction 체결** | 접근 금지 | Backend Matching Engine |
| **Contract (전월세)**| 접근 금지 | Backend Matching & Scheduler |
| **Market Price** | Read Only | Aggregate (Cloud Functions) |

---

## 7. Scale Review

*   **10 ~ 100 Players**: Firestore의 실시간 동기화로 쾌적한 플레이 보장. 성능 병목 전혀 없음.
*   **1,000 Players**: Order Book 매칭 트랜잭션이 완벽히 동작. 단, 매일 정각에 실행되는 Economic Batch Update 시 Functions 실행 시간이 1~2초 지연될 수 있음.
*   **10,000 Players**: 
    *   **문제**: Season Initialization 시 약 3~4만 개 아파트 단지의 초기 Supply를 단일 Cloud Functions(최대 9분) 내에 생성 불가능(Timeout).
    *   **해결**: Cloud Tasks 또는 Pub/Sub을 이용한 Fan-out 비동기 처리로 Initializer를 분산 처리해야 함.

---

## 8. Implementation Blockers

구현 전에 기술적으로 반드시 짚고 넘어가야 하는 구조적 문제입니다.

1.  **Cloud Tasks 인프라 구성**: Batch(이자, 월세, 퇴거) 및 초기화(Initialization)는 단일 Cloud Functions로 처리할 수 없습니다. Google Cloud Tasks 또는 Pub/Sub 아키텍처를 도입하여 작업을 쪼개서(Chunking) 실행하도록 백엔드 인프라 구성을 확정해야 합니다.
2.  **Primary Supply 카운터 추상화**: 가구 수 * 비율만큼 '개별 도큐먼트'를 생성하려 한다면 수십만 건의 Write가 발생합니다. 반드시 단지별 1개의 Supply 도큐먼트 내 `quantity` 카운터를 차감하는 방식으로 개발 표준을 정해야 합니다.

---

## 9. Additional Decisions Required

설계자(Product Owner)의 의사결정이 누락된 영역입니다. 이 항목은 "기술적 옵션"을 제안한 것이며 경제적 룰을 임의로 수정한 것이 아닙니다.

### Q1. Market Reference Price의 Fallback 기준
*   **Why it matters**: Season 초기나 거래가 없는 외곽 지역 단지의 경우 `last_transaction_price`나 `VWAP`가 존재하지 않습니다. 이때 화면에 표시될 Reference Price가 필요합니다.
*   **Possible options**:
    1. Null 처리하여 '거래 없음'으로 비워둠.
    2. Primary Market의 `PRIMARY_INITIAL_PRICE`를 영구 Fallback으로 사용.
*   **Recommended technical option**: Option 2. UI 표시 및 예측 모델 학습을 위해 결측치(Null)보다는 기준가(Initial Price)를 표출하는 것이 시스템 오류를 줄입니다.

### Q2. Primary Supply 수량 계산의 소수점 처리
*   **Why it matters**: `Household Count × PRIMARY_SUPPLY_RATIO` 계산 시 1.5채, 2.7채 등 소수점이 발생할 수 있습니다.
*   **Possible options**:
    1. 올림(Ceil)
    2. 반올림(Round)
    3. 내림(Floor)하되 0채일 경우 최소 1채 보장
*   **Recommended technical option**: Option 3 (Floor + 최소 1채 보장). 주택 공급 인플레이션을 방지하고 안정적인 정수(Integer)를 얻기 위함입니다.

---

## 10. Final Verdict

**READY AFTER MINOR FIXES**

경제 규칙, 시장 논리, 데이터 분리 철학이 완벽에 가깝게 정리되었습니다. 데이터 정합성(Asset Lock)과 동시성 문제에 대한 명세도 명확합니다. Section 9에 제기된 사소한 의사결정(소수점 처리, Fallback 가격)만 마무리되면, 제안된 Cloud Functions / Firestore 트랜잭션 패턴을 활용해 즉시 Implementation Specification 작성을 시작할 수 있습니다.
