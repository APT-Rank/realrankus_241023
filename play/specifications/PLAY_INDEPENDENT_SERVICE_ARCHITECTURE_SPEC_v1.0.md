# PLAY_INDEPENDENT_SERVICE_ARCHITECTURE_SPEC_v1.0

**Status:** IMPLEMENTATION READY  
**Phase:** Human Product / UX — Pre-IA-03 Infrastructure Boundary  
**Previous Phase:** IA-02 COMPLEX → LISTING → LISTING DETAIL  
**Next Phase:** IA-03 LISTING → DECISION → ACTION  
**Purpose:** PLAY 독립 서비스 구조 확립 및 기존 RealRankers 영향 차단

---

## 1. 목적

IA-02까지 PLAY UX가 실제 수지구 Property Master 데이터를 사용하여:

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
```

까지 구현되었다.

IA-03부터는 사용자의 실제 의사결정과 Action으로 진입하므로, 그 전에 PLAY를 기존 RealRankers 서비스와 **코드/스타일/기능 단위에서 독립된 서비스 영역**으로 정리한다.

핵심 원칙:

> 기존 RealRankers를 PLAY에 맞춰 리팩터링하지 않는다.  
> PLAY를 기존 서비스 내부에 계속 확장하지 않는다.  
> PLAY를 독립적인 서비스 영역으로 구성하고, 마지막에 기존 RealRankers에서 PLAY로 진입하는 링크만 연결한다.

---

# 2. 목표 구조

최종적으로 다음 구조를 목표로 한다.

```text
RealRankers/
│
├─ 기존 RealRankers 서비스 영역
│   ├─ index.html
│   ├─ app_main_lang.js
│   ├─ 기존 css/
│   ├─ 기존 js/
│   └─ 기존 기능
│
└─ play/
    ├─ index.html
    │
    ├─ css/
    │   ├─ play-core.css
    │   ├─ play-world.css
    │   ├─ play-command.css
    │   ├─ play-listing.css
    │   └─ play-mobile.css
    │
    ├─ js/
    │   ├─ play_app.js
    │   ├─ play_state.js
    │   ├─ play_world.js
    │   ├─ play_region.js
    │   ├─ play_complex.js
    │   ├─ play_listing.js
    │   ├─ play_ui.js
    │   └─ play_data.js
    │
    ├─ functions/
    │   └─ PLAY 전용 서버 함수 영역
    │
    └─ assets/
        ├─ images/
        ├─ icons/
        └─ 기타 PLAY 전용 리소스
```

단, **실제 파일 이동/재배치 전에 현재 프로젝트의 구조와 의존성을 먼저 조사한다.**

위 구조를 문자 그대로 강제하여 기존 파일을 위험하게 이동하지 않는다.

---

# 3. 절대 보호 영역

다음 기존 영역은 이번 단계에서 임의로 수정하지 않는다.

```text
app_main_lang.js
기존 RealRankers CSS
기존 RealRankers JS
기존 RealRankers 화면
기존 RealRankers Firebase Logic
기존 Security Rules
PLAY Economic Engine
PLAY Property Market Engine
PLAY Transaction Engine
PLAY Season Clock
PLAY Batch / Aggregator
PLAY Reconciliation
PLAY Research Logging durability
```

특히:

> PLAY 독립화를 이유로 기존 RealRankers 파일을 대규모 리팩터링하지 않는다.

---

# 4. 독립화 범위

## 4.1 HTML

PLAY의 진입 HTML은:

```text
/play/index.html
```

을 기준으로 한다.

현재 `play.html`이 존재한다면 무조건 즉시 삭제하지 않는다.

먼저:

```text
현재 play.html
        ↓
의존성 조사
        ↓
/play/index.html
        ↓
동작 검증
        ↓
기존 파일 정리 여부 결정
```

순으로 진행한다.

---

# 5. CSS 독립화

PLAY 전용 CSS는:

```text
/play/css/
```

로 분리한다.

PLAY의 스타일은 가능하면 PLAY 전용 class namespace를 사용한다.

예:

```text
.play-app
.play-map
.play-command-panel
.play-listing
.play-listing-card
.play-mobile-panel
```

기존 RealRankers의 전역 CSS class와 충돌하지 않도록 한다.

### 금지

기존 global CSS를 PLAY 때문에 수정하여 다른 화면의 스타일을 변경하지 않는다.

---

# 6. JavaScript 독립화

PLAY 전용 JS는:

```text
/play/js/
```

를 기준으로 한다.

IA-01/IA-02에서 사용한 기능을 가능한 범위에서 PLAY 영역으로 이동/정리한다.

권장 구조:

```text
play_app.js
    ↓
