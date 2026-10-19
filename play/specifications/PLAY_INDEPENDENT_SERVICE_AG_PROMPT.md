# PLAY INDEPENDENT SERVICE — AG IMPLEMENTATION PROMPT

이번 작업은 IA-03이 아니다.

IA-02까지 완료된 PLAY를 **기존 RealRankers에 영향을 주지 않는 독립 서비스 구조로 정리하는 작업**이다.

반드시 먼저 다음 문서를 읽는다.

1. `PLAY_INDEPENDENT_SERVICE_ARCHITECTURE_SPEC_v1.0.md`
2. `PLAY-IA-02_IMPLEMENTATION_REPORT.md`
3. `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
4. 기존 PLAY Architecture / Reliability / Research Logging 관련 문서
5. 현재 Firebase Hosting / Functions 구조

---

## 1. 최우선 원칙

기존 RealRankers를 절대 깨뜨리지 않는다.

이번 작업의 핵심은:

> 기존 서비스에 PLAY를 계속 붙이는 것이 아니라, PLAY를 독립적인 서비스 영역으로 분리하고 마지막에 진입 링크만 연결하는 것.

---

## 2. 목표 구조

최종 목표:

```text
/play/
├─ index.html
├─ css/
├─ js/
├─ functions/
└─ assets/
```

단, 현재 프로젝트 구조를 먼저 조사한다.

파일을 무조건 이동하지 않는다.

---

## 3. 먼저 조사할 것

코드를 수정하기 전에 다음을 보고한다.

### A. 현재 PLAY 파일

```text
play.html
play_app.js
관련 CSS
관련 JS
관련 assets
관련 functions
```

### B. 의존성

각 PLAY 파일이:

```text
기존 RealRankers CSS
기존 JS
app_main_lang.js
Firebase
Naver Map
Chart.js
Bootstrap
jQuery
기타 공통 파일
```

중 무엇에 의존하는지 확인한다.

### C. Firebase

현재 PLAY Functions가 어디에 존재하는지 확인한다.

```text
Function name
파일 위치
import dependency
호출 관계
deployment 구조
```

### D. Hosting

현재 `/play/` 경로가 가능한지 확인한다.

---

## 4. 조사 결과를 먼저 보고

구조 조사 후 바로 대규모 변경하지 않는다.

다음 형식으로 먼저 출력한다.

```text
# PLAY INDEPENDENT STRUCTURE AUDIT

## Current PLAY Files

## Current Dependencies

## Existing RealRankers Dependencies

## Firebase Functions

## Hosting / Routing

## Migration Risk

## Proposed Safe Structure

## Files That Must NOT Be Modified

## Conflicts

## Recommendation
```

명백한 충돌이 없으면 구현을 계속한다.

---

## 5. 구현

안전한 경우 다음 구조를 만든다.

```text
/play/
├─ index.html
├─ css/
├─ js/
├─ functions/
└─ assets/
```

현재 IA-01/IA-02의 동작을 유지한다.

필요하면 기존 `play.html`에서 `/play/index.html`로 안전하게 옮기거나 복제한다.

**기존 파일을 먼저 삭제하지 않는다.**

---

## 6. CSS

PLAY CSS는 `/play/css/` 아래로 분리한다.

가능하면 namespace:

```text
.play-app
.play-map
.play-command-panel
.play-listing
.play-listing-card
.play-mobile-panel
```

을 사용한다.

기존 global CSS를 수정하여 PLAY를 맞추지 않는다.

---

## 7. JavaScript

PLAY JS는 `/play/js/`를 기준으로 한다.

가능한 구조:

```text
play_app.js
play_state.js
play_world.js
play_region.js
play_complex.js
play_listing.js
play_ui.js
play_data.js
```

현재 코드가 하나의 파일에 묶여 있다면 안전하게 분리할 수 있는 범위만 분리한다.

**대규모 리팩터링은 하지 않는다.**

특히:

```text
app_main_lang.js
```

에는 PLAY 기능을 추가하지 않는다.

---

## 8. Functions

PLAY Functions는 독립 경계를 갖도록 조사하고 구조를 정리한다.

하지만 현재 검증된 Function을 단순히 이동/이름 변경/삭제하여 기존 배포를 깨뜨리지 않는다.

Function 이동이 위험하면:

```text
STOP
→ 문제 보고
→ 승인 대기
```

한다.

---

## 9. Property Data

IA-02에서 검증된 수지구 Property Master를 그대로 유지한다.

Expected:

```text
Total = 209
NORMAL = 200
INCOMPLETE = 9
```

임의 데이터를 다시 사용하지 않는다.

---

## 10. IA-02 Regression

독립화 후 반드시 확인한다.

```text
세계
 ↓
