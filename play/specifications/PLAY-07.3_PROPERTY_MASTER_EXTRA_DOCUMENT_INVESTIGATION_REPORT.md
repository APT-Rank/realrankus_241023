# PLAY-07.3 PROPERTY MASTER EXTRA DOCUMENT INVESTIGATION REPORT

## 1. Investigation Status

- **READ-ONLY**: 완벽하게 읽기 전용으로 진행됨
- **NO MODIFICATION PERFORMED**: 데이터, 코드, 인프라 등 일체의 변경사항 없음
- **BLOCKED**: 조사를 완료하고 다음 단계에 대한 사용자 승인 대기 중

## 2. Property Master Count

| Item | Count |
|---|---:|
| PLAY-07.2 기준 | 209 |
| 현재 Firestore (`PLAY_PROPERTY_MASTER`) | 210 |
| Difference | +1 |

## 3. Extra Document

정확한 추가 문서는 다음과 같습니다.

| Field | Value |
|---|---|
| document_id | `PROP_FINAL_1` |
| property_id | `PROP_FINAL_1` |
| complex_id | *(undefined)* |
| complex_name | *(undefined)* |
| status | *(undefined)* |
| tradable | *(undefined)* |
| initial_price | 500000 |
| source_file | *(undefined)* |
| snapshot_version | *(undefined)* |
| created_at | *(undefined)* |
| updated_at | *(undefined)* |
| season_id | `S_FINAL_1790340397852` |

> **특이사항**: 정상적인 Property Master 데이터가 가지고 있어야 할 위치, 단지 정보, 생성 일자 등의 필드가 전혀 없으며, 테스트에 필요한 최소 필드만 임의로 주입된 상태입니다.

## 4. Baseline Comparison

- Baseline에 존재: **NO**
- Firestore에만 존재: **YES**
- 원본 CSV에 존재: **NO**

## 5. Creation Trace

| Evidence | Result |
|---|---|
| Firestore timestamp | `created_at` 필드 없음. 단, season_id `1790340397852`는 **2026-09-25T12:46:37.852Z**를 의미함. |
| Creating function | E2E 테스트 스크립트 실행 중 수동 주입 |
| Request ID | N/A |
| Season ID | `S_FINAL_1790340397852` |
| Batch ID | N/A |
| Test script | `verify_market_e2e_final.ts` (또는 동일한 상수를 사용한 이전 단계의 유사 검증 스크립트) |
| Seed/fixture | N/A |
| Manual creation | N/A |
| Other | N/A |

## 6. Root Cause Classification

**STALE TEST DATA** (테스트 잔여 데이터)

**근거:**
1. 문서 ID 및 `property_id`가 `PROP_FINAL_1`로, 이는 `verify_market_e2e_final.ts` 등 이전 Market 검증 스크립트 내에 하드코딩된 테스트용 식별자입니다.
2. `season_id` 값이 `S_FINAL_{timestamp}` 패턴을 정확히 따릅니다.
3. 실제 부동산 데이터라면 반드시 가져야 할 필수 속성(`complex_name`, `status`, `address` 등)이 전혀 존재하지 않습니다.
4. 테스트 종료 후 Cleanup 과정이 누락되었거나 실행되지 않아 프로덕션(Firebase) 환경에 그대로 잔존하게 된 쓰레기 데이터입니다.

## 7. Evidence

1. **Firestore Query Evidence**: 
   `dump_property_master.js` 스크립트를 통한 210개 전체 데이터 추출 시 209개는 정상 `NORMAL`/`INCOMPLETE` 상태를 가지나, 단 1개만 비정상적인 형태를 보임.
   ```json
   {
     "initial_price": 500000,
     "property_id": "PROP_FINAL_1",
     "season_id": "S_FINAL_1790340397852"
   }
   ```
2. **Code Evidence**:
   `d:\APT-Rank_Git\functions\verify_market_e2e_final.ts` 내 정의된 상수와 정확히 일치:
   - Line 56: `const seasonId = \`S_FINAL_${Date.now()}\`;`
   - Line 79: `const propId = 'PROP_FINAL_1';`

## 8. Impact

현재 `runReconciliation.ts`의 로직은 하드코딩된 209개라는 문서 수를 기반으로 검증을 수행합니다. 
Firestore에 이 1개의 Stale Test Data가 섞여 있어 쿼리 결과가 총 210개가 되며, 이 불일치로 인해 Reconciliation이 지속적으로 실패(Exception)를 반환하고 시스템 상태가 `TRANSACTION_PAUSED`/`PAUSED`로 전이되고 있습니다. 결과적으로 E2E 테스트에서 `advanceSeasonClock`이 호출되지 않아 Timeout이 발생하는 직접적 원인이 되었습니다.

## 9. Decision Required

- **Q1**: `PLAY_PROPERTY_MASTER` 컬렉션에서 `PROP_FINAL_1` 문서를 삭제(Cleanup)하여 209개 상태를 복구해도 되겠습니까?
- **Q2**: 삭제를 진행한 후, 즉시 PLAY-07.3 Phase 5~7의 E2E 테스트를 재실행해도 되겠습니까?

## 10. FINAL STATUS

**INVESTIGATION COMPLETE — DECISION REQUIRED**

---
*모든 코드 수정, 배포, 인프라 변경 및 E2E 테스트 실행은 승인 전까지 중단(STOP) 상태를 유지합니다.*
