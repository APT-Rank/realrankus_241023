# PLAY GLOBAL SHELL & FIRST SCREEN WIREFRAME IMPLEMENTATION SPEC v1.0

## 1. 문서 상태

-   Status: EXECUTION SPEC
-   Phase: Human Product / Functional Build
-   Stage: Global Shell & First Screen Layout
-   Visual Mode: BLACK / WHITE / GRAYSCALE WIREFRAME
-   Priority: Function & Interaction \> Visual Polish
-   Product: PLAY Independent Service

본 문서는 PLAY Human Product의 첫 화면 전체 레이아웃과 Global
Navigation을 구현하기 위한 실행 기준이다.

현재 단계에서는 최종 비주얼을 구현하지 않는다. 업로드된 참고 이미지는
최종 화면의 정보 구조와 레이아웃 방향을 참고하기 위한 것이며,
pixel-perfect 재현 대상이 아니다.

------------------------------------------------------------------------

## 2. 이번 단계의 목적

PLAY의 모든 화면에서 공통으로 사용할 Global Shell을 먼저 구축한다.

핵심 목표:

1.  PLAY 브랜드 영역
2.  Global Navigation
3.  Utility Navigation
4.  Season Context
5.  First Screen / WORLD 영역
6.  Desktop / Mobile Responsive Shell
7.  기존 IA-01 / IA-02와의 연결
8.  이후 IA-03\~05 기능을 확장할 수 있는 구조

이번 단계의 목표는 "예쁜 화면"이 아니라 "전체 서비스의 골격이 실제로
작동하는 것"이다.

------------------------------------------------------------------------

## 3. 참고 화면의 구조

참고 이미지에서 가져올 것은 다음의 구조적 요소다.

### Header

왼쪽: - PLAY Brand - REAL ECONOMY SIMULATION

중앙: - 홈 - 지도보기 - 지역탐색 - 내 자산 - 다른 참가자 - 시즌랭킹 -
가이드

오른쪽: - 검색 - 알림 - 설정 - 플레이어 정보 - 시즌 버튼

### Main

Desktop: - 왼쪽 약 60%: World / Map - 오른쪽 약 40%: Contextual Command
Panel

Mobile: - 상단: World / Map - 하단: Contextual Command Panel

이 기본 구조는 기존 IA v1.0의 Web/Mobile Layout 원칙을 유지한다.

------------------------------------------------------------------------

## 4. Wireframe 원칙

### 4.1 현재 사용

-   흰색
-   검정
-   회색
-   회색 border
-   단순한 텍스트
-   기본 아이콘 또는 placeholder icon
-   단순 버튼
-   단순 카드

### 4.2 현재 사용 금지

-   최종 브랜드 색상
-   고급 그래픽
-   3D 지도 디자인
-   이미지 중심 카드
-   복잡한 animation
-   최종 typography system
-   gradient
-   visual effects
-   pixel-perfect prototype matching

### 4.3 핵심 원칙

UI가 단순하더라도 사용자는 다음을 명확하게 이해할 수 있어야 한다.

-   현재 어디에 있는가
-   현재 무엇을 볼 수 있는가
-   무엇을 클릭할 수 있는가
-   클릭하면 어디로 이동하는가
-   아직 구현되지 않은 기능은 무엇인가

------------------------------------------------------------------------

## 5. Global Navigation

### 5.1 Primary Navigation

  Menu          IA               Current Status
  ------------- ---------------- ----------------
  홈            WORLD            연결
  지도보기      WORLD            연결
  지역탐색      REGION           연결
  내 자산       MY WORLD         Placeholder
  다른 참가자   PEOPLE           Placeholder
  시즌랭킹      SEASON           Placeholder
  가이드        SYSTEM / GUIDE   Placeholder

### 5.2 Utility Navigation

  Item            IA / Purpose               Current Status
  --------------- -------------------------- ----------------
  검색            Discovery                  Wireframe
  알림            NOTIFICATION / DISCOVERY   Placeholder
  설정            SYSTEM                     Placeholder
  플레이어 정보   PLAYER / MY WORLD          Placeholder
  시즌            SEASON                     Placeholder

