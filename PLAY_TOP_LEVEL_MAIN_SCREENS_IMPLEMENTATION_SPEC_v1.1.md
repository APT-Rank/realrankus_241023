# PLAY TOP-LEVEL MAIN SCREENS IMPLEMENTATION SPEC v1.1

## 1. 문서 상태

- Status: EXECUTION SPEC
- Version: v1.1
- Phase: Human Product / Functional Build
- Stage: Top-Level Navigation Main Screens
- Visual Mode: BLACK / WHITE / GRAYSCALE WIREFRAME
- Priority: IA / Function / Interaction > Visual Polish
- Product: PLAY Independent Service

본 문서는 PLAY의 최상단 메뉴를 선택했을 때 표시되는 각각의 Main Screen을 정의한다.

대상 메뉴:

1. 지도보기
2. 지역탐색
3. 내 자산
4. 다른 참가자
5. 시즌랭킹
6. 가이드

`홈`은 이미 Global Shell + WORLD First Screen의 기본 화면으로 구현되어 있으므로 이번 명세에서는 별도의 Main Screen 재설계를 하지 않는다.

---

# 2. 공통 Product 원칙

## 2.1 PLAY는 Dashboard가 아니다

각 화면은 정보를 단순히 보여주는 Dashboard가 아니라 사용자가 다음 행동으로 이동할 수 있는 "Command Center"여야 한다.

공통 구조:

```text
현재 Context
    ↓
핵심 정보
    ↓
탐색 / 비교 / 선택
    ↓
다음 행동
```

## 2.2 Wireframe First

현재 단계에서는 다음만 사용한다.

- 흰색
- 검정
- 회색
- 단순 border
- 단순 icon
- 기본 table/card
- 단순 chart placeholder

다음은 구현하지 않는다.

- 최종 브랜드 컬러
- 고급 그래픽
- 3D visual
- 복잡한 animation
- 최종 illustration
- pixel-perfect visual reproduction

---

# 3. 공통 Global Shell

모든 Main Screen은 기존 Global Shell을 유지한다.

```text
PLAY | 홈 | 지도보기 | 지역탐색 | 내 자산 | 다른 참가자 | 시즌랭킹 | 가이드
                                            검색 | 알림 | 설정 | 플레이어 | 시즌
```

Desktop:

```text
Header
────────────────────────────────────────
Main Content
```

Mobile:

```text
Mobile Header
────────────────
Main Content
```

각 화면은 현재 선택된 메뉴가 Active 상태로 표시되어야 한다.

---

# 4. Main Screen IA Mapping

| Top Menu | IA Node | Main Purpose |
|---|---|---|
| 지도보기 | WORLD / Region / Complex / Listing | 지도 중심 탐색 |
| 지역탐색 | REGION | 지역 비교 및 단지 탐색 |
| 내 자산 | MY WORLD | 나의 경제상태/보유자산 관리 |
| 다른 참가자 | PEOPLE | 참가자 행동 관찰 |
| 시즌랭킹 | SEASON | 시즌 내 성과/행동 비교 |
| 가이드 | SYSTEM / GUIDE | PLAY 시스템 이해 |

---

# 5. SCREEN 01 — 지도보기

## 목적

지도 자체를 PLAY의 핵심 탐색 인터페이스로 사용하는 화면.

단순 지도 표시가 아니라:

```text
MAP
→ Region
→ Complex
→ Listing
→ Decision
```

으로 내려갈 수 있어야 한다.

## Desktop

```text
┌──────────────────────────────┬─────────────────────┐
│                              │                     │
│                              │   선택한 지역        │
│          MAP                 │                     │
│                              │   주요 지표          │
│     ~65%                     │   가격 변화          │
│                              │   거래량              │
│                              │   최근 변화           │
│                              │                     │
│                              │   탐색 / 비교         │
└──────────────────────────────┴─────────────────────┘
```

## 핵심 UI

