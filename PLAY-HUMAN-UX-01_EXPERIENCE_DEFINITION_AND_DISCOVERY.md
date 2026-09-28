# PLAY-HUMAN-UX-01 EXPERIENCE DEFINITION & DISCOVERY

## 0. 목적
PLAY의 Human Product/UX 설계를 시작하는 첫 단계다. 이번 단계는 UI 구현이 아니라 **사람이 PLAY에 처음 들어와 무엇을 경험하고 왜 다음 행동을 하게 되는지**를 정의하기 위한 준비 단계다.

Engine의 핵심 기준이 Integrity, Stability, Fail-safe였다면 UX의 핵심 기준은 Interest, Curiosity, Agency, Feedback, Continuity, Re-engagement다.

## 1. 현재 위치
완료/검증: Architecture, Economic Engine, Property Market, Reliability, Backend/Security, Batch/Clock/Reconciliation, GATE 4/5/6, 07.4, AI L10/L100, Research Schema, Research Logging, 07.5.1.
현재: **Human Product Experience 설계 시작 직전**.

## 2. 이번 단계에서 만들지 않는 것
- 전체 UI 구현
- 전체 Screen Map 확정
- 디자인 시스템 확정
- Frontend 재작성
- Human Season 구현
- 개발자가 임의로 UX 결정

## 3. UX의 기본 Loop 후보
```text
SEE → UNDERSTAND → WONDER → DECIDE → ACT → RESULT → REFLECT → "그러면 다음에는?" → RE-ENGAGE
```
이 구조는 후보이며 최종 확정하지 않는다.

## 4. Product Owner가 먼저 결정할 것
### A. 첫 10~30초의 경험
PLAY에 처음 들어온 사람이 무엇을 느껴야 하는가?

### B. 한 문장 경험
사용자가 PLAY를 다른 사람에게 설명한다면 어떤 문장인가?

### C. 재방문 이유
오늘 플레이한 뒤 내일 다시 열어야 할 이유는 무엇인가?

### D. 핵심 긴장감
현금/부동산/대출/매수/매도/기다림/집중/분산 등 무엇이 핵심 선택의 긴장감을 만드는가?

### E. Core Loop
사용자가 반복적으로 가장 많이 하는 행동은 무엇인가?
한 Period에 반드시 행동해야 하는가?
아무것도 하지 않아도 되는가?
핵심이 BUY인가, BUY/SELL인가, 자산관리인가, 경제적 의사결정인가?

이 항목은 AG가 결정하지 않는다.

## 5. Visual-First 원칙
향후 UX는:
Concept → Wireframe → Visual Prototype → Interaction Prototype → User Review → Revision → Approval → Implementation
순으로 진행한다.
초기에는 문서보다 실제 화면을 직접 보는 것을 우선한다.

## 6. Research Logging과 UX
이미 Research Logging이 구축되어 있다.
향후:
화면에 노출된 정보 → R_EXPOSURE
사용자의 판단 → R_DECISION
실제 인터랙션 → R_ACTION
Engine 결과 → R_VALIDATION
경제적 반영 → R_TRANSACTION/R_OUTCOME
으로 연결될 수 있어야 한다.
단, UX가 Research Logging에 맞춰 복잡해져서는 안 된다. 사용자 경험이 우선이다.

## 7. AG 역할
이번 단계의 AG 역할은 **Read-only Discovery**다.
현재 RealRankers/PLAY Frontend를 조사하여:
- Frontend architecture
- 기존 Navigation
- 실제 존재하는 Screen
- 재사용 가능한 UI component
- Firebase/API 연결
- Map/Chart/Property UI
- PLAY integration point
- 기술적 제약
을 확인한다.

AG는 첫인상, 핵심 감정, Core Gameplay Loop, 재방문 이유, Visual Style, 최종 IA를 결정하지 않는다.

## 8. AG 산출물
`PLAY-HUMAN-UX-01_EXISTING_FRONTEND_DISCOVERY.md`

포함:
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

각 내용은 FACT / INFERENCE / RECOMMENDATION / PRODUCT DECISION으로 구분한다.

## 9. 종료 조건
현재 Frontend 구조, 재사용 요소, 기술 제약, PLAY 연결지점, Product Owner 결정사항을 파악하면 종료한다.
UI 코드 수정 금지.
UX를 임의 확정하지 않는다.
완료 후 `READY FOR PRODUCT UX DEFINITION` 또는 `BLOCKED`만 판정한다.

## 10. 다음 단계
Discovery 후 Product Owner가 Experience Thesis / First 30 Seconds / Core Gameplay Loop / Re-engagement Trigger를 결정한다.
그 다음에야 Visual Prototype과 실제 동작 UI로 한 단계씩 진행한다.
