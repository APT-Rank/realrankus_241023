# PLAY VISUAL QA — AG IMPLEMENTATION PROMPT

이번 작업은 새로운 IA 기능 구현이 아니다. 실제 브라우저의 PLAY UI를 실행하고 승인된 Visual Prototype 및 UX Principles와 비교하는 Visual QA 단계다.

반드시 먼저 읽는다:
1. `PLAY_VISUAL_QA_PHASE_01_SPEC_v1.0.md`
2. `PLAY_INDEPENDENT_SERVICE_ARCHITECTURE_SPEC_v1.0.md`
3. `PLAY-INDEPENDENT-SERVICE_IMPLEMENTATION_REPORT.md`
4. `PLAY-IA-02_IMPLEMENTATION_REPORT.md`
5. `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
6. `PLAY_HUMAN_UX_PRINCIPLES_v1.0.md`가 존재하면 읽는다.
7. 기존 PLAY Visual Prototype 자료가 있으면 확인한다.

## 1. 먼저 실제 브라우저 실행

`/play/index.html`을 실제 브라우저에서 실행한다.

코드를 설명하는 것으로 Visual QA를 대신하지 않는다.

## 2. 필수 Screenshot

Desktop:
- WORLD
- REGION
- COMPLEX
- LISTING
- LISTING DETAIL

Mobile:
- WORLD
- COMPLEX
- LISTING
- LISTING DETAIL

## 3. Functional Flow

```text
세계 → 지역 → 아파트 단지 → 매물 → 매물 상세
```

Back:
```text
매물 상세 → 매물 → 아파트 단지 → 지역 → 세계
```

## 4. Visual 기준

Desktop:
```text
MAP ≈ 60%
PANEL ≈ 40%
```

Mobile:
```text
MAP = TOP
PANEL = BOTTOM
```

지도는 Living World, 패널은 Contextual Command Center로 보여야 한다.

## 5. V1~V10 평가

각 화면에 대해:
```text
V1 Layout
V2 Hierarchy
V3 Density
V4 Map
V5 Command
V6 Discovery
V7 Action
V8 Game Feel
V9 Consistency
V10 Mobile
```

를 평가한다.

특히:
> 일반 부동산 Dashboard인가, PLAY Game Command Center인가?

를 반드시 답한다.

## 6. Prototype 비교

가능하면 Reference와 Actual을 나란히 비교하고:
```text
Reference:
Actual:
Gap:
Severity:
Recommendation:
```
을 기록한다.

Severity:
P0 / P1 / P2 / P3

## 7. 실제 데이터

```text
209 total
200 NORMAL
9 INCOMPLETE
```
를 확인한다.

최소 3개의 실제 수지구 Complex/Listing을 확인한다. Mock 데이터가 나오면 FAIL.

## 8. 한글 UI

사용자에게 WORLD/REGION/COMPLEX/LISTING/LISTING DETAIL 등의 영문이 다시 보이면 FAIL한다.

## 9. 수정

문제가 있으면 PLAY 전용:
```text
/play/index.html
/play/css/
/play/js/
/play/assets/
```
만 수정한다.

기존 RealRankers, Economic Engine, Property Market Engine, Transaction Engine, Security Rules, Research Logging durability는 수정하지 않는다.

## 10. 수정 후 Regression

반드시 다시 확인:
```text
IA-01 WORLD → REGION → COMPLEX
IA-02 COMPLEX → LISTING → LISTING DETAIL
209 / 200 / 9
기존 RealRankers Smoke Test
```

## 11. 절대 하지 말 것

- IA-03 구현
- BUY/SELL transaction 구현
- Backend Engine 신규 구현
- Research Logging infrastructure 변경
- 기존 RealRankers 리팩터링
- Mock Property 추가

## 12. 종료 보고서

다음 형식:
```text
# PLAY-VISUAL-QA-REPORT
## 1. Browser Environment
## 2. Screenshots
## 3. WORLD Visual QA
## 4. REGION Visual QA
## 5. COMPLEX Visual QA
## 6. LISTING Visual QA
## 7. LISTING DETAIL Visual QA
## 8. MOBILE Visual QA
## 9. V1-V10 Evaluation
## 10. Dashboard Risk
## 11. Prototype vs Actual GAP
## 12. Fixes Applied
## 13. Before / After Evidence
## 14. Property Data Verification
## 15. Korean UI Verification
## 16. IA Regression
## 17. Existing RealRankers Smoke Test
## 18. Raw Screenshot Evidence
## 19. Remaining Issues
## 20. Final Verdict
```

Final Verdict:
```text
VISUAL READY
VISUAL READY AFTER FIXES
STOP — PRODUCT OWNER REVIEW REQUIRED
```

실제 Screenshot Evidence 없이 VISUAL READY로 판정하지 않는다.

Visual QA가 끝나면 STOP하고 IA-03은 별도 승인 후 시작한다.
