# PLAY-HUMAN-UX-01 EXISTING FRONTEND DISCOVERY

## 1. Current Frontend Architecture (FACT)
- **Framework/Library**: Pure Vanilla JS, jQuery (v3.6.0), jQuery UI (v1.14.1). No Modern Component Framework (React, Vue, Angular) is used.
- **Styling**: Bootstrap 5.1.3 CSS, Font Awesome 6, custom CSS (`style.css`, `style_common.css`).
- **Structure**: Multi-Page Application (MPA) 구조를 가지나 메인 기능은 `index.html` 하나의 파일에 집중되어 있으며, JS를 통한 DOM 조작(Single Page Application 스타일)으로 화면을 렌더링함.
- **Main Logic**: `app_main_lang.js` 파일이 5,000줄 이상의 방대한 코드베이스를 가지며 글로벌 상태 변수(예: `selectedRegion`, `thisMonth`)를 다수 포함.

## 2. Existing Navigation (FACT)
- **Top Bar**: Search(검색), Rearrange(정렬), Title/Logo, Sido/Gungu(지역) `<select>` 박스로 구성.
- **Offcanvas Menu**: 우측 햄버거 버튼(또는 옵션 버튼) 클릭 시 나타나는 Offcanvas(`offcanvasRight`)를 통해 주요 메뉴 이동 지원.
- **Modals**: 화면 이동 대신 대부분의 정보(단지 상세, 비교, 그래프, 로그인)가 화면 위에 Modal로 표시됨.

## 3. Existing Screen Inventory (FACT)
- `index.html`: 메인 아파트 랭킹 리스트 및 지도.
- `board.html`: 공지사항 및 커뮤니티 게시판.
- `admin.html` / `admin_db_up.html`: 관리자용 화면.
- `radarMap.html`: 방사형(Radar) 지도 모드.
- `apple.html`, `partnerRequest.html`, `privacy.html`: 기타 정적 페이지.

## 4. Existing UI Components (FACT)
- **Modals**: `baseModal`(단지 상세), `compareModal`(비교), `graphModal`(차트), `loginModal`(로그인) 등 재사용 가능한 Bootstrap 모달 존재.
- **Filters**: Grade 표시 필터(`check_grade_S`, `check_grade_A` 등) 및 지역 선택 상자.
- **Double Slider**: `om-javascript-range-slider` / `doubleSlider.js` 등을 활용한 범위 검색 컴포넌트.
- **List/Map Toggle**: 모바일용 플로팅 버튼(`mobile_map_list`).

## 5. Existing Data/API/Firebase Connections (FACT)
- **Firebase SDK**: Firebase v10.7.2 (Compat mode) 사용. (Auth, Firestore, Database, Analytics)
- **Initialization**: `con_counter_js.js`, `countup.js` 등 여러 파일에서 `firebase.initializeApp()`이 호출됨. 
- **Map API**: Naver Maps API (`oapi.map.naver.com`).
- **Data Load**: `app_main_lang.js` 등에서 정적 JSON 파일 및 Firestore 문서를 직접 Fetch. IndexedDB를 이용한 로컬 캐싱 적용됨.

## 6. Map/Chart/Property UI (FACT)
- **Map**: Naver Map 캔버스와 SVG Region 오버레이를 조합.
- **Chart**: Chart.js (v3) 기반. (`draw_chart.js`, `gli_chart_renderer.js`)
- **Property Detail**: `baseModal` 안에 동적으로 HTML String을 조립(append)하여 렌더링. `photoswipe` 플러그인을 활용한 갤러리 뷰 지원.

## 7. PLAY Reuse Candidates (RECOMMENDATION)
- **UI Shell**: Bootstrap Grid 기반의 Offcanvas 메뉴 및 Top Bar 디자인 언어.
- **Auth Flow**: `loginModal` 및 Firebase Auth 연결 로직.
- **Property View**: 기존 `baseModal` (단지 상세 화면) 및 Chart.js 시각화 로직을 그대로 재활용 가능.
- **Maps**: Naver Map 연결 및 오버레이 마커 렌더링 엔진.

## 8. PLAY New Build Requirements (INFERENCE)
- **PLAY Dashboard**: Player 자산(Cash, Property Count), 현재 Period(Season Clock) 등 게임 상태를 보여주는 HUD(Head-Up Display).
- **Transaction Actions**: 단지 상세 화면 내 'BUY / SELL' 버튼 및 확인(Confirm) 다이얼로그 추가.
- **Activity Feed**: 타 참여자(AI 등)의 매수/매도 실시간 활동을 보여주는 로그나 알림 영역.
- **State Management**: 보유 자산 갱신 시 화면이 깜빡임 없이 즉각 업데이트 될 수 있는 Data Binding 계층.

## 9. Technical Constraints (INFERENCE)
- **Vanilla JS 한계**: React/Vue 같은 프레임워크가 없어, PLAY의 복잡한 상태(자산 변동, 시계열 변화, 보유 매물 등)를 기존 `app_main_lang.js`에 단순 추가 시 글로벌 변수 오염 및 스파게티 코드가 될 위험이 큼.
- **Legacy Compatibility**: 수많은 jQuery 플러그인과 `setTimeout`, 전역 변수가 혼재되어 있어 기능 확장 시 기존 RealRankus UI 렌더링 파이프라인과 충돌하지 않도록 엄격한 분리가 필요함.

## 10. Research Exposure Integration Points (RECOMMENDATION)
- **`R_EXPOSURE`**: 사용자가 `baseModal`을 열어 단지 정보를 볼 때 (View Property).
- **`R_DECISION`**: 사용자가 `compareModal`에서 단지 두 개를 비교할 때, 혹은 필터(가격/등급)를 조작할 때.
- **`R_ACTION`**: 매수(BUY) / 매도(SELL) 버튼 클릭 등 실제 자산 거래 시도 시점.

## 11. Product Owner Decision Items (PRODUCT DECISION)
- **PLAY Entry Point**: 기존 `index.html` 내부에 통합(Toggle 형태)할 것인가, 아니면 `play.html` 이라는 완전 독립된 엔트리를 만들 것인가?
- **First 30 Seconds**: PLAY 모드 진입 시 첫 튜토리얼이나 초기 자산 지급 시각 효과를 어떻게 할 것인가? 
- **Core Loop**: 사용자가 하루에 1번만 들어와도 되는 방치형 UX인가, 아니면 매 시각 차트를 보며 잦은 거래를 해야 하는 데이트레이딩 UX인가?
- **Technical Direction**: 빠른 개발을 위해 기존 JS 코드베이스에 얹어갈 것인가, 향후 유지보수를 위해 PLAY UI 영역만 독립된 모듈(혹은 가벼운 프레임워크 도입)로 구축할 것인가?

## 12. Recommended Starting Technical Point (RECOMMENDATION)
기존 `app_main_lang.js`의 복잡성을 피하고 안정성을 확보하기 위해, PLAY 전용 루트 HTML(`play.html` 혹은 `index_play.html`)과 전용 JS(`play_app.js`)를 생성하는 것을 강력히 권장합니다. CSS와 로그인 로직, 차트 라이브러리는 기존 것을 재활용하되, Transaction 상태 관리는 기존의 복잡한 DOM 조작 로직과 완전히 분리되어야 합니다.
