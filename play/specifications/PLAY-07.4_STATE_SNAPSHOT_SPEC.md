# PLAY-07.4 STATE SNAPSHOT SPEC

## 1. 개요
인시던트(버그, 해킹, 서버 다운 등) 발생 시 정확하게 재현하고 복구하기 위해 추출해야 하는 "최소 시스템 상태"를 정의한다. 

## 2. 장애 전/후 스냅샷 추출 명세

### 2.1. 필수 수집 데이터 (Minimum Viable Snapshot)
장애 분석을 위해서는 다음의 세 가지 계층 데이터가 필수적으로 요구된다.
1. **Season State (`PLAY_SEASON`)**
   - `season_id`, `current_simulation_period`, `status`, `transaction_status`
2. **Player Asset (`PLAY_PLAYER_ASSET`)**
   - `cash_total`, `net_worth`, `last_processed_period`, `processed_batches`
3. **Idempotency Logs (`PLAY_IDEMPOTENCY_LOGS`)**
   - `idempotency_key`, `status`, `result_reference`

### 2.2. 스냅샷 데이터 예시 (Incident 발생 직전)
```json
{
  "season": {
    "season_id": "S_INCIDENT_1790427029037",
    "status": "ACTIVE",
    "transaction_status": "NORMAL",
    "current_simulation_period": 1,
    "last_successful_batch_id": "S_INCIDENT_1790427029037_0_MONTHLY"
  },
  "asset": {
    "player_id": "S_INCIDENT_1790427029037_p1",
    "cash_total": 101166667,
    "last_processed_period": 0,
    "processed_batches": ["S_INCIDENT_1790427029037_0_MONTHLY"]
  }
}
```

## 3. 활용 목적
- 인시던트 재현(Incident Reproduction) 시 베이스라인 주입용
- Recovery/Resume 훈련 시 기준점 역할
- 로컬 `firebase-functions-test` 환경에서 동일 조건 구축을 위한 Mock Data 역할