------------------------------------------------------------------------

## 6. Navigation Behavior

### 홈

WORLD Context로 이동한다.

### 지도보기

WORLD Context를 표시한다.

현재 구현된 WORLD 화면으로 연결한다.

### 지역탐색

REGION 탐색 Context로 연결한다.

현재 IA-01에서 구현된 WORLD → REGION 흐름과 연결한다.

### 내 자산

현재 기능이 없으므로 Placeholder 상태.

향후: MY WORLD → Portfolio / My Properties / My Market / My Performance

### 다른 참가자

현재 기능이 없으므로 Placeholder 상태.

향후: PEOPLE → Participants / Participant Activity / Market Behavior /
Participant Profile

### 시즌랭킹

현재 기능이 없으므로 Placeholder 상태.

향후: SEASON → Season Status / Season Market / Season Ranking / Season
Result

### 가이드

현재 기능이 없으므로 Placeholder 상태.

향후: SYSTEM / GUIDE → Guide / Notification Settings / Account

------------------------------------------------------------------------

## 7. First Screen

첫 화면은 WORLD를 기본 Context로 한다.

### Desktop

``` text
┌─────────────────────────────────────────────────────────────┐
│ PLAY │ 홈 │ 지도보기 │ 지역탐색 │ 내 자산 │ ... │ 검색 ... │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│                               │                             │
│          WORLD / MAP          │   COMMAND PANEL             │
│                               │                             │
│                               │   현재 WORLD 정보           │
│                               │   탐색 / 선택 / 행동        │
│                               │                             │
└───────────────────────────────┴─────────────────────────────┘
```

### Mobile

``` text
┌──────────────────────────┐
│ PLAY       검색  알림  ☰ │
├──────────────────────────┤
│                          │
│        WORLD / MAP       │
│                          │
├──────────────────────────┤
│     COMMAND PANEL        │
│                          │
│  현재 Context             │
│  정보                     │
│  선택                     │
│  행동                     │
└──────────────────────────┘
```

------------------------------------------------------------------------

## 8. IA 연결

현재까지 확정된 IA 구조:

``` text
WORLD
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
 ↓
LISTING DETAIL
 ↓
DECISION / ACTION
 ↓
RESULT
 ↓
MY WORLD
```

이번 단계에서는 Global Shell이 이 IA의 상위 navigation 역할을 한다.

특히:

``` text
홈       → WORLD
지도보기 → WORLD
지역탐색 → REGION
```

은 실제 연결한다.

다음 기능들은 구조만 준비한다.

``` text
내 자산       → MY WORLD
다른 참가자   → PEOPLE
시즌랭킹      → SEASON
가이드        → SYSTEM / GUIDE
```

------------------------------------------------------------------------

## 9. 기존 구현 보호

다음 영역은 변경하지 않는다.

-   Economic Engine
-   Economic Batch Processing
-   Season Clock
-   Property Market Engine
-   Primary / Secondary Transaction Logic
-   Security Rules
-   Research Logging Infrastructure
-   Research Event DLQ / Reprocessing
-   Property Master
-   Existing RealRankers `app_main_lang.js`
-   Existing RealRankers CSS
-   기존 PLAY IA-01 / IA-02 기능 로직

Global Shell 구현 때문에 위 영역을 수정해야 한다면 임의로 수정하지 말고
STOP 후 충돌을 보고한다.

------------------------------------------------------------------------

## 10. Independent Service Boundary

PLAY는 독립 서비스 구조를 유지한다.

``` text
/play/
├── index.html
├── css/
│   └── play.css
├── js/
│   └── play_app.js
├── data/
└── functions/
```

기존 RealRankers의 전역 CSS/JS에 의존하지 않는다.

------------------------------------------------------------------------

## 11. Responsive Requirements

### Desktop

-   Header 전체 폭
-   Brand / Primary Navigation / Utility Navigation 분리
-   Main: Map + Command Panel
-   기존 60:40 구조 유지

### Mobile