- 지도
- 지도 레이어
- 지역 선택
- 가격 변화
- 거래량
- 전세가
- 개발호재
- 학교
- 생활환경
- 필터
- 검색
- 선택 지역 Command Panel

## 행동

- 지역 선택
- 지도 확대/축소
- 레이어 변경
- 필터
- 지역 상세보기
- 단지 탐색
- 비교

## IA 연결

```text
지도보기
 ↓
WORLD
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
```

---

# 6. SCREEN 02 — 지역탐색

## 목적

지도보다 "지역" 자체를 비교하고 탐색하는 화면.

사용자가:

```text
지역 발견
→ 지역 비교
→ 지역 선택
→ 단지 탐색
```

할 수 있어야 한다.

## Desktop

```text
┌──────────────┬─────────────────────────────────────┐
│              │                                     │
│ 지역 목록     │             선택 지역               │
│              │                                     │
│ 서울          │ 지역 핵심 지표                      │
│ 경기          │                                     │
│ 인천          │ 가격 변화                           │
│ 광역시        │ 거래량                              │
│ 지방          │ 평균 매매가                         │
│              │ 전세가율                             │
│              │                                     │
│              │ 주요 단지 목록                       │
└──────────────┴─────────────────────────────────────┘
```

## 핵심 UI

- 지역 검색
- 지역 그룹
- 지역 목록
- 가격 변화
- 거래량
- 평균 매매가
- 전세가율
- 주요 단지
- 개발/경제/생활환경 정보

## 행동

- 지역 선택
- 지역 비교
- 단지 목록 보기
- 단지 선택
- 관심 등록

## IA 연결

```text
지역탐색
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
```

---

# 7. SCREEN 03 — 내 자산

## 목적

플레이어가 자신의 경제적 세계를 관리하는 Main Screen.

단순 자산 조회가 아니라:

```text
현재 상태
→ 자산
→ 부채
→ 현금흐름
→ 성과
→ 다음 의사결정
```

으로 연결한다.

## Desktop

```text
┌──────────────┬─────────────────────────────────────┐
│              │                                     │
│ 내 자산 메뉴  │          자산 요약                  │
│              │                                     │
│ 자산 요약     │ 총 자산 / 순자산 / 수익률           │
│ 보유 부동산   │                                     │
│ 거래 내역     │ 현금 / 부동산 / 부채                │
│ 관심 목록     │                                     │
│ 매물 관리     │ 자산 변화 추이                      │
│              │                                     │
│              │ 보유 부동산 목록                     │
└──────────────┴─────────────────────────────────────┘
```

## 핵심 UI

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

## 행동

- 보유 부동산 상세
- 매도
- 거래 내역 확인
- 관심 목록 확인
- 매물 관리
- 시장으로 이동

## IA 연결

```text
내 자산
 ↓
MY WORLD
 ├─ Portfolio
 ├─ My Properties
 ├─ My Market
 └─ My Performance
```

---

# 8. SCREEN 04 — 다른 참가자

## 목적

PLAY의 핵심 차별점인 "다른 경제 주체의 행동 관찰"을 제공한다.

순수 랭킹 화면이 아니라:

```text
누가
→ 무엇을
→ 어디서
→ 왜/어떤 맥락에서
→ 어떻게 행동했는가
```

를 탐색할 수 있는 구조를 만든다.

## Desktop

```text
┌──────────────┬─────────────────────────────────────┐
│              │                                     │
│ 참가자 메뉴   │ 참가자 목록                         │
│              │                                     │
│ 참가자 목록   │ 순자산 / 수익률 / 보유자산           │
│ 주요 활동     │                                     │
│ 투자 스타일  │ 최근 행동                            │
│              │                                     │
│              │ 참가자 선택                          │
│              │                                     │
│              │ 행동 이력 / 자산 변화                │
└──────────────┴─────────────────────────────────────┘
```

## 핵심 UI

- 참가자 목록
- 최근 활동
- 자산 변화
- 수익률
- 보유 부동산 수
- 거래 활동
- 행동 패턴
- 투자 스타일/Decision Profile은 향후 연구 데이터 기반으로 확장

