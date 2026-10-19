# PLAY_VISUAL_QA_PHASE_01_SPEC_v1.0

**Status:** IMPLEMENTATION / QA READY  
**Phase:** Human Product / UX — Visual QA Gate  
**Previous Phase:** PLAY Independent Service Structure  
**Completed UX:** IA-01 WORLD → REGION → COMPLEX, IA-02 COMPLEX → LISTING → LISTING DETAIL  
**Next Product Phase:** IA-03 LISTING → DECISION → ACTION

## 1. 목적

현재 실제 `/play/index.html`의 브라우저 화면이 승인된 PLAY Visual Prototype, IA, UX Principles와 실제 사용 경험 측면에서 일치하는지 검증한다.

기능이 정상이어도 Visual QA를 통과하지 못하면 IA-03으로 진행하지 않는다.

## 2. 검증 범위

```text
WORLD → REGION → COMPLEX → LISTING → LISTING DETAIL
```

BUY/SELL 실행, IA-03, IA-04는 이번 단계에서 구현하지 않는다.

## 3. Visual Reference

기준 우선순위:
1. PLAY UX Principles
2. Fixed IA
3. 승인된 PLAY Visual Prototype

핵심 시각 방향:
- 지도 중심의 Living World
- 우측 Command Center / Command Panel
- 탐험하는 느낌
- 선택 대상에 따라 패널 변화
- 단순 Dashboard가 아닌 게임형 정보 구조
- 다음 탐색/선택이 자연스럽게 보이는 화면

Desktop:
```text
MAP ≈ 60% | COMMAND PANEL ≈ 40%
```

Mobile:
```text
MAP = TOP
COMMAND PANEL = BOTTOM
```

## 4. 필수 캡처

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

## 5. Visual QA 기준

| ID | 기준 | 확인 내용 |
|---|---|---|
| V1 | Layout | Prototype 공간 구조와 일치하는가 |
| V2 | Hierarchy | 무엇을 먼저 봐야 하는지 명확한가 |
| V3 | Density | 과밀하거나 지나치게 비어 있지 않은가 |
| V4 | Map | 지도가 Living World처럼 보이는가 |
| V5 | Command | 패널이 Command Center 역할을 하는가 |
| V6 | Discovery | 다음 탐색 이유가 보이는가 |
| V7 | Action | 현재 가능한 다음 행동이 명확한가 |
| V8 | Game Feel | 일반 부동산 Dashboard와 구별되는가 |
| V9 | Consistency | 화면 간 Visual Language가 일관적인가 |
| V10 | Mobile | 모바일에서도 경험 구조가 유지되는가 |

## 6. Dashboard Risk

다음 현상이 있으면 기록한다.
- 정보 카드 과다
- 숫자/지표가 화면을 지배
- 지도가 단순 배경
- 다음 행동이 안 보임
- 모든 정보가 동일한 강조 수준
- 일반 부동산 서비스와 동일한 매물 카드
- 살아 있는 경제 세계의 느낌 부족

핵심 질문:

> 현재 화면이 일반 부동산 Dashboard인가, PLAY의 Game Command Center인가?

## 7. GAP 평가

각 화면에 대해 기록:

```text
Reference
Actual
Gap
Severity
Recommendation
```

Severity:
- P0: 제품 경험을 훼손하는 핵심 문제
- P1: 주요 Visual/UX 문제
- P2: 개선 권장
- P3: 미세 조정

## 8. 실제 데이터

다음 기준 유지:
```text
209 total
200 NORMAL
9 INCOMPLETE
```

최소 3개 이상의 실제 수지구 Complex/Listing을 확인한다. Mock Apartment가 나오면 FAIL.

## 9. 한글 UI

사용자 노출 영문이 다시 나타나면 FAIL.

내부 State/Function 이름은 평가 대상이 아니다.

## 10. Responsive QA

Desktop:
```text
MAP ≈ 60%
COMMAND PANEL ≈ 40%
```

Mobile:
```text
MAP TOP
COMMAND PANEL BOTTOM
```

단순히 깨지지 않는 것뿐 아니라 hierarchy와 game feel도 확인한다.

## 11. 수정 범위

허용:
```text
/play/index.html
/play/css/
/play/js/
/play/assets/
```

수정 금지:
```text
app_main_lang.js
기존 RealRankers CSS/JS
Economic Engine
Property Market Engine
Transaction Engine
Security Rules
Research Logging durability
```

## 12. Regression

Visual 수정 후 반드시:
```text
IA-01: WORLD → REGION → COMPLEX
IA-02: COMPLEX → LISTING → LISTING DETAIL
Property: 209 / 200 / 9
Existing RealRankers Smoke Test
```
를 재확인한다.

## 13. Completion Criteria

- [ ] 모든 필수 화면 Screenshot Evidence
- [ ] V1~V10 평가
- [ ] Dashboard Risk 평가
- [ ] Prototype 대비 GAP 분석
- [ ] 실제 수지구 데이터 확인
- [ ] 한글 UI 확인
- [ ] Desktop 확인
- [ ] Mobile 확인
- [ ] IA-01/02 Regression
- [ ] 기존 RealRankers Smoke Test
- [ ] Raw Evidence 확보

## 14. Final Verdict

```text
VISUAL READY
VISUAL READY AFTER FIXES
STOP — PRODUCT OWNER REVIEW REQUIRED
```

실제 브라우저 Screenshot Evidence 없이 VISUAL READY로 판정하지 않는다.

## 15. 다음 단계

Visual QA 승인 후에만:

```text
IA-03
LISTING → DECISION → ACTION
```

으로 진행한다.
