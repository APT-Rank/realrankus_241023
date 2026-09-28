# PLAY RESEARCH DATA DICTIONARY

본 문서는 PLAY Engine에서 연구 목적으로 생성되는 `RESEARCH_EVENTS`의 데이터 구조를 정의합니다.

## 1. 개요
- **Collection**: `RESEARCH_EVENTS`
- **목적**: Economic Engine의 Critical Path에 영향을 주지 않으며, Participant의 환경 노출(EXPOSURE), 의사결정(DECISION), 행동(ACTION), 검증(VALIDATION), 실제 트랜잭션 결과(TRANSACTION)를 Asynchronous하게 기록하여 연구(Research) 목적으로 활용.
- **Idempotency/Traceability**: 모든 이벤트는 `correlation_id`로 묶이며, 동일한 Request 내에서 `request_id`와 `trace_id`를 공유합니다.

## 2. 공통 스키마 (ResearchEvent)
| Field | Type | Description |
|---|---|---|
| `correlation_id` | String | 사용자 행동 1회(또는 연속된 맥락)를 묶는 고유 ID |
| `trace_id` | String | 개별 API 요청/응답 단위를 추적하는 ID |
| `request_id` | String | 멱등성 검증(Idempotency Key)과 매핑되는 클라이언트 요청 ID |
| `season_id` | String | 현재 진행 중인 시즌 ID |
| `participant_id` | String | 사용자(Player/AI) ID |
| `simulation_period` | Number | 이벤트 발생 시점의 시뮬레이션 주기 (Period) |
| `event_type` | Enum | EXPOSURE, DECISION, ACTION, VALIDATION, TRANSACTION 중 하나 |
| `payload` | Object | Event Type에 따라 달라지는 세부 데이터 |
| `created_at` | Timestamp | Firestore 서버 시간 기준 기록 시간 |
| `status` | String | 데이터 상태 (예: 'PERSISTED') |
| `schema_version` | String | 데이터 스키마 버전 (현재 '1.0') |

## 3. Payload 상세 스키마

### 3.1 R_EXPOSURE
- **의미**: Participant가 의사결정을 내리기 전에 확인한 환경 데이터.
- **Payload**: 클라이언트 단에서 조회한 자산 가격, 시장 지표(GLI 등)와 같은 노출 정보 전체.

### 3.2 R_DECISION
- **의미**: 환경에 노출된 후 Participant가 내린 내부적 판단/의사결정.
- **Payload**: 의도된 행동(`intended_action`), 기대 가격 등 결정의 근거 데이터.

### 3.3 R_ACTION
- **의미**: 의사결정 결과로 실제 시스템에 인입된 요청 데이터.
- **Payload**: 
  - `action_type`: 예) 'PRIMARY_PURCHASE'
  - `supply_id`, `property_id` 등 요청 파라미터.
  - `idempotency_key`: 멱등성 키.

### 3.4 R_VALIDATION
- **의미**: Action이 시스템 내부 규칙(자산 부족, 시즌 종료 등)을 통과했는지 여부.
- **Payload**:
  - `validation_status`: 'SUCCESS' | 'REJECTED'
  - `validation_code`: 실패 시 에러 코드 (예: 'INSUFFICIENT_CASH', 'FAILED-PRECONDITION')
  - `validation_reason`: 실패 상세 사유

### 3.5 R_TRANSACTION
- **의미**: Validation을 통과하고 성공적으로 장부(Ledger)에 반영된 결과.
- **Payload**:
  - `transaction_id`: Economic Engine에서 생성된 실제 트랜잭션 ID.
  - `status`: 'COMPLETED'