play_state.js
    ↓
play_world.js
play_region.js
play_complex.js
play_listing.js
play_ui.js
play_data.js
```

단, 현재 실제 코드의 의존성을 먼저 분석한다.

### 중요

기존:

```text
app_main_lang.js
```

에 PLAY 기능을 추가하지 않는다.

PLAY 독립화 과정에서 기존 `app_main_lang.js`를 수정해야만 가능한 경우:

> 즉시 STOP → 충돌 내용을 보고 → 승인 전 수정하지 않는다.

---

# 7. 데이터 접근 경계

PLAY가 사용하는 데이터는 다음 원칙을 유지한다.

```text
RealRankers / Property Master
          │
          │ 필요한 데이터의 Read
          ▼
        PLAY
```

IA-02에서 이미 검증된 수지구 Property Master:

```text
209 Properties
200 NORMAL
9 INCOMPLETE
```

를 계속 사용한다.

이번 독립화 과정에서 Property Data의 의미나 규칙을 변경하지 않는다.

---

# 8. Firebase / Functions 독립화

PLAY 전용 서버 기능은 장기적으로:

```text
/play/functions/
```

영역에서 관리할 수 있도록 경계를 만든다.

그러나 이번 단계에서는 **기존 검증된 Cloud Functions를 무조건 이동하거나 재배포하지 않는다.**

먼저:

1. 현재 PLAY Functions 목록 확인
2. 파일 위치 확인
3. import/dependency 확인
4. 기존 RealRankers Functions와 관계 확인
5. Firebase deployment 구조 확인
6. 실제 이동 가능 여부 판단

을 수행한다.

### 금지

- 검증된 Function을 단순 이동하여 배포 실패 유발
- Function 이름 변경으로 기존 호출 깨뜨리기
- Security Rules 임의 변경
- 기존 Production Function 삭제
- Backend Engine 수정

---

# 9. 기존 RealRankers와 PLAY의 연결

최종 연결은 단순해야 한다.

```text
RealRankers
     │
     │ PLAY 시작
     ▼
/play/
```

기존 RealRankers에서 PLAY로 이동하는 진입점만 별도로 만든다.

예:

```text
[PLAY 시작]
```

하지만 이번 단계에서는 **링크 연결 자체보다 독립 구조 검증을 우선한다.**

링크 연결은 마지막 단계에서 수행한다.

---

# 10. URL / Routing

가능한 경우 목표 URL:

```text
/play/
```

또는 Firebase Hosting 구조에 맞는 동등한 PLAY 경로를 사용한다.

현재 Hosting 설정을 먼저 확인한다.

기존 RealRankers URL을 변경하지 않는다.

---

# 11. 기존 IA-01 / IA-02 기능 보존

독립화 이후 다음 흐름이 동일하게 작동해야 한다.

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

그리고:

```text
매물
 ↓
아파트 단지
 ↓
지역
 ↓
