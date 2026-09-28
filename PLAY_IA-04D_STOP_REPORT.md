# PLAY IA-04D STOP REPORT: POLICY CONFLICT

## 1. Issue Detected
**STOP Condition Triggered**: Primary fee calculation을 재사용할 수 없음 (Cannot reuse Primary fee calculation).

## 2. Relevant Code
**File**: `d:\APT-Rank_Git\functions\src\play\market\purchasePrimaryProperty.ts`
**Lines**: 110-120

```typescript
      // 6. Calculate Price & Fees (IA-03B.1 Rule)
      const price = supply.initial_price;
      let purchaseFeeRate = 0;

      if (price <= 600000000) {
        purchaseFeeRate = area <= 85 ? 0.011 : 0.013;
      } else if (price <= 900000000) {
        purchaseFeeRate = 0.022 + ((price - 600000000) / 300000000) * 0.002;
      } else {
        purchaseFeeRate = area <= 85 ? 0.033 : 0.035;
      }
```

## 3. Reason for Conflict
현재 Primary Transaction Cost 계산 로직이 공통 모듈이나 공유 함수로 분리되어 있지 않고, `purchasePrimaryProperty.ts` 내부 트랜잭션 흐름 안에 하드코딩되어 있습니다. Secondary Market에서 이 로직을 재사용(Reuse)하려면 해당 로직을 공통 함수로 분리하는 Refactoring이 필수적이나, `purchasePrimaryProperty.ts` 파일은 지시서의 **21. Protected Areas (IA-03C BUY semantics)** 에 속하므로 임의로 수정할 수 없습니다.

## 4. Minimum Modification Proposal (최소 수정안)
1. `functions/src/play/common/feeCalculator.ts` (신규 파일) 생성.
2. `purchasePrimaryProperty.ts`의 110~120라인 로직을 `calculateTransactionFee(price: number, area: number): number` 함수로 추출하여 `feeCalculator.ts`에 배치.
3. `purchasePrimaryProperty.ts` 및 신규 생성할 `executeSecondaryTransaction.ts`에서 해당 공통 함수를 Import하여 사용하도록 수정.

## 5. Final Verdict
**STATUS: BLOCKED — POLICY CONFLICT**
(Protected Area 수정 승인이 필요하므로 백엔드 구현 및 에뮬레이터 검증을 중단합니다.)