지역
 ↓
아파트 단지
 ↓
매물
 ↓
매물 상세
```

Back:

```text
매물 상세
 ↓
매물
 ↓
아파트 단지
 ↓
지역
 ↓
세계
```

---

## 11. 한글 UI

IA-02에서 완료한 한글 UI를 유지한다.

사용자 화면에:

```text
WORLD
REGION
COMPLEX
LISTING
LISTING DETAIL
BACK TO REGION
```

등이 다시 나타나면 실패다.

---

## 12. Research Logging

다음 Hook이 유지되는지 확인한다.

```text
Complex Selected
Listing Selected
```

Research Logging infrastructure 자체는 수정하지 않는다.

---

## 13. Regression Test

반드시 수행:

```text
TEST-ISO-01 /play/ direct access
TEST-ISO-02 existing RealRankers access
TEST-ISO-03 CSS isolation
TEST-ISO-04 JS isolation
TEST-ISO-05 IA-01 regression
TEST-ISO-06 IA-02 regression
TEST-ISO-07 property data 209/200/9
TEST-ISO-08 research hook
TEST-ISO-09 desktop layout
TEST-ISO-10 mobile layout
TEST-ISO-11 existing service smoke test
TEST-ISO-12 final entry link
```

가능한 한 Browser Evidence / Console Evidence를 남긴다.

---

## 14. 기존 서비스 보호

다음은 수정 금지:

```text
app_main_lang.js
기존 RealRankers CSS
기존 RealRankers JS
기존 Firebase Rules
Economic Engine
Property Market Engine
Transaction Engine
Season Clock
Batch / Aggregator
Reconciliation
Research Logging durability
```

---

## 15. STOP 조건

다음 중 하나면 즉시 STOP한다.

```text
기존 서비스 UI 깨짐
기존 JS 오류
기존 CSS 영향
Firebase Function 영향
Security Rules 수정 필요
Economic Engine 수정 필요
Research Logging 수정 필요
IA-01 Regression FAIL
IA-02 Regression FAIL
파일 의존성 불명확
```

Workaround로 PASS 처리하지 않는다.

---

## 16. 최종 링크

독립 서비스가 검증된 후에만 기존 RealRankers에:

```text
PLAY 시작
```

진입 링크를 연결한다.

기존 RealRankers의 다른 기능/화면/URL은 변경하지 않는다.

---

## 17. 종료 보고서

다음 형식으로 작성한다.

```text
# PLAY-INDEPENDENT-SERVICE IMPLEMENTATION REPORT

## 1. Current Structure Audit

## 2. New PLAY Structure

## 3. HTML Isolation

## 4. CSS Isolation

## 5. JS Isolation

## 6. Functions Boundary

## 7. Firebase / Hosting

## 8. Property Data Verification

## 9. IA-01 Regression

## 10. IA-02 Regression

## 11. Korean UI Regression

## 12. Research Logging Hook Regression

## 13. Existing RealRankers Smoke Test

## 14. Entry Link

## 15. Files Modified

## 16. Files Protected

## 17. Raw Evidence

## 18. Issues

## 19. Final Verdict
```

Final Verdict:

```text
READY
READY AFTER FIXES
STOP — HUMAN REVIEW REQUIRED
```

중 실제 검증 결과에 따라 선택한다.

---

## 18. 절대 하지 말 것

- IA-03 구현
- BUY/SELL transaction 구현
- Economic Engine 변경
- Property Market Engine 변경
- Research Logging infrastructure 변경
- 기존 RealRankers 대규모 리팩터링
- 기존 Production Function 삭제
- Security Rules 임의 변경
- 임의 Mock Property 추가

---

## 19. 마지막 지시

이번 작업의 성공 기준은 새로운 기능을 많이 만드는 것이 아니다.

> **PLAY가 기존 RealRankers와 서로 영향을 주지 않는 독립적인 제품 영역이 되었는가?**

이다.

독립화가 검증되면 작업을 종료하고 STOP한다.

**IA-03은 별도의 승인 이후 시작한다.**
