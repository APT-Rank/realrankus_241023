# PLAY-RESEARCH-DATA-L100_MAPPING_REPORT

## 1. L100 Dataset Overview
* **AI Population:** 100
* **Periods:** 360
* **Property Master:** 209 (NORMAL = 200)
* **Decision Logs:** 36,104
* **Transaction Count:** 104 (approx, observed in L100 logs)
* **Reconciliation / Traceability:** PASS

## 2. Entity Mapping Analysis

| Research Entity | Current Source | Existing Field | Mapping 가능 여부 | Gap |
| ---------------------- | -------------- | -------------- | ------------- | --- |
| R_SEASON | `PLAY_SEASON` | `season_id`, `scenario_id`, `rule_version` | O | G0 - Already Available |
| R_PARTICIPANT | `PLAY_PLAYER` | `player_id`, `status` | O | G0 - Already Available |
| R_PARTICIPANT_BASELINE | `PLAY_PLAYER_ASSET` (P0) | `initial_cash`, `property_count` | O | G1 - Derivable |
| R_EXPOSURE | - | - | X | G2 - New Logging Required |
| R_STATE_SNAPSHOT | `PLAY_DECISION_LOG` | `before_cash`, `after_cash`, `net_worth` | △ | G1 - Derivable (Basic) |
| R_DECISION | - | - | X | G2 - New Logging Required |
| R_ACTION | HTTP Request payload | - | X | G2 - New Logging Required |
| R_VALIDATION | HTTP Response (L100 Logs) | - | X | G2 - New Logging Required |
| R_TRANSACTION | `PLAY_PROPERTY_TRANSACTION` | `transaction_id`, `price`, `buyer_id` | O | G0 - Already Available |
| R_OUTCOME | `PLAY_DECISION_LOG` | `after_net_worth` | O | G1 - Derivable |
| R_TRAJECTORY | `PLAY_DECISION_LOG` (Series) | `simulation_period`, `cash` | O | G1 - Derivable |
| R_EXPERIMENT | - | - | X | G3 - Human Season Required |
| R_EXPERIMENT_EXPOSURE | - | - | X | G3 - Human Season Required |
| R_PROVENANCE | `PLAY_DECISION_LOG` | `scenario_id`, `trace_id` | △ | G1 - Derivable |
| R_SEASON_RESULT | Aggregated Query | - | O | G1 - Derivable |

## 3. Data Quality Issues & Findings
1. **Missing Failed Actions:** During L100, the test script logged thousands of `Insufficient cash` and `Insufficient supply` HTTP 400 errors. However, these are strictly runtime HTTP rejections and are **not** persisted in Firestore. Therefore, `R_VALIDATION` (Rejected Action) cannot be reconstructed from the current RAW data.
2. **Exposure Absence:** There is no mechanism to record what market state (e.g., price, GLI) the participant saw at the exact moment of their request.
3. **Decision Log Scope:** The current `PLAY_DECISION_LOG` effectively captures `MONTHLY_ECONOMIC_UPDATE` (trajectory of income/expense/net_worth) and successful transactions. It acts as an excellent `R_STATE_SNAPSHOT` but does not act as an `R_DECISION` (Intent).

## 4. Traceability Assessment
* **SUCCESS:** We can perfectly trace *successful* transactions to their exact idempotency keys, season period, and buyer/seller state change. 
* **FAIL:** We cannot trace *why* a user decided to act or *what* actions they attempted that failed.