## 행동

- 참가자 선택
- 참가자 행동 보기
- 거래 행동 보기
- 보유 자산 보기
- 시장 행동으로 이동

## 주의

"왜 샀는가"를 데이터가 없는 상태에서 임의로 추정하지 않는다.

현재 단계에서는 관찰 가능한 행동만 표시한다.

## IA 연결

```text
다른 참가자
 ↓
PEOPLE
 ├─ Participants
 ├─ Participant Activity
 ├─ Market Behavior
 └─ Participant Profile
```

---

# 9. SCREEN 05 — 시즌랭킹

## 목적

현재 Season에서 참가자들의 성과와 행동을 비교하는 화면.

단순 "돈 많이 번 사람" 순위로 만들지 않는다.

## Desktop

```text
┌──────────────────┬───────────────────────────────┐
│                  │                               │
│ 랭킹 메뉴         │       Season 01              │
│                  │                               │
│ 자산 랭킹         │ 참가자 랭킹                   │
│ 수익률 랭킹       │                               │
│ 거래량 랭킹       │ 순위 / 자산 / 수익률 / 거래   │
│ 지역별 랭킹       │                               │
│                  │ 나의 현재 순위                 │
│                  │                               │
│                  │ 주요 지표                      │
└──────────────────┴───────────────────────────────┘
```

## 핵심 UI

- Season 정보
- 자산 랭킹
- 수익률 랭킹
- 거래량 랭킹
- 지역별 랭킹
- 나의 순위
- 시즌 진행률
- 시즌 주요 지표

## 중요

현재 단계에서는 "종합 점수"를 임의로 만들지 않는다.

기존 PLAY의 다차원 평가 원칙을 유지하며, 실제 정의된 지표만 표시한다.

## IA 연결

```text
시즌랭킹
 ↓
SEASON
 ├─ Season Status
 ├─ Season Market
 ├─ Season Ranking
 └─ Season Result
```

---

# 10. SCREEN 06 — 가이드

## 목적

처음 참여하는 사용자가 PLAY의 경제 세계와 게임 규칙을 이해하도록 돕는다.

가이드는 긴 매뉴얼이 아니라 사용자가 필요할 때 빠르게 이해할 수 있는 Contextual Guide가 되어야 한다.

## Desktop

```text
┌──────────────────┬────────────────────────────────┐
│                  │                                │
│ 가이드 메뉴       │ PLAY GUIDE                     │
│                  │                                │
│ PLAY란?          │ 현재 선택된 가이드             │
│ 경제 시스템       │                                │
│ 자산/부채         │ 설명                           │
│ 거래              │                                │
│ 시즌              │ 예시                           │
│ 시간              │                                │
│ 행동과 결과       │ 다음 단계                      │
│ 연구/데이터        │                                │
└──────────────────┴────────────────────────────────┘
```

## Guide Sections

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
14. 개인정보 / 데이터 활용 안내

## 중요한 원칙

가이드는 사용자의 행동을 특정 방향으로 유도하는 투자 조언이 되어서는 안 된다.

"이 지역을 사세요"가 아니라:

> "이 시스템에서 어떤 변수와 결과를 관찰할 수 있는가"

를 설명한다.

## IA 연결

```text
가이드
 ↓
SYSTEM / GUIDE
```

---

# 11. 공통 Mobile 구조

모든 Main Screen은 Mobile에서도 동일한 IA를 유지한다.

```text
┌──────────────────────┐
│ PLAY   검색 알림 메뉴 │
├──────────────────────┤
│                      │
│    Main Context      │
│                      │
├──────────────────────┤
│ Contextual Panel     │
│                      │
│ 정보                 │
│ 비교                 │
│ 행동                 │
└──────────────────────┘
```

각 화면의 Desktop 좌측 Sidebar는 Mobile에서:

- 상단 tab
- dropdown
- compact navigation
- drawer