-   Header를 모바일에 맞게 축소
-   Primary Navigation은 compact navigation으로 전환 가능
-   Utility 기능은 icon/menu 형태
-   Main: Map 상단 / Command Panel 하단
-   기존 IA-01 / IA-02의 모바일 동작 유지

------------------------------------------------------------------------

## 12. Functional Requirements

다음 항목을 실제 동작하도록 구현한다.

-   [ ] Global Header 표시
-   [ ] 현재 활성 Navigation 표시
-   [ ] 홈 클릭
-   [ ] 지도보기 클릭
-   [ ] 지역탐색 클릭
-   [ ] Placeholder 메뉴 클릭 시 명확한 준비중 상태
-   [ ] 검색 UI 표시
-   [ ] 알림 UI 표시
-   [ ] 설정 UI 표시
-   [ ] 플레이어 정보 UI 표시
-   [ ] 시즌 UI 표시
-   [ ] WORLD 화면 연결
-   [ ] IA-01 regression
-   [ ] IA-02 regression
-   [ ] Desktop responsive
-   [ ] Mobile responsive

------------------------------------------------------------------------

## 13. Data Requirements

이번 단계에서 핵심 경제 데이터나 부동산 데이터를 새로 생성하지 않는다.

UI Wireframe에 필요한 최소한의 상태 표시만 사용한다.

실제 Property Master 데이터가 필요한 기존 IA-01 / IA-02 영역은 기존 검증
데이터를 그대로 사용한다.

Business Data Mocking은 금지한다.

------------------------------------------------------------------------

## 14. Research Logging

이번 단계는 Global Navigation과 화면 구조 구현 단계다.

Research Logging Infrastructure 자체를 수정하지 않는다.

향후 실제 정보 노출 및 사용자 행동 단계에서 다음 구조와 연결할 수 있도록
Hook 위치를 보존한다.

``` text
EXPOSURE
 ↓
DECISION
 ↓
ACTION
 ↓
VALIDATION
 ↓
TRANSACTION
 ↓
OUTCOME
```

------------------------------------------------------------------------

## 15. Definition of Done

### Structure

-   Global Shell 구현
-   Desktop Header 구현
-   Mobile Header 구현
-   WORLD First Screen 연결

### Navigation

-   Primary Navigation 7개
-   Utility Navigation 5개
-   활성 상태
-   Placeholder 상태

### Regression

-   WORLD → REGION → COMPLEX 정상
-   COMPLEX → LISTING → LISTING DETAIL 정상
-   Back navigation 정상

### Protection

-   Economic Engine 변경 없음
-   Transaction Engine 변경 없음
-   Research Logging 변경 없음
-   Security Rules 변경 없음
-   RealRankers 기존 코드 변경 없음

### Visual

-   흑백/회색 Wireframe
-   최종 Visual Design 미구현

------------------------------------------------------------------------

## 16. 다음 단계

이번 단계 완료 후 즉시 Visual Polish로 가지 않는다.

다음 기능 단계는:

``` text
IA-03
LISTING
 ↓
DECISION
 ↓
ACTION
```

이다.

그 이후:

``` text
IA-04
ACTION
 ↓
RESULT
 ↓
MY WORLD
```

그리고:

``` text
IA-05
PEOPLE
SEASON
NOTIFICATION / DISCOVERY
```

기능을 모두 연결한 후 최종 Visual Refinement 단계로 이동한다.

------------------------------------------------------------------------

## 17. STOP Rule

다음 상황에서는 임의 판단으로 진행하지 않는다.

1.  기존 Engine 변경이 필요할 경우
2.  기존 IA-01 / IA-02 로직 변경이 필요할 경우
3.  Property Master 구조 변경이 필요할 경우
4.  Research Logging 구조 변경이 필요할 경우
5.  Global Navigation과 IA가 충돌할 경우
6.  Desktop/Mobile 구조가 IA 원칙과 충돌할 경우

위 상황에서는:

``` text
STOP
→ Conflict Report
→ 영향 범위
→ 제안안
→ Product Owner 승인 대기
```

순서를 따른다.
