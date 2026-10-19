# AG EXECUTION PROMPT — PLAY TOP-LEVEL MAIN SCREENS v1.1

## 0. Mission

PLAY의 Global Shell은 이미 구현되었다.

이제 최상단 메뉴 6개에 대응하는 Main Screen을 IA 기반으로 하나씩 구현한다.

대상:

1. 지도보기
2. 지역탐색
3. 내 자산
4. 다른 참가자
5. 시즌랭킹
6. 가이드

`홈`은 현재 WORLD First Screen이므로 이번 작업의 신규 Main Screen 대상에서 제외한다.

---

## 1. Mandatory Reading

작업 시작 전에 반드시 읽는다.

1. `PLAY_TOP_LEVEL_MAIN_SCREENS_IMPLEMENTATION_SPEC_v1.0.md`
2. `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
3. `PLAY_GLOBAL_SHELL_FIRST_SCREEN_WIREFRAME_IMPLEMENTATION_SPEC_v1.0.md`
4. `PLAY-INDEPENDENT-SERVICE_IMPLEMENTATION_REPORT.md`
5. 최신 IA-01 implementation report
6. 최신 IA-02 implementation report

문서 간 충돌이 있을 경우 임의로 판단하지 말고 STOP 후 보고한다.

---

## 2. Core Development Rule

현재 PLAY는:

```text
FUNCTION
→ INTERACTION
→ STATE
→ DATA
→ E2E
→ VISUAL POLISH
```

순서로 개발한다.

따라서 이번 단계에서는:

### 반드시

- 흑백/회색 Wireframe
- IA 기반 Layout
- 메뉴 진입
- Context 전환
- Navigation
- Desktop/Mobile
- 기존 기능 Regression

### 하지 말 것

- 최종 색상
- 최종 그래픽
- 고급 지도 디자인
- 3D 효과
- animation
- pixel-perfect visual reproduction
- 임의의 business data
- 경제 Engine 변경
- transaction Engine 변경

---


## 2.5 Verification Policy — IMPORTANT

**Do not use browser-based manual QA unless the Product Owner explicitly asks for it.**

The Product Owner will inspect the actual UI.

Do NOT:

- open the browser for routine verification
- manually click through menus
- inspect screenshots
- compare screenshots
- perform visual QA
- spend tokens navigating the UI

Instead, verify implementation through code.

Required verification:

```text
Static
→ Syntax
→ DOM Contract
→ State / Navigation
→ Data Contract
→ IA Regression
→ Protected-area Diff
```

If browser verification appears necessary, STOP and report why. Do not launch it automatically.


# 3. Global Shell

모든 화면은 현재 구현된 Global Shell을 그대로 사용한다.

```text
PLAY
홈
지도보기
지역탐색
내 자산
다른 참가자
시즌랭킹
가이드

검색
알림
설정
플레이어 정보
시즌
```

현재 선택된 메뉴는 Active 상태로 표시한다.

---

# 4. Screen 01 — 지도보기

IA:

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
```

Main UI:

- 지도
- 지도 레이어
- 지역 필터
- 가격 변화
- 거래량
- 전세가
- 개발호재
- 학교
- 생활환경
- 검색
- 선택 지역 Command Panel

Interaction:

```text
지역 선택
→ REGION
→ 단지 선택
→ COMPLEX
→ 매물 보기
→ LISTING
```

기존 IA-01/IA-02의 실제 기능을 최대한 재사용한다.

---

# 5. Screen 02 — 지역탐색

IA:

```text
REGION
→ COMPLEX
→ LISTING
```

Main UI:

- 지역 검색
- 지역 그룹
- 지역 목록
- 지역 핵심 지표
- 가격 변화
- 거래량
- 평균 매매가
- 전세가율
- 주요 단지 목록

Interaction:

```text
지역 선택
→ 지역 상세
→ 단지 선택
→ COMPLEX
→ 매물
→ LISTING
```

실제 Property Master 데이터가 필요한 부분은 기존 검증 데이터를 사용한다.

---

# 6. Screen 03 — 내 자산

IA:

```text
MY WORLD
├─ Portfolio
├─ My Properties
├─ My Market
└─ My Performance
```

Main UI:

- 총자산
- 순자산
- 현금
- 부동산
- 부채
- 수익률
- 자산 변화
- 보유 부동산
- 거래 내역
- 관심 목록
- 매물 관리

현재 실제 Player Asset 데이터가 연결되어 있지 않은 항목은 명확한 empty/placeholder 상태로 구현한다.

임의의 자산/수익률을 실제 사용자 데이터처럼 만들지 않는다.

Interaction:

```text
보유 부동산
→ PROPERTY
→ 시장 확인
→ 향후 SELL
```

이번 단계에서는 SELL transaction 구현까지 확장하지 않는다.

---

# 7. Screen 04 — 다른 참가자

IA:

```text
PEOPLE
├─ Participants
├─ Participant Activity
├─ Market Behavior
└─ Participant Profile
```

Main UI:

- 참가자 목록
- 최근 활동
- 자산 변화
- 수익률
- 보유 부동산
- 거래 활동
- 행동 패턴

중요:

현재 데이터가 없는 경우 실제 참가자가 있는 것처럼 임의 생성하지 않는다.

Empty State를 사용한다.

또한 참가자의 "의도"나 "이유"를 데이터 없이 추정하지 않는다.

관찰 가능한 행동만 표시한다.

Interaction:

```text
참가자 선택
→ 참가자 상세
→ 행동 이력
→ 시장 행동
```

---

# 8. Screen 05 — 시즌랭킹

IA:

```text
SEASON
├─ Season Status
├─ Season Market
├─ Season Ranking
└─ Season Result
```

Main UI:

- 시즌 상태
- 자산 랭킹
- 수익률 랭킹
- 거래량 랭킹
- 지역별 랭킹
- 나의 순위
- 시즌 진행률

중요:

현재 정의되지 않은 종합 점수/평가점수를 임의로 만들지 않는다.

실제 존재하는 지표만 표시한다.

데이터가 없으면 empty state.

Interaction:

```text
랭킹 기준 선택
→ 참가자 비교
→ 나의 위치 확인
```

---

# 9. Screen 06 — 가이드

IA:

```text
SYSTEM / GUIDE
```

Guide sections:

1. PLAY란?
2. 경제 세계
3. 30년 / 360개월
4. 시작 자산
5. 수입과 생활비
6. 부동산 시장
7. 대출과 부채
8. 매수
9. 매도
10. 행동과 결과
11. 다른 참가자
12. 시즌
13. Economic Freedom
14. 데이터 활용 안내

가이드는 투자 조언이나 특정 지역/자산 추천이 되어서는 안 된다.

Interaction:

```text
Guide Topic
→ 설명
→ 관련 PLAY 화면으로 이동
```

---

# 10. Mobile

각 화면을 반드시 Mobile에서도 사용할 수 있게 만든다.

기본:

```text
Header
↓
Main Context
↓
Contextual Panel
```

Desktop Sidebar는 모바일에서 compact tab/dropdown/drawer 중 현재 코드 구조에 가장 안전한 방식을 사용한다.

IA 구조는 변경하지 않는다.

---

# 11. Data Rule

### Allowed

- UI placeholder
- empty state
- skeleton
- chart placeholder
- "데이터 없음"
- "준비 중"

### Forbidden

- 가짜 아파트 가격
- 가짜 거래
- 가짜 참가자
- 가짜 수익률
- 가짜 경제지표
- 가짜 ranking result

실제 데이터가 존재할 때만 연결한다.

---

# 12. Protected Areas

절대 변경하지 않는다.

- Economic Engine
- Batch Processing
- Season Clock
- Property Market Engine
- Primary Transaction
- Secondary Transaction
- Security Rules
- Research Logging
- Research Event DLQ
- Property Master schema
- RealRankers `app_main_lang.js`
- RealRankers CSS

화면 구현 때문에 변경이 필요하면:

**STOP → CONFLICT REPORT → 승인 대기**

---

# 13. Implementation Order

6개 화면을 동시에 구현하지 않는다.

반드시 다음 순서:

```text
01 지도보기
→ STOP / REPORT

02 지역탐색
→ STOP / REPORT

03 내 자산
→ STOP / REPORT

04 다른 참가자
→ STOP / REPORT

05 시즌랭킹
→ STOP / REPORT

06 가이드
→ STOP / REPORT
```

각 단계마다 IA와 Regression을 확인한다.

---

# 14. Screen Acceptance Tests

## 지도보기

- Map View 진입
- Active menu
- Layer UI
- Region selection
- Region → Complex
- Complex → Listing
- Desktop
- Mobile

## 지역탐색

- Region Explore 진입
- Region list
- Region detail
- Complex list
- Complex selection
- Listing navigation
- Desktop
- Mobile

## 내 자산

- My World 진입
- Asset summary
- Cash / Property / Debt sections
- Empty state when data unavailable
- Desktop
- Mobile

## 다른 참가자

- People 진입
- Participant list/empty state
- Activity section
- Participant selection structure
- Desktop
- Mobile

## 시즌랭킹

- Season Ranking 진입
- Ranking categories
- Season status
- My rank section/empty state
- Desktop
- Mobile

## 가이드

- Guide 진입
- Guide category list
- Guide detail
- Navigation to related screen
- Desktop
- Mobile

---

# 15. Regression

각 화면 구현 후 반드시:

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
```

기존 흐름이 깨지지 않았는지 확인한다.

또한 Global Shell:

```text
홈
지도보기
지역탐색
내 자산
다른 참가자
시즌랭킹
가이드
```

Navigation이 정상 동작하는지 확인한다.

---

# 16. Final Report Format

각 화면 완료 후 다음을 보고한다.

### 1. Implemented

실제 구현 내용.

### 2. IA Mapping

어떤 IA Node와 연결했는지.

### 3. Interaction

사용자가 무엇을 클릭하고 어디로 이동하는지.

### 4. Data

실제 데이터 / Empty / Placeholder를 구분.

### 5. Static / Syntax

결과.

### 6. DOM / UI Contract

결과.

### 7. State / Navigation

결과.

### 8. Data Contract

결과.

### 9. IA Regression

IA-01/IA-02 결과.

### 10. Protected Areas

Diff 결과.

### 11. Browser QA

`NOT RUN — Product Owner performs visual verification.`

AG가 브라우저를 사용하지 않았다면 명확히 그렇게 보고한다.

### 9. Remaining

다음 단계.

### 10. STOP

각 화면 완료 후 반드시 STOP.

---

# 17. Final Boundary

이번 6개 Main Screen 구현에서 다음 기능은 구현하지 않는다.

- 실제 BUY
- 실제 SELL
- HOLD transaction
- Participant behavioral inference
- Season scoring algorithm
- Notification engine
- final Visual Design
- animation
- advanced chart engine

이번 단계의 목표는:

> **PLAY의 최상단 메뉴를 클릭했을 때 사용자가 각각 "어떤 세계/기능으로 이동했는지"를 명확하게 이해하고 탐색할 수 있는 기능적 Main Screen을 완성하는 것**

이다.