세계
```

Back Navigation도 유지한다.

---

# 12. Desktop / Mobile 보존

Desktop:

```text
MAP ≈ 60%
COMMAND PANEL ≈ 40%
```

Mobile:

```text
TOP    = MAP
BOTTOM = COMMAND PANEL
```

독립화 과정에서 UX가 변하면 안 된다.

---

# 13. 한글 UI 보존

IA-02에서 완료한 한글 UI를 유지한다.

사용자 화면에 영문 UI가 다시 나타나면 안 된다.

내부 State / Function / Variable 이름은 기존 구조를 유지할 수 있다.

---

# 14. Research Logging 보호

기존 Research Logging Infrastructure는 수정하지 않는다.

IA-02에서 확보한:

```text
Complex Selected
Listing Selected
```

Hook이 독립화 이후에도 유지되는지 확인한다.

Research Event 저장 구조를 변경하지 않는다.

---

# 15. 검증 계획

## TEST-ISO-01
PLAY URL 직접 접근

Expected:

```text
/play/
```

에서 PLAY 진입 가능.

## TEST-ISO-02
기존 RealRankers 접근

Expected:

> 기존 서비스 정상 작동.

## TEST-ISO-03
PLAY CSS Isolation

PLAY CSS 변경이 기존 RealRankers 화면에 영향을 주지 않음.

## TEST-ISO-04
PLAY JS Isolation

PLAY JS 로딩/실행이 기존 RealRankers JS에 영향을 주지 않음.

## TEST-ISO-05
IA-01 Regression

```text
세계 → 지역 → 아파트 단지
```

정상.

## TEST-ISO-06
IA-02 Regression

```text
아파트 단지 → 매물 → 매물 상세
```

정상.

## TEST-ISO-07
Property Data Regression

```text
209
200 NORMAL
9 INCOMPLETE
```

유지.

## TEST-ISO-08
Research Hook Regression

Complex / Listing 선택 Hook 유지.

## TEST-ISO-09
Desktop Regression

MAP / COMMAND PANEL 구조 유지.

## TEST-ISO-10
Mobile Regression

MAP TOP / PANEL BOTTOM 유지.

## TEST-ISO-11
Existing Service Regression

기존 RealRankers 핵심 화면 최소 Smoke Test.

## TEST-ISO-12
Entry Link

최종적으로 RealRankers에서 PLAY로 이동 가능.

---

# 16. 파일 이동 원칙

파일을 이동할 때 다음 순서를 따른다.

```text
1. 현재 구조 조사
2. 의존성 조사
3. 복사 또는 새 구조 생성
4. PLAY 동작 확인
5. 기존 서비스 Regression
6. 필요 시 기존 PLAY 파일 정리
7. 최종 링크 연결
```

기존 파일을 먼저 삭제하지 않는다.

---

# 17. STOP 조건

다음 중 하나라도 발생하면 즉시 STOP한다.

- 기존 RealRankers 화면이 깨짐
- 기존 CSS에 영향을 줌
- 기존 JS에 영향을 줌
- 기존 Firebase Function에 영향
- Security Rules 변경 필요
- 기존 PLAY Engine 변경 필요
- Research Logging 변경 필요
- Firebase Hosting 구조 변경으로 기존 서비스 위험
- 현재 파일 이동으로 의존성이 불명확해짐
- IA-01/IA-02 Regression 실패

이 경우 임의 Workaround로 진행하지 않는다.

---

# 18. Completion Criteria

다음 항목을 모두 확인해야 한다.

- [ ] `/play/` 독립 진입 구조
- [ ] PLAY HTML 독립
- [ ] PLAY CSS 독립
- [ ] PLAY JS 독립
- [ ] PLAY 전용 assets 경계
- [ ] PLAY Functions 경계 계획/확인
- [ ] 기존 RealRankers 파일 보호
- [ ] 기존 RealRankers 정상 작동
- [ ] IA-01 Regression PASS
- [ ] IA-02 Regression PASS
- [ ] 수지구 209 / 200 / 9 유지
- [ ] 한글 UI 유지
- [ ] Research Logging Hook 유지
- [ ] Desktop 유지
- [ ] Mobile 유지
- [ ] 최종 진입 링크 연결
- [ ] Raw Evidence 확보

---

# 19. 다음 단계

이번 단계가 완료되면:

```text
PLAY 독립 서비스
       ↓
IA-03
LISTING
   ↓
DECISION
   ↓
ACTION
```

으로 진행한다.

IA-03은 사용자가 실제 매물을 보고:

```text
탐색
→ 비교
→ 관심
→ 구매 검토
→ 보류
→ 결정
```

하는 의사결정 UX를 구현하는 단계다.

이번 단계에서는 IA-03을 구현하지 않는다.

---

# 20. 최종 원칙

> **PLAY를 기존 RealRankers에 더하는 것이 아니라, PLAY라는 별도의 제품을 만들고 RealRankers는 그 제품으로 들어가는 입구가 된다.**

기존 서비스의 안정성을 희생해서 PLAY를 독립화하지 않는다.

**안전한 분리 > 빠른 이동 > 구조적 완성**

순서로 진행한다.
