# AG EXECUTION PROMPT — PLAY-HUMAN-UX-01

이번 작업은 PLAY Human UX 설계의 첫 단계다.

## 반드시 읽을 문서
1. PLAY-HUMAN-UX-01_EXPERIENCE_DEFINITION_AND_DISCOVERY.md
2. PLAY_00_EXISTING_REALRANKUS_ANALYSIS.md
3. PLAY_01_ARCHITECTURE.md
4. PLAY-07.4_VERIFIED_AREA_LOCK_PROTOCOL.md
5. PLAY-07.5_RESEARCH_LOGGING_IMPLEMENTATION_REPORT.md
6. PLAY-07.5.1_RESEARCH_EVENT_FAILURE_DURABILITY_VERIFICATION_REPORT.md
7. PLAY-RESEARCH-DATA-DICTIONARY.md

## 핵심
이번 작업은 **READ-ONLY DISCOVERY**다.
UI/UX를 만들지 말고, 현재 Frontend를 실제 코드 기준으로 조사하라.

## 조사
1. Frontend architecture
2. index.html / JS / CSS / Bootstrap / jQuery 구조
3. Navigation 및 실제 Screen Inventory
4. 재사용 가능한 Header/Nav/Card/Table/Chart/Map/Property/Search/Filter/Modal/Notification 등
5. Firebase Auth/Firestore/API/Hosting 연결
6. 기존 Property/Map/Chart UI
7. PLAY가 재사용할 수 있는 요소
8. PLAY가 새로 만들어야 할 기술적 영역
9. routing/state/responsive 등 기술적 제약
10. Research Exposure를 향후 연결할 integration point

## 절대 금지
- UI 코드 수정
- CSS 수정
- 새로운 화면 구현
- Navigation 변경
- React/Vue 전환
- API/Firebase 구조 변경
- Economic Engine/Research Logging 변경
- UX 방향 결정
- Core Gameplay Loop 결정
- Product Owner 대신 제품 판단

## 중요한 구분
FACT = 실제 코드에서 확인
INFERENCE = 구조에 대한 추론
RECOMMENDATION = 기술적 제안
PRODUCT DECISION = 사용자가 결정해야 할 사항

## 산출물
`PLAY-HUMAN-UX-01_EXISTING_FRONTEND_DISCOVERY.md`

구성:
1. Current Frontend Architecture
2. Existing Navigation
3. Existing Screen Inventory
4. Existing UI Components
5. Existing Data/API/Firebase Connections
6. Map/Chart/Property UI
7. PLAY Reuse Candidates
8. PLAY New Build Requirements
9. Technical Constraints
10. Research Exposure Integration Points
11. Product Owner Decision Items
12. Recommended Starting Technical Point

## 종료
Discovery가 끝나면 즉시 STOP한다.
다음 단계인 Experience Thesis, First 30 Seconds, Core Gameplay Loop, Wireframe, Visual Prototype을 임의로 진행하지 않는다.

최종 상태:
READY FOR PRODUCT UX DEFINITION
또는
BLOCKED

이번 단계의 질문은 "UX를 어떻게 만들까?"가 아니라
"UX를 만들기 위해 현재 무엇을 알고 있고 무엇을 Product Owner가 결정해야 하는가?"다.
