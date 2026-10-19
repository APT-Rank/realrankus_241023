# PLAY-RESEARCH-DATA-SCHEMA_REVIEW

## 1. Review Scope & Documents
* **Scope:** Gap Analysis of `PLAY-RESEARCH-DATA-SCHEMA.md` against current PLAY RAW Data (L100 AI Validation output).
* **Reviewed Documents:** `PLAY-RESEARCH-DATA-SCHEMA.md`, `PLAY_01_ARCHITECTURE.md`, `PLAY-07.3_BATCH_PROCESSING_ENGINE_SPEC.md`, `PLAY-AI-SEASON-01_L100_REPORT.md`.
* **Constraint:** No code modifications. Identify structural readiness for longitudinal human behavioral research.

## 2. 10 Core Questions Assessment

### Q1. 현재 PLAY 데이터만으로 논문 수준의 Environment → Decision → Transaction → Outcome 분석이 가능한가?
**아니오 (NO).** 현재 데이터는 `Environment → [Blackbox] → Transaction → Outcome` 구조입니다. 중간 단계인 Decision(의사결정)과 실패한 Action(거절된 거래)이 DB에 남지 않기 때문에, 참여자가 왜 그 행동을 했는지 입증할 수 없습니다.

### Q2. 현재 구조에서 가장 큰 연구 데이터 공백은 무엇인가?
**R_EXPOSURE와 R_VALIDATION (Rejected Action)의 부재**입니다. 참여자가 어떤 가격, 어떤 거시경제 지표를 보고 버튼을 눌렀는지에 대한 스냅샷이 없으며, 잔고 부족 등으로 거절된 시도 횟수를 알 수 없습니다.

### Q3. R_EXPOSURE를 Human Season 전에 구현해야 하는가?
**네 (YES).** 노출된 정보(Exposure)는 사후에 복원할 수 없습니다. 동일한 턴이라도 사용자가 조회한 시점의 화면(캐시 등) 상태가 연구의 독립 변수(Independent Variable)가 되므로 사전에 반드시 로깅 체계를 구축해야 합니다.

### Q4. Decision → Action → Validation → Transaction을 현재 Decision Log만으로 충분히 복원할 수 있는가?
**아니오 (NO).** 현재 `PLAY_DECISION_LOG`는 `MONTHLY_ECONOMIC_UPDATE`(상태 변화)나 성공한 트랜잭션의 결과만 기록합니다. 실패한 트랜잭션 의도(Intent)는 기록되지 않습니다.

### Q5. 30년 동안 Participant의 상태 변화(Trajectory)를 Period 단위로 재구성할 수 있는가?
**네 (YES).** `PLAY_DECISION_LOG`에 Period별 `before_cash`, `after_cash`, `income`, `living_expense`, `after_net_worth`가 완벽하게 보존되므로(L100 기준 36,104건) 완벽한 Trajectory 복원이 가능합니다 (G1 - Derivable).

### Q6. Season 1과 Season 2의 결과를 규칙/환경 차이를 통제하면서 비교할 수 있는가?
**네 (YES).** `PLAY_SEASON` 내 `scenario_id`, `rule_version`을 통해 통제 변수를 분리하여 쿼리할 수 있습니다 (G0).

### Q7. 동일 조건에서 Participant 간 행동 차이를 연구할 수 있는가?
**부분적 가능 (PARTIAL).** 재산 증감 차이는 연구 가능하나, "왜 차이가 났는지"(예: 특정 정보에 더 민감하게 반응했는지)는 Exposure Data 부재로 인해 인과관계를 입증하기 어렵습니다.

### Q8. 특정 Decision의 결과를 1년/3년/5년/10년/최종 결과로 연결할 수 있는가?
**네 (YES).** 성공한 `PLAY_PROPERTY_TRANSACTION`을 기점으로, 이후 특정 Period(12, 36, 60 등)의 `PLAY_DECISION_LOG` 상태를 JOIN하면 G1 수준에서 결과(Outcome) 도출이 가능합니다.

### Q9. 특정 연구 결과가 어떤 원천 데이터와 코드/규칙에서 나온 것인지 추적 가능한가?
**네 (YES).** `idempotency_key`, `trace_id`, `scenario_version`이 보존되므로 Provenance 추적이 가능합니다 (G0).

### Q10. Human Season 시작 전에 반드시 추가해야 하는 데이터는 무엇인가?
1. **R_EXPOSURE:** UI에서 사용자가 본 화면의 주요 지표(가격, 이자율 등) 로깅.
2. **R_ACTION / R_VALIDATION:** 트랜잭션 실패(잔고 부족 등)를 에러 리턴으로 끝내지 않고 Research Log로 적재하는 파이프라인.

## 3. Gap Classification Summary
* **G0 (Available):** R_SEASON, R_PARTICIPANT, R_TRANSACTION
* **G1 (Derivable):** R_BASELINE, R_STATE_SNAPSHOT, R_OUTCOME, R_TRAJECTORY, R_PROVENANCE, R_SEASON_RESULT
* **G2 (New Logging Required):** R_EXPOSURE, R_DECISION, R_ACTION, R_VALIDATION (특히 실패 기록)
* **G3 (Human Season Required):** R_EXPERIMENT, R_EXPERIMENT_EXPOSURE

## 4. Final Status Table

| Area                    | Status | Evidence | Human Season 전 필요 여부 |
| ----------------------- | ------ | -------- | -------------------- |
| Season Metadata         | G0     | `PLAY_SEASON` | - |
| Participant             | G0     | `PLAY_PLAYER` | - |
| Baseline                | G1     | `PLAY_PLAYER_ASSET` (P0) | - |
| Information Exposure    | G2     | Missing | **YES (Critical)** |
| State Snapshot          | G1     | `PLAY_DECISION_LOG` | - |
| Decision                | G2     | Missing | **YES** |
| Action                  | G2     | Missing | **YES** |
| Validation (Failures)   | G2     | Missing | **YES (Critical)** |
| Transaction             | G0     | `PLAY_PROPERTY_TRANSACTION` | - |
| Outcome                 | G1     | `PLAY_DECISION_LOG` 조인 | - |
| Trajectory              | G1     | `PLAY_DECISION_LOG` 연속 | - |
| Experiment              | G3     | N/A | YES |
| Provenance              | G1     | `scenario_id`, `trace_id` | - |
| Deterministic Replay    | G0     | `PLAY_SEASON` seed 등 | - |
| Season Comparison       | G0     | `rule_version` | - |
| RAW/Research Separation | G1     | BigQuery 이관 파이프라인 필요 | YES |
