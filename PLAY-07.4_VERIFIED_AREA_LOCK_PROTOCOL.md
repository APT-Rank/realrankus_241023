# PLAY-07.4 VERIFIED AREA LOCK PROTOCOL

## 1. 개요
APT-Rank 플레이 엔진의 07단계(GATE 1~6 및 07.4 Readiness Test)를 통해 검증이 완료된 영역을 향후 변경 및 훼손으로부터 영구적으로 보호하기 위한 동결 규약(Freeze Protocol)을 정의한다.

## 2. 동결 대상 (Verified Scope Lock)
현재 100% 테스트를 통과하고 운영 준비가 완료되어 동결되는 핵심 모듈은 다음과 같다.

1. **Economic Engine** (`functions/src/play/batch/economicEngine.ts`)
2. **Reconciliation & Transaction** (`functions/src/play/batch/processBatchChunk.ts`)
3. **Idempotency Control** (멱등성 보장 로직 일체)
4. **Primary Market (구매 로직)** (`functions/src/play/market/purchasePrimaryProperty.ts`)

## 3. 향후 개발 제약 사항 (Lock Restrictions)

본 영역은 향후 어떠한 신규 기능 추가(Feature Expansion)나 구조 변경(Refactoring) 작업에서도 **절대 임의로 수정할 수 없다.** 

### 3.1. 무단 수정 시 조치
- 만약 향후 다른 작업(ex: Secondary Market 고도화, UI 연동 등) 도중 이 동결된 파일들의 수정이 불가피해 보일 경우, **절대로 즉시 수정해서는 안 된다.**
- 무단 수정 시 해당 코드는 즉각 반려(Revert)되며, 관련 개발 작업은 전면 중지(Hard Stop)된다.

### 3.2. 정당한 수정(Change Control) 프로세스
검증된 영역을 부득이하게 수정해야 할 경우 다음의 절차를 따라야만 한다.

1. **Human Review Request**: 시스템 변경의 필요성과 위험성을 담은 상세 분석 보고서를 작성하여 인간 관리자에게 제출한다.
2. **Golden Scenario Regression**: 수정 후, `PLAY-07.4_GOLDEN_SCENARIO_SPEC.md`에 정의된 시나리오가 100% 통과함을 재입증해야 한다.
3. **Reconciliation 재검증**: 수정 후에도 자산 추적 및 멱등성이 파괴되지 않음을 별도 증명해야 한다.

## 4. 최종 결의
이 프로토콜은 07.4 테스트 종료 시점부터 APT-Rank 백엔드 시스템 개발 전반에 즉각적으로 적용되며, 예외 없이 강제된다.