중 하나로 변환할 수 있다.

단, IA 구조 자체는 변경하지 않는다.

---

# 12. 공통 Interaction 원칙

모든 Main Screen은 다음을 만족해야 한다.

```text
SEE
 ↓
EXPLORE
 ↓
SELECT
 ↓
UNDERSTAND
 ↓
ACT
```

정보를 표시하고 끝내지 않는다.

예:

지도보기:

```text
지역 선택
→ 지역 상세
→ 단지 탐색
```

지역탐색:

```text
지역 선택
→ 지역 비교
→ 단지 선택
```

내 자산:

```text
자산 선택
→ 시장 확인
→ 매도/보유 판단
```

다른 참가자:

```text
참가자 선택
→ 행동 확인
→ 시장 행동 관찰
```

시즌랭킹:

```text
지표 선택
→ 참가자 비교
→ 나의 위치 확인
```

가이드:

```text
개념 선택
→ 이해
→ 실제 화면으로 이동
```

---

# 13. Data Integrity

현재 기능 구현 단계에서는 UI Dummy와 Business Data Dummy를 구분한다.

### 허용

- UI placeholder
- chart skeleton
- empty state
- "준비 중" 상태
- 데이터가 없을 때의 empty state

### 금지

- 임의 부동산 가격
- 임의 거래 결과
- 임의 참가자 행동
- 임의 수익률을 실제 데이터처럼 표시
- 존재하지 않는 거래
- 존재하지 않는 경제 지표

실제 Property Master와 Engine 데이터는 기존 검증된 구조를 그대로 사용한다.

---

# 14. Protected Areas

다음 영역은 변경하지 않는다.

- Economic Engine
- Economic Batch Processing
- Season Clock
- Property Market Engine
- Primary / Secondary Transaction Logic
- Security Rules
- Research Logging
- Research Event DLQ
- Property Master
- 기존 RealRankers `app_main_lang.js`
- 기존 RealRankers CSS

화면 구현 때문에 변경이 필요하다면 STOP한다.

---


# 12. Verification Policy — Code First

이번 단계부터 AG의 기본 검증은 **Browser QA가 아니라 Code/Functional Verification**으로 한다.

Product Owner가 실제 화면을 직접 확인하므로, 구현 과정에서 브라우저를 열고 수동으로 클릭하거나 스크린샷을 비교하는 작업은 기본 범위에서 제외한다.

## 12.1 Browser Verification 기본 금지

명시적인 요청이 없는 한 다음을 수행하지 않는다.

- 브라우저 실행
- 화면 수동 탐색
- 메뉴를 하나씩 클릭하는 수동 QA
- 스크린샷 생성 및 비교
- Visual QA
- Pixel-level 비교
- 브라우저 기반 반복 검증

브라우저를 사용해야 할 특별한 이유가 발견되면 임의로 진행하지 말고 STOP 후 보고한다.

## 12.2 기본 검증 순서

```text
Implementation
    ↓
1. Static Validation
    ↓
2. Syntax / Module Validation
    ↓
3. DOM / UI Contract Validation
    ↓
4. State / Navigation Validation
    ↓
5. Data Contract Validation
    ↓
6. IA Regression
    ↓
7. Protected-area Diff Check
    ↓
PASS
```

## 12.3 Static Validation

확인 대상:

- 파일 존재
- import / script path
- CSS path
- JS syntax
- HTML 구조
- 중복 ID
- 누락된 selector
- 잘못된 참조

## 12.4 Functional / State Validation

브라우저 수동 클릭 대신 코드 수준에서 상태 전이를 검증한다.

예:

```text
홈 → WORLD
지도보기 → WORLD
지역탐색 → REGION
내 자산 → MY_WORLD
다른 참가자 → PEOPLE
시즌랭킹 → SEASON
가이드 → GUIDE
```

필요한 경우 navigation/state 함수를 직접 호출하거나 최소 테스트 harness를 사용한다.

## 12.5 DOM / UI Contract Validation

각 Main Screen에 필요한 핵심 DOM 구조가 존재하는지 확인한다.

예:

```text
지도보기
- map container
- layer control
- region selection
- command panel
- active navigation state

지역탐색
- region search
- region list
- selected region area
- complex list

내 자산
- asset summary
- cash
- property
- debt
- performance

다른 참가자
- participant list or empty state
- activity section

시즌랭킹
- ranking categories
- season status
- ranking area

가이드
- guide category list
- guide detail area
```

## 12.6 Data Contract Validation

실제 데이터가 연결된 영역은 데이터 구조를 코드 수준에서 확인한다.

예:

```text
required field exists
type correct
null handling
empty-state handling
no fabricated business data
```

데이터가 없는 화면은 Empty State가 정상 동작하는지 확인한다.

## 12.7 IA Regression

기존 구현을 반드시 코드 수준에서 regression한다.

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
```

Back navigation도 검증한다.

## 12.8 Protected-area Diff Check

다음 파일/영역이 변경되지 않았는지 확인한다.

- Economic Engine
- Batch Processing
- Season Clock
- Property Market Engine
- Primary / Secondary Transaction
- Security Rules
- Research Logging
- Research Event DLQ
- Property Master schema
- RealRankers app_main_lang.js
- RealRankers CSS

예상하지 않은 변경이 발견되면 PASS 처리하지 말고 STOP한다.

## 12.9 Product Owner Visual Verification

Visual verification은 Product Owner가 직접 수행한다.

AG는 다음을 주장하지 않는다.

- "화면이 예쁘다"
- "디자인이 정확하다"
- "스크린샷과 일치한다"
- "브라우저에서 완벽히 동작한다"

대신 다음을 보고한다.

- 코드 구조
- 상태 전이
- DOM contract
- 데이터 contract
- regression
- protected-area diff


# 15. Implementation Strategy

6개 Main Screen을 한꺼번에 완성하려 하지 않는다.

권장 순서:

```text
STEP 01
지도보기
 ↓
Review

STEP 02
지역탐색
 ↓
Review

STEP 03
내 자산
 ↓
Review

STEP 04
다른 참가자
 ↓
Review

STEP 05
시즌랭킹
 ↓
Review

STEP 06
가이드
 ↓
Review

STEP 07
전체 Navigation E2E
```

각 단계에서:

```text
구현
→ 기능 검증
→ IA 검증
→ Regression
→ Report
→ STOP
```

---

# 16. Definition of Done

각 Main Screen마다:

- Global Shell 유지
- Active Navigation 상태 구현
- Navigation / State transition 코드 검증 PASS
- 주요 IA Node DOM contract PASS
- 주요 하위 기능 placeholder/실제 기능 구분
- Desktop 구조가 코드상 유지됨
- Mobile 구조가 코드상 유지됨
- Back/Navigation 코드 검증 PASS
- 기존 IA-01/IA-02 regression PASS
- Protected Area diff PASS
- Business Data Mocking 없음
- 흑백 Wireframe 유지

### Browser QA

기본 Definition of Done에서 제외한다.

실제 화면의 시각적 확인과 최종 사용성 확인은 Product Owner가 직접 수행한다.

---

# 17. 최종 목표

이번 단계의 최종 결과는:

```text
PLAY
│
├─ 홈
│   └─ WORLD
│
├─ 지도보기
│   └─ WORLD / MAP
│
├─ 지역탐색
│   └─ REGION
│
├─ 내 자산
│   └─ MY WORLD
│
├─ 다른 참가자
│   └─ PEOPLE
│
├─ 시즌랭킹
│   └─ SEASON
│
└─ 가이드
    └─ SYSTEM / GUIDE
```

각 메뉴를 클릭했을 때 "어떤 세계로 이동했는가"가 명확하게 느껴지는 수준까지 먼저 구현한다.

최종 Visual Design은 모든 기능 구현 이후 별도 단계에서 수행한다.
